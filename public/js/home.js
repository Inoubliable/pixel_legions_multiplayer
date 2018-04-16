$(document).ready(function() {

	let player = null;
	let upgradesArray = [];

	let clickedId = null;

	$('.buy-btn').hide();

	$.get('upgrades', function(data) {
		player = data.player;
		upgradesArray = data.upgradesArray;

		$('.player-coins').html(player.coins + '<div class="coin"></div>');
	});

	$('.upgrade').click(function(event) {
		clickedId = $(this).attr('id');
		let upgrade = upgradesArray.find(u => u.id == clickedId);

		$('.upgrade-name').text(upgrade.name);
		$('.upgrade-icon img').attr('src', upgrade.icon);
		$('.upgrade-description').text(upgrade.description);

		if (upgrade.available) {
			let upgradeLevel = player.upgrades[clickedId];
			let upgradeCost = upgrade.cost[upgradeLevel];
			
			$('.upgrade-cost').html(upgradeCost + '<div class="coin"></div>');
			$('.buy-btn').show();

			$('body').off('click', '.buy-btn');

			if (upgradeCost > player.coins) {
				$('.buy-btn').addClass('disabled');
			} else {
				$('.buy-btn').removeClass('disabled');

				$('body').on('click', '.buy-btn', function(event) {
					let upgradeLevel = player.upgrades[clickedId];
					let upgradeCost = upgrade.cost[upgradeLevel];
					player.coins = player.coins - upgradeCost;
					$('.player-coins').html(player.coins + '<div class="coin"></div>');

					let newUpgradeLevel = upgradeLevel + 1;
					player.upgrades[clickedId] = newUpgradeLevel;

					let newUpgradeCost = upgrade.cost[newUpgradeLevel];
					$('.upgrade-cost').html(newUpgradeCost + '<div class="coin"></div>');
					if (newUpgradeCost > player.coins) {
						$('.buy-btn').addClass('disabled');
						$('body').off('click', '.buy-btn');
					}

					$.post('buyUpgrade', {upgradeId: clickedId}, function(data) {
					});
				});
			}
		} else {
			$('.upgrade-cost').html(upgrade.cost);

			$('.buy-btn').hide();
		}
	});

	$('.upgrades-btn').click(function(event) {
		$('.upgrades-bar').css('transform', 'translate(-50%, 0%)');
	});

	// close upgrade-bar on click outside it
	$('body').mousedown(function(e) {
		let clicked = $(e.target);
		if (clicked.is('.upgrades-bar') || clicked.parents().is('.upgrades-bar')) {
			return;
		} else if (clicked.is('.upgrades-btn')) {
			$('.upgrades-bar').css('transform', 'translate(-50%, 0%)');
		} else {
			$('.upgrades-bar').css('transform', 'translate(-50%, -100%)');
		}
	});

});