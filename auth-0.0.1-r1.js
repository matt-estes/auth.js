/***************************************************************************
    Copyright 2012 Matthew S. Estes

    This file is part of auth.js

    auth.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, under version 3 of the License.

    templates.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with auth.js.  If not, see <http://www.gnu.org/licenses/>.
***************************************************************************/

(function (window, undefined) {
/* Wrap up a method with it's context.
	from http://matt.might.net/articles/javascript-warts/ */
function eta(that, methodName) {
	var f = that[methodName];
	return function () { return f.apply(that,arguments); };
}

/* The identity function. */
function I(x) { return x; }

/* Convert the "name value" form data objects "[ { name, value }, ... ]" to a "simple" object "{ name: value, ... }" */
function cvtNVArrayToObj(arr, $) {
	var r = { };
	arr.map(function (nv) {
		if(nv.name in r) {
			if($.isArray(r[nv.name])) {
				r[nv.name].push(nv.value);
			} else {
				r[nv.name] = [ r[nv.name], nv.value ];
			}
		} else {
			r[nv.name] = nv.value;
		}
	});
	return r;
}

/* Transpose an object of arrays to an array of objects */
function transpose(o) {
	var keys = [ ];
	var ret = [ ];
	for(var n in o) { keys.push(n); }
	for(var i in o[keys[0]]) {
		var r = { };
		for(var k in keys) {
			r[keys[k]] = o[keys[k]][i];
		}
		ret.push(r);
	}
	return ret;
}

/* Replace all methods of iface with the version from obj */
function interfaceAdapter(iface, obj) {
	for(var m in iface) {
		if((m in obj) && (typeof obj[m] === 'function')) {
			iface[m] = eta(obj, m);
		}
	}
	return iface;
}

function delegateAdapter(delegate, obj) {
	for(var m in delegate) {
		if(!(m in obj)) {
			obj[m] = eta(delegate, m);
		}
	}
}

/* This is a function to generate a function to map an array of function objects in sequence.
	It checks to see if the browser is online, if it is, it executes the current step in the sequence, if not,
	it waits retryTimeout milliseconds. The function it calls MUST return a deferred object.
	Whatever "data" is returned by the "done" event will then be passed to the next function in the chain.
	This is probably a monad or could be rewritten more cleanly as one, but I haven't figured that out yet. */
function onlineRetrySequenceResolution(arr, retryTimeout, promise) {
	return {
			next: function () { 
					if(this.i < arr.length) {
						arr[this.i](this.data).done(eta(this, 'handleDone')).fail(eta(this,'handleFail'));
					} else {
						promise.resolve(this.data);
					}
				},
			handleDone: function (d) {
					this.i++;
					this.data = d;
					this.next();
				},
			handleFail: function() { if(retryTimeout != null) { window.setTimeout(eta(this, 'next'), retryTimeout); } },
			resolve: function(d) {
					this.i = 0;
					this.data = d;
					this.next();
				}
		};
}
function LiftToPromise(f) {
	return function (d) {
			var data = f(d);
			return {
					done: function (next) {
							next(data);
							return this;
						},
					fail: function (next) { return this; }
				};
		};
}

/*	Convert a JSON description of an API in to an object that makes $.ajax calls
	The format expected is { methodName: { method: m, uri: url, mime: type, result: expectedMimeReturn  }, method2: ... }
	mime and/or result may be omitted. The default assumed mime type is form encoding, and the default expected
	result is text. */
function createAPI(api, $) {
	var o = { };
	for(var i in api) {
		(function (i, v) {
			if((typeof v == 'object') && ('uri' in v)) {
				v.mime = ('mime' in v) ? v.mime : 'application/x-www-form-urlencoded';
				v.result = ('result' in v) ? v.result: 'text';
				o[i] = function (params) {
					return $.ajax({	type: v.method,
								url: v.uri,
								data: params,
								dataType: v.result,
								contentType: v.mime });
				};
			}
		})(i, api[i]);
	}
	return o;
}

function loadAPI(uri) {
	return $.ajax({	url: uri,
							type: 'GET',
							data: '', 
							contentType: 'application/json; charset=utf-8',
							dataType: 'json' })
}

/* Parse query string parameters into a hash object. */
function GetParams($) {
	return function() {
		var pairs = window.location.search.substring(1).split('&').map(function (e) { return e.split(';'); });
		var flatPairs = [];
		pairs.map(function (e) { e.map(function(e) { flatPairs.push(e); }); });
		flatPairs = flatPairs.map(function (e) {
												var e2 = e.split('=');
												if(e2.length > 1) { 
													return { name: e2[0], value: decodeURIComponent(e2[1].replace(/\+/g, " ")) }; 
												} else {
													return { name: e2[0], value: '' };
												}
											});
		return cvtNVArrayToObj(flatPairs, $);
	};
}
/* This is a utility function to handle the case where the user already has a div pre-loaded with templates, and needs
to "load" them by just collecting the class names. To use this, you would just say:
	var templateObj = makeTemplateObj({ loader: InlineTemplates, id: '#mycontainer', ... });
*/
var InlineTemplateLoader = function(id, templates) {
	$(id).children().each(function () { templates[$(this).attr('class')] = this; });
};

var makeTemplates = function(opts) {
	return (function(context) {
		return {
			makeFormHandler: function (handler) {
					return function (sel, el, data) {
						el.submit(function(e) { return handler(e, this, sel, el, data); });
					};
				},
			makeDialogHandler: function (dialogName) {
					var that = this;
					return function(sel, el, data) {
							el.toggle(function () {
												console.log('make dialog "' + dialogName + '"');
												that.templates[dialogName](sel, data);
												return false;
											},
										function () {
												sel.find('.' + dialogName).remove();
												return false;
											});
						};
				},
			makeListHandler: function (listItemTemplate, filter) {
					if(arguments.length < 2) { filter = I; }
					var that = this;
					return function(sel, el, data) { filter(data).map(function (d) { that.templates[listItemTemplate](el, d); }); };
				},
			ClickRemove: function(sel, el, data) {
					sel.click(function(e) { 
							sel.remove(); 
							return false; 
						});
				},
			Up:		function (sel, el, data) { el.click(function () { sel.prev().before(sel); }); },
			Down:	function (sel, el, data) { el.click(function () { sel.next().after(sel); }); },
			SetInputs: function (getParams, names) {
					if(arguments.length == 0) { getParams = I; }
					if(arguments.length < 2) {
						return function (sel, el, data) {
								var params = getParams(data);
								for(var n in params) {
									sel.find('[name=' + n + ']').val(params[n]);
								}
							};
					} else {
						return function (sel, el, data) {
							var params = getParams(data);
							names.map(function(n) {
									if(n in params) {
										sel.find('[name=' + n + ']').val(params[n]);
									}
								});
						};
					}
				},
			AddFormHandlers: function (obj, formHandlers, api) {
					for(var form in formHandlers) {
						(function(form) {
							obj[form] = function (e, that, sel, el, data) {
									var f = cvtNVArrayToObj($(e.target).serializeArray(), $);
									if('validate' in formHandlers[form]) {
										for(var v in formHandlers[form].validate) {
											if(!(formHandlers[form].validate[v])(sel, el, f, data)) { return false; }
										}
									}
									api[form](f)
										.done(formHandlers[form].done(f, sel, el, data))
										.fail(formHandlers[form].fail(f, sel, el, data));
									return false;
								};
						})(form);
					}
				},
			loadTemplates: function (uri) {
					context.child = this;
					return context.loaderPromise(uri);
				}
		};
	})((function() {
		return {
			/* Hash of templates: key is template name, value is jQuery wrapped DOM object. */
			templates: { },
			forms: { },

//			addHandlers: function (sel, el, handlers) {
			addHandlers: function (sel, handlers, data) {
					for(var s in handlers) {
						var el = sel.find(s);
						for(var  h in handlers[s]) {
							handlers[s][h](sel, el, data);
						}
					}
					return el;
				},
			MakeTemplates: function (templates, handlers) {
					this.child.templates = { };
					var o = this.child.templates;
					for(var t in templates) {
						(function (t,context) {
							if(t in handlers) {
								o[t] = function(sel, data) {
//										sel.append(context.addHandlers(sel, $(templates[t]).clone(), handlers[t]));
//										sel.append($(templates[t]).clone());
										var el = $(templates[t]).clone();
										context.addHandlers(el, handlers[t], data);
										sel.append(el);
									};
							} else {
								o[t] = function(sel) {
										sel.append($(templates[t]).clone());
									};
							}
						})(t, this);
					}
				},

			/* Attempt to load the template HTML and store it in a hidden div. 
				If this fails, wait a few minutes and try again. If it succeeds, resolve the API start up deferred object
				so requests will start going through. */
			loadTemplates: function(templateURI) {
					console.log('load templates ' + templateURI);
					return $.ajax({	url:  templateURI, 
											dataType: 'html' });
				},
			handleTemplates: function (data) {
					console.log('loading templates');
					var that = this;
					$(this.id).append(data);
					$(this.id + ' :first-child ').children('div').each(function () { that.templates[$(this).attr('class')] = this; });
					this.MakeTemplates(this.templates, this.handlers(this.child, this.templates, this.forms));
				},
			loaderPromise: function(uri) {
					var p = $.Deferred();
					onlineRetrySequenceResolution([	this.loadTemplates,
																	LiftToPromise(eta(this, 'handleTemplates'))], this.failRetry, p).resolve(uri);
					return p;
				},
			loaderUser: function (uri) {
					var ret = this.loader(this.id, this.templates);
					this.MakeTemplates(this.templates, this.handlers(this.child, this.templates, this.forms));
					return ret;
				},

			init: function(opts) {
					this.id = ('id' in opts) ? opts.id : '#templates'; 
					this.handlers = ('handlers' in opts) ? opts.handlers : function () { return { }; };
					this.failRetry = ('failRetry' in opts) ? opts.failRetry : 60000; // Default is 1 minute.
					this.loaderPromise = ('loader' in opts) ? ((this.loader = opts.loader), LiftToPromise(eta(this, 'loaderUser'))) : this.loaderPromise;
					return this;
				}
		};
	})().init(opts));
};
var makeAuthUI = function(opts) {
	function DisplayEvent(context, message, filter) {
		return function (f, sel, el, data) { 
				return function (d) {
						console.log(message);
						context.t.templates[message](sel); 
						context[message](filter(f));
					}; 
			};
	};
	function DisplayRemoveEvent(context, message, filter) {
		return function (f, sel, el, data) { 
				return function (d) {
						context.t.templates[message](sel); 
						sel.remove();
						context[message](filter(f));
					}; 
			};
	};
	function RemoveEvent(context, message, filter) {
		return function (f, sel, el, data) { 
				return function (d) {
						sel.remove();
						context[message](filter(f));
					}; 
			};
	};


	function PasswordsMatch(context, p1, p2) {
		if(arguments.length < 2) {
			p1 = 'password';
			p2 = 'password2';
		}
		return function(sel, el, f) {
			if(f[p1] != f[p2]) {
				context.t.templates.passwordsDoNotMatch(el.find('[name=' + p2 + ']').parent());
				return false;
			}
			return true;
		};
	}
	function UsernameFilter(f) { return f.username; };

	return (function(context) {
		return {
			/* Create a login form at the specified selector */
			loginForm: function (sel) {
					context.authAPI.done(function () {
							context.t.templates.loginForm(sel); 
						});
				},
			/* Create a logout form at the specified selector */
			logoutForm: function (sel) {
					context.authAPI.done(function () {
							context.t.templates.logoutForm(sel); 
						});
				},
			/*	An account panel is authentication state aware, and also synthesized from multiple templates.
				When the user is authenticated, the panel consists of:
					Logout button.
					Edit Account Settings button(which pops up a dialog)
				When logged out, the panel, consists of:
					Login form.
					Request Password Reset button(which pops up a dialog)
					Create Account button(which pops up a dialog)
			*/
			addAccountPanel: function (sel) {
					context.authAPI.done(function () {
							if(context.authenticated) {
								context.accountPanelAuthenticated(sel);
							} else {
								context.accountPanelLoggedOut(sel);
							}
						});
					context.accountPanels.push(sel);
				},
			requestPasswordResetForm: function (sel) {
					context.authAPI.done(function () {
							context.t.templates.resetPasswordDialog(sel);
						});
				},
			resetPasswordForm: function (sel) {
					context.authAPI.done(function () {
							console.log("resetPasswordForm");
							context.t.templates.finishPasswordResetDialog(sel);
						});
				},
			createAccountForm: function (sel) {
					context.authAPI.done(function () {
							context.t.templates.createAccountDialog(sel);
						});
				},
			accountSettingsForm: function (sel) {
					context.authAPI.done(function () {
							context.t.templates.accountSettingsDialog(sel);
						});
				},
			changePasswordForm: function (sel) {
					context.authAPI.done(function () {
							context.t.templates.changePasswordDialog(sel);
						});
				},
			emailValidateForm: function(sel) {
					context.authAPI.done(function () {
							context.t.templates.finishUsernameValidationDialog(sel);
						});
				},
			whoAmI: function() {
					return { authenticated: context.authenticated, username: context.username };
				}
		};
	})((function() {
		return {
			/* This is a stub event handler. When the AuthUI object is created, these methods will be replaced by
				corresponding methods from the user's event handler.
				Note: Because this replacement happens at initialization, the user should have added all methods to their
				object BEFORE creating the authUI object. If for some reason you do want that "capability", then you should
				have ALL event handlers in your object, and then communicate with your object to add/remove handlers. */
			events: {
					requestedPasswordReset: function (username) { },
					passwordResetRequestFailed: function (username) { },
					passwordReset: function (username) { },
					resetPasswordFailed: function (username) { },
					accountCreated: function (details) { },
					createAccountFailed: function (details) { },
					addedAccount: function (username) { },
					accountRemoved: function (username) { },
					accountRemoveFailed: function (username) { },
					passwordChanged: function (username) { },
					changePasswordFailed: function (username) { },
					requestedAccountValidation: function(username) { },
					requestedAccountValidationFailed: function(username) { },
					accountValidated: function (username) { },
					validationFailed: function (username) { },
					authenticated: function (username) { },
					loginFailed: function (username) { },
					loggedOut: function () { }
				},

			/* List of jQuery selectors representing account panels to update on authentication state chanages. */
			accountPanels: [],

			accountCreated: function (details) {
					this.events.accountCreated(details);
					this.authenticated({ username: details.username });
				},
			authenticated: function (authObj) { 
					if((this.currentUser.authenticated != true) || (this.currentUser.username != authObj.username)) {
						this.currentUser.authenticated = true;
						this.currentUser.username = authObj.username;
						this.accountPanels.map(eta(this, 'accountPanelAuthenticated'));
						this.events.authenticated(authObj.username);
					}
				},
			loggedOut: function () {
					console.log('logged out event');
					this.currentUser.authenticated = false;
					this.currentUser.username = '';
					this.accountPanels.map(eta(this, 'accountPanelLoggedOut'));
					this.events.loggedOut();
				},


			makeTemplateHandlers: function (tObj, templates, forms) {
					var context = this;
					var createAccountValidate = [ PasswordsMatch(this) ];
					if(this.createAccountUser != null) { createAccountValidate.push(this.createAccountUser); }
					var formHandlers = {
							createAccount: {	validate: createAccountValidate,
													done: RemoveEvent(this, 'accountCreated', I), 
													fail: DisplayEvent(this, 'createAccountFailed', I) },
							login: {	done: function (f, sel, el) { return function (d) { context.authenticated({ username: f.username }) }; }, 
										fail: DisplayEvent(this, 'loginFailed', UsernameFilter) },
							logout: {	done: function (f, sel, el) { return function (d) { context.loggedOut(); }; },
											fail: function (f, sel, el) { return function (d) { }; } },
							changePassword:	{	validate: [ PasswordsMatch(this, 'newPassword', 'newPassword2') ],
														done: DisplayRemoveEvent(this, 'passwordChanged', UsernameFilter), 
														// TODO: Display auth failure message if 403, generic fail otherwise.
														fail: DisplayEvent(this, 'changePasswordFailed', UsernameFilter) },
							requestPasswordReset: {	done: DisplayRemoveEvent(this, 'requestedPasswordReset', UsernameFilter),
																fail: DisplayEvent(this, 'passwordResetRequestFailed', UsernameFilter) },
							resetPassword: {	validate: [ PasswordsMatch(this) ],
													done: DisplayRemoveEvent(this, 'passwordReset', UsernameFilter),
													fail: DisplayEvent(this, 'resetPasswordFailed', UsernameFilter) },
							validateAccount:	{	done: DisplayRemoveEvent(this, 'accountValidated', UsernameFilter),
														fail: DisplayEvent(this, 'validationFailed', UsernameFilter) },
							addAccount: {	validate: [ PasswordsMatch(this) ],
													done: DisplayEvent(this, 'addedAccount', UsernameFilter),
													fail: DisplayEvent(this, 'addAccountFailed', UsernameFilter) },
							removeAccount: {	done: DisplayEvent(this, 'accountRemoved', UsernameFilter),
														fail: DisplayEvent(this, 'accountRemoveFailed', UsernameFilter) },
							sendAccountValidation: {	done: DisplayEvent(this, 'requestedAccountValidation', UsernameFilter),
																fail: DisplayEvent(this, 'requestedAccountValidationFailed', UsernameFilter) }
						};
					tObj.AddFormHandlers(forms, formHandlers, this.api);
					this.forms = forms;
					var templateHandlers = {
							createAccount: { '.openCreateAccountDialog': [ tObj.makeDialogHandler('createAccountDialog') ] },
							resetPassword: { '.openResetPasswordDialog': [ tObj.makeDialogHandler('resetPasswordDialog') ] },
							editAccount: { '.openEditAccountDialog': [ tObj.makeDialogHandler('accountSettingsDialog') ] },
							createAccountDialog: { '.createAccountForm': [ tObj.makeFormHandler(forms.createAccount) ] },
							resetPasswordDialog: { '.requestResetForm': [ tObj.makeFormHandler(forms.requestPasswordReset) ] },
							finishPasswordResetDialog: { '.resetPasswordForm': [	tObj.SetInputs(this.getParams, ['rid', 'token']),
																									tObj.makeFormHandler(forms.resetPassword) ] },
							accountSettingsDialog: { 
									'.addAccount': [ tObj.makeFormHandler(forms.addAccount) ],
									'.usernameList': [ eta(this, 'usernameListHandler') ],
									'.openChangePasswordDialog':  [ tObj.makeDialogHandler('changePasswordDialog') ]
								},
							changePasswordDialog: { '.changePasswordForm':  [ tObj.makeFormHandler(forms.changePassword) ] },
							loginForm: { '.loginForm': [ tObj.makeFormHandler(forms.login) ] },
							finishUsernameValidationDialog: { '.validateAccountForm': [	tObj.SetInputs(this.getParams, ['vid', 'token']),
																											tObj.makeFormHandler(forms.validateAccount) ] },
							logoutForm: { '.logoutForm': [ tObj.makeFormHandler(forms.logout) ] },
							passwordsDoNotMatch: { },
							usernameListItem: { }
						};
					// Add ClickRemove handlers to all templates that don't have a handler.
					for(t in templates) {
						if(!(t in templateHandlers)) {
							var o = { };
							o['.' + t] = [ tObj.ClickRemove ];
							templateHandlers[t] = o;
						}
					}
					return templateHandlers;
				},
			usernameListHandler: function (sel, el) {
					var that = this;
					this.api.whoAmI('')
						.done(function  (d) {
								if('accounts' in d) {
									for(a in d.accounts) {
										var listItem = $('<li></li>');
										that.t.templates.usernameListItem(listItem);
										listItem.find('.authUsername').html(d.accounts[a].username);
										if(d.accounts[a].validated) { listItem.find('.validateAccount').remove(); }
										listItem.find('[name=username]').val(d.accounts[a].username);
										that.t.makeFormHandler(that.forms.sendAccountValidation)(listItem, listItem.find('.validateAccount'));
										that.t.makeFormHandler(that.forms.removeAccount)(listItem, listItem.find('.removeAccount'));
										el.append(listItem);
									}
								}
							})
						.fail(function () {
							});
				},

			accountPanelAuthenticated: function (sel) {
					sel.html('');
					this.t.templates.logoutForm(sel);
					this.t.templates.editAccount(sel);
				},
			accountPanelLoggedOut: function (sel) {
					console.log("logged out");
					sel.html('');
					this.t.templates.loginForm(sel);
					this.t.templates.createAccount(sel);
					this.t.templates.resetPassword(sel);
				},


			/*	This is just an instance variable to cache the user name and authentication status to handle API calls.
				This value is ONLY altered by "context.authenticated" and "context.loggedOut", NO other function
				should touch this value. If you want to change this value, call those functions. */
			currentUser: { authenticated: false, username: '' },

			handleAPI: function(data) {
					console.log('loaded api');
					this.api = createAPI(data, $);
					if((!this.overrideTemplate) && ('templateURI' in data)) {
						this.templateURI = data.templateURI;
					}
					return this.templateURI;
				},
			templateURI: 'js/auth.html',
			overrideTemplate: false,

			/*	Poll whoAmI API calls periodically to catch session time outs.
				When making an auth UI instance, you can override this behavior with your own function. */
			sessionPoll: function () {
					console.log('session poll whoAmI');
					if(navigator.onLine) { this.api.whoAmI('').done(eta(this, 'authenticated')).fail(eta(this, 'loggedOut')); }
					this.authPollTimer = window.setTimeout(this.poll, this.authPollingTimeout);
				},
			init: function(opts) {
					this.authAPI = $.Deferred();
					this.apiURI = ('apiURI' in opts) ? opts.apiURI : '/auth/api.json';
					this.id = ('id' in opts) ? opts.id : '#authTemplates'; 
					this.authPollingTimeout = ('pollTimeout' in opts) ? opts.pollTimeout : 900000; // Default is 15 minutes.
					this.failRetry = ('failRetry' in opts) ? opts.failRetry : 60000; // Default is 1 minute.
					this.events = ('eventHandler' in opts) ? interfaceAdapter(this.events, opts.eventHandler) : this.events;
					delegateAdapter(this.events, this);
					this.poll =('poll' in opts) ? opts.poll : eta(this, 'sessionPoll');
					this.createAccountUser = ('validateNewAccount' in opts) ? opts.validateNewAccount : null;
					this.getParams = ('params' in opts) ? opts.params : GetParams($);
					this.authAPI.done(this.poll);
					if ('templateURI' in opts) {
						this.templateURI = opts.templateURI 
						this.overrideTemplate = true;
					}
					this.t = makeTemplates({	handlers: eta(this, 'makeTemplateHandlers'),
														id: this.id });
					onlineRetrySequenceResolution([	loadAPI, 
																	LiftToPromise(eta(this, 'handleAPI')),
																	eta(this.t, 'loadTemplates')], this.failRetry, this.authAPI).resolve(this.apiURI);
					return this;
				}
		};
	})().init(opts));
};
window.makeAuthUI = makeAuthUI;
})(this);
