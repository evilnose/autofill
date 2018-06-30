/* global chrome */

import $ from 'jquery';
import '../scss/app.scss';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// import 'angular/angular.min.js';

$(function () {
  $('#test').click(function () {
    let userKey = 0;
    let appName = 'commonapp';
    // NOTE appName is only a temporary measure. AppId will ensure that
    // the angular-app is unique
    getUserAuth(userKey, appName)
      .then(auth => sendTestMessage(auth, userKey, appName));
  });
});

// TODO actually get the data from server
function getUserAuth(userKey, appName) {
  // Of course we're not gonna get the entire user base in reality, ha, ha.
  return new Promise(function (resolve, reject) {
    $.getJSON('./sample_data/user.json').then(
      data => resolve(data[userKey].auth[appName]), reject);
  });
}

function sendTestMessage(appAuth, userKey, appName) {
  chrome.runtime.sendMessage({
    action: 'toLogin',
    appKey: appName,
    userKey: userKey,
    appAuth
  });
}
