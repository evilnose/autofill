/* global chrome */
const infoLoad = require('./infoLoad');
const helpers = require('./helpers');
const parser = require('./parser');
const constants = require('./constants');

const WaitingFor = {
    MESSAGE: 0,
    NEW_PAGE_LOAD: 1,
};

export default class Session {
    constructor(succ, fail) {
        this.inSession = false;
        let self = this;
        this.success = function () {
            self.stopSession();
            succ(self.getSummary());
        };

        this.failure = function (errReason) {
            self.stopSession();
            fail(self.getSummary(), errReason, this.lastImplication);
        };

        // bindMethods(this, ['start', 'runFormSeq', 'startCheckingTimeout', 'getMessageHandler',
        // 	'getTabLoadHandler', 'runNextCommandWithDelay', 'getNextCommand', 'sendCommand',
        // 	'getFullUrl', 'injectAndSendCommand', 'stopSession']);
        bindMethods(this, ['startOver']);
    }

    startOver(appKey, userKey, auth, skipLogin) {
        if (this.inSession)
            this.stopSession();
        this.inSession = true;
        Promise.all([infoLoad.getAppInfo(appKey), infoLoad.getUserInfo(userKey)])
            .catch(() => this.failure('get_info'))
            .then(data => parser.processForms(data, auth, skipLogin))
            .then(info => this.runFormSeq(info));
    }

    getSummary() {
        return {
            warnings: this.warnings,
            totalFields: this.totalFields,
            completedFields: this.completedFields,
        };
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
        // TODO add max timeout handler
        chrome.runtime.onMessage.addListener(this.getMessageHandler());
        chrome.tabs.onUpdated.addListener(this.getTabLoadHandler());

        this.runNextCommand();
    }

    startCheckingTimeout() {
        this.lastTimeActive = Date.now();
        let end = () => this.failure.call(this, 'timeout');

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
                console.log("New page loading...URL: " + changeInfo.url);
                if (!helpers.isOfDomain(changeInfo.url, this.info.base)) {
                    // New domain; fail for safety
                    this.failure('new_domain');
                    return;
                }
                this.newPageLoading = true;
            }

            if (this.newPageLoading && changeInfo.status === 'complete') {
                console.log("New page loaded.");
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
        console.log(`Received message with state: ${request.state}`);
        switch (request.state) {
            case 'try_met':
                // Remove conditionals to jump to queue in getNextCommand()
                this.conditionals = [];
            /* falls through */
            case 'next':
                if (this.pendingField)
                    this.completedFields.push(this.pendingField);
            /* falls through */
            case 'try_unmet':
                if (this.waitingFor === WaitingFor.MESSAGE) {
                    this.runNextCommandWithDelay();
                } else {
                    console.error("Expected waitingFor to be MESSAGE but got " +
                        this.waitingFor + " instead.");
                }
                break;
            case 'injected':
                this.runNextCommandWithDelay();
                break;
            case 'failed':
                this.failure(request.reason, request.message);
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
            // TODO add success count and warnings
            // TODO handle penalty
            console.log(this.idx);
            console.log(this.info.process.length);
            console.log(this.getNextCommand());
            this.success();
            return;
        }

        if (this.needToInject) {
            // Fresh page; need to inject script
            this.needToInject = false;
            helpers.inject(this.tabId, constants.CONTENT_JS_PATH);
            return;
        }

        let cmd = this.getNextCommand();

        if (cmd.action)
            console.log(`Running command ${cmd.action}`);
        else
            this.failure(`Command has no action: ${JSON.stringify(cmd)}`);


        if (cmd.field) {
            // For summary and analytics
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
                    helpers.newTab(this.getFullUrl(cmd.target),
                        tabId => {
                            this.tabId = tabId;
                        });
                } else {
                    helpers.open(this.tabId, this.getFullUrl(cmd.target));
                }
                break;
            case 'warn':
                this.warnings.push(cmd.target);
                this.runNextCommandWithDelay();
                break;
            default:
                helpers.sendCommand(this.tabId, cmd);
                this.waitingFor = WaitingFor.MESSAGE;
                break;
        }

        // E.g. a new page loads after this
        if (cmd.flag === 'n')
            this.waitingFor = WaitingFor.NEW_PAGE_LOAD;

        this.lastTimeActive = Date.now();
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

    stopSession() {
        console.log("Session stopped.");
        this.inSession = false;
        chrome.tabs.onUpdated.removeListener(this.tabLoadHandler);
        chrome.runtime.onMessage.removeListener(this.actionMessageHandler);
        if (this.timeoutInterval)
            clearInterval(this.timeoutInterval);
        this.failure('interrupted');
    }
}

function bindMethods(context, props) {
    props.forEach(prop => {
        context[prop].bind(context);
    });
}