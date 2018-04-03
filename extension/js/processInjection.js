"use strict";

var Atfl = {
  DELAYS: [500, 1000, 2000],
  INIT_DELAY: 1000,
  LOAD_DELAY: 500,
  LAST_ACTIONS: [],
  start
}


chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("Message received.");
    switch (request.action) {
    case 'start_prc':
      startProcess(request.prc, sendResponse);
    }
  }
);

function startProcess(process, sendRes) {
  console.log("Process loaded: " + JSON.stringify(process));
  var pLen = process.length;
  var p, wait;
  var autoNewPage = process[pLen - 1].flag === '-n';
  var promise = Promise.resolve();
  if (autoNewPage) {
    // Tell the onLoad listener to wait if redirect is done here.
    promise = promise.then(_ => sendRes({ state: 'done' }));
  }

  promise = promise.then(_ => getDelayPromise(Atfl.INIT_DELAY));

  for (var i = 0; i < pLen; i++) {
    p = process[i];
    promise = promise.then(handleAction(p.flag, p.action, p.selector, p.val, i));
  }

  promise = promise.catch(handleError);

  if (!autoNewPage) {
    // If no automatic new page, remind the eventPage now.
    promise = promise.then(_ => sendRes({ state: 'done' }));
  }
  promise = promise.then(processComplete);
}

function processComplete() {
  console.log("\nForm-sending process complete.");
}

function handleAction(flag, action, selector, val, i) {
  switch (action) {
  case 'f':
    // console.log("Fill promise added");
    return getFillP(selector, val, flag === '-l', i);
    break;
  case 'c':
    // console.log("Click promise added");
    return getClickP(selector, flag === '-l', i);
    break;
  case 'r':
    console.error("Redirect action present in process!");
    break;
  }
}

function handleError(reason) {
  // TODO handle error
  console.error("Forming sending process failed. " +
    (typeof reason === 'number' ? "Idx: " : "Reason: ") + reason)
}

function getClickP(selector, waitForLoad, idx) {
  // TODO add timeout
  if (waitForLoad) {
    return (_ => new Promise(function (resolve, reject) {
      var ele = $(selector);
      Atfl.start = new Date().getTime(); // TODO remove
      if (ele && ele[0]) {
        console.log(`Clicking ${selector}...`);
        ele[0].click();
        setTimeout(resolve, Atfl.LOAD_DELAY);
      } else {
        console.log(`ERROR: Element not found: ${selector}`);
        setTimeout(reject, Atfl.LOAD_DELAY);
      }
    }));
  } else {
    return _ => new Promise(function (resolve, reject) {
      checkRetry(selector, idx, 0, resolve, reject);
    });
  }
}

function checkRetry(selector, idx, dIdx, resolve, reject) {
  // TODO incorporate timeout
  if (dIdx === Atfl.DELAYS.length) {
    reject(idx);
    return;
  }

  console.log(`Checking at time ${new Date().getTime() - Atfl.start}`)

  if (check(selector) && assertChecked(selector)) {
    resolve();
  } else {
    setTimeout(_ => checkRetry(selector, idx, dIdx + 1, resolve, reject),
      Atfl.DELAYS[dIdx]);
  }
}

function check(selector, state = true) {
  var ele = $(selector);
  if (ele) {
    if (state)  console.log(`Checking ${selector}`);
    else        console.log(`Unchecking ${selector}`);

    $(selector).prop("checked", state);
    return true;
  } else {
    console.log(`ERROR: Element not found: ${selector}`);
    return false;
  }
}

function assertChecked(selector, state = true) {
  if ($(selector).attr('checked') === state) {
    console.log(`Asserted ${selector} check successfully.`);
    return true;
  } else {
    return false;
  }
}

function getFillP(selector, val, waitForLoad, idx) {
  // TODO add timeout
  if (waitForLoad) {
    return (_ => new Promise(function (resolve, reject) {
      var ele = $(selector);
      if (ele) {
        ele.val(val);
        setTimeout(resolve, LOAD_DELAY);
      } else {
        console.log(`ERROR: Element not found: ${selector}`);
        setTimeout(reject, LOAD_DELAY);
      }
    }));
  } else {
    return _ => new Promise(function (resolve, reject) {
      fillRetry(selector, val, idx, 0, resolve, reject);
    });
  }
}

function fillRetry(selector, val, idx, dIdx, resolve, reject) {
  if (dIdx === Atfl.DELAYS.length) {
    reject(idx);
    return;
  }

  console.log(`Filling at time ${new Date().getTime() - Atfl.start}`)

  if (fill(selector, val) && assertFilled(selector, val)) {
    resolve();
  } else {
    setTimeout(_ => fillRetry(selector, val, idx, dIdx + 1, resolve, reject),
      Atfl.DELAYS[dIdx]);
  }
}

function fill(selector, val) {
  var ele = $(selector);
  if (ele) {
    console.log(`Filling in ${selector}`);
    ele.val(val);
    return true;
  } else {
    console.log(`ERROR: Element not found: ${selector}`);
    return false;
  }
}

function assertFilled(selector, val, timeout) {
  if ($(selector).val() === val) {
    console.log(`Asserted ${selector} fill successfully.`);
    return true;
  } else {
    console.log(`Failed to fill in ${selector}`);
    return false;
  }
}

function getDelayPromise(delay) {
  console.log("Adding delay promise...");
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, delay);
  });
}
