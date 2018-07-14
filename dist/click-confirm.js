(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.clickConfirm = {})));
}(this, (function (exports) { 'use strict';

/**!
 * @fileOverview Kickass library to create and place poppers near their reference elements.
 * @version 1.14.3
 * @license
 * Copyright (c) 2016 Federico Zivolo and contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

var longerTimeoutBrowsers = ['Edge', 'Trident', 'Firefox'];
var timeoutDuration = 0;
for (var i = 0; i < longerTimeoutBrowsers.length; i += 1) {
  if (isBrowser && navigator.userAgent.indexOf(longerTimeoutBrowsers[i]) >= 0) {
    timeoutDuration = 1;
    break;
  }
}

function microtaskDebounce(fn) {
  var called = false;
  return function () {
    if (called) {
      return;
    }
    called = true;
    window.Promise.resolve().then(function () {
      called = false;
      fn();
    });
  };
}

function taskDebounce(fn) {
  var scheduled = false;
  return function () {
    if (!scheduled) {
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        fn();
      }, timeoutDuration);
    }
  };
}

var supportsMicroTasks = isBrowser && window.Promise;

/**
* Create a debounced version of a method, that's asynchronously deferred
* but called in the minimum time possible.
*
* @method
* @memberof Popper.Utils
* @argument {Function} fn
* @returns {Function}
*/
var debounce = supportsMicroTasks ? microtaskDebounce : taskDebounce;

/**
 * Check if the given variable is a function
 * @method
 * @memberof Popper.Utils
 * @argument {Any} functionToCheck - variable to check
 * @returns {Boolean} answer to: is a function?
 */
function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

/**
 * Get CSS computed property of the given element
 * @method
 * @memberof Popper.Utils
 * @argument {Eement} element
 * @argument {String} property
 */
function getStyleComputedProperty(element, property) {
  if (element.nodeType !== 1) {
    return [];
  }
  // NOTE: 1 DOM access here
  var css = getComputedStyle(element, null);
  return property ? css[property] : css;
}

/**
 * Returns the parentNode or the host of the element
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element
 * @returns {Element} parent
 */
function getParentNode(element) {
  if (element.nodeName === 'HTML') {
    return element;
  }
  return element.parentNode || element.host;
}

/**
 * Returns the scrolling parent of the given element
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element
 * @returns {Element} scroll parent
 */
function getScrollParent(element) {
  // Return body, `getScroll` will take care to get the correct `scrollTop` from it
  if (!element) {
    return document.body;
  }

  switch (element.nodeName) {
    case 'HTML':
    case 'BODY':
      return element.ownerDocument.body;
    case '#document':
      return element.body;
  }

  // Firefox want us to check `-x` and `-y` variations as well

  var _getStyleComputedProp = getStyleComputedProperty(element),
      overflow = _getStyleComputedProp.overflow,
      overflowX = _getStyleComputedProp.overflowX,
      overflowY = _getStyleComputedProp.overflowY;

  if (/(auto|scroll|overlay)/.test(overflow + overflowY + overflowX)) {
    return element;
  }

  return getScrollParent(getParentNode(element));
}

var isIE11 = isBrowser && !!(window.MSInputMethodContext && document.documentMode);
var isIE10 = isBrowser && /MSIE 10/.test(navigator.userAgent);

/**
 * Determines if the browser is Internet Explorer
 * @method
 * @memberof Popper.Utils
 * @param {Number} version to check
 * @returns {Boolean} isIE
 */
function isIE(version) {
  if (version === 11) {
    return isIE11;
  }
  if (version === 10) {
    return isIE10;
  }
  return isIE11 || isIE10;
}

/**
 * Returns the offset parent of the given element
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element
 * @returns {Element} offset parent
 */
function getOffsetParent(element) {
  if (!element) {
    return document.documentElement;
  }

  var noOffsetParent = isIE(10) ? document.body : null;

  // NOTE: 1 DOM access here
  var offsetParent = element.offsetParent;
  // Skip hidden elements which don't have an offsetParent
  while (offsetParent === noOffsetParent && element.nextElementSibling) {
    offsetParent = (element = element.nextElementSibling).offsetParent;
  }

  var nodeName = offsetParent && offsetParent.nodeName;

  if (!nodeName || nodeName === 'BODY' || nodeName === 'HTML') {
    return element ? element.ownerDocument.documentElement : document.documentElement;
  }

  // .offsetParent will return the closest TD or TABLE in case
  // no offsetParent is present, I hate this job...
  if (['TD', 'TABLE'].indexOf(offsetParent.nodeName) !== -1 && getStyleComputedProperty(offsetParent, 'position') === 'static') {
    return getOffsetParent(offsetParent);
  }

  return offsetParent;
}

function isOffsetContainer(element) {
  var nodeName = element.nodeName;

  if (nodeName === 'BODY') {
    return false;
  }
  return nodeName === 'HTML' || getOffsetParent(element.firstElementChild) === element;
}

/**
 * Finds the root node (document, shadowDOM root) of the given element
 * @method
 * @memberof Popper.Utils
 * @argument {Element} node
 * @returns {Element} root node
 */
function getRoot(node) {
  if (node.parentNode !== null) {
    return getRoot(node.parentNode);
  }

  return node;
}

/**
 * Finds the offset parent common to the two provided nodes
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element1
 * @argument {Element} element2
 * @returns {Element} common offset parent
 */
function findCommonOffsetParent(element1, element2) {
  // This check is needed to avoid errors in case one of the elements isn't defined for any reason
  if (!element1 || !element1.nodeType || !element2 || !element2.nodeType) {
    return document.documentElement;
  }

  // Here we make sure to give as "start" the element that comes first in the DOM
  var order = element1.compareDocumentPosition(element2) & Node.DOCUMENT_POSITION_FOLLOWING;
  var start = order ? element1 : element2;
  var end = order ? element2 : element1;

  // Get common ancestor container
  var range = document.createRange();
  range.setStart(start, 0);
  range.setEnd(end, 0);
  var commonAncestorContainer = range.commonAncestorContainer;

  // Both nodes are inside #document

  if (element1 !== commonAncestorContainer && element2 !== commonAncestorContainer || start.contains(end)) {
    if (isOffsetContainer(commonAncestorContainer)) {
      return commonAncestorContainer;
    }

    return getOffsetParent(commonAncestorContainer);
  }

  // one of the nodes is inside shadowDOM, find which one
  var element1root = getRoot(element1);
  if (element1root.host) {
    return findCommonOffsetParent(element1root.host, element2);
  } else {
    return findCommonOffsetParent(element1, getRoot(element2).host);
  }
}

/**
 * Gets the scroll value of the given element in the given side (top and left)
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element
 * @argument {String} side `top` or `left`
 * @returns {number} amount of scrolled pixels
 */
function getScroll(element) {
  var side = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'top';

  var upperSide = side === 'top' ? 'scrollTop' : 'scrollLeft';
  var nodeName = element.nodeName;

  if (nodeName === 'BODY' || nodeName === 'HTML') {
    var html = element.ownerDocument.documentElement;
    var scrollingElement = element.ownerDocument.scrollingElement || html;
    return scrollingElement[upperSide];
  }

  return element[upperSide];
}

/*
 * Sum or subtract the element scroll values (left and top) from a given rect object
 * @method
 * @memberof Popper.Utils
 * @param {Object} rect - Rect object you want to change
 * @param {HTMLElement} element - The element from the function reads the scroll values
 * @param {Boolean} subtract - set to true if you want to subtract the scroll values
 * @return {Object} rect - The modifier rect object
 */
function includeScroll(rect, element) {
  var subtract = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var scrollTop = getScroll(element, 'top');
  var scrollLeft = getScroll(element, 'left');
  var modifier = subtract ? -1 : 1;
  rect.top += scrollTop * modifier;
  rect.bottom += scrollTop * modifier;
  rect.left += scrollLeft * modifier;
  rect.right += scrollLeft * modifier;
  return rect;
}

/*
 * Helper to detect borders of a given element
 * @method
 * @memberof Popper.Utils
 * @param {CSSStyleDeclaration} styles
 * Result of `getStyleComputedProperty` on the given element
 * @param {String} axis - `x` or `y`
 * @return {number} borders - The borders size of the given axis
 */

function getBordersSize(styles, axis) {
  var sideA = axis === 'x' ? 'Left' : 'Top';
  var sideB = sideA === 'Left' ? 'Right' : 'Bottom';

  return parseFloat(styles['border' + sideA + 'Width'], 10) + parseFloat(styles['border' + sideB + 'Width'], 10);
}

function getSize(axis, body, html, computedStyle) {
  return Math.max(body['offset' + axis], body['scroll' + axis], html['client' + axis], html['offset' + axis], html['scroll' + axis], isIE(10) ? html['offset' + axis] + computedStyle['margin' + (axis === 'Height' ? 'Top' : 'Left')] + computedStyle['margin' + (axis === 'Height' ? 'Bottom' : 'Right')] : 0);
}

function getWindowSizes() {
  var body = document.body;
  var html = document.documentElement;
  var computedStyle = isIE(10) && getComputedStyle(html);

  return {
    height: getSize('Height', body, html, computedStyle),
    width: getSize('Width', body, html, computedStyle)
  };
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) { descriptor.writable = true; }
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) { defineProperties(Constructor.prototype, protoProps); }
    if (staticProps) { defineProperties(Constructor, staticProps); }
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var _extends = Object.assign || function (target) {
  var arguments$1 = arguments;

  for (var i = 1; i < arguments.length; i++) {
    var source = arguments$1[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

/**
 * Given element offsets, generate an output similar to getBoundingClientRect
 * @method
 * @memberof Popper.Utils
 * @argument {Object} offsets
 * @returns {Object} ClientRect like output
 */
function getClientRect(offsets) {
  return _extends({}, offsets, {
    right: offsets.left + offsets.width,
    bottom: offsets.top + offsets.height
  });
}

/**
 * Get bounding client rect of given element
 * @method
 * @memberof Popper.Utils
 * @param {HTMLElement} element
 * @return {Object} client rect
 */
function getBoundingClientRect(element) {
  var rect = {};

  // IE10 10 FIX: Please, don't ask, the element isn't
  // considered in DOM in some circumstances...
  // This isn't reproducible in IE10 compatibility mode of IE11
  try {
    if (isIE(10)) {
      rect = element.getBoundingClientRect();
      var scrollTop = getScroll(element, 'top');
      var scrollLeft = getScroll(element, 'left');
      rect.top += scrollTop;
      rect.left += scrollLeft;
      rect.bottom += scrollTop;
      rect.right += scrollLeft;
    } else {
      rect = element.getBoundingClientRect();
    }
  } catch (e) {}

  var result = {
    left: rect.left,
    top: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top
  };

  // subtract scrollbar size from sizes
  var sizes = element.nodeName === 'HTML' ? getWindowSizes() : {};
  var width = sizes.width || element.clientWidth || result.right - result.left;
  var height = sizes.height || element.clientHeight || result.bottom - result.top;

  var horizScrollbar = element.offsetWidth - width;
  var vertScrollbar = element.offsetHeight - height;

  // if an hypothetical scrollbar is detected, we must be sure it's not a `border`
  // we make this check conditional for performance reasons
  if (horizScrollbar || vertScrollbar) {
    var styles = getStyleComputedProperty(element);
    horizScrollbar -= getBordersSize(styles, 'x');
    vertScrollbar -= getBordersSize(styles, 'y');

    result.width -= horizScrollbar;
    result.height -= vertScrollbar;
  }

  return getClientRect(result);
}

function getOffsetRectRelativeToArbitraryNode(children, parent) {
  var fixedPosition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var isIE10 = isIE(10);
  var isHTML = parent.nodeName === 'HTML';
  var childrenRect = getBoundingClientRect(children);
  var parentRect = getBoundingClientRect(parent);
  var scrollParent = getScrollParent(children);

  var styles = getStyleComputedProperty(parent);
  var borderTopWidth = parseFloat(styles.borderTopWidth, 10);
  var borderLeftWidth = parseFloat(styles.borderLeftWidth, 10);

  // In cases where the parent is fixed, we must ignore negative scroll in offset calc
  if (fixedPosition && parent.nodeName === 'HTML') {
    parentRect.top = Math.max(parentRect.top, 0);
    parentRect.left = Math.max(parentRect.left, 0);
  }
  var offsets = getClientRect({
    top: childrenRect.top - parentRect.top - borderTopWidth,
    left: childrenRect.left - parentRect.left - borderLeftWidth,
    width: childrenRect.width,
    height: childrenRect.height
  });
  offsets.marginTop = 0;
  offsets.marginLeft = 0;

  // Subtract margins of documentElement in case it's being used as parent
  // we do this only on HTML because it's the only element that behaves
  // differently when margins are applied to it. The margins are included in
  // the box of the documentElement, in the other cases not.
  if (!isIE10 && isHTML) {
    var marginTop = parseFloat(styles.marginTop, 10);
    var marginLeft = parseFloat(styles.marginLeft, 10);

    offsets.top -= borderTopWidth - marginTop;
    offsets.bottom -= borderTopWidth - marginTop;
    offsets.left -= borderLeftWidth - marginLeft;
    offsets.right -= borderLeftWidth - marginLeft;

    // Attach marginTop and marginLeft because in some circumstances we may need them
    offsets.marginTop = marginTop;
    offsets.marginLeft = marginLeft;
  }

  if (isIE10 && !fixedPosition ? parent.contains(scrollParent) : parent === scrollParent && scrollParent.nodeName !== 'BODY') {
    offsets = includeScroll(offsets, parent);
  }

  return offsets;
}

function getViewportOffsetRectRelativeToArtbitraryNode(element) {
  var excludeScroll = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var html = element.ownerDocument.documentElement;
  var relativeOffset = getOffsetRectRelativeToArbitraryNode(element, html);
  var width = Math.max(html.clientWidth, window.innerWidth || 0);
  var height = Math.max(html.clientHeight, window.innerHeight || 0);

  var scrollTop = !excludeScroll ? getScroll(html) : 0;
  var scrollLeft = !excludeScroll ? getScroll(html, 'left') : 0;

  var offset = {
    top: scrollTop - relativeOffset.top + relativeOffset.marginTop,
    left: scrollLeft - relativeOffset.left + relativeOffset.marginLeft,
    width: width,
    height: height
  };

  return getClientRect(offset);
}

/**
 * Check if the given element is fixed or is inside a fixed parent
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element
 * @argument {Element} customContainer
 * @returns {Boolean} answer to "isFixed?"
 */
function isFixed(element) {
  var nodeName = element.nodeName;
  if (nodeName === 'BODY' || nodeName === 'HTML') {
    return false;
  }
  if (getStyleComputedProperty(element, 'position') === 'fixed') {
    return true;
  }
  return isFixed(getParentNode(element));
}

/**
 * Finds the first parent of an element that has a transformed property defined
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element
 * @returns {Element} first transformed parent or documentElement
 */

function getFixedPositionOffsetParent(element) {
  // This check is needed to avoid errors in case one of the elements isn't defined for any reason
  if (!element || !element.parentElement || isIE()) {
    return document.documentElement;
  }
  var el = element.parentElement;
  while (el && getStyleComputedProperty(el, 'transform') === 'none') {
    el = el.parentElement;
  }
  return el || document.documentElement;
}

/**
 * Computed the boundaries limits and return them
 * @method
 * @memberof Popper.Utils
 * @param {HTMLElement} popper
 * @param {HTMLElement} reference
 * @param {number} padding
 * @param {HTMLElement} boundariesElement - Element used to define the boundaries
 * @param {Boolean} fixedPosition - Is in fixed position mode
 * @returns {Object} Coordinates of the boundaries
 */
function getBoundaries(popper, reference, padding, boundariesElement) {
  var fixedPosition = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

  // NOTE: 1 DOM access here

  var boundaries = { top: 0, left: 0 };
  var offsetParent = fixedPosition ? getFixedPositionOffsetParent(popper) : findCommonOffsetParent(popper, reference);

  // Handle viewport case
  if (boundariesElement === 'viewport') {
    boundaries = getViewportOffsetRectRelativeToArtbitraryNode(offsetParent, fixedPosition);
  } else {
    // Handle other cases based on DOM element used as boundaries
    var boundariesNode = void 0;
    if (boundariesElement === 'scrollParent') {
      boundariesNode = getScrollParent(getParentNode(reference));
      if (boundariesNode.nodeName === 'BODY') {
        boundariesNode = popper.ownerDocument.documentElement;
      }
    } else if (boundariesElement === 'window') {
      boundariesNode = popper.ownerDocument.documentElement;
    } else {
      boundariesNode = boundariesElement;
    }

    var offsets = getOffsetRectRelativeToArbitraryNode(boundariesNode, offsetParent, fixedPosition);

    // In case of HTML, we need a different computation
    if (boundariesNode.nodeName === 'HTML' && !isFixed(offsetParent)) {
      var _getWindowSizes = getWindowSizes(),
          height = _getWindowSizes.height,
          width = _getWindowSizes.width;

      boundaries.top += offsets.top - offsets.marginTop;
      boundaries.bottom = height + offsets.top;
      boundaries.left += offsets.left - offsets.marginLeft;
      boundaries.right = width + offsets.left;
    } else {
      // for all the other DOM elements, this one is good
      boundaries = offsets;
    }
  }

  // Add paddings
  boundaries.left += padding;
  boundaries.top += padding;
  boundaries.right -= padding;
  boundaries.bottom -= padding;

  return boundaries;
}

function getArea(_ref) {
  var width = _ref.width,
      height = _ref.height;

  return width * height;
}

/**
 * Utility used to transform the `auto` placement to the placement with more
 * available space.
 * @method
 * @memberof Popper.Utils
 * @argument {Object} data - The data object generated by update method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function computeAutoPlacement(placement, refRect, popper, reference, boundariesElement) {
  var padding = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;

  if (placement.indexOf('auto') === -1) {
    return placement;
  }

  var boundaries = getBoundaries(popper, reference, padding, boundariesElement);

  var rects = {
    top: {
      width: boundaries.width,
      height: refRect.top - boundaries.top
    },
    right: {
      width: boundaries.right - refRect.right,
      height: boundaries.height
    },
    bottom: {
      width: boundaries.width,
      height: boundaries.bottom - refRect.bottom
    },
    left: {
      width: refRect.left - boundaries.left,
      height: boundaries.height
    }
  };

  var sortedAreas = Object.keys(rects).map(function (key) {
    return _extends({
      key: key
    }, rects[key], {
      area: getArea(rects[key])
    });
  }).sort(function (a, b) {
    return b.area - a.area;
  });

  var filteredAreas = sortedAreas.filter(function (_ref2) {
    var width = _ref2.width,
        height = _ref2.height;
    return width >= popper.clientWidth && height >= popper.clientHeight;
  });

  var computedPlacement = filteredAreas.length > 0 ? filteredAreas[0].key : sortedAreas[0].key;

  var variation = placement.split('-')[1];

  return computedPlacement + (variation ? '-' + variation : '');
}

/**
 * Get offsets to the reference element
 * @method
 * @memberof Popper.Utils
 * @param {Object} state
 * @param {Element} popper - the popper element
 * @param {Element} reference - the reference element (the popper will be relative to this)
 * @param {Element} fixedPosition - is in fixed position mode
 * @returns {Object} An object containing the offsets which will be applied to the popper
 */
function getReferenceOffsets(state, popper, reference) {
  var fixedPosition = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  var commonOffsetParent = fixedPosition ? getFixedPositionOffsetParent(popper) : findCommonOffsetParent(popper, reference);
  return getOffsetRectRelativeToArbitraryNode(reference, commonOffsetParent, fixedPosition);
}

/**
 * Get the outer sizes of the given element (offset size + margins)
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element
 * @returns {Object} object containing width and height properties
 */
function getOuterSizes(element) {
  var styles = getComputedStyle(element);
  var x = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
  var y = parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
  var result = {
    width: element.offsetWidth + y,
    height: element.offsetHeight + x
  };
  return result;
}

/**
 * Get the opposite placement of the given one
 * @method
 * @memberof Popper.Utils
 * @argument {String} placement
 * @returns {String} flipped placement
 */
function getOppositePlacement(placement) {
  var hash = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' };
  return placement.replace(/left|right|bottom|top/g, function (matched) {
    return hash[matched];
  });
}

/**
 * Get offsets to the popper
 * @method
 * @memberof Popper.Utils
 * @param {Object} position - CSS position the Popper will get applied
 * @param {HTMLElement} popper - the popper element
 * @param {Object} referenceOffsets - the reference offsets (the popper will be relative to this)
 * @param {String} placement - one of the valid placement options
 * @returns {Object} popperOffsets - An object containing the offsets which will be applied to the popper
 */
function getPopperOffsets(popper, referenceOffsets, placement) {
  placement = placement.split('-')[0];

  // Get popper node sizes
  var popperRect = getOuterSizes(popper);

  // Add position, width and height to our offsets object
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // depending by the popper placement we have to compute its offsets slightly differently
  var isHoriz = ['right', 'left'].indexOf(placement) !== -1;
  var mainSide = isHoriz ? 'top' : 'left';
  var secondarySide = isHoriz ? 'left' : 'top';
  var measurement = isHoriz ? 'height' : 'width';
  var secondaryMeasurement = !isHoriz ? 'height' : 'width';

  popperOffsets[mainSide] = referenceOffsets[mainSide] + referenceOffsets[measurement] / 2 - popperRect[measurement] / 2;
  if (placement === secondarySide) {
    popperOffsets[secondarySide] = referenceOffsets[secondarySide] - popperRect[secondaryMeasurement];
  } else {
    popperOffsets[secondarySide] = referenceOffsets[getOppositePlacement(secondarySide)];
  }

  return popperOffsets;
}

/**
 * Mimics the `find` method of Array
 * @method
 * @memberof Popper.Utils
 * @argument {Array} arr
 * @argument prop
 * @argument value
 * @returns index or -1
 */
function find(arr, check) {
  // use native find if supported
  if (Array.prototype.find) {
    return arr.find(check);
  }

  // use `filter` to obtain the same behavior of `find`
  return arr.filter(check)[0];
}

/**
 * Return the index of the matching object
 * @method
 * @memberof Popper.Utils
 * @argument {Array} arr
 * @argument prop
 * @argument value
 * @returns index or -1
 */
function findIndex(arr, prop, value) {
  // use native findIndex if supported
  if (Array.prototype.findIndex) {
    return arr.findIndex(function (cur) {
      return cur[prop] === value;
    });
  }

  // use `find` + `indexOf` if `findIndex` isn't supported
  var match = find(arr, function (obj) {
    return obj[prop] === value;
  });
  return arr.indexOf(match);
}

/**
 * Loop trough the list of modifiers and run them in order,
 * each of them will then edit the data object.
 * @method
 * @memberof Popper.Utils
 * @param {dataObject} data
 * @param {Array} modifiers
 * @param {String} ends - Optional modifier name used as stopper
 * @returns {dataObject}
 */
function runModifiers(modifiers, data, ends) {
  var modifiersToRun = ends === undefined ? modifiers : modifiers.slice(0, findIndex(modifiers, 'name', ends));

  modifiersToRun.forEach(function (modifier) {
    if (modifier['function']) {
      // eslint-disable-line dot-notation
      console.warn('`modifier.function` is deprecated, use `modifier.fn`!');
    }
    var fn = modifier['function'] || modifier.fn; // eslint-disable-line dot-notation
    if (modifier.enabled && isFunction(fn)) {
      // Add properties to offsets to make them a complete clientRect object
      // we do this before each modifier to make sure the previous one doesn't
      // mess with these values
      data.offsets.popper = getClientRect(data.offsets.popper);
      data.offsets.reference = getClientRect(data.offsets.reference);

      data = fn(data, modifier);
    }
  });

  return data;
}

/**
 * Updates the position of the popper, computing the new offsets and applying
 * the new style.<br />
 * Prefer `scheduleUpdate` over `update` because of performance reasons.
 * @method
 * @memberof Popper
 */
function update() {
  // if popper is destroyed, don't perform any further update
  if (this.state.isDestroyed) {
    return;
  }

  var data = {
    instance: this,
    styles: {},
    arrowStyles: {},
    attributes: {},
    flipped: false,
    offsets: {}
  };

  // compute reference element offsets
  data.offsets.reference = getReferenceOffsets(this.state, this.popper, this.reference, this.options.positionFixed);

  // compute auto placement, store placement inside the data object,
  // modifiers will be able to edit `placement` if needed
  // and refer to originalPlacement to know the original value
  data.placement = computeAutoPlacement(this.options.placement, data.offsets.reference, this.popper, this.reference, this.options.modifiers.flip.boundariesElement, this.options.modifiers.flip.padding);

  // store the computed placement inside `originalPlacement`
  data.originalPlacement = data.placement;

  data.positionFixed = this.options.positionFixed;

  // compute the popper offsets
  data.offsets.popper = getPopperOffsets(this.popper, data.offsets.reference, data.placement);

  data.offsets.popper.position = this.options.positionFixed ? 'fixed' : 'absolute';

  // run the modifiers
  data = runModifiers(this.modifiers, data);

  // the first `update` will call `onCreate` callback
  // the other ones will call `onUpdate` callback
  if (!this.state.isCreated) {
    this.state.isCreated = true;
    this.options.onCreate(data);
  } else {
    this.options.onUpdate(data);
  }
}

/**
 * Helper used to know if the given modifier is enabled.
 * @method
 * @memberof Popper.Utils
 * @returns {Boolean}
 */
function isModifierEnabled(modifiers, modifierName) {
  return modifiers.some(function (_ref) {
    var name = _ref.name,
        enabled = _ref.enabled;
    return enabled && name === modifierName;
  });
}

/**
 * Get the prefixed supported property name
 * @method
 * @memberof Popper.Utils
 * @argument {String} property (camelCase)
 * @returns {String} prefixed property (camelCase or PascalCase, depending on the vendor prefix)
 */
function getSupportedPropertyName(property) {
  var prefixes = [false, 'ms', 'Webkit', 'Moz', 'O'];
  var upperProp = property.charAt(0).toUpperCase() + property.slice(1);

  for (var i = 0; i < prefixes.length; i++) {
    var prefix = prefixes[i];
    var toCheck = prefix ? '' + prefix + upperProp : property;
    if (typeof document.body.style[toCheck] !== 'undefined') {
      return toCheck;
    }
  }
  return null;
}

/**
 * Destroy the popper
 * @method
 * @memberof Popper
 */
function destroy() {
  this.state.isDestroyed = true;

  // touch DOM only if `applyStyle` modifier is enabled
  if (isModifierEnabled(this.modifiers, 'applyStyle')) {
    this.popper.removeAttribute('x-placement');
    this.popper.style.position = '';
    this.popper.style.top = '';
    this.popper.style.left = '';
    this.popper.style.right = '';
    this.popper.style.bottom = '';
    this.popper.style.willChange = '';
    this.popper.style[getSupportedPropertyName('transform')] = '';
  }

  this.disableEventListeners();

  // remove the popper if user explicity asked for the deletion on destroy
  // do not use `remove` because IE11 doesn't support it
  if (this.options.removeOnDestroy) {
    this.popper.parentNode.removeChild(this.popper);
  }
  return this;
}

/**
 * Get the window associated with the element
 * @argument {Element} element
 * @returns {Window}
 */
function getWindow(element) {
  var ownerDocument = element.ownerDocument;
  return ownerDocument ? ownerDocument.defaultView : window;
}

function attachToScrollParents(scrollParent, event, callback, scrollParents) {
  var isBody = scrollParent.nodeName === 'BODY';
  var target = isBody ? scrollParent.ownerDocument.defaultView : scrollParent;
  target.addEventListener(event, callback, { passive: true });

  if (!isBody) {
    attachToScrollParents(getScrollParent(target.parentNode), event, callback, scrollParents);
  }
  scrollParents.push(target);
}

/**
 * Setup needed event listeners used to update the popper position
 * @method
 * @memberof Popper.Utils
 * @private
 */
function setupEventListeners(reference, options, state, updateBound) {
  // Resize event listener on window
  state.updateBound = updateBound;
  getWindow(reference).addEventListener('resize', state.updateBound, { passive: true });

  // Scroll event listener on scroll parents
  var scrollElement = getScrollParent(reference);
  attachToScrollParents(scrollElement, 'scroll', state.updateBound, state.scrollParents);
  state.scrollElement = scrollElement;
  state.eventsEnabled = true;

  return state;
}

/**
 * It will add resize/scroll events and start recalculating
 * position of the popper element when they are triggered.
 * @method
 * @memberof Popper
 */
function enableEventListeners() {
  if (!this.state.eventsEnabled) {
    this.state = setupEventListeners(this.reference, this.options, this.state, this.scheduleUpdate);
  }
}

/**
 * Remove event listeners used to update the popper position
 * @method
 * @memberof Popper.Utils
 * @private
 */
function removeEventListeners(reference, state) {
  // Remove resize event listener on window
  getWindow(reference).removeEventListener('resize', state.updateBound);

  // Remove scroll event listener on scroll parents
  state.scrollParents.forEach(function (target) {
    target.removeEventListener('scroll', state.updateBound);
  });

  // Reset state
  state.updateBound = null;
  state.scrollParents = [];
  state.scrollElement = null;
  state.eventsEnabled = false;
  return state;
}

/**
 * It will remove resize/scroll events and won't recalculate popper position
 * when they are triggered. It also won't trigger onUpdate callback anymore,
 * unless you call `update` method manually.
 * @method
 * @memberof Popper
 */
function disableEventListeners() {
  if (this.state.eventsEnabled) {
    cancelAnimationFrame(this.scheduleUpdate);
    this.state = removeEventListeners(this.reference, this.state);
  }
}

/**
 * Tells if a given input is a number
 * @method
 * @memberof Popper.Utils
 * @param {*} input to check
 * @return {Boolean}
 */
function isNumeric(n) {
  return n !== '' && !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Set the style to the given popper
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element - Element to apply the style to
 * @argument {Object} styles
 * Object with a list of properties and values which will be applied to the element
 */
function setStyles(element, styles) {
  Object.keys(styles).forEach(function (prop) {
    var unit = '';
    // add unit if the value is numeric and is one of the following
    if (['width', 'height', 'top', 'right', 'bottom', 'left'].indexOf(prop) !== -1 && isNumeric(styles[prop])) {
      unit = 'px';
    }
    element.style[prop] = styles[prop] + unit;
  });
}

/**
 * Set the attributes to the given popper
 * @method
 * @memberof Popper.Utils
 * @argument {Element} element - Element to apply the attributes to
 * @argument {Object} styles
 * Object with a list of properties and values which will be applied to the element
 */
function setAttributes(element, attributes) {
  Object.keys(attributes).forEach(function (prop) {
    var value = attributes[prop];
    if (value !== false) {
      element.setAttribute(prop, attributes[prop]);
    } else {
      element.removeAttribute(prop);
    }
  });
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by `update` method
 * @argument {Object} data.styles - List of style properties - values to apply to popper element
 * @argument {Object} data.attributes - List of attribute properties - values to apply to popper element
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The same data object
 */
function applyStyle(data) {
  // any property present in `data.styles` will be applied to the popper,
  // in this way we can make the 3rd party modifiers add custom styles to it
  // Be aware, modifiers could override the properties defined in the previous
  // lines of this modifier!
  setStyles(data.instance.popper, data.styles);

  // any property present in `data.attributes` will be applied to the popper,
  // they will be set as HTML attributes of the element
  setAttributes(data.instance.popper, data.attributes);

  // if arrowElement is defined and arrowStyles has some properties
  if (data.arrowElement && Object.keys(data.arrowStyles).length) {
    setStyles(data.arrowElement, data.arrowStyles);
  }

  return data;
}

/**
 * Set the x-placement attribute before everything else because it could be used
 * to add margins to the popper margins needs to be calculated to get the
 * correct popper offsets.
 * @method
 * @memberof Popper.modifiers
 * @param {HTMLElement} reference - The reference element used to position the popper
 * @param {HTMLElement} popper - The HTML element used as popper
 * @param {Object} options - Popper.js options
 */
function applyStyleOnLoad(reference, popper, options, modifierOptions, state) {
  // compute reference element offsets
  var referenceOffsets = getReferenceOffsets(state, popper, reference, options.positionFixed);

  // compute auto placement, store placement inside the data object,
  // modifiers will be able to edit `placement` if needed
  // and refer to originalPlacement to know the original value
  var placement = computeAutoPlacement(options.placement, referenceOffsets, popper, reference, options.modifiers.flip.boundariesElement, options.modifiers.flip.padding);

  popper.setAttribute('x-placement', placement);

  // Apply `position` to popper before anything else because
  // without the position applied we can't guarantee correct computations
  setStyles(popper, { position: options.positionFixed ? 'fixed' : 'absolute' });

  return options;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by `update` method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function computeStyle(data, options) {
  var x = options.x,
      y = options.y;
  var popper = data.offsets.popper;

  // Remove this legacy support in Popper.js v2

  var legacyGpuAccelerationOption = find(data.instance.modifiers, function (modifier) {
    return modifier.name === 'applyStyle';
  }).gpuAcceleration;
  if (legacyGpuAccelerationOption !== undefined) {
    console.warn('WARNING: `gpuAcceleration` option moved to `computeStyle` modifier and will not be supported in future versions of Popper.js!');
  }
  var gpuAcceleration = legacyGpuAccelerationOption !== undefined ? legacyGpuAccelerationOption : options.gpuAcceleration;

  var offsetParent = getOffsetParent(data.instance.popper);
  var offsetParentRect = getBoundingClientRect(offsetParent);

  // Styles
  var styles = {
    position: popper.position
  };

  // Avoid blurry text by using full pixel integers.
  // For pixel-perfect positioning, top/bottom prefers rounded
  // values, while left/right prefers floored values.
  var offsets = {
    left: Math.floor(popper.left),
    top: Math.round(popper.top),
    bottom: Math.round(popper.bottom),
    right: Math.floor(popper.right)
  };

  var sideA = x === 'bottom' ? 'top' : 'bottom';
  var sideB = y === 'right' ? 'left' : 'right';

  // if gpuAcceleration is set to `true` and transform is supported,
  //  we use `translate3d` to apply the position to the popper we
  // automatically use the supported prefixed version if needed
  var prefixedProperty = getSupportedPropertyName('transform');

  // now, let's make a step back and look at this code closely (wtf?)
  // If the content of the popper grows once it's been positioned, it
  // may happen that the popper gets misplaced because of the new content
  // overflowing its reference element
  // To avoid this problem, we provide two options (x and y), which allow
  // the consumer to define the offset origin.
  // If we position a popper on top of a reference element, we can set
  // `x` to `top` to make the popper grow towards its top instead of
  // its bottom.
  var left = void 0,
      top = void 0;
  if (sideA === 'bottom') {
    top = -offsetParentRect.height + offsets.bottom;
  } else {
    top = offsets.top;
  }
  if (sideB === 'right') {
    left = -offsetParentRect.width + offsets.right;
  } else {
    left = offsets.left;
  }
  if (gpuAcceleration && prefixedProperty) {
    styles[prefixedProperty] = 'translate3d(' + left + 'px, ' + top + 'px, 0)';
    styles[sideA] = 0;
    styles[sideB] = 0;
    styles.willChange = 'transform';
  } else {
    // othwerise, we use the standard `top`, `left`, `bottom` and `right` properties
    var invertTop = sideA === 'bottom' ? -1 : 1;
    var invertLeft = sideB === 'right' ? -1 : 1;
    styles[sideA] = top * invertTop;
    styles[sideB] = left * invertLeft;
    styles.willChange = sideA + ', ' + sideB;
  }

  // Attributes
  var attributes = {
    'x-placement': data.placement
  };

  // Update `data` attributes, styles and arrowStyles
  data.attributes = _extends({}, attributes, data.attributes);
  data.styles = _extends({}, styles, data.styles);
  data.arrowStyles = _extends({}, data.offsets.arrow, data.arrowStyles);

  return data;
}

/**
 * Helper used to know if the given modifier depends from another one.<br />
 * It checks if the needed modifier is listed and enabled.
 * @method
 * @memberof Popper.Utils
 * @param {Array} modifiers - list of modifiers
 * @param {String} requestingName - name of requesting modifier
 * @param {String} requestedName - name of requested modifier
 * @returns {Boolean}
 */
function isModifierRequired(modifiers, requestingName, requestedName) {
  var requesting = find(modifiers, function (_ref) {
    var name = _ref.name;
    return name === requestingName;
  });

  var isRequired = !!requesting && modifiers.some(function (modifier) {
    return modifier.name === requestedName && modifier.enabled && modifier.order < requesting.order;
  });

  if (!isRequired) {
    var _requesting = '`' + requestingName + '`';
    var requested = '`' + requestedName + '`';
    console.warn(requested + ' modifier is required by ' + _requesting + ' modifier in order to work, be sure to include it before ' + _requesting + '!');
  }
  return isRequired;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by update method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function arrow(data, options) {
  var _data$offsets$arrow;

  // arrow depends on keepTogether in order to work
  if (!isModifierRequired(data.instance.modifiers, 'arrow', 'keepTogether')) {
    return data;
  }

  var arrowElement = options.element;

  // if arrowElement is a string, suppose it's a CSS selector
  if (typeof arrowElement === 'string') {
    arrowElement = data.instance.popper.querySelector(arrowElement);

    // if arrowElement is not found, don't run the modifier
    if (!arrowElement) {
      return data;
    }
  } else {
    // if the arrowElement isn't a query selector we must check that the
    // provided DOM node is child of its popper node
    if (!data.instance.popper.contains(arrowElement)) {
      console.warn('WARNING: `arrow.element` must be child of its popper element!');
      return data;
    }
  }

  var placement = data.placement.split('-')[0];
  var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;

  var isVertical = ['left', 'right'].indexOf(placement) !== -1;

  var len = isVertical ? 'height' : 'width';
  var sideCapitalized = isVertical ? 'Top' : 'Left';
  var side = sideCapitalized.toLowerCase();
  var altSide = isVertical ? 'left' : 'top';
  var opSide = isVertical ? 'bottom' : 'right';
  var arrowElementSize = getOuterSizes(arrowElement)[len];

  //
  // extends keepTogether behavior making sure the popper and its
  // reference have enough pixels in conjuction
  //

  // top/left side
  if (reference[opSide] - arrowElementSize < popper[side]) {
    data.offsets.popper[side] -= popper[side] - (reference[opSide] - arrowElementSize);
  }
  // bottom/right side
  if (reference[side] + arrowElementSize > popper[opSide]) {
    data.offsets.popper[side] += reference[side] + arrowElementSize - popper[opSide];
  }
  data.offsets.popper = getClientRect(data.offsets.popper);

  // compute center of the popper
  var center = reference[side] + reference[len] / 2 - arrowElementSize / 2;

  // Compute the sideValue using the updated popper offsets
  // take popper margin in account because we don't have this info available
  var css = getStyleComputedProperty(data.instance.popper);
  var popperMarginSide = parseFloat(css['margin' + sideCapitalized], 10);
  var popperBorderSide = parseFloat(css['border' + sideCapitalized + 'Width'], 10);
  var sideValue = center - data.offsets.popper[side] - popperMarginSide - popperBorderSide;

  // prevent arrowElement from being placed not contiguously to its popper
  sideValue = Math.max(Math.min(popper[len] - arrowElementSize, sideValue), 0);

  data.arrowElement = arrowElement;
  data.offsets.arrow = (_data$offsets$arrow = {}, defineProperty(_data$offsets$arrow, side, Math.round(sideValue)), defineProperty(_data$offsets$arrow, altSide, ''), _data$offsets$arrow);

  return data;
}

/**
 * Get the opposite placement variation of the given one
 * @method
 * @memberof Popper.Utils
 * @argument {String} placement variation
 * @returns {String} flipped placement variation
 */
function getOppositeVariation(variation) {
  if (variation === 'end') {
    return 'start';
  } else if (variation === 'start') {
    return 'end';
  }
  return variation;
}

/**
 * List of accepted placements to use as values of the `placement` option.<br />
 * Valid placements are:
 * - `auto`
 * - `top`
 * - `right`
 * - `bottom`
 * - `left`
 *
 * Each placement can have a variation from this list:
 * - `-start`
 * - `-end`
 *
 * Variations are interpreted easily if you think of them as the left to right
 * written languages. Horizontally (`top` and `bottom`), `start` is left and `end`
 * is right.<br />
 * Vertically (`left` and `right`), `start` is top and `end` is bottom.
 *
 * Some valid examples are:
 * - `top-end` (on top of reference, right aligned)
 * - `right-start` (on right of reference, top aligned)
 * - `bottom` (on bottom, centered)
 * - `auto-right` (on the side with more space available, alignment depends by placement)
 *
 * @static
 * @type {Array}
 * @enum {String}
 * @readonly
 * @method placements
 * @memberof Popper
 */
var placements = ['auto-start', 'auto', 'auto-end', 'top-start', 'top', 'top-end', 'right-start', 'right', 'right-end', 'bottom-end', 'bottom', 'bottom-start', 'left-end', 'left', 'left-start'];

// Get rid of `auto` `auto-start` and `auto-end`
var validPlacements = placements.slice(3);

/**
 * Given an initial placement, returns all the subsequent placements
 * clockwise (or counter-clockwise).
 *
 * @method
 * @memberof Popper.Utils
 * @argument {String} placement - A valid placement (it accepts variations)
 * @argument {Boolean} counter - Set to true to walk the placements counterclockwise
 * @returns {Array} placements including their variations
 */
function clockwise(placement) {
  var counter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var index = validPlacements.indexOf(placement);
  var arr = validPlacements.slice(index + 1).concat(validPlacements.slice(0, index));
  return counter ? arr.reverse() : arr;
}

var BEHAVIORS = {
  FLIP: 'flip',
  CLOCKWISE: 'clockwise',
  COUNTERCLOCKWISE: 'counterclockwise'
};

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by update method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function flip(data, options) {
  // if `inner` modifier is enabled, we can't use the `flip` modifier
  if (isModifierEnabled(data.instance.modifiers, 'inner')) {
    return data;
  }

  if (data.flipped && data.placement === data.originalPlacement) {
    // seems like flip is trying to loop, probably there's not enough space on any of the flippable sides
    return data;
  }

  var boundaries = getBoundaries(data.instance.popper, data.instance.reference, options.padding, options.boundariesElement, data.positionFixed);

  var placement = data.placement.split('-')[0];
  var placementOpposite = getOppositePlacement(placement);
  var variation = data.placement.split('-')[1] || '';

  var flipOrder = [];

  switch (options.behavior) {
    case BEHAVIORS.FLIP:
      flipOrder = [placement, placementOpposite];
      break;
    case BEHAVIORS.CLOCKWISE:
      flipOrder = clockwise(placement);
      break;
    case BEHAVIORS.COUNTERCLOCKWISE:
      flipOrder = clockwise(placement, true);
      break;
    default:
      flipOrder = options.behavior;
  }

  flipOrder.forEach(function (step, index) {
    if (placement !== step || flipOrder.length === index + 1) {
      return data;
    }

    placement = data.placement.split('-')[0];
    placementOpposite = getOppositePlacement(placement);

    var popperOffsets = data.offsets.popper;
    var refOffsets = data.offsets.reference;

    // using floor because the reference offsets may contain decimals we are not going to consider here
    var floor = Math.floor;
    var overlapsRef = placement === 'left' && floor(popperOffsets.right) > floor(refOffsets.left) || placement === 'right' && floor(popperOffsets.left) < floor(refOffsets.right) || placement === 'top' && floor(popperOffsets.bottom) > floor(refOffsets.top) || placement === 'bottom' && floor(popperOffsets.top) < floor(refOffsets.bottom);

    var overflowsLeft = floor(popperOffsets.left) < floor(boundaries.left);
    var overflowsRight = floor(popperOffsets.right) > floor(boundaries.right);
    var overflowsTop = floor(popperOffsets.top) < floor(boundaries.top);
    var overflowsBottom = floor(popperOffsets.bottom) > floor(boundaries.bottom);

    var overflowsBoundaries = placement === 'left' && overflowsLeft || placement === 'right' && overflowsRight || placement === 'top' && overflowsTop || placement === 'bottom' && overflowsBottom;

    // flip the variation if required
    var isVertical = ['top', 'bottom'].indexOf(placement) !== -1;
    var flippedVariation = !!options.flipVariations && (isVertical && variation === 'start' && overflowsLeft || isVertical && variation === 'end' && overflowsRight || !isVertical && variation === 'start' && overflowsTop || !isVertical && variation === 'end' && overflowsBottom);

    if (overlapsRef || overflowsBoundaries || flippedVariation) {
      // this boolean to detect any flip loop
      data.flipped = true;

      if (overlapsRef || overflowsBoundaries) {
        placement = flipOrder[index + 1];
      }

      if (flippedVariation) {
        variation = getOppositeVariation(variation);
      }

      data.placement = placement + (variation ? '-' + variation : '');

      // this object contains `position`, we want to preserve it along with
      // any additional property we may add in the future
      data.offsets.popper = _extends({}, data.offsets.popper, getPopperOffsets(data.instance.popper, data.offsets.reference, data.placement));

      data = runModifiers(data.instance.modifiers, data, 'flip');
    }
  });
  return data;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by update method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function keepTogether(data) {
  var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;

  var placement = data.placement.split('-')[0];
  var floor = Math.floor;
  var isVertical = ['top', 'bottom'].indexOf(placement) !== -1;
  var side = isVertical ? 'right' : 'bottom';
  var opSide = isVertical ? 'left' : 'top';
  var measurement = isVertical ? 'width' : 'height';

  if (popper[side] < floor(reference[opSide])) {
    data.offsets.popper[opSide] = floor(reference[opSide]) - popper[measurement];
  }
  if (popper[opSide] > floor(reference[side])) {
    data.offsets.popper[opSide] = floor(reference[side]);
  }

  return data;
}

/**
 * Converts a string containing value + unit into a px value number
 * @function
 * @memberof {modifiers~offset}
 * @private
 * @argument {String} str - Value + unit string
 * @argument {String} measurement - `height` or `width`
 * @argument {Object} popperOffsets
 * @argument {Object} referenceOffsets
 * @returns {Number|String}
 * Value in pixels, or original string if no values were extracted
 */
function toValue(str, measurement, popperOffsets, referenceOffsets) {
  // separate value from unit
  var split = str.match(/((?:\-|\+)?\d*\.?\d*)(.*)/);
  var value = +split[1];
  var unit = split[2];

  // If it's not a number it's an operator, I guess
  if (!value) {
    return str;
  }

  if (unit.indexOf('%') === 0) {
    var element = void 0;
    switch (unit) {
      case '%p':
        element = popperOffsets;
        break;
      case '%':
      case '%r':
      default:
        element = referenceOffsets;
    }

    var rect = getClientRect(element);
    return rect[measurement] / 100 * value;
  } else if (unit === 'vh' || unit === 'vw') {
    // if is a vh or vw, we calculate the size based on the viewport
    var size = void 0;
    if (unit === 'vh') {
      size = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    } else {
      size = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    }
    return size / 100 * value;
  } else {
    // if is an explicit pixel unit, we get rid of the unit and keep the value
    // if is an implicit unit, it's px, and we return just the value
    return value;
  }
}

/**
 * Parse an `offset` string to extrapolate `x` and `y` numeric offsets.
 * @function
 * @memberof {modifiers~offset}
 * @private
 * @argument {String} offset
 * @argument {Object} popperOffsets
 * @argument {Object} referenceOffsets
 * @argument {String} basePlacement
 * @returns {Array} a two cells array with x and y offsets in numbers
 */
function parseOffset(offset, popperOffsets, referenceOffsets, basePlacement) {
  var offsets = [0, 0];

  // Use height if placement is left or right and index is 0 otherwise use width
  // in this way the first offset will use an axis and the second one
  // will use the other one
  var useHeight = ['right', 'left'].indexOf(basePlacement) !== -1;

  // Split the offset string to obtain a list of values and operands
  // The regex addresses values with the plus or minus sign in front (+10, -20, etc)
  var fragments = offset.split(/(\+|\-)/).map(function (frag) {
    return frag.trim();
  });

  // Detect if the offset string contains a pair of values or a single one
  // they could be separated by comma or space
  var divider = fragments.indexOf(find(fragments, function (frag) {
    return frag.search(/,|\s/) !== -1;
  }));

  if (fragments[divider] && fragments[divider].indexOf(',') === -1) {
    console.warn('Offsets separated by white space(s) are deprecated, use a comma (,) instead.');
  }

  // If divider is found, we divide the list of values and operands to divide
  // them by ofset X and Y.
  var splitRegex = /\s*,\s*|\s+/;
  var ops = divider !== -1 ? [fragments.slice(0, divider).concat([fragments[divider].split(splitRegex)[0]]), [fragments[divider].split(splitRegex)[1]].concat(fragments.slice(divider + 1))] : [fragments];

  // Convert the values with units to absolute pixels to allow our computations
  ops = ops.map(function (op, index) {
    // Most of the units rely on the orientation of the popper
    var measurement = (index === 1 ? !useHeight : useHeight) ? 'height' : 'width';
    var mergeWithPrevious = false;
    return op
    // This aggregates any `+` or `-` sign that aren't considered operators
    // e.g.: 10 + +5 => [10, +, +5]
    .reduce(function (a, b) {
      if (a[a.length - 1] === '' && ['+', '-'].indexOf(b) !== -1) {
        a[a.length - 1] = b;
        mergeWithPrevious = true;
        return a;
      } else if (mergeWithPrevious) {
        a[a.length - 1] += b;
        mergeWithPrevious = false;
        return a;
      } else {
        return a.concat(b);
      }
    }, [])
    // Here we convert the string values into number values (in px)
    .map(function (str) {
      return toValue(str, measurement, popperOffsets, referenceOffsets);
    });
  });

  // Loop trough the offsets arrays and execute the operations
  ops.forEach(function (op, index) {
    op.forEach(function (frag, index2) {
      if (isNumeric(frag)) {
        offsets[index] += frag * (op[index2 - 1] === '-' ? -1 : 1);
      }
    });
  });
  return offsets;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by update method
 * @argument {Object} options - Modifiers configuration and options
 * @argument {Number|String} options.offset=0
 * The offset value as described in the modifier description
 * @returns {Object} The data object, properly modified
 */
function offset(data, _ref) {
  var offset = _ref.offset;
  var placement = data.placement,
      _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;

  var basePlacement = placement.split('-')[0];

  var offsets = void 0;
  if (isNumeric(+offset)) {
    offsets = [+offset, 0];
  } else {
    offsets = parseOffset(offset, popper, reference, basePlacement);
  }

  if (basePlacement === 'left') {
    popper.top += offsets[0];
    popper.left -= offsets[1];
  } else if (basePlacement === 'right') {
    popper.top += offsets[0];
    popper.left += offsets[1];
  } else if (basePlacement === 'top') {
    popper.left += offsets[0];
    popper.top -= offsets[1];
  } else if (basePlacement === 'bottom') {
    popper.left += offsets[0];
    popper.top += offsets[1];
  }

  data.popper = popper;
  return data;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by `update` method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function preventOverflow(data, options) {
  var boundariesElement = options.boundariesElement || getOffsetParent(data.instance.popper);

  // If offsetParent is the reference element, we really want to
  // go one step up and use the next offsetParent as reference to
  // avoid to make this modifier completely useless and look like broken
  if (data.instance.reference === boundariesElement) {
    boundariesElement = getOffsetParent(boundariesElement);
  }

  // NOTE: DOM access here
  // resets the popper's position so that the document size can be calculated excluding
  // the size of the popper element itself
  var transformProp = getSupportedPropertyName('transform');
  var popperStyles = data.instance.popper.style; // assignment to help minification
  var top = popperStyles.top,
      left = popperStyles.left,
      transform = popperStyles[transformProp];

  popperStyles.top = '';
  popperStyles.left = '';
  popperStyles[transformProp] = '';

  var boundaries = getBoundaries(data.instance.popper, data.instance.reference, options.padding, boundariesElement, data.positionFixed);

  // NOTE: DOM access here
  // restores the original style properties after the offsets have been computed
  popperStyles.top = top;
  popperStyles.left = left;
  popperStyles[transformProp] = transform;

  options.boundaries = boundaries;

  var order = options.priority;
  var popper = data.offsets.popper;

  var check = {
    primary: function primary(placement) {
      var value = popper[placement];
      if (popper[placement] < boundaries[placement] && !options.escapeWithReference) {
        value = Math.max(popper[placement], boundaries[placement]);
      }
      return defineProperty({}, placement, value);
    },
    secondary: function secondary(placement) {
      var mainSide = placement === 'right' ? 'left' : 'top';
      var value = popper[mainSide];
      if (popper[placement] > boundaries[placement] && !options.escapeWithReference) {
        value = Math.min(popper[mainSide], boundaries[placement] - (placement === 'right' ? popper.width : popper.height));
      }
      return defineProperty({}, mainSide, value);
    }
  };

  order.forEach(function (placement) {
    var side = ['left', 'top'].indexOf(placement) !== -1 ? 'primary' : 'secondary';
    popper = _extends({}, popper, check[side](placement));
  });

  data.offsets.popper = popper;

  return data;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by `update` method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function shift(data) {
  var placement = data.placement;
  var basePlacement = placement.split('-')[0];
  var shiftvariation = placement.split('-')[1];

  // if shift shiftvariation is specified, run the modifier
  if (shiftvariation) {
    var _data$offsets = data.offsets,
        reference = _data$offsets.reference,
        popper = _data$offsets.popper;

    var isVertical = ['bottom', 'top'].indexOf(basePlacement) !== -1;
    var side = isVertical ? 'left' : 'top';
    var measurement = isVertical ? 'width' : 'height';

    var shiftOffsets = {
      start: defineProperty({}, side, reference[side]),
      end: defineProperty({}, side, reference[side] + reference[measurement] - popper[measurement])
    };

    data.offsets.popper = _extends({}, popper, shiftOffsets[shiftvariation]);
  }

  return data;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by update method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function hide(data) {
  if (!isModifierRequired(data.instance.modifiers, 'hide', 'preventOverflow')) {
    return data;
  }

  var refRect = data.offsets.reference;
  var bound = find(data.instance.modifiers, function (modifier) {
    return modifier.name === 'preventOverflow';
  }).boundaries;

  if (refRect.bottom < bound.top || refRect.left > bound.right || refRect.top > bound.bottom || refRect.right < bound.left) {
    // Avoid unnecessary DOM access if visibility hasn't changed
    if (data.hide === true) {
      return data;
    }

    data.hide = true;
    data.attributes['x-out-of-boundaries'] = '';
  } else {
    // Avoid unnecessary DOM access if visibility hasn't changed
    if (data.hide === false) {
      return data;
    }

    data.hide = false;
    data.attributes['x-out-of-boundaries'] = false;
  }

  return data;
}

/**
 * @function
 * @memberof Modifiers
 * @argument {Object} data - The data object generated by `update` method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {Object} The data object, properly modified
 */
function inner(data) {
  var placement = data.placement;
  var basePlacement = placement.split('-')[0];
  var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;

  var isHoriz = ['left', 'right'].indexOf(basePlacement) !== -1;

  var subtractLength = ['top', 'left'].indexOf(basePlacement) === -1;

  popper[isHoriz ? 'left' : 'top'] = reference[basePlacement] - (subtractLength ? popper[isHoriz ? 'width' : 'height'] : 0);

  data.placement = getOppositePlacement(placement);
  data.offsets.popper = getClientRect(popper);

  return data;
}

/**
 * Modifier function, each modifier can have a function of this type assigned
 * to its `fn` property.<br />
 * These functions will be called on each update, this means that you must
 * make sure they are performant enough to avoid performance bottlenecks.
 *
 * @function ModifierFn
 * @argument {dataObject} data - The data object generated by `update` method
 * @argument {Object} options - Modifiers configuration and options
 * @returns {dataObject} The data object, properly modified
 */

/**
 * Modifiers are plugins used to alter the behavior of your poppers.<br />
 * Popper.js uses a set of 9 modifiers to provide all the basic functionalities
 * needed by the library.
 *
 * Usually you don't want to override the `order`, `fn` and `onLoad` props.
 * All the other properties are configurations that could be tweaked.
 * @namespace modifiers
 */
var modifiers = {
  /**
   * Modifier used to shift the popper on the start or end of its reference
   * element.<br />
   * It will read the variation of the `placement` property.<br />
   * It can be one either `-end` or `-start`.
   * @memberof modifiers
   * @inner
   */
  shift: {
    /** @prop {number} order=100 - Index used to define the order of execution */
    order: 100,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: shift
  },

  /**
   * The `offset` modifier can shift your popper on both its axis.
   *
   * It accepts the following units:
   * - `px` or unitless, interpreted as pixels
   * - `%` or `%r`, percentage relative to the length of the reference element
   * - `%p`, percentage relative to the length of the popper element
   * - `vw`, CSS viewport width unit
   * - `vh`, CSS viewport height unit
   *
   * For length is intended the main axis relative to the placement of the popper.<br />
   * This means that if the placement is `top` or `bottom`, the length will be the
   * `width`. In case of `left` or `right`, it will be the height.
   *
   * You can provide a single value (as `Number` or `String`), or a pair of values
   * as `String` divided by a comma or one (or more) white spaces.<br />
   * The latter is a deprecated method because it leads to confusion and will be
   * removed in v2.<br />
   * Additionally, it accepts additions and subtractions between different units.
   * Note that multiplications and divisions aren't supported.
   *
   * Valid examples are:
   * ```
   * 10
   * '10%'
   * '10, 10'
   * '10%, 10'
   * '10 + 10%'
   * '10 - 5vh + 3%'
   * '-10px + 5vh, 5px - 6%'
   * ```
   * > **NB**: If you desire to apply offsets to your poppers in a way that may make them overlap
   * > with their reference element, unfortunately, you will have to disable the `flip` modifier.
   * > More on this [reading this issue](https://github.com/FezVrasta/popper.js/issues/373)
   *
   * @memberof modifiers
   * @inner
   */
  offset: {
    /** @prop {number} order=200 - Index used to define the order of execution */
    order: 200,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: offset,
    /** @prop {Number|String} offset=0
     * The offset value as described in the modifier description
     */
    offset: 0
  },

  /**
   * Modifier used to prevent the popper from being positioned outside the boundary.
   *
   * An scenario exists where the reference itself is not within the boundaries.<br />
   * We can say it has "escaped the boundaries" — or just "escaped".<br />
   * In this case we need to decide whether the popper should either:
   *
   * - detach from the reference and remain "trapped" in the boundaries, or
   * - if it should ignore the boundary and "escape with its reference"
   *
   * When `escapeWithReference` is set to`true` and reference is completely
   * outside its boundaries, the popper will overflow (or completely leave)
   * the boundaries in order to remain attached to the edge of the reference.
   *
   * @memberof modifiers
   * @inner
   */
  preventOverflow: {
    /** @prop {number} order=300 - Index used to define the order of execution */
    order: 300,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: preventOverflow,
    /**
     * @prop {Array} [priority=['left','right','top','bottom']]
     * Popper will try to prevent overflow following these priorities by default,
     * then, it could overflow on the left and on top of the `boundariesElement`
     */
    priority: ['left', 'right', 'top', 'bottom'],
    /**
     * @prop {number} padding=5
     * Amount of pixel used to define a minimum distance between the boundaries
     * and the popper this makes sure the popper has always a little padding
     * between the edges of its container
     */
    padding: 5,
    /**
     * @prop {String|HTMLElement} boundariesElement='scrollParent'
     * Boundaries used by the modifier, can be `scrollParent`, `window`,
     * `viewport` or any DOM element.
     */
    boundariesElement: 'scrollParent'
  },

  /**
   * Modifier used to make sure the reference and its popper stay near eachothers
   * without leaving any gap between the two. Expecially useful when the arrow is
   * enabled and you want to assure it to point to its reference element.
   * It cares only about the first axis, you can still have poppers with margin
   * between the popper and its reference element.
   * @memberof modifiers
   * @inner
   */
  keepTogether: {
    /** @prop {number} order=400 - Index used to define the order of execution */
    order: 400,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: keepTogether
  },

  /**
   * This modifier is used to move the `arrowElement` of the popper to make
   * sure it is positioned between the reference element and its popper element.
   * It will read the outer size of the `arrowElement` node to detect how many
   * pixels of conjuction are needed.
   *
   * It has no effect if no `arrowElement` is provided.
   * @memberof modifiers
   * @inner
   */
  arrow: {
    /** @prop {number} order=500 - Index used to define the order of execution */
    order: 500,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: arrow,
    /** @prop {String|HTMLElement} element='[x-arrow]' - Selector or node used as arrow */
    element: '[x-arrow]'
  },

  /**
   * Modifier used to flip the popper's placement when it starts to overlap its
   * reference element.
   *
   * Requires the `preventOverflow` modifier before it in order to work.
   *
   * **NOTE:** this modifier will interrupt the current update cycle and will
   * restart it if it detects the need to flip the placement.
   * @memberof modifiers
   * @inner
   */
  flip: {
    /** @prop {number} order=600 - Index used to define the order of execution */
    order: 600,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: flip,
    /**
     * @prop {String|Array} behavior='flip'
     * The behavior used to change the popper's placement. It can be one of
     * `flip`, `clockwise`, `counterclockwise` or an array with a list of valid
     * placements (with optional variations).
     */
    behavior: 'flip',
    /**
     * @prop {number} padding=5
     * The popper will flip if it hits the edges of the `boundariesElement`
     */
    padding: 5,
    /**
     * @prop {String|HTMLElement} boundariesElement='viewport'
     * The element which will define the boundaries of the popper position,
     * the popper will never be placed outside of the defined boundaries
     * (except if keepTogether is enabled)
     */
    boundariesElement: 'viewport'
  },

  /**
   * Modifier used to make the popper flow toward the inner of the reference element.
   * By default, when this modifier is disabled, the popper will be placed outside
   * the reference element.
   * @memberof modifiers
   * @inner
   */
  inner: {
    /** @prop {number} order=700 - Index used to define the order of execution */
    order: 700,
    /** @prop {Boolean} enabled=false - Whether the modifier is enabled or not */
    enabled: false,
    /** @prop {ModifierFn} */
    fn: inner
  },

  /**
   * Modifier used to hide the popper when its reference element is outside of the
   * popper boundaries. It will set a `x-out-of-boundaries` attribute which can
   * be used to hide with a CSS selector the popper when its reference is
   * out of boundaries.
   *
   * Requires the `preventOverflow` modifier before it in order to work.
   * @memberof modifiers
   * @inner
   */
  hide: {
    /** @prop {number} order=800 - Index used to define the order of execution */
    order: 800,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: hide
  },

  /**
   * Computes the style that will be applied to the popper element to gets
   * properly positioned.
   *
   * Note that this modifier will not touch the DOM, it just prepares the styles
   * so that `applyStyle` modifier can apply it. This separation is useful
   * in case you need to replace `applyStyle` with a custom implementation.
   *
   * This modifier has `850` as `order` value to maintain backward compatibility
   * with previous versions of Popper.js. Expect the modifiers ordering method
   * to change in future major versions of the library.
   *
   * @memberof modifiers
   * @inner
   */
  computeStyle: {
    /** @prop {number} order=850 - Index used to define the order of execution */
    order: 850,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: computeStyle,
    /**
     * @prop {Boolean} gpuAcceleration=true
     * If true, it uses the CSS 3d transformation to position the popper.
     * Otherwise, it will use the `top` and `left` properties.
     */
    gpuAcceleration: true,
    /**
     * @prop {string} [x='bottom']
     * Where to anchor the X axis (`bottom` or `top`). AKA X offset origin.
     * Change this if your popper should grow in a direction different from `bottom`
     */
    x: 'bottom',
    /**
     * @prop {string} [x='left']
     * Where to anchor the Y axis (`left` or `right`). AKA Y offset origin.
     * Change this if your popper should grow in a direction different from `right`
     */
    y: 'right'
  },

  /**
   * Applies the computed styles to the popper element.
   *
   * All the DOM manipulations are limited to this modifier. This is useful in case
   * you want to integrate Popper.js inside a framework or view library and you
   * want to delegate all the DOM manipulations to it.
   *
   * Note that if you disable this modifier, you must make sure the popper element
   * has its position set to `absolute` before Popper.js can do its work!
   *
   * Just disable this modifier and define you own to achieve the desired effect.
   *
   * @memberof modifiers
   * @inner
   */
  applyStyle: {
    /** @prop {number} order=900 - Index used to define the order of execution */
    order: 900,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: true,
    /** @prop {ModifierFn} */
    fn: applyStyle,
    /** @prop {Function} */
    onLoad: applyStyleOnLoad,
    /**
     * @deprecated since version 1.10.0, the property moved to `computeStyle` modifier
     * @prop {Boolean} gpuAcceleration=true
     * If true, it uses the CSS 3d transformation to position the popper.
     * Otherwise, it will use the `top` and `left` properties.
     */
    gpuAcceleration: undefined
  }
};

/**
 * The `dataObject` is an object containing all the informations used by Popper.js
 * this object get passed to modifiers and to the `onCreate` and `onUpdate` callbacks.
 * @name dataObject
 * @property {Object} data.instance The Popper.js instance
 * @property {String} data.placement Placement applied to popper
 * @property {String} data.originalPlacement Placement originally defined on init
 * @property {Boolean} data.flipped True if popper has been flipped by flip modifier
 * @property {Boolean} data.hide True if the reference element is out of boundaries, useful to know when to hide the popper.
 * @property {HTMLElement} data.arrowElement Node used as arrow by arrow modifier
 * @property {Object} data.styles Any CSS property defined here will be applied to the popper, it expects the JavaScript nomenclature (eg. `marginBottom`)
 * @property {Object} data.arrowStyles Any CSS property defined here will be applied to the popper arrow, it expects the JavaScript nomenclature (eg. `marginBottom`)
 * @property {Object} data.boundaries Offsets of the popper boundaries
 * @property {Object} data.offsets The measurements of popper, reference and arrow elements.
 * @property {Object} data.offsets.popper `top`, `left`, `width`, `height` values
 * @property {Object} data.offsets.reference `top`, `left`, `width`, `height` values
 * @property {Object} data.offsets.arrow] `top` and `left` offsets, only one of them will be different from 0
 */

/**
 * Default options provided to Popper.js constructor.<br />
 * These can be overriden using the `options` argument of Popper.js.<br />
 * To override an option, simply pass as 3rd argument an object with the same
 * structure of this object, example:
 * ```
 * new Popper(ref, pop, {
 *   modifiers: {
 *     preventOverflow: { enabled: false }
 *   }
 * })
 * ```
 * @type {Object}
 * @static
 * @memberof Popper
 */
var Defaults$2 = {
  /**
   * Popper's placement
   * @prop {Popper.placements} placement='bottom'
   */
  placement: 'bottom',

  /**
   * Set this to true if you want popper to position it self in 'fixed' mode
   * @prop {Boolean} positionFixed=false
   */
  positionFixed: false,

  /**
   * Whether events (resize, scroll) are initially enabled
   * @prop {Boolean} eventsEnabled=true
   */
  eventsEnabled: true,

  /**
   * Set to true if you want to automatically remove the popper when
   * you call the `destroy` method.
   * @prop {Boolean} removeOnDestroy=false
   */
  removeOnDestroy: false,

  /**
   * Callback called when the popper is created.<br />
   * By default, is set to no-op.<br />
   * Access Popper.js instance with `data.instance`.
   * @prop {onCreate}
   */
  onCreate: function onCreate() {},

  /**
   * Callback called when the popper is updated, this callback is not called
   * on the initialization/creation of the popper, but only on subsequent
   * updates.<br />
   * By default, is set to no-op.<br />
   * Access Popper.js instance with `data.instance`.
   * @prop {onUpdate}
   */
  onUpdate: function onUpdate() {},

  /**
   * List of modifiers used to modify the offsets before they are applied to the popper.
   * They provide most of the functionalities of Popper.js
   * @prop {modifiers}
   */
  modifiers: modifiers
};

/**
 * @callback onCreate
 * @param {dataObject} data
 */

/**
 * @callback onUpdate
 * @param {dataObject} data
 */

// Utils
// Methods
var Popper = function () {
  /**
   * Create a new Popper.js instance
   * @class Popper
   * @param {HTMLElement|referenceObject} reference - The reference element used to position the popper
   * @param {HTMLElement} popper - The HTML element used as popper.
   * @param {Object} options - Your custom options to override the ones defined in [Defaults](#defaults)
   * @return {Object} instance - The generated Popper.js instance
   */
  function Popper(reference, popper) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    classCallCheck(this, Popper);

    this.scheduleUpdate = function () {
      return requestAnimationFrame(_this.update);
    };

    // make update() debounced, so that it only runs at most once-per-tick
    this.update = debounce(this.update.bind(this));

    // with {} we create a new object with the options inside it
    this.options = _extends({}, Popper.Defaults, options);

    // init state
    this.state = {
      isDestroyed: false,
      isCreated: false,
      scrollParents: []
    };

    // get reference and popper elements (allow jQuery wrappers)
    this.reference = reference && reference.jquery ? reference[0] : reference;
    this.popper = popper && popper.jquery ? popper[0] : popper;

    // Deep merge modifiers options
    this.options.modifiers = {};
    Object.keys(_extends({}, Popper.Defaults.modifiers, options.modifiers)).forEach(function (name) {
      _this.options.modifiers[name] = _extends({}, Popper.Defaults.modifiers[name] || {}, options.modifiers ? options.modifiers[name] : {});
    });

    // Refactoring modifiers' list (Object => Array)
    this.modifiers = Object.keys(this.options.modifiers).map(function (name) {
      return _extends({
        name: name
      }, _this.options.modifiers[name]);
    })
    // sort the modifiers by order
    .sort(function (a, b) {
      return a.order - b.order;
    });

    // modifiers have the ability to execute arbitrary code when Popper.js get inited
    // such code is executed in the same order of its modifier
    // they could add new properties to their options configuration
    // BE AWARE: don't add options to `options.modifiers.name` but to `modifierOptions`!
    this.modifiers.forEach(function (modifierOptions) {
      if (modifierOptions.enabled && isFunction(modifierOptions.onLoad)) {
        modifierOptions.onLoad(_this.reference, _this.popper, _this.options, modifierOptions, _this.state);
      }
    });

    // fire the first update to position the popper in the right place
    this.update();

    var eventsEnabled = this.options.eventsEnabled;
    if (eventsEnabled) {
      // setup event listeners, they will take care of update the position in specific situations
      this.enableEventListeners();
    }

    this.state.eventsEnabled = eventsEnabled;
  }

  // We can't use class properties because they don't get listed in the
  // class prototype and break stuff like Sinon stubs


  createClass(Popper, [{
    key: 'update',
    value: function update$$1() {
      return update.call(this);
    }
  }, {
    key: 'destroy',
    value: function destroy$$1() {
      return destroy.call(this);
    }
  }, {
    key: 'enableEventListeners',
    value: function enableEventListeners$$1() {
      return enableEventListeners.call(this);
    }
  }, {
    key: 'disableEventListeners',
    value: function disableEventListeners$$1() {
      return disableEventListeners.call(this);
    }

    /**
     * Schedule an update, it will run on the next UI update available
     * @method scheduleUpdate
     * @memberof Popper
     */


    /**
     * Collection of utilities useful when writing custom modifiers.
     * Starting from version 1.7, this method is available only if you
     * include `popper-utils.js` before `popper.js`.
     *
     * **DEPRECATION**: This way to access PopperUtils is deprecated
     * and will be removed in v2! Use the PopperUtils module directly instead.
     * Due to the high instability of the methods contained in Utils, we can't
     * guarantee them to follow semver. Use them at your own risk!
     * @static
     * @private
     * @type {Object}
     * @deprecated since version 1.8
     * @member Utils
     * @memberof Popper
     */

  }]);
  return Popper;
}();

/**
 * The `referenceObject` is an object that provides an interface compatible with Popper.js
 * and lets you use it as replacement of a real DOM node.<br />
 * You can use this method to position a popper relatively to a set of coordinates
 * in case you don't have a DOM node to use as reference.
 *
 * ```
 * new Popper(referenceObject, popperNode);
 * ```
 *
 * NB: This feature isn't supported in Internet Explorer 10
 * @name referenceObject
 * @property {Function} data.getBoundingClientRect
 * A function that returns a set of coordinates compatible with the native `getBoundingClientRect` method.
 * @property {number} data.clientWidth
 * An ES6 getter that will return the width of the virtual reference element.
 * @property {number} data.clientHeight
 * An ES6 getter that will return the height of the virtual reference element.
 */


Popper.Utils = (typeof window !== 'undefined' ? window : global).PopperUtils;
Popper.placements = placements;
Popper.Defaults = Defaults$2;

/**
 * Aliasing Object[method] allows the minifier to shorten methods to a single character variable,
 * as well as giving BV a chance to inject polyfills.
 * As long as we avoid
 * - import * as Object from "utils/object"
 * all unused exports should be removed by tree-shaking.
 */

// @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign !== 'function') {
  Object.assign = function (target, varArgs) {
    var arguments$1 = arguments;

    // .length of function is 2

    if (target == null) {
      // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments$1[index];

      if (nextSource != null) {
        // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#Polyfill
if (!Object.is) {
  Object.is = function (x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      // eslint-disable-next-line no-self-compare
      return x !== x && y !== y;
    }
  };
}

var assign = Object.assign;


var defineProperties = Object.defineProperties;
var defineProperty$1 = Object.defineProperty;








function readonlyDescriptor() {
  return { enumerable: true, configurable: false, writable: false };
}

var _createClass$2 = function () { function defineProperties$$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties$$1(Constructor.prototype, protoProps); } if (staticProps) { defineProperties$$1(Constructor, staticProps); } return Constructor; }; }();

function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BvEvent = function () {
  function BvEvent(type) {
    var eventInit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck$2(this, BvEvent);

    // Start by emulating native Event constructor.
    if (!type) {
      throw new TypeError('Failed to construct \'' + this.constructor.name + '\'. 1 argument required, ' + arguments.length + ' given.');
    }
    // Assign defaults first, the eventInit,
    // and the type last so it can't be overwritten.
    assign(this, BvEvent.defaults(), eventInit, { type: type });
    // Freeze some props as readonly, but leave them enumerable.
    defineProperties(this, {
      type: readonlyDescriptor(),
      cancelable: readonlyDescriptor(),
      nativeEvent: readonlyDescriptor(),
      target: readonlyDescriptor(),
      relatedTarget: readonlyDescriptor(),
      vueTarget: readonlyDescriptor()
    });
    // Create a private variable using closure scoping.
    var defaultPrevented = false;
    // Recreate preventDefault method. One way setter.
    this.preventDefault = function preventDefault() {
      if (this.cancelable) {
        defaultPrevented = true;
      }
    };
    // Create 'defaultPrevented' publicly accessible prop
    // that can only be altered by the preventDefault method.
    defineProperty$1(this, 'defaultPrevented', {
      enumerable: true,
      get: function get() {
        return defaultPrevented;
      }
    });
  }

  _createClass$2(BvEvent, null, [{
    key: 'defaults',
    value: function defaults() {
      return {
        type: '',
        cancelable: true,
        nativeEvent: null,
        target: null,
        relatedTarget: null,
        vueTarget: null
      };
    }
  }]);

  return BvEvent;
}();

// Production steps of ECMA-262, Edition 6, 22.1.2.1
// es6-ified by @alexsasharegan
if (!Array.from) {
  Array.from = function () {
    var toStr = Object.prototype.toString;
    var isCallable = function isCallable(fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function toInteger(value) {
      var number = Number(value);
      if (isNaN(number)) {
        return 0;
      }
      if (number === 0 || !isFinite(number)) {
        return number;
      }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function toLength(value) {
      return Math.min(Math.max(toInteger(value), 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike /*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T = void 0;

      if (typeof mapFn !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method
      // of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue = void 0;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }();
}

// https://tc39.github.io/ecma262/#sec-array.prototype.find
// Needed for IE support
if (!Array.prototype.find) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'find', {
    value: function value(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    }
  });
}

if (!Array.isArray) {
  Array.isArray = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// Static
var from = Array.from;
var isArray = Array.isArray;

// Instance

// Determine if an element is an HTML Element
var isElement = function isElement(el) {
  return el && el.nodeType === Node.ELEMENT_NODE;
};

// Determine if an HTML element is visible - Faster than CSS check
var isVisible = function isVisible(el) {
  return isElement(el) && document.body.contains(el) && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().width > 0;
};

// Determine if an element is disabled
var isDisabled = function isDisabled(el) {
  return !isElement(el) || el.disabled || el.classList.contains('disabled') || Boolean(el.getAttribute('disabled'));
};

// Cause/wait-for an element to reflow it's content (adjusting it's height/width)


// Select all elements matching selector. Returns [] if none found
var selectAll = function selectAll(selector, root) {
  if (!isElement(root)) {
    root = document;
  }
  return from(root.querySelectorAll(selector));
};

// Select a single element, returns null if not found
var select = function select(selector, root) {
  if (!isElement(root)) {
    root = document;
  }
  return root.querySelector(selector) || null;
};

// Determine if an element matches a selector
var matches = function matches(el, selector) {
  if (!isElement(el)) {
    return false;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
  // Prefer native implementations over polyfill function
  var proto = Element.prototype;
  var Matches = proto.matches || proto.matchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector || proto.webkitMatchesSelector ||
  /* istanbul ignore next */
  function (sel) {
    var element = this;
    var m = selectAll(sel, element.document || element.ownerDocument);
    var i = m.length;
    // eslint-disable-next-line no-empty
    while (--i >= 0 && m.item(i) !== element) {}
    return i > -1;
  };

  return Matches.call(el, selector);
};

// Finds closest element matching selector. Returns null if not found
var closest = function closest(selector, root) {
  if (!isElement(root)) {
    return null;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
  // Since we dont support IE < 10, we can use the "Matches" version of the polyfill for speed
  // Prefer native implementation over polyfill function
  var Closest = Element.prototype.closest ||
  /* istanbul ignore next */
  function (sel) {
    var element = this;
    if (!document.documentElement.contains(element)) {
      return null;
    }
    do {
      // Use our "patched" matches function
      if (matches(element, sel)) {
        return element;
      }
      element = element.parentElement;
    } while (element !== null);
    return null;
  };

  var el = Closest.call(root, selector);
  // Emulate jQuery closest and return null if match is the passed in element (root)
  return el === root ? null : el;
};

// Get an element given an ID
var getById = function getById(id) {
  return document.getElementById(/^#/.test(id) ? id.slice(1) : id) || null;
};

// Add a class to an element
var addClass = function addClass(el, className) {
  if (className && isElement(el)) {
    el.classList.add(className);
  }
};

// Remove a class from an element
var removeClass = function removeClass(el, className) {
  if (className && isElement(el)) {
    el.classList.remove(className);
  }
};

// Test if an element has a class
var hasClass = function hasClass(el, className) {
  if (className && isElement(el)) {
    return el.classList.contains(className);
  }
  return false;
};

// Set an attribute on an element
var setAttr = function setAttr(el, attr, value) {
  if (attr && isElement(el)) {
    el.setAttribute(attr, value);
  }
};

// Remove an attribute from an element
var removeAttr = function removeAttr(el, attr) {
  if (attr && isElement(el)) {
    el.removeAttribute(attr);
  }
};

// Get an attribute value from an element (returns null if not found)
var getAttr = function getAttr(el, attr) {
  if (attr && isElement(el)) {
    return el.getAttribute(attr);
  }
  return null;
};

// Determine if an attribute exists on an element (returns true or false, or null if element not found)


// Return the Bounding Client Rec of an element. Retruns null if not an element


// Get computed style object for an element
var getCS = function getCS(el) {
  return isElement(el) ? window.getComputedStyle(el) : {};
};

// Return an element's offset wrt document element
// https://j11y.io/jquery/#v=git&fn=jQuery.fn.offset


// Return an element's offset wrt to it's offsetParent
// https://j11y.io/jquery/#v=git&fn=jQuery.fn.position


// Attach an event listener to an element
var eventOn = function eventOn(el, evtName, handler) {
  if (el && el.addEventListener) {
    el.addEventListener(evtName, handler);
  }
};

// Remove an event listener from an element
var eventOff = function eventOff(el, evtName, handler) {
  if (el && el.removeEventListener) {
    el.removeEventListener(evtName, handler);
  }
};

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass$1 = function () { function defineProperties$$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties$$1(Constructor.prototype, protoProps); } if (staticProps) { defineProperties$$1(Constructor, staticProps); } return Constructor; }; }();

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NAME$1 = 'tooltip';
var CLASS_PREFIX$1 = 'bs-tooltip';
var BSCLS_PREFIX_REGEX$1 = new RegExp('\\b' + CLASS_PREFIX$1 + '\\S+', 'g');

var TRANSITION_DURATION = 150;

// Modal $root hidden event
var MODAL_CLOSE_EVENT = 'bv::modal::hidden';
// Modal container for appending tip/popover
var MODAL_CLASS = '.modal-content';

var AttachmentMap = {
  AUTO: 'auto',
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
  TOPLEFT: 'top',
  TOPRIGHT: 'top',
  RIGHTTOP: 'right',
  RIGHTBOTTOM: 'right',
  BOTTOMLEFT: 'bottom',
  BOTTOMRIGHT: 'bottom',
  LEFTTOP: 'left',
  LEFTBOTTOM: 'left'
};

var OffsetMap = {
  AUTO: 0,
  TOPLEFT: -1,
  TOP: 0,
  TOPRIGHT: +1,
  RIGHTTOP: -1,
  RIGHT: 0,
  RIGHTBOTTOM: +1,
  BOTTOMLEFT: -1,
  BOTTOM: 0,
  BOTTOMRIGHT: +1,
  LEFTTOP: -1,
  LEFT: 0,
  LEFTBOTTOM: +1
};

var HoverState = {
  SHOW: 'show',
  OUT: 'out'
};

var ClassName$1 = {
  FADE: 'fade',
  SHOW: 'show'
};

var Selector$1 = {
  TOOLTIP: '.tooltip',
  TOOLTIP_INNER: '.tooltip-inner',
  ARROW: '.arrow'

  // ESLINT: Not used
  // const Trigger = {
  //   HOVER: 'hover',
  //   FOCUS: 'focus',
  //   CLICK: 'click',
  //   BLUR: 'blur',
  //   MANUAL: 'manual'
  // }

};var Defaults$1 = {
  animation: true,
  template: '<div class="tooltip" role="tooltip">' + '<div class="arrow"></div>' + '<div class="tooltip-inner"></div>' + '</div>',
  trigger: 'hover focus',
  title: '',
  delay: 0,
  html: false,
  placement: 'top',
  offset: 0,
  arrowPadding: 6,
  container: false,
  fallbackPlacement: 'flip',
  callbacks: {},
  boundary: 'scrollParent'

  // Transition Event names
};var TransitionEndEvents = {
  WebkitTransition: ['webkitTransitionEnd'],
  MozTransition: ['transitionend'],
  OTransition: ['otransitionend', 'oTransitionEnd'],
  transition: ['transitionend']

  // Client Side Tip ID counter for aria-describedby attribute
  // Could use Alex's uid generator util
  // Each tooltip requires a unique client side ID
};var NEXTID = 1;
/* istanbul ignore next */
function generateId(name) {
  return '__BV_' + name + '_' + NEXTID++ + '__';
}

/*
 * ToolTip Class definition
 */
/* istanbul ignore next: difficult to test in Jest/JSDOM environment */

var ToolTip = function () {
  // Main constructor
  function ToolTip(element, config, $root) {
    _classCallCheck$1(this, ToolTip);

    // New tooltip object
    this.$isEnabled = true;
    this.$fadeTimeout = null;
    this.$hoverTimeout = null;
    this.$visibleInterval = null;
    this.$hoverState = '';
    this.$activeTrigger = {};
    this.$popper = null;
    this.$element = element;
    this.$tip = null;
    this.$id = generateId(this.constructor.NAME);
    this.$root = $root || null;
    this.$routeWatcher = null;
    // We use a bound version of the following handlers for root/modal listeners to maintain the 'this' context
    this.$forceHide = this.forceHide.bind(this);
    this.$doHide = this.doHide.bind(this);
    this.$doShow = this.doShow.bind(this);
    this.$doDisable = this.doDisable.bind(this);
    this.$doEnable = this.doEnable.bind(this);
    // Set the configuration
    this.updateConfig(config);
  }

  // NOTE: Overridden by PopOver class


  _createClass$1(ToolTip, [{
    key: 'updateConfig',


    // Update config
    value: function updateConfig(config) {
      // Merge config into defaults. We use "this" here because PopOver overrides Default
      var updatedConfig = assign({}, this.constructor.Default, config);

      // Sanitize delay
      if (config.delay && typeof config.delay === 'number') {
        updatedConfig.delay = {
          show: config.delay,
          hide: config.delay
        };
      }

      // Title for tooltip and popover
      if (config.title && typeof config.title === 'number') {
        updatedConfig.title = config.title.toString();
      }

      // Content only for popover
      if (config.content && typeof config.content === 'number') {
        updatedConfig.content = config.content.toString();
      }

      // Hide element original title if needed
      this.fixTitle();
      // Update the config
      this.$config = updatedConfig;
      // Stop/Restart listening
      this.unListen();
      this.listen();
    }

    // Destroy this instance

  }, {
    key: 'destroy',
    value: function destroy() {
      // Stop listening to trigger events
      this.unListen();
      // Disable while open listeners/watchers
      this.setWhileOpenListeners(false);
      // Clear any timeouts
      clearTimeout(this.$hoverTimeout);
      this.$hoverTimeout = null;
      clearTimeout(this.$fadeTimeout);
      this.$fadeTimeout = null;
      // Remove popper
      if (this.$popper) {
        this.$popper.destroy();
      }
      this.$popper = null;
      // Remove tip from document
      if (this.$tip && this.$tip.parentElement) {
        this.$tip.parentElement.removeChild(this.$tip);
      }
      this.$tip = null;
      // Null out other properties
      this.$id = null;
      this.$isEnabled = null;
      this.$root = null;
      this.$element = null;
      this.$config = null;
      this.$hoverState = null;
      this.$activeTrigger = null;
      this.$forceHide = null;
      this.$doHide = null;
      this.$doShow = null;
      this.$doDisable = null;
      this.$doEnable = null;
    }
  }, {
    key: 'enable',
    value: function enable() {
      // Create a non-cancelable BvEvent
      var enabledEvt = new BvEvent('enabled', {
        cancelable: false,
        target: this.$element,
        relatedTarget: null
      });
      this.$isEnabled = true;
      this.emitEvent(enabledEvt);
    }
  }, {
    key: 'disable',
    value: function disable() {
      // Create a non-cancelable BvEvent
      var disabledEvt = new BvEvent('disabled', {
        cancelable: false,
        target: this.$element,
        relatedTarget: null
      });
      this.$isEnabled = false;
      this.emitEvent(disabledEvt);
    }

    // Click toggler

  }, {
    key: 'toggle',
    value: function toggle(event) {
      if (!this.$isEnabled) {
        return;
      }
      if (event) {
        this.$activeTrigger.click = !this.$activeTrigger.click;

        if (this.isWithActiveTrigger()) {
          this.enter(null);
        } else {
          this.leave(null);
        }
      } else {
        if (hasClass(this.getTipElement(), ClassName$1.SHOW)) {
          this.leave(null);
        } else {
          this.enter(null);
        }
      }
    }

    // Show tooltip

  }, {
    key: 'show',
    value: function show() {
      var _this = this;

      if (!document.body.contains(this.$element) || !isVisible(this.$element)) {
        // If trigger element isn't in the DOM or is not visible
        return;
      }
      // Build tooltip element (also sets this.$tip)
      var tip = this.getTipElement();
      this.fixTitle();
      this.setContent(tip);
      if (!this.isWithContent(tip)) {
        // if No content, don't bother showing
        this.$tip = null;
        return;
      }

      // Set ID on tip and aria-describedby on element
      setAttr(tip, 'id', this.$id);
      this.addAriaDescribedby();

      // Set animation on or off
      if (this.$config.animation) {
        addClass(tip, ClassName$1.FADE);
      } else {
        removeClass(tip, ClassName$1.FADE);
      }

      var placement = this.getPlacement();
      var attachment = this.constructor.getAttachment(placement);
      this.addAttachmentClass(attachment);

      // Create a cancelable BvEvent
      var showEvt = new BvEvent('show', {
        cancelable: true,
        target: this.$element,
        relatedTarget: tip
      });
      this.emitEvent(showEvt);
      if (showEvt.defaultPrevented) {
        // Don't show if event cancelled
        this.$tip = null;
        return;
      }

      // Insert tooltip if needed
      var container = this.getContainer();
      if (!document.body.contains(tip)) {
        container.appendChild(tip);
      }

      // Refresh popper
      this.removePopper();
      this.$popper = new Popper(this.$element, tip, this.getPopperConfig(placement, tip));

      // Transitionend Callback
      var complete = function complete() {
        if (_this.$config.animation) {
          _this.fixTransition(tip);
        }
        var prevHoverState = _this.$hoverState;
        _this.$hoverState = null;
        if (prevHoverState === HoverState.OUT) {
          _this.leave(null);
        }
        // Create a non-cancelable BvEvent
        var shownEvt = new BvEvent('shown', {
          cancelable: false,
          target: _this.$element,
          relatedTarget: tip
        });
        _this.emitEvent(shownEvt);
      };

      // Enable while open listeners/watchers
      this.setWhileOpenListeners(true);

      // Show tip
      addClass(tip, ClassName$1.SHOW);

      // Start the transition/animation
      this.transitionOnce(tip, complete);
    }

    // handler for periodic visibility check

  }, {
    key: 'visibleCheck',
    value: function visibleCheck(on) {
      var _this2 = this;

      clearInterval(this.$visibleInterval);
      this.$visibleInterval = null;
      if (on) {
        this.$visibleInterval = setInterval(function () {
          var tip = _this2.getTipElement();
          if (tip && !isVisible(_this2.$element) && hasClass(tip, ClassName$1.SHOW)) {
            // Element is no longer visible, so force-hide the tooltip
            _this2.forceHide();
          }
        }, 100);
      }
    }
  }, {
    key: 'setWhileOpenListeners',
    value: function setWhileOpenListeners(on) {
      // Modal close events
      this.setModalListener(on);
      // Periodic $element visibility check
      // For handling when tip is in <keepalive>, tabs, carousel, etc
      this.visibleCheck(on);
      // Route change events
      this.setRouteWatcher(on);
      // Ontouch start listeners
      this.setOnTouchStartListener(on);
      if (on && /(focus|blur)/.test(this.$config.trigger)) {
        // If focus moves between trigger element and tip container, dont close
        eventOn(this.$tip, 'focusout', this);
      } else {
        eventOff(this.$tip, 'focusout', this);
      }
    }

    // force hide of tip (internal method)

  }, {
    key: 'forceHide',
    value: function forceHide() {
      if (!this.$tip || !hasClass(this.$tip, ClassName$1.SHOW)) {
        return;
      }
      // Disable while open listeners/watchers
      this.setWhileOpenListeners(false);
      // Clear any hover enter/leave event
      clearTimeout(this.$hoverTimeout);
      this.$hoverTimeout = null;
      this.$hoverState = '';
      // Hide the tip
      this.hide(null, true);
    }

    // Hide tooltip

  }, {
    key: 'hide',
    value: function hide(callback, force) {
      var _this3 = this;

      var tip = this.$tip;
      if (!tip) {
        return;
      }

      // Create a canelable BvEvent
      var hideEvt = new BvEvent('hide', {
        // We disable cancelling if force is true
        cancelable: !force,
        target: this.$element,
        relatedTarget: tip
      });
      this.emitEvent(hideEvt);
      if (hideEvt.defaultPrevented) {
        // Don't hide if event cancelled
        return;
      }

      // Transitionend Callback
      /* istanbul ignore next */
      var complete = function complete() {
        if (_this3.$hoverState !== HoverState.SHOW && tip.parentNode) {
          // Remove tip from dom, and force recompile on next show
          tip.parentNode.removeChild(tip);
          _this3.removeAriaDescribedby();
          _this3.removePopper();
          _this3.$tip = null;
        }
        if (callback) {
          callback();
        }
        // Create a non-cancelable BvEvent
        var hiddenEvt = new BvEvent('hidden', {
          cancelable: false,
          target: _this3.$element,
          relatedTarget: null
        });
        _this3.emitEvent(hiddenEvt);
      };

      // Disable while open listeners/watchers
      this.setWhileOpenListeners(false);

      // If forced close, disable animation
      if (force) {
        removeClass(tip, ClassName$1.FADE);
      }
      // Hide tip
      removeClass(tip, ClassName$1.SHOW);

      this.$activeTrigger.click = false;
      this.$activeTrigger.focus = false;
      this.$activeTrigger.hover = false;

      // Start the hide transition
      this.transitionOnce(tip, complete);

      this.$hoverState = '';
    }
  }, {
    key: 'emitEvent',
    value: function emitEvent(evt) {
      var evtName = evt.type;
      if (this.$root && this.$root.$emit) {
        // Emit an event on $root
        this.$root.$emit('bv::' + this.constructor.NAME + '::' + evtName, evt);
      }
      var callbacks = this.$config.callbacks || {};
      if (typeof callbacks[evtName] === 'function') {
        callbacks[evtName](evt);
      }
    }
  }, {
    key: 'getContainer',
    value: function getContainer() {
      var container = this.$config.container;
      var body = document.body;
      // If we are in a modal, we append to the modal instead of body, unless a container is specified
      return container === false ? closest(MODAL_CLASS, this.$element) || body : select(container, body) || body;
    }

    // Will be overritten by popover if needed

  }, {
    key: 'addAriaDescribedby',
    value: function addAriaDescribedby() {
      // Add aria-describedby on trigger element, without removing any other IDs
      var desc = getAttr(this.$element, 'aria-describedby') || '';
      desc = desc.split(/\s+/).concat(this.$id).join(' ').trim();
      setAttr(this.$element, 'aria-describedby', desc);
    }

    // Will be overritten by popover if needed

  }, {
    key: 'removeAriaDescribedby',
    value: function removeAriaDescribedby() {
      var _this4 = this;

      var desc = getAttr(this.$element, 'aria-describedby') || '';
      desc = desc.split(/\s+/).filter(function (d) {
        return d !== _this4.$id;
      }).join(' ').trim();
      if (desc) {
        setAttr(this.$element, 'aria-describedby', desc);
      } else {
        removeAttr(this.$element, 'aria-describedby');
      }
    }
  }, {
    key: 'removePopper',
    value: function removePopper() {
      if (this.$popper) {
        this.$popper.destroy();
      }
      this.$popper = null;
    }

    /* istanbul ignore next */

  }, {
    key: 'transitionOnce',
    value: function transitionOnce(tip, complete) {
      var _this5 = this;

      var transEvents = this.getTransitionEndEvents();
      var called = false;
      clearTimeout(this.$fadeTimeout);
      this.$fadeTimeout = null;
      var fnOnce = function fnOnce() {
        if (called) {
          return;
        }
        called = true;
        clearTimeout(_this5.$fadeTimeout);
        _this5.$fadeTimeout = null;
        transEvents.forEach(function (evtName) {
          eventOff(tip, evtName, fnOnce);
        });
        // Call complete callback
        complete();
      };
      if (hasClass(tip, ClassName$1.FADE)) {
        transEvents.forEach(function (evtName) {
          eventOn(tip, evtName, fnOnce);
        });
        // Fallback to setTimeout
        this.$fadeTimeout = setTimeout(fnOnce, TRANSITION_DURATION);
      } else {
        fnOnce();
      }
    }

    // What transitionend event(s) to use? (returns array of event names)

  }, {
    key: 'getTransitionEndEvents',
    value: function getTransitionEndEvents() {
      var this$1 = this;

      for (var name in TransitionEndEvents) {
        if (this$1.$element.style[name] !== undefined) {
          return TransitionEndEvents[name];
        }
      }
      // fallback
      return [];
    }
  }, {
    key: 'update',
    value: function update() {
      if (this.$popper !== null) {
        this.$popper.scheduleUpdate();
      }
    }

    // NOTE: Overridden by PopOver class

  }, {
    key: 'isWithContent',
    value: function isWithContent(tip) {
      tip = tip || this.$tip;
      if (!tip) {
        return false;
      }
      return Boolean((select(Selector$1.TOOLTIP_INNER, tip) || {}).innerHTML);
    }

    // NOTE: Overridden by PopOver class

  }, {
    key: 'addAttachmentClass',
    value: function addAttachmentClass(attachment) {
      addClass(this.getTipElement(), CLASS_PREFIX$1 + '-' + attachment);
    }
  }, {
    key: 'getTipElement',
    value: function getTipElement() {
      if (!this.$tip) {
        // Try and compile user supplied template, or fallback to default template
        this.$tip = this.compileTemplate(this.$config.template) || this.compileTemplate(this.constructor.Default.template);
      }
      // Add tab index so tip can be focused, and to allow it to be set as relatedTargt in focusin/out events
      this.$tip.tabIndex = -1;
      return this.$tip;
    }
  }, {
    key: 'compileTemplate',
    value: function compileTemplate(html) {
      if (!html || typeof html !== 'string') {
        return null;
      }
      var div = document.createElement('div');
      div.innerHTML = html.trim();
      var node = div.firstElementChild ? div.removeChild(div.firstElementChild) : null;
      div = null;
      return node;
    }

    // NOTE: Overridden by PopOver class

  }, {
    key: 'setContent',
    value: function setContent(tip) {
      this.setElementContent(select(Selector$1.TOOLTIP_INNER, tip), this.getTitle());
      removeClass(tip, ClassName$1.FADE);
      removeClass(tip, ClassName$1.SHOW);
    }
  }, {
    key: 'setElementContent',
    value: function setElementContent(container, content) {
      if (!container) {
        // If container element doesn't exist, just return
        return;
      }
      var allowHtml = this.$config.html;
      if ((typeof content === 'undefined' ? 'undefined' : _typeof$1(content)) === 'object' && content.nodeType) {
        // content is a DOM node
        if (allowHtml) {
          if (content.parentElement !== container) {
            container.innerHtml = '';
            container.appendChild(content);
          }
        } else {
          container.innerText = content.innerText;
        }
      } else {
        // We have a plain HTML string or Text
        container[allowHtml ? 'innerHTML' : 'innerText'] = content;
      }
    }

    // NOTE: Overridden by PopOver class

  }, {
    key: 'getTitle',
    value: function getTitle() {
      var title = this.$config.title || '';
      if (typeof title === 'function') {
        // Call the function to get the title value
        title = title(this.$element);
      }
      if ((typeof title === 'undefined' ? 'undefined' : _typeof$1(title)) === 'object' && title.nodeType && !title.innerHTML.trim()) {
        // We have a DOM node, but without inner content, so just return empty string
        title = '';
      }
      if (typeof title === 'string') {
        title = title.trim();
      }
      if (!title) {
        // If an explicit title is not given, try element's title atributes
        title = getAttr(this.$element, 'title') || getAttr(this.$element, 'data-original-title') || '';
        title = title.trim();
      }

      return title;
    }
  }, {
    key: 'listen',
    value: function listen() {
      var _this6 = this;

      var triggers = this.$config.trigger.trim().split(/\s+/);
      var el = this.$element;

      // Listen for global show/hide events
      this.setRootListener(true);

      // Using 'this' as the handler will get automagically directed to this.handleEvent
      // And maintain our binding to 'this'
      triggers.forEach(function (trigger) {
        if (trigger === 'click') {
          eventOn(el, 'click', _this6);
        } else if (trigger === 'focus') {
          eventOn(el, 'focusin', _this6);
          eventOn(el, 'focusout', _this6);
        } else if (trigger === 'blur') {
          // Used to close $tip when element looses focus
          eventOn(el, 'focusout', _this6);
        } else if (trigger === 'hover') {
          eventOn(el, 'mouseenter', _this6);
          eventOn(el, 'mouseleave', _this6);
        }
      }, this);
    }
  }, {
    key: 'unListen',
    value: function unListen() {
      var _this7 = this;

      var events = ['click', 'focusin', 'focusout', 'mouseenter', 'mouseleave'];
      // Using "this" as the handler will get automagically directed to this.handleEvent
      events.forEach(function (evt) {
        eventOff(_this7.$element, evt, _this7);
      }, this);

      // Stop listening for global show/hide/enable/disable events
      this.setRootListener(false);
    }
  }, {
    key: 'handleEvent',
    value: function handleEvent(e) {
      // This special method allows us to use "this" as the event handlers
      if (isDisabled(this.$element)) {
        // If disabled, don't do anything. Note: if tip is shown before element gets
        // disabled, then tip not close until no longer disabled or forcefully closed.
        return;
      }
      if (!this.$isEnabled) {
        // If not enable
        return;
      }
      var type = e.type;
      var target = e.target;
      var relatedTarget = e.relatedTarget;
      var $element = this.$element;
      var $tip = this.$tip;
      if (type === 'click') {
        this.toggle(e);
      } else if (type === 'focusin' || type === 'mouseenter') {
        this.enter(e);
      } else if (type === 'focusout') {
        // target is the element which is loosing focus
        // And relatedTarget is the element gaining focus
        if ($tip && $element && $element.contains(target) && $tip.contains(relatedTarget)) {
          // If focus moves from $element to $tip, don't trigger a leave
          return;
        }
        if ($tip && $element && $tip.contains(target) && $element.contains(relatedTarget)) {
          // If focus moves from $tip to $element, don't trigger a leave
          return;
        }
        if ($tip && $tip.contains(target) && $tip.contains(relatedTarget)) {
          // If focus moves within $tip, don't trigger a leave
          return;
        }
        if ($element && $element.contains(target) && $element.contains(relatedTarget)) {
          // If focus moves within $element, don't trigger a leave
          return;
        }
        // Otherwise trigger a leave
        this.leave(e);
      } else if (type === 'mouseleave') {
        this.leave(e);
      }
    }

    /* istanbul ignore next */

  }, {
    key: 'setRouteWatcher',
    value: function setRouteWatcher(on) {
      var _this8 = this;

      if (on) {
        this.setRouteWatcher(false);
        if (this.$root && Boolean(this.$root.$route)) {
          this.$routeWatcher = this.$root.$watch('$route', function (newVal, oldVal) {
            if (newVal === oldVal) {
              return;
            }
            // If route has changed, we force hide the tooltip/popover
            _this8.forceHide();
          });
        }
      } else {
        if (this.$routeWatcher) {
          // cancel the route watcher by calling hte stored reference
          this.$routeWatcher();
          this.$routeWatcher = null;
        }
      }
    }

    /* istanbul ignore next */

  }, {
    key: 'setModalListener',
    value: function setModalListener(on) {
      var modal = closest(MODAL_CLASS, this.$element);
      if (!modal) {
        // If we are not in a modal, don't worry. be happy
        return;
      }
      // We can listen for modal hidden events on $root
      if (this.$root) {
        this.$root[on ? '$on' : '$off'](MODAL_CLOSE_EVENT, this.$forceHide);
      }
    }

    /* istanbul ignore next */

  }, {
    key: 'setRootListener',
    value: function setRootListener(on) {
      // Listen for global 'bv::{hide|show}::{tooltip|popover}' hide request event
      if (this.$root) {
        this.$root[on ? '$on' : '$off']('bv::hide::' + this.constructor.NAME, this.$doHide);
        this.$root[on ? '$on' : '$off']('bv::show::' + this.constructor.NAME, this.$doShow);
        this.$root[on ? '$on' : '$off']('bv::disable::' + this.constructor.NAME, this.$doDisable);
        this.$root[on ? '$on' : '$off']('bv::enable::' + this.constructor.NAME, this.$doEnable);
      }
    }
  }, {
    key: 'doHide',
    value: function doHide(id) {
      // Programmatically hide tooltip or popover
      if (!id) {
        // Close all tooltips or popovers
        this.forceHide();
      } else if (this.$element && this.$element.id && this.$element.id === id) {
        // Close this specific tooltip or popover
        this.hide();
      }
    }
  }, {
    key: 'doShow',
    value: function doShow(id) {
      // Programmatically show tooltip or popover
      if (!id) {
        // Open all tooltips or popovers
        this.show();
      } else if (id && this.$element && this.$element.id && this.$element.id === id) {
        // Show this specific tooltip or popover
        this.show();
      }
    }
  }, {
    key: 'doDisable',
    value: function doDisable(id) {
      // Programmatically disable tooltip or popover
      if (!id) {
        // Disable all tooltips or popovers
        this.disable();
      } else if (this.$element && this.$element.id && this.$element.id === id) {
        // Disable this specific tooltip or popover
        this.disable();
      }
    }
  }, {
    key: 'doEnable',
    value: function doEnable(id) {
      // Programmatically enable tooltip or popover
      if (!id) {
        // Enable all tooltips or popovers
        this.enable();
      } else if (this.$element && this.$element.id && this.$element.id === id) {
        // Enable this specific tooltip or popover
        this.enable();
      }
    }

    /* istanbul ignore next */

  }, {
    key: 'setOnTouchStartListener',
    value: function setOnTouchStartListener(on) {
      var _this9 = this;

      // if this is a touch-enabled device we add extra
      // empty mouseover listeners to the body's immediate children;
      // only needed because of broken event delegation on iOS
      // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
      if ('ontouchstart' in document.documentElement) {
        from(document.body.children).forEach(function (el) {
          if (on) {
            eventOn(el, 'mouseover', _this9._noop);
          } else {
            eventOff(el, 'mouseover', _this9._noop);
          }
        });
      }
    }

    /* istanbul ignore next */

  }, {
    key: '_noop',
    value: function _noop() {
      // Empty noop handler for ontouchstart devices
    }
  }, {
    key: 'fixTitle',
    value: function fixTitle() {
      var el = this.$element;
      var titleType = _typeof$1(getAttr(el, 'data-original-title'));
      if (getAttr(el, 'title') || titleType !== 'string') {
        setAttr(el, 'data-original-title', getAttr(el, 'title') || '');
        setAttr(el, 'title', '');
      }
    }

    // Enter handler
    /* istanbul ignore next */

  }, {
    key: 'enter',
    value: function enter(e) {
      var _this10 = this;

      if (e) {
        this.$activeTrigger[e.type === 'focusin' ? 'focus' : 'hover'] = true;
      }
      if (hasClass(this.getTipElement(), ClassName$1.SHOW) || this.$hoverState === HoverState.SHOW) {
        this.$hoverState = HoverState.SHOW;
        return;
      }
      clearTimeout(this.$hoverTimeout);
      this.$hoverState = HoverState.SHOW;
      if (!this.$config.delay || !this.$config.delay.show) {
        this.show();
        return;
      }
      this.$hoverTimeout = setTimeout(function () {
        if (_this10.$hoverState === HoverState.SHOW) {
          _this10.show();
        }
      }, this.$config.delay.show);
    }

    // Leave handler
    /* istanbul ignore next */

  }, {
    key: 'leave',
    value: function leave(e) {
      var _this11 = this;

      if (e) {
        this.$activeTrigger[e.type === 'focusout' ? 'focus' : 'hover'] = false;
        if (e.type === 'focusout' && /blur/.test(this.$config.trigger)) {
          // Special case for `blur`: we clear out the other triggers
          this.$activeTrigger.click = false;
          this.$activeTrigger.hover = false;
        }
      }
      if (this.isWithActiveTrigger()) {
        return;
      }
      clearTimeout(this.$hoverTimeout);
      this.$hoverState = HoverState.OUT;
      if (!this.$config.delay || !this.$config.delay.hide) {
        this.hide();
        return;
      }
      this.$hoverTimeout = setTimeout(function () {
        if (_this11.$hoverState === HoverState.OUT) {
          _this11.hide();
        }
      }, this.$config.delay.hide);
    }
  }, {
    key: 'getPopperConfig',
    value: function getPopperConfig(placement, tip) {
      var _this12 = this;

      return {
        placement: this.constructor.getAttachment(placement),
        modifiers: {
          offset: { offset: this.getOffset(placement, tip) },
          flip: { behavior: this.$config.fallbackPlacement },
          arrow: { element: '.arrow' },
          preventOverflow: { boundariesElement: this.$config.boundary }
        },
        onCreate: function onCreate(data) {
          // Handle flipping arrow classes
          if (data.originalPlacement !== data.placement) {
            _this12.handlePopperPlacementChange(data);
          }
        },
        onUpdate: function onUpdate(data) {
          // Handle flipping arrow classes
          _this12.handlePopperPlacementChange(data);
        }
      };
    }
  }, {
    key: 'getOffset',
    value: function getOffset(placement, tip) {
      if (!this.$config.offset) {
        var arrow = select(Selector$1.ARROW, tip);
        var arrowOffset = parseFloat(getCS(arrow).width) + parseFloat(this.$config.arrowPadding);
        switch (OffsetMap[placement.toUpperCase()]) {
          case +1:
            return '+50%p - ' + arrowOffset + 'px';
          case -1:
            return '-50%p + ' + arrowOffset + 'px';
          default:
            return 0;
        }
      }
      return this.$config.offset;
    }
  }, {
    key: 'getPlacement',
    value: function getPlacement() {
      var placement = this.$config.placement;
      if (typeof placement === 'function') {
        return placement.call(this, this.$tip, this.$element);
      }
      return placement;
    }
  }, {
    key: 'isWithActiveTrigger',
    value: function isWithActiveTrigger() {
      var this$1 = this;

      for (var trigger in this$1.$activeTrigger) {
        if (this$1.$activeTrigger[trigger]) {
          return true;
        }
      }
      return false;
    }

    // NOTE: Overridden by PopOver class

  }, {
    key: 'cleanTipClass',
    value: function cleanTipClass() {
      var tip = this.getTipElement();
      var tabClass = tip.className.match(BSCLS_PREFIX_REGEX$1);
      if (tabClass !== null && tabClass.length > 0) {
        tabClass.forEach(function (cls) {
          removeClass(tip, cls);
        });
      }
    }
  }, {
    key: 'handlePopperPlacementChange',
    value: function handlePopperPlacementChange(data) {
      this.cleanTipClass();
      this.addAttachmentClass(this.constructor.getAttachment(data.placement));
    }
  }, {
    key: 'fixTransition',
    value: function fixTransition(tip) {
      var initConfigAnimation = this.$config.animation || false;
      if (getAttr(tip, 'x-placement') !== null) {
        return;
      }
      removeClass(tip, ClassName$1.FADE);
      this.$config.animation = false;
      this.hide();
      this.show();
      this.$config.animation = initConfigAnimation;
    }
  }], [{
    key: 'getAttachment',
    value: function getAttachment(placement) {
      return AttachmentMap[placement.toUpperCase()];
    }
  }, {
    key: 'Default',
    get: function get() {
      return Defaults$1;
    }

    // NOTE: Overridden by PopOver class

  }, {
    key: 'NAME',
    get: function get() {
      return NAME$1;
    }
  }]);

  return ToolTip;
}();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties$$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties$$1(Constructor.prototype, protoProps); } if (staticProps) { defineProperties$$1(Constructor, staticProps); } return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) { Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } }

var NAME = 'popover';
var CLASS_PREFIX = 'bs-popover';
var BSCLS_PREFIX_REGEX = new RegExp('\\b' + CLASS_PREFIX + '\\S+', 'g');

var Defaults = assign({}, ToolTip.Default, {
  placement: 'right',
  trigger: 'click',
  content: '',
  template: '<div class="popover" role="tooltip">' + '<div class="arrow"></div>' + '<h3 class="popover-header"></h3>' + '<div class="popover-body"></div></div>'
});

var ClassName = {
  FADE: 'fade',
  SHOW: 'show'
};

var Selector = {
  TITLE: '.popover-header',
  CONTENT: '.popover-body'

  /* istanbul ignore next: dificult to test in Jest/JSDOM environment */
};
var PopOver = function (_ToolTip) {
  _inherits(PopOver, _ToolTip);

  function PopOver() {
    _classCallCheck(this, PopOver);

    return _possibleConstructorReturn(this, (PopOver.__proto__ || Object.getPrototypeOf(PopOver)).apply(this, arguments));
  }

  _createClass(PopOver, [{
    key: 'isWithContent',


    // Method overrides

    value: function isWithContent(tip) {
      tip = tip || this.$tip;
      if (!tip) {
        return false;
      }
      var hasTitle = Boolean((select(Selector.TITLE, tip) || {}).innerHTML);
      var hasContent = Boolean((select(Selector.CONTENT, tip) || {}).innerHTML);
      return hasTitle || hasContent;
    }
  }, {
    key: 'addAttachmentClass',
    value: function addAttachmentClass(attachment) {
      addClass(this.getTipElement(), CLASS_PREFIX + '-' + attachment);
    }
  }, {
    key: 'setContent',
    value: function setContent(tip) {
      // we use append for html objects to maintain js events/components
      this.setElementContent(select(Selector.TITLE, tip), this.getTitle());
      this.setElementContent(select(Selector.CONTENT, tip), this.getContent());

      removeClass(tip, ClassName.FADE);
      removeClass(tip, ClassName.SHOW);
    }

    // This method may look identical to ToolTip version, but it uses a different RegEx defined above

  }, {
    key: 'cleanTipClass',
    value: function cleanTipClass() {
      var tip = this.getTipElement();
      var tabClass = tip.className.match(BSCLS_PREFIX_REGEX);
      if (tabClass !== null && tabClass.length > 0) {
        tabClass.forEach(function (cls) {
          removeClass(tip, cls);
        });
      }
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      var title = this.$config.title || '';
      if (typeof title === 'function') {
        title = title(this.$element);
      }
      if ((typeof title === 'undefined' ? 'undefined' : _typeof(title)) === 'object' && title.nodeType && !title.innerHTML.trim()) {
        // We have a dom node, but without inner content, so just return an empty string
        title = '';
      }
      if (typeof title === 'string') {
        title = title.trim();
      }
      if (!title) {
        // Try and grab element's title attribute
        title = getAttr(this.$element, 'title') || getAttr(this.$element, 'data-original-title') || '';
        title = title.trim();
      }
      return title;
    }

    // New methods

  }, {
    key: 'getContent',
    value: function getContent() {
      var content = this.$config.content || '';
      if (typeof content === 'function') {
        content = content(this.$element);
      }
      if ((typeof content === 'undefined' ? 'undefined' : _typeof(content)) === 'object' && content.nodeType && !content.innerHTML.trim()) {
        // We have a dom node, but without inner content, so just return an empty string
        content = '';
      }
      if (typeof content === 'string') {
        content = content.trim();
      }
      return content;
    }
  }], [{
    key: 'Default',

    // Getter overrides

    get: function get() {
      return Defaults;
    }
  }, {
    key: 'NAME',
    get: function get() {
      return NAME;
    }
  }]);

  return PopOver;
}(ToolTip);

/**
 * Log a warning message to the console with bootstrap-vue formatting sugar.
 * @param {string} message
 */
/* istanbul ignore next */
function warn(message) {
  console.warn("[Bootstrap-Vue warn]: " + message);
}

// Polyfills for SSR

var isSSR = typeof window === 'undefined';

var HTMLElement = isSSR ? Object : window.HTMLElement;

/**
 * Observe a DOM element changes, falls back to eventListener mode
 * @param {Element} el The DOM element to observe
 * @param {Function} callback callback to be called on change
 * @param {object} [opts={childList: true, subtree: true}] observe options
 * @see http://stackoverflow.com/questions/3219758
 */
function observeDOM(el, callback, opts) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
  var eventListenerSupported = window.addEventListener;

  // Handle case where we might be passed a vue instance
  el = el ? el.$el || el : null;
  /* istanbul ignore next: dificult to test in JSDOM */
  if (!isElement(el)) {
    // We can't observe somthing that isn't an element
    return null;
  }

  var obs = null;

  /* istanbul ignore next: dificult to test in JSDOM */
  if (MutationObserver) {
    // Define a new observer
    obs = new MutationObserver(function (mutations) {
      var changed = false;
      // A Mutation can contain several change records, so we loop through them to see what has changed.
      // We break out of the loop early if any "significant" change has been detected
      for (var i = 0; i < mutations.length && !changed; i++) {
        // The muttion record
        var mutation = mutations[i];
        // Mutation Type
        var type = mutation.type;
        // DOM Node (could be any DOM Node type - HTMLElement, Text, comment, etc)
        var target = mutation.target;
        if (type === 'characterData' && target.nodeType === Node.TEXT_NODE) {
          // We ignore nodes that are not TEXt (i.e. comments, etc) as they don't change layout
          changed = true;
        } else if (type === 'attributes') {
          changed = true;
        } else if (type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
          // This includes HTMLElement and Text Nodes being added/removed/re-arranged
          changed = true;
        }
      }
      if (changed) {
        // We only call the callback if a change that could affect layout/size truely happened.
        callback();
      }
    });

    // Have the observer observe foo for changes in children, etc
    obs.observe(el, assign({ childList: true, subtree: true }, opts));
  } else if (eventListenerSupported) {
    // Legacy interface. most likely not used in modern browsers
    el.addEventListener('DOMNodeInserted', callback, false);
    el.addEventListener('DOMNodeRemoved', callback, false);
  }

  // We return a reference to the observer so that obs.disconnect() can be called if necessary
  // To reduce overhead when the root element is hiiden
  return obs;
}

var _typeof$2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * Tooltip/Popover component mixin
 * Common props
 */
var PLACEMENTS = {
  top: 'top',
  topleft: 'topleft',
  topright: 'topright',
  right: 'right',
  righttop: 'righttop',
  rightbottom: 'rightbottom',
  bottom: 'bottom',
  bottomleft: 'bottomleft',
  bottomright: 'bottomright',
  left: 'left',
  lefttop: 'lefttop',
  leftbottom: 'leftbottom',
  auto: 'auto'
};

var OBSERVER_CONFIG = {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['class', 'style']
};

var toolpopMixin = {
  props: {
    target: {
      // String ID of element, or element/component reference
      type: [String, Object, HTMLElement, Function]
    },
    delay: {
      type: [Number, Object, String],
      default: 0
    },
    offset: {
      type: [Number, String],
      default: 0
    },
    noFade: {
      type: Boolean,
      default: false
    },
    container: {
      // String ID of container, if null body is used (default)
      type: String,
      default: null
    },
    boundary: {
      // String: scrollParent, window, or viewport
      // Element: element reference
      type: [String, Object],
      default: 'scrollParent'
    },
    show: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    show: function show(_show, old) {
      if (_show === old) {
        return;
      }
      _show ? this.onOpen() : this.onClose();
    },
    disabled: function disabled(_disabled, old) {
      if (_disabled === old) {
        return;
      }
      _disabled ? this.onDisable() : this.onEnable();
    }
  },
  created: function created() {
    // Create non-reactive property
    this._toolpop = null;
    this._obs_title = null;
    this._obs_content = null;
  },
  mounted: function mounted() {
    var _this = this;

    // We do this in a next tick to ensure DOM has rendered first
    this.$nextTick(function () {
      // Instantiate ToolTip/PopOver on target
      // The createToolpop method must exist in main component
      if (_this.createToolpop()) {
        if (_this.disabled) {
          // Initially disabled
          _this.onDisable();
        }
        // Listen to open signals from others
        _this.$on('open', _this.onOpen);
        // Listen to close signals from others
        _this.$on('close', _this.onClose);
        // Listen to disable signals from others
        _this.$on('disable', _this.onDisable);
        // Listen to disable signals from others
        _this.$on('enable', _this.onEnable);
        // Observe content Child changes so we can notify popper of possible size change
        _this.setObservers(true);
        // Set intially open state
        if (_this.show) {
          _this.onOpen();
        }
      }
    });
  },
  updated: function updated() {
    // If content/props changes, etc
    if (this._toolpop) {
      this._toolpop.updateConfig(this.getConfig());
    }
  },

  /* istanbul ignore next: not easy to test */
  activated: function activated() {
    // Called when component is inside a <keep-alive> and component brought offline
    this.setObservers(true);
  },

  /* istanbul ignore next: not easy to test */
  deactivated: function deactivated() {
    // Called when component is inside a <keep-alive> and component taken offline
    if (this._toolpop) {
      this.setObservers(false);
      this._toolpop.hide();
    }
  },

  /* istanbul ignore next: not easy to test */
  beforeDestroy: function beforeDestroy() {
    // Shutdown our local event listeners
    this.$off('open', this.onOpen);
    this.$off('close', this.onClose);
    this.$off('disable', this.onDisable);
    this.$off('enable', this.onEnable);
    this.setObservers(false);
    // bring our content back if needed
    this.bringItBack();
    if (this._toolpop) {
      this._toolpop.destroy();
      this._toolpop = null;
    }
  },

  computed: {
    baseConfig: function baseConfig() {
      var cont = this.container;
      var delay = _typeof$2(this.delay) === 'object' ? this.delay : parseInt(this.delay, 10) || 0;
      return {
        // Title prop
        title: (this.title || '').trim() || '',
        // Contnt prop (if popover)
        content: (this.content || '').trim() || '',
        // Tooltip/Popover placement
        placement: PLACEMENTS[this.placement] || 'auto',
        // Container curently needs to be an ID with '#' prepended, if null then body is used
        container: cont ? /^#/.test(cont) ? cont : '#' + cont : false,
        // boundariesElement passed to popper
        boundary: this.boundary,
        // Show/Hide delay
        delay: delay || 0,
        // Offset can be css distance. if no units, pixels are assumed
        offset: this.offset || 0,
        // Disable fade Animation?
        animation: !this.noFade,
        // Open/Close Trigger(s)
        trigger: isArray(this.triggers) ? this.triggers.join(' ') : this.triggers,
        // Callbacks so we can trigger events on component
        callbacks: {
          show: this.onShow,
          shown: this.onShown,
          hide: this.onHide,
          hidden: this.onHidden,
          enabled: this.onEnabled,
          disabled: this.onDisabled
        }
      };
    }
  },
  methods: {
    getConfig: function getConfig() {
      var cfg = assign({}, this.baseConfig);
      if (this.$refs.title && this.$refs.title.innerHTML.trim()) {
        // If slot has content, it overrides 'title' prop
        // We use the DOM node as content to allow components!
        cfg.title = this.$refs.title;
        cfg.html = true;
      }
      if (this.$refs.content && this.$refs.content.innerHTML.trim()) {
        // If slot has content, it overrides 'content' prop
        // We use the DOM node as content to allow components!
        cfg.content = this.$refs.content;
        cfg.html = true;
      }
      return cfg;
    },
    onOpen: function onOpen() {
      if (this._toolpop) {
        this._toolpop.show();
      }
    },
    onClose: function onClose(callback) {
      if (this._toolpop) {
        this._toolpop.hide(callback);
      } else if (typeof callback === 'function') {
        callback();
      }
    },
    onDisable: function onDisable() {
      if (this._toolpop) {
        this._toolpop.disable();
      }
    },
    onEnable: function onEnable() {
      if (this._toolpop) {
        this._toolpop.enable();
      }
    },
    updatePosition: function updatePosition() {
      if (this._toolpop) {
        // Instruct popper to reposition popover if necessary
        this._toolpop.update();
      }
    },
    getTarget: function getTarget() {
      var target = this.target;
      if (typeof target === 'function') {
        target = target();
      }
      if (typeof target === 'string') {
        // Assume ID of element
        return getById(target);
      } else if ((typeof target === 'undefined' ? 'undefined' : _typeof$2(target)) === 'object' && isElement(target.$el)) {
        // Component reference
        return target.$el;
      } else if ((typeof target === 'undefined' ? 'undefined' : _typeof$2(target)) === 'object' && isElement(target)) {
        // Element reference
        return target;
      }
      return null;
    },
    onShow: function onShow(evt) {
      this.$emit('show', evt);
    },
    onShown: function onShown(evt) {
      this.setObservers(true);
      this.$emit('update:show', true);
      this.$emit('shown', evt);
    },
    onHide: function onHide(evt) {
      this.$emit('hide', evt);
    },
    onHidden: function onHidden(evt) {
      this.setObservers(false);
      // bring our content back if needed to keep Vue happy
      // Tooltip class will move it back to tip when shown again
      this.bringItBack();
      this.$emit('update:show', false);
      this.$emit('hidden', evt);
    },
    onEnabled: function onEnabled(evt) {
      if (!evt || evt.type !== 'enabled') {
        // Prevent possible endless loop if user mistakienly fires enabled instead of enable
        return;
      }
      this.$emit('update:disabled', false);
      this.$emit('disabled');
    },
    onDisabled: function onDisabled(evt) {
      if (!evt || evt.type !== 'disabled') {
        // Prevent possible endless loop if user mistakienly fires disabled instead of disable
        return;
      }
      this.$emit('update:disabled', true);
      this.$emit('enabled');
    },
    bringItBack: function bringItBack() {
      // bring our content back if needed to keep Vue happy
      if (this.$el && this.$refs.title) {
        this.$el.appendChild(this.$refs.title);
      }
      if (this.$el && this.$refs.content) {
        this.$el.appendChild(this.$refs.content);
      }
    },

    /* istanbul ignore next: not easy to test */
    setObservers: function setObservers(on) {
      if (on) {
        if (this.$refs.title) {
          this._obs_title = observeDOM(this.$refs.title, this.updatePosition.bind(this), OBSERVER_CONFIG);
        }
        if (this.$refs.content) {
          this._obs_content = observeDOM(this.$refs.content, this.updatePosition.bind(this), OBSERVER_CONFIG);
        }
      } else {
        if (this._obs_title) {
          this._obs_title.disconnect();
          this._obs_title = null;
        }
        if (this._obs_content) {
          this._obs_content.disconnect();
          this._obs_content = null;
        }
      }
    }
  }
};

var bPopover = {
  mixins: [toolpopMixin],
  render: function render(h) {
    return h('div', {
      class: ['d-none'],
      style: { display: 'none' },
      attrs: { 'aria-hidden': true }
    }, [h('div', { ref: 'title' }, this.$slots.title), h('div', { ref: 'content' }, this.$slots.default)]);
  },
  data: function data() {
    return {};
  },

  props: {
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    triggers: {
      type: [String, Array],
      default: 'click'
    },
    placement: {
      type: String,
      default: 'right'
    }
  },
  methods: {
    createToolpop: function createToolpop() {
      // getTarget is in toolpop mixin
      var target = this.getTarget();
      if (target) {
        this._toolpop = new PopOver(target, this.getConfig(), this.$root);
      } else {
        this._toolpop = null;
        warn("b-popover: 'target' element not found!");
      }
      return this._toolpop;
    }
  }
};

var messagesDefault = {
    title: 'Are you sure?',
    yes: 'Yes',
    no: 'No'
};

var component$1 = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('span',{ref:"trigger",attrs:{"id":_vm.randomId,"tabindex":"-1"},on:{"!click":function($event){return _vm.interceptEvent($event)}}},[_vm._t("default")],2),_vm._v(" "),_c('b-popover',{ref:"popover",staticClass:"click-confirm",attrs:{"target":_vm.randomId,"show":_vm.isOpen,"placement":_vm.placement,"title":_vm.messages.title,"triggers":"blur"},on:{"update:show":function($event){_vm.isOpen=$event;},"hidden":_vm.onHidden}},[_c('div',{staticClass:"text-center"},[_c('button',{ref:"buttonYes",class:[_vm.yesClass, _vm.buttonSizeClass],on:{"click":function($event){$event.preventDefault();return _vm.onOk($event)}}},[_vm._t("confirm-yes-icon",[(_vm.yesIcon)?_c('span',{class:_vm.yesIcon,attrs:{"aria-hidden":"true"}}):_vm._e()]),_vm._v(" "+_vm._s(_vm.messages.yes)+" ")],2),_vm._v(" "),_c('button',{ref:"buttonNo",class:[_vm.noClass, _vm.buttonSizeClass],on:{"click":function($event){$event.preventDefault();return _vm.onCancel($event)}}},[_vm._t("confirm-no-icon",[(_vm.noIcon)?_c('span',{class:_vm.noIcon,attrs:{"aria-hidden":"true"}}):_vm._e()]),_vm._v(" "+_vm._s(_vm.messages.no)+" ")],2)])])],1)},staticRenderFns: [],
    components: { bPopover: bPopover },

    data: function data() {
        return {
            isOpen: false,
            randomId: 'clickConfirm' + this._uid,
            target: null,
            allow: false
        }
    },

    props: {
        buttonSize: {
            type: String,
            default: "",
            validator: function validator(value) {
                return ['lg', '', 'sm'].includes(value);
            }
        },

        disabled: {
            type: Boolean,
            default: false
        },

        messages: {
            type: Object,
            default: function default$1() {
                return messagesDefault;
            }
        },

        noClass: {
            type: [String, Array, Object],
            default: "btn btn-secondary"
        },

        noIcon: {
            type: [String, Array, Object],
            default: "fa fa-times"
        },

        placement: {
            type: String,
            default: 'top',
        },

        yesClass: {
            type: [String, Array, Object],
            default: "btn btn-primary"
        },

        yesIcon: {
            type: [String, Array, Object],
            default: "fa fa-check"
        }
    },

    computed: {
        buttonSizeClass: function buttonSizeClass() {
            return this.buttonSize ? 'btn-' + this.buttonSize : '';
        },

        messagesMerged: function messagesMerged() {
            return Object.assign({}, messagesDefault, this.messages);
        }
    },

    watch: {
        disabled: function disabled(newValue) {
            if (newValue && this.isOpen) {
                this.onCancel();
            }
        }
    },

    methods: {
        onHidden: function onHidden() {
            this.target = null;
        },

        onOk: function onOk() {
            if (this.target !== null) {
                this.allow = true;
                var mouseClick = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    composed: true
                });
                if (!this.target.dispatchEvent(mouseClick)) {
                    console.error('Confirmed event failed to dispatch');
                }
                this.allow = false;
            }
            this.onCancel();
        },

        onCancel: function onCancel() {
            this.isOpen = false;
        },

        interceptEvent: function interceptEvent(e) {
            if (this.disabled) {
                return;
            }

            this.target = e.target;

            if (!this.allow) {
                this.isOpen = true;
                this.setFocusOnButtonYes();
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        },

        setFocusOnButtonYes: function setFocusOnButtonYes() {
            var this$1 = this;

            this.$nextTick(function () {
                this$1.$nextTick(function () {
                    if (this$1.isOpen) {
                        this$1.$refs.buttonYes.focus();
                    }
                });
            });
        }
    },

    beforeDestroy: function beforeDestroy() {
        if (this.isOpen) {
            this.onCancel();
        }
    }
};

var clickConfirmPlugin = function (Vue, params) {
    var name = 'click-confirm';
    if (typeof params === 'string') { name = params; }

    Vue.component(name, component$1);
};

component$1.install = clickConfirmPlugin;

exports['default'] = component$1;
exports.component = component$1;
exports.clickConfirmPlugin = clickConfirmPlugin;

Object.defineProperty(exports, '__esModule', { value: true });

})));
