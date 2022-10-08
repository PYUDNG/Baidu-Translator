const CONST = {
	Text: {
		TranslatorIniting: '正在初始化...',
		TranslatorReady: '初始化完毕',
		Translate: '翻译到中文',
		TranslateFile: '翻译txt文档',
		Translating: '正在翻译...',
		Reading: '正在读取文件...',
		FileSytaxError: '文件格式错误</br>仅接受txt文本文档',
		Success: '翻译完毕',
		Error: '发生了未知错误',
		Copied: '已复制',
		Downloaded: '已开始下载',
		Emptied: '已清空',
		DefaultFilename: '翻译结果.txt',
	},
	Style: {
		DisabledColor: 'gray',
	}
}

window.addEventListener('load', function () {
	// Init Alertify
	alertify.set('notifier','position', 'top-right');

	// Init GUI
	window.transready ? ready() : initing();

	// Translate button
	const input = $('#input');
	const btnTrans = $('#btnTrans');
	btnTrans.addEventListener('click', translateInput);

	// Translate txt file button
	const btnFile = $('#btnFile');
	btnFile.addEventListener('click', translateTxtfile);

	// Copy translate result button
	const btnCopy = $('#copy');
	btnCopy.addEventListener('click', copyInput);

	// Download translate result button
	const btnDownload = $('#download');
	btnDownload.addEventListener('click', dlInput);

	// Empty 
	const btnEmpty = $('#empty');
	btnEmpty.addEventListener('click', emptyInput);

	function initing() {
		const allBtns = $All('.button');
		allBtns.forEach((btn) => disable(btn));
		alertify.notify(CONST.Text.TranslatorIniting);
		window.addEventListener('transready', ready);
	}

	function ready() {
		const allBtns = $All('.button');
		allBtns.forEach(enable);
		alertify.success(CONST.Text.TranslatorReady);
	}

	function translateInput() {
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
	}

	function translateTxtfile() {
		// Create new <input type="file">
		const fileInput = $CrE('input');
		fileInput.type = 'file';
		fileInput.addEventListener('change', fileChange);

		// Create new reader
		const reader = new FileReader();
		reader.onload = readerOnload;

		// Trigger file selector
		fileInput.click();

		function fileChange() {
			const file = fileInput.files[0];
			btnDownload.filename = file.name;
			if (file.type !== 'text/plain') {
				alertify.error(CONST.Text.FileSytaxError);
				return false;
			}
			reader.readAsText(file);
			disable(btnFile, CONST.Text.Reading);
		}

		function readerOnload() {
			const text = reader.result;
			input.value = text;
			translateInput();
			enable(btnFile);
		};
	}

	function copyInput() {
		copyText(input.value);
		alertify.success(CONST.Text.Copied);
	}

	function dlInput() {
		downloadText(input.value, btnDownload.filename || CONST.Text.DefaultFilename);
		alertify.success(CONST.Text.Downloaded);
	}

	function emptyInput() {
		input.value = '';
		alertify.success(CONST.Text.Emptied);
	}
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

function enable(btn) {
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

// Save text to textfile
function downloadText(text, name) {
	if (!text || !name) {return false;};

	// Get blob url
	const blob = new Blob([text],{type:"text/plain;charset=utf-8"});
	const url = URL.createObjectURL(blob);

	// Create <a> and download
	const a = $CrE('a');
	a.href = url;
	a.download = name;
	a.click();
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