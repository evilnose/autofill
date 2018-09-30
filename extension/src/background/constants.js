module.exports = {
    OPT_SEP: ';', // separates action, selector, val, etc. in process
    EQUALS: '==', // separates fieldname and fieldval in special fields
    APP_AUTH_IND: '@', // indicates that this userkey is for angular-app authentication
    INTP_START: '${', // indicates the start of interpolation
    INTP_END: '}', // indicates the end of interpolation
    FORMAT_IND: '|', // indictes that this value is to be formatted
    FLAG_IND: '-', // indicates that this action is flagged
    USER_DATA_REF: '$userData', // indicate reference to user data

    Message: {
        Implication: {
            BAD_LOGIN: 'bl',
        },
    },

    CONTENT_JS_PATH: './content.bundle.js',
    INDEX_HTML_PATH: './index.html',

    MAX_ACTION_TIMEOUT: 30000,
    CHECK_TIMEOUT_INTERVAL: 1000,
    DEFAULT_DELAY: 300,
    WAIT_DELAY: 5000,
    DELAY_AFTER_INJECT: 0,
    NEW_PAGE_DELAY: 1500,
    REDIRECTS_DELAY: 5000,
};
