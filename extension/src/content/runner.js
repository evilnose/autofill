/* global chrome */
/*
Handles the execution of parsed commands.
 */

import Messaging from "../common/messaging";
import {dehighlight, highlight, Status} from "./ui";

const getCommandFn = require('./getCommandFn');
const getJqElement = require('./getElement');
const constants = require('./constants');
const {statusChanged} = require('./ui');

module.exports = {
    // Runs the given command
    runCommand: function (cmd) {
        console.log("Got command:", cmd);
        switch (cmd.action) {
            // case 'wait':
            //     const delay = cmd.target || constants.DEFAULT_WAIT_DELAY;
            //     getDelayPromise(delay)
            //         .then(handleActionSuccess)
            //         .catch(handleActionFailure);
            //     break;
            default:
                statusChanged(Status.LOCATING);
                if (cmd.action.startsWith('assert')) {
                    Promise.resolve(getJqElement(cmd.target))
                        .then(ele => {
                            statusChanged(Status.EXECUTING);
                            highlight(ele);
                            return getCommandFn(cmd.action)(ele, cmd);
                        })
                        .then(handleTestComplete)
                        .catch(handleActionFailure);
                } else {
                    getFindElementRetryPromise(cmd.target)
                        .then(ele => {
                            highlight(ele);
                            statusChanged(Status.EXECUTING);
                            return getActionRetryPromise(getCommandFn(cmd.action), ele, cmd);
                        })
                        .then(handleActionSuccess)
                        .catch(handleActionFailure);
                }
        }
    }
};

function handleActionSuccess() {
    dehighlight();
    statusChanged(Status.SUCCESS);
    sendStateMessage('next');
}

function handleActionFailure(rsn) {
    console.error(rsn);
    statusChanged(Status.FAILED);
    sendStateMessage('failed', {reason: JSON.stringify(rsn)});
}

function handleTestComplete(result) {
    dehighlight();
    statusChanged(Status.SUCCESS);
    sendStateMessage(result ? 'try_met' : 'try_unmet');
}

// Returns a promise that retries the given action function until a max number of retries is reached
function getFindElementRetryPromise(path) {
    return new Promise(function (resolve, reject) {
        retryFindElement(path, 0, resolve, reject);
    });
}

function retryFindElement(path, dIdx, resolve, reject) {
    if (dIdx === constants.FIND_ELE_DELAYS.length) {
        console.log("Failed to find element. REJECTING...");
        reject('Failed to find element');
        return;
    }

    let ele = getJqElement(path);
    if (ele.length) {
        console.log("Found ele. Resolving...");
        resolve(ele);
    } else {
        console.log("Failed to find ele by path. Retrying...");
        setTimeout(() => retryFindElement(path, dIdx + 1, resolve, reject),
            constants.FIND_ELE_DELAYS[dIdx]);
    }
}

function getActionRetryPromise(actionFn, ele, cmd) {
    return new Promise(function (resolve, reject) {
        retryAction(actionFn, ele, cmd, 0, resolve, reject);
    });
}

function retryAction(actionFn, ele, cmd, dIdx, resolve, reject) {
    if (dIdx === constants.ACTION_DELAYS.length) {
        console.log(`Failed to do ${cmd.action}. REJECTING...`);
        reject(`Failed to perform action ${cmd.action}`);
        return;
    }

    if (actionFn(ele, cmd)) {
        console.log(`${cmd.action} success. Resolving...`);
        setTimeout(() => resolve(ele), constants.DEFAULT_DELAY);
    } else {
        console.log(`Failed to do command "${cmd.action}". Retrying...`);
        setTimeout(() => retryAction(actionFn, ele, cmd, dIdx + 1, resolve, reject),
            constants.ACTION_DELAYS[dIdx]);
    }
}

function getDelayPromise(delay) {
    return new Promise(function (resolve) {
        setTimeout(resolve, delay);
    });
}

function doTry(tries) {
    for (const t of tries) {
        if (!getCommandFn(t.action)(t.target, t.val)) {
            return false;
        }
    }
    return true;
}

function sendStateMessage(state, extraMessage) {
    chrome.runtime.sendMessage(Object.assign({
        state: state,
        _source: Messaging.Source.CONTENT,
    }, extraMessage));
}
