$(function () {
  $('#test').click(function () {
    // NOTE appName is only a temporary measure. AppId will ensure that
    // the app is unique
    chrome.runtime.sendMessage({ action: 'login', appKey: 'commonapp'});
  });
});
