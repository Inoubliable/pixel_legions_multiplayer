$(document).ready(function() {

	let player = null;
	let upgradesArray = [];

	let clickedId = null;

	$('.buy-btn').hide();

	$.get('upgrades', function(data) {
		player = data.player;
		upgradesArray = data.upgradesArray;
	});

	$('.upgrade').click(function(event) {
		clickedId = $(this).attr('id');
		let upgrade = upgradesArray.find(u => u.id == clickedId);

		if (upgrade.available) {
			let upgradeLevel = player.upgrades[clickedId];
			let upgradeCost = upgrade.cost[upgradeLevel];
			
			$('.upgrade-name').text(upgrade.name);
			$('.upgrade-icon img').attr('src', upgrade.icon);
			$('.upgrade-description').text(upgrade.description);
			$('.upgrade-cost').html(upgradeCost + '<div class="coin"></div>');
			$('.buy-btn').show();
			if (upgradeCost > player.coins) {
				$('.buy-btn').addClass('disabled');
				$('body').off('click', '.buy-btn');
			} else {
				$('.buy-btn').removeClass('disabled');
				$('.buy-btn').click(function(event) {
					$.post('buyUpgrade', {upgradeId: clickedId}, function(data) {
						
					});
				});
			}
		} else {
			$('.upgrade-name').text(upgrade.name);
			$('.upgrade-icon img').attr('src', upgrade.icon);
			$('.upgrade-description').text(upgrade.description);
			$('.upgrade-cost').html(upgrade.cost);

			$('.buy-btn').hide();
		}
	});

	$('.upgrades-btn').click(function(event) {
		$('.upgrades-bar').css('transform', 'translate(-50%, 0%)');
	});

	$('.upgrades-bar .close').click(function(event) {
		$('.upgrades-bar').css('transform', 'translate(-50%, -100%)');
	});

});