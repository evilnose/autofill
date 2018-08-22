import $ from 'jquery';

let stateDiv;
let lastEle;
let lastOutline;

export const Status = {
    IDLE: 0,
    LOCATING: 1,
    EXECUTING: 2,
    SUCCESS: 3,
    FAILED: 4,
};

export function statusChanged(status) {
    switch (status) {
        case Status.IDLE:
            stateDiv.text('Idle');
            stateDiv.css('background-color', 'gray');
            break;
        case Status.LOCATING:
            stateDiv.text('Locating');
            stateDiv.css('background-color', 'yellow');
            break;
        case Status.EXECUTING:
            stateDiv.text('Running');
            stateDiv.css('background-color', 'yellow');
            break;
        case Status.SUCCESS:
            stateDiv.text('Passing');
            stateDiv.css('background-color', 'green');
            break;
        case Status.FAILED:
            stateDiv.text('Failed');
            stateDiv.css('background-color', 'red');
    }
}

(() => {
    if (!stateDiv) {
        stateDiv = $('<div></div>');
        stateDiv.css({
            'position': 'fixed',
            'right': '1em',
            'bottom': '1em',
            'font-size': '1.2em',
            'color': 'white',
            'padding': '0.5em',
            'width': '8em',
            'text-align': 'center',
        });
        statusChanged(Status.IDLE);
        stateDiv.appendTo('body');
        console.log('stateDiv appended to body');
    }
})();

export function highlight(ele) {
    lastOutline = ele.css('outline');
    ele.css('outline', '5px solid yellow');
    lastEle = ele;
}

export function dehighlight() {
    if (lastEle) {
        lastEle.css('outline', lastOutline);
    }
}
