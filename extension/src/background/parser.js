import {CommandNode, ConditionalNode, isStr, isArr, isBool, ConnectorNode} from "../common/utils";
const constants = require('./constants.js');
const moment = require('moment');

/* NOTE that this is somewhat redundant as it parses the file once in background.js
 * then it parses it again in injected.js, but this ensures that only the required
 * user vals are passed into injected.js
 */
exports.processForms = function (processObj, user, appAuth, skipLogin, logger) {
    user.appAuth = appAuth;
    processObj.process = processObj.process || [];

    // handleProcesses(info, user, totalProcess);
    const parser = new Parser(user);
    const info = parser.parse(processObj, skipLogin);
    logger.appendLogs("Parsed succesfully!");
    return info;
};

class Parser {
    constructor(user) {
        this.user = user;
    }

    parse(processObj, skipLogin) {
        this.info = Object.assign({}, processObj); // store all meta process info in info.
        this.info.fieldCount = 0;
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
                return cmd;
            case 'assertElementPresent':
            case 'waitForElementPresent':
                if (cmd.target.includes(constants.INTP_IND)) {
                    cmd.target = interpolate(cmd.target, this.getValAndFormat(cmd.val), this.info.alt_mapping);
                    if (!cmd.target) {
                        console.log(`Command skipped since no userVal (interp): ${cmdStr}`);
                        return;
                    }
                }
                return cmd;
            case 'click':
                if (cmd.target.includes(constants.INTP_IND)) {
                    cmd.target = interpolate(cmd.target, this.getValAndFormat(cmd.val), this.info.alt_mapping);
                    cmd.field = getFieldFromKey(cmd.val); // get the field name from a key string
                    if (!cmd.target) {
                        console.log(`Command skipped since no userVal (interp): ${cmdStr}`);
                        return;
                    }
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
                        this.info.fieldCount++;
                        console.log(cmd.field);
                    }
                    cmd.val = userVal;
                    return cmd;
                }
                console.log(`Command skipped since no userVal: ${cmdStr}`);
                return;
            default:
                throw ParseError(`Unrecognized action: ${cmdStr}`);
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
                if (cmd.target.includes(constants.INTP_IND)) {
                    cmd.target = interpolate(cmd.target, this.getValAndFormat(cmd.val), this.info.alt_mapping);
                    if (!cmd.target) {
                        console.log(`Command skipped since no userVal (interp): ${condStr}`);
                        return;
                    }
                }
                return cmd;
        }

        // Not ordinary command but condition expression.
        const sides = condStr.split(constants.SEL_SEP);

        if (sides.length === 1) {
            // no equals sign; return whether the data exists
            return !!this.getValAndFormat(sides[0], true);
        }

        const getSideVal = (sideStr) => sideStr.startsWith(constants.USER_DATA_REF) ? this.getValAndFormat(sideStr, true) : sideStr;
        let lastVal = getSideVal(sides[0]);
        for (let i = 1; i < sides.length; i++) {
            const tempVal = getSideVal(sides[i]);

            if (lastVal !== tempVal)
                return false;
            lastVal = tempVal;
        }
        return true;
    }

    // if requireExplicit is true, userKey is required to have constants.USER_DATA_REF as a prefix
    getValAndFormat(userKey, requireExplicit) {
        if (!userKey) {
            return null;
        }

        if (requireExplicit) {
            if (!userKey.startsWith(constants.USER_DATA_REF)) {
                throw new ParseError(`reference to user data in conditions requires the explicit prefix ${constants.USER_DATA_REF}`);
            }
            userKey = userKey.substr(constants.USER_DATA_REF.length + 1); // + 1 for the dot that comes after it
        }

        if (userKey.includes(constants.FORMAT_IND)) {
            let [newKey, format] = userKey.split(constants.FORMAT_IND);
            return formatVal(this.getUserVal(newKey), format);
        } else {
            return this.getUserVal(userKey);
        }

    }

    getUserVal(userKey) {
        if (userKey.startsWith(constants.APP_AUTH_IND)) {
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

    // _parseBooleanExpr(boolStr) {
    //     // TODO in a later time (recursively parse a boolean string into a binary tree)
    // }
}

function interpolate(target, userVal, altMapping) {
    if (userVal) {
        let newVal = altMapping[userVal] || userVal;
        return target.replace(constants.INTP_IND, newVal);
    } else {
        console.log(`Interpolation aborted: No userVal. Target: ${target}`);
        return null;
    }
}

function getFieldFromKey(key) {
    return key.split(constants.FORMAT_IND)[0];
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

    let date = moment(val);
    if (date.isValid()) {
        return date.format(format);
    }
}

class ParseError extends Error {
    constructor(...args) {
        super(...args);
    }
}
