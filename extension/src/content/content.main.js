/* global chrome */
import Messaging from '../common/messaging';

(function () {
    if (window.atflScriptInjected === true)
        return;

    const actionProcessor = require('./runner');

    window.atflScriptInjected = true;
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request._source !== Messaging.Source.BACKGROUND) {
                return;
            }
            // console.log("Message received from background.");
            switch (request.action) {
                case 'run_cmd':
                    actionProcessor.runCommand(request.command);
            }
        }
    );
})();
