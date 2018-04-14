"use strict";

function getElement(selStr) {
  // TODO handle <sib>
  return $(selStr);
}

function injectAndSend(tabId, details, command, msg, callback) {
  console.log("Injecting and sending scripts...");
  executeScripts(tabId, details,
    () => sendMsg(tabId, $.extend({}, { command: command }, msg), callback));
}

function sendMsg(tabId, json, callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabId, json, callback);
    console.log("Message sent: " + JSON.stringify(json));
  });
}

function open(tabId, url, callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    console.log(`Redirecting to '${url}'`);
    chrome.tabs.update(tabId, { url: url }, callback);
  });
}

function newTab(url, callback, toStore) {
  console.log("Creating new tab...")
  chrome.tabs.create({ url: url }, tab => {
    if (toStore)  toStore.id = tab.id;
    callback(tab.id)
  });
}

function getUrl(base, path) {
  if (!path) {
    return null;
  } else {
    return base + path;
  }
}

function executeScripts(tabId, injectDetailsArray, finalCallback) {
  function createCallback(tabId, injectDetails, innerCallback) {
    return function () {
      chrome.tabs.executeScript(tabId, {file: injectDetails}, innerCallback);
    };
  }

  var nestedCallback = function () { finalCallback(tabId) };

  for (var i = injectDetailsArray.length - 1; i >= 0; --i)
    nestedCallback = createCallback(tabId, injectDetailsArray[i], nestedCallback);

  if (nestedCallback !== null)
    nestedCallback(); // execute outermost function
}
