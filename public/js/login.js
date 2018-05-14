import $ from 'jquery';

function loginJS() {

	$(document).ready(function() {

		$('.login-btn').click(function(event) {
			let name = $('#login-form').find('.name').val();
			let password = $('#login-form').find('.password').val();

			$.post('login', {name: name, password: password}, function(data) {
				// reloading page
				if (data.isLoggedIn) {
					window.location.replace('/');
				} else if (data.error) {
					$('.login-error').text(data.error);
					$('.login-error').show(300);
				}
			});
		});

	});

}

export default function renderLogin(message) {
	$('.page').removeClass('visible');
	
	$('#login-page').addClass('visible');
	if (message) {
		$('.registration-success').text(message);
		$('.registration-success').show(300);
	}
	
	loginJS();
}