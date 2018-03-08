'use strict';

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // $( window ).load(alert('login'));
    if (request.action === 'login') {
      alert('boiii');
      // $.getJSON('test/form.json', function (data) {
      //   $('#ApplicantEmailAddress').val(data.username);
      //   $('#ApplicantPassword').val(data.password);
      // });
      $('#ApplicantEmailAddress').val("ggarland33@gmail.com");
      $('#ApplicantPassword').val("Somewhere-317");
    }
  }
);
