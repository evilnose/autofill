"use strict";

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'login') {
      console.log(request.username);
      console.log(request.username_val);
      $(request.username).val(request.username_val);
      $(request.password).val(request.password_val);
      $(request.loginBtn).trigger('click');
      // $('a[href="/ca4app#!c/0/11?sid=3"]').trigger('click');
    }
  }
);
