export class ConnectorNode {
    constructor() {
        this.type = NodeType.PASS;
    }
}

export class CommandNode {
    constructor(commandStr) {
        this.type = NodeType.COMMAND;
        this.command = commandStr;
    }
}

export class ConditionalNode {
    constructor(condition) {
        this.type = NodeType.CONDITIONAL;
        this.condition = condition;
    }
}

// export class ConditionalNode {
//     // condList is a list of objects with properties 'condition', 'startNode' and 'endNode'
//     constructor(condList) {
//         this.type = NodeType.COMMAND;
//         this.aggregatorNode = new PassNode();
//         this.conditionalList = [];
//         condList.forEach((cond) => {
//             cond.endNode.next = this.aggregatorNode; // links all end nodes to the aggregator
//             this.conditionalList.push({ // store this for runtime to use.
//                 condition: cond.condition,
//                 then: cond.startNode,
//             });
//         });
//     }
//
//     set next(nextNode) {
//         this.aggregatorNode.next = nextNode;
//     }
//
//     get next() {
//         return this.aggregatorNode.next;
//     }
// }

export const NodeType = {
    PASS: 0,
    COMMAND: 1,
    CONDITIONAL: 2,
};

export function isStr(o) {
    return (typeof o === 'string');
}

export function isArr(o) {
    return Array.isArray(o);
}

export function isBool(o) {
    return (typeof o === 'boolean');
}
