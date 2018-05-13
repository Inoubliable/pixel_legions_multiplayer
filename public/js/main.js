import $ from 'jquery';

import loginJS from './login';
import registerJS from './register';
import homeJS from './home';
import waitingRoomJS from './waitingRoom';

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

function renderLogin() {
	$('.page').removeClass('visible');
	$('#login-page').addClass('visible');

	loginJS(user);
}

function renderRegister() {
	$('.page').removeClass('visible');
	$('#register-page').addClass('visible');

	registerJS();
}

function renderHome() {
	$('.page').removeClass('visible');
	$('#home-page').addClass('visible');

	homeJS();
}

function renderWaitingRoom() {
	$('.page').removeClass('visible');
	$('#waitingRoom-page').addClass('visible');

	waitingRoomJS();
}

function renderLeaderboard() {
	$('.page').removeClass('visible');
	$('#leaderboard-page').addClass('visible');
}

function renderProfile() {
	$('.page').removeClass('visible');
	$('#profile-page').addClass('visible');
}