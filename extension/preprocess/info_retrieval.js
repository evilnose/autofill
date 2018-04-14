/*** INFO RETRIEVAL ***/
/* TODO this looks very simple now because it is for testing. In production
 * this needs to make ajax call to our database. Additionally, it might be
 * better to move getAppInfo and getUserInfo to .js
 */
function getAppInfo(appKey) {
  return new Promise(function (resolve, reject) {
    $.getJSON('storage/app.json').then(data => resolve(data[appKey]));
  });
}

// NOTE same as getAppInfo
function getUserInfo(userKey) {
  // Of course we're not gonna get the entire user base in reality, ha, ha.
  return new Promise(function (resolve, reject) {
    $.getJSON('../storage/user.json').then(data => resolve(data[userKey]));
  });
}

function getLoginInfo(appKey, auth) {
  console.log("Getting login info...");
  return new Promise(function (resolve, reject) {
    $.getJSON('../storage/app.json',
      function (data) {
        // we are not storing data[appKey] to g_app because this won't
        // be now it works with a remote database
        var app = data[appKey];

        // Get necessary login values
        // NOTE this is kind of tedious, but this allows data flattening
        var loginInfo = {
          username: app.username,
          password: app.password,
          username_val: auth.username_val,
          password_val: auth.password_val,
          loginBtn: app.loginBtn,
          url: app.base + app.login
        };
        resolve(loginInfo);
      });
  });
}
