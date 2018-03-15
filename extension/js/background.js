"use strict";

var g_tabId;
var g_ri;
var g_inProgress = false;
const sep = ',';

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    switch (request.action) {
    case 'login':
      login(request.appKey, request.appAuth)
        .then(res => startProcesses(res, request.appKey, request.userKey));
      break;
    case 'badlogin':
      // TODO Handle user failed login
      break;
    case 'skiplogin':
      // TODO handle user has already logged in
      break;

    }
  });

function login(appKey, auth) {
  return getLoginInfo(appKey, auth)
    .catch(failToGetInfo)
    .then(prepLoginTab)
    .catch(failToPrepLogin)
    .then(sendLogin)
    .catch(failToLogin);
}

// Initial condition: user has logged in and is at the home url
function startProcesses(response, appKey, userKey) {
  // for (let i = 0; i < g_rIndices.length - 1; i++) {
  //   // startPageProcess(tabId, form.slice(g_rIndices[i], g_rIndices[i+1]));
  // }
  return Promise.all([getAppInfo(appKey), getUserInfo(userKey)])
    .then(processForms)
    .then(addTabMsgSeq)
}

/* Given an array of messages, send them to the tab one-by-one. Note that each
 * message ends with a redirect, so the function waits till each message has
 * been executed, the tab has redirected, and the page has loaded then runs the
 * next message
 */
function addTabMsgSeq(msgArr) {

}

function getLoginInfo(appKey, auth) {
  return new Promise(function (resolve, reject) {
    $.getJSON('storage/app.json',
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
          url: app.origin + app.login
        };
        resolve(loginInfo);
      });
  });
}

function prepLoginTab(loginInfo) {
  return createNewTab(loginInfo.url)
    .then(injectLoginScripts)
    .then(() => { return loginInfo });
}

function sendLogin(loginInfo) {
  // TODO error handling
  return new Promise(function (resolve) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.sendMessage(g_tabId,
        $.extend({}, loginInfo, { action: 'login' }),
        resolve);
    });
  });
}

// TODO handle error
function failToGetInfo(err) {
  console.log("Fail to get info handler not done.");
  console.log(err);
}

// TODO handle error
function failToLogin(err) {
  console.log("Fail to login handler not done.");
  console.log(err);
}

// TODO handle error
function failToPrepLogin(err) {
  console.log("Fail to prep login handler not done.");
  console.log(err);
}

// Merge the app and user data into something easily parsable
// Handle auth
/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
function processForms(dataArr) {
  var [app, user] = dataArr;

  // Duplicate app using shallow copying
  var form = $.extend({}, app);

  // Reinit global vars
  g_ri = [0];

  // Clear process array
  form.process = [];
  var oldPrc = app.process;
  var pLen = oldPrc.length;
  var newI = 0;
  let p;
  let userVal;
  let userKey;
  let action;
  let selector;
  for (let i = 0; i < pLen; i++) {
    p = oldPrc[i];
    [action, selector, userKey] = p.split(sep);

    if (!action || action === 'f') {
      userVal = user[userKey];
      if (userVal) {
        form.process[newI++] = {
          action: action,
          selector: selector,
          val: userVal
        }
      } else {
        console.log(`User does not have attribute ${userKey}`);
      }
    } else {
      form.process[newI++] = {
        action: action,
        selector: selector
      };

      if (action === 'r')
        g_ri.push(newI + 1);
    }
  }
  return;
}

function createNewTab(url) {
  return new Promise(function (resolve, reject) {
    // Use a virtual schema for url
    chrome.tabs.create({ url: url }, tab => {
      g_tabId = tab.id;
      resolve();
    });
  });
}

function injectLoginScripts() {
  // TODO error handling
  return new Promise(function (resolve, reject) {
    executeScripts(g_tabId, [
        { file: 'js/jquery.min.js' },
        { file: 'js/loginInjection.js' }
      ],
      resolve
    );
  });

  /* If all apps turn out to use id, use the following code without jquery
   * for speed
   */
  // executeScript(tab.id, {
  //   file: chrome.runtime.getURL('js/loginInjection.js')
  // }, resolve);
}

function sendProcess(tabId, form) {
  // TODO error handling
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabId, $.extend({}, form, { action: 'process' }));
    return tabId;
  });
}

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
    $.getJSON('storage/user.json').then(data => resolve(data[userKey]));
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
