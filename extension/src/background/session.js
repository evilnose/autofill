/* global chrome */
import Messaging from "../common/messaging";
import {WarningMap} from "./codeToText";
import {isBool, NodeType} from "../common/utils";

import {StatusLogger} from "./helpers";
import * as helpers from "./helpers";

const parser = require('./parser');
const constants = require('./constants');

const WaitingFor = {
    MESSAGE: 0,
    NEW_PAGE_LOAD: 1,
    LOCAL_CALL: 2,
};

export default class Session {
    constructor() {
        this.inSession = false;

        this.logger = new StatusLogger(true);
        this.logger.updateInfo({
            status: Messaging.SessionStatus.IDLE,
            logs: "Session ready. Standing by.",
            debugging: false,
        });
    }

    handleSuccess() {   // HA
        this.logger.updateInfo({
            status: Messaging.SessionStatus.SUCCEEDED,
            logs: "Session finished successfully.",
        });
        this._stopSession();
        this.logger.appendLogs(this.getSummaryStr());
    }

    handleFailure(errReason) {
        // I need to learn this trick
        this.logger.updateInfo({
            status: Messaging.SessionStatus.FAILED,
            logs: "\nSession did not complete successfully. However, your form could still be partially sent. See below for details.",
        });
        this._stopSession();
        this.logger.appendLogs(`The recorded reason for failure is: ${errReason}.`);
        let implicationMessage = null;
        switch (this.lastImplication) {
            case constants.Message.Implication.BAD_LOGIN:
                implicationMessage = "incorrect login credentials";
                break;
        }
        if (implicationMessage) {
            this.logger.appendLogs(`Additionally, the failure could possibly be caused by ${implicationMessage}.`);
        }
        this.logger.appendLogs(this.getSummaryStr());
    }

    static getInstance() {
        if (!this._sessionInstance) {
            this._sessionInstance = new Session();
        }
        return this._sessionInstance;
    }

    startOver(process, userInfo, auth, skipLogin, debug) {
        if (this.inSession) {
            console.warn("A session is already running. It is stopped to start over.");
            this._stopSession();
        }
        this.debug = debug;
        this.inSession = true;
        const info = parser.processForms(process, userInfo, auth, skipLogin, this.logger);
        this.logger.updateInfo({
            status: Messaging.SessionStatus.IN_PROGRESS,
            logs: `Starting session... Will attempt to send ${info.fieldCount} fields.`,
            debugging: debug,
        }, true);
        this.runFormSeq(info);
    }

    _stopSession() {
        this.inSession = false;
        chrome.tabs.onUpdated.removeListener(this.tabLoadHandler);
        chrome.runtime.onMessage.removeListener(this.actionMessageHandler);
        if (this.timeoutInterval)
            clearInterval(this.timeoutInterval);
    }

    interrupt() {
        this.handleFailure("The session was interrupted externally.");
    }

    getSummaryStr() {
        const strArr = ["\n----SESSION SUMMARY----\n\n", ""];
        strArr.push(`Fields ${this.completedFieldList.length}/${this.totalFieldSet.size} completed.\n`);
        strArr.push("Completed fields:\n");
        if (this.completedFieldList.length) {
            for (const f of this.completedFieldList) {
                strArr.push("\t" + f + "\n");
            }
        } else {
            strArr.push("\tNone.\n");
        }
        const diffSet = helpers.setDiff(this.totalFieldSet, this.completedFieldSet);
        strArr.push("Missed fields:\n");
        if (diffSet.size) {
            for (const f of diffSet) {
                strArr.push("\t" + f + "\n");
            }
        } else {
            strArr.push("\tNone.\n");
        }
        strArr.push("\n*** IMPORTANT: Please still double-check your App form thoroughly regardless of completion progress. ***\n");
        if (this.warnings.length > 0) {
            strArr.push("\nWarnings:\n");
            for (const w of this.warnings) {
                // if WarningMap has a text representation for this warning code, use that; otherwise use the code itself.
                strArr.push("-\t" + (WarningMap[w] || w) + "\n");
            }
        }
        return strArr.join("");
    }

    runFormSeq(info) {
        this.info = info;
        this.waitingFor = WaitingFor.NEW_PAGE_LOAD;
        this.dedicatedTabCreated = false;
        this.warnings = [];
        this.totalFieldSet = new Set();
        this.completedFieldList = [];
        this.completedFieldSet = new Set();
        this.newPageLoading = false;

        this.startCheckingTimeout();
        chrome.runtime.onMessage.addListener(this.getMessageHandler());
        chrome.tabs.onUpdated.addListener(this.getTabLoadHandler());
        this.logger.appendLogs("Message and tabLoad handlers added. Background and content scripts now communicate.", true);

        this.pendingNode = info.initialNode;
        this.runCurrNodeNow();
    }

