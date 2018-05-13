import $ from 'jquery';

export default function waitingRoomJS() {

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
					window.location.href = '/game';
				}
			}, 1000);
		});

	});

}