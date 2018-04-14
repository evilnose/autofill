const BY_INDICATOR = '=';

function getElement(path) {
  console.log(`Target: ${path}`);
  var sep = path.indexOf(BY_INDICATOR);
  var selectBy = path.substr(0, sep);
  var target = path.substr(sep + 1);
  switch (selectBy) {
    case 'id':
      // absolute. only handle id for now
      console.log(`Finding element by id: ${target}`);
      return $("#" + target);
      break;
    case 'css':
      console.log(`Finding element by css: ${target}`);
      console.log($(target));
      return $(target);
    default:
      return getElementByXPath(path);
      break;
  }
}

function getElementByXPath(xpath) {
  console.log(`Finding element by Xpath: ${xpath}`);
  return $(document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue);
}