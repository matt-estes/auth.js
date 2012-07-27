(function(j,d){function g(s,r){var u=s[r];return function(){return u.apply(s,arguments)}}function p(r){return r}function n(s,v){var u={};s.map(function(r){if(r.name in u){if(v.isArray(u[r.name])){u[r.name].push(r.value)}else{u[r.name]=[u[r.name],r.value]}}else{u[r.name]=r.value}});return u}function k(y){var x=[];var u=[];for(var z in y){x.push(z)}for(var v in y[x[0]]){var w={};for(var s in x){w[x[s]]=y[x[s]][v]}u.push(w)}return u}function q(u,s){for(var r in u){if((r in s)&&(typeof s[r]==="function")){u[r]=g(s,r)}}return u}function c(s,u){for(var r in s){if(!(r in u)){u[r]=g(s,r)}}}function f(r,s,u){return{next:function(){if(this.i<r.length){r[this.i](this.data).done(g(this,"handleDone")).fail(g(this,"handleFail"))}else{u.resolve(this.data)}},handleDone:function(v){this.i++;this.data=v;this.next()},handleFail:function(){if(s!=null){j.setTimeout(g(this,"next"),s)}},resolve:function(v){this.i=0;this.data=v;this.next()}}}function i(r){return function(u){var s=r(u);return{done:function(v){v(s);return this},fail:function(v){return this}}}}function l(s,u){var v={};for(var r in s){(function(x,w){if((typeof w=="object")&&("uri" in w)){w.mime=("mime" in w)?w.mime:"application/x-www-form-urlencoded";w.result=("result" in w)?w.result:"text";v[x]=function(y){return u.ajax({type:w.method,url:w.uri,data:y,dataType:w.result,contentType:w.mime})}}})(r,s[r])}return v}function e(r){return $.ajax({url:r,type:"GET",data:"",contentType:"application/json; charset=utf-8",dataType:"json"})}function b(r){return function(){var s=j.location.search.substring(1).split("&").map(function(v){return v.split(";")});var u=[];s.map(function(v){v.map(function(w){u.push(w)})});u=u.map(function(w){var v=w.split("=");if(v.length>1){return{name:v[0],value:decodeURIComponent(v[1].replace(/\+/g," "))}}else{return{name:v[0],value:""}}});return n(u,r)}}var m=function(s,r){$(s).children().each(function(){r[$(this).attr("class")]=this})};var o=function(r){return(function(s){return{makeFormHandler:function(u){return function(x,v,w){v.submit(function(y){return u(y,this,x,v,w)})}},makeDialogHandler:function(v){var u=this;return function(y,w,x){w.toggle(function(){console.log('make dialog "'+v+'"');u.templates[v](y,x);return false},function(){y.find("."+v).remove();return false})}},makeListHandler:function(w,u){if(arguments.length<2){u=p}var v=this;return function(z,x,y){u(y).map(function(A){v.templates[w](x,A)})}},ClickRemove:function(w,u,v){w.click(function(x){w.remove();return false})},Up:function(w,u,v){u.click(function(){w.prev().before(w)})},Down:function(w,u,v){u.click(function(){w.next().after(w)})},SetInputs:function(u,v){if(arguments.length==0){u=p}if(arguments.length<2){return function(y,w,x){var z=u(x);for(var A in z){y.find("[name="+A+"]").val(z[A])}}}else{return function(y,w,x){var z=u(x);v.map(function(A){if(A in z){y.find("[name="+A+"]").val(z[A])}})}}},AddFormHandlers:function(x,w,u){for(var v in w){(function(y){x[y]=function(F,B,E,A,D){var C=n($(F.target).serializeArray(),$);if("validate" in w[y]){for(var z in w[y].validate){if(!(w[y].validate[z])(E,A,C,D)){return false}}}u[y](C).done(w[y].done(C,E,A,D)).fail(w[y].fail(C,E,A,D));return false}})(v)}},loadTemplates:function(u){s.child=this;return s.loaderPromise(u)}}})((function(){return{templates:{},forms:{},addHandlers:function(z,u,y){for(var x in u){var w=z.find(x);for(var v in u[x]){u[x][v](z,w,y)}}return w},MakeTemplates:function(v,s){this.child.templates={};var w=this.child.templates;for(var u in v){(function(y,x){if(y in s){w[y]=function(B,A){var z=$(v[y]).clone();x.addHandlers(z,s[y],A);B.append(z)}}else{w[y]=function(z){z.append($(v[y]).clone())}}})(u,this)}},loadTemplates:function(s){console.log("load templates "+s);return $.ajax({url:s,dataType:"html"})},handleTemplates:function(u){console.log("loading templates");var s=this;$(this.id).append(u);$(this.id+" :first-child ").children("div").each(function(){s.templates[$(this).attr("class")]=this});this.MakeTemplates(this.templates,this.handlers(this.child,this.templates,this.forms))},loaderPromise:function(s){var u=$.Deferred();f([this.loadTemplates,i(g(this,"handleTemplates"))],this.failRetry,u).resolve(s);return u},loaderUser:function(u){var s=this.loader(this.id,this.templates);this.MakeTemplates(this.templates,this.handlers(this.child,this.templates,this.forms));return s},init:function(s){this.id=("id" in s)?s.id:"#templates";this.handlers=("handlers" in s)?s.handlers:function(){return{}};this.failRetry=("failRetry" in s)?s.failRetry:60000;this.loaderPromise=("loader" in s)?((this.loader=s.loader),i(g(this,"loaderUser"))):this.loaderPromise;return this}}})().init(r))};var h=function(w){function v(y,A,z){return function(E,D,B,C){return function(F){console.log(A);y.t.templates[A](D);y[A](z(E))}}}function u(y,A,z){return function(E,D,B,C){return function(F){y.t.templates[A](D);D.remove();y[A](z(E))}}}function s(y,A,z){return function(E,D,B,C){return function(F){D.remove();y[A](z(E))}}}function r(y,A,z){if(arguments.length<2){A="password";z="password2"}return function(D,B,C){if(C[A]!=C[z]){y.t.templates.passwordsDoNotMatch(B.find("[name="+z+"]").parent());return false}return true}}function x(y){return y.username}return(function(y){return{loginForm:function(z){y.authAPI.done(function(){y.t.templates.loginForm(z)})},logoutForm:function(z){y.authAPI.done(function(){y.t.templates.logoutForm(z)})},addAccountPanel:function(z){y.authAPI.done(function(){if(y.authenticated){y.accountPanelAuthenticated(z)}else{y.accountPanelLoggedOut(z)}});y.accountPanels.push(z)},requestPasswordResetForm:function(z){y.authAPI.done(function(){y.t.templates.resetPasswordDialog(z)})},resetPasswordForm:function(z){y.authAPI.done(function(){console.log("resetPasswordForm");y.t.templates.finishPasswordResetDialog(z)})},createAccountForm:function(z){y.authAPI.done(function(){y.t.templates.createAccountDialog(z)})},accountSettingsForm:function(z){y.authAPI.done(function(){y.t.templates.accountSettingsDialog(z)})},changePasswordForm:function(z){y.authAPI.done(function(){y.t.templates.changePasswordDialog(z)})},emailValidateForm:function(z){y.authAPI.done(function(){y.t.templates.finishUsernameValidationDialog(z)})},whoAmI:function(){return{authenticated:y.authenticated,username:y.username}}}})((function(){return{events:{requestedPasswordReset:function(y){},passwordResetRequestFailed:function(y){},passwordReset:function(y){},resetPasswordFailed:function(y){},accountCreated:function(y){},createAccountFailed:function(y){},addedAccount:function(y){},accountRemoved:function(y){},accountRemoveFailed:function(y){},passwordChanged:function(y){},changePasswordFailed:function(y){},requestedAccountValidation:function(y){},requestedAccountValidationFailed:function(y){},accountValidated:function(y){},validationFailed:function(y){},authenticated:function(y){},loginFailed:function(y){},loggedOut:function(){}},accountPanels:[],accountCreated:function(y){this.events.accountCreated(y);this.authenticated({username:y.username})},authenticated:function(y){if((this.currentUser.authenticated!=true)||(this.currentUser.username!=y.username)){this.currentUser.authenticated=true;this.currentUser.username=y.username;this.accountPanels.map(g(this,"accountPanelAuthenticated"));this.events.authenticated(y.username)}},loggedOut:function(){console.log("logged out event");this.currentUser.authenticated=false;this.currentUser.username="";this.accountPanels.map(g(this,"accountPanelLoggedOut"));this.events.loggedOut()},makeTemplateHandlers:function(E,A,y){var z=this;var D=[r(this)];if(this.createAccountUser!=null){D.push(this.createAccountUser)}var C={createAccount:{validate:D,done:s(this,"accountCreated",p),fail:v(this,"createAccountFailed",p)},login:{done:function(I,H,G){return function(J){z.authenticated({username:I.username})}},fail:v(this,"loginFailed",x)},logout:{done:function(I,H,G){return function(J){z.loggedOut()}},fail:function(I,H,G){return function(J){}}},changePassword:{validate:[r(this,"newPassword","newPassword2")],done:u(this,"passwordChanged",x),fail:v(this,"changePasswordFailed",x)},requestPasswordReset:{done:u(this,"requestedPasswordReset",x),fail:v(this,"passwordResetRequestFailed",x)},resetPassword:{validate:[r(this)],done:u(this,"passwordReset",x),fail:v(this,"resetPasswordFailed",x)},validateAccount:{done:u(this,"accountValidated",x),fail:v(this,"validationFailed",x)},addAccount:{validate:[r(this)],done:v(this,"addedAccount",x),fail:v(this,"addAccountFailed",x)},removeAccount:{done:v(this,"accountRemoved",x),fail:v(this,"accountRemoveFailed",x)},sendAccountValidation:{done:v(this,"requestedAccountValidation",x),fail:v(this,"requestedAccountValidationFailed",x)}};E.AddFormHandlers(y,C,this.api);this.forms=y;var B={createAccount:{".openCreateAccountDialog":[E.makeDialogHandler("createAccountDialog")]},resetPassword:{".openResetPasswordDialog":[E.makeDialogHandler("resetPasswordDialog")]},editAccount:{".openEditAccountDialog":[E.makeDialogHandler("accountSettingsDialog")]},createAccountDialog:{".createAccountForm":[E.makeFormHandler(y.createAccount)]},resetPasswordDialog:{".requestResetForm":[E.makeFormHandler(y.requestPasswordReset)]},finishPasswordResetDialog:{".resetPasswordForm":[E.SetInputs(this.getParams,["rid","token"]),E.makeFormHandler(y.resetPassword)]},accountSettingsDialog:{".addAccount":[E.makeFormHandler(y.addAccount)],".usernameList":[g(this,"usernameListHandler")],".openChangePasswordDialog":[E.makeDialogHandler("changePasswordDialog")]},changePasswordDialog:{".changePasswordForm":[E.makeFormHandler(y.changePassword)]},loginForm:{".loginForm":[E.makeFormHandler(y.login)]},finishUsernameValidationDialog:{".validateAccountForm":[E.SetInputs(this.getParams,["vid","token"]),E.makeFormHandler(y.validateAccount)]},logoutForm:{".logoutForm":[E.makeFormHandler(y.logout)]},passwordsDoNotMatch:{},usernameListItem:{}};for(t in A){if(!(t in B)){var F={};F["."+t]=[E.ClickRemove];B[t]=F}}return B},usernameListHandler:function(A,y){var z=this;this.api.whoAmI("").done(function(C){if("accounts" in C){for(a in C.accounts){var B=$("<li></li>");z.t.templates.usernameListItem(B);B.find(".authUsername").html(C.accounts[a].username);if(C.accounts[a].validated){B.find(".validateAccount").remove()}B.find("[name=username]").val(C.accounts[a].username);z.t.makeFormHandler(z.forms.sendAccountValidation)(B,B.find(".validateAccount"));z.t.makeFormHandler(z.forms.removeAccount)(B,B.find(".removeAccount"));y.append(B)}}}).fail(function(){})},accountPanelAuthenticated:function(y){y.html("");this.t.templates.logoutForm(y);this.t.templates.editAccount(y)},accountPanelLoggedOut:function(y){console.log("logged out");y.html("");this.t.templates.loginForm(y);this.t.templates.createAccount(y);this.t.templates.resetPassword(y)},currentUser:{authenticated:false,username:""},handleAPI:function(y){console.log("loaded api");this.api=l(y,$);if((!this.overrideTemplate)&&("templateURI" in y)){this.templateURI=y.templateURI}return this.templateURI},templateURI:"js/auth.html",overrideTemplate:false,sessionPoll:function(){console.log("session poll whoAmI");if(navigator.onLine){this.api.whoAmI("").done(g(this,"authenticated")).fail(g(this,"loggedOut"))}this.authPollTimer=j.setTimeout(this.poll,this.authPollingTimeout)},init:function(y){this.authAPI=$.Deferred();this.apiURI=("apiURI" in y)?y.apiURI:"/auth/api.json";this.id=("id" in y)?y.id:"#authTemplates";this.authPollingTimeout=("pollTimeout" in y)?y.pollTimeout:900000;this.failRetry=("failRetry" in y)?y.failRetry:60000;this.events=("eventHandler" in y)?q(this.events,y.eventHandler):this.events;c(this.events,this);this.poll=("poll" in y)?y.poll:g(this,"sessionPoll");this.createAccountUser=("validateNewAccount" in y)?y.validateNewAccount:null;this.getParams=("params" in y)?y.params:b($);this.authAPI.done(this.poll);if("templateURI" in y){this.templateURI=y.templateURI;this.overrideTemplate=true}this.t=o({handlers:g(this,"makeTemplateHandlers"),id:this.id});f([e,i(g(this,"handleAPI")),g(this.t,"loadTemplates")],this.failRetry,this.authAPI).resolve(this.apiURI);return this}}})().init(w))};j.makeAuthUI=h})(this);