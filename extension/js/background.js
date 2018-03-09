'user strict';

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'login') {
      Promise.all([getAppInfo(request.appKey), getUserInfo(request.userKey)])
        .catch(failToGetInfo)
        .then(matchForm)
        .then(createNewTab)
        .then((tabId, form) => startLogin(tabId, form));
    }
  });

// TODO handle error
function failToGetInfo(err) {
  console.log(err);
}

// Matches the application form to the user form for convenience of filling later.
function matchForm(dataArray) {
  let appInfo = dataArray[0],
    userInfo = dataArray[1];
  // TODO merge them
  return { little: "shit", url: 'https://apply.commonapp.org/login' };
}

function createNewTab(form) {
  return new Promise(function (resolve, reject) {
    chrome.tabs.create({ url: form.url },
      tab => injectScripts(tab, form, resolve));
  });
}

function injectScripts(tab, form, resolve) {
  // TODO error handling
  executeScripts(tab.id, [
      { file: 'js/jquery.min.js' },
      { file: 'js/injected.js' }
    ],
    tabId => resolve(tabId, form)
  );
}

function startLogin(tabId, form) {
  // TODO error handling
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabId, $.extend({}, { action: 'login' }, form));
  });
}

/* NOTE this looks very simple now because it is for testing. In production
 * this needs to make ajax call to our database. Additionally, it might be
 * better to move getAppInfo and getUserInfo to injected.js
 */
function getAppInfo(appKey) {
  return $.getJSON('tests/app.json');
}

// NOTE same as getAppInfo
function getUserInfo(userKey) {
  return $.getJSON('tests/user.json');
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
