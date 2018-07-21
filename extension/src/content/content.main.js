/* global chrome */
const actionProcessor = require('./actionProcessor');
import Messaging from '../messaging';

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request._source !== Messaging.Source.BACKGROUND) {
            return;
        }
        console.log("Message received.");
        switch (request.action) {
            case 'run_cmd':
                actionProcessor.runCommand(request.command, sendResponse);
        }
    }
);

(function () {
    console.log("setup done");
    chrome.runtime.sendMessage({
        _source: Messaging.Source.CONTENT,
        state: 'injected'
    });
})();
