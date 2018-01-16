$(document).ready(function() {

	if (localStorage.getItem('pixelLegionsName')) {
		let playerName = localStorage.getItem('pixelLegionsName');
		$('.login-as-btn').val('Play as ' + playerName);
		$('#login-as-form').show();
	}

	$('#login-form').submit(function() {
		let name = $('.name').val();
		localStorage.setItem('pixelLegionsName', name);

		return true;
	});

});