    startCheckingTimeout() {
        this.lastTimeActive = Date.now();
        let end = () => this.handleFailure("timeout");

        let checkTimeout = function () {
            if (Date.now() - this.lastTimeActive > constants.MAX_ACTION_TIMEOUT) {
                end();
            }
        }.bind(this);

        this.timeoutInterval = setInterval(checkTimeout, constants.CHECK_TIMEOUT_INTERVAL);
    }

    getMessageHandler() {
        if (!this.actionMessageHandler)
            this.actionMessageHandler = this.onMessage.bind(this);
        return this.actionMessageHandler;
    }

    getTabLoadHandler() {
        if (!this.tabLoadHandler)
            this.tabLoadHandler = this.onPageLoad.bind(this);
        return this.tabLoadHandler;
    }

    /* We need to make sure two things in order to begin the next sequence
     * segment: 1) the tab is in a new page (i.e. url changed) and 2) the tab
     * has finished loading. The tab loads later than it changes url, so a state
     * machine is employed.
     */
    onPageLoad(tabId, changeInfo) {
        // make sure the updated tab is the same as our tab
        if (tabId === this.tabId) {
            // Make sure the tab's url has changed.
            if (changeInfo.url) {
                this.logger.appendLogs(`\nNew page loading.. (URL: ${changeInfo.url}) `, true, true);
                if (!this.isUrlAllowed(changeInfo.url)) {
                    this.handleFailure('A url not of specified domain' + this.info.base + 'is reached. ' +
                        'Terminated for safety. This is most likely caused by a faulty template or a change' +
                        'in App website layout. Please report this incidence if possible, thanks!');
                    return;
                }
                this.newPageLoading = true;
            }

            if (this.newPageLoading && changeInfo.status === 'complete') {
                this.logger.appendLogs("New page loaded.");
                this.newPageLoading = false;

                if (this.waitingFor === WaitingFor.NEW_PAGE_LOAD) {
                    this.waitingFor = WaitingFor.LOCAL_CALL; // prevent multiple page loading from executing too many commands.
                    const delay = this.redirectsPending ? constants.NEW_PAGE_DELAY : constants.REDIRECTS_DELAY;
                    setTimeout(() => {
                        this.lastTimeActive = Date.now();
                        this.redirectsPending = false;
                        helpers.inject(tabId, constants.CONTENT_JS_PATH, this.runCurrNodeNow.bind(this));
                    }, delay);
                } else {
                    console.warn("A new resource has loaded while waiting for messages. This is fine as long as " +
                        "not a new page is opened (i.e. the script persists)");
                }
            }
        }
    }

    isUrlAllowed(url) {
        if (helpers.isOfDomain(url, this.info.base)) {
            return true;
        }

        // New domain; fail for safety
        return this.info.allowed_hosts.some((host) => {
            return helpers.isOfDomain(url, host);
        });
    }

    onMessage(request) {
        if (request._source !== Messaging.Source.CONTENT) {
            return;
        }
        switch (request.state) {
            case 'try_met':
                this.logger.appendLogs("Conditions met.", true);
                this.pendingNode = this.pendingNode.altNext;
                this.runCurrNodeWithDelay();
                break;
            case 'next':
                this.logger.appendLogs("Done.");
                if (this.waitingFor === WaitingFor.MESSAGE) {
                    if (this.pendingField) {
                        this.addCompletedField(this.pendingField);
                        this.pendingField = null;
                    }
                    this.runCurrNodeWithDelay();
                }
                break;
            case 'try_unmet':
                this.logger.appendLogs("Conditions not met.", true);
                this.pendingNode = this.pendingNode.next;
                this.runCurrNodeWithDelay();
                break;
            case 'failed':
                this.handleFailure(request.reason);
                break;
            default:
                console.error(`Do not recognize request state: ${request.state}.`);
                break;
        }
        this.lastImplication = null;
    }

    runCurrNodeNow() {
        while (this.pendingNode && this.pendingNode.type === NodeType.PASS) {
            this.pendingNode = this.pendingNode.next;
        }

        if (!this.pendingNode) {
            this.logger.appendLogs("All commands have been run; finishing...");
            this.handleSuccess();
            return;
        }

        switch (this.pendingNode.type) {
            case NodeType.COMMAND:
                this.runCommand(this.pendingNode.command);
                this.pendingNode = this.pendingNode.next;
                break;
            case NodeType.CONDITIONAL:
                let condCmd = Session.evalCondition(this.pendingNode.condition);
                if (isBool(condCmd)) {
                    this.pendingNode = condCmd ? this.pendingNode.altNext : this.pendingNode.next;
                    setTimeout(this.runCurrNodeNow.bind(this)); // call async to avoid recursion
                } else {
                    this.runCommand(condCmd);
                }
                break;
            default:
                throw new Error(`Unrecognized node type: ${this.pendingNode.type} of node: ${JSON.stringify(this.pendingNode)}`);
        }
    }

