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
	public function __construct() {
		if(!isset($_SESSION['users'])) { $_SESSION['users'] = array(); }
	}
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
		unset($_SESSION['CurrentUser']);
		$username = $_POST['username'];
		$password = $_POST['password'];
		$userdb = $_SESSION['users'];
		if(isset($userdb[$username])) {
			$user = $userdb[$username];
			if($password == $user['password']) {
				header('Status: 200 OK');
				$_SESSION['CurrentUser'] = $user;
				return;
			}
		}
		header('Status: 403 Forbidden');
	}

	public function logout() { 
		unset($_SESSION['CurrentUser']);
	}

/* Bells and whistles. Basically, this implements typical exchanges
websites have to handle like password resets. Note, THIS code doesn't
even attempt to actually send password resets or account email address 
validation emails. My goal here is to show you what auth.js SENDS you,
and how to REPLY to auth.js, and that just muddies the waters. */

	public function requestPasswordReset() { 
		$username = $_POST['username'];
		/* Psuedo code, since I'm not going to email anyone with this code:
			generate a random token and a reset id.
			Email the user a hyperlink to a page that embeds the form
				auth.resetPasswordForm
			from auth.js, and then implement reset password.
		*/
	}
	public function resetPassword() { 
		$rid = $_POST['rid'];
		$token = $_POST['token'];
		$password = $_POST['password'];
		$password2 = $_POST['password2'];
		if($password != $password2) {
			header('Status: 403 Forbidden');
			return;
		}
		/* Psuedo code:
			if rid and token are valid, change the password associated
			with the user account.
		*/
	}
	public function createAccount() { 
		$username = $_POST['username'];
		$password = $_POST['password'];
		$password2 = $_POST['password2'];
		/* Note: If you add fields to this form, they WILL be posted to this method on the server.
		So if you want to add more fields than these, go right ahead and use them however you like. */
		if($password != $password2) {
			header('Status: 403 Forbidden');
			return;
		}
		$userdb = $_SESSION['users'];
		if(!isset($userdb[$username])) {
			header('Status: 200 OK');
			$user = array('password' => $password, 'username' => $username);
			$userdb[$username] = $user;
			$_SESSION['users'] = $userdb;
			$_SESSION['CurrentUser'] = $user;
			return;
		}
		header('Status: 403 Forbidden');
	}
	public function addAccount() { 
		$username = $_POST['username'];
		$password = $_POST['password'];
		$password2 = $_POST['password2'];
		/* The purpose of this API call is to allow the user
		to add more email accounts, and generally associate
		more than one authentication method with their account. */
		header('Status: 501 Not Implemented');
	}
	public function removeAccount() { 
		$username = $_POST['username'];
		$password = $_POST['password'];
		/* This is the converse of the addAccount API call. */
		$userdb = $_SESSION['users'];
		if(isset($_SESSION['CurrentUser'])) {
			$current = $_SESSION['CurrentUser'];
			if($current['username'] == $username) {
				if($current['password'] == $password) {
					header('Status: 200 OK');
					unset($_SESSION['CurrentUser']);
					unset($userdb[$username]);
					$_SESSION['users'] = $userdb;
					return;
				}
			}
		}
		header('Status: 403 Forbidden');
	}
	public function changePassword() { 
		$username = $_POST['username'];
		$oldPassword = $_POST['oldPassword'];
		$newPassword = $_POST['newPassword'];
		$newPassword2 = $_POST['newPassword2'];
		if($newPassword != $newPassword2) {
			header('Status: 403 Forbidden');
			return;
		}
		$userdb = $_SESSION['users'];
		if(isset($_SESSION['CurrentUser'])) {
			$current = $_SESSION['CurrentUser'];
			if($current['username'] == $username) {
				if($current['password'] == $oldPassword) {
					header('Status: 200 OK');
					$current['password'] = $newPassword;
					$_SESSION['CurrentUser'] = $current;
					$userdb[$username] = $current;
					$_SESSION['users'] = $userdb;
					return;
				}
			}
		}
		header('Status: 403 Forbidden');
	}
	public function sendAccountValidation() { 
		$username = $_POST['username'];
		/* Psuedo code, since I'm not going to email anyone with this code:
			generate a random token and a validation id.
			Email the user a hyperlink to a page that embeds the form
				auth.emailValidateForm
			from auth.js, and then implement the validation.
		*/
	}
	public function validateAccount() { 
		$vid = $_POST['vid'];
		$token = $_POST['token'];
		/* Psuedo code:
			if vid and token are valid, mark the email address associated
			with the user account as valid.
		*/
	}

	public function whoAmI() {
		if(!isset($_SESSION['CurrentUser'])) {
			header('Status: 403 Forbidden');  
			return;
		}
		$user = $_SESSION['CurrentUser'];
		header('Content-type: application/json');
		echo("{ \"username\": \"{$user['username']}\",
	\"accounts\": [ { \"username\": \"{$user['username']}\", \"validated\": false } ] }");
	}

	public function __call($name, $args) {
		header('Status: 501 Not Implemented');
	}
}

$api = new AuthAPI();
// Pick which function we call based on the 'method' query string parameter.
call_user_func(array($api, $_REQUEST['method']));
?>