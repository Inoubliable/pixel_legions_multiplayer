import $ from 'jquery';
import io from 'socket.io-client';

import renderGame from './game';

function waitingRoomJS() {

	$(document).ready(function() {

		let socket = io('/waitingRoom');

		socket.on('player joined', function(allPlayers){
			$('.players-list').html('');
			allPlayers.forEach(player => $('.players-list').append('<li>' + player.name + ' <span class="player-rating">' + player.rating + '</span></li>'));
		});

		socket.on('start countdown', function(allPlayers){
			$('.players-list').html('');
			allPlayers.forEach(player => $('.players-list').append('<li>' + player.name + ' <span class="player-rating">' + player.rating + '</span></li>'));

			// countdown
			$('.countdown').show();		
			let count = 5;
			$('.countdown-seconds').html(count);
			count--;
			let countdownInterval = setInterval(function() {
				$('.countdown-seconds').html(count);
				count--;
				if (count < 0) {
					// send player to game
					clearInterval(countdownInterval);
					renderGame();
				}
			}, 1000);
		});

	});

}

export default function renderWaitingRoom() {
	$('.page').removeClass('visible');
	
	$('#waitingRoom-page').addClass('visible');

	waitingRoomJS();
}