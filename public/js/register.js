import $ from 'jquery';

function registerJS() {

	$(document).ready(function() {
		
		let userCountry = geoplugin_countryName();
		$('input.country').val(userCountry);

		$('#register-form').submit(function() {
			return true;
		});

	});

}

export default function renderRegister() {
	$('.page').removeClass('visible');
	
	$('#register-page').addClass('visible');
	
	registerJS();
}