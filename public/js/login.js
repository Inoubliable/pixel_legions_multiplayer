import $ from 'jquery';

export default function loginJS(user) {

	$(document).ready(function() {

		$('.login-btn').click(function(event) {
			let name = $('.name').val();
			let password = $('.password').val();

			$.post('login', {name: name, password: password}, function(data) {
				// temporary
				// change this, it is reloading page, not really SPA
				if (data.isLoggedIn) {
					window.location.replace('/');
				} else {
					// display error
				}
			});
		});

	});

}