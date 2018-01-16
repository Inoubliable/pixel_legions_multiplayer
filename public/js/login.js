$(document).ready(function() {

	if (localStorage.getItem('pixelLegionsPlayer')) {
		let player = JSON.parse(localStorage.getItem('pixelLegionsPlayer'));
		let playerName = player.name;
		$('.login-as-btn').val('Play as ' + playerName);
		$('#login-as-form').show();
	}

	$('#login-form').submit(function() {
		let name = $('.name').val();
		let player = {name: name};
		localStorage.setItem('pixelLegionsPlayer', JSON.stringify(player));

		return true;
	});

});