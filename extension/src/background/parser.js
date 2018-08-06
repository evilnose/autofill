const constants = require('./constants.js');
const moment = require('moment');
import $ from 'jquery';

/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
exports.processForms = function (process, user, appAuth, skipLogin) {
    user.appAuth = appAuth;
    process.process = process.process || [];
    let info = $.extend({}, process);
    // Clear process array
    info.process = [];
    info.fieldCount = 0;
    let totalProcess = skipLogin ? process.process : process.login_process.concat(process.process);
    handleProcesses(info, user, totalProcess);
    console.log("Parsed succesfully!");
    info.alt_mapping = process.alt_mapping;
    return info;
};

class Parser {
    constructor(info, user) {
        this.info = info;
        this.user = user;
    }

    parse() {

    }
}

function handleOneProcess(info, user, c, imp) {
    pushToProcess(info, parseProcessStr(info, user, c, imp));
}

function parseProcessStr(info, user, cmdStr, imp) {
    let cmd = splitCommand(cmdStr);
    /* Command attributes:
     * action: a string that indicates what action to take; simple enough.
     * flag: a special attribute of the action that deserves attention
     * target: usually specifies how the DOM element can be found
     * val: (usually) the value for input; starts off as a key and later replaced with value from user object. For click
     * actions, val is omitted unless interpolation is needed, in which case val is the user value to interpolate
     * field: the practical field that this action promises to fill, for debugging and user-friendly purposes. TODO confirm
     */
    cmd.implication = imp;

    let userVal;
    // Handle actions
    switch (cmd.action) {
        case 'open':
        case 'wait':
        case 'warn':
            return cmd;
        case 'assertElementPresent':
        case 'waitForElementPresent':
            if (cmd.target.includes(constants.INTP_IND)) {
                cmd.target = interpolate(cmd.target, getVal(user, cmd.val), info.alt_mapping);
                if (!cmd.target) {
                    console.log(`Command skipped since no userVal (interp): ${cmd.target}`);
                    return;
                }
            }
            return cmd;
        case 'click':
            if (cmd.target.includes(constants.INTP_IND)) {
                cmd.target = interpolate(cmd.target, getVal(user, cmd.val), info.alt_mapping);
                cmd.field = getFieldFromKey(cmd.val);
                if (!cmd.target) {
                    console.log(`Command skipped since no userVal (interp): ${cmd.target}`);
                    return;
                }
            } else if (cmd.val && !(cmd.field = getVal(user, cmd.val)))
            // What this does: assign c.val to field if it exists; if not, return nothing. (I know, I know.)
                return;
            if (cmd.field)
                info.fieldCount++;
            return cmd;
        case 'type':
            if (!!(userVal = getVal(user, cmd.val))) {
                if (cmd.val !== '@username' && cmd.val !== '@password') {
                    cmd.field = getFieldFromKey(cmd.val);
                    info.fieldCount++;
                }
                cmd.val = userVal;
                return cmd;
            }
            console.log(`Command skipped since no userVal: ${cmd.field}`);
            return;
        // case 'sendKeys':
        //   // userKey is the key string in this case
        //   pushToProcess(info, i, action, target, userKey);
        //   break;
        default:
            console.error(`Do not recognize action: ${cmd.action}`);
            return;
    }
}

function interpolate(target, userVal, altMapping) {
    // OPTIMIZE use indexOf to save from searching twice
    if (userVal) {
        let newVal = altMapping[userVal] || userVal;
        return target.replace(constants.INTP_IND, newVal);
    } else {
        console.log(`Interpolation aborted: No userVal. Target: ${target}`);
        return null;
    }
}

function handleProcesses(info, user, process) {
    const pLen = process.length;
    for (let i = 0; i < pLen; ++i) {
        handleCommand(info, user, process[i]);
    }
}

function handleCommand(info, user, cmd, imp) {
    if (typeof cmd === 'string')
        handleOneProcess(info, user, cmd, imp);
    else
        handleConditional(info, user, cmd);
}

function getFieldFromKey(key) {
    // simply remove format stuff for now
    return key.split(constants.FORMAT_IND)[0];
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
    let c;
    if (conditionals[0].try) {
        let res = [];
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
    let arr = [];
    let len = strArr.length;
    for (let i = 0; i < len; ++i) {
        arr.push(parseProcessStr(info, user, strArr[i]));
    }
    return arr;
}

function meetsReq(user, req) {
    if (!req)
        return true;

    let len = req.length;
    for (let i = 0; i < len; ++i) {
        if (!getVal(user, req[i]))
            return false;
    }
    return true;
}

function splitCommand(c) {
    let [action, target, userKey, imp] = c.split(constants.OPT_SEP);
    let flag;
    if (action.startsWith(constants.FLAG_IND)) {
        flag = action[1];
        action = action.substr(3);
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
        let [fieldKey, optionVal] = userKey.split(constants.SEL_SEP);
        return (getUserVal(user, fieldKey) === optionVal) ? fieldKey : null;
    } else {
        if (userKey.includes(constants.FORMAT_IND)) {
            let [newKey, format] = userKey.split(constants.FORMAT_IND);
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

    let pathArr = userKey.split('.');
    let item = user;
    for (let i = 0; i < pathArr.length; ++i) {
        if (item === undefined)
            return null;
        item = item[pathArr[i]];
    }
    return item;
}

function formatVal(val, format) {
    if (!val) {
        console.log("Formatting aborted: cannot find value");
        return;
    } else if (!format) {
        return val;
    }

    let date = moment(val);
    if (date.isValid()) {
        return date.format(format);
    }
}