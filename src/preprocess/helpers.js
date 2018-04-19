/* global chrome */

const $ = require('jquery');

module.exports = {

  sendMsg: function(tabId, json, callback) {
    chrome.tabs.query({ currentWindow: true, active: true }, function() {
      chrome.tabs.sendMessage(tabId, json, callback);
      console.log("Message sent: " + JSON.stringify(json));
    });
  },

  injectAndSend: function(tabId, fileNames, command, msg, callback) {
    // NOTE: the following code does not work for firefox. See its documentation
    // on executeScript
    console.log("Injecting and sending scripts...");
    if (Array.isArray(fileNames)) {
      exports.executeScripts(tabId, fileNames,
        () => module.exports.sendMsg(tabId, $.extend({}, { command: command }, msg), callback));
    } else {
      // Probably a string
      chrome.tabs.executeScript(tabId, { file: fileNames },
        () => module.exports.sendMsg(tabId, $.extend({}, { command: command }, msg), callback));
    }
  },

  open: function(tabId, url, callback) {
    chrome.tabs.query({ currentWindow: true, active: true }, function() {
      console.log(`Redirecting to '${url}'`);
      chrome.tabs.update(tabId, { url: url }, callback);
    });
  },

  newTab: function(url, callback, toStore) {
    console.log("Creating new tab...");
    chrome.tabs.create({ url: url }, tab => {
      if (toStore) toStore.id = tab.id;
      callback(tab.id);
    });
  },

  getUrl: function(base, path) {
    if (!path) {
      return null;
    } else {
      return base + path;
    }
  },

  executeScripts: function(tabId, fileNames, finalCallback) {
    function createCallback(tabId, fileName, innerCallback) {
      return function() {
        chrome.tabs.executeScript(tabId, { file: fileName }, innerCallback);
      };
    }

    var nestedCallback = () => finalCallback(tabId);

    for (var i = fileNames.length - 1; i >= 0; --i)
      nestedCallback = createCallback(tabId, fileNames[i], nestedCallback);

    if (nestedCallback !== null)
      nestedCallback(); // execute outermost function
  },

  isOfDomain: function(url, base) {
    // TODO check if url is out of the domain of base
    return (extractRootDomain(url) === extractRootDomain(base));
  }
};

// FROM STACKOVERFLOW
function extractRootDomain(url) {
  var domain = extractHostname(url),
    splitArr = domain.split('.'),
    arrLen = splitArr.length;

  //extracting the root domain here
  //if there is a subdomain 
  if (arrLen > 2) {
    domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
    //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
    if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
      //this is using a ccTLD
      domain = splitArr[arrLen - 3] + '.' + domain;
    }
  }
  return domain;
}

function extractHostname(url) {
  var hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("://") > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }

  //find & remove port number
  hostname = hostname.split(':')[0];
  //find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
}
// END