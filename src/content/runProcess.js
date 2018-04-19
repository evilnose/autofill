const getElement = require('./getElement.js');
const Commands = require('./commands.js');

var Atfl = {
  MAX_SKIP_PENALTY: 1, // the maximum number of skipping penalties the code can incur
  FIND_ELE_DELAYS: [100, 100, 100, 500, 500, 500, 1000, 1000, 2000],
  ACTION_DELAYS: [100, 100],
  PAGE_INIT_DELAY: 1000,
  DEFAULT_DELAY: 50,
  SPECIFIED_DELAY: 2000,
  LAST_ACTIONS: []
};

module.exports = function runProcess(process, autoRoute, sendRes) {

  Atfl.skipPenalty = 0;
  Atfl.failedCount = 0;
  Atfl.warnings = [];

  if (autoRoute) {
    sendRes({ state: 'done' });
  }

  console.log("Process loaded: " + JSON.stringify(process));

  getDelayPromise(Atfl.PAGE_INIT_DELAY)
    .then(() => getCommandPromiseChain(process, 0))
    .then(processComplete)
    .catch(handleError)
    .finally(() => processCleanup(!autoRoute ? sendRes : null));
};

function processComplete() {
  console.log("Form-sending process complete.");
}

function processCleanup(sendRes) {
  console.log(`# of failed actions: ${Atfl.failedCount}`);
  if (sendRes) {
    console.log("Sending success message back...");
    sendRes({ state: 'done' });
  }
  console.log("Warning cases:");
  console.log(Atfl.warnings);
}

function getCommandPromiseChain(p) {
  var len = p.length;
  var promise = Promise.resolve();

  /*jshint loopfunc: true */
  for (let i = 0; i < len; ++i) {
    promise = promise.then(() => getCommandPromise(p[i], i));
  }
  return promise;
}

function getCommandPromise(prc, i) {
  if (Array.isArray(prc)) {
    return getConditionalPromise(prc);
  } else {
    prc.idx = i; // TODO might not be necessary

    if (prc.action === 'wait') {
      return getDelayPromise(prc.target || Atfl.SPECIFIED_DELAY);
    }
    // special actions
    switch (prc.action) {
      case 'wait':
        return getDelayPromise(prc.target || Atfl.SPECIFIED_DELAY);
      case 'warn':
        Atfl.warnings.push(prc.target);
        return Promise.resolve();
    }

    var p = Promise.resolve();
    p = p.then(() => getFindElementRetryPromise(prc.target, prc.action))
      .then(ele => getActionRetryPromise(getCommand(prc.action), ele, prc));

    p = p.then(() => { Atfl.skipPenalty = 0; }) // clear penalty on successful action
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
    if (!getCommand(a.action)(a.target, a.val)) {
      console.log("Assertion false.");
      return false;
    }
  }
  console.log("Assertion true.");
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
    setTimeout(() => resolve(ele), Atfl.DEFAULT_DELAY);
  } else {
    console.log(`Failed to do ${prc.action}. Retrying...`);
    setTimeout(() => retryAction(func, ele, prc, dIdx + 1, resolve, reject),
      Atfl.ACTION_DELAYS[dIdx]);
  }
}

function getFindElementRetryPromise(path, action) {
  return new Promise(function(resolve, reject) {
    retryFindElement(path, action, 0, resolve, reject);
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
    setTimeout(() => retryFindElement(path, action, dIdx + 1, resolve, reject),
      Atfl.FIND_ELE_DELAYS[dIdx]);
  }
}

function getCommand(action) {
  console.log(Commands);
  var Command = Commands['do' + (action.charAt(0).toUpperCase() + action.substr(1))];
  if (!Command) {
    console.error(`Command does not exist: ${action}`);
  }
  return Command;
}

function getDelayPromise(delay) {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay);
  });
}

function handleError(reason) {
  // TODO handle error
  console.error("Forming sending process failed. Reason: " + reason);
}