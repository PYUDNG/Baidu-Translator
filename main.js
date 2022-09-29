const CONST = {
	Text: {
		Translate: '翻译到中文',
		TranslateFile: '翻译txt文档',
		Translating: '正在翻译…',
		Reading: '正在读取文件…',
		FileSytaxError: '文件格式错误</br>仅接受txt文本文档',
		Success: '翻译完毕',
		Error: '发生了未知错误',
		Copied: '已复制',
	},
	Style: {
		DisabledColor: 'gray',
	}
}

window.addEventListener('load', function () {
	alertify.set('notifier','position', 'top-right');

	// Translate button
	const input = $('#input');
	const btnTrans = $('#btnTrans');
	btnTrans.addEventListener('click', function() {
		// Button status
		if (btnTrans.disabled) {return false;}
		disable(btnTrans, CONST.Text.Translating);

		// Translate
		baidu_translate(input.value, function(text) {
			input.value = text;
			alertify.success(CONST.Text.Success);
			enable(btnTrans);
		}, function(err) {
			alertify.error(CONST.Text.Error);
			enable(btnTrans);
		});
	});

	// Translate txt file button
	const btnFile = $('#btnFile');
	const fileInput = $CrE('input');
	fileInput.type = 'file';
	const reader = new FileReader();
	btnFile.addEventListener('click', function() {
		fileInput.click();
	});
	fileInput.addEventListener('change', function() {
		const file = fileInput.files[0];
		if (file.type !== 'text/plain') {
			alertify.error(CONST.Text.FileSytaxError);
			return false;
		}
		reader.readAsText(file);
		disable(btnFile, CONST.Text.Reading);
	});
	reader.onload = function() {
		const text = reader.result;
		input.value = text;
		btnTrans.click();
		enable(btnFile);
	};

	// Copy translate result button
	const copy = $('#copy');
	copy.addEventListener('click', function() {
		copyText(input.value);
		alertify.success(CONST.Text.Copied);
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
// Enable/Disable buttons
function disable(btn, text) {
	if (btn.disabled) {
		return false;
	}
	
	btn.disabled = true;
	btn.style.background = CONST.Style.DisabledColor;
	if (text !== undefined) {
		btn.originText = btn.innerText;
		btn.innerText = text;
	}
	return true;
}

function enable(btn, text) {
	if (!btn.disabled) {
		return false;
	}

	btn.disabled = false;
	btn.style.background = '';
	if (btn.originText !== undefined) {
		btn.innerText = btn.originText;
	}
	return true;
}

// Copy text to clipboard (needs to be called in an user event)
function copyText(text) {
    // Create a new textarea for copying
    const newInput = $CrE('textarea');
    document.body.appendChild(newInput);
    newInput.value = text;
    newInput.select();
    document.execCommand('copy');
    document.body.removeChild(newInput);
}