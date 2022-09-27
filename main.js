window.addEventListener('load', function () {
	const input = $('#input');
	const btn = $('#btnTrans');
	btn.addEventListener('click', function() {
		baidu_translate(input.value, function(text) {
			input.value = text;
		});
	});
});

// Basic functions
// querySelector
function $() {
	switch (arguments.length) {
		case 2:
			return arguments[0].querySelector(arguments[1]);
			break;
		default:
			return document.querySelector(arguments[0]);
	}
}
// querySelectorAll
function $All() {
	switch (arguments.length) {
		case 2:
			return arguments[0].querySelectorAll(arguments[1]);
			break;
		default:
			return document.querySelectorAll(arguments[0]);
	}
}
// createElement
function $CrE() {
	switch (arguments.length) {
		case 2:
			return arguments[0].createElement(arguments[1]);
			break;
		default:
			return document.createElement(arguments[0]);
	}
}