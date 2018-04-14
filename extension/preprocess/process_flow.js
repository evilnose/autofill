var tabLoadHandler;

/*** PROCESSES PROMISE CHAIN ***/
function startProcesses(appKey, userKey, auth, skipLogin) {
  if (!auth && !skipLogin) {
    console.error("User requested login but not app auth is provided.");
  }

  // Initial condition: user has logged in and is at the home url
  console.log("Starting form-filling process...");
  return Promise.all([getAppInfo(appKey), getUserInfo(userKey)])
    .catch(failToGetInfo)
    .then(data => processForms(data, auth, skipLogin))
    .then(startFormSeq);
}

/* Given an array of messages, send them to the tab one-by-one. Note that each
 * message ends with a open, so the function waits till each message has
 * been executed, the tab has opened, and the page has loaded then runs the
 * next message
 */
function startFormSeq(info) {
  console.log("Starting form sequence...");

  var tabInfo = {};

  // TODO remove first path
  chrome.tabs.onUpdated.addListener((function () {
    // TODO make this its own method
    console.log("Update listener for processes added.");
    var idx = 0;

    /* We need to make sure two things in order to begin the next sequence
     * segment: 1) the tab is in a new page (i.e. url changed) and 2) the tab
     * has finished loading. The tab loads later than it changes url, so a state
     * machine is employed.
     */
    var newPageLoading = false;
    tabLoadHandler = function (tabId, changeInfo) {
      // make sure the updated tab is the same as our tab
      if (tabId === tabInfo.id) {
        // Make sure the tab's url has changed.
        if (changeInfo.url) {
          console.log("New page loading...URL: " + changeInfo.url);
          if (isNewDomain(changeInfo.url, info.base)) {
            interrupt('New domain');
            return;
          }
          newPageLoading = true;
        }

        if (newPageLoading && changeInfo.status === 'complete') {
          console.log("New page loaded.");
          newPageLoading = false;
          if (idx < info.segments.length) {
            prepAndSend(info, idx++, tabId, PROCESS_SCRIPTS_PATHS);
          }
        }
      }
    }
    return tabLoadHandler;
  })());
  
  newTab(null, tabId => open(tabId, getUrl(info.base, info.segments[0].path)), tabInfo);
}

/* Send the sequence at the indicated index. If the newPage sequence at the end
 * is a open, update the tab url after the messageListener receives an OK
 * from the tab, indicating that the process is done. If the last action is
 * click, then it means that the tab automatically loads a new page, then the
 * listener is not required. Regardless, there's an onLoad listener on the outside.
 */
function prepAndSend(info, idx, tabId, scriptsArr) {
  console.log("Prepping and sending...Current index: " + idx);
  // Get the index of the process one after the last newPage
  var seg = info.segments;
  var nextS = seg[idx+1];
  var iStart = seg[idx].i;
  var iEnd = (idx === seg.length - 1) ? seg.length : nextS.i;
  var targetUrl = nextS ? getUrl(info.base, nextS.path) : null;

  console.log(`Starting process index: ${iStart}. Ending: ${iEnd}.`);

  if (iStart === iEnd) {
    if (targetUrl)
      open(tabId, targetUrl);
  } else {
    var process = info.process.slice(iStart, iEnd);
    var isLast = (idx===seg.length-2);

    // Only if there is no target url AND if this is not the last segment,
    // is auto_route true
    injectAndSend(tabId, scriptsArr,
      'start_prc', { prc: process, auto_route: !targetUrl && !isLast },
      res => handleTabResponse(tabId, res, process, targetUrl, isLast));
  }
}

function isNewDomain(url, base) {
  // TODO check if url is out of the domain of base
  return false;
}

function interrupt(reason) {
  // TODO handle interruption
  console.log(`Process interrupted. Reason: ${reason}`);
}

function handleTabResponse(tabId, res, prc, targetUrl, isLast) {
  if (res) {
    // TODO handle message
    console.log("Received response from tab: " + JSON.stringify(res));
    if (isLast) {
      // The process is complete.
      processComplete();
    } else if (targetUrl) {
      // There is a target url, so we need to redirect to it manually
      open(tabId, targetUrl);
    } else {
      console.log("Next path is automatically routed.");
    }
  } else {
    // TODO handle issue
    failToDoProcess('Tab did not respond.');
  }
}

/*** AFTER PROCESSES ***/
function processComplete() {
  // TODO what happens when the form-sending process is complete?
  console.log("Form-sending process complete.")
  processCleanup();
}

function processCleanup() {
  chrome.tabs.onUpdated.removeListener(tabLoadHandler);
}

/*** ERROR HANDLERS ***/
function failToLogin() {
  console.error("Fail to login (in injection) handler not done.");
}

function failToDoProcess(reason) {
  console.error(`Fail to do process handler not done. Reason: ${reason}`);
  processCleanup();
}

// TODO handle error
function failToGetInfo(reason) {
  console.error("Fail to get info handler not done.");
  console.error(reason);
}
