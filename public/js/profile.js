import $ from 'jquery';

export default function renderProfile() {
	$('.page').removeClass('visible');
	
	$('#profile-page').addClass('visible');
	
	profileJS();
}