/* global document */

const getElement = require('./getElement.js');

var Commands = {};

Commands.doClick = function(ele) {
  var domEle = ele[0];
  triggerMouseEvent(domEle, "mouseover");
  triggerMouseEvent(domEle, "mousedown");
  triggerMouseEvent(domEle, "mouseup");
  triggerMouseEvent(domEle, "click");
  domEle.focus();
  // has not default assert, so return true
  return true;
};

Commands.doType = function(ele, val) {
  ele.focus();
  ele.val(val);
  // node.value = '';
  // $(node).sendkeys(val);
  return assertTyped(ele, val);
};

Commands.doWaitForElementPresent = function(ele) {
  // getElement has already ensured the existense of element
  return !!ele;
};

// This is an immediately invoked function (without retries)
Commands.doAssertElementPresent = function(target) {
  // jquery element does not exist when the array is empty
  return !!(getElement(target).length);
};

// To clarify: this asserts that the "type" action is performed
function assertTyped(ele, val) {
  if (val && ele.val() === val) {
    return true;
  } else {
    console.log(`Failed to assert typed.`);
    return false;
  }
}

function triggerMouseEvent(domEle, eventType) {
  var clickEvent = document.createEvent('MouseEvents');
  clickEvent.initEvent(eventType, true, true);
  domEle.dispatchEvent(clickEvent);
}

module.exports = Commands;

// Commands.doSendKeys = function(node, keyStr) {
//   var key;

//   // This may seem hardcoded, but sendKey currently only has one
//   // possible value of ENTER
//   switch (keyStr) {
//     case '${KEY_ENTER}':
//       key = '{enter}';
//       break;
//     default:
//       console.error("Do not recognize key string.");
//       return;
//   }

//   node.focus();
//   $(node).sendkeys(key);
//   return true;
// }