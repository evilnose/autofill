
module.exports = {
	OPT_SEP: ';', // separates action, selector, val, etc. in process
	SEL_SEP: '=', // separates fieldname and fieldval in special fields
	APP_AUTH_IND: '@', // indicates that this userkey is for app authentication
	INTP_IND: '{$}', // in target, indicates that this is to be replaced by userVal
	FORMAT_IND: '>', // indictes that this value is to be formatted
	FLAG_IND: '-', // indicates that this action is flagged

	CONTENT_JS_PATH: './content.bundle.js',

	MAX_ACTION_TIMEOUT: 10000,
	DEFAULT_DELAY: 50,
};