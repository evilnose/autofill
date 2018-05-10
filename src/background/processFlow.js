/* global chrome */

import Session from './session.js';
const constants = require('./constants.js');

/*** PROCESSES PROMISE CHAIN ***/
exports.startProcesses = function (appKey, userKey, auth, skipLogin) {
  if (!auth && !skipLogin) {
    console.error("User requested login but not angular-app auth is provided.");
  }

  // Initial condition: user has logged in and is at the home url
  console.log("Starting user-form-filling process...");
  new Session(processComplete, processFailure).start(appKey, userKey, auth, skipLogin);
};

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
  console.log("WARNING: Since the process failed, the last few field values may not" +
    "have been sent.");
  processCleanup();
}

function processCleanup() {
  // TODO what now?
}