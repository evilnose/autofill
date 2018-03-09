'use strict';

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'login') {
      alert('Script injection successful.');
      $('#ApplicantEmailAddress').val("ggarland33@gmail.com");
      $('#ApplicantPassword').val("Somewhere-317");
    }
  }
);
