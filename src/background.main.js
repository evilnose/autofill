/* global chrome */

const processFlow = require('./preprocess/processFlow.js');

/*** Main message listener ***/
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (!request.action) {
      return;
    }
    switch (request.action) {
    case 'login':
      processFlow.startProcesses(request.appKey, request.userKey, request.appAuth, false);
      break;
    case 'badlogin':
      // TODO Handle user failed login
      break;
    case 'skiplogin':
      // TODO handle user has already logged in
      processFlow.startProcesses(request.appKey, request.userKey, null, true);
      break;
    default:
      console.log(`ERROR: Do not recognize action message '${request.action}'.`);
      break;
    }
  });
