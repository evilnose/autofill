/* global chrome */

const actionProcessor = require('./actionProcessor.js');

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log("Message received.");
		switch (request.action) {
			case 'run_cmd':
				actionProcessor.runCommand(request.command, sendResponse);
		}
	}
);

(function () {
	chrome.runtime.sendMessage({ state: 'injected' });
})();

