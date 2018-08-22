/* global Event */

const getElement = require('./getElement.js');

const Commands = {
    doClick: function (ele) {
        const domEle = ele[0];
        domEle.focus();
        triggerMouseEvent(domEle, "mouseover");
        triggerMouseEvent(domEle, "mousedown");
        triggerMouseEvent(domEle, "mouseup");
        triggerMouseEvent(domEle, "click");
        domEle.dispatchEvent(new Event('change'));

        // ele.focus();
        // ele.trigger('mouseover');
        // ele.trigger('mousedown');
        // ele.trigger('mouseup');
        // ele.trigger('click');

        // has not default assert, so return true
        return true;
    },

    doType: function (ele, cmd) {
        ele.focus();
        ele[0].value = cmd.val;
        // For angular form validation
        const inpEvent = new Event('input');
        const changeEvent = new Event('change');
        ele[0].dispatchEvent(inpEvent);
        ele[0].dispatchEvent(changeEvent);
        ele.blur(); // shouldn't be required but just in case
        return cmd.flag === 'a' || assertTyped(ele, cmd.val);
    },

    doWaitForElementPresent: function (ele) {
        // getElement has already ensured the existence of element
        return !!ele;
    },

    // This is an immediately invoked function (without retries)
    doAssertElementPresent: function (ele) {
        // jquery element does not exist when the array is empty
        return !!ele.length;
    },
};

module.exports = function getCommand(action) {
    const Command = Commands['do' + (action.charAt(0).toUpperCase() + action.substr(1))];
    if (!Command) {
        console.error(`Command does not exist: ${action}`);
    }
    return Command;
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
    const clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent(eventType, true, true);
    domEle.dispatchEvent(clickEvent);
}

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