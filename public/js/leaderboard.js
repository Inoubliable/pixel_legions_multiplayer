import $ from 'jquery';

export default function renderLeaderboard() {
	$('.page').removeClass('visible');
	
	$('#leaderboard-page').addClass('visible');
	
	leaderboardJS();
}