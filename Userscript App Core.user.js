/* eslint-disable no-multi-spaces */

// ==UserScript==
// @name               Userscript App Core
// @name:zh-CN         用户脚本应用核心
// @name:en            Userscript App Core
// @namespace          Userscript-App
// @version            0.3
// @description        Userscript App Core For Userscript Web Apps
// @description:zh-CN  用户脚本网页应用核心
// @description:en     Userscript App Core For Userscript Web Apps
// @author             PY-DNG
// @license            GPL-v3
// @match              http*://*/*
// @connect            *
// @grant              GM_info
// @grant              GM_addStyle
// @grant              GM_addElement
// @grant              GM_deleteValue
// @grant              GM_listValues
// @grant              GM_addValueChangeListener
// @grant              GM_removeValueChangeListener
// @grant              GM_setValue
// @grant              GM_getValue
// @grant              GM_log
// @grant              GM_getResourceText
// @grant              GM_getResourceURL
// @grant              GM_registerMenuCommand
// @grant              GM_unregisterMenuCommand
// @grant              GM_openInTab
// @grant              GM_xmlhttpRequest
// @grant              GM_download
// @grant              GM_getTab
// @grant              GM_saveTab
// @grant              GM_getTabs
// @grant              GM_notification
// @grant              GM_setClipboard
// @grant              GM_info
// @grant              unsafeWindow
// ==/UserScript==

(function __MAIN__() {
    'use strict';

	// function DoLog() {}
	// Arguments: level=LogLevel.Info, logContent, trace=false
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
			let [level, logContent, trace] = parseArgs([...arguments], [
				[2],
				[1,2],
				[1,2,3]
			], [LogLevel.Info, 'DoLog initialized.', false]);

			// Log when log level permits
			if (level <= DoLog.logLevel) {
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

				if (++DoLog.logCount > 512) {
					console.clear();
					DoLog.logCount = 0;
				}
				console[trace ? 'trace' : 'log'](msg, subst, logContent);
			}
		}
	}) ();

	main();
	function main() {
		unsafeWindow.GM_grant = GM_grant;
		unsafeWindow.dispatchEvent(new Event('gmready'));
	}

	function GM_grant(name) {
		const GMFuncs = {
			// Tampermonkey provides
			GM_addStyle: typeof GM_addStyle === 'function' ? GM_addStyle : null,
			GM_addElement: typeof GM_addElement === 'function' ? GM_addElement : null,
			GM_deleteValue: typeof GM_deleteValue === 'function' ? GM_deleteValue : null,
			GM_listValues: typeof GM_listValues === 'function' ? GM_listValues : null,
			GM_addValueChangeListener: typeof GM_addValueChangeListener === 'function' ? GM_addValueChangeListener : null,
			GM_removeValueChangeListener: typeof GM_removeValueChangeListener === 'function' ? GM_removeValueChangeListener : null,
			GM_setValue: typeof GM_setValue === 'function' ? GM_setValue : null,
			GM_getValue: typeof GM_getValue === 'function' ? GM_getValue : null,
			GM_log: typeof GM_log === 'function' ? GM_log : null,
			GM_getResourceText: typeof GM_getResourceText === 'function' ? GM_getResourceText : null,
			GM_getResourceURL: typeof GM_getResourceURL === 'function' ? GM_getResourceURL : null,
			GM_registerMenuCommand: typeof GM_registerMenuCommand === 'function' ? GM_registerMenuCommand : null,
			GM_unregisterMenuCommand: typeof GM_unregisterMenuCommand === 'function' ? GM_unregisterMenuCommand : null,
			GM_openInTab: typeof GM_openInTab === 'function' ? GM_openInTab : null,
			GM_xmlhttpRequest: typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : null,
			GM_download: typeof GM_download === 'function' ? GM_download : null,
			GM_getTab: typeof GM_getTab === 'function' ? GM_getTab : null,
			GM_saveTab: typeof GM_saveTab === 'function' ? GM_saveTab : null,
			GM_getTabs: typeof GM_getTabs === 'function' ? GM_getTabs : null,
			GM_notification: typeof GM_notification === 'function' ? GM_notification : null,
			GM_setClipboard: typeof GM_setClipboard === 'function' ? GM_setClipboard : null,
			GM_info: typeof GM_info === 'object' ? GM_info : null,
		};
		if (GMFuncs.hasOwnProperty(name)) {
			return GMFuncs[name];
		} else {
			return null;
		}
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
})();