'user strict';

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'login') {
      Promise.all([getAppInfo(request.appKey), getUserInfo(request.userKey)])
        .then(matchForm)
        .catch(failToGetInfo());
      // chrome.tabs.create({ url: appInfo.url },
      //   tab => handleNewTab($.extend({}, tab, matchedForm));
      // });
    }
  }
);

// TODO handle error
function failToGetInfo() {
  console.log('Failed to get info');
}

// NOTE this looks very simple now because it is for testing. In production
// this needs to make ajax call to our database
function getAppInfo(appKey) {
  return $.getJSON('tests/app.json');
}

// NOTE same as getAppInfo
function getUserInfo(userKey) {
  return $.getJSON('tests/user.json');
}

// Matches the application form to the user form for convenience of filling later.
function matchForm(dataArr) {
  let appInfo = dataArr[0],
  let userInfo = dataArr[1];
  // TODO merge them
}

function handleNewTab(tab) {
  executeScripts(tab.id, [
      { file: 'js/jquery.min.js' },
      { file: 'js/content.js' }
    ],
    startLogin);
}

function injectContent(tabId) {
  chrome.tabs.executeScript(tabId, { file: 'js/content.js' }, function () {
    console.log('content injected.');
  });
}

function startLogin(tabId) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabId, { action: 'login' });
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
