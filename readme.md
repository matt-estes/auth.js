# auth.js
This is a Javascript AJAX/dynamic html forms-based authentication library that runs in the browser. This is well suited for "single page Javascript apps" meant to run on smart phones and/or in "offline mode"(in conjunction with localStorage to cache data to sync on next login).

This library does NOT encrypt anything. If you want this to be secure, you need to properly implement SSL/TLS.

This library DOES use a template(see auth.html for a barebones template file) of forms and error messages to drive most common username/password user interface "flows'. In order to do this, your server must implement a simple RESTful authentication API. You only have to implement the methods of this API that you need. The API is partially described by auth.api.json.

For the whole library, your server should implement the following "methods"(see auth-example.php and auth-php-example.html for a demonstration):
```
login(String username, String password);
logout();
requestPasswordReset(String username);
resetPassword(Integer rid, String token, String password, String password2);
createAccount(String username, String password, String password2);
addAccount(String username, String password, String password2);
removeAccount(String username, String password);
changePassword(String username, String oldPassword, String newPassword, String newPassword2);
sendAccountValidation(String username);
validateAccount(Integer vid, String token);
whoAmI();
```
With those methods implemented on the server, you can include auth.js in your webpage, and follow the outline of auth-php-example.html

## Licensing.
This project is licensed under the [AGPL version 3](http://www.gnu.org/licenses/agpl.html), which means if you want to use this in your project, you must release your code under an AGPL compatible license. The Free Software Foundation has a [List of licenses compatible with the AGPL](www.gnu.org/licenses/index_html#GPLCompatibleLicenses). If you would like to use this code in a commercial project, you can as long as you release your code under a license compatible with the AGPL. 

### Purchasing a commercial license.
If you are interested in using this code under alternative licensing, email me [matt.estes@metanotion.net](mailto:matt.estes@metanotion.net) and I will be happy to work with you. My standard commercial licensing deal is simple: For $900, you get one year of releases, and a non-transferrable license to use this code in as many projects as you wish, royalty free, for forever. (However, there is still no warranty, this is just a no-strings license for use in a commercial projects).

### Free Software
Just want to make this worth emphasizing: This project is not dual-licensed. It is only released under the Affero General Public License version 3. However, the AGPL is compatible with many open source and free software licenses. Writing free software is a noble effort, and I'm happy to give back.

## Dependencies
auth.js relies on jQuery 1.5 or later.

The server must implement the API described above, but there are NO REQUIREMENTS on your server side language. All URI's used by the library are defined in auth.api.json, and the uri of auth.api.json is passed to the `makeAuthUI` function, along with a template location. There are *zero* hardcoded URI's in this library(although there are default values).

The example server in auth-example.php is written in PHP as I think most developers are familar enough with it to read the code to see what they need to do to integrate it with their authentication database backend.

## Getting Started
Within the browser, the following snippet should explain roughly how things work:
```html
<script type="text/javascript" src="/js/jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="/js/auth-0.0.1-r1.js"></script>
<script type="text/javascript">
  $(document).ready(
    function() {
      var e =	{	authenticated: function(uname) { 
          // This function is called when a user is authenticated.
          console.log("Authenticated " + uname); 
        },
        loggedOut: function() { 
          // This function is called when a user is logged out.
          console.log("Logged out");
        }
      };
      var auth = makeAuthUI({
        eventHandler: e,
        apiURI: '/examples/auth-example.php?method=getAPI',
        // Poll the current session every 10 minutes. This value is in millseconds.
        pollTimeout: 600000 });

        /* This makes the inner html of #accountPanel a container for an AJAX "account panel" */
        auth.addAccountPanel($('#accountPanel'));
    });
</script>
<body>
...
  <div id="accountPanel">
  <!-- This will contain the UI to log in, create accounts, reset passwords, etc. -->
  </div>
```

On the server, you should provide either a static copy of auth.api.json or dynamically generate one at a well known URI for your site, with URI's customized to appropriate values for your authentication code:
```javascript
{
  "login": {  "method": "POST", "uri": "/auth/login" },
  "logout": { "method": "POST", "uri": "/auth/logout" },
  "requestPasswordReset": { "method": "POST", "uri": "/auth/requestPasswordReset" },
  "resetPassword": { "method": "POST", "uri": "/auth/resetPassword" },
  "createAccount": { "method": "POST", "uri": "/auth/createAccount" },
  "addAccount": { "method": "POST", "uri": "/auth/addAccount" },
  "removeAccount": { "method": "POST", "uri": "/auth/removeAccount" },
  "changePassword": { "method": "POST", "uri": "/auth/changePassword" },
  "sendAccountValidation": { "method": "POST", "uri": "/auth/sendAccountValidation" },
  "validateAccount": { "method": "POST", "uri": "/auth/validateAccount" },
  "whoAmI": { "method": "GET", "result": "json", "uri": "/auth/whoAmI" },
  "templateURI": "/js/auth.html"
}
```
Please note, you do *not* have to implement *all* of those functions to use this library.

To customize the user interface shown, and to coordinate the look and feel with your site's design, you will need to edit/replace or make multiple versions of the template file. The version of auth.html provided is in some sense minimally. The css class names used in it, and the form field inputs should remain the same, but you can change anything else in that file to suit your site. Note, you can ADD more CSS classes to the file, but the ones used in the file are needed for the template code.

With the exception of `whoAmI` which returns a JSON object, these methods should be done via HTTP POST, and the parameters are `application/url-form-encoded`. If these methods succeed, they should return an HTTP Status in the 2xx range, and if they fail, an HTTP Status in the 4xx range(e.g. 403 Forbidden is frequently a good choice, and 422 Unprocessable entity works as well...)

whoAmI returns information about the currently authenticated user in a JSON object, or a 4xx status if the current session is not authenticated. The JSON object is structured as follows:
```javascript
{
  "username": "current user name",
  "accounts": [ { "username": "account name", "validated": true|false }, ... ]
}
```
The accounts property is just an array of the (possibly multiple) accounts associated with this user. Validated is true if the account been validated(presumably by email, but auth.js doesn't really care how you validate users).

And that's it. In summary:
Put a version of auth.api.json on your server with customized url's.
Customize auth.html if you want.
Write code to implement as many of the 11 methods defined in auth.api.json as you want/need/wish to use.
Include a snippet of Javascript as described at the beginning of this section in your html.

## Localization Support.
There are two methods you can easily use to implement localization, both of them work through separate template loading mechanism.

### Accept-Language Header
the auth.api.json object provides a `templateURI` property. You can use the accept-language header to return an appropriate value in this property
```php
$api = "{ \"login\": ..., \"templateURI\": " . getLocalizedTemplateURI() . " }";
echo $api;
```
To determine which language the user prefers look at the Accept-Language header(e.g. `$_SERVER['HTTP_ACCEPT_LANGUAGE']` in PHP, possibly combined with a cookie to remember user preferences for your website, etc.)
It would also be posisble to serve a localized copy of the template based on configuration of your webserver as well(e.g. type maps and mod-negotiation in Apache).

### In the browser
The `templateURI` property of the option object passed to `makeAuthUI` overrides any other location for templates. This can be used within the browser by looking at the `navigator.userLanguage` properties, etc.

I am not an expert in localization though, and auth.js is agnostic on the matter. However, since the templates are loaded externally, developers have many opportunities to inject localized versions of the template file depending on what's appropriate for their situation.
