"use strict";

var Atfl = {
  MAX_SKIP_PENALTY: 1, // the maximum number of skipping penalties the code can incur
  FIND_ELE_DELAYS: [100, 100, 100, 500, 500, 500, 1000, 1000, 2000],
  ACTION_DELAYS: [100, 100],
  INIT_DELAY: 1000,
  DEFAULT_DELAY: 10,
  LAST_ACTIONS: []
}

function startProcess(process, autoRoute, sendRes) {

  Atfl.skipPenalty = 0;
  Atfl.failedCount = 0;

  if (autoRoute) {
    sendRes({ state: 'done' });
  }

  console.log("Process loaded: " + JSON.stringify(process));

  delay(Atfl.INIT_DELAY)
    .then(_ => getCommandPromiseChain(process, 0))
    .then(processComplete)
    .catch(handleError)
    .finally(_ => processCleanup(!autoRoute ? sendRes : null));
}

function processComplete(autoRoute) {
  console.log("Form-sending process complete.");
}

function processCleanup(sendRes) {
  console.log(`# of failed actions: ${Atfl.failedCount}`);
  if (sendRes) {
    console.log("Sending success message back...");
    sendRes({ state: 'done' });
  }
}

function getCommandPromiseChain(p) {
  var len = p.length;
  var promise = Promise.resolve();
  for (let i = 0; i < len; ++i) {
    promise = promise.then(_ => getCommandPromise(p[i], i));
  }
  return promise;
}

function getCommandPromise(prc, i) {
  if (Array.isArray(prc)) {
    return getConditionalPromise(prc);
  } else {
    prc.idx = i; // TODO might not be necessary

    var p = Promise.resolve();
    p = p.then(_ => getFindElementRetryPromise(prc.target, prc.action))
      .then(ele => getActionRetryPromise(getActionFn(prc.action), ele, prc));

    p = p.then(_ => { Atfl.skipPenalty = 0; }) // clear penalty on successful action
      .catch(err => skipAction(err, prc.action));

    return p;
  }
}

function getConditionalPromise(conditionals) {
  var c;
  for (let i = 0; i < conditionals.length; ++i) {
    c = conditionals[i];
    if (!c.assertions || verifyAssertions(c.assertions)) {
      return getCommandPromiseChain(c.commands);
    }
  }
  return Promise.resolve();
}

function verifyAssertions(assertions) {
  var a;
  for (let i = 0; i < assertions.length; i++) {
    a = assertions[i];
    if (!getActionFn(a.action)(a.target, a.val))
      return false;
  }
  return true;
}

function skipAction(error, actionName) {
  if (error) {
    console.error(error);
    handleError("Stated above");
  } else {
    return new Promise(function(resolve) {
      switch (actionName) {
        case 'click':
          Atfl.skipPenalty += 2;
          break;
        default:
          Atfl.skipPenalty++;
          break;
      }

      if (Atfl.skipPenalty > Atfl.MAX_SKIP_PENALTY) {
        handleError("Maximum skip penalty exceeded.");
      } else {
        console.log(`Skipping...(current pen: ${Atfl.skipPenalty}, max: ${Atfl.MAX_SKIP_PENALTY})`);
        resolve();
      }
    });
  }
}

function getActionRetryPromise(func, ele, prc) {
  return new Promise(function(resolve, reject) {
    retryAction(func, ele, prc, 0, resolve, reject);
  });
}

function retryAction(func, ele, prc, dIdx, resolve, reject) {
  if (dIdx === Atfl.ACTION_DELAYS.length) {
    console.log(`Failed to do ${prc.action}. REJECTING...`);
    Atfl.failedCount++;
    reject(null, prc.actionName);
    return;
  }

  if (func(ele, prc.val)) {
    console.log(`${prc.action} success. Resolving...`);
    setTimeout(_ => resolve(ele), Atfl.DEFAULT_DELAY);
  } else {
    console.log(`Failed to do ${prc.action}. Retrying...`);
    setTimeout(_ => retryAction(func, ele, prc, dIdx + 1, resolve, reject),
      Atfl.ACTION_DELAYS[dIdx]);
  }
}

function getFindElementRetryPromise(path, action) {
  return new Promise(function(resolve, reject) {
    retryFindElement(path, action, 0, resolve, reject)
  });
}

function retryFindElement(path, action, dIdx, resolve, reject) {
  if (dIdx === Atfl.FIND_ELE_DELAYS.length) {
    console.log("Failed to find ele by path. REJECTING...");
    reject(null, action);
    return;
  }

  var ele = getElement(path);
  if (ele.length) {
    console.log("Found ele. Resolving...");
    resolve(ele);
  } else {
    console.log("Failed to find ele by path. Retrying...");
    setTimeout(_ => retryFindElement(path, action, dIdx + 1, resolve, reject),
      Atfl.FIND_ELE_DELAYS[dIdx]);
  }
}

function getActionFn(action) {
  var actionUpper = action.charAt(0).toUpperCase() + action.substr(1);
  var actionFn = ActionFuncs['do' + actionUpper];
  if (!actionFn) {
    console.error(`Action function does not exist: ${action}`);
  }
  return actionFn;
}

function delay(delay) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delay);
  });
}

function handleError(reason) {
  // TODO handle error
  console.error("Forming sending process failed. Reason: " + reason);
}