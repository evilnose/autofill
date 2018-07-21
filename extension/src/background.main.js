/* global chrome */
import ProcessManager from './background/processManager';
import Messaging from "./messaging";

const constants = require('./background/constants.js');

const manager = new ProcessManager();

/*** Main message listener ***/
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request._source !== Messaging.Source.UI) {
            return;
        }
        switch (request.action) {
            case 'start':
                manager.startProcess(
                    request.processObj, request.userInfo, request.authObj, request.skipLogin, request.debug);
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
