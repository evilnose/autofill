import {CommandNode, ConditionalNode, isStr, isArr, isBool, ConnectorNode} from "../common/utils";
const constants = require('./constants.js');
const moment = require('moment');
const CountryCodes = require('country-code-info');

/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
exports.processForms = function (processObj, user, appAuth, skipLogin, logger) {
    user.appAuth = appAuth;
    processObj.process = processObj.process || [];
    // handleProcesses(info, user, totalProcess);
    const parser = new Parser(user, logger);
    console.log('parser created');
    try {
        const info = parser.parse(processObj, skipLogin);
        logger.appendLogs("Parsed succesfully!");
        return info;
    } catch (e) {
        logger.appendLogs(`Uncaught error in parser: ${e}`);
        console.error(e);
    }
};

export class Parser {
    constructor(user, logger) {
        this.user = user;
        this.logger = logger;
        this.info = {
            alt_mapping: {}
        }; // for testing (so that alt_mapping is there even if parse() is not called
    }

    parse(processObj, skipLogin) {
        this.info = Object.assign({}, processObj); // store all meta process info in info.
        console.log("FIELD COUNT", this.info);
        this.info.fieldCount = 0;
        this.info.alt_mapping = this.info.alt_mapping || {};
        delete this.info.process; // delete the juicy stuff to avoid confusion.
        delete this.info.login_process;
        const totalProcess = skipLogin ? processObj.process : processObj.login_process.concat(processObj.process);

        this.info.initialNode = this.chainList(totalProcess).first;
        return this.info;
    }

    /*
     * Note that all methods starting with chain take a list and an outer scope node as arguments, convert the list
     * to a linked list (sometimes doubly-linked with logic), and return the last node of the linked list. TODO this
     * description is not up to date
     */
    // "private" method; recursive.
    chainList(process) {
        const firstOne = new ConnectorNode();
        let lastOne = firstOne;
        process = isArr(process) ? process : [process];
        for (let i = 0; i < process.length; i++) {
            const cmd = process[i];
            if (isStr(cmd)) {
                const parsedCmd = this.parseCommandStr(cmd);
                // parsedCmd is undefined when cmd shouldn't be executed due to missing user information
                if (!parsedCmd)
                    continue;
                const temp = new CommandNode(parsedCmd);
                lastOne.next = temp;
                lastOne = temp;
            } else if (cmd.if) {
                // Get the entire conditional (i.e. if, elif, else)
                let condList = [{
                    condition: cmd.if,
                    then: cmd.then,
                }];
                i++;
                for (; i < process.length; i++) {
                    const cond = process[i];
                    if (cond.elif) {
                        condList.push({
                            condition: cond.elif,
                            then: cond.then,
                        });
                    } else if (cond.else) {
                        condList.push({
                            condition: true,
                            then: cond.else,
                        });
                        break;
                    } else {
                        // overshot, decrement index to counter the i++ by the outer loop
                        i--;
                        break;
                    }
                }
                const condLinkedList = this.chainConditionalList(condList);
                lastOne.next = condLinkedList.first;
                lastOne = condLinkedList.last;
            } else {
                throw new ParseError(`Expected a string or a conditional block but got ${JSON.stringify(cmd)} instead.`);
            }
        }
        return {
            first: firstOne,
            last: lastOne,
        };
    }

    chainConditionalList(condList) {
        const firstOne = new ConnectorNode();
        const exitToOuter = new ConnectorNode(); // aggregator that connects all then's to the outer scope
        let lastOne = firstOne;
        for (const cond of condList) {
            // link lastOne to the boolean conditions of the current node, and then assign current failed node to lastOne.
            const boolLinkedList = this.chainBoolListAND(cond.condition); // link failAggregator to the test evaluated next
            if (isBool(boolLinkedList) && !boolLinkedList) {
                continue; // If false, simply skip this one.
            }
            const thenLinkedList = this.chainList(cond.then);
            lastOne.next = boolLinkedList.first;
            lastOne = boolLinkedList.failed; // if failed, then evaluate the next condition
            boolLinkedList.last.altNext = thenLinkedList.first;
            thenLinkedList.last.next = exitToOuter;
        }
        lastOne.next = exitToOuter; // if all statements are evaluated to false and skipped, go to the outer scope
        return {
            first: firstOne,
            last: exitToOuter,
        };
    }

