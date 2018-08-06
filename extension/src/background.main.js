/* global chrome */
import Session from './background/session';
import Messaging from "./common/messaging";

const constants = require('./background/constants.js');

/*** Main message listener ***/
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request._source !== Messaging.Source.UI) {
            return;
        }
        switch (request.action) {
            case 'start':
                Session.getInstance().startOver(
                    request.processObj, request.userInfo, request.authObj, request.skipLogin, request.debug);
                break;
            case 'end':
                Session.getInstance().interrupt();
                break;
            case 'bad-login':
                // TODO Handle user failed login
                break;
            case 'fetch_status':
                chrome.runtime.sendMessage({
                    _source: Messaging.Source.BACKGROUND,
                    action: 'update_status',
                    sessionInfo: Session.getInstance().sessionInfo,
                });
                break;
            default:
                console.log(`ERROR: Do not recognize action message '${request.action}'.`);
                break;
        }
    });

chrome.browserAction.onClicked.addListener(() => {
    window.open(chrome.runtime.getURL(constants.INDEX_HTML_PATH));
});
