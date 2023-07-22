(function() {
	console.log('Translator working mode: ' + (window.GM_grant ? 'direct' : 'event'));
	window.transready = false;
	window.GM_grant ? work() : window.addEventListener('gmready', work);

	function work() {
		console.log('Translator working...')

		const BDT = new BaiduTranslateAPI(function() {
			window.dispatchEvent(new Event('transready'));
			window.transready = true;
		});
		window.baidu_translate = baidu_translate;

		function baidu_translate() {
			// Check BDT ready
			if (!BDT.gtk || !BDT.token) {
				//throw new Error('BaiduTranslateAPI not ready');
				return false;
			}

			// Get argument
			const [text, src, dst, callback, onparamload, onerror, split, retry] = parseArgs([...arguments], [
				function(args, defaultValues) {
					const details = args[0];
					['text', 'src', 'dst', 'callback', 'onerror', 'split', 'retry'].map((prop, i) => details.hasOwnProperty(prop) ? details[prop] : defaultValues[i])
				},
				[1,4],
				[1,4,6],
				[1,4,5,6],
				[1,4,5,6,7],
				[1,3,4,5,6,7],
				[1,2,3,4,5,6,7],
				[1,2,3,4,5,6,7,8]
			], ['', undefined, undefined, function() {}, function() {}, function() {}, 5000, 3]);

			// Split lines
			const textarr = text.replaceAll('\r\n', '\n').replaceAll('\n\r', '\n').replaceAll('\r', '\n').split('\n');
			if (textarr.some((t) => (t.length > split))) {
				throw new Error('Some paragraph is longer than given split length (' + split + ')');
			}

			// Prepare
			const AM = new AsyncManager();
			const result = [];
			AM.onfinish = function() {
				callback(result.map(re => '\n'.repeat(re.newline_begin) + re.dst + '\n'.repeat(re.newline_end)).join('\n'));
			}

			// Send requests
			let index = 0;
			while (textarr.length > 0) {
				// Join translate api paragraph
				let para = '';
				while (textarr.length > 0 && para.length + textarr[0].length < split) {
					para += '\n' + textarr.shift();
				}
				para = para.substr(1);

				// Whether this paragraph contains \n at beginning
				const countNewLine = str => str.split('').filter(t => t === '\n').length;
				const newline_begin = countNewLine(para.match(/^\s*/) ? para.match(/^\s*/)[0] : '');
				const newline_end = countNewLine(para.match(/^\s*/) ? para.match(/\s*$/)[0] : '');
				result[index] = {src: para, dst: null, newline_begin, newline_end};

				// API request
				AM.add();
				BDT.translate({
					text: para,
					args: [index],
					src: src,
					dst: dst,
					onerror: onerror,
					retry: retry,
					callback: function(json, i) {
						const temp_result = json.trans_result.data.reduce(function(pre, cur) {
							return (pre.push('\n'.repeat(cur.prefixWrap) + cur.dst), pre);
						}, []).join('\n');
						result[i].dst = temp_result;
						AM.finish();

						onparamload(AM.taskCount);
					}
				});
				index++;
			}
			AM.finishEvent = true;

			return true;
		}

		function BaiduTranslateAPI(initCallback) {
			const BT = this;
			const GM_xmlhttpRequest = window.GM_grant('GM_info').scriptHandler === 'Tampermonkey' ? window.GM_grant('GM_xmlhttpRequest') : GMXHRHook(3, window.GM_grant('GM_xmlhttpRequest'));
			BT.gtk = BT.token = null;

			init(initCallback);

			BT.calcSign = calcSign;
			BT.translate = translate;

			async function translate(details) {
				const callback = details.callback;
				const text = details.text;
				const src = details.src || await langDetect(text);
				const dst = details.dst || 'zh';
				const onerror = details.onerror || function() {};
				const retry = details.retry || 0;
				const args = details.args || [];

				GM_xmlhttpRequest({
					method: 'POST',
					url: 'https://fanyi.baidu.com/v2transapi',
					headers: {
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					data: toQueryString({
			            'from': src,
			            'to': dst,
			            'query': text,
			            'simple_means_flag': 3,
			            'sign': calcSign(text),
			            'token': BT.token
			        }),
					onload: function(response) {
						response.status !== 200 && Err(response);
						const json = JSON.parse(response.responseText);
						json.error && Err(json);
						callback.apply(null, [json].concat(args));

						function Err(e) {
							!_onerror(e) && console.log('Retrying...\nleft: ' + (retry-1).toString());
							console.log(e);
							throw new Error('Server returned with an error (logged above)');
						}
					},
					onerror: _onerror,
					ontimeout: _onerror,
					onabort: _onerror,
				});

				// Returns true for error, false for retry
				function _onerror(e) {
					console.log('sign = ' + calcSign(text));
					if (retry > 0) {
						setTimeout(retryRequest.bind(null, e), 500);
						return false;
					}
					onerror(e);
					return true;
				}

				function retryRequest(e) {
					translate({
						callback: callback,
						text: text,
						src: src,
						dst: dst,
						onerror: onerror,
						retry: retry - 1,
						args: args
					});
				}
			}

			function langDetect(text) {
				return new Promise((resolve, reject) => {
					GM_xmlhttpRequest({
						method: 'POST',
						url: 'https://fanyi.baidu.com/langdetect',
						headers: {
							'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						data: toQueryString({'query': text}),
						onload: function(response) {
							const json = JSON.parse(response.responseText);
							resolve(json.lan);
						},
						onerror: function(e) {reject(e)},
						ontimeout: function(e) {reject(e)},
						onabort: function(e) {reject(e)},
					});
				});
			}

			// Calc sign based on query-text and gtk
			function calcSign(query) {
				function a(r, o) {
				    for (var t = 0; t < o.length - 2; t += 3) {
				        var a = o.charAt(t + 2);
				        a = a >= "a" ? a.charCodeAt(0) - 87 : Number(a),
				        a = "+" === o.charAt(t + 1) ? r >>> a: r << a,
				        r = "+" === o.charAt(t) ? r + a & 4294967295 : r ^ a
				    }
				    return r
				}
				var C = null;
				var token = function(r, _gtk) {
				    var o = r.length;
				    o > 30 && (r = "" + r.substr(0, 10) + r.substr(Math.floor(o / 2) - 5, 10) + r.substring(r.length, r.length - 10));
				    var t = void 0,
				    t = null !== C ? C: (C = _gtk || "") || "";
				    for (var e = t.split("."), h = Number(e[0]) || 0, i = Number(e[1]) || 0, d = [], f = 0, g = 0; g < r.length; g++) {
				        var m = r.charCodeAt(g);
				        128 > m ? d[f++] = m: (2048 > m ? d[f++] = m >> 6 | 192 : (55296 === (64512 & m) && g + 1 < r.length && 56320 === (64512 & r.charCodeAt(g + 1)) ? (m = 65536 + ((1023 & m) << 10) + (1023 & r.charCodeAt(++g)), d[f++] = m >> 18 | 240, d[f++] = m >> 12 & 63 | 128) : d[f++] = m >> 12 | 224, d[f++] = m >> 6 & 63 | 128), d[f++] = 63 & m | 128)
				    }
				    for (var S = h,
				    u = "+-a^+6",
				    l = "+-3^+b+-f",
				    s = 0; s < d.length; s++) S += d[s],
				    S = a(S, u);

				    return S = a(S, l),
				    S ^= i,
				    0 > S && (S = (2147483647 & S) + 2147483648),
				    S %= 1e6,
				    S.toString() + "." + (S ^ h)
				}

				return token(query, BT.gtk);
			}

			function toQueryString(obj) {
				const USP = new URLSearchParams();
				for (const [key, value] of Object.entries(obj)) {
					USP.append(key, value);
				}
				return USP.toString();
			}

			// Request token and gtk
			function init(callback) {
				// Request twice, make sure gtk is latest,
				// or may get 998 error while requesting translate API
				requestIndex(requestIndex.bind(null, function(html) {
					BT.token = html.match(/token: ["'](.*?)["'],/)[1];
					BT.gtk = html.match(/window.gtk = ["'](.*?)["'];/)[1];
					callback();
				}));

				function requestIndex(callback) {
					const url = 'https://fanyi.baidu.com';
					GM_xmlhttpRequest({
						method: 'GET',
						headers: {
							'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
						},
						url: url,
						onload: function(response) {
							callback(response.responseText);
						}
					});
				}
			}
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
	}
}) ();