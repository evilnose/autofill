OPT_SEP = ';'; // separates action, selector, val, etc. in process
SEL_SEP = '='; // separates fieldname and fieldval in special fields
APP_AUTH_IND = '@'; // indicates that this userkey is for app authentication
INTP_IND = '{$}'; // in target, indicates that this is to be replaced by userVal
FORMAT_IND = '>';

PROCESS_SCRIPTS_PATHS = [
	'common/jquery.min.js',
	'content/node_selector.js',
	'content/command_executor.js',
	'content/content_process.js',
	'content/command_receiver.js',
	// 'selenium/selenium-api.js',
	// 'selenium/selenium-browserbot.js',
	// 'selenium/selenium-commandhandlers.js',
	// 'content/jquery-sendkeys/bililiteRange.js',
	// 'content/jquery-sendkeys/index.js'
];