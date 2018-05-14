import $ from 'jquery';

export default function loginJS() {

	$(document).ready(function() {

		$('.login-btn').click(function(event) {
			let name = $('.name').val();
			let password = $('.password').val();

			$.post('login', {name: name, password: password}, function(data) {
				// reloading page
				if (data.isLoggedIn) {
					window.location.replace('/');
				} else {
					// display error
				}
			});
		});

	});

}