import $ from 'jquery';

export default function registerJS() {

	$(document).ready(function() {
		
		let userCountry = geoplugin_countryName();
		$('input.country').val(userCountry);

		$('#register-form').submit(function() {
			return true;
		});

	});

}