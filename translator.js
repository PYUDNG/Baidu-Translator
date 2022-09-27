(function() {
	console.log('Translator working mode: ' + (window.GM_grant ? 'direct' : 'event'));
	window.GM_grant ? work() : window.addEventListener('gmready', work);

	function work() {
		console.log('Translator working...')

		const BDT = new BaiduTranslateAPI();
		window.baidu_translate = baidu_translate;

		function baidu_translate(text, callback, split=5000) {
			// Check BDT ready
			if (!BDT.gtk || !BDT.token) {
				throw new Error('BaiduTranslateAPI not ready');
			}

			// Split lines
			split = split ? split : Infinity;
			textarr = text.replaceAll(/[\n\r]+/g, '\n').split('\n');
			if (textarr.some((t) => (t.length > split))) {
				throw new Error('Some paragraph is longer than given split length (' + split + ')');
			}

			// Prepare
			const AM = new AsyncManager();
			const result = [];
			AM.onfinish = function() {
				callback(result.join(''));
			}

			// Send requests
			let index = 0;
			while (textarr.length > 0) {
				let t = '';
				while (textarr.length > 0 && t.length + textarr[0].length < split) {
					t += '\n' + textarr.shift();
				}
				AM.add();
				BDT.translate({
					text: t,
					args: [++index],
					callback: function(json, i) {
						const temp_result = json.trans_result.data.reduce(function(pre, cur) {
							return pre + '\n'.repeat(cur.prefixWrap+1) + cur.dst;
						}, '');
						result[i] = temp_result;
						AM.finish();
					}
				});
			}
			AM.finishEvent = true;
		}

		function BaiduTranslateAPI() {
			const BT = this;
			const GM_xmlhttpRequest = window.GM_grant('GM_xmlhttpRequest');
			BT.gtk = BT.token = null;

			init();

			BT.calcSign = calcSign;
			BT.translate = translate;

			async function translate(details) {
				const callback = details.callback;
				const text = details.text;
				const src = details.src || await langDetect(text);
				const dst = details.dst || 'zh';
				const args = details.args || [];

				GM_xmlhttpRequest({
					method: 'POST',
					url: 'https://fanyi.baidu.com/v2transapi',
					headers: {
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
						if (response.status !== 200) {
							console.log(response);
							throw new Error('Server returned with an error (logged above)');
						}
						const json = JSON.parse(response.responseText);
						callback.apply(null, [json].concat(args));
					}
				});
			}

			function langDetect(text) {
				return new Promise((resolve, reject) => {
					GM_xmlhttpRequest({
						method: 'POST',
						url: 'https://fanyi.baidu.com/langdetect',
						headers: {
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
			function init() {
				// Request twice, make sure gtk is latest,
				// or may get 998 error while requesting translate API
				requestIndex(requestIndex.bind(null, function(html) {
					BT.token = html.match(/token: ["'](.*?)["'],/)[1];
					BT.gtk = html.match(/window.gtk = ["'](.*?)["'];/)[1];
				}));

				function requestIndex(callback) {
					const url = 'https://fanyi.baidu.com';
					GM_xmlhttpRequest({
						method: 'GET',
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
	}
}) ();