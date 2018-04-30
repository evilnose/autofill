const constants = require('./constants.js');
const moment = require('moment');
import $ from 'jquery';

/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
exports.processForms = function(dataArr, appAuth, skipLogin) {
  console.log("Processing forms...");
  var [app, user] = dataArr;
  user.appAuth = appAuth;

  // Duplicate app
  var info = $.extend({}, app);

  // Clear process array
  info.process = [];

  var totalProcess = skipLogin ? app.process : app.login_process.concat(app.process);

  handleProcesses(info, user, totalProcess, app.login_process ? app.login_process.length : 0);

  console.log("Process: " + JSON.stringify(info.process));

  info.alt_mapping = app.alt_mapping;

  return info;
};

function handleOneProcess(info, user, c, imp) {
  pushToProcess(info, parseProcessStr(info, user, c, imp));
}

function parseProcessStr(info, user, cStr, imp) {
  var c = splitCommand(cStr);
  c.implication = imp;

  var userVal;
  // Handle actions
  switch (c.action) {
    case 'open':
    case 'wait':
    case 'warn':
      return c;
    case 'assertElementPresent':
    case 'waitForElementPresent':
      if (c.target.includes(constants.INTP_IND)) {
        c.target = interpolate(c.target, getVal(user, c.val), info.alt_mapping);
        if (!c.target) {
          console.log(`Command skipped since no userVal (interp): ${c.target}`);
          return;
        }
      }
      return c;
    case 'click':
      if (c.target.includes(constants.INTP_IND)) {
        c.target = interpolate(c.target, getVal(user, c.val), info.alt_mapping);
        c.field = c.val;
        if (!c.target) {
          console.log(`Command skipped since no userVal (interp): ${c.target}`);
          return;
        }
      } else if (c.val && !(c.field = getVal(user, c.val)))
        // assign c.val to field if it exists; if not, return.
          return;

      return c;
    case 'type':
      if (!!(userVal = getVal(user, c.val))) {
        c.field = c.val;
        c.val = userVal;
        return c;
      }
      console.log(`Command skipped since no userVal: ${c.target}`);
      return;
      // case 'sendKeys':
      //   // userKey is the key string in this case
      //   pushToProcess(info, i, action, target, userKey);
      //   break;
    default:
      console.error(`Do not recognize action: ${c.action}`);
      return;
  }
}

function interpolate(target, userVal, altMapping) {
  // OPTIMIZE use indexOf to save from searching twice
  if (userVal) {
    var newVal = altMapping[userVal] || userVal;
    return target.replace(constants.INTP_IND, newVal);
  } else {
    console.error(`Interpolation failed: No userVal. Target: ${target}`);
    return null;
  }
}

function handleProcesses(info, user, process, endOfLogin) {
  var pLen = process.length;

  if (!endOfLogin) endOfLogin = 0;
  for (let i = 0; i < endOfLogin; ++i) {
    handleCommand(info, user, process[i], 'bl');
  }
  for (let i = endOfLogin; i < pLen; ++i) {
    handleCommand(info, user, process[i]);
  }
}

function handleCommand(info, user, cmd, imp) {
  if (typeof cmd === 'string')
    handleOneProcess(info, user, cmd, imp);
  else
    handleConditional(info, user, cmd);
}

// function handleBlock(info, user, b) {
//   var prc;
//   if (meetsReq(user, b.conditions)) {
//     prc = b.main;
//   } else {
//     prc = b.alt;
//   }

//   if (!prc) {
//     console.error("Block has no process.");
//     return;
//   } else {
//     var len = prc.length;
//     for (let i = 0; i < len; ++i) {
//       handleOneProcess(info, user, prc[i]);
//     }
//   }
// }

function handleConditional(info, user, conditionals) {
  console.assert(Array.isArray(conditionals), `Expected ${conditionals} to be array.`);
  var c;
  if (conditionals[0].try) {
    var res = [];
    // assertion conditional, parse all assertions and commands and then append
    for (let i = 0; i < conditionals.length; ++i) {
      c = conditionals[i];
      if (c.try) {
        res.push({
          try: getParsedProcesses(info, user, c.try),
          commands: getParsedProcesses(info, user, c.commands),
        });
      } else {
        handleProcesses(info, user, c.commands);
        console.assert(i === conditionals.length - 1, "Conditional without assertions is not" +
          "the last conditional");
        break;
      }
    }
    info.process.push(res);
  } else {
    console.log(JSON.stringify(conditionals));
    for (let i = 0; i < conditionals.length; ++i) {
      c = conditionals[i];
      if (meetsReq(user, c.require)) {
        handleProcesses(info, user, c.commands);
        return;
      } else {
        console.log(`Requirements not met: ${c.require}; skipped.`);
      }
    }
  }
}

function getParsedProcesses(info, user, strArr) {
  console.assert(Array.isArray(strArr), `Expected ${strArr} to be array`);
  var arr = [];
  var len = strArr.length;
  for (let i = 0; i < len; ++i) {
    arr.push(parseProcessStr(info, user, strArr[i]));
  }
  return arr;
}

function meetsReq(user, req) {
  if (!req)
    return true;

  var len = req.length;
  for (let i = 0; i < len; ++i) {
    if (!getVal(user, req[i]))
      return false;
  }
  return true;
}

function splitCommand(c) {
  var [action, target, userKey, imp] = c.split(constants.OPT_SEP);
  var flag;
  if (action.startsWith(constants.FLAG_IND)) {
    flag = c[1];
    action = c.substr(3);
  }

  return {
    flag: flag,
    action: action,
    target: target,
    val: userKey,
    implication: imp,
  };
}

function pushToProcess(info, c) {
  if (!c)
    return;

  if (!c.action) {
    console.error(`Process missing action: ${c}`);
    return;
    // TODO handle error?
  }

  info.process.push(c);
}

// TODO in situations where userKey is nested, we need to handle that
function getVal(user, userKey) {
  if (!userKey) {
    return null;
  }

  if (userKey.includes(constants.SEL_SEP)) {
    var [fieldKey, optionVal] = userKey.split(constants.SEL_SEP);
    return (getUserVal(user, fieldKey) === optionVal) ? fieldKey : null;
  } else {
    if (userKey.includes(constants.FORMAT_IND)) {
      var [newKey, format] = userKey.split(constants.FORMAT_IND);
      return formatVal(getUserVal(user, newKey), format);
    } else {
      return getUserVal(user, userKey);
    }
  }
}

function getUserVal(user, userKey) {
  if (userKey.startsWith(constants.APP_AUTH_IND)) {
    return user.appAuth[userKey.substr(1)];
  }

  var pathArr = userKey.split('.');
  var item = user.profile;
  for (let i = 0; i < pathArr.length; ++i) {
    item = item[pathArr[i]];
  }
  return item;
}

function formatVal(val, format) {
  if (!val) {
    console.error("Formatting failed: cannot find value");
    return;
  } else if (!format) {
    return val;
  }

  var date = moment(val);
  if (date.isValid()) {
    return date.format(format);
  }
}