"use strict";

var appInfo;
var userInfo;
var gForm;
var loginInfo;

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'login') {
      login(request.appKey, request.userKey, request.app_auth)
        .then(startProcess);
    }
  });

// Initial condition: appKey, userKey, and auth all exist
function login(appKey, userKey, auth) {
  loginInfo = auth;
  return Promise.all([getAppInfo(appKey), getUserInfo(userKey)])
    .catch(failToGetInfo)
    .then(processForms)
    .then(createNewTab)
    .then(sendLogin)
    .catch(failToLogin);
}

// Initial condition: user has logged in and is at the home url
function startProcess() {

}

// TODO handle error
function failToGetInfo(err) {
  console.log(err);
}

// TODO handle error
function failToLogin(err) {
  console.log(err);
}


// Merge the app and user data into something easily parsable
// Handle auth
function processForms() {
  // Duplicate app using shallow copying
  gForm = $.extend({}, appInfo);

  // Get necessary login values
  // NOTE this is kind of tedious, but this allows data flattening
  loginInfo.username = appInfo.username;
  loginInfo.password = appInfo.password;
  loginInfo.loginBtn = appInfo.loginBtn;

  // Clear process array
  gForm.process = [];
  var oldPrc = appInfo.process;
  var pLen = oldPrc.length;
  var newI = 0;
  let p;
  let userVal;
  let temp;
  let key;
  for (let i = 0; i < pLen; i++) {
    p = oldPrc[i];
    key = p.userkey;
    delete p.userkey;
    if (!p.action || p.action === 'f') {
      userVal = user[key];
      if (userVal) {
        p.value = userVal;
        gForm.process[newI++] = p;
      } else {
        console.log(`User does not have attribute ${key}`);
      }
    } else if (p.action === 'c' || p.action === 'r') {
      gForm.process[newI++] = p;
    }
  }
}

function createNewTab() {
  return new Promise(function (resolve, reject) {
    // Use a virtual schema for url
    chrome.tabs.create({ url: (gForm.origin + gForm.login) },
      tab => injectLoginScripts(tab, resolve));
  });
}

function injectLoginScripts(tab, resolve) {
  // TODO error handling
  executeScripts(tab.id, [
      { file: 'js/jquery.min.js' },
      { file: 'js/loginInjection.js' }
    ],
    resolve
  );
}

function sendLogin(tabId) {
  // TODO error handling
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabId, $.extend({}, loginInfo, { action: 'login' }));
  });
}

/* TODO this looks very simple now because it is for testing. In production
 * this needs to make ajax call to our database. Additionally, it might be
 * better to move getAppInfo and getUserInfo to .js
 */
function getAppInfo(appKey) {
  return new Promise(function (resolve, reject) {
    $.getJSON('storage/app.json').then(function (data) {
      appInfo = data[appKey];
      resolve();
    }, reject);
  });
}

// NOTE same as getAppInfo
function getUserInfo(userKey) {
  // Of course we're not gonna get the entire user base in reality, ha, ha.
  return new Promise(function (resolve, reject) {
    $.getJSON('storage/user.json').then(function (data) {
      userInfo = data[userKey];
      resolve();
    }, reject);
  });
}

// Helper methods ===========================================================

function executeScripts(tabId, injectDetailsArray, finalCallback) {
  function createCallback(tabId, injectDetails, innerCallback) {
    return function () {
      chrome.tabs.executeScript(tabId, injectDetails, innerCallback);
    };
  }

  var nestedCallback = function () { finalCallback(tabId) };

  for (var i = injectDetailsArray.length - 1; i >= 0; --i)
    nestedCallback = createCallback(tabId, injectDetailsArray[i], nestedCallback);

  if (nestedCallback !== null)
    nestedCallback(); // execute outermost function
}
