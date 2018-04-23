import $ from 'jquery';

export function login() {
	
	let userCountry = geoplugin_countryName();
	$('input.country').val(userCountry);

	$('#register-form').submit(function() {
		return true;
	});

};