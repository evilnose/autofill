"use strict";

/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
function processForms(dataArr, appAuth, skipLogin) {
  console.log("Processing forms...");
  var [app, user] = dataArr;
  user.appAuth = appAuth;

  // Duplicate app using shallow copying
  var info = $.extend({}, app);
  info.segments = [];

  // Clear process array
  info.process = [];

  var totalProcess = skipLogin ? app.process : app.login_process.concat(app.process);

  handleProcesses(info, user, totalProcess, 0);
  info.segments.push({ i: info.process.length });

  console.log("Segments: " + JSON.stringify(info.segments));
  console.log("Process: " + JSON.stringify(info.process));

  info.alt_mapping = app.alt_mapping;

  return info;
}

function handleOneProcess(info, user, p, i) {
  if (typeof p != 'string') {
    console.error(`This is not a string: ${p}`);
    // TODO throw error
    return;
  }

  var [action, target, userKey] = splitProcess(p);
  // Handle actions
  switch (action) {
    case 'open':
      recordNewPage(info, i, target);
      break;
    case 'click':
      let userVal;
      if (target.includes(INTP_IND)) {
        [target, userVal] = interpolate(target, getVal(user, userKey), info.alt_mapping);
      }
      pushToProcess(info, i, action, target, userVal);
      break;
    case 'type':
      pushToProcess(info, i, action, target, getVal(user, userKey));
      break;
    // case 'sendKeys':
    //   // userKey is the key string in this case
    //   pushToProcess(info, i, action, target, userKey);
    //   break;
    default:
      console.error(`Do not recognize action: ${action}`);
      break;
  }
}

function interpolate(target, userVal, altMapping) {
  // OPTIMIZE use indexOf to save from searching twice
  if (userVal) {
    userVal = altMapping[userVal] || userVal;
    let newTarget = target.replace(INTP_IND, userVal);
    console.log(`Interpolation success. ${target} replaced by ${newTarget}`);
    return [newTarget, userVal];
  } else {
    console.error(`Interpolation failed: No userVal. Target: ${target}`);
    return [target];
  }
}

function handleProcesses(info, user, process, idx) {
  var pLen = process.length;
  var p;
  for (let i = 0; i < pLen; i++) {
    p = process[i];
    switch (p.type) {
      case 'block':
        handleBlock(info, user, p, i + idx);
        break;
        // case 'selection':
        //   handleSelection(info, user, p, i + idx);
        //   break;
      default:
        handleOneProcess(info, user, p, i + idx);
        break;
    }
  }
}

function handleBlock(info, user, b, idx) {
  var prc;
  if (meetsReq(user, b.conditions)) {
    prc = b.process;
  } else {
    prc = b.alt;
  }

  if (!prc) {
    console.error("Block has no process.");
    return;
  } else {
    var len = prc.length;
    for (let i = 0; i < len; i++) {
      handleOneProcess(info, user, prc[i], i + idx);
    }
  }
}

// function handleSelection(info, user, selection, idx) {
//   if (!selection.requires || meetsReq(user, selection.requires)) {
//     // TODO handle preprocess
//     if (selection.match_by) {
//       delete selection.requires;
//       info.process.push(selection);
//     } else {
//       if (selection.pre)
//         var userVal = getVal(user, selection.userKey);
//       var options = selection.options;
//       var optArr;
//       if (selection.nonex) {
//         for (let i = 0; i < options.length; i++) {
//           [target, optionVal] = splitOption(option[i]);
//           if (optionVal === userVal) {
//             // Omit optionVal
//             pushToProcess(info, idx + i, selection.select_option, target);
//           } else if (selection.deselect_option) {
//             pushToProcess(info, idx + i, selection.deselect_option, target);
//           }
//         }
//       } else {
//         for (let i = 0; i < options.length; i++) {
//           [target, optionVal] = splitOption(option[i]);
//           if (optionVal === userVal) {
//             // Omit optionVal
//             pushToProcess(info, idx + i, selection.select_option, target);
//             break;
//           }
//         }
//         console.warn(`User's ${selection.userKey} matches none of the selection options.`);
//         // TODO record this
//       }
//     }
//   } else {
//     console.log(`User does not meet selection requirement(s): ${selection.requires}`);
//   }
// }

function meetsReq(user, req) {
  var len = req.length;
  for (let i = 0; i < len; i++) {
    if (!getVal(user, req[i]))
      return false;
  }
  return true;
}

function recordNewPage(info, i, target) {
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
  return p.split(OPT_SEP);
}

function splitOption(opt) {
  return opt.split(OPT_SEP);
}

function pushToProcess(info, i, action, target, userVal) {
  if (!action || !target) {
    console.error(`Process missing action and/or target: ${i}`);
    return;
    // TODO handle error?
  }

  info.process.push({
    action: action,
    target: target,
    val: userVal
  });
}

// TODO in situations where userKey is nested, we need to handle that
function getVal(user, userKey) {
  if (!userKey) {
    return null;
  }

  if (userKey.includes(SEL_SEP)) {
    var [fieldKey, optionVal] = userKey.split(SEL_SEP);
    return (_getUserVal(user, fieldKey) === optionVal);
  } else {
    if (userKey.includes(FORMAT_IND)) {
      var [newKey, format] = userKey.split(FORMAT_IND);
      return formatVal(_getUserVal(user, newKey), format);
    } else {
      return _getUserVal(user, userKey);
    }
  }
}

function _getUserVal(user, userKey) {
  if (userKey.startsWith(APP_AUTH_IND)) {
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