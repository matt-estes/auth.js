<?php
/***********************************************************************
    Copyright 2012 Matthew S. Estes

    This file is part of auth.js

    This file is licensed separate from the rest of auth.js
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
***********************************************************************/

/***********************************************************************
This code is a REALLY bad implementation of an auth protocol for use with
auth.js. It's point is to demonstrate the bare minimum a server has to do.
If you use this code AS-IS on a production site, you should feel bad.

***********************************************************************/

ob_start();
session_start();

DEFINE('PATH_TO_AUTH_PHP', '/examples/auth-example.php');

class AuthAPI {
/* These functions do THE bare minimum. If your web server is properly
configured to serve up the correct MIME type for a .json file ("application/json")
then you can just make a static file instead of "getAPI". See the auth.api.json file
for an example file to use. Also, to customize this to your server, all you should have
to do is change the 'uri' property to the appropriate relative path to your implementation
of the method. With exception of 'whoAmI' all of these are supposed to be POST's.
*/
	public function getAPI() { 
		$auth_php_path = PATH_TO_AUTH_PHP;
		header('Content-type: application/json');
		echo("{
	\"login\": { 
		\"method\": \"POST\", 
		\"uri\": \"{$auth_php_path}?method=login\" },
	\"logout\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=logout\" },
	\"requestPasswordReset\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=requestPasswordReset\" },
	\"resetPassword\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=resetPassword\" },
	\"createAccount\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=createAccount\" },
	\"addAccount\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=addAccount\" },
	\"removeAccount\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=removeAccount\" },
	\"changePassword\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=changePassword\" },
	\"sendAccountValidation\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=sendAccountValidation\" },
	\"validateAccount\": {
		\"method\": \"POST\",
		\"uri\": \"{$auth_php_path}?method=validateAccount\" },
	\"whoAmI\": {
		\"method\": \"GET\",
		\"result\": \"json\",
		\"uri\": \"{$auth_php_path}?method=whoAmI\" },
	\"templateURI\": \"/js/auth.html\"
}");
	}

	public function login() { 
		$username = $_POST['username'];
		$password = $_POST['password'];
	}

	public function logout() { 
		unset($_SESSION['UserInfo']);
	}

/* Bells and whistles. Basically, this implements typical exchanges
websites have to handle like password resets. Note, THIS code doesn't
even attempt to actually send password resets or account email address 
validation emails. My goal here is to show you what auth.js SENDS you,
and how to REPLY to auth.js, and that just muddies the waters. */

	public function requestPasswordReset() { 
		$username = $_POST['username'];
	}
	public function resetPassword() { 
		$rid = $_POST['rid'];
		$token = $_POST['token'];
		$password = $_POST['password'];
		$password2 = $_POST['password2'];
	}
	public function createAccount() { 
		$username = $_POST['username'];
		$password = $_POST['password'];
		$password2 = $_POST['password2'];
		/* Note: If you add fields to this form, they WILL be posted to this method on the server.
		So if you want to add more fields than these, go right ahead and use them however you like. */
	}
	public function addAccount() { 
		$username = $_POST['username'];
		$password = $_POST['password'];
		$password2 = $_POST['password2'];
	}
	public function removeAccount() { 
		$username = $_POST['username'];
		$password = $_POST['password'];
	}
	public function changePassword() { 
		$username = $_POST['username'];
		$oldPassword = $_POST['oldPassword'];
		$newPassword = $_POST['newPassword'];
		$newPassword2 = $_POST['newPassword2'];
	}
	public function sendAccountValidation() { 
		$username = $_POST['username'];
	}
	public function validateAccount() { 
		$vid = $_POST['vid'];
		$token = $_POST['token'];
	}

	public function whoAmI() {
		if(!isset($_SESSION['UserInfo'])) {
			header('Status: 403 Forbidden');  
			return;
		}
		header('Content-type: application/json');
	}

	public function __call($name, $args) {
		header('Status: 501 Not Implemented');
	}
}

$api = new AuthAPI();
// Pick which function we call based on the 'method' query string parameter.
call_user_func(array($api, $_REQUEST['method']));
?>