var ActionFuncs = {}; // NOTE all action functions should return true by default

ActionFuncs.doClick = function doClick(ele) {
  var domEle = ele[0];
  triggerMouseEvent(domEle, "mouseover");
  triggerMouseEvent(domEle, "mousedown");
  triggerMouseEvent(domEle, "mouseup");
  triggerMouseEvent(domEle, "click");
  return true;
}

ActionFuncs.doType = function doType(ele, val) {
  ele.focus();
  ele.val(val);
  // node.value = '';
  // $(node).sendkeys(val);
  return true;
}

// ActionFuncs.doSendKeys = function(node, keyStr) {
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

// To clarify: this asserts that the "type" action is performed
ActionFuncs.assertType = function assertType(node, val, timeout) {
  if (val && node.val() === val) {
    return true;
  } else {
    console.log(`Failed to assert typed.`);
    return false;
  }
}

function triggerMouseEvent(node, eventType) {
  var clickEvent = document.createEvent('MouseEvents');
  clickEvent.initEvent(eventType, true, true);
  node.dispatchEvent(clickEvent);
}