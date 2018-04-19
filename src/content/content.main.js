/* global chrome */

const runProcess = require('./runProcess.js');

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("Message received.");
    switch (request.command) {
    case 'start_prc':
      runProcess(request.prc, request.auto_route, sendResponse);
    }
  }
);
