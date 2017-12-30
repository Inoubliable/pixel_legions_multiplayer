$(document).ready(function() {

	$('#login-form').submit(function(){
		var name = $('#name').val();
		localStorage.setItem('pixelLegionsName', name);

		return true;
	});

});