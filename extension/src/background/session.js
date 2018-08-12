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
};

export default class Session {
    constructor() {
        this.inSession = false;

        this.logger = new StatusLogger();
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
        let finalStr = "\n----SESSION SUMMARY----\n\n";
        finalStr += `Fields ${this.completedFieldList.length}/${this.totalFieldSet.size} completed.\n`;
        if (this.completedFieldList.length > 0) {
            finalStr += "Completed fields:\n";
            for (const f of this.completedFieldList) {
                finalStr += "\t" + f + "\n";
            }
        }
        finalStr += "\n*** IMPORTANT: Please still double-check your App form thoroughly regardless of completion progress. ***\n";
        if (this.warnings.length > 0) {
            finalStr += "\nWarnings:\n";
            for (const w of this.warnings) {
                // if WarningMap has a text representation for this warning code, use that; otherwise use the code itself.
                finalStr += "-\t" + (WarningMap[w] || w) + "\n";
            }
        }
        return finalStr;
    }

    runFormSeq(info) {
        this.info = info;
        this.waitFor = 'tab_load';
        this.dedicatedTabCreated = false;
        this.warnings = [];
        this.totalFieldSet = new Set();
        this.completedFieldList = [];
        this.newPageLoading = false;
        this.needToInject = false;

        this.startCheckingTimeout();
        chrome.runtime.onMessage.addListener(this.getMessageHandler());
        chrome.tabs.onUpdated.addListener(this.getTabLoadHandler());
        this.logger.appendLogs("Message and tabLoad handlers added. Background and content scripts now communicate.", true);

        this.pendingNode = info.initialNode;
        this.runCurrNode();
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
                if (!helpers.isOfDomain(changeInfo.url, this.info.base)) {
                    // New domain; fail for safety
                    let allowed = false;
                    if (this.info.allowed_hosts) {
                        allowed = this.info.allowed_hosts.reduce((prev, curr) => {
                            return prev || helpers.isOfDomain(changeInfo.url, curr);
                        }, false);
                    }

                    if (!allowed) {
                        this.handleFailure('A url not of specified domain' + this.info.base + 'is reached. ' +
                            'Terminated for safety. This is most likely caused by a faulty template or a change' +
                            'in App website layout. Please report this incidence if possible, thanks!');
                        return;
                    }
                }
                this.newPageLoading = true;
            }

            if (this.newPageLoading && changeInfo.status === 'complete') {
                this.logger.appendLogs("New page loaded.");
                this.newPageLoading = false;

                if (this.waitingFor === WaitingFor.NEW_PAGE_LOAD) {
                    this.runCurrCommandWithDelay();
                } else {
                    console.warn("A new path is loaded, but the script is still there.");
                }
            }
        }
    }

    onMessage(request) {
        if (request._source !== Messaging.Source.CONTENT) {
            return;
        }
        switch (request.state) {
            case 'try_met':
                this.logger.appendLogs("Conditions met.", true);
                this.pendingNode = this.pendingNode.altNext;
                this.tryRunCurrCmd();
                break;
            case 'next':
                this.logger.appendLogs("Done.");
                if (this.pendingField)
                    this.completedFieldList.push(this.pendingField);
                this.tryRunCurrCmd();
                break;
            case 'try_unmet':
                this.logger.appendLogs("Conditions not met.", true);
                this.pendingNode = this.pendingNode.next;
                this.tryRunCurrCmd();
                break;
            case 'injected':
                this.logger.appendLogs("Script has been injected.", true);
                this.runCurrCommandWithDelay();
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

    tryRunCurrCmd() {
        if (this.waitingFor === WaitingFor.MESSAGE) {
            this.runCurrCommandWithDelay();
        } else {
            console.error("Expected waitingFor to be MESSAGE but is TAB_LOAD instead.");
        }
    }

    runCurrNode() {
        while (this.pendingNode && this.pendingNode.type === NodeType.PASS) {
            this.pendingNode = this.pendingNode.next;
        }

        if (!this.pendingNode) {
            this.logger.appendLogs("All commands have been run; finishing...");
            this.handleSuccess();
            return;
        }

        if (this.needToInject) {
            // Fresh page; need to inject script TODO or maybe we don't need to do that
            this.logger.appendLogs("A new page has loaded; injecting content script...", true);
            this.needToInject = false;
            helpers.inject(this.tabId, constants.CONTENT_JS_PATH);
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
                    setTimeout(this.runCurrNode.bind(this)); // call async to avoid recursion
                } else {
                    this.runCommand(condCmd, true);
                }
                break;
            default:
                throw new Error(`Unrecognized node type: ${this.pendingNode.type} of node: ${JSON.stringify(this.pendingNode)}`);
        }
    }

    runCommand(cmd, toTest) {
        if (!cmd.action) {
            this.handleFailure(`Command has no action attribute: ${JSON.stringify(cmd)}`);
        }

        cmd.toTest = toTest;

        // For summary and analytics
        if (cmd.field && !this.totalFieldSet.has(cmd.field)) {
            this.totalFieldSet.add(cmd.field);
            this.pendingField = cmd.field;
        } else {
            this.pendingField = null;
        }

        switch (cmd.action) {
            case 'open':
                this.needToInject = true;
                this.waitingFor = WaitingFor.NEW_PAGE_LOAD;
                if (!this.dedicatedTabCreated) {
                    // If first command (since idx is incremented before)
                    this.newPageLoading = true;
                    this.logger.appendLogs(`* Creating new tab with URL: ${cmd.target}.. `, false, true);
                    helpers.newTab(this.getFullUrl(cmd.target),
                        tabId => {
                            this.dedicatedTabCreated = true;
                            console.log(`New tab loaded. ID: ${tabId}`);
                            this.tabId = tabId;
                        });
                } else {
                    this.logger.appendLogs(`* Going to URL: ${cmd.target}.. `, false, true);
                    helpers.open(this.tabId, this.getFullUrl(cmd.target));
                }
                break;
            case 'warn':
                this.warnings.push(cmd.target);
                this.runCurrCommandWithDelay();
                break;
            case 'wait':
                if (cmd.target) {
                    this.logger.appendLogs(`* Sending command to delay ${cmd.target} milliseconds.. `, false, true);
                } else {
                    this.logger.appendLogs("* Sending command to delay.. ", false, true);
                }
                helpers.sendCommand(this.tabId, cmd);
                this.waitingFor = WaitingFor.MESSAGE;
                break;
            default:
                this.logCommand(cmd);
                helpers.sendCommand(this.tabId, cmd);
                this.waitingFor = WaitingFor.MESSAGE;
                break;
        }

        // E.g. a new page loads after this
        if (cmd.flag === 'n')
            this.waitingFor = WaitingFor.NEW_PAGE_LOAD;

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
            case 'waitForElementPresent':
                this.logger.appendLogs(`* Waiting for element '${cmd.target}' to show up... `, true, true);
                break;
        }
    }

    runCurrCommandWithDelay() {
        setTimeout(() => this.runCurrNode(), constants.DEFAULT_DELAY);
    }

    getFullUrl(path) {
        return helpers.getUrl(this.info.base, path);
    }

    get sessionInfo() {
        return this.logger.sessionInfo;
    }
}

// function bindMethods(context, props) {
//     props.forEach(prop => {
//         context[prop].bind(context);
//     });
// }
