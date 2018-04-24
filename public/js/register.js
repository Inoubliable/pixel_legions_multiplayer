import $ from 'jquery';

$(document).ready(function() {
	
	let userCountry = geoplugin_countryName();
	$('input.country').val(userCountry);

	$('#register-form').submit(function() {
		return true;
	});

});