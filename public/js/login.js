$(document).ready(function() {

	$.get('getPlayer', function(player) {
		if (player.name) {
			$('.login-as-btn').val('Play as ' + player.name);
			$('#login-as-form').show();
		}
	});

	$('#login-form').submit(function() {
		return true;
	});

});