    runCommand(cmd) {
        if (!cmd.action) {
            this.handleFailure(`Command has no action attribute: ${JSON.stringify(cmd)}`);
        }

        // For summary and analytics
        if (cmd.field && !this.totalFieldSet.has(cmd.field)) {
            this.addTotalField(cmd.field);
            this.pendingField = cmd.field;
        }

        switch (cmd.action) {
            case 'open':
                this.waitingFor = WaitingFor.NEW_PAGE_LOAD;
                if (!this.dedicatedTabCreated) {
                    // If first command (since idx is incremented before)
                    this.newPageLoading = true;
                    this.logger.appendLogs(`* Creating new tab with URL: ${cmd.target}.. `, false, true);
                    helpers.newTab(this.getFullUrlSafe(cmd.target),
                        tabId => {
                            this.dedicatedTabCreated = true;
                            console.log(`New tab loaded. ID: ${tabId}`);
                            this.tabId = tabId;
                        });
                } else {
                    this.logger.appendLogs(`* Going to URL: ${cmd.target}.. `, false, true);
                    helpers.open(this.tabId, this.getFullUrlSafe(cmd.target));
                }
                break;
            case 'warn':
                this.warnings.push(cmd.target);
                this.runCurrNodeWithDelay();
                break;
            case 'wait':
                this.logger.appendLogs(`* Pausing for ${cmd.target || constants.WAIT_DELAY} milliseconds... `);
                // helpers.sendCommand(this.tabId, cmd);
                // this.waitingFor = WaitingFor.MESSAGE;
                this.runCurrNodeWithDelay(cmd.target || constants.WAIT_DELAY);
                break;
            case 'pass':
                this.logger.appendLogs("* 'Pass' command executed.");
                this.runCurrNodeWithDelay();
                break;
            case 'halt':
                this.logger.appendLogs(`\n*** Session Interrupted. Reason: ${cmd.target} ***`);
                break;
            default:
                this.logCommand(cmd);
                if (!this.dedicatedTabCreated) {
                    this.handleFailure("Fatal: Cannot find dedicated tab");
                }
                helpers.sendCommand(this.tabId, cmd);
                this.waitingFor = WaitingFor.MESSAGE;
                break;
        }

        // E.g. a new page loads after this
        if (cmd.flag === 'n')
            this.waitingFor = WaitingFor.NEW_PAGE_LOAD;
        else if (cmd.flag === 'r') {
            this.waitingFor = WaitingFor.NEW_PAGE_LOAD;
            this.redirectsPending = true;
        }

        this.lastTimeActive = Date.now();
    }

    static evalCondition(cond) {
        if (typeof cond === 'boolean')
            return cond;
        return cond;
    }

    logCommand(cmd) {
        switch (cmd.action) {
            case 'try':
                this.logger.appendLogs(`* Testing conditions for command 'try' (Conditions: ${JSON.stringify(cmd.try)}).. `, true, true);
                break;
            case 'type':
                if (cmd.field)
                    this.logger.appendLogs(`* Entering value for field '${cmd.field}'... `, false, true);
                else
                    this.logger.appendLogs("* Entering some value... ", false, true);
                this.logger.appendLogs(`(action: type, target: ${cmd.target}) `, true, true);
                break;
            case 'click':
                if (cmd.field)
                    this.logger.appendLogs(`* Selecting (clicking) value for field '${cmd.field}'... `, false, true);
                else
                    this.logger.appendLogs("* Clicking for navigation.. ", false, true);
                this.logger.appendLogs(`(action: click, target: ${cmd.target} `, true, true);
                break;
            case 'assertElementPresent':
                this.logger.appendLogs(`* Asserting that element '${cmd.target}' exists...`, true, true);
                break;
            case 'waitForElementPresent':
                this.logger.appendLogs(`* Waiting for element '${cmd.target}' to show up... `, true, true);
                break;
            default:
                this.logger.appendLogs(`Fatal: Unrecognized command action: ${cmd.action}`);
                this.handleFailure("unrecognized command action");
                break;
        }
    }

    runCurrNodeWithDelay(delay) {
        setTimeout(() => this.runCurrNodeNow(), delay || constants.DEFAULT_DELAY);
    }

    getFullUrlSafe(path) {
        const url = this.getFullUrl(path);
        if (this.isUrlAllowed(url)) {
            return url;
        }
        throw new Error("Your process template attempts to go to a url that is of a domain neither specified by the 'base'" +
            "attribute nor part of the 'allowed_hosts' array.");
    }

    getFullUrl(path) {
        if (helpers.isUrlAbsolute(path)) {
            return path;
        } else {
            return helpers.getUrl(this.info.base, path);
        }
    }

    get sessionInfo() {
        return this.logger.sessionInfo;
    }

    addCompletedField(f) {
        if (!this.completedFieldSet.has(f)) {
            this.completedFieldList.push(f);
            this.completedFieldSet.add(f);
        }
    }

    addTotalField(f) {
        this.totalFieldSet.add(f);
    }
}

// function bindMethods(context, props) {
//     props.forEach(prop => {
//         context[prop].bind(context);
//     });
// }