    // handles the content immediately after "if" and "elif" (i.e. condition test), chaining them into a linked list.
    //  assumed all statements to AND each other
    chainBoolListAND(testList) {
        let tests = testList;
        if (!isArr(tests)) {
            tests = [testList];
        }
        if (tests.length === 0)
            throw new ParseError("Received condition statement of length 0.");

        const failedAggregator = new ConnectorNode();
        let condition = this.parseGeneralCondition(tests[0]);
        if (isBool(condition) && !condition)
            return false; // return false now to avoid recording fields that won't be attempted
        const firstOne = new ConditionalNode(condition);
        let lastOne = firstOne;
        lastOne.next = failedAggregator;
        for (let i = 1; i < tests.length; i++) {
            const currNode = new ConditionalNode(this.parseGeneralCondition(tests[i]));
            currNode.next = failedAggregator;
            lastOne.altNext = currNode; // if the last one passed, evaluate the next test
            lastOne = currNode;
        }
        lastOne.next = failedAggregator;
        return {
            first: firstOne,
            failed: failedAggregator,
            last: lastOne,
        };
    }

    parseCommandStr(cmdStr) {
        let cmd = splitCommand(cmdStr);
        /* Command attributes:
         * action: a string that indicates what action to take; simple enough.
         * flag: a special attribute of the action that deserves attention
         * target: usually specifies how the DOM element can be found
         * val: (usually) the value for input; starts off as a key and later replaced with value from user object. For click
         * actions, val is omitted unless interpolation is needed, in which case val is the user value to interpolate
         * field: the practical field that this action promises to fill, for debugging and user-friendly purposes. TODO confirm
         */

        let userVal;
        // Handle actions
        switch (cmd.action) {
            case 'open':
            case 'wait':
            case 'warn':
            case 'pass':
            case 'halt':
                return cmd;
            case 'assertElementPresent':
            case 'waitForElementPresent':
                if (cmd.target.includes(constants.INTP_START)) {
                    cmd.target = this.interpolate(cmd.target, this.info.alt_mapping).processedStr;
                    if (!cmd.target) {
                        console.log(`Command skipped since no userVal (interp): ${cmdStr}`);
                        return;
                    }
                }
                return cmd;
            case 'click':
                if (cmd.target.includes(constants.INTP_START)) {
                    const res = this.interpolate(cmd.target, this.info.alt_mapping);
                    cmd.target = res.processedStr;
                    if (!cmd.target) {
                        console.log(`Command skipped since no userVal (interp): ${cmdStr}`);
                        return;
                    }
                    cmd.field = getFieldFromKey(cmd.val) || res.field; // get the field name from a key string
                } else if (cmd.val && !(cmd.field = this.getValAndFormat(cmd.val)))
                // What this does: assign c.val to field if it exists; if not, return nothing. (I know, I know.)
                    return;
                if (cmd.field)
                    this.info.fieldCount++;
                return cmd;
            case 'type':
                if (!!(userVal = this.getValAndFormat(cmd.val))) {
                    if (cmd.val !== '@username' && cmd.val !== '@password') {
                        cmd.field = getFieldFromKey(cmd.val);
                        console.log(cmd.field);
                    }
                    cmd.val = userVal;
                    return cmd;
                }
                console.log(`Command skipped since no userVal: ${cmdStr}`);
                return;
            default:
                throw new ParseError(`Unrecognized action: ${cmdStr}`);
        }
    }

    // Parse one condition in the AND list
    parseGeneralCondition(condition) {
        if (isStr(condition)) {
            return this.parseConditionStr(condition);
        } else if (isBool(condition)) {
            return condition;
        } else {
            throw new ParseError(`Expected condition to have type string or boolean but got '${typeof condition}' instead.`);
        }
    }

    parseConditionStr(condStr) {
        let cmd = splitCommand(condStr);
        switch (cmd.action) {
            case 'assertElementPresent':
            case 'waitForElementPresent':
                if (cmd.target.includes(constants.INTP_START)) {
                    cmd.target = this.interpolate(cmd.target, this.info.alt_mapping).processedStr;
                    if (!cmd.target) {
                        console.log(`Command skipped since no userVal (interp): ${condStr}`);
                        return;
                    }
                }
                return cmd;
        }

        // Not ordinary command but condition expression.
        const sides = condStr.split(constants.EQUALS);

        if (sides.length === 1) {
            // no equals sign; return whether the data exists
            return !!this.getValAndFormat(sides[0], true);
        }

        const getSideVal = (sideStr) => sideStr.startsWith(constants.USER_DATA_REF) ? this.getValAndFormat(sideStr, true) : sideStr;
        let lastVal = getSideVal(sides[0]);
        for (let i = 1; i < sides.length; i++) {
            const tempVal = getSideVal(sides[i]);
            if (lastVal.toLowerCase() !== tempVal.toLowerCase()) {
                return false;
            }
            lastVal = tempVal;
        }
        return true;
    }

