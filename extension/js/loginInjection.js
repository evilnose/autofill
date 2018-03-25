"use strict";

$(console.log("Injected."));

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("Message received.");
    switch (request.action) {
    case "login":
      sendResponse({state: 'received'});
      $(request.username).val(request.username_val);
      $(request.password).val(request.password_val);
      $(request.loginBtn).trigger('click');
      // $('a[href="/ca4app#!c/0/11?sid=3"]').trigger('click');
      break;
    default:
      console.log(`ERROR: Do not recognize action message '${request.action}'.`);
    }
  }
);
