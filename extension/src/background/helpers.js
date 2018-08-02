/* global chrome */

import Messaging from "../messaging";

const constants = require('./constants');

module.exports = {

    sendMsg: function (tabId, json, callback) {
        chrome.tabs.query({currentWindow: true}, function () {
            chrome.tabs.sendMessage(tabId, json, () => {
                console.log("Message sent: " + JSON.stringify(json));
                if (callback) callback();
            });
        });
    },

    sendCommand: function (tabId, command, callback) {
        setTimeout(() => {
            module.exports.sendMsg(tabId, {
                _source: Messaging.Source.BACKGROUND,
                command: command,
                action: 'run_cmd',
            }, callback);
        }, constants.DELAY_AFTER_INJECT);
    },

    inject: function (tabId, fileNames, callback) {
        console.log("Injecting and sending scripts...");
        if (Array.isArray(fileNames)) {
            exports.executeScripts(tabId, fileNames, callback);
        } else {
            // Probably a string
            chrome.tabs.executeScript(tabId, {file: fileNames}, callback);
        }
    },

    open: function (tabId, url, callback) {
        chrome.tabs.query({currentWindow: true, active: true}, function () {
            if (!url) {
                console.error("URL is null.");
            } else {
                console.log(`Redirecting to '${url}'`);
            }
            chrome.tabs.update(tabId, {url: url}, callback);
        });
    },

    newTab: function (url, callback) {
        if (!url) {
            console.error("The given url is null.");
            return;
        }
        console.log(`Creating new tab (url: ${url})...`);
        chrome.tabs.create({url: url}, tab => {
            callback(tab.id);
        });
    },

    getUrl: function (base, path) {
        if (!path) {
            return null;
        } else {
            return base + path;
        }
    },

    executeScripts: function (tabId, fileNames, finalCallback) {
        function createCallback(tabId, fileName, innerCallback) {
            return function () {
                chrome.tabs.executeScript(tabId, {file: fileName}, innerCallback);
            };
        }

        let nestedCallback = () => finalCallback(tabId);

        for (let i = fileNames.length - 1; i >= 0; --i)
            nestedCallback = createCallback(tabId, fileNames[i], nestedCallback);

        if (nestedCallback !== null)
            nestedCallback(); // execute outermost function
    },

    isOfDomain: function (url, base) {
        // TODO check if url is out of the domain of base
        return (extractRootDomain(url) === extractRootDomain(base));
    }
};

// FROM STACKOVERFLOW
function extractRootDomain(url) {
    let domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;

    //extracting the root domain here
    //if there is a subdomain
    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 2].length === 2 && splitArr[arrLen - 1].length === 2) {
            //this is using a ccTLD
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}

function extractHostname(url) {
    let hostname;
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