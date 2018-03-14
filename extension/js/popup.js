$(function () {
  $('#test').click(function () {
    var userKey = 0;
    var appName = 'commonapp';
    // NOTE appName is only a temporary measure. AppId will ensure that
    // the app is unique
    getUserAuth(userKey, appName)
      .then(auth => sendTestMessage(auth, userKey, appName));
  });
});

function getUserAuth(userKey, appName) {
  // Of course we're not gonna get the entire user base in reality, ha, ha.
  return new Promise(function (resolve, reject) {
    $.getJSON('storage/user.json').then(
      data => resolve(data[userKey][`auth_${appName}`]), reject);
  });
}

function sendTestMessage(app_auth, userKey, appName) {
  chrome.runtime.sendMessage({
    action: 'login',
    appKey: appName,
    userKey: userKey,
    app_auth
  });
}
