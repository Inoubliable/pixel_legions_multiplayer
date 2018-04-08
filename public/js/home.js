$(document).ready(function() {

	let upgradesArray = [];

	$.get('upgrades', function(upgrades) {
		upgradesArray = upgrades;
	});

	$('.upgrade').click(function(event) {
		let clickedId = $(this).attr('id');
		let upgrade = upgradesArray.find(u => u.id == clickedId);

		$('.upgrade-name').text(upgrade.name);
		$('.upgrade-icon img').attr('src', upgrade.icon);
		$('.upgrade-description').text(upgrade.description);
		$('.upgrade-cost').html(upgrade.cost + '<div class="coin"></div>');
	});

	$('.upgrades-btn').click(function(event) {
		$('.upgrades-bar').css('transform', 'translate(-50%, 0%)');
	});

	$('.upgrades-bar .close').click(function(event) {
		$('.upgrades-bar').css('transform', 'translate(-50%, -100%)');
	});

});