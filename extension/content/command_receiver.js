
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("Message received.");
    switch (request.command) {
    case 'start_prc':
      startProcess(request.prc, request.auto_route, sendResponse);
    }
  }
);
