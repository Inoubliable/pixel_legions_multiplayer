import $ from 'jquery';

function profileJS(name) {

	$.get('profile/' + name, function(data) {
		let player = data.player;

		$('.player-name').text(player.name);
		$('.flag-icon').addClass('flag-icon-' + player.country.code);
		$('.flag-name').text(player.country.name);
		$('.player-rating').text(player.rating);

		$('.achievements').html('');
		for (let i = 0; i < player.achievements.length; i++) {
			let achievement = player.achievements[i];
			$('.achievements').append(
				`<div class="achievement enabled" id=${achievement.id}>
					<div class="overlay">${achievement.description}</div>
					<img src=${achievement.icon}>
				</div>`
			);
		}
		
	});

}

export default function renderProfile(name) {
	$('.page').removeClass('visible');
	
	$('#profile-page').addClass('visible');
	
	profileJS(name);
}