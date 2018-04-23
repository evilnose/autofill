const constants = require('./constants.js');
import $ from 'jquery';
const moment = require('moment');

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

  handleProcesses(info, user, totalProcess);

  console.log("Process: " + JSON.stringify(info.process));

  info.alt_mapping = app.alt_mapping;

  return info;
};

function handleOneProcess(info, user, p) {
  pushToProcess(info, parseProcessStr(info, user, p));

}

function parseProcessStr(info, user, pStr) {
  var p = splitProcess(pStr);

  var userVal;
  // Handle actions
  switch (p.action) {
    case 'open':
    case 'wait':
    case 'warn':
      return p;
    case 'click':
    case 'assertElementPresent':
    case 'waitForElementPresent':
      if (p.target.includes(constants.INTP_IND)) {
        [p.target, userVal] = interpolate(p.target, getVal(user, p.val), info.alt_mapping);
        if (!userVal) {
          console.log(`Command skipped since no userVal (interp): ${p.target}`);
          return;
        }
      }
      p.val = userVal;
      return p;
    case 'type':
      if (!!(userVal = getVal(user, p.val))) {
        p.val = userVal;
        return p;
      }
      console.log(`Command skipped since no userVal: ${p.target}`);
      return;
      // case 'sendKeys':
      //   // userKey is the key string in this case
      //   pushToProcess(info, i, action, target, userKey);
      //   break;
    default:
      console.error(`Do not recognize action: ${p.action}`);
      return;
  }
}

function interpolate(target, userVal, altMapping) {
  // OPTIMIZE use indexOf to save from searching twice
  if (userVal) {
    userVal = altMapping[userVal] || userVal;
    return [target.replace(constants.INTP_IND, userVal), userVal];
  } else {
    console.error(`Interpolation failed: No userVal. Target: ${target}`);
    return [target];
  }
}

function handleProcesses(info, user, process) {
  var pLen = process.length;
  var cmd;
  for (let i = 0; i < pLen; ++i) {
    cmd = process[i];
    if (typeof cmd === 'string')
      handleOneProcess(info, user, cmd);
    else
      handleConditional(info, user, cmd);
  }
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

function splitProcess(p) {
  var [action, target, userKey, message] = p.split(constants.OPT_SEP);
  var flag;
  if (action.startsWith(constants.FLAG_IND)) {
    flag = p[1];
    action = p.substr(3);
  }

  return {
    flag: flag,
    action: action,
    target: target,
    val: userKey,
    message: message,
  };
}

function pushToProcess(info, p) {
  if (!p)
    return;

  if (!p.action) {
    console.error(`Process missing action: ${p}`);
    return;
    // TODO handle error?
  }

  info.process.push(p);
}

// TODO in situations where userKey is nested, we need to handle that
function getVal(user, userKey) {
  if (!userKey) {
    return null;
  }

  if (userKey.includes(constants.SEL_SEP)) {
    var [fieldKey, optionVal] = userKey.split(constants.SEL_SEP);
    return (getUserVal(user, fieldKey) === optionVal);
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