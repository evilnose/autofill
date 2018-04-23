/* globals document XPathResult */

import $ from 'jquery';

const BY_INDICATOR = '=';

module.exports = function getElement(path) {
  var sep = path.indexOf(BY_INDICATOR);
  var selectBy = path.substr(0, sep);
  var target = path.substr(sep + 1);
  switch (selectBy) {
    case 'id':
      // absolute. only handle id for now
      console.log(`Finding element by id: ${target}`);
      return $("#" + target);
    case 'css':
      console.log(`Finding element by css: ${target}`);
      console.log($(target));
      return $(target);
    default:
      return getElementByXPath(path);
  }
};

function getElementByXPath(xpath) {
  console.log(`Finding element by Xpath: ${xpath}`);
  return $(document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue);
}