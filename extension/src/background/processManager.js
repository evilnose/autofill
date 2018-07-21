/* global chrome */

import Session from './session.js';
const constants = require('./constants.js');

export default class ProcessManager {

    constructor() {
        this.sess = new Session(processComplete, processFailure);
    }

    startProcess(process, userInfo, auth, skipLogin, debug) {
        if (!auth && !skipLogin) {
            console.error("User requested login but no app auth is provided.");
            skipLogin = true; // fallback
        }
        this.sess.startOver(process, userInfo, auth, skipLogin, debug);
    }

    endProcess() {
        this.sess.interrupt();
    }
}

/*** AFTER PROCESSES ***/
function processComplete(sum) {
    // TODO what happens when the user-form-sending process is complete?
    console.log("Form-sending process successful. But success handler not done.");
    console.log(sum);
    processCleanup();
}

function processFailure(sum, reason, implication) {
    // TODO handle error based on reason and message
    console.error(`Fail to do process handler not done. Reason: ${reason}`);
    switch (implication) {
        case constants.Message.Implication.BAD_LOGIN:
            console.log("Bad login.");
            break;
    }
    console.log(sum);
    console.warn("Since the process failed, the last few field values may not " +
        "have been sent.");
    processCleanup();
}

function processCleanup() {
    // TODO what now?
}