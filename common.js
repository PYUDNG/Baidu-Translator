let [
	// Console & Debug
	LogLevel, DoLog, Err,

	// DOM
	$, $All, $CrE, $AEL, $$CrE, addStyle, detectDom, destroyEvent,

	// Data
	copyProp, copyProps, parseArgs, escJsStr, replaceText,

	// Environment & Browser
	getUrlArgv, dl_browser,

	// Logic & Task
	AsyncManager,
] = (function() {
	// function DoLog() {}
	// Arguments: level=LogLevel.Info, logContent, logger='log'
	const [LogLevel, DoLog] = (function() {
		const LogLevel = {
			None: 0,
			Error: 1,
			Success: 2,
			Warning: 3,
			Info: 4,
		};

		return [LogLevel, DoLog];
		function DoLog() {
			// Get window
			const win = (typeof(unsafeWindow) === 'object' && unsafeWindow !== null) ? unsafeWindow : window;

			const LogLevelMap = {};
			LogLevelMap[LogLevel.None] = {
				prefix: '',
				color: 'color:#ffffff'
			}
			LogLevelMap[LogLevel.Error] = {
				prefix: '[Error]',
				color: 'color:#ff0000'
			}
			LogLevelMap[LogLevel.Success] = {
				prefix: '[Success]',
				color: 'color:#00aa00'
			}
			LogLevelMap[LogLevel.Warning] = {
				prefix: '[Warning]',
				color: 'color:#ffa500'
			}
			LogLevelMap[LogLevel.Info] = {
				prefix: '[Info]',
				color: 'color:#888888'
			}
			LogLevelMap[LogLevel.Elements] = {
				prefix: '[Elements]',
				color: 'color:#000000'
			}

			// Current log level
			DoLog.logLevel = (win.isPY_DNG && win.userscriptDebugging) ? LogLevel.Info : LogLevel.Warning; // Info Warning Success Error

			// Log counter
			DoLog.logCount === undefined && (DoLog.logCount = 0);

			// Get args
			let [level, logContent, logger] = parseArgs([...arguments], [
				[2],
				[1,2],
				[1,2,3]
			], [LogLevel.Info, 'DoLog initialized.', 'log']);

			let msg = '%c' + LogLevelMap[level].prefix + (typeof GM_info === 'object' ? `[${GM_info.script.name}]` : '') + (LogLevelMap[level].prefix ? ' ' : '');
			let subst = LogLevelMap[level].color;

			switch (typeof(logContent)) {
				case 'string':
					msg += '%s';
					break;
				case 'number':
					msg += '%d';
					break;
				default:
					msg += '%o';
					break;
			}

			// Log when log level permits
			if (level <= DoLog.logLevel) {
				// Log to console when log level permits
				if (level <= DoLog.logLevel) {
					if (++DoLog.logCount > 512) {
						console.clear();
						DoLog.logCount = 0;
					}
					console[logger](msg, subst, logContent);
				}
			}
		}
	}) ();

	// type: [Error, TypeError]
	function Err(msg, type=0) {
		throw new [Error, TypeError][type]((typeof GM_info === 'object' ? `[${GM_info.script.name}]` : '') + msg);
	}

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

	// Append a style text to document(<head>) with a <style> element
	// arguments: css | css, id | parentElement, css, id
	// remove old one when id duplicates with another element in document
    function addStyle() {
    	// Get arguments
    	const [parentElement, css, id] = parseArgs([...arguments], [
    		[2],
    		[2,3],
    		[1,2,3]
    	], [document.head, '', null]);

    	// Make <style>
		const style = $CrE("style");
		style.textContent = css;
		id !== null && (style.id = id);
		id !== null && $(`#${id}`) && $(`#${id}`).remove();

		// Append to parentElement
        parentElement.appendChild(style);
		return style;
    }

	// Get callback when specific dom/element loaded
	// detectDom({[root], selector, callback[, once]}) | detectDom(selector, callback) | detectDom(root, selector, callback) | detectDom(root, selector, callback, attributes) | detectDom(root, selector, callback, attributes, once)
	function detectDom() {
		let [root, selectors, callback, attributes, once] = parseArgs([...arguments], [
			function(args, defaultValues) {
				const arg = args[0];
				return ['root', 'selector', 'callback', 'attributes', 'once'].map((prop, i) => arg.hasOwnProperty(prop) ? arg[prop] : defaultValues[i]);
			},
			[2,3],
			[1,2,3],
			[1,2,3,4],
			[1,2,3,4,5]
		], [document, [''], e => Err('detectDom: callback not found'), false, true]);
		!Array.isArray(selectors) && (selectors = [selectors]);

		if (select(root, selectors)) {
			for (const elm of selectAll(root, selectors)) {
				callback(elm);
				if (once) {
					return null;
				}
			}
		}

		const observer = new MutationObserver(mCallback);
		observer.observe(root, {
			childList: true,
			subtree: true,
			attributes,
		});

		function mCallback(mutationList, observer) {
			const addedNodes = mutationList.reduce((an, mutation) => {
				switch (mutation.type) {
					case 'childList':
						an.push(...mutation.addedNodes);
						break;
					case 'attributes':
						an.push(mutation.target);
						break;
				}
				return an;
			}, []);
			const addedSelectorNodes = addedNodes.reduce((nodes, anode) => {
				if (anode.matches && match(anode, selectors)) {
					nodes.add(anode);
				}
				const childMatches = anode.querySelectorAll ? selectAll(anode, selectors) : [];
				for (const cm of childMatches) {
					nodes.add(cm);
				}
				return nodes;
			}, new Set());
			for (const node of addedSelectorNodes) {
				callback(node);
				if (once) {
					observer.disconnect();
					break;
				}
			}
		}

		function selectAll(elm, selectors) {
			!Array.isArray(selectors) && (selectors = [selectors]);
			return selectors.map(selector => [...$All(elm, selector)]).reduce((all, arr) => {
				all.push(...arr);
				return all;
			}, []);
		}

		function select(elm, selectors) {
			const all = selectAll(elm, selectors);
			return all.length ? all[0] : null;
		}

		function match(elm, selectors) {
			return !!elm.matches && selectors.some(selector => elm.matches(selector));
		}

		return observer;
	}

	// Just stopPropagation and preventDefault
	function destroyEvent(e) {
		if (!e) {return false;};
		if (!e instanceof Event) {return false;};
		e.stopPropagation();
		e.preventDefault();
	}

	// Object1[prop] ==> Object2[prop]
	function copyProp(obj1, obj2, prop) {obj1[prop] !== undefined && (obj2[prop] = obj1[prop]);}
	function copyProps(obj1, obj2, props) {(props || Object.keys(obj1)).forEach((prop) => (copyProp(obj1, obj2, prop)));}

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

	// escape str into javascript written format
	function escJsStr(str, quote='"') {
		str = str.replaceAll('\\', '\\\\').replaceAll(quote, '\\' + quote).replaceAll('\t', '\\t');
		str = quote === '`' ? str.replaceAll(/(\$\{[^\}]*\})/g, '\\$1') : str.replaceAll('\r', '\\r').replaceAll('\n', '\\n');
		return quote + str + quote;
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

	// Get a url argument from location.href
	// also recieve a function to deal the matched string
	// returns defaultValue if name not found
    // Args: {url=location.href, name, dealFunc=((a)=>{return a;}), defaultValue=null} or 'name'
	function getUrlArgv(details) {
        typeof(details) === 'string'    && (details = {name: details});
        typeof(details) === 'undefined' && (details = {});
        if (!details.name) {return null;};

        const url = details.url ? details.url : location.href;
        const name = details.name ? details.name : '';
        const dealFunc = details.dealFunc ? details.dealFunc : ((a)=>{return a;});
        const defaultValue = details.defaultValue ? details.defaultValue : null;
		const matcher = new RegExp('[\\?&]' + name + '=([^&#]+)');
		const result = url.match(matcher);
		const argv = result ? dealFunc(result[1]) : defaultValue;

		return argv;
	}

	// Save dataURL to file
	function dl_browser(dataURL, filename) {
		const a = document.createElement('a');
		a.href = dataURL;
		a.download = filename;
		a.click();
	}

	function AsyncManager() {
		const AM = this;

		// Ongoing xhr count
		this.taskCount = 0;

		// Whether generate finish events
		let finishEvent = false;
		Object.defineProperty(this, 'finishEvent', {
			configurable: true,
			enumerable: true,
			get: () => (finishEvent),
			set: (b) => {
				finishEvent = b;
				b && AM.taskCount === 0 && AM.onfinish && AM.onfinish();
			}
		});

		// Add one task
		this.add = () => (++AM.taskCount);

		// Finish one task
		this.finish = () => ((--AM.taskCount === 0 && AM.finishEvent && AM.onfinish && AM.onfinish(), AM.taskCount));
	}

	return [
		// Console & Debug
		LogLevel, DoLog, Err,

		// DOM
		$, $All, $CrE, $AEL, $$CrE, addStyle, detectDom, destroyEvent,

		// Data
		copyProp, copyProps, parseArgs, escJsStr, replaceText,

		// Environment & Browser
		getUrlArgv, dl_browser,

		// Logic & Task
		AsyncManager,
	];
})();