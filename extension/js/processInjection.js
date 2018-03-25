"use strict";

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("Message received.");
    switch (request.action) {
    case 'start_prc':
      startProcess(request.prc, sendResponse);
    }
  }
);

function startProcess(process, sendRes) {
  console.log("Process loaded: " + JSON.stringify(process));
  // TODO If the last action is redirect, don't do it and send the response after
  // it. If the last action is click, send response before it and then click it.
  sendRes({ state: 'received' });
}
