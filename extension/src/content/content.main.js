/* global chrome */
const actionProcessor = require('./runner');
import Messaging from '../common/messaging';

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request._source !== Messaging.Source.BACKGROUND) {
            return;
        }
        console.log("Message received from background.");
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

