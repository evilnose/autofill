/* global chrome */
import ProcessManager from './background/processManager';
const constants = require('./background/constants.js');

const manager = new ProcessManager();

/*** Main message listener ***/
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (!request.action) {
            return;
        }
        switch (request.action) {
            case 'start':
                if (request.skipLogin)
                    manager.startProcess(request.appKey, request.userKey, request.appAuth, false);
                else
                    manager.startProcess(request.appKey, request.userKey, null, true);
                break;
            case 'end':
                manager.endProcess();
                break;
            case 'bad-login':
                // TODO Handle user failed login
                break;
            default:
                console.log(`ERROR: Do not recognize action message '${request.action}'.`);
                break;
        }
    });

chrome.browserAction.onClicked.addListener(() => {
    window.open(chrome.runtime.getURL(constants.INDEX_HTML_PATH));
});
