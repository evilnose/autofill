"use strict";

/*** CONSTANTS ***/
var Atfl = {
  SEP: ';',
  SEL_SEP: '@',
  LOGIN_SCRIPT_PATH: 'js/loginInjection.js',
  PROCESS_SCRIPT_PATH: 'js/processInjection.js',
  JQ: 'js/jquery.min.js'
}

/*** Main message listener ***/
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
    default:
      console.log(`ERROR: Do not recognize action message '${request.action}'.`);
      break;
    }
  });

/*** LOGIN PROMISE CHAIN ***/
function login(appKey, auth) {
  console.log("Starting login process...");
  return getLoginInfo(appKey, auth)
    .catch(failToGetInfo)
    .then(prepLoginTab)
    .catch(failToPrepLogin)
    .then(sendLogin)
    .catch(failToSendLogin);
}

/*** PROCESSES PROMISE CHAIN ***/
function startProcesses(response, appKey, userKey) {
  // Initial condition: user has logged in and is at the home url
  console.log("Starting form-filling process...");
  return Promise.all([getAppInfo(appKey), getUserInfo(userKey)])
    .then(processForms)
    .then(startFormSeq);
}


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
    $.getJSON('storage/user.json').then(data => resolve(data[userKey]));
  });
}

function getLoginInfo(appKey, auth) {
  console.log("Getting login info...");
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
          url: app.base + app.login
        };
        resolve(loginInfo);
      });
  });
}

/*** LOGIN FUNCTIONS ***/
function injectLoginScripts() {
  // TODO error handling
  return new Promise(function (resolve, reject) {
    executeScripts(Atfl.tabId, [
        { file: Atfl.JQ },
        { file: Atfl.LOGIN_SCRIPT_PATH }
      ],
      resolve
    );
  });
}

function prepLoginTab(loginInfo) {
  console.log("Prepping login tab...");
  return createNewTab(loginInfo.url)
    .then(injectLoginScripts)
    .then(() => { return loginInfo });
}

function sendLogin(loginInfo) {
  console.log("Sending login signal...");
  // TODO error handling
  return new Promise(function (resolve, reject) {
    sendMsg($.extend({}, loginInfo, { action: 'login' }),
      res => verifyLogin(res, resolve, reject));
  });
}

function verifyLogin(res, success, failure) {
  chrome.tabs.onUpdated.addListener(function waitForLogin(tabId, changeInfo) {
    if (changeInfo.status === 'complete') {
      // TODO verify logged in. Or, if not possible to do here,
      // do it somewhere else
      if (res && res.state === 'done') {
        console.log("Login complete and loaded.");
        success();
        chrome.tabs.onUpdated.removeListener(waitForLogin);
      } else {
        failure();
      }
    } else {
      // TODO what happens then?
    }
  });
}
/*** PROCESSES FUNCTIONS ***/

/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
function processForms(dataArr) {
  console.log("Processing forms...");
  var app, user;
  [app, user] = dataArr;

  // Duplicate app using shallow copying
  var info = $.extend({}, app);

  var seg = [];

  // Clear process array
  info.process = [];
  var oldPrc = app.process;
  var pLen = oldPrc.length;
  var flag, action, selector, userKey, userVal;
  var offset = 0;
  for (let i = 0; i < pLen; i++) {
    [action, selector, userKey] = oldPrc[i].split(Atfl.SEP);
    flag = action.startsWith('-') ? action.substr(0, 2) : null;
    action = flag ? action.substring(2) : action;
    // Handle actions
    switch (action) {
    case 'f':
      userVal = user[userKey];
      if (userVal) {
        info.process.push({
          flag: flag,
          action: action,
          selector: selector,
          val: userVal
        });
        handleFlag(i - offset, flag, action);
      } else {
        console.log(`User does not have attribute ${userKey}`);
        offset++;
      }
      break;
    case 'c':
      if (selector.startsWith('_')) {
        // If the selector selects by value instead of name. For detailed
        // syntax, check 'application file format' in Drive.
        var optionName;
        [fieldKey, optionVal] = userKey.substring(1).split(SEL_SEP);
        var fieldVal = user[fieldKey];
        if (fieldVal) {
          if (fieldVal === optionVal) {
            // User has the field value, and the field value matches the option
            // value, so click.
            info.process.push({
              flag: flag,
              action: action,
              selector: selector
            });
            handleFlag(i - offset, flag, action, selector);
          } else {
            // Doesn't match, skip this process.
            offset++;
          }
        } else {
          console.log(`User does not have attribute ${fieldKey}`);
          offset++;
        }
      } else {
        info.process.push({
          flag: flag,
          action: action,
          selector: selector
        });
        handleFlag(i, flag, action, selector);
      }
      break;
    case 'r':
      // Redirect is already handled in handleFlag
      offset++;
      handleFlag(i, flag, action, selector);
      break;
    default:
      console.log(`ERROR: action not found: ${action}`);
    }
  }

  function handleFlag(i, flag, act, selector) {
    // Handle flags
    switch (flag) {
    case '-n':
      // If new page is loaded after the action
      // If action is redirect, add the path for the redirect later
      seg.push({ i: i - offset + 1, action: act, path: act === 'r' ? selector : null });
      break;
    }
  }
  console.log(`Info len: ${info.process.length}\
  \nApp len: ${app.process.length}\nOffset: ${offset}`);
  seg.push({ i: info.process.length });
  console.assert(info.process.length === app.process.length - offset,
    "ERROR: offset incorrect.");
  console.log("Segments: " + JSON.stringify(seg));
  console.log("Process: " + JSON.stringify(info.process));
  info.segments = seg;
  return info;
}

