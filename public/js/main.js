import $ from 'jquery';

import renderLogin from './login';
import renderRegister from './register';
import renderHome from './home';
import renderWaitingRoom from './waitingRoom';
import renderGame from './game';

let user = {
	isLoggedIn: false
};

$.get('isLoggedIn', function(data) {
	user.isLoggedIn = data.isLoggedIn;

	renderInitialPage();
});


function renderInitialPage() {
	$(document).ready(function() {

		if (user.isLoggedIn) {
			renderHome();
		} else {
			renderLogin();
		}

		$('.btn').click(function(event) {

			let pageLink = $(this).data('page');

			switch (pageLink) {
				case 'login':
					renderLogin();
					break;
				case 'register':
					renderRegister();
					break;
				case 'home':
					renderHome();
					break;
				case 'waitingRoom':
					renderWaitingRoom();
					break;
				case 'game':
					renderGame();
					break;
				case 'leaderboard':
					renderLeaderboard();
					break;
				case 'profile':
					renderProfile();
					break;
			}

		});

	});
}