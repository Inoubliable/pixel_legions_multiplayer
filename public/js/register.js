$(document).ready(function() {

	let userCountry = geoplugin_countryName();
	console.log(userCountry);
	$('input.country').val(userCountry);

	$('#register-form').submit(function() {
		return true;
	});

});