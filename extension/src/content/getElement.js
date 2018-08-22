/* globals document XPathResult */

import $ from 'jquery';

const BY_INDICATOR = '=';

module.exports = function getJqElement(path) {
    const sep = path.indexOf(BY_INDICATOR);
    const selectBy = path.substr(0, sep);
    const target = path.substr(sep + 1);
    switch (selectBy) {
        case 'id':
            // absolute. only handle id for now
            console.log(`Finding element by id: ${target}`);
            return $("#" + target);
        case 'css':
            console.log(`Finding element by css: ${target}`);
            return $(target);
        case 'xpath':
            return $(getElementByXPath(target));
        case '$':
            console.log("getting jquery element");
            return $(target);
        default:
            console.log(`Finding element by Xpath: ${path}`);
            return $(getElementByXPath(path));
    }
};

function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue;
}