"use strict";

/*** Main message listener ***/
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    switch (request.action) {
    case 'login':
      startProcesses(request.appKey, request.userKey, request.appAuth, false);
      break;
    case 'badlogin':
      // TODO Handle user failed login
      break;
    case 'skiplogin':
      // TODO handle user has already logged in
      startProcesses(request.appKey, request.userKey, null, true);
      break;
    default:
      console.log(`ERROR: Do not recognize action message '${request.action}'.`);
      break;
    }
  });
