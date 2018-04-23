/* global chrome */

import Session from './session.js';

/*** PROCESSES PROMISE CHAIN ***/
exports.startProcesses = function (appKey, userKey, auth, skipLogin) {
  if (!auth && !skipLogin) {
    console.error("User requested login but not app auth is provided.");
  }

  // Initial condition: user has logged in and is at the home url
  console.log("Starting form-filling process...");
  new Session(processComplete, processFailure).start(appKey, userKey, auth, skipLogin);
};

/*** AFTER PROCESSES ***/
function processComplete() {
  // TODO what happens when the form-sending process is complete?
  console.log("Form-sending process successful. But success handler not done.");
  processCleanup();
}

function processFailure(reason, message) {
  // TODO handle error based on reason and message
  console.error(`Fail to do process handler not done. Reason: ${reason}`);
  if (message) {
    console.log(`Message: ${message}`);
  }
  processCleanup();
}

function processCleanup() {
  // TODO what now?
}