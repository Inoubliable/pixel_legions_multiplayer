$(document).ready(function() {

	$('.upgrades-btn').click(function(event) {
		$('.upgrades-bar').css('transform', 'translate(-50%, 0%)');
	});

	$('.upgrades-bar .close').click(function(event) {
		$('.upgrades-bar').css('transform', 'translate(-50%, -100%)');
	});

});