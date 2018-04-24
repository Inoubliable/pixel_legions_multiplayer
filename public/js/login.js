import $ from 'jquery';

$(document).ready(function() {

	console.log('hello');

	$('#login-form').submit(function() {
		return true;
	});

});