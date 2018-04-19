/* global chrome */

const $ = require('jquery');

$(function () {
  $('#test').click(function () {
    console.log("HIIYAA")
    var userKey = 0;
    var appName = 'commonapp';
    // NOTE appName is only a temporary measure. AppId will ensure that
    // the app is unique
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
    action: 'login',
    appKey: appName,
    userKey: userKey,
    appAuth
  });
}
