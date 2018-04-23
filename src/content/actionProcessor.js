
const getCommandFn = require('./getCommandFn.js');
const getElement = require('./getElement.js');
const constants = require('./constants.js');

module.exports = {

  // Runs the given command
  runCommand: function(cmd) {
    // if (Array.isArray(cmd))
    //   return getConditionalPromise(cmd);
    switch (cmd.action) {
      case 'try':
        if (doTry(cmd.try)) {
          sendStateMessage('try_met');
        } else {
          sendStateMessage('try_unmet', { message: cmd.message });
        }
        break;
      case 'wait':
        getDelayPromise(cmd.target || constants.SPECIFIED_DELAY)
          .then(handleActionSuccess)
          .catch(handleActionFailure);
        break;
      default:
        getFindElementRetryPromise(cmd.target)
          .then(ele => getActionRetryPromise(getCommandFn(cmd.action), ele, cmd))
          .then(handleActionSuccess) // clear penalty on successful action
          .catch(handleActionFailure);
    }
  }
};

function handleActionSuccess() {
  console.log("Action successful. Sending signal back...");
  sendStateMessage('next');
}

function handleActionFailure(rsn) {
  console.log("Action failed. Sending signal back...");
  sendStateMessage('failed', { reason: rsn });
}

// Returns a promise that retries the given action function until 
function getFindElementRetryPromise(path) {
  return new Promise(function(resolve, reject) {
    retryFindElement(path, 0, resolve, reject);
  });
}

function retryFindElement(path, dIdx, resolve, reject) {
  if (dIdx === constants.FIND_ELE_DELAYS.length) {
    console.log("Failed to find ele by path. REJECTING...");
    reject('Failed to find element.');
    return;
  }

  var ele = getElement(path);
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
  return new Promise(function(resolve, reject) {
    retryAction(actionFn, ele, cmd, 0, resolve, reject);
  });
}

function retryAction(actionFn, ele, cmd, dIdx, resolve, reject) {
  if (dIdx === constants.ACTION_DELAYS.length) {
    console.log(`Failed to do ${cmd.action}. REJECTING...`);
    reject('Failed to perform action.');
    return;
  }

  if (actionFn(ele, cmd.val)) {
    console.log(`${cmd.action} success. Resolving...`);
    setTimeout(() => resolve(ele), constants.DEFAULT_DELAY);
  } else {
    console.log(`Failed to do ${cmd.action}. Retrying...`);
    setTimeout(() => retryAction(actionFn, ele, cmd, dIdx + 1, resolve, reject),
      constants.ACTION_DELAYS[dIdx]);
  }
}

function getDelayPromise(delay) {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay);
  });
}

function doTry(tries) {
  var t;
  for (let i = 0; i < tries.length; i++) {
    t = tries[i];
    if (!getCommandFn(t.action)(t.target, t.val)) {
      console.log("Try failed.");
      return false;
    }
  }
  console.log("Try succeeded.");
  return true;
}

function sendStateMessage(state, extraMessage) {
  chrome.runtime.sendMessage(Object.assign({ state: state }, extraMessage));
}