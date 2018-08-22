/* global chrome */

import Messaging from "../common/messaging";

const constants = require('./constants');

export function sendMsg(tabId, json, callback) {
    chrome.tabs.query({currentWindow: true}, function () {
        chrome.tabs.sendMessage(tabId, json, () => {
            if (callback) callback();
        });
    });
}

export function sendCommand(tabId, command, callback) {
    setTimeout(() => {
        sendMsg(tabId, {
            _source: Messaging.Source.BACKGROUND,
            command: command,
            action: 'run_cmd',
        }, callback);
    }, constants.DELAY_AFTER_INJECT);
}

export function inject (tabId, fileNames, callback) {
    console.log("Injecting and sending scripts..." + tabId);
    if (Array.isArray(fileNames)) {
        executeScripts(tabId, fileNames, callback);
    } else {
        // Probably a string
        chrome.tabs.executeScript(tabId, {file: fileNames}, callback);
    }
}

export function open (tabId, url, callback) {
    chrome.tabs.query({currentWindow: true, active: true}, function () {
        if (!url) {
            console.error("URL is null.");
        } else {
            console.log(`Routing to '${url}'`);
        }
        chrome.tabs.update(tabId, {url: url}, callback);
    });
}

export function newTab (url, callback) {
    if (!url) {
        console.error("The given url is null.");
        return;
    }
    chrome.tabs.create({url: url}, tab => {
        callback(tab.id);
    });
}

export function getUrl (base, path) {
    if (!path) {
        return null;
    } else {
        return base + path;
    }
}

export function executeScripts (tabId, fileNames, finalCallback) {
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
}

export function isOfDomain (url, base) {
    // TODO check if url is out of the domain of base
    return (extractRootDomain(url) === extractRootDomain(base));
}

export function isUrlAbsolute(url) {
    const pat = /^https?:\/\//i;
    return pat.test(url);
}

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

export class StatusLogger {
    constructor() {
        this.sessionInfo = {
            logs: '',
        };
        this.debug = false;
    }

    updateInfo(update, replaceLogs) {
        update.logs += "\n";
        if (replaceLogs) {
            Object.assign(this.sessionInfo, update);
        } else {
            update.logs = this.sessionInfo.logs + update.logs;
            this.updateInfo(update, true);
        }
        this.sendInfo();
    }

    appendLogs(logStr, contribOnly, omitNewLine) {
        if (!contribOnly || this.debug) {
            // Only update logs if this message is not intended for contributors only OR if this is a debug session
            // (which is prob run by a contributor)
            this.sessionInfo.logs += logStr + (omitNewLine ? "" : "\n");
        }
        this.sendInfo();
    }

    sendInfo() {
        chrome.runtime.sendMessage({
            _source: Messaging.Source.BACKGROUND,
            action: "update_status",
            sessionInfo: this.sessionInfo,
        });
    }
}