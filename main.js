const CONST = {
	Text: {
		TranslatorIniting: '正在初始化...',
		TranslatorReady: '初始化完毕',
		Translate: '翻译到中文',
		TranslateFile: '翻译txt文档',
		TranslatStart: '正在翻译...',
		Translating: '正在翻译（剩余{Rest}段）',
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

	// Vars
	let filename = CONST.Text.DefaultFilename;

	// Translate button
	const input = $('#input');
	const btnTrans = $('#btnTrans');
	$AEL(btnTrans, 'click', translateInput);

	// Translate txt file button
	const btnFile = $('#btnFile');
	$AEL(btnFile, 'click', translateTxtfile);
	$AEL(document.body, 'paste', translateTxtfile);

	// Copy translate result button
	const btnCopy = $('#copy');
	$AEL(btnCopy, 'click', copyInput);

	// Copy translate result button
	const btnName = $('#name');
	$AEL(btnName, 'click', copyFilename);

	// Download translate result button
	const btnDownload = $('#download');
	$AEL(btnDownload, 'click', dlInput);

	// Empty 
	const btnEmpty = $('#empty');
	$AEL(btnEmpty, 'click', emptyInput);

	function initing() {
		const allBtns = $All('.button');
		allBtns.forEach((btn) => disable(btn));
		alertify.notify(CONST.Text.TranslatorIniting);
		$AEL(window, 'transready', ready);
	}

	function ready() {
		const allBtns = $All('.button');
		allBtns.forEach(enable);
		alertify.success(CONST.Text.TranslatorReady);
	}

	function translateInput() {
		// Button status
		if (btnTrans.disabled) {return false;}
		disable(btnTrans, CONST.Text.TranslatStart);

		// Translate
		const box = alertify.message(CONST.Text.TranslatStart, 0)
		baidu_translate(input.value, function(text) {
			input.value = text;
			box.dismiss();
			alertify.success(CONST.Text.Success);
			enable(btnTrans);
			!isMobile() && setTimeout(e => {
				input.focus();
				input.setSelectionRange(0, 0);
				input.scrollTo(0, 0);
			});
		}, function(rest) {
			box.setContent(replaceText(CONST.Text.Translating, { '{Rest}': rest.toString() }));
		}, function(err) {
			alertify.error(CONST.Text.Error);
			box.dismiss();
			enable(btnTrans);
		});
	}

	function translateTxtfile(e) {
		// Create new reader
		const reader = new FileReader();
		reader.onload = readerOnload;

		// Deal file
		if (e.type === 'click') {
			// Create new <input type="file">
			const fileInput = $CrE('input');
			fileInput.type = 'file';
			$AEL(fileInput, 'change', e => fileGot(fileInput.files[0]));
			// Trigger file selector
			fileInput.click();
		} else if (e.type === 'paste') {
			fileGot(e.clipboardData.files[0]);
		}

		

		function fileGot(file) {
			if (!file) { return false; }
			if (file.type !== 'text/plain') {
				alertify.error(CONST.Text.FileSytaxError);
				return false;
			}
			filename = file.name;
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

	function copyFilename() {
		copyText(filename);
		alertify.success(CONST.Text.Copied);
	}

	function dlInput() {
		const GM_download = GM_grant('GM_download');
		//downloadText_GM(input.value, filename); // <-- Not working in xbrowser
		downloadText(input.value, filename);
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
	switch(arguments.length) {
		case 2:
			return arguments[0].querySelector(arguments[1]);
			break;
		default:
			return document.querySelector(arguments[0]);
	}
}
// querySelectorAll
function $All() {
	switch(arguments.length) {
		case 2:
			return arguments[0].querySelectorAll(arguments[1]);
			break;
		default:
			return document.querySelectorAll(arguments[0]);
	}
}
// createElement
function $CrE() {
	switch(arguments.length) {
		case 2:
			return arguments[0].createElement(arguments[1]);
			break;
		default:
			return document.createElement(arguments[0]);
	}
}
// addEventListener
function $AEL(...args) {
	const target = args.shift();
	return target.addEventListener.apply(target, args);
}
function $$CrE() {
	const [tagName, props, attrs, classes, styles, listeners] = parseArgs([...arguments], [
		function(args, defaultValues) {
			const arg = args[0];
			return {
				'string': () => [arg, ...defaultValues.filter((arg, i) => i > 0)],
				'object': () => ['tagName', 'props', 'attrs', 'classes', 'styles', 'listeners'].map((prop, i) => arg.hasOwnProperty(prop) ? arg[prop] : defaultValues[i])
			}[typeof arg]();
		},
		[1,2],
		[1,2,3],
		[1,2,3,4],
		[1,2,3,4,5]
	], ['div', {}, {}, [], {}, []]);
	const elm = $CrE(tagName);
	for (const [name, val] of Object.entries(props)) {
		elm[name] = val;
	}
	for (const [name, val] of Object.entries(attrs)) {
		elm.setAttribute(name, val);
	}
	for (const cls of Array.isArray(classes) ? classes : [classes]) {
		elm.classList.add(cls);
	}
	for (const [name, val] of Object.entries(styles)) {
		elm.style[name] = val;
	}
	for (const listener of listeners) {
		$AEL(...[elm, ...listener]);
	}
	return elm;
}
function parseArgs(args, rules, defaultValues=[]) {
	// args and rules should be array, but not just iterable (string is also iterable)
	if (!Array.isArray(args) || !Array.isArray(rules)) {
		throw new TypeError('parseArgs: args and rules should be array')
	}

	// fill rules[0]
	(!Array.isArray(rules[0]) || rules[0].length === 1) && rules.splice(0, 0, []);

	// max arguments length
	const count = rules.length - 1;

	// args.length must <= count
	if (args.length > count) {
		throw new TypeError(`parseArgs: args has more elements(${args.length}) longer than ruless'(${count})`);
	}

	// rules[i].length should be === i if rules[i] is an array, otherwise it should be a function
	for (let i = 1; i <= count; i++) {
		const rule = rules[i];
		if (Array.isArray(rule)) {
			if (rule.length !== i) {
				throw new TypeError(`parseArgs: rules[${i}](${rule}) should have ${i} numbers, but given ${rules[i].length}`);
			}
			if (!rule.every((num) => (typeof num === 'number' && num <= count))) {
				throw new TypeError(`parseArgs: rules[${i}](${rule}) should contain numbers smaller than count(${count}) only`);
			}
		} else if (typeof rule !== 'function') {
			throw new TypeError(`parseArgs: rules[${i}](${rule}) should be an array or a function.`)
		}
	}

	// Parse
	const rule = rules[args.length];
	let parsed;
	if (Array.isArray(rule)) {
		parsed = [...defaultValues];
		for (let i = 0; i < rule.length; i++) {
			parsed[rule[i]-1] = args[i];
		}
	} else {
		parsed = rule(args, defaultValues);
	}
	return parsed;
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

	// Revoke url
	//URL.revokeObjectURL(url); // <-- Not working in xbrowser
	setTimeout(URL.revokeObjectURL.bind(URL, url), 1000);
}

// Save text to textfile using GM_download
function downloadText_GM(text, name) {
	if (!text || !name) {return false;};
	if (typeof GM_download !== 'function' && typeof GM_grant !== 'function') {return false;}
	const GM_dl = typeof GM_download === 'function' ? GM_download : GM_grant('GM_download');

	// Get blob url
	const blob = new Blob([text],{type:"text/plain;charset=utf-8"});
	const url = URL.createObjectURL(blob);

	// Download and then revoke url
	GM_dl({
		url: url, 
		name: name,
		onload: URL.revokeObjectURL.bind(URL, url)
	});
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

// Replace model text with no mismatching of replacing replaced text
// e.g. replaceText('aaaabbbbccccdddd', {'a': 'b', 'b': 'c', 'c': 'd', 'd': 'e'}) === 'bbbbccccddddeeee'
//      replaceText('abcdAABBAA', {'BB': 'AA', 'AAAAAA': 'This is a trap!'}) === 'abcdAAAAAA'
//      replaceText('abcd{AAAA}BB}', {'{AAAA}': '{BB', '{BBBB}': 'This is a trap!'}) === 'abcd{BBBB}'
//      replaceText('abcd', {}) === 'abcd'
/* Note:
    replaceText will replace in sort of replacer's iterating sort
    e.g. currently replaceText('abcdAABBAA', {'BBAA': 'TEXT', 'AABB': 'TEXT'}) === 'abcdAATEXT'
    but remember: (As MDN Web Doc said,) Although the keys of an ordinary Object are ordered now, this was
    not always the case, and the order is complex. As a result, it's best not to rely on property order.
    So, don't expect replaceText will treat replacer key-values in any specific sort. Use replaceText to
    replace irrelevance replacer keys only.
*/
function replaceText(text, replacer) {
	if (Object.entries(replacer).length === 0) {return text;}
	const [models, targets] = Object.entries(replacer);
	const len = models.length;
	let text_arr = [{text: text, replacable: true}];
	for (const [model, target] of Object.entries(replacer)) {
		text_arr = replace(text_arr, model, target);
	}
	return text_arr.map((text_obj) => (text_obj.text)).join('');

	function replace(text_arr, model, target) {
		const result_arr = [];
		for (const text_obj of text_arr) {
			if (text_obj.replacable) {
				const splited = text_obj.text.split(model);
				for (const part of splited) {
					result_arr.push({text: part, replacable: true});
					result_arr.push({text: target, replacable: false});
				}
				result_arr.pop();
			} else {
				result_arr.push(text_obj);
			}
		}
		return result_arr;
	}
}

function isMobile() {
	var ua = navigator.userAgent.toLowerCase();
	var StringPhoneReg = "\\b(ip(hone|od)|android|opera m(ob|in)i" +
		"|windows (phone|ce)|blackberry" +
		"|s(ymbian|eries60|amsung)|p(laybook|alm|rofile/midp" +
		"|laystation portable)|nokia|fennec|htc[-_]" +
		"|mobile|up.browser|[1-4][0-9]{2}x[1-4][0-9]{2})\\b";
	var StringTableReg = "\\b(ipad|tablet|(Nexus 7)|up.browser" +
		"|[1-4][0-9]{2}x[1-4][0-9]{2})\\b";
	var isIphone = ua.match(StringPhoneReg),
	isTable = ua.match(StringTableReg);
	return !!isIphone || !!isTable;
}