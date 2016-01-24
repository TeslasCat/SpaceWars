$(function() {
	var $sidebar = $('#sidebar'),
		$handle = $sidebar.children('.sidebar-handle');

	$handle.on('click', function(e) {
		$sidebar.toggleClass('sidebar--open');
	});
});