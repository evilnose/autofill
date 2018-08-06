export class Command {
    constructor(commandStr, next) {
        this.commandStr = commandStr;
        this.next = next;
    }
}

export class Conditionals {
    // conditionList is a list of objects with and only with properties "condition" and "next". Objects in conditionList
    // are evaluated in order; as soon as one element has its conditions met, next should be executed and the rest of
    // Conditional discarded.
    constructor(conditionList) {

    }
}

