$(document).ready(function() {

	$('#login-form').submit(function(){
		let name = $('#name').val();
		localStorage.setItem('pixelLegionsName', name);

		return true;
	});

});