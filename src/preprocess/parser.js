
const constants = require('./constants.js');
const $ = require('jquery');
const moment = require('moment');

/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
exports.processForms = function (dataArr, appAuth, skipLogin) {
  console.log("Processing forms...");
  var [app, user] = dataArr;
  user.appAuth = appAuth;

  // Duplicate app
  var info = $.extend({}, app);
  info.segments = [];

  // Clear process array
  info.process = [];

  var totalProcess = skipLogin ? app.process : app.login_process.concat(app.process);

  handleProcesses(info, user, totalProcess);
  info.segments.push({ i: info.process.length });

  console.log("Segments: " + JSON.stringify(info.segments));
  console.log("Process: " + JSON.stringify(info.process));

  info.alt_mapping = app.alt_mapping;

  return info;
};

function handleOneProcess(info, user, p) {
  if (typeof p != 'string') {
    console.error(`This is not a string: ${p}`);
    return;
  }

  var parsed = parseProcessStr(info, user, p);
  if (parsed)
    if (parsed.action === 'open') {
      recordNewPage(info, parsed.target);
    } else {
      pushToProcess(info, parsed);
    }
}

function parseProcessStr(info, user, p) {
  var [action, target, userKey] = splitProcess(p);
  var userVal;
  // Handle actions
  switch (action) {
    case 'open':
    case 'wait':
    case 'warn':
      return {
        action: action,
        target: target,
      };
    case 'click':
    case 'assertElementPresent':
    case 'waitForElementPresent':
      if (target.includes(constants.INTP_IND)) {
        [target, userVal] = interpolate(target, getVal(user, userKey), info.alt_mapping);
        if (!userVal)
          return;
      }
      return {
        action: action,
        target: target,
        val: userVal,
      };
    case 'type':
      userVal = getVal(user, userKey);
      if (userVal)
        return {
          action: action,
          target: target,
          val: userVal,
        };
      return;
      // case 'sendKeys':
      //   // userKey is the key string in this case
      //   pushToProcess(info, i, action, target, userKey);
      //   break;
    default:
      console.error(`Do not recognize action: ${action}`);
      return;
  }
}

function interpolate(target, userVal, altMapping) {
  // OPTIMIZE use indexOf to save from searching twice
  if (userVal) {
    userVal = altMapping[userVal] || userVal;
    let newTarget = target.replace(constants.INTP_IND, userVal);
    console.log(`Interpolation success. ${target} replaced by ${newTarget}`);
    return [newTarget, userVal];
  } else {
    console.error(`Interpolation failed: No userVal. Target: ${target}`);
    return [target];
  }
}

function handleProcesses(info, user, process) {
  var pLen = process.length;
  var p;
  for (let i = 0; i < pLen; ++i) {
    p = process[i];
    switch (p.type) {
      case 'block':
        handleBlock(info, user, p);
        break;
        // case 'selection':
        //   handleSelection(info, user, p, i + idx);
        //   break;
      default:
        if (Array.isArray(p))
          handleConditional(info, user, p);
        else
          handleOneProcess(info, user, p);
        break;
    }
  }
}

function handleBlock(info, user, b) {
  var prc;
  if (meetsReq(user, b.conditions)) {
    prc = b.main;
  } else {
    prc = b.alt;
  }

  if (!prc) {
    console.error("Block has no process.");
    return;
  } else {
    var len = prc.length;
    for (let i = 0; i < len; ++i) {
      handleOneProcess(info, user, prc[i]);
    }
  }
}

function handleConditional(info, user, conditionals) {
  var c;
  if (conditionals[0].assertions) {
    var res = [];
    // assertion conditional, parse all assertions and commands and then append
    for (let i = 0; i < conditionals.length; ++i) {
      c = conditionals[i];
      if (c.assertions) {
        res.push({
          assertions: getParsedProcesses(info, user, c.assertions),
          commands: getParsedProcesses(info, user, c.commands),
        });
      } else {
        res.push({
          commands: getParsedProcesses(info, user, c.commands),
        });
        console.assert(i === conditionals.length - 1, "Conditional without assertions is not" +
          "the last conditional");
        break;
      }
    }
    info.process.push(res);
  } else {
    for (let i = 0; i < conditionals.length; ++i) {
      c = conditionals[i];
      if (meetsReq(user, c)) {
        handleProcesses(info, user, c.commands);
        return;
      }
    }
  }
}

function getParsedProcesses(info, user, strArr) {
  console.assert(Array.isArray(strArr), `Expected array: ${strArr}`);
  var arr = [];
  var len = strArr.length;
  for (let i = 0; i < len; ++i) {
    arr.push(parseProcessStr(info, user, strArr[i]));
  }
  return arr;
}

function meetsReq(user, req) {
  var len = req.length;
  for (let i = 0; i < len; ++i) {
    if (!getVal(user, req[i]))
      return false;
  }
  return true;
}

function recordNewPage(info, target) {
  info.segments.push({
    i: info.process.length,
    path: target
  });
}

// function handleFlag(info, i, flag, act, target) {
//   // Handle flags
//   switch (flag) {
//   case '-n':
//     // If new page is loaded after the action
//     // If action is redirect, add the path for the redirect later
//     info.segments.push({
//       i: info.length,
//       action: act,
//       path: act === 'r' ? target : null
//     });
//     break;
//   }
// }

function splitProcess(p) {
  // var [action, target, userKey] = p.split(Atfl.OPT_SEP);
  // var flag = action.startsWith('-') ? action.substr(0, 2) : null;
  // var action = flag ? action.substring(2) : action;
  // return [flag, action, target, userKey];
  return p.split(constants.OPT_SEP);
}

function pushToProcess(info, p) {
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
    return (_getUserVal(user, fieldKey) === optionVal);
  } else {
    if (userKey.includes(constants.FORMAT_IND)) {
      var [newKey, format] = userKey.split(constants.FORMAT_IND);
      return formatVal(_getUserVal(user, newKey), format);
    } else {
      return _getUserVal(user, userKey);
    }
  }
}

function _getUserVal(user, userKey) {
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
    console.log(`Formatted: ${date.format(format)}`);
    return date.format(format);
  }
}