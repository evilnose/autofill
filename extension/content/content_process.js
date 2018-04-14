"use strict";

var Atfl = {
  MAX_SKIP_PENALTY: 2, // the maximum number of skipping penalties the code can incur
  FIND_ELE_DELAYS: [100, 500, 500, 500],
  ACTION_DELAYS: [100, 100],
  INIT_DELAY: 200,
  DEFAULT_DELAY: 0,
  LAST_ACTIONS: []
}

function startProcess(process, autoRoute, sendRes) {

  Atfl.skipPenalty = 0;

  if (autoRoute) {
    sendRes({ state: 'done' });
  }

  console.log("Process loaded: " + JSON.stringify(process));
  var pLen = process.length;
  var p, wait;
  var promise = Promise.resolve();

  promise = promise.then(_ => delay(Atfl.INIT_DELAY));

  for (let i = 0; i < pLen; i++) {
    promise = promise.then(_ => getActionPromise(process[i], i));
  }

  promise = promise.then(processComplete)
    .catch(handleError)
    .then(_ => processCleanup(!autoRoute ? sendRes : null));
}

function processComplete(autoRoute) {
  console.log("Form-sending process complete.");
}

function processCleanup(sendRes) {
  if (sendRes) {
    console.log("Sending success message back...");
    sendRes({ state: 'done' });
  }
}

function getActionPromise(prc, i) {
  if (!prc.type) {
    var [act, assert] = getActionFuncs(prc.action);
    prc.idx = i;

    var p = Promise.resolve();
    p = p.then(_ => getFindElementRetryPromise(prc.target))
      .then(ele => getActionRetryPromise(act, ele, prc.val));
    if (assert) {
      p = p.then(ele => getActionRetryPromise(assert, ele, prc.val));
    }

    p = p.then(_ => { Atfl.skipPenalty = 0; })
      .catch(err => skipAction(err, prc.action));

    return p;
  }
}

function skipAction(error, actionName) {
  if (error) {
    console.error(error);
    handleError("Stated above");
  } else {
    return new Promise(function (resolve) {
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

function getFindElementRetryPromise(path) {
  return new Promise(function(resolve, reject) {
    retryFindElement(path, 0, resolve, reject)
  });
}

function retryFindElement(path, dIdx, resolve, reject) {
  if (dIdx === Atfl.FIND_ELE_DELAYS.length) {
    console.log("Failed to find ele by path. REJECTING...");
    reject(null);
    return;
  }

  var ele = getElement(path);
  if (ele.length) {
    console.log("Found ele. Resolving...");
    resolve(ele);
  } else {
    console.log("Failed to find ele by path. Retrying...");
    setTimeout(_ => retryFindElement(path, dIdx + 1, resolve, reject),
      Atfl.FIND_ELE_DELAYS[dIdx]);
  }
}

function getActionRetryPromise(func, ele, val) {
  return new Promise(function(resolve, reject) {
    retryAction(func, ele, val, 0, resolve, reject);
  });
}

function retryAction(func, ele, val, dIdx, resolve, reject) {
  // TODO incorporate timeout
  if (dIdx === Atfl.ACTION_DELAYS.length) {
    console.log(`Failed to do ${func.name}. REJECTING...`);
    reject(null);
    return;
  }

  if (func(ele, val)) {
    console.log(`${func.name} success. Resolving...`);
    setTimeout(_ => resolve(ele), Atfl.DEFAULT_DELAY);
  } else {
    console.log(`Failed to do ${func.name}. Retrying...`);
    setTimeout(_ => retryAction(func, ele, val, dIdx + 1, resolve, reject),
      Atfl.ACTION_DELAYS[dIdx]);
  }
}

function getActionFuncs(action) {
  var actionUpper = action.charAt(0).toUpperCase() + action.substr(1);
  var actionFunc = ActionFuncs['do' + actionUpper];
  if (!actionFunc) {
    console.error(`Action function does not exist: ${action}`);
  }
  return [actionFunc, ActionFuncs['assert' + actionUpper]];
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