    // if requireExplicit is true, userKey is required to have constants.USER_DATA_REF as a prefix
    getValAndFormat(userKey, requireExplicit) {
        if (!userKey) {
            return null;
        }
        if (userKey.startsWith("'") && userKey.endsWith("'"))
            return userKey.substring(1, userKey.length - 1);
        if (requireExplicit) {
            if (!userKey.startsWith(constants.USER_DATA_REF)) {
                throw new ParseError(`reference to user data in conditions requires the explicit prefix ${constants.USER_DATA_REF}`);
            }
            userKey = userKey.substr(constants.USER_DATA_REF.length + 1); // + 1 for the dot that comes after it
        }

        if (userKey.includes(constants.FORMAT_IND)) {
            let [newKey, format] = userKey.split(constants.FORMAT_IND);
            const val = this.getUserVal(newKey);
            if (this.info.alt_mapping[val]) {
                return this.info.alt_mapping[val]; // override format
            }
            return formatVal(val, format);
        } else {
            const val = this.getUserVal(userKey);
            if (!val)
                return null;
            return this.info.alt_mapping[val] || val;
        }
    }

    getUserVal(userKey) {
        if (userKey.startsWith(constants.APP_AUTH_IND)) {
            if (!this.user.appAuth) {
                throw new ParseError(`Trying to fill in '${userKey.substr(1)}' but user did not provide credentials.`);
            }
            return this.user.appAuth[userKey.substr(1)];
        }

        let pathArr = userKey.split('.');
        let item = this.user;
        for (let i = 0; i < pathArr.length; ++i) {
            if (!item)
                return null;
            item = item[pathArr[i]];
        }
        return item;
    }

    interpolate(target, altMap) {
        altMap = altMap || {};
        const s = constants.INTP_START;
        const e = constants.INTP_END;
        let processedStr = target;
        let startIx;
        let endIx = -e.length;
        let userKey;
        let newVal;
        let field = null;
        while ((startIx = processedStr.indexOf(constants.INTP_START, endIx + e.length)) !== -1) {
            endIx = processedStr.indexOf(constants.INTP_END, startIx + s.length);
            if (endIx === -1)
                throw new ParseError(`Expected '${e}' but got EOL in interpolation: '${target}'`);
            userKey = processedStr.substring(startIx + s.length, endIx);
            field = field || getFieldFromKey(userKey);
            newVal = this.getValAndFormat(userKey);
            if (!newVal) {
                this.logger.appendLogs(`Interpolation failed since user does not have value for key '${userKey}'`, true);
                return null;
            }
            processedStr = processedStr.substring(0, startIx) + newVal + processedStr.substr(endIx + e.length);
        }
        return {
            'processedStr': processedStr,
            'field': field,
        };
    }

    // _parseBooleanExpr(boolStr) {
    //     // TODO in a later time (recursively parse a boolean string into a binary tree)
    // }
}

function getFieldFromKey(key) {
    return !!key ? key.split(constants.FORMAT_IND)[0] : null;
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

function formatVal(val, format) {
    if (!val) {
        console.log("Formatting aborted: cannot find value");
        return;
    } else if (!format) {
        return val;
    }

    const COUNTRY_PREFIX = 'country-';

    if (format.startsWith('[')) {
        if (!format.endsWith(']')) {
            throw new ParseError(`Expected format string '${format}' to end with ].`);
        }
        const sepIx = format.indexOf(':');
        if (sepIx === -1) {
            throw new ParseError(`Expected separator ':' in format string '${format}'`);
        }
        try {
            const startIx = parseInt(format.substring(1, sepIx));
            const endIx = parseInt(format.substring(sepIx, -1));
            return val.substring(startIx || 0, endIx || val.length);
        } catch (e) {
            throw new ParseError(`Failed to format: ${e}`);
        }
    } else if (format.startsWith(COUNTRY_PREFIX)) {
        const ct = CountryCodes.findCountry({
            name: val,
        });
        if (ct) {
            const res = ct[format.substr(COUNTRY_PREFIX.length)];
            if (res) {
                return res;
            } else {
                throw new ParseError(`Unrecognized country format: ${format.substr(COUNTRY_PREFIX.length)} ` +
                "Recognized formats are: a2, a3, num, itu, gec, ioc, fifa, ds, wom, gaul, marc, and dial.");
            }
        } else {
            this.logger.appendLogs(`Failed to recognize country name: ${val}. Please check for spelling or try another possible name for it.`);
            return null;
        }
    } else {
        const date = moment(val);
        if (date.isValid()) {
            return date.format(format);
        } else {
            throw new ParseError(`Unrecognized format string: ${format}`);
        }
    }
}

class ParseError extends Error {
    constructor(...args) {
        super(...args);
    }
}
