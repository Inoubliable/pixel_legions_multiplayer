import $ from 'jquery';

export function login() {

	console.log('hello');

	$('#login-form').submit(function() {
		return true;
	});

};