/* Given an array of messages, send them to the tab one-by-one. Note that each
 * message ends with a redirect, so the function waits till each message has
 * been executed, the tab has redirected, and the page has loaded then runs the
 * next message
 */
function startFormSeq(info) {
  console.log("Starting form sequence...");
  chrome.tabs.onUpdated.addListener((function () {
    console.log("Update listener for processes added.");
    var idx = 0;
    var seg = info.segments;
    /* We need to make sure two things in order to begin the next sequence
     * segment: 1) the tab is in a new page (i.e. url changed) and 2) the tab
     * has finished loading. The tab loads later than it changes url, so a state
     * machine is employed.
     */
    var newPageLoading = false;
    Atfl.tabLoadHandler = function (tabId, changeInfo) {
      // Make sure the tab's url has changed.
      if (changeInfo.url) {
        console.log("New page loading...URL: " + changeInfo.url);
        if (isNewDomain(changeInfo.url, info.base)) {
          interrupt('new domain');
          return;
        }
        newPageLoading = true;
      }

      if (newPageLoading && changeInfo.status === 'complete') {
        console.log("New page loaded.");
        newPageLoading = false;
        if (idx < seg.length) {
          prepAndSend(info, idx++);
        }
      }
    }
    return Atfl.tabLoadHandler;
  })());
  redirect(info.base + info.home);
}

function isNewDomain(url, base) {
  // TODO check if url is out of the domain of base
  return false;
}

function interrupt(reason) {
  // TODO handle interruption
  console.log(`Process interrupted. Reason: ${reason}`);
}

/* Send the sequence at the indicated index. If the newPage sequence at the end
 * is a redirect, update the tab url after the messageListener receives an OK
 * from the tab, indicating that the process is done. If the last action is
 * click, then it means that the tab automatically loads a new page, then the
 * listener is not required. Regardless, there's an onLoad listener on the outside.
 */
function prepAndSend(info, idx) {
  console.log("Prepping and sending...Current index: " + idx);
  // Get the index of the process one after the last newPage
  var seg = info.segments;
  var s = seg[idx];
  var iStart = (idx === 0) ? 0 : seg[idx - 1].i;
  var iEnd = s.i;
  var action = s.action;
  console.log(`Starting process index: ${iStart}. Ending: ${iEnd}`);

  if (iStart === info.process.length) {
    processComplete();
  } else {
    var process = info.process.slice(iStart, iEnd);
    var newUrl = s.path ? (info.base + s.path) : null;

    if (process.length) {
      injectAndSend([
          { file: Atfl.JQ },
          { file: Atfl.PROCESS_SCRIPT_PATH }
        ], 'start_prc', { prc: process },
        res => handleTabResponse(res, process, newUrl, (idx === seg.length - 1)));
    }
  }
}

function handleTabResponse(res, prc, newUrl, isLast) {
  if (res) {
    // TODO handle message
    console.log("Received response from tab: " + JSON.stringify(res));
    if (isLast) {
      // The process is complete.
      processComplete();
    } else {
      if (newUrl) {
        redirect(newUrl);
      }
    }
  } else {
    // TODO handle issue
    failToDoProcess(prc);
  }
}

/*** AFTER PROCESSES ***/
function processComplete() {
  // TODO what happens when the form-sending process is complete?
  console.log("Form-sending process complete.")
  processCleanup();
}

function processCleanup() {
  chrome.tabs.onUpdated.removeListener(Atfl.tabLoadHandler);
}

/*** ERROR HANDLERS ***/

// TODO handle failure to login in loginInjection
function failToLogin() {
  console.log("Fail to login (in injection) handler not done.");
}

function failToDoProcess(prc) {
  console.error("Fail to do process handler not done.", prc);
  processCleanup();
}

// TODO handle error
function failToGetInfo(err) {
  console.log("Fail to get info handler not done.");
  console.log(err);
}

// TODO handle error
function failToSendLogin(err) {
  console.log("Fail to send login handler not done.");
  console.log(err);
}

// TODO handle error
function failToPrepLogin(err) {
  console.log("Fail to prep login handler not done.");
  console.log(err);
}

/*** HELPERS ***/
function injectAndSend(details, action, msg, callback) {
  executeScripts(Atfl.tabId, details,
    () => sendMsg($.extend({}, { action: action }, msg), callback));
}

function sendMsg(json, callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(Atfl.tabId, json, function (res) {
      console.log("Message sent: " + JSON.stringify(json));
      callback(res);
    });
  });
}

function redirect(url, callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    console.log(`Redirecting to '${url}'`);
    chrome.tabs.update(Atfl.tabId, { url: url }, callback);
  });
}

function createNewTab(url) {
  return new Promise(function (resolve, reject) {
    // Use a virtual schema for url
    chrome.tabs.create({ url: url }, tab => {
      Atfl.tabId = tab.id;
      resolve();
    });
  });
}

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
