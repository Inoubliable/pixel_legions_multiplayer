import $ from 'jquery';
import {login} from './login.js';
import {register} from './register.js';
import {profile} from './profile.js';
import {leaderboard} from './leaderboard.js';
import {waitingRoom} from './waitingRoom.js';

$(document).ready(function() {
	login();
	register();
	profile();
	leaderboard();
	waitingRoom();
});