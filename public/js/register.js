import $ from 'jquery';

import renderLogin from './login';

function registerJS() {

	$(document).ready(function() {
		
		let userCountry = geoplugin_countryName();

		$('.register-btn').click(function(event) {
			let name = $('#register-form').find('.name').val();
			let password = $('#register-form').find('.password').val();

			$.post('register', {name: name, password: password, country: userCountry}, function(data) {
				
				if (data.success) {
					renderLogin(data.success);
				} else if (data.error) {
					$('.registration-error').text(data.error);
					$('.registration-error').show(500);
				}

			});
		});

	});

}

export default function renderRegister() {
	$('.page').removeClass('visible');
	
	$('#register-page').addClass('visible');
	
	registerJS();
}