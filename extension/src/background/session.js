/* global chrome */
import Messaging from "../messaging";
import {WarningMap} from "./codeToText";

const helpers = require('./helpers');
const parser = require('./parser');
const constants = require('./constants');

const WaitingFor = {
    MESSAGE: 0,
    NEW_PAGE_LOAD: 1,
};

export default class Session {
    constructor() {
        this.inSession = false;

        this.sessionInfo = {
            logs: "",
        };
        this.updateInfo({
            status: Messaging.SessionStatus.IDLE,
            logs: "Session ready. Standing by.",
            debugging: false,
        });
    }

    handleSuccess() {   // HA
        this.sessionInfo.status = Messaging.SessionStatus.SUCCEEDED;
        this.updateInfo({
            status: Messaging.SessionStatus.SUCCEEDED,
            logs: "Session finished successfully.",
        });
        this._stopSession();
        this.appendLogs(this.getSummaryStr());
    }

    handleFailure(errReason) {
        // I need to learn this trick
        this.updateInfo({
            status: Messaging.SessionStatus.FAILED,
            logs: "\nSession did not complete successfully. However, your form could still be partially sent. See below for details.",
        });
        this._stopSession();
        this.appendLogs(`The recorded reason for failure is: ${errReason}.`);
        let implicationMessage = null;
        switch (this.lastImplication) {
            case constants.Message.Implication.BAD_LOGIN:
                implicationMessage = "incorrect login credentials";
                break;
        }
        if (implicationMessage) {
            this.appendLogs(`Additionally, the failure could possibly be caused by ${implicationMessage}.`);
        }
        this.appendLogs(this.getSummaryStr());
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
        const info = parser.processForms(process, userInfo, auth, skipLogin);
        this.updateInfo({
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
        finalStr += `Fields ${this.completedFields.length}/${this.info.fieldCount} completed.\n`;
        if (this.completedFields.length > 0) {
            finalStr += "Completed fields:\n";
            for (const f of this.completedFields) {
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
        if (!contribOnly || this.sessionInfo.debug) {
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

    runFormSeq(info) {
        this.info = info;
        this.idx = 0;
        this.waitFor = 'tab_load';
        this.queue = [];
        this.conditionals = [];
        this.warnings = [];
        this.totalFields = [];
        this.completedFields = [];
        this.newPageLoading = false;

        this.startCheckingTimeout();
        chrome.runtime.onMessage.addListener(this.getMessageHandler());
        chrome.tabs.onUpdated.addListener(this.getTabLoadHandler());
        this.appendLogs("Message and tabLoad handlers added. Background and content scripts now communicate.", true);

        this.runNextCommand();
    }

    startCheckingTimeout() {
        this.lastTimeActive = Date.now();
        let end = () => this.handleFailure.call(this, "timeout");

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
                this.appendLogs(`\nNew page loading.. (URL: ${changeInfo.url}) `, true, true);
                if (!helpers.isOfDomain(changeInfo.url, this.info.base)) {
                    // New domain; fail for safety
                    this.handleFailure('A url not of specified domain' + this.info.base + 'is reached. ' +
                        'Terminated for safety. This is most likely caused by a faulty template or a change' +
                        'in App website layout. Please report this incidence if possible, thanks!');
                    return;
                }
                this.newPageLoading = true;
            }

            if (this.newPageLoading && changeInfo.status === 'complete') {
                this.appendLogs("New page loaded.", false, true);
                this.newPageLoading = false;

                if (this.waitingFor === WaitingFor.NEW_PAGE_LOAD) {
                    this.runNextCommandWithDelay();
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
                // Remove conditionals to jump to queue in getNextCommand()
                this.appendLogs("Conditions met.", true);
                this.conditionals = [];
            /* falls through */
            case 'next':
                this.appendLogs("Done.");
                if (this.pendingField)
                    this.completedFields.push(this.pendingField);
            /* falls through */
            case 'try_unmet':
                this.appendLogs("Conditions not met.", true);
                if (this.waitingFor === WaitingFor.MESSAGE) {
                    this.runNextCommandWithDelay();
                } else {
                    console.error("Expected waitingFor to be MESSAGE but got " +
                        this.waitingFor + " instead.");
                }
                break;
            case 'injected':
                this.appendLogs("Script has been injected.", true);
                this.runNextCommandWithDelay();
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

    runNextCommand() {
        if (this.idx >= this.info.process.length && this.queue.length === 0 &&
            this.conditionals.length === 0) {
            this.appendLogs("All commands have been run; finishing...");
            this.handleSuccess();
            return;
        }

        if (this.needToInject) {
            // Fresh page; need to inject script
            this.appendLogs("A new page has loaded; injecting content script...", true);
            this.needToInject = false;
            helpers.inject(this.tabId, constants.CONTENT_JS_PATH);
            return;
        }

        let cmd = this.getNextCommand();

        if (!cmd.action)
            this.handleFailure(`Command has no action attribute: ${JSON.stringify(cmd)}`);

        // For summary and analytics
        if (cmd.field) {
            this.totalFields.push(cmd.field);
            this.pendingField = cmd.field;
        } else {
            this.pendingField = null;
        }

        this.lastImplication = cmd.implication;

        switch (cmd.action) {
            case 'open':
                this.needToInject = true;
                this.waitingFor = WaitingFor.NEW_PAGE_LOAD;
                if (this.idx === 1 && this.queue.length === 0) {
                    // If first command (since idx is incremented before)
                    this.newPageLoading = true;
                    this.appendLogs(`* Creating new tab with URL: ${cmd.target}.. `, false, true);
                    helpers.newTab(this.getFullUrl(cmd.target),
                        tabId => {
                            this.tabId = tabId;
                        });
                } else {
                    this.appendLogs(`* Going to URL: ${cmd.target}.. `, false, true);
                    helpers.open(this.tabId, this.getFullUrl(cmd.target));
                }
                break;
            case 'warn':
                this.warnings.push(cmd.target);
                this.runNextCommandWithDelay();
                break;
            case 'wait':
                if (cmd.target) {
                    this.appendLogs(`* Sending command to delay ${cmd.target} milliseconds.. `, false, true);
                } else {
                    this.appendLogs("* Sending command to delay.. ", false, true);
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

    logCommand(cmd) {
        switch (cmd.action) {
            case 'try':
                this.appendLogs(`* Testing conditions for command 'try' (Conditions: ${JSON.stringify(cmd.try)}).. `, true, true);
                break;
            case 'type':
                if (cmd.field)
                    this.appendLogs(`* Entering value for field '${cmd.field}'.. `, false, true);
                else
                    this.appendLogs("* Entering some value.. ", false, true);
                this.appendLogs(`(action: type, target: ${cmd.target}) `, true, true);
                break;
            case 'click':
                if (cmd.field)
                    this.appendLogs(`* Selecting (clicking) value for field '${cmd.field}'.. `, false, true);
                else
                    this.appendLogs("* Clicking for navigation.. ", false, true);
                this.appendLogs(`(action: click, target: ${cmd.target} `, true, true);
                break;
            case 'waitForElementPresent':
                this.appendLogs(`* Waiting for element '${cmd.target}' to show up.. `, true, true);
                break;
        }
    }

    runNextCommandWithDelay() {
        setTimeout(() => this.runNextCommand(), constants.DEFAULT_DELAY);
    }

    getNextCommand() {
        if (this.conditionals && this.conditionals.length > 0) {
            return this.getNextTry();
        } else if (this.queue.length > 0) {
            // queue is about to be empty
            if (this.queue.length === 1)
                this.idx++;
            return this.queue.splice(0, 1)[0];
        } else {
            let cmd = this.info.process[this.idx];
            if (Array.isArray(cmd)) {
                console.assert(cmd[0].try, "Command is array but has no try");
                // Conditional; store all tries
                this.conditionals = cmd;
                return this.getNextTry();
            } else {
                this.idx++;
                return cmd;
            }
        }
    }

    getNextTry() {
        // Record commands of conditional to queue
        let cond = this.conditionals.splice(0, 1)[0];
        this.queue = cond.commands;
        return {
            action: 'try',
            try: cond.try,
        };
    }

    getFullUrl(path) {
        return helpers.getUrl(this.info.base, path);
    }
}

function bindMethods(context, props) {
    props.forEach(prop => {
        context[prop].bind(context);
    });
}