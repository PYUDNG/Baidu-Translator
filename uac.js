detectDom('body', function() {
	const CONST = {
		Text: {
			EnterPassword: '输入用户脚本应用核心密码: '
		},
		key: 'UserscriptAppCore-Password'
	}

	console.log('UAC working mode: ' + (window.UAC ? 'direct' : 'event'));
	window.UAC ? work() : window.addEventListener('uac-client-ready', e => work);

	function work() {
		const correct = window.UAC.check(localStorage.getItem(CONST.key, 'UserscriptAppCore-Password'));
		correct ? ready() : enterPswd(ready, true);

		function ready() {
			window.GM_grant = GM_grant;
			window.dispatchEvent(new Event('uac-client-ready'));
		}
	}

	function GM_grant(name) {
		const pswd = localStorage.getItem(CONST.key);
		const pswdCorrect = window.UAC.check(pswd);

		if (pswdCorrect) {
			return window.UAC.grant(name, pswd);
		} else {
			enterPswd(pswd => location.reload(), true);
			return null;
		}
	}

	function enterPswd(callback, force=false) {
		const oldPswd = localStorage.getItem(CONST.key) || '';
		const onSuccess = pswd => {
			localStorage.setItem(CONST.key, pswd);
			callback(pswd);
		};
		const onFail = e => force && setTimeout(e => enterPswd(callback, force));

		alertify.prompt(CONST.Text.EnterPassword, oldPswd || '',
			(e, pswd) => window.UAC.check(pswd) ? onSuccess(pswd) : onFail(e),
			e => onFail(e)
		);
	}
});