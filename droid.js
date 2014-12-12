// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview array math and utils
 */
plex.array = {};

/**
 * Finds the region of difference between arrays 'a' and 'b', using ===.
 *
 * @param {Array} a
 * @param {Array} b
 * @return {Array} null if there's no diff, or an array of the form
 * <code>[start of diff, length of diff in 'a', length of diff in 'b']</code>
 * <br>
 * examples:<br>
 * arrayDiff([0, 11, 11, 0], [0, 22, 0]) returns [1, 2, 1]<br>
 */
plex.array.diff = function(a, b) {
  // find beginning of diff
  for (var i = 0; i < a.length || i < b.length; ++i) {
    if (a[i] !== b[i]) {
      // find lengths of diff
      var ai = a.length - 1;
      var bi = b.length - 1;
      while (ai >= i && bi >= i) {
        if (a[ai] !== b[bi]) {
          break;
        }
        --ai;
        --bi;
      }
      return [i, ai - i + 1, bi - i + 1];
    }
  }
  return null;
};

/**
 * Tests to see if two arrays are equal, using === on the items.  Tests
 * array lengths first for an easy fast fail.
 * @return {boolean} true iff they're equal.
 */
plex.array.equals = function(a, b) {
  if (a.length != b.length) {
    return false;
  }
  // same length; compare entries
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};


/**
 * Sorts a list by item length.  Good for strings or arrays.
 * Keeps the original list order, within each length-bucket.
 * @return a new sorted array
 */
plex.array.sortByLength = function(strs) {
  var buckets = [];
  for (var i = 0; i < strs.length; ++i) {
    var s = strs[i];
    var len = s.length;
    if (!buckets[len]) {
      buckets[len] = [];
    }
    buckets[len].push(s);
  }
  var retval = [];
  for (var b = 0; b < buckets.length; ++b) {
    if (buckets[b]) {
      retval = buckets[b].concat(retval);
    }
  }
  return retval;
};


/**
 * Gets the index of an element in an array, using ===.
 * @param {Array} a  the array in which to look
 * @param {Object} val  the value for which to look
 * @param {number=} opt_fromIndex  optional starting index.  Default is 0.
 * @return {number} the index of the val, or -1 if it's not in the array
 */
plex.array.indexOf = function(a, val, opt_fromIndex) {
  for (var i = opt_fromIndex || 0, n = a.length; i < n; ++i) {
    if (a[i] === val) {
      return i;
    }
  }
  return -1;
};


/**
 * Gets the index of an element in an array, using ===.
 * @param {Array} a  the array in which to look
 * @param {Object} val  the value for which to look
 * @return {boolean}
 */
plex.array.contains = function(a, val) {
  return plex.array.indexOf(a, val) !== -1;
};


/**
 * Makes a shallow copy of the array.
 * @param {Array} a  the array to copy
 * @return {Array} the new array
 */
plex.array.copy = function(a) {
  var b = [];
  for (var i = 0; i < a.length; ++i) {
    b[i] = a[i];
  }
  return b;
};

/**
 * Like Python, this adds all the elements in addMe to toMe.
 * Unlike Array.contat, this does not create a new array. This modifies toMe.
 * @param {Array} toMe
 * @param {Array} addMe
 * @return {Array} toMe after modification
 */
plex.array.extend = function(toMe, addMe) {
  for (var i = 0; i < addMe.length; i++) {
    toMe.push(addMe[i]);
  }
  return toMe;
};

///**
//* crazy HTML formatter for side-by-side array diffing.
//* @return a n HTML table with class 'diff' and with diffed regions as divs
//* also having class 'diff'
//* @deprecated
//*/
//formatDiff: function(a, b, diff) {
//var h = [];
//
//function pushDiffCell(c, length) {
// h.push('<td><div class="diff">');
// for (var i = diff[0]; i < diff[0] + length; ++i) {
//   if (c[i].toString() === "") {
//     // string is empty
//     h.push('&nbsp;<br>');
//   } else {
//     h.push(plex.textToHtml(c[i], true));
//     h.push('<br>');
//   }
// }
// h.push('</div></td>');
//}
//
//function pushSameCell(c, start, end) {
// h.push('<td>');
// for (var i = start; i < end; ++i) {
//   if (c[i].toString() === "") {
//     // string is empty or all spaces
//     h.push('&nbsp;<br>');
//   } else {
//     h.push(plex.textToHtml(c[i], true));
//     h.push('<br>');
//   }
// }
// //h.push(plex.textToHtml(c.slice(start, end).join('\n')));
// h.push('</td>');
//}
//
//h.push('<table class="diff" cellpadding=0 cellspacing=0>');
//
//// same region
//h.push('<tr>');
//pushSameCell(a, 0, diff[0]);
//pushSameCell(b, 0, diff[0]);
//h.push('</tr>');
//
//// diff region
//h.push('<tr>');
//pushDiffCell(a, diff[1]);
//pushDiffCell(b, diff[2]);
//h.push('</div></tr>');
//
//// same region
//h.push('<tr>');
//pushSameCell(a, diff[0] + diff[1], a.length);
//pushSameCell(b, diff[0] + diff[2], b.length);
//h.push('</tr>');
//
//h.push('</table>');
//return h.join('');
//},



this.plex = this.plex || {};

plex.BitQueue = function() {
  // Array of strings that we append to when writing, and that we
  // consolidate into a single string when reading.
  this.queue = [];
  this.nextReadPos = 0;
  this.length = 0;
};

/**
 * @param num
 * @param bitCount
 */
plex.BitQueue.prototype.enqueueNumber = function(num, bitCount) {
  // todo: trim the read part off the 0th element, and reset nextReadPos.
  var bitStr = Number(num).toString(2);
  if (bitStr.length > bitCount) {
    throw Error('number ' + num + ' has more bits than bitCount ' + bitCount);
  }
  this.queue.push(plex.string.padLeft(bitStr, '0', bitCount));
  this.length += bitCount;
};

/**
 * @param bitCount  the number of bits to consume to read a number.
 * @return {Number}
 */
plex.BitQueue.prototype.dequeueNumber = function(bitCount) {
  // Smush the queue into one string before reading.
  if (this.queue.length > 1) {
    this.queue[0] = this.queue.join('');
    this.queue.length = 1;
  }
  var queueStr = this.queue[0];
  var queueLen = queueStr.length - this.nextReadPos;
  if (bitCount > queueLen) {
    throw Error('bitCount ' + bitCount + ' > queueLen ' + queueLen);
  }
  var bitStr = queueStr.substr(this.nextReadPos, bitCount);
  var num = parseInt(bitStr, 2);
  this.nextReadPos += bitCount;
  this.length -= bitCount;
  return num;
};

plex.BitQueue.prototype.enqueueBytes = function(bytes) {
  for (var i = 0; i < bytes.length; i++) {
    this.enqueueNumber(bytes.charCodeAt(i), 8);
  }
};

plex.BitQueue.prototype.dequeueToBytesAndPadZerosRight = function() {
  var bytesArray = [];
  var tailLength = this.length % 8;
  if (tailLength) {
    this.enqueueNumber(0, 8 - tailLength);
  }
  while (this.length) {
    var num = this.dequeueNumber(8);
    bytesArray.push(String.fromCharCode(num));
  }
  return bytesArray.join('');
};
/**
 * leaves p0 towards p1, passes through p3 from dir of p2 
 * B(t) = 
 *     (1 - t)^3       * p0 +
 * 3 * (1 - t)^2 * t   * p1 +
 * 3 * (1 - t)   * t^2 * p2 +
 *                 t^3 * p3
 */
function cubicBezier(p0, p1, p2, p3, t, out) {
  var c0 = (1 - t) * (1 - t) * (1 - t);
  var c1 = 3 * (1 - t) * (1 - t) * t;
  var c2 = 3 * (1 - t) * t * t;
  var c3 = t * t * t;
  out.x =
    c0 * p0.x +
    c1 * p1.x +
    c2 * p2.x +
    c3 * p3.x;
  out.y =
    c0 * p0.y +
    c1 * p1.y +
    c2 * p2.y +
    c3 * p3.y;
  return out;
}

function cubicBezierChain(points, t, out) {
  var numBeziers = points.length / 2 - 1;
  var bezierIndex = Math.floor(t * numBeziers);
  var i = bezierIndex * 2;
//  if (bezierIndex > 0) debugger;
  cubicBezier(
      points[i], points[i + 1], points[i + 2], points[i + 3],
      t * numBeziers - bezierIndex,
      out);
}
// The problem is that I want to express (pos,vel,pos,vel)
// but beziers are (pos,control,control,pos)
// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview
 */
this.plex = this.plex || {};
plex.dom = {};

/**
 * Gets element by ID.
 * @param {String} id  the element's ID
 * @param {Document} opt_doc  optional document object.  If not specified,
 *   then this uses the global context's window.document.
 * @return the element if any
 */
plex.dom.gebi = function(id, opt_doc) {
  return (opt_doc || document).getElementById(id);
};

plex.dom.ce = function(name, opt_parent, opt_doc) {
  var e = (opt_doc || document).createElement(name);
  if (opt_parent) {
    opt_parent.appendChild(e);
  }
  return e;
};

plex.dom.ct = function(text, opt_parent, opt_doc) {
  var e = (opt_doc || document).createTextNode(text);
  if (opt_parent) {
    opt_parent.appendChild(e);
  }
  return e;
};

plex.dom.getClasses = function(node) {
  return node.className.split(/\s/);
};

plex.dom.appendClass = function(node, className) {
  var classes = plex.dom.getClasses(node);
  if (!plex.array.contains(classes, className)) {
    node.className += ' ' + className;
  }
};

plex.dom.prependClass = function(node, className) {
  var classes = plex.dom.getClasses(node);
  if (!plex.array.contains(classes, className)) {
    node.className = className + ' ' + node.className;
  }
};

plex.dom.removeClass = function(node, className) {
  var classes = plex.dom.getClasses(node);

  var index = plex.array.indexOf(classes, className);
  if (index >= 0) {
    classes.splice(index, 1);
    node.className = classes.join(' ');
  }
};

/**
 * Computes a dom node's bounding rectangle.
 * @return {plex.Rect}  a new Rect, or opt_outRect if one is supplied
 */
plex.dom.getBounds = function(node, opt_outRect) {
  var e = node;
  var top = e.offsetTop;
  var left = e.offsetLeft;
  while (e = e.offsetParent) {
    top += e.offsetTop;
    left += e.offsetLeft;
  }
  var right = left + node.offsetWidth;
  var bottom = top + node.offsetHeight;
  var rect = opt_outRect ? opt_outRect : new plex.Rect();
  rect.setXyxy(left, top, right, bottom);
  return rect;
};

plex.dom.getRelativeScrollRect = function(node) {
  return plex.rect.createXywh(node.scrollLeft, node.scrollTop,
                              node.offsetWidth, node.offsetHeight);
};

plex.dom.getRelativeOffsetRect = function(node) {
  return plex.rect.createXywh(node.offsetLeft, node.offsetTop,
                              node.offsetWidth, node.offsetHeight);
};

plex.dom.scrollIntoView = function(node, scroller) {
  var rect = plex.dom.getRelativeOffsetRect(node);
  var view = plex.dom.getRelativeScrollRect(scroller);
  var scrollLeft = Math.max(0, view.getLeft() - rect.getLeft());
  var scrollRight = Math.max(0, rect.getRight() - view.getRight());
  var scrollUp = Math.max(0, view.getTop() - rect.getTop());
  var scrollDown = Math.max(0, rect.getBottom() - view.getBottom());
  var scrollX = 0;
  var scrollY = 0;
  if (!scrollLeft || !scrollRight) {
    scrollX = scrollRight - scrollLeft;
  }
  if (!scrollUp || !scrollDown) {
    scrollY = scrollDown - scrollUp;
  }
  log([scrollX, scrollY]);
  if (scrollX) scroller.scrollLeft += scrollX;
  if (scrollY) scroller.scrollTop += scrollY;
};

this.plex = this.plex || {};

plex.DupeSeeker = function() {
};

/**
 * @param {String} originalStr
 * @param {number} minStrLen
 * @return {plex.Map} a map from dupe string to positions it appears
 */
plex.DupeSeeker.prototype.getDupes = function(originalStr, minStrLen) {
  var charLocs = {};
  // Use this to ensure that we process strings in order of lowest-starting-index.
  // Skipping around would create mementos for suffixes of unprocessed strings,
  // preventing us from processing every dupe string along its full length.
  var charsOrderedByFirstIndex = [];
  for (var i = 0; i < originalStr.length; i++) {
    var c = originalStr.charAt(i);
    if (!charLocs[c]) {
      charLocs[c] = [];
      charsOrderedByFirstIndex.push(c);
    }
    charLocs[c].push(i);
  }
  var results = new plex.Map();
  var mementos = new plex.StringSet();
  for (var i = 0; i < charsOrderedByFirstIndex.length; i++) {
    var c = charsOrderedByFirstIndex[i];
    if (charLocs[c].length > 1) {
      // "c" is a non-unique starting char.
      if (minStrLen <= 1) {
        results.set(c, charLocs[c]);
      }
      this.seekLongerDupes(originalStr, charLocs[c], 1, minStrLen, results, mementos);
    }
  }
  return results;
};

/**
 * @param {String} originalStr The full original string
 * @param {Array} startLocs An array of indexes where the dupe string starts, in ascending order
 * @param {Number} subStrLength The length of the dupe string
 * @param {Number} minStrLen The shortest length string to include in the results
 * @param {plex.Map} results A place to accumulate results
 * @param {plex.StringSet} mementos Stringified arrays of positions that have already been processed
 */
plex.DupeSeeker.prototype.seekLongerDupes = function(
    originalStr, startLocs, subStrLength, minStrLen, results, mementos) {

  function createMemento(locs, offset) {
    var mem = [];
    for (var i = 0; i < locs.length; i++) {
      mem.push(locs[i] + offset);
    }
    return JSON.stringify(mem);
  }

  var nextLen = subStrLength + 1;

  // Don't process this set of strings if we've crossed them before.
  var mem = createMemento(startLocs, subStrLength);
  if (mementos.contains(mem)) {
    return;
  }

  var prevStr = originalStr.substr(startLocs[0], subStrLength);
  // Map all the next-longer strings to their starting positions.
  var nextLocs = {};
  for (var i = 0; i < startLocs.length; i++) {
    var startLoc = startLocs[i];
    var nextStr = originalStr.substr(startLoc, nextLen);
    if (!nextLocs[nextStr]) {
      nextLocs[nextStr] = [];
    }
    nextLocs[nextStr].push(startLoc);
  }

  // Find the non-overlapping non-unique ones.
  for (var nextStr in nextLocs) {
    var goodLocs = [];
    var locs = nextLocs[nextStr];
    var prevStart = -Infinity;

    // Accumulate the non-overlapping goodLocs.
    for (var i = 0; i < locs.length; i++) {
      var loc = locs[i];
      if (loc >= prevStart + nextLen) {
        goodLocs.push(loc);
        prevStart = loc;
      }
    }

    if (subStrLength >= minStrLen && goodLocs.length < startLocs.length) {
      // There are more of prevStr than there there are of nextStr.
      // Record "prevStr" in results.
      results.set(prevStr, startLocs);
    }

    if (goodLocs.length > 1) {
      // "nextStr" is not unique, so process it and its descendants.
      this.seekLongerDupes(originalStr, goodLocs, nextLen, minStrLen, results, mementos);
      mementos.put(createMemento(goodLocs, subStrLength));
    }
  }
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Code for handling DOM events in a cross-browser way.
 */
this.plex = this.plex || {};
plex.event = {};

/**
 * keycodes for key event.keyCode
 */
plex.event.KEYCODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  UP_SAFARI: 63232,
  DOWN_SAFARI: 63233,
  LEFT_SAFARI: 63234,
  RIGHT_SAFARI: 63235,
  ENTER: 77,
  RETURN: 13,
  ESC: 27,
  DOT: 46,
  SPACE: 32,
  C: 67,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  P: 80,
  S: 83,
  X: 88,
  Z: 90,
  BACKSLASH: 220
};

/**
 * Adds an event listener.
 * @param {object} element  DOM element to which to attach listener
 * @param {string} eventName  like 'click', without the 'on' part
 * @param {function} fn  listener function to add
 */
plex.event.addListener = function(element, eventName, fn) {
  if (element.addEventListener) {
    // DOM Level 2
    element.addEventListener(eventName, fn, false);
  } else if (element.attachEvent) {
    // IE
    element.attachEvent('on' + eventName, fn);
  }
};


/**
 * Adds a listener to multiple events.
 * @param {object} element  DOM element to which to attach listener
 * @param {array.<string>} eventNames  like 'click', without the 'on' part
 * @param {function} fn  listener function to add
 */
plex.event.addListenerToEvents = function(element, eventNames, fn) {
  for (var i = 0; i < eventNames.length; ++i) {
    plex.event.addListener(element, eventNames[i], fn);
  }
};


/**
 * Removes an event listener.
 * @param {object} element  DOM element from which to remove listener
 * @param {string} eventName  like 'click', without the 'on' part
 * @param {function} fn  listener function to remove
 */
plex.event.removeListener = function(element, eventName, fn) {
  if (element.removeEventListener) {
    // DOM level 2
    element.removeEventListener(eventName, fn, false);
  } else if (element['detatchEvent']) {
    // IE
    element['detatchEvent']('on' + eventName, fn);
  }
};


/**
 * Removes an event listener from multiple events.
 * @param {object} element  DOM element from which to remove listener
 * @param {array.<string>} eventNames  like 'click', without the 'on' part
 * @param {function} fn  listener function to remove
 */
plex.event.removeListenerFromEvents = function(element, eventNames, fn) {
  for (var i = 0; i < eventNames.length; ++i) {
    plex.event.removeListener(element, eventNames[i], fn);
  }
};


/**
 * Gets the event target from an event object.
 * @param {object} event
 */
plex.event.getTarget = function(event) {
  return event.target || event.srcElement;
};


/**
 * Gets the related target for a mouseover/mouseout event.
 * @param {object} event  must not be null
 * @return {object} element or null
 */
plex.event.getRelatedTarget = function(event) {
  // Other
  if (event.relatedTarget) return event.relatedTarget;
  // IE
  switch(event.type) {
    case 'mouseover': return event.fromElement;
    case 'mouseout': return event.toElement;
  }
  return null;
};


/**
 * For mouseover/mouseout, returns the element that the mouse left.
 * May return null when the mouse is entering from off-window.
 * @param {object} event  must not be null
 * @return {object} element or null
 */
plex.event.getFromElement = function(event) {
  // IE
  if (event.fromElement) return event.fromElement;
  // Other
  switch(event.type) {
    case 'mouseover': return event.relatedTarget;
    case 'mouseout': return event.target;
  }
  return null;
};


/**
 * For mouseover/mouseout, returns the element that the mouse entered.
 * May return null when the mouse is leaving the window.
 * @param {object} event  must not be null
 * @return {object} element or null
 */
plex.event.getToElement = function(event) {
  // IE
  if (event.toElement) return event.toElement;
  // Other
  switch(event.type) {
    case 'mouseover': return event.target;
    case 'mouseout': return event.relatedTarget;
  }
  return null;
};


plex.event.preventDefault = function(event) {
  if ('preventDefault' in event) {
    // DOM2
    event.preventDefault();
  }
  if ('returnValue' in event) {
    event.returnValue = false;
  }
  if ('cancelBubble' in event) {
    event.cancelBubble = true;
  }
};

plex.event.isRightClick = function(mouseClickEvent) {
  // see http://www.quirksmode.org/js/events_properties.html#button
  return mouseClickEvent.button == 2;
};

/**
 * Tracks listeners so unlistening can be done easily.
 * @constructor
 */
plex.event.ListenerTracker = function() {
  this.listeners = [];
};

plex.event.ListenerTracker.prototype.addListener = function(element, eventName, fn) {
  plex.event.addListener(element, eventName, fn);
  this.listeners.push([element, eventName, fn]);
};

plex.event.ListenerTracker.prototype.removeAllListeners = function() {
  var a;
  while (a = this.listeners.pop()) {
    plex.event.removeListener(a[0], a[1], a[2]);
  }
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview Code to handle function-related stuff.
 */
plex.func = {};

/**
 * Creates a new function that calls 'fn' with 'self' as 'this'.
 * @param {Function} fn
 * @param {Object} self
 * @return {Function}
 */
plex.func.bind = function(fn, self) {
  return function() {
    fn.apply(self, arguments);
  };
};

/**
 * Converts caller's arguments (or any arguments) to an array.
 * Useful because 'arguments' is actually an Object with a 'length' member,
 * and numeric keys, but lacks array methods like 'join'.
 * @param {Object} opt_arguments  optional arguments object.  If omitted, the
 *     caller's arguments are used.
 * @return {Array}
 */
plex.func.argumentArray = function(opt_arguments) {
  var a = [];
  var args = opt_arguments || caller.arguments;
  for (var i = 0, n = args.length; i < n; ++i) {
    a.push(args[i]);
  }
  return a;
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview utility for serving unique ID numbers.  Kinda stupid.
 */
plex.ids = {};

plex.ids.num = 1;
plex.ids.PREFIX = 'plex';
plex.ids.regExp = RegExp('^' + plex.ids.PREFIX + '\\d+$');


plex.ids.getNum = function(id) {
  if (plex.ids.regExp.test(id)) {
    return Number(id.substring(plex.ids.PREFIX.length));
  }
  return null;
};


plex.ids.nextId = function() {
  return plex.ids.PREFIX + plex.ids.num++;
};


plex.ids.nextIds = function(count) {
  var retval = [];
  for (var i = 0; i < count; ++i) {
    retval[i] = plex.ids.PREFIX + plex.ids.num++;
  }
  return retval;
};

this.plex = this.plex || {};

/**
 * @param {string} name
 * @param {number} keyCode
 * @constructor
 */
plex.Key = function(name, keyCode) {
  this.name = name;
  this.keyCode = keyCode;
};

/**
 * Names of keys that don't always have a
 * readable single character representation.
 * @enum {string}
 */
plex.Key.Name = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  BACKSPACE: 'backspace',
  DELETE: 'delete',
  SPACE: 'space',
  SEMICOLON: ';',
  BACKSLASH: '\\',
  ESC: 'esc'
};

this.plex = this.plex || {};

/**
 * @param {number} keyCode
 * @param {Array<string>} opt_modifiers a list of the modifier keys that must be true
 * for this to match a key event. Every modifier not required to be true is required to be false.
 * @constructor
 */
plex.KeyCombo = function(keyCode, opt_modifiers) {
  this.keyCode = keyCode;
  this.modifiers = opt_modifiers || [];
};

/**
 * @param event a keyboard event
 * @return {Boolean}
 */
plex.KeyCombo.prototype.matches = function(event) {
  if (event.keyCode != this.keyCode) return false;
  for (var k in plex.KeyModifier) {
    var modifier = plex.KeyModifier[k];
    var expectedValue = plex.array.contains(this.modifiers, modifier);
    if (expectedValue != event[modifier]) return false;
  }
  return true;
};

this.plex = this.plex || {};

/**
 * keyboard event modifiers
 * @enum {String}
 */
plex.KeyModifier = {
  SHIFT: 'shiftKey',
  CTRL: 'ctrlKey',
  ALT: 'altKey',
  META: 'metaKey'
};

this.plex = this.plex || {};

/**
 * Simply associates numeric keycodes  programmer-friendly names.
 * @constructor
 */
plex.Keys = function() {
  // Index the keys by both fields.
  this.byKeyCode = {};
  this.byName = {};

  this.initialized = false;
};

plex.Keys.prototype.getKeyCodeForName = function(name) {
  if (!this.initialized) this.initKeys();
  var key = this.byName[name];
  return key ? key.keyCode : null;
};

plex.Keys.prototype.getNameForKeyCode = function(keyCode) {
  if (!this.initialized) this.initKeys();
  var key = this.byKeyCode[keyCode];
  return key ? key.name : null;
};

/**
 *  Add all letters, numbers, and plex.Key.Name values to byKeyCode and byName indexes.
 */
plex.Keys.prototype.initKeys = function() {
  var self = this;

  function addKey(name, keyCode) {
    var key = new plex.Key(name, keyCode);
    self.byName[name] = key;
    self.byKeyCode[keyCode] = key;
  }

  function addKeySequence(firstChar, firstKeyCode, lastChar) {
    var firstCharCode = firstChar.charCodeAt(0);
    var lastCharCode = lastChar.charCodeAt(0);
    if (firstCharCode > lastCharCode) throw Error(firstChar + ' > ' + lastChar);
    var keyCode = firstKeyCode;
    for (var charCode = firstCharCode; charCode <= lastCharCode; charCode++) {
      addKey(String.fromCharCode(charCode), keyCode);
      keyCode++;
    }
  }
  addKeySequence('a', 65, 'z');
  addKeySequence('0', 48, '9');

  addKey(plex.Key.Name.LEFT, 37);
  addKey(plex.Key.Name.UP, 38);
  addKey(plex.Key.Name.RIGHT, 39);
  addKey(plex.Key.Name.DOWN, 40);

  addKey(plex.Key.Name.BACKSPACE, 8);
  addKey(plex.Key.Name.DELETE, 46);
  addKey(plex.Key.Name.SPACE, 32);

  addKey(plex.Key.Name.SEMICOLON, 186);
  addKey(plex.Key.Name.BACKSLASH, 220);

  addKey(plex.Key.Name.ESC, 27);

  this.initialized = true;
};
this.plex = this.plex || {};

/**
 * @param alphabet A string made of all the legal characters in the input.
 * @constructor
 */
plex.LempelZiv = function(alphabet) {
  this.alphabet = alphabet;
};

plex.LempelZiv.STOPCODE = 0;

/**
 * @param {string} str  A string made up only of what's in the alphabet.
 * @return {Array} An array of integers.
 */
plex.LempelZiv.prototype.encodeToIntegers = function(str) {
  if (str == '') {
    return [plex.LempelZiv.STOPCODE];
  }
  var w = '';
  var result = [];
  var dict = this.createEncodingDictionary();
  for (var i = 0; i < str.length; i++) {
    var c = str.charAt(i);
    var wc = w + c;
    if (dict.contains(wc)) {
      w = wc;
    } else {
      result.push(dict.get(w));
      dict.set(wc, dict.length + 1);
      w = String(c);
    }
  }

  // Output the last code.
  if (w !== "") {
    result.push(dict.get(w));
  }
  result.push(plex.LempelZiv.STOPCODE);
  return result;
};

/**
 * @param {Array} ints  An array of integers.
 * @return {string} A string made up only of what's in the alphabet.
 */
plex.LempelZiv.prototype.decodeFromIntegers = function(ints) {
  if (ints.length == 1 && ints[0] == plex.LempelZiv.STOPCODE) {
    return '';
  }
  var entry = '';
  var dict = this.createDecodingDictionary();
  var w = dict.get(ints[0]);
  var result = w;

  for (var i = 1; i < ints.length; i++) {
    var k = ints[i];
    if (k == plex.LempelZiv.STOPCODE) {
      break;
    }
    if (dict.contains(k)) {
      entry = dict.get(k);
    } else {
      if (k === dict.length + 1) {
        entry = w + w.charAt(0);
      } else {
        throw Error('could not decode integer ' + k);
      }
    }
    result += entry;

    // Add w+entry[0] to the dictionary.
    dict.set(dict.length + 1, w + entry.charAt(0));

    w = entry;
  }
  if (k != 0) {
    throw Error('k:' + k + ' but expected stop-code:' + plex.LempelZiv.STOPCODE);
  }
  return result;
};

plex.LempelZiv.prototype.encodeToBitQueue = function(str, opt_bitQueue) {
  var ints = this.encodeToIntegers(str);
  var bitQueue = opt_bitQueue || new plex.BitQueue();
  var highestValuePossible = this.createEncodingDictionary().length + 1; // +1 for stopcode
  for (var i = 0; i < ints.length; i++) {
    var bitsNeeded = Number(highestValuePossible).toString(2).length;
    bitQueue.enqueueNumber(ints[i], bitsNeeded);
    highestValuePossible++;
  }
  return bitQueue;
};

plex.LempelZiv.prototype.decodeFromBitQueue = function(bitQueue) {
  var highestValuePossible = this.createEncodingDictionary().length + 1; // +1 for stopcode
  var ints = [];
  var num = -1;
  while (num != plex.LempelZiv.STOPCODE) {
    var bitsNeeded = Number(highestValuePossible).toString(2).length;
    num = bitQueue.dequeueNumber(bitsNeeded);
    ints.push(num);
    highestValuePossible++;
  }
  return this.decodeFromIntegers(ints);
};

/**
 * @param str The string to encode.
 * @return {String} of chars whose charCodes are from 0-255
 */
plex.LempelZiv.prototype.encodeToBytes = function(str) {
//  // make sure the input only uses the legal alphabet
//  for (var i = 0; i < str.length; i++) {
//    if (this.alphabet.indexOf(str.charAt(i)) == -1) {
//      throw Error('char ' + str.charAt(i) + ' not in alphabet ' + this.alphabet);
//    }
//  }
  var q = this.encodeToBitQueue(str);
  return q.dequeueToBytesAndPadZerosRight();
};

/**
 * @param {String} bytes  String of chars whose charCodes are from 0-255
 * @return {String} the decoded string
 */
plex.LempelZiv.prototype.decodeFromBytes = function(bytes) {
  var q = new plex.BitQueue();
  q.enqueueBytes(bytes);
  return this.decodeFromBitQueue(q);
};

plex.LempelZiv.prototype.createEncodingDictionary = function() {
  var dict = new plex.Map();
  var nextKey = 1;
  for (var i = 0; i < this.alphabet.length; i++) {
    dict.set(this.alphabet.charAt(i), nextKey++);
  }
  return dict;
};

plex.LempelZiv.prototype.createDecodingDictionary = function() {
  var dict = new plex.Map();
  var nextKey = 1;
  for (var i = 0; i < this.alphabet.length; i++) {
    dict.set(nextKey++, this.alphabet.charAt(i));
  }
  return dict;
};

// Copyright 2012 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * Animation loop.
 * @param func  The funtion to call (in the context of the window) every tick
 * @param targetFps The desired number of ticks per second.
 * @constructor
 */
plex.Loop = function(func, targetFps) {
  this.func = func;
  this.targetFps = targetFps;

  this.targetPeriod = 1000 / this.targetFps;
  this.delay = Math.floor(this.targetPeriod);
  this.running = false;
  this.prevTime = 0;
  var self = this;
  this.timeoutFunc = function() {
    self.clock();
  };
};

plex.Loop.prototype.start = function() {
  if (this.running) return;
  this.running = true;
  this.clock();
};

plex.Loop.prototype.clock = function() {
  if (!this.running) return; // exception?
  this.func.call();
  var now = (new Date()).getTime();
  var actualPeriod = now - this.prevTime;
  this.prevTime = now;
  this.delay += (actualPeriod < this.targetPeriod) ? 1 : -1;
  if (this.delay < 0) this.delay = 0;
  this.timeoutId = setTimeout(this.timeoutFunc, this.delay);
};

plex.Loop.prototype.stop = function() {
  if (!this.running) return;
  clearTimeout(this.timeoutId);
  this.running = false;
};

// Copyright 2012 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview Map class, with arbitrary keys that won't collide with any system stuff.
 */

/**
 * @constructor
 */
plex.Map = function() {
  this.m = {};
  this.length = 0;
};

plex.Map.PREFIX = '=';

plex.Map.prototype.set = function(k, v) {
  var objKey = plex.Map.PREFIX + k;
  if (!this.m[objKey]) this.length++;
  this.m[objKey] = v;
  return this;
};

plex.Map.prototype.get = function(k) {
  return this.m[plex.Map.PREFIX + k];
};

plex.Map.prototype.contains = function(k) {
  return this.get(k) !== undefined;
};

plex.Map.prototype.remove = function(k) {
  var objKey = plex.Map.PREFIX + k;
  if (this.m[objKey]) this.length--;
  delete this.m[objKey];
};

/**
 * @return {Array}
 */
plex.Map.prototype.getKeys = function() {
  var keys = [];
  for (var pk in this.m) {
    keys.push(pk.substr(1));
  }
  return keys;
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview
 */
this.plex = this.plex || {};
plex.object = {};

plex.object.expose = function(obj) {
  var text = [];
  for (var x in obj) {
    try {
      text.push(x + ' = ' + obj[x]);
    } catch (e) {
      text.push('*** ' + e + ' ***');
    }
  }
  return text.join('\n');
};

plex.object.isEmpty = function(obj) {
  for (var k in obj) {
    return false;
  }
  return true;
};

plex.object.set = function(obj, attrs) {
  for (var a in attrs) {
    obj[a] = attrs[a];
  }
  return obj;
};

plex.object.keys = function(obj) {
  var keys = [];
  try {
    for (var key in obj) {
      keys.push(key);
    }
  } catch (e) {
    // some kinda access violation
  }
  return keys;
};

plex.object.length = function(obj) {
  var len = 0;
  for (var k in obj) {
    len++;
  }
  return len;
};

plex.object.values = function(obj) {
  var values = [];
  try {
    for (var key in obj) {
      values.push(obj[key]);
    }
  } catch (e) {
    // some kinda access violation
  }
  return values;
};

plex.object.deleteUndefined = function(obj) {
  try {
    for (var key in obj) {
      if (typeof obj[key] == 'undefined') {
        delete obj[key];
      }
    }
  } catch (e) {
    // some kinda access violation
  }
  return obj;
};

plex.object.clear = function(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
  return obj;
};


// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview  Box models suck, so this is a heavy-handed layout engine to
 * give programmers control of where app-like panes appear in the browser
 * window.  Using createWindowPane() you can make non-scrolling app-like
 * layouts.
 * <p>
 * There are a lot of ways to make panes.
 * <ul>
 * <li>createWindowPane - 
 * <li>absPane - A pane whose size is fixed, and whose position is defined
 *     as an x/y offset from one of the four corners of the windowPane, so
 *     it may move as the window is resized.
 * <li>
 * </ul>
 */
plex.pane = {};

/**
 * Creates a new pane covering the whole window, and adds a window resize
 * event listener to it.
 * @param {Window} opt_win  optional window.  Default is the caller's window.
 * @return {plex.Pane} a new window pane
 */
plex.pane.createWindowPane = function(opt_win) {
  var win = opt_win || window;
  // the rect calc function always returns the window rect
  var pane = new plex.Pane(
      function() {
        return plex.window.getRect(win);
      }); 
  var onResize = function() {pane.reposition();};
  plex.event.addListener(win, "resize", onResize);
  pane.reposition();
  return pane;
};

/**
 * Creates a function that takes a rectangle and returns a smaller rect that
 * would cover the x,y cell if the rect were a grid of cols,rows.
 * @param {Object} cols
 * @param {Object} rows
 * @param {Object} x
 * @param {Object} y
 */
plex.pane.getGridCellFunc = function(cols, rows, x, y) {
  return function(rect) {
    return rect.createGridCell(cols, rows, x, y);
  };
};


/**
 * An absolutely positioned pane, responsive to changes in its parent's
 * position.  Tracks its parent and its children.  Creates a div, too.
 * @param {Function} calcRect  a function taking the parent rect as an arg,
 *     and returning this pane's new rect.
 * @param {plex.Pane} opt_parent  optional parent pane to which this pane will
 *     be added as a child.  Default is null.
 * @constructor
 */
plex.Pane = function(calcRect, opt_parent) {
  this.calcRect = calcRect;
  this.element = null;
  this.children = [];
  this.rect = new plex.Rect();
  this.onAfterReposition = null;
  this.parent = opt_parent || null;
  if (this.parent) {
    this.parent.addChild(this);
    this.reposition();
  }
};


/**
 * Adds a child pane.
 * @param {plex.Pane} childPane  pane to add
 */
plex.Pane.prototype.addChild = function(childPane) {
  this.children.push(childPane);
};


/**
 * Sets the element that the pane controls, and styles the element to fit in
 * the pane.
 * @param {HTMLElement} the element.  May be null.
 * @return {HTMLElement} the element that was passed in
 */
plex.Pane.prototype.setElement = function(element) {
  this.element = element;
  this.styleElement();
  return element;
};


/**
 * Gets the element that the pane controls.
 * @return {HTMLElement} the element
 */
plex.Pane.prototype.getElement = function() {
  return this.element;
};


/**
 * If the pane controls an element, sets the element's position and size to fit
 * the pane.
 */
plex.Pane.prototype.styleElement = function() {
  if (this.element) {
    var s = this.element.style;
    var r = this.rect;
    s.position = 'absolute';
    s.top = r.getTop() + 'px';
    s.left = r.getLeft() + 'px';
    s.width = Math.max(r.getWidth(), 0) + 'px';
    s.height = Math.max(r.getHeight(), 0) + 'px';
  }
};


/**
 * Returns the rectangle that this pane's div covers
 * @return {plex.Rect} the rect
 */
plex.Pane.prototype.getRect = function() {
  return this.rect;
};

/**
 * Repositions this pane w.r.t. its parent, and recursively repositions any
 * children.
 * @param {plex.Rect} parentRect  the parent pane if any, used to calculate the
 * position of this child.
 */
plex.Pane.prototype.reposition = function() {
  if (this.parent) {
    var parentRect = this.parent.getRect();
  }
  var newRect = this.calcRect(parentRect);
  if (!newRect.equals(this.rect)) {
    this.rect = newRect;
    this.styleElement();
  }
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i].reposition(newRect);
  }
  if (this.onAfterReposition) {
    this.onAfterReposition();
  }
};


/**
 * Sets a function that is called in the context of this pane, after this pane
 * and its children have been repositioned.
 * @param {Function} func  a function that takes this pane as an argument.
 *     May be null.
 */
plex.Pane.prototype.setOnAfterReposition = function(func) {
  this.onAfterReposition = func;
};


/**
 * Creates and adds a child pane to this parent pane, inset from the parent's
 * edges.  Insets are specified just like CSS padding, except that only pixel
 * and percent values are supported now.
 * @param {Number} top  Inset from the top
 * @param {Number} opt_right  Optional inset from the right.  Defaults to top.
 * @param {Number} opt_bottom  Optional inset from bottom.  Defaults to top.
 * @param {Number} opt_left  Optional inset from left.  Defaults to right.
 * @return {plex.Pane} the new child pane
 */
plex.Pane.prototype.createInsetPane = function(top, opt_right, opt_bottom,
                                               opt_left) {
  var calc = function(rect) {
    return rect.createInsetRect(top, opt_right, opt_bottom, opt_left);
  };
  return new plex.Pane(calc, this);
};


/**
 * Creates two child panes from this parent pane
 * @param {Number} edge  a plex.rect.TOP/RIGHT/BOTTOM/LEFT value
 * @param {String} val  like '4px' or '20%'
 * @return {Array} an array of the two child plex.Panes.  The 0th is the one
 *     close to the 'edge', and the other is the far one.
 */
plex.Pane.prototype.createHalfPanes = function(edge, val) {
  var calc0 = function(rect) {
    return rect.createHalf(edge, val, true);
  };
  var calc1 = function(rect) {
    return rect.createHalf(edge, val, false);
  };
  return [new plex.Pane(calc0, this), new plex.Pane(calc1, this)];
};


plex.Pane.prototype.createGridPanes = function(cols, rows) {
  var grid = [];
  for (var y = 0; y < rows; ++y) {
    var row = [];
    for (var x = 0; x < cols; ++x) {
      var calc = plex.pane.getGridCellFunc(cols, rows, x, y);
      var cell = new plex.Pane(calc, this);
      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
};


// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * A point, or really an xy pair.
 * @param {number=} opt_x
 * @param {number=} opt_y
 * @constructor
 */
plex.Point = function(opt_x, opt_y) {
  this.x = Number(opt_x || 0);
  this.y = Number(opt_y || 0);
};


plex.Point.prototype.equals = function(that) {
  return this.x == that.x && this.y == that.y;
};


plex.Point.prototype.toString = function() {
  return '{x:' + this.x + ', y:' + this.y + '}';
};


plex.Point.prototype.boundingRect = function() {
  return new plex.Rect(this, this);
};


plex.Point.prototype.setX = function(x) {
  this.x = Number(x);
};


plex.Point.prototype.setY = function(y) {
  this.y = Number(y);
};


plex.Point.prototype.setXy = function(x, y) {
  this.x = Number(x);
  this.y = Number(y);
  return this;
};

plex.Point.prototype.set = function(that) {
  this.x = Number(that.x);
  this.y = Number(that.y);
  return this;
};

plex.Point.prototype.getX = function() {
  return this.x;
};


plex.Point.prototype.getY = function() {
  return this.y;
};

plex.Point.prototype.add = function(that) {
  this.x += Number(that.x);
  this.y += Number(that.y);
  return this;
};

plex.Point.prototype.subtract = function(that) {
  this.x -= that.x;
  this.y -= that.y;
  return this;
};

plex.Point.prototype.scale = function(s) {
  this.x *= s;
  this.y *= s;
  return this;
};


// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview
 */
this.plex = this.plex || {};

/**
 * Allows a publisher to call multiple subscriber functions at once.
 * Subscribers can add and remove themselves.
 * @constructor
 */
plex.PubSub = function() {
  this.subs = [];
};

/**
 * Adds a subscriber function.  Does not check to see if the function is a dup.
 * @param {Object} func
 */
plex.PubSub.prototype.subscribe = function(func) {
  this.subs.push(func);
};

/**
 * Deletes a subscriber function.  Only deletes the first match found.
 * @param {Object} func
 */
plex.PubSub.prototype.unsubscribe = function(func) {
  var index = plex.array.indexOf(this.subs, func);
  if (index < 0) {
    throw Error('Could not find function to unsubscribe.');
  }
  this.subs.splice(index, 1);
};

/**
 * Calls all the subscribers in the order in which they were added,
 * passing all arguments along.  Calls the functions in the global context.
 */
plex.PubSub.prototype.publish = function(/* whatever */) {
  for (var i = 0, n = this.subs.length; i < n; ++i) {
    this.subs[i].apply(null, arguments);
  }
};

/**
 * Clears the subscriber list.
 */
plex.PubSub.prototype.clear = function () {
  this.subs.length = 0;
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview  Rectangle math
 */

this.plex = this.plex || {};
plex.rect = {};

plex.rect.HORIZ = 1;
plex.rect.FAR = 2;

plex.rect.TOP = plex.rect.HORIZ;
plex.rect.RIGHT = plex.rect.FAR;
plex.rect.BOTTOM = plex.rect.FAR | plex.rect.HORIZ;
plex.rect.LEFT = 0;

plex.rect.getOppositeEdge = function(edge) {
  var r = plex.rect;
  switch (edge) {
    case r.TOP: return r.BOTTOM;
    case r.RIGHT: return r.LEFT;
    case r.BOTTOM: return r.TOP;
    case r.LEFT: return r.RIGHT;
  }
  throw Error('Unknown edge: ' + edge);
};

plex.rect.PARSE_VALUE_RE = /s*(-?\d+(.\d+)?)(\%|px)?\s*$/;


/**
 * Allows negative numbers, fractions, and leading and trailing whitespace.
 * Legal units are "%" and "px".  If no units are given, "px" are assumed.
 * @param {string|number} str
 * @return an array [number, units], or null
 */
plex.rect.parseMeasurement = function(str) {
  str = String(str);
  var m = str.match(plex.rect.PARSE_VALUE_RE);
  return m ? [parseFloat(m[1]), m[3] ? m[3] : 'px'] : null;
};


/**
 * Creates a rect using the coordinates specified.
 * 
 * @param {number} x0 left
 * @param {number} y0 top
 * @param {number} x1 right
 * @param {number} y1 bottom
 * @return {plex.Rect} the new rect
 */
plex.rect.createXyxy = function(x0, y0, x1, y1) {
  return new plex.Rect(new plex.Point(x0, y0), new plex.Point(x1, y1));
};


/**
 * Creates a rect using the top-left coords and the width and height.
 * @param {number} x left
 * @param {number} y top
 * @param {number} w width
 * @param {number} h height
 * @return {plex.Rect} the new rect
 */
plex.rect.createXywh = function(x, y, w, h) {
  return plex.rect.createXyxy(x, y, x + w, y + h);
};


/**
 * Creates a bounding rect from a list of boundingRects
 * @param {Array} objs  an array of 1 or more objects that implement
 * boundingRect()
 * @return {plex.Rect} a new rectangle bounding all the inputs.
 */
plex.rect.boundingRect = function(objs) {
  for (var i = 0; i < objs.length; ++i) {
    var r = objs[i].boundingRect();
    if (!i) {
      var left = r.getLeft();
      var top = r.getTop();
      var right = r.getRight();
      var bottom = r.getBottom();
    } else {
      left = Math.min(left, r.getLeft());
      top = Math.min(top, r.getTop());
      right = Math.max(right, r.getRight());
      bottom = Math.max(bottom, r.getBottom());
    }
  }
  return plex.rect.createXyxy(left, top, right, bottom);
};


/**
 * Creates new rectangle with new points p0 and p1 representing the top-left
 * and bottom-right corners.  Optional point param values are copied, not
 * set by reference.
 * @param {plex.Point} opt_p0
 * @param {plex.Point} opt_p1
 * @constructor
 */
plex.Rect = function(opt_p0, opt_p1) {
  this.p0 = new plex.Point();
  this.p1 = new plex.Point();
  if (opt_p0) this.p0.set(opt_p0);
  if (opt_p1) this.p1.set(opt_p1);
};


plex.Rect.prototype.set = function(rect) {
  this.p0.set(rect.p0);
  this.p1.set(rect.p1);
};

plex.Rect.prototype.setP0 = function(p) {
  this.p0.set(p);
};


plex.Rect.prototype.setP1 = function(p) {
  this.p1.set(p);
};


plex.Rect.prototype.setTop = function(top) {
  this.p0.setY(top);
};


plex.Rect.prototype.setRight = function(right) {
  this.p1.setX(right);
};


plex.Rect.prototype.setBottom = function(bottom) {
  this.p1.setY(bottom);
};


plex.Rect.prototype.setLeft = function(left) {
  this.p0.setX(left);
};


plex.Rect.prototype.setXyxy = function(x0, y0, x1, y1) {
  this.p0.setXy(x0, y0);
  this.p1.setXy(x1, y1);
};


/**
 * Compare rects for equality
 * @param {plex.Rect} that
 * @return {boolean}
 */
plex.Rect.prototype.equals = function(that) {
  return this.p0.equals(that.p0) && this.p1.equals(that.p1);
};


plex.Rect.prototype.toString = function() {
  return '{p0:' + this.p0.toString() + ', p1:' + this.p1.toString() + '}';
};


plex.Rect.prototype.boundingRect = function() {
  return this;
};


plex.Rect.prototype.getTop = function() {
  return this.p0.getY();
};


plex.Rect.prototype.getRight = function() {
  return this.p1.getX();
};


plex.Rect.prototype.getBottom = function() {
  return this.p1.getY();
};


plex.Rect.prototype.getLeft = function() {
  return this.p0.getX();
};


plex.Rect.prototype.getWidth = function() {
  return this.p1.getX() - this.p0.getX();
};


plex.Rect.prototype.getHeight = function() {
  return this.p1.getY() - this.p0.getY();
};


plex.Rect.prototype.getEdgePos = function(edge) {
  var r = plex.rect;
  switch (edge) {
    case r.TOP: return this.getTop();
    case r.RIGHT: return this.getRight();
    case r.BOTTOM: return this.getBottom();
    case r.LEFT: return this.getLeft();
    default: throw 'unknown fromEdge "' + edge + '"';
  }
};


/**
 * 
 * @param {number} edge one of the plex.rect.TOP|RIGHT|BOTOM|LEFT constants
 * @param {number|string|Array} dist can be either a measurement [val, units],
 *     or a string or number to parse.
 */
plex.Rect.prototype.getInsetPosition = function(edge, dist) {
  var r = plex.rect;
  var isHoriz = r.HORIZ & edge;
  var isFar = r.FAR & edge;
  var m = plex.type.isArray(dist) ? dist : 
      plex.rect.parseMeasurement(( /** @type {string} */ dist));
  var pos = this.getEdgePos(edge);
  switch(m[1]) {
    case '%':
      pos += 0.01 * m[0] * (isFar ? -1 : 1) *
             (isHoriz ? this.getHeight() : this.getWidth());
      break;
    case 'px':
      pos += (isFar ? -1 : 1) * m[0];
      break;
    default:
      throw 'unknown units "' + m[1] + '"';
  }
  return pos;
};


/**
 * Get the document-pixel position of a point that's a that is x% from the
 * left edge of the rect, and y% from the top. 
 * @param {number} xPercent
 * @param {number} yPercent
 * @param {plex.Point} opt_ptOut  optional point to set.
 * @return {plex.Point} either opt_ptOut or a new Point
 */
plex.Rect.prototype.getPercentPoint = function(xPercent, yPercent, opt_ptOut) {
  var p = opt_ptOut || new plex.Point();
  return p.setXy(this.getInsetPosition(plex.rect.LEFT, [xPercent, '%']),
                 this.getInsetPosition(plex.rect.TOP, [yPercent, '%']));
};


/**
 * Create an inset rectangle.  
 * @param {string} top
 * @param {string=} opt_right
 * @param {string=} opt_bottom
 * @param {string=} opt_left
 * @return {plex.Rect}
 */
plex.Rect.prototype.createInsetRect = function(
    top, opt_right, opt_bottom, opt_left) {
  var r = plex.rect;
  var right = (/** @type {string} */ opt_right || top);
  var bottom = (/** @type {string} */ opt_bottom || top);
  var left = (/** @type {string} */ opt_left || right);
  return plex.rect.createXyxy(
      this.getInsetPosition(r.LEFT, left),
      this.getInsetPosition(r.TOP, top),
      this.getInsetPosition(r.RIGHT, right),
      this.getInsetPosition(r.BOTTOM, bottom));
};


/**
 * Creates a rect by splitting this at a distance 'val' from 'edge',
 * and returning the rect near 'fromEdge', or the other half, depending on
 * 'nearHalf'.
 * @param {number} edge  one of plex.rect.(TOP|RIGHT|BOTTOM|LEFT)
 * @param {string} val  how far from the edge to make the split
 * @param {boolean} nearHalf  return the half near the edge, or the other half
 * @return {plex.Rect} a new Rect
 */
plex.Rect.prototype.createHalf = function(edge, val, nearHalf) {
  var mid = this.getInsetPosition(edge, val);
  var r = plex.rect;
  if (!nearHalf) edge = r.getOppositeEdge(edge);
  var left = edge == r.RIGHT ? mid : this.getLeft(); 
  var right = edge == r.LEFT ? mid : this.getRight();
  var top = edge == r.BOTTOM ? mid : this.getTop();
  var bottom = edge == r.TOP ? mid : this.getBottom();
  return plex.rect.createXyxy(left, top, right, bottom);
};


/**
 * @param {Object} columns
 * @param {Object} rows
 * @param {Object} column
 * @param {Object} row
 */
plex.Rect.prototype.createGridCell = function(columns, rows, column, row) {
  var cellWidth = this.getWidth() / columns;
  var cellLeft = this.getLeft() + cellWidth * column;

  var cellHeight = this.getHeight() / rows;
  var cellTop = this.getTop() + cellHeight * row;

  return plex.rect.createXywh(cellLeft, cellTop, cellWidth, cellHeight);
};


/**
 * @return {Array} rows, each containing an Array of plex.Rect objs.
 */
plex.Rect.prototype.createGrid = function(cols, rows) {
  var height = this.getHeight();
  var width = this.getWidth();
  var top = this.getTop();
  var left = this.getLeft();
  var i;

  var cellTops = [];
  var cellHeight = height / rows;
  for (i = 0; i <= rows; ++i) {
    cellTops[i] = top + cellHeight * i;
  }
  var cellLefts = [];
  var cellWidth = width / cols;
  for (i = 0; i <= cols; ++i) {
    cellLefts[i] = left + cellWidth * i;
  }

  var grid = [];
  for (i = 0; i < rows; ++i) {
    var row = [];
    for (var j = 0; j < cols; ++j) {
      var cell = plex.rect.createXyxy(cellTops[i], cellLefts[j],
                                      cellTops[i + 1], cellLefts[j + 1]);
      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
};

this.plex = this.plex || {};

/**
 * String compressor that uses a configurable, optional static word list and Lempel-Ziv to losslessly compress
 * a string, finally encoding it in URL-friendly base64. Decompressor also included.
 *
 * @param staticWords An array of up to about 100 strings that will be compressed down
 * to single bytes.
 *
 * @constructor
 */
plex.Squisher = function(staticWords) {
  this.staticWords = staticWords || [];
};

/**
 * Commands indicating how the rest of the data is encoded.
 * "bytes" always means a string where every character represents one byte.
 * @enum {string}
 */
plex.Squisher.Encoding = {
  /** The rest is base64 encoded. */
  BASE64_BYTES: 'a',

  /** The rest is bytes representing an LZ-encoded bitstream. */
  LZ_BITSTREAM: 'z',

  /** The rest is static dictionary encoded bytes. */
  DICTIONARY: 'd',

  /** The rest is the original (percent-encoded to ASCII). */
  ORIGINAL: 'o'
};

/**
 * @param {String} original
 * @return {String} the squished string in base 64
 */
plex.Squisher.prototype.squish = function(original) {
  var squished = plex.Squisher.Encoding.ORIGINAL + this.encodeToAscii(original);

  var newSquished = plex.Squisher.Encoding.DICTIONARY + this.compressWithStaticDictionary(squished);
  if (newSquished.length < squished.length) {
    squished = newSquished;
  }

  var lz = new plex.LempelZiv(this.getAlphabet());
  newSquished = plex.Squisher.Encoding.LZ_BITSTREAM + lz.encodeToBytes(squished);
  if (newSquished.length < squished.length) {
    squished = newSquished;
  }

  squished = plex.Squisher.Encoding.BASE64_BYTES + btoa(squished);
  return squished;
};

plex.Squisher.prototype.unsquish = function(str) {
  var command = str.charAt(0);
  str = str.substr(1);
  var next;
  if (command == plex.Squisher.Encoding.BASE64_BYTES) {
    next = atob(str);
  } else if (command == plex.Squisher.Encoding.LZ_BITSTREAM) {
    var lz = new plex.LempelZiv(this.getAlphabet());
    next = lz.decodeFromBytes(str);
  } else if (command == plex.Squisher.Encoding.DICTIONARY) {
    next = this.decompressWithStaticDictionary(str);
  } else if (command == plex.Squisher.Encoding.ORIGINAL) {
    str = decodeURI(str);
    // Done!
    return str;
  } else {
    throw Error('unknown command ' + command + ' for str ' + str);
  }
  // The recursion is nice because we'll get debuggable stackframes if there's a problem.
  return this.unsquish(next);
};

plex.Squisher.prototype.compressWithStaticDictionary = function(str) {
  var dict = this.getDictionary();
  for (var i = 0; i < dict.length; i++) {
    var entry = dict[i];
    var byteChar = entry[0];
    var word = entry[1];
    str = plex.string.replace(str, word, byteChar);
  }
  return str;
};

plex.Squisher.prototype.decompressWithStaticDictionary = function(str) {
  var dict = this.getDictionary();
  for (var i = 0; i < dict.length; i++) {
    var entry = dict[i];
    var byteChar = entry[0];
    var word = entry[1];
    str = plex.string.replace(str, byteChar, word);
  }
  return str;
};

plex.Squisher.prototype.getAlphabet = function() {
  if (!this.alphabet) {
    this.initAlphabetAndDictionary()
  }
  return this.alphabet;
};

plex.Squisher.prototype.getDictionary = function() {
  if (!this.dictionary) {
    this.initAlphabetAndDictionary();
  }
  return this.dictionary;
};


/** all the non-control lower-ASCII chars, for starters */
plex.Squisher.BASE_ALPHABET = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

plex.Squisher.prototype.encodeToAscii = function(str) {
  var out = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charAt(i);
    var charCode = str.charCodeAt(i);
    if (c == '%' || charCode < 32 || charCode > 126) {
      out[i] = plex.url.percentEscapeCharacter(c);
    } else {
      out[i] = c;
    }
  }
  return out.join('');
};

/**
 * All dictionary words get URI encoded, because the whole string gets URI encoded as step 1.
 */
plex.Squisher.prototype.initAlphabetAndDictionary = function() {
  var builder = [];
  for (var i = 32; i <= 126; i++) {
    builder.push(String.fromCharCode(i));
  }
  this.alphabet = plex.Squisher.BASE_ALPHABET;

  this.dictionary = [];
  var nextNum = 255;
  for (var i = 0; i < this.staticWords.length; i++) {
    // Find an unused byte.
    var byteChar = String.fromCharCode(nextNum);
    while (nextNum > 1 && this.alphabet.indexOf(byteChar) != -1) {
      byteChar = String.fromCharCode(nextNum);
      nextNum--;
    }
    if (nextNum <= 1) {
      // no more unused bytes
      return;
    }
    var word = this.staticWords[i];
    this.dictionary.push([byteChar, this.encodeToAscii(word)]);
    this.alphabet += byteChar;
    nextNum--;
  }
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview
 */
this.plex = this.plex || {};

plex.string = {};

plex.string.REGEXP_ESCAPE_RE_ = /([\{\}\|\^\$\[\]\(\)\.\?\*\+\\\,\:\!])/g;

plex.string.AMP_RE_ = /&/g;
plex.string.LT_RE_ = /</g;
plex.string.SQUOT_RE_ = /'/g;
plex.string.DQUOT_RE_ = /"/g;
plex.string.EOLN_RE_ = /\n/g;
plex.string.TWOSPACE_RE_ = /  /g;


/**
 * Backslash-escapes regexp symbols.  Useful for creating regexps that match
 * literal strings.
 * @param {String} text
 * @return {String} a string for passing to the RegExp constructor
 */
plex.string.textToRegExpStr = function(text) {
  return String(text).replace(plex.string.REGEXP_ESCAPE_RE_, '\\$1');
};


/**
 * Converts text to HTML, including double-quotes, but not single-quotes.
 * @param {String} text
 * @param {Boolean=} opt_preserveSpaces  if true, nbsp's will replace every
 *     other space in a run of spaces, and br's will replace eolns.
 */
plex.string.textToHtml = function(text, opt_preserveSpaces) {
  var html = String(text).
    replace(plex.string.AMP_RE_, '&amp;').
    replace(plex.string.LT_RE_, '&lt;').
    replace(plex.string.DQUOT_RE_, '&quot;');
  if (opt_preserveSpaces) {
    html = html.
      replace(plex.string.EOLN_RE_, '<br>').
      replace(plex.string.TWOSPACE_RE_, '&nbsp; ');
  }
  return html;
};


/**
 * Converts text to a string that can go between single-quotes in a JS string
 * literal.
 * @param {String} text
 * @return {String} the JS literal, with single-quotes escaped.
 */
plex.string.textToSingleQuoteJsLiteral = function(text) {
  return String(text).
    replace(plex.string.SQUOT_RE_, '\\\'').
    replace(plex.string.EOLN_RE_, '\\n');
};

plex.string.replace = function(text, oldStr, newStr) {
  var re = new RegExp(plex.string.textToRegExpStr(oldStr), 'g');
  // Ha-ha! Read about "$" here:
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/replace
  var sub = newStr.replace(/\$/g, "$$$$"); // Replaces one dollar-sign with two.
  return text.replace(re, sub);
};

plex.string.padLeft = function(strToPad, paddingChar, padToLength) {
  if (paddingChar.length != 1) {
    throw Error('Expected exactly one character, but got "' + paddingChar + '".');
  }
  var padSize = padToLength - strToPad.length;
  if (padSize <= 0) {
    return strToPad;
  } else {
    return plex.string.repeat(paddingChar, padSize) + strToPad;
  }
};

plex.string.repeat = function(str, count) {
  var out = [];
  for (var i = 0; i < count; i++) {
    out.push(str);
  }
  return out.join('');
};
// Copyright 2012 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview Set of strings.
 */

this.plex = this.plex || {};

/**
 * @constructor
 */
plex.StringSet = function() {
  this.m = {};
};

plex.StringSet.PREFIX = '=';

plex.StringSet.prototype.put = function(v) {
  this.m[plex.StringSet.PREFIX + v] = true;
  return this;
};

plex.StringSet.prototype.putArray = function(a) {
  for (var i = 0; i < a.length; i++) {
    this.m[plex.StringSet.PREFIX + a[i]] = true;
  }
  return this;
};

plex.StringSet.prototype.contains = function(v) {
  return !!this.m[plex.StringSet.PREFIX + v];
};

plex.StringSet.prototype.remove = function(v) {
  delete this.m[plex.StringSet.PREFIX + v];
  return this;
};

plex.StringSet.prototype.add = function(that) {
  for (var key in that.m) {
    this.m[key] = true;
  }
  return this;
};

plex.StringSet.prototype.subtract = function(that) {
  for (var key in that.m) {
    delete this.m[key];
  }
  return this;
};

/**
 * @return {Array}
 */
plex.StringSet.prototype.getValues = function() {
  var vals = [];
  for (var key in this.m) {
    vals.push(key.substr(1));
  }
  return vals;
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview  Utilities for setting and getting HTML textarea selections.
 * Tested on Fx 1.5, IE 6, Safari 2.0.4.
 */
plex.textarea = {};

/**
 * Figures out the start and end of a text area's selected text,
 * or cursor position.
 * @param {Object} ta  the textarea whose selection you want.
 * @return {Object} of the form {start:2, end:4}  If start and end are the
 * same, then you've got a cursor position.  Null means we don't know how to
 * compute the selection for this browser.
 */
plex.textarea.getSelection = function(ta) {
  var count = 0;
  var sel = null;
  if (ta.setSelectionRange) {
    // Fx and Safari make it easy!
    sel = {start: ta.selectionStart, end: ta.selectionEnd};
  } else if (ta.createTextRange) {
    // IE makes it hard.  And all that "StartToStart" stuff is broken for me.
    // Do a binary search for the distance from the beginning of the selection
    // to the beginning of the text area. That distance is the selection 
    // start.  That plus the selection string length is the end.
    var docSel = document.selection.createRange();
    var len = docSel.text.length;
    var step = -(ta.value.length - len)/2;
    var dist = -1;
    while (1) {
      ++count;
      var dup = docSel.duplicate();
      dist += step;
      dup.moveStart('character', dist);
      var inTa = dup.parentElement() == ta;
      if (step < 0.5 && step > -0.5) break; // within rounding distance
      if (count > 100) break; // at 2 million chars, count is 37.
      if ((!inTa && step < 0) || (inTa && step > 0)) {
        // We just stepped past the correct distance,
        // so cut search step in half and reverse direction.
        step = -step / 2;
      }
    }
    var start = -Math.round(dist) - 1;
    // Now, since IE counts a char-move over a 2-char EOLN as one char,
    // we have to go through and add those \r's back in.  \Arrr!
    for (var i = 0; i < start; ++i) {
      if (ta.value.charAt(i) == '\r') {
        ++start;
      }
    }
    var end = start + len;
    sel = {start:start, end:end};
  }
  return sel;
};
  
  
/**
 * Sets the textarea's selection.  Set start and end to be the same to
 * set the cursor position.
 * @param {Object} ta the textarea
 * @param {Number} start the new selection starting position
 * @param {Number} end the new selection ending position
 */
plex.textarea.setSelection = function(ta, start, end) {
  if (ta.setSelectionRange) {
    ta.setSelectionRange(start, end);
    ta.focus();
  } else if (ta.createTextRange()) {
    var sel = ta.createTextRange();
    sel.collapse();
    sel.moveEnd('character', start);
    // My IE overshoots.  Adjust to get to the right target.
    // Maybe it'll undershoot some day, so allow that too.
    var tlen = ta.value.substring(0, start)/*.replace(/\r\n/, '\n')*/.length;
    var tries = 100;
    while (sel.text.length < tlen) {
      log('right');
      sel.moveEnd('character', 1);
      if (! --tries) break;
    }
    while (sel.text.length > tlen) {
      log('left');
      sel.moveEnd('character', -1);
      if (! --tries) break;
    }
    sel.collapse(false); // move start from 0 to end
    sel.select();
  }
};


/**
 * Determines which lines are covered by the selection.
 * @param {Object} ta  textarea
 * @return {Object} object of the form {start:{Number}, end:{Number}}
 */
plex.textarea.getSelectedLines = function(ta) {
  var sel = plex.textarea.getSelection(ta);
  var textBefore = ta.value.substring(0, sel.start);
  var start = (textBefore.match(/\n/g) || []).length;
  var selectedText = ta.value.substring(sel.start, sel.end);
  var end = (selectedText.match(/\n/g) || []).length + start;
  return {start:start, end:end};
};


/**
 * Determines the starting character position, in the textarea's 'value' string,
 * of a certain line.
 * @param {Object} ta  textarea
 * @param {Number} line  the zero-indexed line number to find
 * @return {Number}  The position of the start of the line.
 */
plex.textarea.getLineStart = function(ta, line) {
  var pos = 0;
  for (var i = 0; i < line; ++i) {
    // try larger IE eoln first.
    var nextEoln = ta.value.indexOf('\r\n', pos);
    if (nextEoln != -1) {
      pos = nextEoln + 2;
    } else {
      nextEoln = ta.value.indexOf('\n', pos);
      if (nextEoln != -1) {
        pos = nextEoln + 1;
      } else {
        return -1;
      }
    }
  }
  return pos;
};


/**
 * Determines the starting and ending character position, in the textarea's
 * 'value' string, of a certain line.
 * @param {Object} ta  textarea
 * @param {Number} line  the zero-indexed line number to find
 * @return {Object} object of the form {start:{Number}, end:{Number}}
 */
plex.textarea.getLineStartAndEnd = function(ta, line) {
  var start = plex.textarea.getLineStart(ta, line);
  var end = -1;
  if (start != -1) {
    var nextEoln = ta.value.indexOf('\r\n', start);
    if (nextEoln != -1) {
      end = nextEoln + 2;
    } else {
      nextEoln = ta.value.indexOf('\n', start);
      if (nextEoln != -1) {
        end = nextEoln + 1;
      } else {
        // no more eolns; select to end of value
        end = ta.value.length;
      }
    }
  }
  return {start:start, end:end}; 
};

/**
 * Replaces the current selection with the supplied text, and moves the cursor
 * to be after the injected text.
 * @param {Object} ta the textarea
 * @param {String} text
 */
plex.textarea.replaceSelection = function(ta, text) {
  plex.textarea.replacePrefix(ta, '', text);
};

/**
 * Replaces the current selection and the prefix before it with the supplied
 * text, and moves the cursor to be after the injected text.
 * @param {Object} ta the textarea
 * @param {String} prefix
 * @param {String} text
 */
plex.textarea.replacePrefix = function(ta, prefix, text) {
  var sel = plex.textarea.getSelection(ta);
  log('getSel = ' + plex.object.expose(sel));
  if (!sel) return;
  var val = ta.value;
  var preLen = prefix.length;
  if (sel.start >= preLen && sel.end <= val.length) {
    var scrollTop = ta.scrollTop;
    ta.value =
        val.substring(0, sel.start - preLen) +
        text +
        val.substring(sel.end, val.length);
    var newPos = sel.start - preLen + text.length;
    log('setSel to ' + newPos);
    plex.textarea.setSelection(ta, newPos, newPos);
    ta.scrollTop = scrollTop;
  }
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview
 */
plex.time = {};

plex.time.now = function() {
  return (new Date()).getTime();
};


// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Code for figuring out the type of an object.
 */

this.plex = this.plex || {};
plex.type = {};

/**
 * Figures out the most specific type of an object.
 * Possible values, from most specific to least specific:
 * null, undefined, number, boolean, string, function, array, object
 * @param a
 * @return {string} a lowercase type string
 */
plex.type.getType = function(a) {
  if (a === null) return 'null';
  var t = typeof a;
  switch (t) {
    case 'boolean':
    case 'function':
    case 'number':
    case 'string':
    case 'undefined':
      return t;
    case 'object':
      try {
        if (a.constructor == Array) return 'array';
      } catch(e) {
        // ignore - some object don't allow property access
      }
      return 'object';
  }
};


/**
 * @param a
 * @return {boolean} true iff 'a' is an object, array, or function
 */
plex.type.isObject = function(a) {
  var t = plex.type.getType(a);
  return t == 'object' || t == 'array' || t == 'function';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isArray = function(a) {
  return plex.type.getType(a) == 'array';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isBoolean = function(a) {
  return typeof a == 'boolean';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isFunction = function(a) {
  return typeof a == 'function';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isNumber = function(a) {
  return typeof a == 'number';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isString = function(a) {
  return typeof a == 'string';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isUndefined = function(a) {
  return typeof a == 'undefined';
};

// Copyright 2009 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

plex.url = {};

/**
 * Replaces the hash fragment with the string.  Does not encode.  Falsy values
 * are converted to empty-string.
 */
plex.url.setFragment = function(val) {
  // Just setting the location.hash to the val fails to encode newlines in
  // Safari, so we replace the whole URL.
  // Also, setting the hash to empty-string removes the '#', causing a reload,
  // so always add the #.
  var href = location.href;
  var hashIndex = href.indexOf("#");
  var nonHash = hashIndex < 0 ? href : href.substr(0, hashIndex);
  location.replace(nonHash + "#" + val);
};

/**
 * Gets the encoded URL fragment, not including the leading "#".  Does not
 * decode.  If there's no fragment, returns emptystring.
 */
plex.url.getFragment = function() {
  var hashIndex = window.location.href.indexOf("#");
  if (hashIndex == -1) return '';
  return window.location.href.substr(hashIndex + 1);
};

plex.url.encodeQuery = function(map) {
  var q = [];
  for (var key in map) {
    q.push(encodeURIComponent(key) + '=' +
        encodeURIComponent(map[key]));
  }
  return q.join('&');
};

plex.url.decodeQuery = function(queryString) {
  var map = {};
  var params = queryString.split('&');
  for (var i = 0; i < params.length; i++) {
    var param = params[i];
    var eqPos = param.indexOf('=');
    if (eqPos > 0) {
      var key = param.substring(0, eqPos);
      var val = param.substring(eqPos + 1);
    } else {
      key = param;
      val = '';
    }
    map[decodeURIComponent(key)] = decodeURIComponent(val);
  }
  return map;
};

plex.url.getQuery = function() {
  var s = window.location.search;
  if (!s) return '';
  return s.substr(1)
};

plex.url.URI_CHARS =             "!#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]_abcdefghijklmnopqrstuvwxyz~";
plex.url.LEGAL_HASH_CHARS =      "!$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~";
plex.url.URI_COMPONENT_CHARS =   "!'()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~";
// Firefox incorrectly percent-escapes single-quotes when you do window.location.href.
plex.url.TOTES_SAFE_HASH_CHARS = "!()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~";

/**
 * Splits a percent-encoded UTF-8-encoded URL into strings representing
 * individual Unicode code points.
 * This method does not check to make sure that the input was properly
 * encoded in the first place, but it will throw exceptions if it cannot
 * decode the bits of a percent-encoded codepoint.
 * See http://en.wikipedia.org/wiki/UTF-8#Description.
 * @param url The encoded URL to tokenize
 * @return {Array} Array of strings where each element represents
 * one percent-encoded UTF-8 character.
 * So "a%20b" would become ["a", "%20", "b"],
 * and "c d" would still be["c", " ", "d"], because this function does not
 * make sure all chars that should have been encoded were actually encoded.
 */
plex.url.tokenizeEncodedUrl = function(url) {
  var tokens = [];
  for (var i = 0; i < url.length;) {
    var c = url.charAt(i);
    if (c != "%") {
      tokens.push(c);
      i++;
      continue;
    }
    var bits = parseInt(url.substr(i + 1, 2), 16);
    var len;
    if ((0x80 & bits) == 0) {
      // 0xxxxxxx, so the byte represents a char in the 0-127 range.
      len = 3;
    } else if ((0xE0 & bits) == 0xC0) {
      // 110xxxxx
      len = 6;
    } else if ((0xF0 & bits) == 0xE0) {
      // 1110xxxx
      len = 9;
    } else if ((0xF8 & bits) == 0xF0) {
      // 11110xxx
      len = 12;
    } else if ((0xFC & bits) == 0xF8) {
      // 111110xx
      len = 15;
    } else if ((0xFE & bits) == 0xFC) {
      // 1111110x
      len = 18;
    } else {
      throw Error("error decoding bits " + Number(bits).toString(2));
    }
    tokens.push(url.substr(i, len));
    i += len;
  }
  // check our work...
  if (url != tokens.join('')) {
    throw Error('original URL\n' + url +
        '\n!= joined tokens\n' + tokens.join(''));
  }
  return tokens;
};

/**
 * @param {String} c  A single character to encode.
 * @return {String} A percent-encoded string of the unicode codepoint number of the char,
 * even if it's in the ASCII range, 0-127.
 */
plex.url.percentEscapeCharacter = function(c) {
  if (c.length != 1) {
    throw Error('Expected exactly one character, but got "' + c + '".');
  }
  var num = c.charCodeAt(0);
  if (num < 128) {
    var hex = Number(num).toString(16).toUpperCase();
    return '%' + plex.string.padLeft(hex, '0', 2);
  } else {
    // Anything above 127 will be escaped by encodeURI.
    var encoded = encodeURIComponent(c);
    if (encoded.charAt(0) != '%') {
      throw Error('expected char "' + c +
          '" to get percent-escaped by encodeURI, but it turned into "' + encoded + '"');
    }
    return encoded;
  }
};

plex.url.percentEncodeUnwhitelistedChars = function(str, whitelist) {
  var tokens = str.split('');
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (whitelist.indexOf(token) == -1) {
      tokens[i] = plex.url.percentEscapeCharacter(token);
    }
  }
  return tokens.join('');
};

this.plex = this.plex || {};

/**
 * Only used for unsquishing legacy UrlSqisher-squished URLs.
 * Deprecated in favor of the vastly superior plex.Squisher.
 * @constructor
 */
plex.UrlSquisher = function() {
  this.legalChars = plex.url.TOTES_SAFE_HASH_CHARS;
};

plex.UrlSquisher.prototype.unsquish = function(squishedText) {
  var text = squishedText;
  // The loop condition prevents an infinite loop for bad input.
  var count = 0;
  while (count < 1000) {
    count++;
    var c = text.charAt(0);
    if (c == "~") {
      // The rest is the body.
      text = text.substr(1);
      break;
    }
    text = this.unsquishStep(text);
  }
  return text;
};

plex.UrlSquisher.prototype.unsquishStep = function(text) {
  var c = text.charAt(0);
  var lens = this.decodeLenChar(c);
  var subLen = lens.subLen;
  var origLen = lens.origLen;
  var sub = text.substr(1, subLen);
  var original = text.substr(1 + subLen, origLen);

  text = text.substr(1 + subLen + origLen);
  text = plex.string.replace(text, sub, original);
  return text;
};

plex.UrlSquisher.prototype.checkSubLens = function(subLen, origLen) {
  if (Math.floor(subLen) != subLen || subLen < 1 || subLen > 4) {
    throw Error("Illegal subLen " + subLen);
  }
  if (Math.floor(origLen) != origLen || origLen < 1 || origLen > 16) {
    throw Error("Illegal origLen " + origLen);
  }
};

plex.UrlSquisher.prototype.decodeLenChar = function(c) {
  var bits = this.legalChars.indexOf(c);
  if (bits < 0) throw Error("Invalid bits char '" + c + "'");
  var subLen = (bits & 3) + 1;
  var origLen = Math.floor(bits / 4) + 1;
  this.checkSubLens(subLen, origLen);
  return {subLen: subLen, origLen: origLen};
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};
plex.window = {};
  
/**
 * Figures out the window's inner height and width.
 * @param {Window} opt_win  Option window.  If not provided, uses global
 *   context.
 * @return {Object} an obj like {width:321, height:123}, or null if the
 *   situation is hopeless.
 */
plex.window.getSize = function(opt_win) {
  var win = opt_win || window;
  var size = null;
  if (win.innerHeight) {
    // non-IE
    size = {width: win.innerWidth,
            height: win.innerHeight};
  } else {
    // IE messing with our heads
    var de = win.document.documentElement;
    if (de && de.clientHeight) {
      // IE 6 strict, yay!
      size = {width: de.clientWidth,
              height: de.clientHeight};
    } else {
      size = {width: document.body.clientWidth,
              height: document.body.clientHeight};
    }
  }
  return size;
};

plex.window.getRect = function(opt_win) {
  var size = plex.window.getSize(opt_win);
  return plex.rect.createXywh(0, 0, size.width, size.height);
};

// Copyright 2010 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Log class.
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.debug = {};

/**
 * Logger limited by length and by time.
 * Contantly allocates and deletes.
 * @constructor
 */
plex.debug.Log = function(maxLines, maxTimespan) {
  this.maxLines = maxLines;
  this.maxTimespan = maxTimespan;
  this.lines = {};
  this.lowId = 1;
  this.highTime = 0;
  this.nextId = 1;
};

plex.debug.Log.prototype.addLine = function(line) {
  this.lines[this.nextId++] = line;
  if (line.time > this.highTime) {
    this.highTime = line.time;
  }
  this.prune();
};

plex.debug.Log.prototype.prune = function() {
  if (this.maxLines) {
    // prune by length
    var len = this.nextId - this.lowId;
    if (!len) return;
    while (len > this.maxLines) {
      delete this.lines[this.lowId++];
      len--;
    }
  }
  if (this.maxTimespan) {
    // prune by time
    var minTime = this.highTime - this.maxTimespan;
    while (this.lines[this.lowId].time < minTime) {
      delete this.lines[this.lowId++];
    }
  }
};


// Copyright 2010 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Circular log data
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.debug = plex.debug || {};

/**
 * @constructor
 */
plex.debug.LogLine = function(id, time, tags, data) {
  this.id = id;
  this.time = time;
  this.tags = tags;
  this.data = data;
};

// Copyright 2007 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};
plex.fx = plex.fx || {};

/**
 * @fileoverview  Some kinda cute animated corners.
 * @author Aaron Whyte
 */

/**
 * Creates the 4 corner divs, but hides them by default.
 * @constructor
 */
plex.fx.Corners = function() {
  this.targetRect = new plex.Rect();
  this.pos0 = new plex.Point();
  this.pos1 = new plex.Point();
  this.vel0 = new plex.Point();
  this.vel1 = new plex.Point();
  // temps
  this.v1 = new plex.Point();
  this.v2 = new plex.Point();
 
  //plex.event.addEventListener(document, 'mouseover', this.mouseoverListener);
  //setTimeout(this.animate, this.animationDelay);
  this.corners = [];
  var edges = [[1, 0, 0, 1], [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1]];
  var borderNames = ['Top', 'Right', 'Bottom', 'Left'];
  for (var i = 0; i < 4; ++i) {
    var c = this.ce('div', document.body);
    this.corners[i] = c;
    var s = c.style;
    s.display = 'none'; // hide initially
    s.position = 'absolute';
    for (var j = 0; j < 4; ++j) {
      // set the corner border widths
      s['border' + borderNames[j] + 'Width'] = (4 * edges[i][j]) + 'px';
    }
    // arrange the corners is a square
    s.top = edges[i][0] ? '0px' : '10px';
    s.left = edges[i][3] ? '0px' : '10px';
    s.borderStyle = 'solid';
    s.borderColor = 'red';
    // Make a div inside, to give the border div something to wrap.
    // Shapes the corners correctly w/o browser detection.
    var ic = plex.dom.ce('div', c);
    var is = ic.style;
    is.width = is.height = '4px';
    is.overflow = 'hidden';
  }
};


/**
 * Sets the target element
 * @param {Object} elem
 */
plex.fx.Corners.prototype.setTarget = function(elem) {
  this.target = elem;
};


/**
 * Manually overrides the position.
 * @param {plex.Point} pos0  pos of top-left corner
 * @param {plex.Point} opt_pos1  pos of bottom-right corner.  If this isn't
 *     specified, then pos0 will be used.
 */
plex.fx.Corners.prototype.setPos = function(pos0, opt_pos1) {
  this.pos0.set(pos0);
  this.pos1.set(opt_pos1 || pos0);
};


/**
 * Manually overides the velocity.
 * @param {plex.Point} vel0  vel of top-left corner
 * @param {plex.Point} opt_vel1  vel of bottom-right corner.  If this isn't
 *     specified, then vel0 will be used.
 */
plex.fx.Corners.prototype.setVel = function(vel0, opt_vel1) {
  this.vel0.set(vel0);
  this.vel1.set(opt_vel1 || vel0);
};


/**
 * Accelerates the corners towards the target element.
 */
plex.fx.Corners.prototype.clock = function() {
  if (this.target) {
    plex.dom.getBounds(this.target, this.targetRect);
    this.approach(this.pos0, this.targetRect.p0, this.vel0);
    this.approach(this.pos1, this.targetRect.p1, this.vel1);
    // move corner elements to new positions
    this.positionCorner(this.corners[0], this.pos0.x, this.pos0.y);
    this.positionCorner(this.corners[1], this.pos1.x, this.pos0.y);
    this.positionCorner(this.corners[2], this.pos1.x, this.pos1.y);
    this.positionCorner(this.corners[3], this.pos0.x, this.pos1.y);
  }
};


/**
 * Shows or hides the four corner divs.
 * @param {Boolean} b  true to display, false to hide
 */
plex.fx.Corners.prototype.show = function(b) {
  for (var i = 0; i < 4; ++i) {
    this.corners[i].style.display = b ? '' : 'none';
  }
};


////////////////////
// private methods
////////////////////

/**
 * Adjusts the velocity and position of a point.
 * @param {Object} pos
 * @param {Object} dest
 * @param {Object} vel
 * @private
 */
plex.fx.Corners.prototype.approach = function(pos, dest, vel) {
  var accel = this.v1;
  accel.set(dest).subtract(pos).scale(0.3);
  vel.add(accel).scale(0.5);
  pos.add(vel);
};


/**
 * Sets the postion of a corner div.
 * @param {Object} corner  the corner div element
 * @param {Number} x
 * @param {Number} y
 * @private
 */
plex.fx.Corners.prototype.positionCorner = function(corner, x, y) {
  corner.style.left = (x - 4) + 'px';
  corner.style.top = (y - 4) + 'px';
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Parses JavaScript, at least enough to do autocomplete in eval.
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.js = plex.js || {};

plex.js.parser = {};


/**
 * @enum {Number} parser states
 * @private
 */
plex.js.parser.STATE = {
  ID: 1,
  SQSTR: 2, // single-quote string
  SQESC: 3, // escaped single-quote string character
  DQSTR: 4,
  DQESC: 5,
  SLASH: 6, // may start one of 2 comment styles
  SLASHCMT: 7,
  STARCMT: 8,
  CLOSESTAR: 9, // the star before the closing slash
  NUM: 10,
  LSQUAREB: 11, // left square-bracket
  RSQUAREB: 12,
  DOT: 13,
  WHITE: 14, // white-space
  OTHER: 15 // any character that we don't recognize
};

plex.js.parser.ID_REGEXP_ = /^[a-z_\$][a-z0-9_\$]+$/i;
plex.js.parser.ID_START_REGEXP_ = /[a-z_\$]/i;
plex.js.parser.ID_CONTINUE_REGEXP_ = /[a-z0-9_\$]/i;

plex.js.parser.isId = function(str) {
  return plex.js.parser.ID_REGEXP_.test(str);
};


/**
 * Creates tokens to cover the entire string.
 * All tokens are truncated by end-of-lines, except for slash-star comments,
 * and whitespace.
 * Even unterminated string constants are truncated.  Never produces parse
 * errors.
 * @param {String} str  the text to tokenize
 * @return {Array.<plex.js.Token>} list of tokens
 */
plex.js.parser.tokenize = function(str) {
  /**
   * Creates a token from 'start' to 'pos', using the current state,
   * and sets 'start' to 'pos'.
   * (Does nothing if pos is past the end of the string, or if start >= pos.)
   */
  function end() {
    if (pos > start && pos <= len) {
      var type = plex.js.parser.getToken(state);
      var newToken = new plex.js.Token(type, start, pos);
      tokens.push(newToken);
      start = pos;
    }
  }
  
  /**
   * Moves 'pos' forward one char.
   * @return {Boolean} true if 'pos' is in the string, or false if we've
   *     run out of characters.
   */
  function advance() {
    ++pos;
    if (pos < len) {
      c = str.charAt(pos);
      eoln = c == '\n' || c == '\r';
      return true;
    } else {
      return false;
    }
  }
  
  var S = plex.js.parser.STATE;
  var T = plex.js.token.TYPE;
  var len = str.length;
  var tokens = [];

  var start = 0;
  var pos = -1;
  var state = S.OTHER;
  var c, eoln;
  
  while (advance()) {
    var newState = 0;
    switch (state) {
      case S.ID:
        if (!plex.js.parser.ID_CONTINUE_REGEXP_.test(c)) {
          end();
        } else {
          newState = state;
        } 
        break;
      case S.SQSTR:
        if (c == '\'') {
          advance();
          end();
        } else if (eoln) {
          end();
        } else if (c == '\\') {
          newState = S.SQESC;
        } else {
          newState = state;
        }
        break;
      case S.SQESC:
        if (eoln) {
          end();
        } else {
          newState = S.SQSTR;
        }
        break;
      case S.DQSTR:
        if (c == '"') {
          advance();
          end();
        } else if (eoln) {
          end();
        } else if (c == '\\') {
          newState = S.DQESC;
        } else {
          newState = state;
        }
        break;
      case S.DQESC:
        if (eoln) {
          end();
        } else {
          newState = S.DQSTR;
        }
        break;
      case S.SLASH:
        if (c == '/') {
          newState = S.SLASHCMT;
        } else if (c == '*') {
          newState = S.STARCMT;
        }
        break;
      case S.SLASHCMT:
        if (eoln) {
          end();
        } else {
          newState = state;
        }
        break;
      case S.STARCMT:
        if (c == '*') {
          newState = S.CLOSESTAR;
        } else {
          newState = state;
        }
        break;
      case S.CLOSESTAR:
        if (c == '/') {
          advance();
          end();
        } else {
          newState = S.STARCMT;
        }
        break;
      case S.NUM:
        if (!/\d/.test(c)) {
          end();
        } else {
          newState = state;
        }
        break;
      case S.WHITE:
        if (!/\s/.test(c)) {
          end();
        } else {
          newState = state;
        }
        break;
      case S.LSQUAREB:
      case S.RSQUAREB:
      case S.DOT:
        end();
        break;
    }
    
    if (!newState) {
      // start a new state using only the current char
      switch (c) {
        case '\'':
          newState = S.SQSTR;
          break;
        case '"':
          newState = S.DQSTR;
          break;
        case '[':
          newState = S.LSQUAREB;
          break;
        case ']':
          newState = S.RSQUAREB;
          break;
        case '.':
          newState = S.DOT;
          break;
        case '/':
          newState = S.SLASH;
          break;
        default:
          // more complex pattern comparisons
          if (/\s/.test(c)) {
            newState = S.WHITE;
          } else if (plex.js.parser.ID_START_REGEXP_.test(c)) {
            newState = S.ID;
          } else if (/\d/.test(c)) {
            newState = S.NUM;
          } else {
            newState = S.OTHER;
          }
      }
      if (newState != S.OTHER) {
        end();
      }
    }
    state = newState;
  } // end while
  
  // out of chars - truncate current state
  end();
  return tokens;
};


/**
 * Gets the token type associated with a state.
 * @param {plex.js.parser.STATE} state
 * @return {plex.js.token.TYPE}
 * @private
 */
plex.js.parser.getToken = function(state) {
  var S = plex.js.parser.STATE;
  var T = plex.js.token.TYPE;
  switch (state) {
    case S.ID: return T.ID;
    case S.SQSTR:
    case S.SQESC: return T.SQSTR;
    case S.DQSTR:
    case S.DQESC: return T.DQSTR;
    case S.SLASH: return T.OTHER;
    case S.SLASHCMT:
    case S.STARCMT:
    case S.CLOSESTAR: return T.CMT;
    case S.NUM: return T.NUM;
    case S.LSQUAREB: return T.LSQUAREB;
    case S.RSQUAREB: return T.RSQUAREB;
    case S.DOT: return T.DOT;
    case S.WHITE: return T.WHITE;
    case S.OTHER: return T.OTHER;
    default: throw Error('unhandled state ' + state);
  }
};

// Copyright 2007 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Misc js property utilities
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.js = plex.js || {};

plex.js.props = {};

/**
 * Matches a chain of properties in the root object.  The last property
 * in the chain will be prefix-matched, and '' will match everything.
 * @param {Object} root  the object to start from.  Must not be null.
 * @param {Array} propChain  chain of property names from root
 * @param {Number} opt_maxResults  optional.  Must be one or more.
 * @return {Object} the matching property names, mapped to the objects,
 *     or an empty object if there are none, or if the property chain is broken.
 */
plex.js.props.getMatches = function(root, propChain, opt_maxResults) {
  // Example: Suppose we're looking for propChain ['foo', 'bar', 'm'].
  var node = root;
  for (var i = 0; i < propChain.length - 1; ++i) {
    var prop = propChain[i];
    node = node[prop];
    if (!node) {
      // The chain is broken.  root.foo or root.foo.bar don't exist.
      return {};
    }
  }
  var matches = {};
  var count = 0;
  var prefix = propChain[propChain.length - 1];
  for (var name in node) {
    if (!prefix || name.indexOf(prefix) == 0) {
      try {
        matches[name] = node[name];
        if (++count >= opt_maxResults) break;
      } catch (e) {
        // ignore - netscape access problem wih window.document.???
      }
    }
  }
  return matches;
};


/**
 * Formats a chain of property dereferences, as JS code.
 * <p>
 * <code>plex.js.props.formatchain('window', ['document', 'body'])</code>
 * will return <tt>"document.body"</tt>
 * <p>
 * <code>plex.js.props.formatchain('window', ['my prop', 'f_x' '2b'])</code>
 * will return <tt>"window['my prop'].f_x['2b']"</tt>
 * @param {String} globalName  the name of the global context, like 'window'.
 *     Used when the first property must be represented with square-bracket
 *     notation.
 * @param {Array.<String>} chain  the list of property names to be dereferenced
 * @return {String} the JS code to dereference the chain,
 *     <strong>not</strong> HTML-escaped.
 */
plex.js.props.formatChain = function(globalName, chain) {
  var result = [];
  for (var i = 0; i < chain.length; ++i) {
    var name = chain[i];
    if (plex.js.parser.isId(name)) {
      // Use dot notation for names like identifiers.
      result.push((i ? '.' : '') + name);
    } else {
      // Use square-bracked notation for non-identifier names.
      result.push((i ? '' : globalName) + '[\'' +
                  plex.string.textToSingleQuoteJsLiteral(name) + '\']');
    }
  }
  return result.join('');
};


/**
 *
 * @param {Object} jsContext
 * @param {String} jsText
 * @return {Object} {values:map of string completions to objects, prefix:prefix}
 */
plex.js.props.getCompletions = function(jsContext, jsText) {
  var tokens = plex.js.parser.tokenize(jsText);
  var propChain = plex.js.props.getPropertyChain(jsText, tokens);
  var matches = 
      propChain.length ? plex.js.props.getMatches(jsContext, propChain) : {};
  var prefix = propChain.length ? propChain[propChain.length - 1] : '';
  return {
    matches: matches,
    prefix: prefix
  };
};


/**
 * @param {String} jsText
 * @param {Array} tokens
 * @return {Array.String} property chain
 */
plex.js.props.getPropertyChain = function(jsText, tokens) {
  if (!tokens.length) return [];
  var T = plex.js.token.TYPE;
  var chain = []; // Push IDs we find, and reverse the order before returning.
  var rightGoodTok = null;
  var leftTok = null;
  var endsWithDot = false;
  for (var i = tokens.length - 1; i >= 0; --i) {
    leftTok = tokens[i];
    if (rightGoodTok == null) {
      // look for a dot with optional comments/whitespace, or an ID
      switch (leftTok.type) {
        case T.ID:
          if (i == tokens.length - 1) {
            // the ID is the rightmost token
            chain.push(leftTok.getStr(jsText));
            rightGoodTok = leftTok;
          } else {
            i = 0;
          }
          break;
        case T.DOT:
          rightGoodTok = leftTok;
          endsWithDot = true;
          break;
        case T.CMT:
        case T.WHITE:
          break;
        default:
          i = 0;
      }
    } else if (rightGoodTok.type == T.DOT) {
      // look for ID
      switch (leftTok.type) {
        case T.ID:
          chain.push(leftTok.getStr(jsText));
          rightGoodTok = leftTok;
          break;
        case T.CMT:
        case T.WHITE:
          break;
        default:
          i = 0;
      }
    } else if (rightGoodTok.type == T.ID) {
      // look for dot
      switch (leftTok.type) {
        case T.DOT:
          rightGoodTok = leftTok;
          break;
        case T.CMT:
        case T.WHITE:
          break;
        default:
          i = 0;
      }
    }
  }
  chain = chain.reverse();
  if (chain.length && endsWithDot) {
    chain.push('');
  }
  return chain;
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * JS parse tokens
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.js = plex.js || {};

plex.js.Token = function(type, start, end) {
  this.type = type;
  this.start = start;
  this.end = end;
};

plex.js.Token.prototype.equals = function(that) {
  return this.type == that.type &&
         this.start == that.start &&
         this.end == that.end;
};

plex.js.Token.prototype.toString = function() {
  return '{' + [this.type, this.start, this.end].join(', ') + '}';
};

plex.js.Token.prototype.toString = function() {
  return '{' + [this.type, this.start, this.end].join(', ') + '}';
};

plex.js.Token.prototype.getStr = function(jsText) {
  return jsText.substring(this.start, this.end);
};

plex.js.token = {
  TYPE: {
    ID: 1, // identifier, [_$a-zA-Z][_$a-zA-Z0-9]*
    SQSTR: 2, // ' string
    DQSTR: 3, // " string
    CMT: 4, // comment
    NUM: 5, // number.  Only handling non-negative base-10 integers
    WHITE: 6, // whitespace 
    DOT: 7, // .
    LSQUAREB: 8, // [
    RSQUAREB: 9, // ]
    OTHER: 10
  }
};
// Copyright 2007 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview  Autocomplete Input adapter.  This is an adapter that provides
 * an interface to a textarea that is useful for an autocomplete widget.
 * <p>
 * It has a 'command' pubsub, for key commands like next, prev, select, and
 * dismiss.
 * <p>
 * It also has a 'query' pubsub, which fires when the text
 * left of the cursor changes, either by editing, or by moving the cursor.
 * <p>
 * There are a couple methods for getting the text left of the cursor, and
 * for injecting autocompleted text into the input element.
 * <p>
 * There is no format function, and this isn't a widget itself.  It is just
 * a bridge between an existing input element and an autocomplete widget.
 * 
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.wij = plex.wij || {};
plex.wij.acinput = {};

plex.wij.acinput.COMMANDS = {
  DISMISS: 1,
  SELECT: 2,
  DOT: 3,
  UP: 4,
  DOWN: 5,
  LEFT: 6,
  RIGHT: 7
};

/**
 * @constructor
 */
plex.wij.AcInput = function() {
  this.commandPs = new plex.PubSub();
  this.queryPs = new plex.PubSub();
  /** the input element */
  this.element = null;
  /** the text to the left of the cursor */
  this.value = "";
  
  this.commandFunc = this.getCommandFunc();
  this.queryFunc = this.getQueryFunc();
  
  // workaround Safari 2.0.4 bug where arrow-keys trigger double events
  this.lastCommandTime = -1;
  this.lastCommand = -1;
};

/**
 * Adds listeners to an input element, and keeps a pointer to the element.
 * Any listeners on a previous element are removed.  'Elem' may be null.
 * @param {Object} elem  the input element
 */
plex.wij.AcInput.prototype.setElement = function(elem) {
  var queryEvents = ['keyup', 'click', 'input', 'propertychange'];
  var commandEvents = ['keydown', 'xkeypress'];
  if (elem == this.element) return;
  if (this.element) {
    plex.event.removeListenerFromEvents(this.element, queryEvents, 
                                        this.queryFunc);
    plex.event.removeListenerFromEvents(this.element, commandEvents, 
                                        this.commandFunc);
  }
  if (elem) {
    this.element = elem;
    plex.event.addListenerToEvents(this.element, queryEvents, 
                                   this.queryFunc);
    plex.event.addListenerToEvents(this.element, commandEvents, 
                                   this.commandFunc);
  }
};

/**
 * Inserts text at the cursor, replacing the current selection, and moving
 * the cursor to be after the inserted text.
 * @param {String} text
 */
plex.wij.AcInput.prototype.replacePrefix = function(prefix, text) {
  plex.textarea.replacePrefix(this.element, prefix, text);
  this.queryFunc();
};

/**
 * Subscribe to the 'command' publisher.
 * @param {Function} func  subscriber function.  It will be called with one
 *     argument: the command being issued.
 */
plex.wij.AcInput.prototype.subCommand = function(func) {
  this.commandPs.subscribe(func);
};

/**
 * Unsubscribe from the 'command' publisher.
 * @param {Object} func
 */
plex.wij.AcInput.prototype.unsubCommand = function(func) {
  this.commandPs.unsubscribe(func);
};

/**
 * Subscribe to the 'query' publisher.
 * @param {Object} func  subscriber function, with no arguments.  To get the
 *     query, use getQuery().
 */
plex.wij.AcInput.prototype.subQuery = function(func) {
  this.queryPs.subscribe(func);
};

/**
 * Unsuscribe from the 'query' publisher.
 * @param {Object} func
 */
plex.wij.AcInput.prototype.unsubQuery = function(func) {
  this.queryPs.unsubscribe(func);
};

////////////////////
// private methods
////////////////////
  
/**
 * @return {Function} an event handler that will publish to the query PubSub if
 *     the text to the left of the cursor has changed
 * @private
 */
plex.wij.AcInput.prototype.getQueryFunc = function() {
  return plex.func.bind(
      function() {
        // ignores the event; just uses the selection and the value
        var ta = this.element;
        var cursorPos = plex.textarea.getSelection(ta).start;
        var newVal = this.element.value.substr(0, cursorPos);
        if (newVal != this.value) {
          this.value = newVal;
          this.queryPs.publish(newVal);
        }
      },
      this);
};

/**
 * Listens to key events for autocomplete-related commands and publishes them
 * on the 'command' pubsub.
 * <ul>
 * <li>escape: DISMISS
 * <li>ctrl-up: PREV
 * <li>ctrl-down: NEXT
 * <li>ctrl-enter: SELECT
 * </ul>
 * @return {Function} an event handler that will publish to the command PubSub
 *     if the keypress triggers one of the commands
 * @private
 */
plex.wij.AcInput.prototype.getCommandFunc = function() {
  return plex.func.bind(
      function(e) {
        var e = e || window.event;
        var command = null;
        var C = plex.wij.acinput.COMMANDS;
        var K = plex.event.KEYCODES;
        var code = e.which || e.keyCode;
	//log(plex.object.expose(e));
        if (code == plex.event.KEYCODES.ESC) {
          command = C.DISMISS;
        } else if (e.ctrlKey) {
          switch (code) {
            case K.ENTER:
            case K.RETURN:
              command = C.SELECT;
              break;
            case K.DOT:
              command = C.DOT;
              break;
            case K.UP:
            case K.UP_SAFARI:
              command = C.UP;
              break;
            case K.DOWN:
            case K.DOWN_SAFARI:
              command = C.DOWN;
              break;
            case K.LEFT:
            case K.LEFT_SAFARI:
              command = C.LEFT;
              break;
            case K.RIGHT:
            case K.RIGHT_SAFARI:
              command = C.RIGHT;
              break;
          }
        }
        if (command) {
          var now = plex.time.now();
          if (now - this.lastCommandTime > 20 ||
              command != this.lastCommand) {
            this.lastCommand = command;
            this.lastCommandTime = now;
            this.commandPs.publish(command);
          }
          // cancel default action
          plex.event.preventDefault(e);
          return false;
        }
      },
      this);
};

// Copyright 2007 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview  Autocomplete JS globals for plexode.com/eval.
 * Uses plex.js.*, and plex.wij.menu, plus whatever else I need to write
 * to support my first plexode autocomplete widgit.
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.wij = plex.wij || {};
plex.wij.jsac = {};

/**
 * @constructor
 */
plex.wij.JsAc = function() {
  this.acInput = null;
  this.menu = null;
  this.prefix = '';
  this.append = '';
  this.items = [];
  this.commandHandler = this.getCommandHandler();
  this.queryHandler = this.getQueryHandler();
  this.selectHandler = this.getSelectHandler();
};

/**
 * Unsubscribes from and existing AcInput, and subscribes to the new one, if
 * not null.
 * @param {plex.wij.AcInput} input  may be null
 */
plex.wij.JsAc.prototype.setAcInput = function(input) {
  if (this.acInput == input) return;
  if (this.acInput != null) {
    // unsubscribe the current handlers from the old AcInput
    this.acInput.unsubCommand(this.commandHandler);
    this.acInput.unsubQuery(this.queryHandler);
  }
  this.acInput = input;
  if (this.acInput != null) {
    // subscribe to the new AcInput
    this.acInput.subCommand(this.commandHandler);
    this.acInput.subQuery(this.queryHandler);
  }
};

plex.wij.JsAc.prototype.setMenu = function(menu) {
  if (this.menu == menu) return;
  if (this.menu != null) {
    // unsubscribe the current handlers from the old Menu
    this.menu.unsubSelect(this.selectHandler);
  }
  this.menu = menu;
  if (this.menu != null) {
    // subscribe to the new AcInput
    this.menu.subSelect(this.selectHandler);
  }
};

////////////////////
// private methods
////////////////////

plex.wij.JsAc.prototype.getCommandHandler = function() {
  return plex.func.bind(
      function(cmd) {
        var C = plex.wij.acinput.COMMANDS; 
        switch (cmd) {
          case C.DISMISS:
            this.dismiss();
            break;
          case C.SELECT:
            this.append = '';
            this.select();
            break;
          case C.RIGHT:
          case C.DOT:
            this.append = '.';
            this.select();
            break;
          case C.UP:
            this.prev();
            break;
          case C.DOWN:
            this.next();
            break;
        }
      },
      this);
};

plex.wij.JsAc.prototype.dismiss = function() {
  // TODO
};

plex.wij.JsAc.prototype.select = function() {
  this.menu.selectHilited();
};

plex.wij.JsAc.prototype.prev = function() {
  this.menu.hilitePrev();
};

plex.wij.JsAc.prototype.next = function() {
  this.menu.hiliteNext();
};

plex.wij.JsAc.prototype.getQueryHandler = function() {
  return plex.func.bind(
      function(q) {
        var completions = plex.js.props.getCompletions(window, q);
        this.prefix = completions.prefix;
        var matches = completions.matches;
        this.items.length = 0;
        for (var name in matches) {
          // push items like {name:name, value:value}
          this.items.push({name:name, value:matches[name]});
        }
        this.menu.render(this.items);
        // hilite the first item by default
        this.menu.hiliteNext();
      },
      this);
};

plex.wij.JsAc.prototype.getSelectHandler = function() {
  return plex.func.bind(
      function(i) {
        this.acInput.replacePrefix(this.prefix,
                                   this.items[i].name + this.append);
      },
      this);
};


// Copyright 2007 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview  Taking a stab at widgets here...
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.wij = plex.wij || {};
plex.wij.log = {};

/**
 * @constructor
 */
plex.wij.Log = function(opt_size) {
  this.size = opt_size || 100;
  this.htmls = [];
  this.div = null;
  this.innerId = plex.ids.nextId();
  this.texts = [];
  this.doc = null;
  this.startTime = (new Date()).getTime();
};

plex.wij.Log.prototype.getDiv = function(opt_doc) {
  if (!this.div) {
    this.doc = opt_doc || document;
    this.div = plex.dom.ce('div', null, this.doc);
    var s = this.div.style;
    s.position = 'relative';
    s.height = '100%';
    s.overflow = 'hidden';
    this.div.innerHTML =
        '<div style="position:absolute; bottom:0px"' +
        ' id="' + this.innerId + '">' +
        '</div>';
    
  }
  return this.div;
};

plex.wij.Log.prototype.log = function(text, opt_color) {
  var html = [];
  html.push('<div class=plexLog' +
            (opt_color ? ' style="color:' + opt_color + '">' : '>'));
      
  var ms = (new Date()).getTime() - this.startTime;
  html.push('<span>' + ms + '</span> ');
  html.push(plex.string.textToHtml(text, true));
  html.push('</div>');
  this.htmls.push(html.join(''));
  if (this.htmls.length > this.size) {
    this.htmls.shift();
  }
  var div = plex.dom.gebi(this.innerId, this.doc);
  if (div) {
    div.innerHTML = this.htmls.join('');
  }
};
// Copyright 2007 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview  Taking a stab at widgets here...
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.wij = plex.wij || {};
plex.wij.menu = {};

plex.wij.menu.C_ITEM = 'plexWijMenuItem';
plex.wij.menu.C_ITEM_HILITED = 'plexWijMenuItemHilited';

/**
 * @constructor
 */
plex.wij.Menu = function() {
  this.items = [];
  
  // very simple default renderers
  this.formatListFunc = function(itemHtmls) {
    return itemHtmls.join('');
  };
  this.formatItemFunc = function(item) {
    return plex.string.textToHtml(item);
  };
  
  this.hilitePs = new plex.PubSub();
  this.selectPs = new plex.PubSub();
  this.div = null;
  this.itemIds = [];
  this.hiliteIndex = -1;
};

/**
 * Subscribe to the 'hilite' publisher.
 * @param {Object} func
 */
plex.wij.Menu.prototype.subHilite = function(func) {
  this.hilitePs.subscribe(func);
};

/**
 * Unsubscribe from the 'hilite' publisher.
 * @param {Object} func
 */
plex.wij.Menu.prototype.unsubHilite = function(func) {
  this.hilitePs.unsubscribe(func);
};

/**
 * Subscribe to the 'select' publisher.
 * @param {Object} func
 */
plex.wij.Menu.prototype.subSelect = function(func) {
  this.selectPs.subscribe(func);
};

/**
 * Unsuscribe from the 'select' publisher.
 * @param {Object} func
 */
plex.wij.Menu.prototype.unsubSelect = function(func) {
  this.selectPs.unsubscribe(func);
};

/**
 * Lazy-creates div where all the menu content goes.  Use it to add CSS classes
 * and to position the menu, but please don't mess with the node innards.
 * @param {Object} opt_win  optional window obj used to create the div.  The
 *     default is the global context.
 * @return the div
 */
plex.wij.Menu.prototype.getDiv = function(opt_win) {
  var win = opt_win || window;
  if (!this.div) {
    var div = plex.dom.ce('div', null, win.document);
    plex.event.addListener(div, 'mouseover', this.getMousingFunc());
    plex.event.addListener(div, 'mouseout', this.getMousingFunc());
    plex.event.addListener(div, 'click', this.getSelectFunc());
    this.div = div;
  }
  return this.div;
};

/**
 * Sets the item list and writes new HTML into the div.  This nullifies the
 * hilite state.
 */
plex.wij.Menu.prototype.render = function(items, opt_win) {
  this.items = plex.array.copy(items);
  this.itemIds = plex.ids.nextIds(this.items.length);
  var html = this.format(this.itemIds);
  var div = this.getDiv(opt_win);
  div.innerHTML = html;
  this.setHiliteIndex(-1);
};

plex.wij.Menu.prototype.hiliteNext = function() {
  this.moveHiliteBy(1);
};

plex.wij.Menu.prototype.hilitePrev = function() {
  this.moveHiliteBy(-1);
};

plex.wij.Menu.prototype.selectHilited = function() {
  if (this.hiliteIndex >= 0) {
    this.selectPs.publish(this.hiliteIndex);
  }
};

////////////////////
// private methods
////////////////////

/**
 * Climbs up the DOM tree looking for an item node that belongs to the menu.
 * @param {Object} elem  some DOM element
 * @return {Object} an item DOM node, or null
 * @private
 */
plex.wij.Menu.prototype.getItemNodeByElement = function(elem) {
  var div = this.getDiv();
  while (elem) {
    if (elem == div) {
      return null;
    }
    try {
      if (elem.nodeName == 'TEXTAREA') {
        return null; // FF can't get ta.parentNode
      }
    } catch (e) {
      // Don't know why this happens yet.  FF 2, OS X.
      return null;
    }
    var id = elem.id;
    var num = plex.ids.getNum(id);
    if (num && plex.array.contains(this.itemIds, id)) {
      return elem;
    }
    elem = elem.parentNode;
  }
  return null;
};

/**
 * @return {Function} the mouseover and mouseout callback
 * @private
 */
plex.wij.Menu.prototype.getMousingFunc = function() {
  return plex.func.bind(
      function(e) {
        e = e || window.event;
        var toElem = plex.event.getToElement(e);
        var toItem = this.getItemNodeByElement(toElem);
        var toIndex = -1;
        if (toItem) {
          toIndex = plex.array.indexOf(this.itemIds, toItem.id);
        }
        this.setHiliteIndex(toIndex);
      },
      this);
};

/**
 * @private
 */
plex.wij.Menu.prototype.getNodeByIndex = function(index) {
  if (index < 0 || index >= this.itemIds.length) return null;
  return plex.dom.gebi(this.itemIds[index]);
};

/**
 * @private
 */
plex.wij.Menu.prototype.setHiliteIndex = function(index) {
  if (index != this.hiliteIndex) {
    // unhilite old node if any
    var oldNode = this.getNodeByIndex(this.hiliteIndex);
    if (oldNode) {
      plex.dom.removeClass(oldNode, plex.wij.menu.C_ITEM_HILITED);
    }
    // update hiliteIndex
    this.hiliteIndex = index;
    // hilite new node if any
    var newNode = this.getNodeByIndex(index);
    if (newNode) {
      plex.dom.appendClass(newNode, plex.wij.menu.C_ITEM_HILITED);
    }
    this.hilitePs.publish(index);
  }
};

/**
 * @return {Function} the click callback
 * @private
 */
plex.wij.Menu.prototype.getSelectFunc = function() {
  return plex.func.bind(
      function(e) {
        e = e || window.event;
        var toElem = plex.event.getTarget(e);
        var toItem = this.getItemNodeByElement(toElem);
        var toIndex = -1;
        if (toItem) {
          toIndex = plex.array.indexOf(this.itemIds, toItem.id);
        }
        this.setHiliteIndex(toIndex);
        this.selectHilited();
      },
      this);
};

/**
 * Generates new HTML using IDs provided.
 * @param {Array.<String>} ids
 * @private
 */
plex.wij.Menu.prototype.format = function(ids) {
  var itemHtmls = [];
  for (var i = 0, n = this.items.length; i < n; ++i) {
    itemHtmls.push([
      '<div class="',plex.wij.menu.C_ITEM, '" id="', ids[i], '">',
      this.formatItemFunc(this.items[i]),
      '</div>'
    ].join(''));
  }
  return this.formatListFunc(itemHtmls);
};

/**
 * @private
 */
plex.wij.Menu.prototype.moveHiliteBy = function(diff) {
  if (!this.items.length) return;
  if (this.hiliteIndex == -1 && diff < 0) {
    // If we're starting with no hilite and going backwards, start at the top.
    this.hiliteIndex = this.items.length;
  }
  var index = this.hiliteIndex + diff;
  var length = this.items.length;
  while (index < 0) {
    index += length;
  }
  while (index >= length) {
    index -= length;
  }
  this.setHiliteIndex(index);
};

// Copyright 2007 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview  pubsub for textarea content changes
 * @author Aaron Whyte
 */

this.plex = this.plex || {};
plex.wij = plex.wij || {};
plex.wij.tachanges = {};

/**
 * @constructor
 */
plex.wij.TaChanges = function(opt_elem) {
  this.changePs = new plex.PubSub();
  this.element = null;
  this.oldValue = null;
  this.changeFunc = this.getChangeFunc();
  if (opt_elem) {
    this.setElement(opt_elem);
  }
};

/**
 * Adds listeners to an input element, and keeps a pointer to the element.
 * Any listeners on a previous element are removed.  'Elem' may be null.
 * @param {Element} elem the textarea element
 */
plex.wij.TaChanges.prototype.setElement = function(elem) {
  var changeEvents = ['keyup', 'click', 'input', 'propertychange'];
  if (elem == this.element) return;
  if (this.element) {
    plex.event.removeListenerFromEvents(this.element, changeEvents, 
                                        this.changeFunc);
    this.oldValue = null;
  }
  if (elem) {
    this.element = elem;
    plex.event.addListenerToEvents(this.element, changeEvents, 
                                   this.changeFunc);
    this.oldValue = elem.value;
  }
};

/**
 * Subscribe to the 'change' publisher.
 * @param {Function} func  subscriber function, with the textarea value as an
 *     argument.
 */
plex.wij.TaChanges.prototype.subChange = function(func) {
  this.changePs.subscribe(func);
};

/**
 * Unsuscribe from the 'change' publisher.
 * @param {Function} func
 */
plex.wij.TaChanges.prototype.unsubChange = function(func) {
  this.changePs.unsubscribe(func);
};

////////////////////
// private methods
////////////////////
  
/**
 * @return {Function} an event handler that will publish to the chage PubSub if
 *     the text in the textarea has changed
 * @private
 */
plex.wij.TaChanges.prototype.getChangeFunc = function() {
  return plex.func.bind(
      function() {
        var newValue = this.element.value;
        if (newValue != this.oldValue) {
          this.oldValue = newValue;
          this.changePs.publish(newValue);
        }
      },
      this);
};
var aabb = {};
aabb.rectCircleDist = function(x0, y0, x1, y1, cx, cy) {
  var lowX = Math.min(x0, x1);
  var highX = Math.max(x0, x1);
  var lowY = Math.min(y0, y1);
  var highY = Math.max(y0, y1);

  if (cx < lowX) {
    // left column
    if (cy < lowY) {
      return Vec2d.distance(lowX, lowY, cx, cy);
    } else if (cy > highY) {
      return Vec2d.distance(lowX, highY, cx, cy);
    } else {
      return lowX - cx;
    }
  } else if (cx > highX) {
    // right column
    if (cy < lowY) {
      return Vec2d.distance(highX, lowY, cx, cy);
    } else if (cy > highY) {
      return Vec2d.distance(highX, highY, cx, cy);
    } else {
      return cx - highX;
    }
  } else {
    // middle column
    if (cy < lowY) {
      return lowY - cy;
    } else if (cy > highY) {
      return cy - highY;
    } else {
      // in the rect
      return 0;
    }
  }
};
/**
 * State data for a view in a 2d plane, including pan and zoom.
 *
 * @constructor
 */
function Camera() {
  this.pan = new Vec2d();
  this.zoom = 1;
}


Camera.prototype.setPanXY = function(x, y) {
  this.pan.setXY(x, y);
};

Camera.prototype.setZoom = function(zoom) {
  this.zoom = zoom;
};


Camera.prototype.getPanX = function() {
  return this.pan.x;
};

Camera.prototype.getPanY = function() {
  return this.pan.y;
};

Camera.prototype.getZoom = function() {
  return this.zoom;
};

Camera.prototype.getPan = function() {
  return this.pan;
};

/**
 * @param {number} cellSize  max height and width for each cell in the
 * collider. The actual may be a little smaller.
 * @param groupPairs an array of 2-element arrays with group IDs.
 * This tells the collider to compare sledges in 2 groups for collisions.
 * The two IDs of a pair may be the same, to make
 * a group's sledges collide with each other.
 * @param {GameClock} clock
 * @constructor
 */
function CellCollider(cellSize, groupPairs, clock) {
  FLAGS && FLAGS.set('debugRayScans', false);

  this.cellSize = cellSize;
  this.groupPairs = groupPairs;
  this.clock = clock;

  this.marks = [];

  // Sledges by ID
  this.sledges = {};
  this.nextId = 1;

  // times when sledges cross into new cells
  this.cellEntries = new SkipQueue(200);

  // sledge-to-sledge hit objects
  this.hits = new SkipQueue(200);

  this.hitOut = Hit.alloc(0, 0, false, -1, -1);

  // The grid is a hash of column number (x) to columns,
  // and a columns is a hash from row (y) to a cell object.
  this.grid = {};
}

/**
 * Sledge radius padding, for deciding which cells a sledge occupies.
 */
CellCollider.PAD = 0.01;

/**
 * Lazy-inits the mapping from a group to all the groups it hits.
 */
CellCollider.prototype.getGroupToGroups = function() {
  if (this.groupToGroups) {
    return this.groupToGroups;
  }
  // map a group to all the groups it hits
  this.groupToGroups = {};
  for (var i = 0; i < this.groupPairs.length; i++) {
    var pair = this.groupPairs[i];
    // lazy init lists
    if (!this.groupToGroups[pair[0]]) {
      this.groupToGroups[pair[0]] = [];
    }
    if (!this.groupToGroups[pair[1]]) {
      this.groupToGroups[pair[1]] = [];
    }
    // Add to lists.
    if (this.groupToGroups[pair[0]].indexOf(pair[1]) == -1) {
      this.groupToGroups[pair[0]].push(pair[1]);
    }
    if (this.groupToGroups[pair[1]].indexOf(pair[0]) == -1) {
      this.groupToGroups[pair[1]].push(pair[0]);
    }
  }
  return this.groupToGroups;
};

/**
 * Lazy-creates and returns a grid cell.
 * @param {number} x
 * @param {number} y
 */
CellCollider.prototype.getCell = function(x, y) {
  if (!this.grid[x]) {
    this.grid[x] = {};
  }
  if (!this.grid[x][y]) {
    var cell = this.grid[x][y] = {};
    var groupToGroups = this.getGroupToGroups();
    for (var group in groupToGroups) {
      cell[group] = new CellGroup();
    }
  }
  return this.grid[x][y];
};

/**
 * Adds a sledge to the collider.
 * @param {Sledge} sledge
 * @param {number} group
 * @return {number} the new sledgeId
 */
CellCollider.prototype.addSledgeInGroup = function(sledge, group) {
  var sledgeId = this.nextId++;
  this.sledges[sledgeId] = sledge;
  sledge.group = group;
  sledge.moveToTime(this.clock.getTime());

  // Add next sledge entry times to cellEntries
  this.initSledgeCellTimes(sledge);
  if (sledge.cellEntryTimeX && sledge.cellEntryTimeX <= sledge.expiration) {
    this.cellEntries.add(
        CellEntryEvent.alloc(sledge.cellEntryTimeX, null, sledgeId));
  }
  if (sledge.cellEntryTimeY && sledge.cellEntryTimeY <= sledge.expiration) {
    this.cellEntries.add(
        CellEntryEvent.alloc(null, sledge.cellEntryTimeY, sledgeId));
  }

  // Add the sledge to grid cells.
  var x0 = this.getCellIndexX(sledge.px - sledge.rx - CellCollider.PAD);
  var y0 = this.getCellIndexY(sledge.py - sledge.ry - CellCollider.PAD);
  var x1 = this.getCellIndexX(sledge.px + sledge.rx + CellCollider.PAD);
  var y1 = this.getCellIndexY(sledge.py + sledge.ry + CellCollider.PAD);
  this.addSledgeToCells(sledge, sledgeId, x0, y0, x1, y1);

  return sledgeId;
};

/**
 * Adds a sledge to a rectangular range of cells,
 * and immediately calcuates the hit times for that sledge
 * vs all others (filtered by group) in those cells.
 * @private
 */
CellCollider.prototype.addSledgeToCells = function(
    sledge, sledgeId, x0, y0, x1, y1) {
  var group = sledge.group;
  var collidesWithGroups = this.getGroupToGroups()[group];
  for (var x = x0; x <= x1; x++) {
    for (var y = y0; y <= y1; y++) {
      var cell = this.getCell(x, y);
      // For every group the sledge can collide with...
      for (var g = 0; g < collidesWithGroups.length; g++) {
        var cellGroup = cell[collidesWithGroups[g]];
        var i = 0;
        while (i < cellGroup.length) {
          var otherSledgeId = cellGroup.sledgeIds[i];
          if (!(otherSledgeId in this.sledges)) {
            cellGroup.remove(i);
            continue;
          }
          // entry is valid
          this.calcHit(sledgeId, otherSledgeId);
          i++;
        }
      }
      // Add the new sledge to its own group in this cell.
      cell[group].add(sledgeId);
    }
  }
};

/**
 * Sticks the next x and y cell entry times into the sledge,
 * and caches intermediate calc data if needed.
 * @param {Sledge} sledge  a sledge that is already moved to now.
 * @private
 */
CellCollider.prototype.initSledgeCellTimes = function(sledge) {
  var now = this.clock.getTime();
  // Sledge's cell time data hasn't been initialized, so do it now.
  var wall, positive, front, cellIndex, time;
  if (sledge.vx) {
    sledge.cellPeriodX = Math.abs(this.cellSize / sledge.vx);
    positive = sledge.vx > 0;
    // front entry
    front = sledge.px + (positive
        ? sledge.rx + CellCollider.PAD
        : -sledge.rx - CellCollider.PAD);
    cellIndex = this.getCellIndexX(front);
    sledge.frontCellIndexX = cellIndex;
    wall = this.cellSize * (cellIndex + (positive ? 1 : 0));
    time = now + (wall - front) / sledge.vx;
    if (time < now) {
      throw Error(time + " < " + now);
    }
    sledge.cellEntryTimeX = time;
  }
  if (sledge.vy) {
    sledge.cellPeriodY = Math.abs(this.cellSize / sledge.vy);
    positive = sledge.vy > 0;
    // front entry
    front = sledge.py + (positive
        ? sledge.ry + CellCollider.PAD
        : -sledge.ry - CellCollider.PAD);
    cellIndex = this.getCellIndexY(front);
    sledge.frontCellIndexY = cellIndex;
    wall = this.cellSize * (cellIndex + (positive ? 1 : 0));
    time = now + (wall - front) / sledge.vy;
    if (time < now) {
      throw Error(time + " < " + now);
    }
    sledge.cellEntryTimeY = time;
  }
};

/**
 * Calculates a hit time, if the result is not already cached,
 * @param {number} id1  ID of one sledge
 * @param {number} id2  ID of another sledge
 */
CellCollider.prototype.calcHit = function(id1, id2) {
  var sledge1 = this.sledges[id1];
  var sledge2 = this.sledges[id2];
  var out = this.hitOut;
  sledge1.calcHitTime(sledge2, out, this.clock.getTime());
  var time = out.xTime || out.yTime;
  if (time && time < Math.min(sledge1.expiration, sledge2.expiration)) {
    var hit = Hit.alloc(out.xTime, out.yTime, out.overlapping, id1, id2);
    this.hits.add(hit);
  }
};

CellCollider.prototype.removeSledge = function(sledgeId) {
  if (this.sledges[sledgeId]) {
    Sledge.free(this.sledges[sledgeId]);
    delete this.sledges[sledgeId];
  }
};

/**
 * Returns the next collision on or after 'now' but before 'beforeTime',
 * or null if there isn't any.
 * @return {?Hit}
 */
CellCollider.prototype.getNextCollisionBeforeTime = function(beforeTime) {
  while (1) {
    var hit = this.hits.getFirst();
    if (hit && !this.isHitValid(hit)) {
      Hit.free(this.hits.removeFirst());
      continue;
    }
    var entry = this.cellEntries.getFirst();
    if (entry && !this.isCellEntryValid(entry)) {
      CellEntryEvent.free(this.cellEntries.removeFirst());
      continue;
    }
    if (!hit && !entry) {
      return null;
    }
    if (hit && (!entry || hit.time < entry.time)) {
      // The hit is the next event.
      if (beforeTime <= hit.time) {
        return null;
      }
      return hit;
    }
    if (beforeTime <= entry.time) {
      return null;
    }
    // The entry is the next event.
    // It might create more hits, and maybe another CellEntryEvent.
    var sledgeId = entry.sledgeId;
    var sledge = this.sledges[sledgeId];
    sledge.moveToTime(entry.time);
    if (entry.xTime && entry.yTime) {
      throw Error('entry.xTime && entry.yTime');
    }
    if (!entry.xTime && !entry.yTime) {
      throw Error('!entry.xTime && !entry.yTime');
    }
    if (entry.xTime) {
      CellEntryEvent.free(this.cellEntries.removeFirst());
      // add to a column of cells
      sledge.frontCellIndexX += sledge.dirX;
      var x = sledge.frontCellIndexX;
      var y0 = this.getCellIndexY(sledge.py - sledge.ry - CellCollider.PAD);
      var y1 = this.getCellIndexY(sledge.py + sledge.ry + CellCollider.PAD);
      this.addSledgeToCells(sledge, sledgeId, x, y0, x, y1);
      sledge.cellEntryTimeX += sledge.cellPeriodX;
      if (sledge.cellEntryTimeX <= sledge.expiration) {
        this.cellEntries.add(
            CellEntryEvent.alloc(sledge.cellEntryTimeX, null, sledgeId));
      }
    } else if (entry.yTime) {
      CellEntryEvent.free(this.cellEntries.removeFirst());
      // add to a row of cells
      sledge.frontCellIndexY += sledge.dirY;
      var y = sledge.frontCellIndexY;
      var x0 = this.getCellIndexX(sledge.px - sledge.rx - CellCollider.PAD);
      var x1 = this.getCellIndexX(sledge.px + sledge.rx + CellCollider.PAD);
      this.addSledgeToCells(sledge, sledgeId, x0, y, x1, y);
      sledge.cellEntryTimeY += sledge.cellPeriodY;
      if (sledge.cellEntryTimeY <= sledge.expiration) {
        this.cellEntries.add(
            CellEntryEvent.alloc(null, sledge.cellEntryTimeY, sledgeId));
      }
    }
  }
};

CellCollider.prototype.isHitValid = function(hit) {
  return hit.time >= this.clock.getTime() &&
      !!this.sledges[hit.sledgeId1] &&
      !!this.sledges[hit.sledgeId2];
};

CellCollider.prototype.isCellEntryValid = function(entry) {
  if (entry.time < this.clock.getTime()) {
    throw 'entry.time < now';
  }
  return !!this.sledges[entry.sledgeId];
};

/**
 * @returns the grid cell X index that corresponds with the x value.
 */
CellCollider.prototype.getCellIndexX = function(x) {
  return Math.floor(x / this.cellSize);
};

/**
 * @returns the grid cell Y index that corresponds with the y value.
 */
CellCollider.prototype.getCellIndexY = function(y) {
  return Math.floor(y / this.cellSize);
};

CellCollider.prototype.getWorldXForIndexX = function(ix) {
  return this.cellSize * ix;
};

CellCollider.prototype.getWorldYForIndexY = function(iy) {
  return this.cellSize * iy;
};

CellCollider.prototype.rayScan = function(rayScan, group) {
  var x0 = rayScan.x0;
  var y0 = rayScan.y0;
  var x1 = rayScan.x1;
  var y1 = rayScan.y1;
  var rx = rayScan.rx;
  var ry = rayScan.ry;

  // First check overlapping cells for an immediate collision
  var ix0 = this.getCellIndexX(x0 - rx);
  var iy0 = this.getCellIndexY(y0 - ry);
  var ix1 = this.getCellIndexX(x0 + rx);
  var iy1 = this.getCellIndexY(y0 + ry);
  for (var ix = ix0; ix <= ix1; ix++) {
    for (var iy = iy0; iy <= iy1; iy++) {
      this.rayScanCell(rayScan, ix, iy, group);
    }
  }

  var t = 0; // time from 0 to 1
  var dx = x1 - x0;
  var dy = y1 - y0;
  var dirX = Math.sgn(dx) || 1;
  var dirY = Math.sgn(dy) || 1;
  var leadX0 = x0 + rx * dirX;
  var leadY0 = y0 + ry * dirY;
  var leadX = leadX0;
  var leadY = leadY0;
  var tailOffsetX = -2 * rx * dirX;
  var tailOffsetY = -2 * ry * dirY;
  var periodX = dx ? Math.abs(this.cellSize / dx) : 0;
  var periodY = dy ? Math.abs(this.cellSize / dy) : 0;
  var leadIndexX = this.getCellIndexX(leadX);
  var leadIndexY = this.getCellIndexY(leadY);
  var tailIndexX;
  var tailIndexY;

  var nextWallX = this.getWorldXForIndexX(leadIndexX + (dirX == 1 ? 1 : 0));
  var nextWallY = this.getWorldYForIndexY(leadIndexY + (dirY == 1 ? 1 : 0));

  var timeOfWallX = dx ? (nextWallX - leadX) / dx : Infinity;
  var timeOfWallY = dy ? (nextWallY - leadY) / dy : Infinity;

  while (timeOfWallX <= 1 || timeOfWallY <= 1) {
    if (timeOfWallX < timeOfWallY) {
      leadIndexX += dirX;
      leadY = leadY0 + timeOfWallX * dy;
      tailIndexY = this.getCellIndexY(leadY + tailOffsetY);
      if (tailIndexY < leadIndexY) {
        iy0 = tailIndexY;
        iy1 = leadIndexY;
      } else {
        iy0 = leadIndexY;
        iy1 = tailIndexY;
      }
      for (var iy = iy0; iy <= iy1; iy++) {
        this.rayScanCell(rayScan, leadIndexX, iy, group);
      }
      timeOfWallX += periodX;
    } else {
      t = timeOfWallY;
      leadIndexY += dirY;
      leadX = leadX0 + timeOfWallY * dx;
      tailIndexX = this.getCellIndexX(leadX + tailOffsetX);
      if (tailIndexX < leadIndexX) {
        ix0 = tailIndexX;
        ix1 = leadIndexX;
      } else {
        ix0 = leadIndexX;
        ix1 = tailIndexX;
      }
      for (var ix = ix0; ix <= ix1; ix++) {
        this.rayScanCell(rayScan, ix, leadIndexY, group);
      }
      timeOfWallY += periodY;
    }
    var hitTime = rayScan.xTime || rayScan.yTime || Infinity;
    var wallTime = Math.min(timeOfWallX, timeOfWallY);
    if (hitTime < wallTime) {
      // The detected hit occurs prior to any other hit we could find.
      break;
    }
  }
  if (FLAGS && FLAGS.get('debugRayScans')) {
    var drawTime = hitTime == Infinity ? 1 : hitTime;
    this.marks.push(
        Mark.alloc(Mark.Type.LINE,
            drawTime == 1 ? '#a0a' : '#f0f',
            x0, y0,
            x0 + (x1 - x0) * drawTime, y0 + (y1 - y0) * drawTime));
  }
};

/**
 * Updates the rayscan with the earliest scan hit, if any.
 */
CellCollider.prototype.rayScanCell = function(rayScan, x, y, group) {
  if (FLAGS && FLAGS.get('debugRayScans')) {
    // mark cell walls
    this.marks.push(Mark.alloc(Mark.Type.DRAWRECT, '#808',
        this.getWorldXForIndexX(x), this.getWorldYForIndexY(y),
        this.getWorldXForIndexX(x + 1), this.getWorldYForIndexY(y + 1)));
  }
  var now = this.clock.getTime();

  var cell = this.getCell(x, y);
  // For every group the rayScan can collide with...
  var collidesWithGroups = this.getGroupToGroups()[group];
  for (var g = 0; g < collidesWithGroups.length; g++) {
    var cellGroup = cell[collidesWithGroups[g]];
    var i = 0;
    while (i < cellGroup.length) {
      var sledgeId = cellGroup.sledgeIds[i];
      var sledge = this.sledges[sledgeId];
      if (!sledge) {
        cellGroup.remove(i);
        continue;
      }
      // entry is valid - perform the scan
      rayScan.calcSledgeHit(sledge, sledgeId, now);
      i++;
    }
  }
};

CellCollider.prototype.draw = function(renderer) {
  for (var i = 0; i < this.marks.length; i++) {
    renderer.drawMark(this.marks[i]);
    Mark.free(this.marks[i]);
  }
  this.marks.length = 0;
};

/**
 * @constructor
 */
function CellEntryEvent(xTime, yTime, sledgeId) {
  this.reset(xTime, yTime, sledgeId);
}

CellEntryEvent.prototype.reset = function(xTime, yTime, sledgeId) {
  // Set xTime if hitting from the left or right,
  // or set yTime if hitting from the top or bottom.
  // Only set one.
  
  this.xTime = xTime;
  this.yTime = yTime;
  this.sledgeId = sledgeId;
  
  // One of these is likely to be null.
  this.time = xTime || yTime;
  
  return this;
};

CellEntryEvent.prototype.toString = function() {
  return '{' + [this.xTime, this.yTime, this.sledgeId].join(', ') + '}';
};

CellEntryEvent.pool = [];
CellEntryEvent.poolSize = 0;

CellEntryEvent.alloc = function(xTime, yTime, sledgeId) {
  var retval;
  if (CellEntryEvent.poolSize) {
    retval = CellEntryEvent.pool[--CellEntryEvent.poolSize];
    retval.reset(xTime, yTime, sledgeId);
  } else {
    retval = new CellEntryEvent(xTime, yTime, sledgeId);
  }
  return retval;
};

CellEntryEvent.free = function(obj) {
  CellEntryEvent.pool[CellEntryEvent.poolSize++] = obj;
};

/**
 * CellCollider Cell group.
 * Grid > Cell > CellGroup > sledge*
 * @constructor
 */
function CellGroup() {
  this.sledgeIds = [];
  this.length = 0;
}

/**
 * @param {number} sledgeId
 */
CellGroup.prototype.add = function(sledgeId) {
  this.sledgeIds[this.length] = sledgeId;
  this.length++;
};

/**
 * @param {number} index
 */
CellGroup.prototype.remove = function(index) {
  if (index >= this.length || index < 0) {
    throw Error("index " + index + " out of range 0.." + this.length - 1);
  }
  this.sledgeIds[index] = this.sledgeIds[this.length - 1];
  this.length--;
};

/**
 * @constructor
 */
function Flags(element) {
  this.element = element;
  this.flags = {};
}

window.FLAGS = null;

Flags.prototype.elementId = function(name) {
  return 'flag_' + name;
};

Flags.prototype.render = function() {
  var flagNames = [];
  for (var flagName in this.flags) {
    flagNames.push(flagName);
  }
  flagNames.sort();
  var html = [];
  for (var i = 0; i < flagNames.length; i++) {
    var name = flagNames[i];
    var val = this.flags[name];
    var id = this.elementId(name);
    html.push(
        '<input type=checkbox id="', id, '" ',
        (!!val ? 'checked ' : ''),
        '><label for="', id, '">', textToHtml(name), '</label><br>');
  }
  this.element.innerHTML = html.join('');
  for (var i = 0; i < flagNames.length; i++) {
    var name = flagNames[i];
    document.getElementById(this.elementId(name)).onchange = this.createOnChangeFn(name);
  }
};

Flags.prototype.createOnChangeFn = function(name) {
  var id = this.elementId(name);
  var me = this;
  return function() {
    var element = document.getElementById(id);
    me.set(name, element.checked);
  }
};

Flags.NAME_REGEX = /^[a-zA-Z][a-zA-Z_0-9]*$/;

Flags.prototype.addFlag = function(name) {
  if (!Flags.NAME_REGEX.test(name)) {
    throw Error('name "' + name + '" does not match regexp ' + Flags.NAME_REGEX);
  }
  this.flags[name] = null;
};

Flags.prototype.init = function(name, val) {
  val = !!val;
  if (!(name in this.flags)) {
    this.addFlag(name);
    this.flags[name] = val;
    this.render();
  }
};

Flags.prototype.set = function(name, val) {
  val = !!val;
  if (!(name in this.flags)) {
    this.addFlag(name);
  }
  if (this.flags[name] !== val) {
    this.flags[name] = val;
    this.render();
  }
};

Flags.prototype.get = function(name) {
  if (!(name in this.flags)) {
    this.addFlag(name);
    this.render();
  }  
  return this.flags[name];
};
/**
 * @constructor
 * @param {number?} opt_time
 */
function GameClock(opt_time) {
  this.time = opt_time || 1;
}

/**
 * @param {number} time
 */
GameClock.prototype.setTime = function(time) {
  this.time = time;
};

/**
 * @param {number} add
 */
GameClock.prototype.addTime = function(add) {
  this.time += add;
};

/**
 * @return {number}
 */
GameClock.prototype.getTime = function() {
  return this.time;
};


/**
 * @constructor
 */
function Hit(xTime, yTime, overlapping, sledgeId1, sledgeId2) {
  this.reset(xTime, yTime, overlapping, sledgeId1, sledgeId2);
}

Hit.prototype.reset = function(xTime, yTime, overlapping, sledgeId1, sledgeId2) {
  // Set xTime if hitting from the left or right,
  // or set yTime if hitting from the top or bottom.
  // Only set one.
  
  this.xTime = xTime;
  this.yTime = yTime;
  this.overlapping = overlapping;
  this.sledgeId1 = sledgeId1;
  this.sledgeId2 = sledgeId2;
  this.next = null;
  
  // One of these is likely to be null.
  this.time = xTime || yTime;
  
  return this;
};

Hit.prototype.toString = function() {
  return [this.xTime, this.yTime, this.overlapping, this.sledgeId1, this.sledgeId2].join();
};


Hit.pool = [];
Hit.poolSize = 0;

Hit.alloc = function(xTime, yTime, overlapping, sledgeId1, sledgeId2) {
  var retval;
  if (Hit.poolSize) {
    retval = Hit.pool[--Hit.poolSize];
    retval.reset(xTime, yTime, overlapping, sledgeId1, sledgeId2);
  } else {
    retval = new Hit(xTime, yTime, overlapping, sledgeId1, sledgeId2);
  }
  return retval;
};

Hit.free = function(hit) {
  Hit.pool[Hit.poolSize++] = hit;
};

/**
 * @param outputSpriteId
 * @param outputIndex
 * @param inputSpriteId
 * @param inputIndex
 * @constructor
 */
function LogicLink(outputSpriteId, outputIndex, inputSpriteId, inputIndex) {
  this.id = LogicLink.nextId++;
  this.outputSpriteId = outputSpriteId;
  this.outputIndex = outputIndex;
  this.inputSpriteId = inputSpriteId;
  this.inputIndex = inputIndex;
}

LogicLink.nextId = 1;

/**
 * @constructor
 */
function Mark(type, style, x0, y0, x1, y1) {
  this.reset(type, style, x0, y0, x1, y1);
}

/**
 * @enum {number}
 */
Mark.Type = {
    DRAWRECT: 1,
    FILLRECT: 2,
    LINE: 3
};

Mark.prototype.reset = function(type, style, x0, y0, x1, y1) {
  this.type = type;
  this.style = style;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
};

Mark.prototype.toString = function() {
  return [
    this.type,
    this.style,
    this.x0,
    this.y0,
    this.x1,
    this.y1].join();
};

Mark.pool = [];
Mark.poolSize = 0;

Mark.alloc = function(type, style, x0, y0, x1, y1) {
  var retval;
  if (Mark.poolSize) {
    retval = Mark.pool[--Mark.poolSize];
    retval.reset(type, style, x0, y0, x1, y1);
  } else {
    retval = new Mark(type, style, x0, y0, x1, y1);
  }
  return retval;
};

Mark.free = function(mark) {
  Mark.pool[Mark.poolSize++] = mark;
};

/**
 * @param {number=} opt_maxTrailLength
 * @constructor
 */
function Painter(opt_maxTrailLength) {
  this.events = new CircularQueue(opt_maxTrailLength || 1);
  this.now = 0;
  this.lastAdvanceTime = -1;
}

Painter.prototype.setPosition = function(x, y) {
  this.addEvent(PaintEvent.alloc(
      PaintEvent.Type.PATH, this.now, x, y, 0, 0, 0, 0));
};

/**
 * @param {PaintEvent} event
 */
Painter.prototype.addEvent = function(event) {
  var fellOffTail = this.events.enqueue(event);
  if (fellOffTail) {
    PaintEvent.free(fellOffTail);
  }
};

/**
 * Override to add more computation, like maybe spark calculations.
 * @param {number} now
 */
Painter.prototype.advance = function(now) {
  this.now = now;
  if (this.now == this.lastAdvanceTime) return;
  // do stuff
  this.lastAdvanceTime = this.now;
};

/**
 * @param {Object} renderingVisitor  The API the painter uses to paint with. (Vorp uses a VorpOut.)
 * @param {number} layer  When painting happens in multiple layers,
 * for debugging or because the order matters visually, this is important.
 */
Painter.prototype.paint = function(renderingVisitor, layer) {
  throw new Error("you gotta implement Painter.paint() in your subclasses");
};

/**
 * @return {boolean} true iff the painter is never going to paint again,
 * and can be reused or garbage collected by the Gaam.
 */
Painter.prototype.isKaput = function() {
  throw new Error("isKaput is unimplemented");
};

/**
 * @param {PaintEvent.Type} type
 * @param {number} time  time at which the PaintEvent was at position (px, py)
 * @param {number} px
 * @param {number} py
 * @param {number} vx
 * @param {number} vy
 * @param {number} rx
 * @param {number} ry
 * @constructor
 */
function PaintEvent(type, time, px, py, vx, vy, rx, ry) {
  this.reset(type, time, px, py, vx, vy, rx, ry);
}

/**
 * @enum {number}
 */
PaintEvent.Type = {
  /**
   * End of the line.  The sprite is gone, so the painter
   * can die when it's done with any leftover effects.
   */
  KAPUT: 1,
  
  /**
   * Change in trajectory or size.  Basically records sledge creation. 
   */
  PATH: 2
};

/**
 * @param {PaintEvent.Type} type
 * @param {number} time  time at which the PaintEvent was at position (px, py)
 * @param {number} px
 * @param {number} py
 * @param {number} vx
 * @param {number} vy
 * @param {number} rx
 * @param {number} ry
 */
PaintEvent.prototype.reset = function(type, time, px, py, vx, vy, rx, ry) {
  this.type = type;
  this.time = time;
  this.px = px;
  this.py = py;
  this.vx = vx;
  this.vy = vy;
  this.rx = rx;
  this.ry = ry;

  // Privately cache the original position & time values.
  this.opx = px;
  this.opy = py;
  this.startTime = time;

  return this;
};

PaintEvent.prototype.moveToTime = function(time) {
  if (time != this.time) {
    this.px = this.opx + this.vx * (time - this.startTime);
    this.py = this.opy + this.vy * (time - this.startTime);
    this.time = time;
  }
};

PaintEvent.pool = [];
PaintEvent.poolSize = 0;

/**
 * @param {PaintEvent.Type} type
 * @param {number} time  time at which the PaintEvent was at position (px, py)
 * @param {number} px
 * @param {number} py
 * @param {number} vx
 * @param {number} vy
 * @param {number} rx
 * @param {number} ry
 * @return {PaintEvent}
 */
PaintEvent.alloc = function(type, time, px, py, vx, vy, rx, ry) {
  var retval;
  if (PaintEvent.poolSize) {
    retval = PaintEvent.pool[--PaintEvent.poolSize];
    retval.reset(type, time, px, py, vx, vy, rx, ry);
  } else {
    retval = new PaintEvent(type, time, px, py, vx, vy, rx, ry);
  }
  return retval;
};

/**
 * @param {PaintEvent} PaintEvent
 */
PaintEvent.free = function(paintEvent) {
  PaintEvent.pool[PaintEvent.poolSize++] = paintEvent;
};

Math.sgn = Math.sgn || function(n) {
  if (n == 0) return 0;
  if (n > 0) return 1;
  return -1;
};

/**
 * @param {CellCollider} collider
 * @param {GameClock} gameClock
 * @param sledgeInvalidator
 * @constructor
 */
function Phy(collider, gameClock, sledgeInvalidator) {
  this.collider = collider;
  this.gameClock = gameClock;
  this.sledgeInvalidator = sledgeInvalidator;

  this.sledgeIdToSpriteId = {};
  this.spriteIdToSledgeId = {};
  this.sprites = {}; // ID to object
  this.sledges = {}; // ID to object, doy
  this.spriteTimeouts = new SkipQueue(100);
  
  this.onSpriteHitObj = null;
  this.onSpriteHitFn = null;
}

Phy.prototype.setOnSpriteHit = function(obj, fn) {
  this.onSpriteHitObj = obj;
  this.onSpriteHitFn = fn;
};

/**
 * @param {SpriteTimeout} spriteTimeout
 * @return {boolean}
 */
Phy.prototype.isSpriteTimeoutValid = function(spriteTimeout) {
  return spriteTimeout.time >= this.now() &&
      !!this.sprites[spriteTimeout.spriteId];
};

/**
 * Adds the sprite here, and inserts a sledge into the multicollider.
 * @param {Sprite} sprite
 */
Phy.prototype.addSprite = function(sprite) {
  if (!sprite) throw "no sprite";
  this.sprites[sprite.id] = sprite;
  this.sledgeInvalidator.add(sprite.id);
};

/**
 * Removes the sprite, and removes its sledge from the collider.
 * @param spriteId
 */
Phy.prototype.removeSprite = function(spriteId) {
  var sprite = this.sprites[spriteId];
  if (!sprite) throw "no sprite with id: " + spriteId;
  var sledgeId = this.spriteIdToSledgeId[spriteId];
  if (sledgeId) {
    this.removeSledge(sledgeId);
  } else if (!this.sledgeInvalidator.contains(spriteId)) {
    throw 'no sledge and no sledgeless entry for sprite ' + sprite;
  }
  delete this.sprites[spriteId];
  this.sledgeInvalidator.remove(spriteId);
};

/**
 * Adds the sledge to the collider and the sprite, and to this.
 * Removes the sprite's old sledge first.
 * @param {Sledge} sledge
 * @param spriteId
 * @return {Number} new sledgeId
 * @private
 */
Phy.prototype.bindSledgeToSpriteId = function(sledge, spriteId) {
  if (!spriteId) throw "no spriteId";
  if (!sledge) throw "no sledge";
  var sprite = this.sprites[spriteId];
  if (!sprite) throw "no sprite with id: " + spriteId;
  // remove old sledge if any
  var oldSledgeId = this.spriteIdToSledgeId[spriteId];
  if (oldSledgeId) {
    this.removeSledge(oldSledgeId);
  }
  // add new sledge
  var sledgeId = this.collider.addSledgeInGroup(sledge, sprite.group);
  this.sledgeIdToSpriteId[sledgeId] = spriteId;
  this.spriteIdToSledgeId[spriteId] = sledgeId;
  this.sledgeInvalidator.remove(spriteId);
  return sledgeId;
};

/**
 * Removes the sledge from maps and from the collider.
 * Probably only called from removeSprite and setSledgeForSpriteId.
 * @param sledgeId
 * @private
 */
Phy.prototype.removeSledge = function(sledgeId) {
  if (!sledgeId) throw 'no sledgeId';
  var spriteId = this.sledgeIdToSpriteId[sledgeId];
  if (!spriteId) throw 'no spriteId for sledgeId: ' + sledgeId;
  if (!this.spriteIdToSledgeId[spriteId]) throw 'blarg';

  delete this.spriteIdToSledgeId[spriteId];
  delete this.sledgeIdToSpriteId[sledgeId];
  this.collider.removeSledge(sledgeId);
  // Don't remove the sprite from the invalidator here. Only do that if the
  // sprite is being removed, or if a valid new sledge is created.
};

/**
 * @private
 */
Phy.prototype.updateSledges = function() {
  var spriteId;
  // remove invalid sledges
  for (spriteId in this.sledgeInvalidator.spriteIds) {
    var sledgeId = this.spriteIdToSledgeId[spriteId];
    if (sledgeId) {
      this.removeSledge(sledgeId);
    }
  }
  // create new sledges for sprites
  for (spriteId in this.sledgeInvalidator.spriteIds) {
    if (this.spriteIdToSledgeId[spriteId]) {
      throw 'sledgelessSprite id ' + spriteId + ' has a sledge id ' +
          this.spriteIdToSledgeId[spriteId];
    }
    var sprite = this.sprites[spriteId];
    var sledge = sprite.createSledge();
    this.bindSledgeToSpriteId(sledge, spriteId);
  }
};

/**
 * @param sledgeId
 * @return {Sprite}
 */
Phy.prototype.getSpriteBySledgeId = function(sledgeId) {
  var spriteId = this.sledgeIdToSpriteId[sledgeId];
  return this.sprites[spriteId];
};

/**
 * @param sledgeId
 * @return {number?}
 */
Phy.prototype.getSpriteIdBySledgeId = function(sledgeId) {
  return this.sledgeIdToSpriteId[sledgeId];
};

/**
 * @param spriteId
 * @return {Sprite}
 */
Phy.prototype.getSprite = function(spriteId) {
  return this.sprites[spriteId];
};

/**
 * @param {Sprite} sprite
 * @return {number}
 */
Phy.prototype.getSpriteId = function(sprite) {
  for (var spriteId in this.sprites) {
    if (this.sprites[spriteId] == sprite) {
      return spriteId;
    }
  }
  return null;
};

/**
 * Moves time forward.
 * @param {number} duration
 */
Phy.prototype.clock = function(duration) {
  var endTime = this.now() + duration;
  var hit = this.getNextCollisionBeforeTime(endTime);
  var spriteTimeout = this.getFirstSpriteTimeoutBeforeTime(endTime);
  while (hit != null || spriteTimeout != null) {

    // Is the hit first?
    if (!spriteTimeout || (hit && hit.time < spriteTimeout.time)) {
      // hit is before timeout

      // advance time to this collision
      this.gameClock.setTime(hit.time);
      // sledge/sledge hit
      var spriteId1 = this.sledgeIdToSpriteId[hit.sledgeId1];
      var spriteId2 = this.sledgeIdToSpriteId[hit.sledgeId2];
      this.onSpriteHitFn.call(this.onSpriteHitObj,
          spriteId1, spriteId2, hit.xTime, hit.yTime, hit.overlapping);
    } else {
      // timeout is before hit
      this.gameClock.setTime(spriteTimeout.time);
      this.sprites[spriteTimeout.spriteId].onTimeout(spriteTimeout, this);
      SpriteTimeout.free(this.spriteTimeouts.removeFirst());
    }
    // Timeouts and collisions change things.  Get everything fresh.
    spriteTimeout = this.getFirstSpriteTimeoutBeforeTime(endTime);
    hit = this.getNextCollisionBeforeTime(endTime);
  }

  // advance time to the end of this frame
  this.gameClock.setTime(endTime);
};

/**
 * @param {number} beforeTime
 * @return {?Hit}
 * @private
 */
Phy.prototype.getNextCollisionBeforeTime = function(beforeTime) {
  this.updateSledges();
  return this.collider.getNextCollisionBeforeTime(beforeTime);
};

/**
 * @param {number} beforeTime
 * @return {?SpriteTimeout}
 * @private
 */
Phy.prototype.getFirstSpriteTimeoutBeforeTime = function(beforeTime) {
  while (1) {
    var spriteTimeout = this.spriteTimeouts.getFirst();
    if (!spriteTimeout) return null;
    if (!this.isSpriteTimeoutValid(spriteTimeout)) {
      SpriteTimeout.free(this.spriteTimeouts.removeFirst());
    } else if (spriteTimeout.time >= beforeTime) {
      return null;
    } else {
      // hit is valid and in time range
      return spriteTimeout;
    }
  }
};

/**
 * @return {number}
 */
Phy.prototype.now = function() {
  return this.gameClock.getTime();
};

/**
 * @param {SpriteTimeout} spriteTimeout
 */
Phy.prototype.addSpriteTimeout = function(spriteTimeout) {
  this.spriteTimeouts.add(spriteTimeout);
};

/**
 * @param {RayScan} rayScan
 * @param {number} group
 */
Phy.prototype.rayScan = function(rayScan, group) {
  this.updateSledges();
  this.collider.rayScan(rayScan, group);
};

/**
 * An infinite-speed raycast hit test against sledges.
 * The sledges are effectively stationary for the purpose of a rayScan.
 * This class also caches the actual hit.
 * <p>
 * I expect scanning sprites to each have their own re-usable RayScan objects,
 * which they'll reset and pass, visitor-style, to the Phy for population,
 * as an in-out param
 * 
 * @param {number} x0  starting pos
 * @param {number} y0  starting pos
 * @param {number} x1  final pos
 * @param {number} y1  final pos
 * @param {number} rx  radius
 * @param {number} ry  radius
 * @constructor
 */
function RayScan(x0, y0, x1, y1, rx, ry) {
  this.reset(x0, y0, x1, y1, rx, ry);
}

RayScan.prototype.reset = function(x0, y0, x1, y1, rx, ry) {
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
  this.rx = rx;
  this.ry = ry;
  
  // cache of hit
  this.xTime = null;
  this.yTime = null;
  this.time = null;
  this.hitSledgeId = null;

  this.hitSpriteId = null;
  return this;
};

/**
 * Calculates the x or y (or neither) hit "time",
 * a number between 0 and 1 signifying how far along the p0->p1 track the hit is.
 * outPair is an array of 2 elements used to return the hitX and hitY times, if any,
 * without allocating memory.
 * @param {number} now  The current time, for the sake of the sledge that's being tested.
 */
RayScan.prototype.calcSledgeHit = function(sledge, sledgeId, now) {
  sledge.moveToTime(now);
  
  var px = this.x0 - sledge.px;
  var py = this.y0 - sledge.py;

  var vx = this.x1 - this.x0;
  var vy = this.y1 - this.y0;
  
  var rx = this.rx + sledge.rx;
  var ry = this.ry + sledge.ry;
  
  // flip so position values are >= 0
  if (px < 0) {
    px = -px;
    vx = -vx;
  }
  if (py < 0) {
    py = -py;
    vy = -vy;
  }
  
  if (vx < 0) {
    // heading left
    if (px > rx) {
      // outside on the right
      var tx = (rx - px) / vx;
      var yAtTx = py + tx * vy;
      if (Math.abs(yAtTx) <= ry) {
        this.addHitX(tx, sledgeId);
      }
    }
//    else if (py < ry * 0.999) {
//      // Overlapping to start with.
//      this.addHitX(0, sledgeId);
//    }
  }
  if (vy < 0) {
    // heading up (in screen coordinates)
    if (py > ry) {
      // outside below
      var ty = (ry - py) / vy;
      var xAtTy = px + ty * vx;
      if (Math.abs(xAtTy) <= rx) {
        // hit
        this.addHitY(ty, sledgeId);
      }
    } 
//    else if (px < rx * 0.999) {
//      // Overlapping to start with.
//      this.addHitY(0, sledgeId);
//    }
  }
};

RayScan.prototype.addHitX = function(t, sledgeId) {
  var ot = this.time || 1;
  if (t < ot) {
    this.yTime = null;
    this.xTime = this.time = t;
    this.hitSledgeId = sledgeId;
  }
};

RayScan.prototype.addHitY = function(t, sledgeId) {
  var ot = this.time || 1;
  if (t < ot) {
    this.xTime = null;
    this.yTime = this.time = t;
    this.hitSledgeId = sledgeId;
  }
};


RayScan.pool = [];
RayScan.poolSize = 0;

RayScan.alloc = function(x0, y0, x1, y1, rx, ry) {
  var retval;
  if (RayScan.poolSize) {
    retval = RayScan.pool[--RayScan.poolSize];
    retval.reset(x0, y0, x1, y1, rx, ry);
  } else {
    retval = new RayScan(x0, y0, x1, y1, rx, ry);
  }
  return retval;
};

RayScan.free = function(that) {
  RayScan.pool[RayScan.poolSize++] = that;
};

/**
 * Renders to a canvas using a Camera object to pan and zoom.
 * @param {HTMLCanvasElement} canvas
 * @param {Camera} camera
 * @constructor
 */
function Renderer(canvas, camera) {
  this.canvas = canvas;
  this.camera = camera;

  this.context = canvas.getContext('2d');
  this.context.textBaseline = 'top';
  this.lastTimeSec = (new Date()).getTime() / 1000;
  this.frameCount = 0;
  this.fps = 0;
}

Renderer.prototype.setCenter = function(x, y) {
  this.camera.setPanXY(x, y);
};

Renderer.prototype.setZoom = function(zoom) {
  this.camera.setZoom(zoom);
};

Renderer.prototype.scaleZoom = function(factor) {
  this.camera.setZoom(this.camera.getZoom() * factor);
};

Renderer.prototype.addPan = function(vec) {
  this.camera.setPanXY(
      this.camera.getPanX() + vec.x,
      this.camera.getPanY() + vec.y);
};

Renderer.prototype.getZoom = function() {
  return this.camera.getZoom();
};

Renderer.prototype.getPan = function() {
  return this.camera.getPan();
};

Renderer.prototype.getCanvasHeight = function() {
  return this.canvas.height;
};

Renderer.prototype.getCanvasWidth = function() {
  return this.canvas.width;
};

Renderer.prototype.getCanvasPageX = function() {
  return this.canvas.offsetLeft + this.canvas.clientLeft;
};

Renderer.prototype.getCanvasPageY = function() {
  return this.canvas.offsetTop + this.canvas.clientTop;
};


Renderer.prototype.setCanvasWidthHeight = function(w, h) {
  this.canvas.width = w;
  this.canvas.height = h;
};

Renderer.prototype.clear = function() {
  var c = this.context;
  c.clearRect(0, 0, this.canvas.width, this.canvas.height);
//  this.setFillStyle('rgba(0, 0, 0, 0.1)');
//  c.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
};

Renderer.prototype.transformStart = function() {
  var c = this.context;
  c.save();
  c.translate(this.canvas.width/2, this.canvas.height/2);
  var zoom = this.camera.getZoom();
  c.scale(zoom, zoom);
  c.translate(-this.camera.getPanX(), -this.camera.getPanY());
};

Renderer.prototype.transformEnd = function() {
  this.context.restore();
};

Renderer.prototype.stats = function() {
  var c = this.context;
  this.frameCount++;
  if (this.frameCount >= 30) {
    var newTimeSec = (new Date()).getTime() / 1000;
    this.fps = Math.round(this.frameCount / (newTimeSec - this.lastTimeSec));
    this.lastTimeSec = newTimeSec;
    this.frameCount = 0;
  }
  c.restore();
  this.setFillStyle('#555');
  c.font = 'bold 15px monospace';
  c.fillText(this.fps, 10, 20);
};

Renderer.prototype.setFillStyle = function(style) {
  this.context.fillStyle = style;
};

Renderer.prototype.setStrokeStyle = function(style) {
  this.context.strokeStyle = style;
};

Renderer.prototype.fillRectSprite = function(s) {
  var p = s.getPos(Vec2d.alloc());
  this.context.fillRect(
      p.x - s.rx, p.y - s.ry,
      s.rx * 2, s.ry * 2);
  Vec2d.free(p);
};

Renderer.prototype.strokeRectSprite = function(s) {
  var p = s.getPos(Vec2d.alloc());
  this.context.strokeRect(
      p.x - s.rx, p.y - s.ry,
      s.rx * 2, s.ry * 2);
  Vec2d.free(p);
};

Renderer.prototype.fillRectPosXYRadXY = function(px, py, rx, ry) {
  this.context.fillRect(
      px - rx, py - ry,
      rx * 2, ry * 2);
};

Renderer.prototype.strokeRectPosXYRadXY = function(px, py, rx, ry) {
  this.context.strokeRect(
      px - rx, py - ry,
      rx * 2, ry * 2);
};

Renderer.prototype.strokeRectCornersXYXY = function(x0, y0, x1, y1) {
  this.context.strokeRect(x0, y0, x1 - x0, y1 - y0);
};

Renderer.prototype.strokeCirclePosXYRad = function(px, py, r) {
  this.context.beginPath();
  this.context.arc(px, py, r, 0, Math.PI * 2);
  this.context.stroke();
};

Renderer.prototype.fillCirclePosXYRad = function(px, py, r) {
  this.context.beginPath();
  this.context.arc(px, py, r, 0, Math.PI * 2);
  this.context.fill();
};

Renderer.prototype.drawLineXYXY = function(x0, y0, x1, y1) {
  this.context.beginPath();
  this.context.moveTo(x0, y0);
  this.context.lineTo(x1, y1);
  this.context.stroke();
};

Renderer.prototype.drawLineVV = function(v0, v1) {
  this.context.beginPath();
  this.context.moveTo(v0.x, v0.y);
  this.context.lineTo(v1.x, v1.y);
  this.context.stroke();
};

Renderer.prototype.drawMark = function(mark) {
  this.context.lineWidth = 4;
  switch (mark.type) {
    case Mark.Type.DRAWRECT:
      this.setStrokeStyle(mark.style);
      this.context.strokeRect(mark.x0, mark.y0, mark.x1 - mark.x0, mark.y1 - mark.y0);
      break;
    case Mark.Type.FILLRECT:
      this.setFillStyle(mark.style);
      this.context.fillRect(mark.x0, mark.y0, mark.x1, mark.y1);
      break;
    case Mark.Type.LINE:
      this.context.beginPath();
      this.setStrokeStyle(mark.style);
      this.context.moveTo(mark.x0, mark.y0);
      this.context.lineTo(mark.x1, mark.y1);
      this.context.stroke();
      break;
  }
};

/**
 * @constructor
 */
function Singer() {
  this.now = 0;
  this.lastAdvanceTime = -1;
  this.pos = Vec2d.alloc();
}

Singer.prototype.setPosition = function(x, y) {
  this.pos.setXY(x, y);
};

/**
 * Override to add more computation.
 * @param {number} now
 */
Singer.prototype.advance = function(now) {
  this.now = now;
  if (this.now == this.lastAdvanceTime) return;
  // do stuff
  this.lastAdvanceTime = this.now;
};

/**
 * @param {Object} renderingVisitor  The API the Singer uses to sing with. (Vorp uses a VorpOut.)
 */
Singer.prototype.sing = function(renderingVisitor) {
  throw new Error("you gotta implement Singer.sing() in your subclasses");
};

/**
 * @return {boolean} true iff the Singer is never going to alter its song again,
 * and can be reused or garbage collected by the Gaam.
 */
Singer.prototype.isKaput = function() {
  throw new Error("isKaput is unimplemented");
};

/**
 * @param {number} px
 * @param {number} py
 * @param {number} vx
 * @param {number} vy
 * @param {number} rx
 * @param {number} ry
 * @param {number} t  time at which the sledge was at position (px, py)
 * @param {number} expiration  time beyond which the sledge will be invalid.
 * @constructor
 */
function Sledge(px, py, vx, vy, rx, ry, t, expiration) {
  Sledge.news++;
  this.reset(px, py, vx, vy, rx, ry, t, expiration);
}
Sledge.news = 0;

/**
 * @param {number} px
 * @param {number} py
 * @param {number} vx
 * @param {number} vy
 * @param {number} rx
 * @param {number} ry
 * @param {number} t  time at which the sledge was at position (px, py)
 * @param {number} expiration  time beyond which the sledge will be invalid.
 */
Sledge.prototype.reset = function(px, py, vx, vy, rx, ry, t, expiration) {
  this.px = px;
  this.py = py;
  this.resetVelocity(vx, vy);
  this.rx = rx;
  this.ry = ry;
  this.t = t;
  this.expiration = expiration;

  // Privately cache the original position & time values.
  this.opx = px;
  this.opy = py;
  this.ot = t;

  return this;
};

Sledge.prototype.resetCellCache = function() {
  // Allow CellCollider to cache cell entry/exit data, and reset it here.
  // time between entries; also time between exits
  this.cellPeriodX = null;
  this.cellPeriodY = null;
  // time of next entry
  this.cellEntryTimeX = null;
  this.cellEntryTimeY = null;
  this.frontCellIndexX = null;
  this.frontCellIndexY = null;
};

Sledge.prototype.moveToTime = function(t) {
  if (t != this.t) {
    this.px = this.opx + this.vx * (t - this.ot);
    this.py = this.opy + this.vy * (t - this.ot);
    this.t = t;
  }
};


Sledge.prototype.resetVelocity = function(vx, vy) {
  this.vx = vx;
  this.vy = vy;

  // derived data
  this.dirX = Math.sgn(vx);
  this.dirY = Math.sgn(vy);

  this.resetCellCache();
};

/**
 * Calculates the x or y (or neither) hit time, after now.
 * hit is an out-param Hit object, passed in to avoid allocating memory.
 */
Sledge.prototype.calcHitTime = function(that, out, now) {
  out.reset();
  this.moveToTime(now);
  that.moveToTime(now);

  var px = that.px - this.px;
  var py = that.py - this.py;

  var vx = that.vx - this.vx;
  var vy = that.vy - this.vy;

  var rx = this.rx + that.rx;
  var ry = this.ry + that.ry;

  // flip so position values are >= 0
  if (px < 0) {
    px = -px;
    vx = -vx;
  }
  if (py < 0) {
    py = -py;
    vy = -vy;
  }

  if (vx < 0) {
    // heading left
    if (px > rx) {
      // outside on the right
      var tx = (rx - px) / vx;
      var yAtTx = py + tx * vy;
      if (Math.abs(yAtTx) <= ry) {
        // hit
        out.xTime = tx + now;
      }
//    } else if (py < ry * 0.999) {
//      // Overlapping but headed closer to each other,
//      // so make a collision in the near future.
//      // (Making the time "now" causes infinite loops.)
//      out.xTime = now - 0.1 / vx;
    }
  }
  if (vy < 0) {
    // heading up (in screen coordinates)
    if (py > ry) {
      // outside below
      var ty = (ry - py) / vy;
      var xAtTy = px + ty * vx;
      if (Math.abs(xAtTy) <= rx) {
        // hit
        out.yTime = ty + now;
      }
//    } else if (px < rx * 0.999) {
//      // Overlapping but headed closer to each other,
//      // so make a collision in the near future.
//      // (Making the time "now" causes infinite loops.)
//      out.yTime = now - 0.1 / vy;
    }
  }

  if (!out.xTime && !out.yTime && rx > px && ry > py) {
    out.overlapping = true;
    if (vx) out.xTime = now + 0.1;//Math.abs(0.1 / vx);
    if (vy) out.yTime = now + 0.1;//Math.abs(0.1 / vy);
  }


  // only set one, even if they're both set by "overlap" logic
  if (out.xTime && out.yTime) {
    if (out.xTime < out.yTime) {
      out.yTime = null;
    } else {
      out.xTime = null;
    }
  }
};

///**
// * Determines whether two sledges overlap at 'time'.
// * Treats radius as inclusive.
// */
//Sledge.prototype.overlaps = function(that, time) {
//  this.moveToTime(time);
//  that.moveToTime(time);
//  return Math.abs(this.px - that.px) <= this.rx + that.rx &&
//      Math.abs(this.py - that.py) <= this.ry + that.ry;
//};

Sledge.pool = [];
Sledge.poolSize = 0;


/**
 * @param {number} px
 * @param {number} py
 * @param {number} vx
 * @param {number} vy
 * @param {number} rx
 * @param {number} ry
 * @param {number} t  time at which the sledge was at position (px, py)
 * @param {number} expiration  time beyond which the sledge will be invalid.
 * @return {Sledge}
 */
Sledge.alloc = function(px, py, vx, vy, rx, ry, t, expiration) {
  var retval;
  if (Sledge.poolSize) {
    retval = Sledge.pool[--Sledge.poolSize];
    retval.reset(px, py, vx, vy, rx, ry, t, expiration);
  } else {
    retval = new Sledge(px, py, vx, vy, rx, ry, t, expiration);
  }
  return retval;
};

/**
 * @param {Sledge} sledge
 */
Sledge.free = function(sledge) {
  Sledge.pool[Sledge.poolSize++] = sledge;
};

/**
 * A set of Sprites that do not have valid sledges.
 * This is used by Phy to defer the deletion of obsolete sledges,
 * and the creation of new sledges, until needed for collision detection or rayscans.
 * This is more efficient than keeping the sledges constantly up-to-date.
 *
 * @constructor
 */
function SledgeInvalidator() {
  this.spriteIds = {};
}

SledgeInvalidator.prototype.add = function(spriteId) {
  if (spriteId) this.spriteIds[spriteId] = true;
};

SledgeInvalidator.prototype.contains = function(spriteId) {
  return !!this.spriteIds[spriteId];
};

SledgeInvalidator.prototype.remove = function (spriteId) {
  delete this.spriteIds[spriteId];
};

/**
 * Utils for producing sound effects positioned in 2D.
 * @param {AudioContext} audioContext
 * @constructor
 */
function SoundFx(audioContext) {
  this.ctx = audioContext;
  if (this.ctx) {
    if (!(this.ctx.createGain || this.ctx.createGainNode) || !this.ctx.createOscillator) {
      this.ctx = null;
    }
  }
  if (this.ctx) {
    this.masterGainNode = this.createGain();
    this.masterGainNode.connect(this.ctx.destination);
  }
}

SoundFx.Z_DISTANCE = 200;

SoundFx.audioContext = null;

SoundFx.createInstance = function() {
  if (!SoundFx.audioContext) {
    if (typeof AudioContext !== 'undefined') {
      SoundFx.audioContext = new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
      SoundFx.audioContext = new webkitAudioContext();
    }
  }
  return new SoundFx(SoundFx.audioContext);
};

SoundFx.prototype.createGain = function() {
  if (this.ctx.createGain) {
    return this.ctx.createGain();
  }
  if (this.ctx.createGainNode) {
    return this.ctx.createGainNode();
  }
  return null;
};

SoundFx.prototype.setCenter = function(x, y) {
  if (!this.ctx) return;
  this.ctx.listener.setPosition(x, y, SoundFx.Z_DISTANCE);
};

SoundFx.prototype.getMasterGainNode = function() {
  return this.masterGainNode;
};

/**
 * Make a simple one-shot sound.
 * @param {Vec2d} pos
 * @param {number} vol
 * @param {number} attack
 * @param {number} decay
 * @param {number} freq1
 * @param {number} freq2
 * @param {String} type Wave type string (square, sine, etc)
 */
SoundFx.prototype.sound = function(pos, vol, attack, decay, freq1, freq2, type, opt_delay) {
  var delay = opt_delay || 0;
  if (!this.ctx) return;
  vol *= SoundFx.Z_DISTANCE;
  var c = this.ctx;
  var t0 = c.currentTime + delay;
  var t1 = t0 + attack + decay + 0.1;
  var gain = this.createGain();
  gain.gain.value = 0;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + attack);
  gain.gain.linearRampToValueAtTime(0, t0 + attack + decay);

  var osc = c.createOscillator();
  osc.frequency.setValueAtTime(freq1, t0);
  osc.frequency.exponentialRampToValueAtTime(freq2, t0 + attack + decay);
  osc.type = type;
  if (osc.start) {
    osc.start(t0);
  } else if (osc.noteOn) {
    osc.noteOn(t0);
  }
  if (osc.stop) {
    osc.stop(t1);
  } else if (osc.noteOff) {
    osc.noteOff(t1);
  }

  var panner = c.createPanner();
  panner.setPosition(pos.x, pos.y, 0);

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(this.masterGainNode);
};

SoundFx.prototype.disconnect = function() {
  if (this.masterGainNode) {
    this.masterGainNode.gain = 0;
    this.masterGainNode.disconnect();
    this.masterGainNode = null;
  }
};


/**
 * A Sprite is an object in the game world.
 * @param {SpriteTemplate=} spriteTemplate null for new prototype sprites
 * @constructor
 */
function Sprite(spriteTemplate) {
  this.acceleration = new Vec2d();
  this.pos0 = new Vec2d();
  this.vel = new Vec2d();
  this.rad = new Vec2d();

  // logic link buffers
  this.inputs = [];
  this.inputCounts = [];
  this.outputs = [];
  this.reset(spriteTemplate);
  this.clearInputs();
  this.clearOutputs();
}

Sprite.nextId = 1;

/**
 * @param {SpriteTemplate=} spriteTemplate
 */
Sprite.prototype.reset = function(spriteTemplate) {
  if (spriteTemplate) {
    // TODO: If Sprite objs ever get reused, clear out all the fields below.
    this.gameClock = spriteTemplate.gameClock;
    this.sledgeInvalidator = spriteTemplate.sledgeInvalidator;
    this.world = spriteTemplate.world;
    this.painter = spriteTemplate.painter;
    this.singer = spriteTemplate.singer;
    // pos0 is the position at time t0. Use getPos() to get the current position.
    this.pos0.set(spriteTemplate.pos);
    this.vel.set(spriteTemplate.vel);
    this.rad.set(spriteTemplate.rad);
    this.mass = spriteTemplate.mass;
    this.group = spriteTemplate.group;
    this.sledgeDuration = spriteTemplate.sledgeDuration;

    /** @type {number} */
    this.t0 = this.now();
  }
  this.id = Sprite.nextId++;
  this.acceleration.setXY(0, 0);
  this.inputs.length = 0;
  this.inputCounts.length = 0;
  this.outputs.length = 0;
};

/**
 * This is where sprites rayscan, set acceleration, and plan to spawn or remove
 * other sprites, etc.
 * @return commands for the game to consume, like killPlayer, exitToUrl, etc.
 */
Sprite.prototype.act = function() {
  return null;
};


/**
 * Friction utility.
 * @param {number} friction like 0.1 for 10% friction.
 */
Sprite.prototype.addFriction = function(friction) {
  var accel = this.getVel(Vec2d.alloc());
  accel.scale(-friction);
  this.accelerate(accel);
  Vec2d.free(accel);
};


/**
 * This is where sprites apply their acceleration and other changes.
 */
Sprite.prototype.affect = function() {
  if (!this.acceleration.isZero()) {
    this.addVel(this.acceleration);
    this.acceleration.setXY(0, 0);
  }
};

/**
 * Convenience func to add acceleration.
 * @param {Vec2d} v
 */
Sprite.prototype.accelerate = function(v) {
  this.acceleration.add(v);
};

/**
 * @return {Painter}
 */
Sprite.prototype.getPainter = function() {
  return this.painter;
};

/**
 * @return {Singer}
 */
Sprite.prototype.getSinger = function() {
  return this.singer;
};

/**
 * @param {SpriteTimeout} spriteTimeout
 * @return game commands
 */
Sprite.prototype.onTimeout = function(spriteTimeout) {
  return null;
};

/**
 * @param {Sprite} hitSprite
 * @return game commands
 */
Sprite.prototype.onSpriteHit = function(hitSprite) {
  return null;
};

Sprite.prototype.setVel = function(vec) {
  if (this.vel.equals(vec)) return;
  var now = this.now();
  if (this.t0 != now) {
    // Move position along path, to the current time.
    var temp = Vec2d.alloc();
    temp.set(this.vel).scale(now - this.t0);
    this.pos0.add(temp);
    Vec2d.free(temp);
    this.t0 = now;
  }
  this.vel.set(vec);
  this.invalidateSledge();
};

/**
 * Directly add velocity.
 * Call from onSpriteHit(), but not from act() or affect().
 * @param {Vec2d} vec
 */
Sprite.prototype.addVel = function(vec) {
  var temp = Vec2d.alloc();
  temp.set(vec).add(this.vel);
  this.setVel(temp);
  Vec2d.free(temp);
};

/**
 * Directly change position.
 * Call from onSpriteHit(), but not from act() or affect().
 * @param {Vec2d} vec
 */
Sprite.prototype.setPos = function(vec) {
  this.pos0.set(vec);
  this.t0 = this.now();
  this.invalidateSledge();
};

/**
 * Directly change position.
 * Call from onSpriteHit(), but not from act() or affect().
 */
Sprite.prototype.setPosXY = function(x, y) {
  this.pos0.setXY(x, y);
  this.t0 = this.now();
  this.invalidateSledge();
};

/**
 * Directly change radius.
 */
Sprite.prototype.setRad = function(vec) {
  this.rad.set(vec);
  this.invalidateSledge();
};

/**
 * Directly change radius.
 */
Sprite.prototype.setRadXY = function(x, y) {
  this.rad.setXY(x, y);
  this.invalidateSledge();
};

/**
 * @param {Vec2d} vecOut
 * @returns {Vec2d}
 */
Sprite.prototype.getPos = function(vecOut) {
  return vecOut
      .set(this.vel)
      .scale(this.now() - this.t0)
      .add(this.pos0);
};

/**
 * @param {Vec2d} vecOut
 * @returns {Vec2d}
 */
Sprite.prototype.getVel = function(vecOut) {
  return vecOut.set(this.vel);
};

/**
 * @param {Vec2d} vecOut
 * @returns {Vec2d}
 */
Sprite.prototype.getRad = function(vecOut) {
  return vecOut.set(this.rad);
};

/**
 * Notifies physics system that this sprite's sledge is invalid.
 */
Sprite.prototype.invalidateSledge = function() {
  this.sledgeInvalidator.add(this.id);
};

/**
 * Allocates and returns a new sledge.
 * Also logs a paint event.
 * @return {Sledge}
 */
Sprite.prototype.createSledge = function() {
  var sledge = Sledge.alloc(
      this.pos0.x, this.pos0.y,
      this.vel.x, this.vel.y,
      this.rad.x, this.rad.y,
      this.t0,
      this.now() + this.sledgeDuration);

  if (this.painter) {
    sledge.moveToTime(this.now());
    var paintEvent = PaintEvent.alloc(
        PaintEvent.Type.PATH, this.now(),
        sledge.px, sledge.py,
        sledge.vx, sledge.vy,
        sledge.rx, sledge.ry);
    this.painter.addEvent(paintEvent);
  }
  return sledge;
};

Sprite.prototype.addKaputPaintEvent = function() {
  var p = this.getPos(Vec2d.alloc());
  this.painter.addEvent(PaintEvent.alloc(
      PaintEvent.Type.KAPUT, this.now(),
      p.x, p.y,
      0, 0,
      this.rad.x, this.rad.y));
  Vec2d.free(p);
};

/**
 * @return {number}
 */
Sprite.prototype.now = function() {
  return this.gameClock.getTime();
};

/**
 * @return {number}
 */
Sprite.prototype.area = function() {
  return this.rad.x * this.rad.y;
};

/**
 * @enum {number}
 */
Sprite.prototype.inputIds = {};

/**
 * @enum {number}
 */
Sprite.prototype.outputIds = {};

Sprite.prototype.clearInputs = function() {
  for (var id in this.inputIds) {
    var index = this.inputIds[id];
    this.inputs[index] = 0;
    this.inputCounts[index] = 0;
  }
};

Sprite.prototype.clearOutputs = function() {
  for (var id in this.outputIds) {
    var index = this.outputIds[id];
    this.outputs[index] = 0;
  }
};

Sprite.prototype.addToInput = function(inputIndex, outputValue) {
  this.inputs[inputIndex] += outputValue;
  this.inputCounts[inputIndex]++;
};

Sprite.prototype.getInputOr = function(inputIndex) {
  return this.inputs[inputIndex];
};

Sprite.prototype.getInputAnd = function(inputIndex) {
  return this.inputCounts[inputIndex] && this.inputs[inputIndex] >= this.inputCounts[inputIndex];
};

/**
 * @constructor
 */
function SpriteTemplate() {
  this.gameClock = null;
  this.sledgeInvalidator = null;
  this.world = null;
  this.painter = null;
  this.singer = null;
  this.pos = new Vec2d();
  this.vel = new Vec2d();
  this.rad = new Vec2d();
  this.mass = null;
  this.group = null;
  this.sledgeDuration = null;
}

SpriteTemplate.prototype.setGameClock = function(gameClock) {
  this.gameClock = gameClock;
  return this;
};

SpriteTemplate.prototype.setSledgeInvalidator = function(sledgeInvalidator) {
  this.sledgeInvalidator = sledgeInvalidator;
  return this;
};

SpriteTemplate.prototype.setWorld = function(world) {
  this.world = world;
  return this;
};

SpriteTemplate.prototype.setSinger = function(singer) {
  this.singer = singer;
  return this;
};

SpriteTemplate.prototype.setPainter = function(painter) {
  this.painter = painter;
  return this;
};

SpriteTemplate.prototype.setPos = function(pos) {
  this.pos.set(pos);
  return this;
};

SpriteTemplate.prototype.setVel = function(vel) {
  this.vel.set(vel);
  return this;
};

SpriteTemplate.prototype.setRad = function(rad) {
  this.rad.set(rad);
  return this;
};

SpriteTemplate.prototype.setPosXY = function(x, y) {
  this.pos.setXY(x, y);
  return this;
};

SpriteTemplate.prototype.setVelXY = function(x, y) {
  this.vel.setXY(x, y);
  return this;
};

SpriteTemplate.prototype.setRadXY = function(x, y) {
  this.rad.setXY(x, y);
  return this;
};

SpriteTemplate.prototype.setMass = function(mass) {
  this.mass = mass;
  return this;
};

SpriteTemplate.prototype.setGroup = function(group) {
  this.group = group;
  return this;
};

SpriteTemplate.prototype.setSledgeDuration = function(sledgeDuration) {
  this.sledgeDuration = sledgeDuration;
  return this;
};

/**
 * @constructor
 * @param {number} time
 * @param {number} spriteId
 * @param {number} actionId
 */
function SpriteTimeout(time, spriteId, actionId) {
  this.reset(time, spriteId, actionId);
}

SpriteTimeout.prototype.reset = function(time, spriteId, actionId) {
  this.time = time;
  this.spriteId = spriteId;
  this.actionId = actionId;

  this.next = null;
  return this;
};

SpriteTimeout.pool = [];
SpriteTimeout.poolSize = 0;

SpriteTimeout.alloc = function(time, spriteId, actionId) {
  var retval;
  if (SpriteTimeout.poolSize) {
    retval = SpriteTimeout.pool[--SpriteTimeout.poolSize];
    retval.reset(time, spriteId, actionId);
  } else {
    retval = new SpriteTimeout(time, spriteId, actionId);
  }
  return retval;
};

SpriteTimeout.free = function(hit) {
  SpriteTimeout.pool[SpriteTimeout.poolSize++] = hit;
};

/**
 * This is an attempt at making collision response code modular.
 * But it kinda sucks.
 * @constructor
 */
function Wham() {
  this.v1 = new Vec2d();
  this.v2 = new Vec2d();
}

/**
 * Calculates acelerations without altering anything except the out vecs.
 */
Wham.prototype.calcAcceleration = function(sprite1, sprite2, xTime, yTime, grip, elasticity, out) {
  if (xTime && yTime) {
    throw 'xTime, yTime both set: ' + xTime + ', ' + yTime;
  }
  var m1 = sprite1.mass;
  var m2 = sprite2.mass;
  var v1 = sprite1.getVel(this.v1);
  var v2 = sprite2.getVel(this.v2);
  var elasticity = Math.min(
      sprite1.elasticity || elasticity,
      sprite2.elasticity || elasticity);

  // initial acceleration
  var a1 = out[0];
  var a2 = out[1];
  a1.setXY(0, 0);
  a2.setXY(0, 0);

  if (m1 == Infinity && m2 != Infinity) {
    if (xTime) {
      a2.x = -v2.x * (1 + elasticity);
    }
    if (yTime) {
      a2.y = -v2.y * (1 + elasticity);
    }
  } else if (m2 == Infinity && m1 != Infinity) {
    if (xTime) {
      a1.x = -v1.x * (1 + elasticity);
    }
    if (yTime) {
      a1.y = -v1.y * (1 + elasticity);
    }
  } else if (m1 && m2 && m1 != Infinity && m2 != Infinity) {

    // momentums
    var ux1 = m1 * v1.x;
    var uy1 = m1 * v1.y;
    var ux2 = m2 * v2.x;
    var uy2 = m2 * v2.y;
    var ux = ux1 + ux2;
    var uy = uy1 + uy2;

    // inelastic collision final velocity
    var vx = ux / (m1 + m2);
    var vy = uy / (m1 + m2);

    // If acceleration for inelastic collision is "a"
    // then a completely elastic collision's acceleration would be 2*a.
    // Along the other axis, acceleration is 0 to a.
    if (xTime) {
      a1.setXY((vx - v1.x) * (1 + elasticity), (vy - v1.y) * grip);
      a2.setXY((vx - v2.x) * (1 + elasticity), (vy - v2.y) * grip);
    } else {
      a1.setXY((vx - v1.x) * grip, (vy - v1.y) * (1 + elasticity));
      a2.setXY((vx - v2.x) * grip, (vy - v2.y) * (1 + elasticity));
    }
  }
};

/**
 * Makes wub-wub noises continuously, with a single adjustable value that controls the
 * drone frequency, the "wub" gain modulation frequency, and the final gain.
 * Good for motor noises and stuff.
 * @param droneFreq0
 * @param droneFreq1
 * @param wubFreq0
 * @param wubFreq1
 * @param gain0
 * @param gain1
 * @param {String=} opt_droneType square, sine, etc.
 * @constructor
 */
function WubOscillator(droneFreq0, droneFreq1, wubFreq0, wubFreq1, gain0, gain1, opt_droneType) {
  this.droneFreq0 = droneFreq0;
  this.droneFreq1 = droneFreq1;
  this.wubFreq0 = wubFreq0;
  this.wubFreq1 = wubFreq1;
  this.gain0 = gain0;
  this.gain1 = gain1;
  this.droneType = opt_droneType || 'square';
}

WubOscillator.prototype.createNodes = function(ctx) {
  this.wubOsc = ctx.createOscillator();
  if (!this.wubOsc.start && this.wubOsc.noteOn) this.wubOsc.start = this.wubOsc.noteOn;
  if (!this.wubOsc.stop && this.wubOsc.noteOff) this.wubOsc.start = this.wubOsc.noteOff;
  this.wubOsc.type = 'sine';

  this.wubGain = this.createGain(ctx);

  this.droneOsc = ctx.createOscillator();
  if (!this.droneOsc.start && this.droneOsc.noteOn) this.droneOsc.start = this.droneOsc.noteOn;
  if (!this.droneOsc.stop && this.droneOsc.noteOff) this.droneOsc.start = this.droneOsc.noteOff;
  this.droneOsc.type = this.droneType;

  this.masterGain = this.createGain(ctx);

  this.droneOsc.connect(this.wubGain);
  this.wubOsc.connect(this.wubGain.gain);
  this.wubGain.connect(this.masterGain);
};

WubOscillator.prototype.createGain = function(ctx) {
  if (ctx.createGain) {
    return ctx.createGain();
  }
  if (ctx.createGainNode) {
    return ctx.createGainNode();
  }
  return null;
};



WubOscillator.prototype.connect = function(dest) {
  this.masterGain.connect(dest);
};

WubOscillator.prototype.setValue = function(v) {
  this.droneOsc.frequency.value = (this.droneFreq1 - this.droneFreq0) * v + this.droneFreq0;
  this.wubOsc.frequency.value = (this.wubFreq1 - this.wubFreq0) * v + this.wubFreq0;
  this.masterGain.gain.value = (this.gain1 - this.gain0) * v + this.gain0;
};

WubOscillator.prototype.linearRampToValueAtTime = function(v, t) {
  this.droneOsc.frequency.linearRampToValueAtTime((this.droneFreq1 - this.droneFreq0) * v + this.droneFreq0, t);
  this.wubOsc.frequency.linearRampToValueAtTime((this.wubFreq1 - this.wubFreq0) * v + this.wubFreq0, t);
  this.masterGain.gain.linearRampToValueAtTime((this.gain1 - this.gain0) * v + this.gain0, t);
};

WubOscillator.prototype.start = function(t) {
  this.wubOsc.start(t);
  this.droneOsc.start(t);
};

WubOscillator.prototype.stop = function(t) {
  this.wubOsc.stop(t);
  this.droneOsc.stop(t);
};

/**
 * @param {number} timestamp
 * @param {string} id
 * @param {GrafModel} model
 * @constructor
 */
function Clip(timestamp, id, model) {
  this.timestamp = timestamp;
  this.id = id;
  this.model = model;
}

/**
 * Creates a clip from a ClipListOp of type SET_CLIP.
 * @param {ClipListOp} op
 * @return {Clip}
 */
Clip.createClipFromOp = function(op) {
  if (op.type != ClipListOp.Type.SET_CLIP) {
    throw Error('expected op.type ' + ClipListOp.Type.SET_CLIP + ' but got ' + op.type);
  }
  var grafModel = new GrafModel();
  grafModel.applyOps(op.grafOps);
  return new Clip(op.timestamp, op.id, grafModel);
};

Clip.prototype.getModel = function() {
  return this.model;
};

/**
 * The UI, model, DOM thingy, storage listener, etc for a Ged clipboard.
 * @param {GrafRend} grafRend
 * @param {*} opt_storage
 * @param {string=} opt_storageKey
 * @constructor
 */
function Clipboard(grafRend, opt_storage, opt_storageKey) {
  this.grafRend = grafRend;
  this.storage = opt_storage || null;
  this.storageKey = opt_storageKey || null;

  this.listeners = null;
}

Clipboard.prototype.start = function() {
  if (this.storageKey && this.storage) {
    var opString = this.storage.getItem(this.storageKey);
    if (opString) {
      var ops = JSON.parse(opString);
      var model = new GrafModel();
      model.applyOps(ops);
      this.setInternal(model);
    }
  }
  if (!this.listeners) {
    this.listeners = new plex.event.ListenerTracker();
    if (this.storageKey) {
      this.listeners.addListener(window, 'storage', this.getStorageListener());
    }
  }
};

Clipboard.prototype.stop = function() {
  if (this.listeners) {
    this.listeners.removeAllListeners();
    this.listeners = null;
  }
};

Clipboard.prototype.setModel = function(model) {
  if (this.storage && this.storageKey) {
    this.storage.setItem(this.storageKey, JSON.stringify(model.createOps()));
  }
  this.setInternal(model);
};

Clipboard.prototype.getModel = function() {
  return this.grafRend.getModel();
};

/////////////
// private //
/////////////

Clipboard.prototype.getStorageListener = function() {
  var self = this;
  return function(e) {
    if (e.key != self.storageKey) return;
    var ops = JSON.parse(e.newValue);
    var model = new GrafModel();
    model.applyOps(ops);
    self.setInternal(model);
  };
};

Clipboard.prototype.setInternal = function(model) {
  this.grafRend.setModelContents(model);
  this.grafRend.frameContents(0.9);
  this.grafRend.draw();
};

/**
 * @constructor
 */
function ClipList() {
  // Map from ID to clip
  this.clips = {};
  // List of IDs in display-order.
  this.orderedIds = [];
}

ClipList.prototype.applyOp = function(clipListOp) {
  switch (clipListOp.type) {
    case ClipListOp.Type.SET_CLIP:
      this.addClip(clipListOp.id, Clip.createClipFromOp(clipListOp));
      break;
    case ClipListOp.Type.DELETE_CLIP:
      this.removeClip(clipListOp.id);
      break;
    default:
      throw Error("unhandled clipListOp.type: " + clipListOp.type);
  }
};

ClipList.prototype.getClipById = function(id) {
  return this.clips[id];
};

ClipList.prototype.getClipByOrder = function(index) {
  return this.getClipById(this.orderedIds[index]);
};

ClipList.prototype.addClip = function(id, clip) {
  if (id in this.clips) {
    // TODO: Maybe make this a warning+ignore? It might be OK for add ops to be applied more than once.
    throw Error('clipListOp.id ' + id + ' is already in this.clips');
  }
  this.clips[id] = clip;
  this.orderedIds.push(id);
  this.sortOrderedIds();
};

ClipList.prototype.removeClip = function(id) {
  delete this.clips[id];
  var index = this.orderedIds.indexOf(id);
  if (index >= 0) {
    this.orderedIds.splice(index, 1);
  }
};

/**
 * Sorts the ordered ID list in reverse timestamp order (newest first).
 */
ClipList.prototype.sortOrderedIds = function() {
  var self = this;
  this.orderedIds.sort(function(id1, id2) {
    return self.clips[id2].timestamp - self.clips[id1].timestamp;
  });
};

/**
 * This class is just a namespace for static values and methods.
 * A real cliplist op is JSON, like so:
 *
 * { type:”addClip”, timestamp:1234567890, id:"clientx-456", grafOps: [{...}, {...}, {...} ...] }
 * { type:”removeClip”, id:"clientx-456" }
 * Unlike GrafOps, ClipListOps are not reversible.
 * @param {ClipListOp.Type} type
 * @param {string} id
 * @param {number=} opt_timestamp
 * @param {Object=} opt_grafOps
 *
 * @constructor
 */
function ClipListOp(type, id, opt_timestamp, opt_grafOps) {
  this.type = type;
  this.id = id;
  if (typeof opt_timestamp != "undefined") this.timestamp = opt_timestamp;
  if (typeof opt_grafOps != "undefined") this.grafOps = opt_grafOps;
}

/**
 * @enum {string}
 */
ClipListOp.Type = {
  SET_CLIP: 'setClip',
  DELETE_CLIP: 'deleteClip'
};

ClipListOp.createAdd = function(timestamp, id, grafOps) {
  return new ClipListOp(ClipListOp.Type.SET_CLIP, id, timestamp, grafOps);
};

ClipListOp.createRemove = function(id) {
  return new ClipListOp(ClipListOp.Type.DELETE_CLIP, id);
};

/**
 * Widget for rendering and selecting a menu model clips.
 * @param {ClipList} clipList
 * @param {Object} pluginFactory with create(canvas) that returns a plugin
 * @param {Element} wrapper
 * @constructor
 */
function ClipMenu(clipList, pluginFactory, wrapper) {
  this.clipList = clipList;
  this.pluginFactory = pluginFactory;
  this.wrapper = wrapper;

  this.onSelect = null;
}

ClipMenu.prototype.render = function() {
  var clip;
  for (var i = 0; clip = this.clipList.getClipByOrder(i); i++) {
    var canvas = plex.dom.ce('canvas', this.wrapper);
    canvas.className = 'gedSysClip';
    canvas.width = 200;
    canvas.height = 150;
    canvas.onclick = this.getClickHandler(clip.id);
    var renderer = new Renderer(canvas, new Camera());
    var grafRend = new GrafRend(
        this.pluginFactory.create(renderer),
        renderer,
        new GrafGeom(clip.model));
    grafRend.frameContents(0.8);
    grafRend.draw();
  }
};

ClipMenu.prototype.hide = function() {
  this.wrapper.style.display = 'none';
};

ClipMenu.prototype.toggle = function() {
  this.wrapper.style.display = this.wrapper.style.display == 'none' ? 'block' : 'none';
};

ClipMenu.prototype.setOnSelect = function(fn) {
  this.onSelect = fn;
};

ClipMenu.prototype.getClickHandler = function(clipId) {
  var self = this;
  return function() {
    var clip = self.clipList.getClipById(clipId);
    if (self.onSelect) {
      self.onSelect(clip);
    }
  };
};

/**
 * Help widget
 * @param {GedMsgs} msgs
 * @param {plex.Keys} keys
 * @param {GrafUiKeyCombos} keyCombos
 * @constructor
 */
function GedHelp(msgs, keys, keyCombos) {
  this.msgs = msgs;
  this.keys = keys;
  this.keyCombos = keyCombos;
}

/**
 * @return {string}
 */
GedHelp.prototype.formatHtml = function() {
  var self = this;
  var helpMsgs = this.msgs.help;
  var html = [];

  function h() {
    html.push.apply(html, arguments);
  }

  function section(title, items) {
    h('<h1 class="gedHelpTitle">', title, '</h1>');
    h('<ul class="gedHelpList">');
    for (var i = 0; i < items.length; i++) {
      h('<li class="gedHelpListItem">', items[i], '</li>');
    }
    h('</ul>');
  }

  section(helpMsgs.MOUSE_CONTROLS, [
    helpMsgs.MOUSE_PAN,
    helpMsgs.MOUSE_ZOOM
  ]);

  function kb(msg, combos) {
    var comboHtmls = [];
    for (var i = 0; i < combos.length; i++) {
      var combo = combos[i];
      var shift = plex.array.contains(combo.modifiers, plex.KeyModifier.SHIFT);
      var keyName = self.keys.getNameForKeyCode(combo.keyCode);
      comboHtmls.push(
          '<span class="gedHelpKeyCombo">' +
          (shift ? helpMsgs.SHIFT_MODIFIER_FN(keyName) : keyName) +
          '</span>'
      );
    }
    return helpMsgs.KEYBOARD_CONTROL_FN(comboHtmls, msg);
  }

  var allCombos = this.keyCombos.getAll();
  section(helpMsgs.KEYBOARD_CONTROLS, [
      kb(helpMsgs.SELECT, allCombos[GrafUi.Action.SELECT]),
      kb(helpMsgs.UNSELECT, allCombos[GrafUi.Action.UNSELECT]),
      kb(helpMsgs.ADD_SELECTIONS, allCombos[GrafUi.Action.ADD_SELECTIONS]),
      kb(helpMsgs.SUBTRACT_SELECTIONS, allCombos[GrafUi.Action.SUBTRACT_SELECTIONS]),
      kb(helpMsgs.LINK, allCombos[GrafUi.Action.LINK]),
      kb(helpMsgs.DELETE, allCombos[GrafUi.Action.DELETE]),
      kb(helpMsgs.COPY, allCombos[GrafUi.Action.COPY]),
      kb(helpMsgs.PASTE, allCombos[GrafUi.Action.PASTE]),
      kb(helpMsgs.UNDO, allCombos[GrafUi.Action.UNDO]),
      kb(helpMsgs.REDO, allCombos[GrafUi.Action.REDO]),
      kb(helpMsgs.TOGGLE_CLIP_MENU, allCombos[GrafUi.Action.TOGGLE_CLIP_MENU])
  ]);

  return html.join('');
};

GedMsgs = {
  TOGGLE_CLIP_MENU: 'clip menu',
  help: {
    HELP: 'help',
    MOUSE_CONTROLS: 'mouse',
    MOUSE_PAN: '<span class="getHelpMouseControl">Pan</span> by dragging the canvas, while holding the mouse button down.',
    MOUSE_ZOOM: '<span class="getHelpMouseControl">Zoom</span> by scrolling with the mousewheel, or using the two-finger trackpad up/down gesture, or whatevs.',

    KEYBOARD_CONTROLS: 'keyboard',
    KEYBOARD_CONTROL_FN: function(keyCombos, desc) {return keyCombos.join(' or ') + ': ' + desc;},
    SHIFT_MODIFIER_FN: function(keyName) {return 'shift + ' + keyName;},

    SELECT: 'Select. Hold the key down and move the pointer to create a selection box, ' +
        'and release the key to select all the highlighted parts and jacks. ' +
        'Or just tap the key to select whatever you are pointing at. '+
        'The editor remembers your previous selections, which is strange but powerful.' +
        '<br>Nerds: It\'s selections.push()',
    UNSELECT: 'Unselect. The current selection is forgotten, ' +
        'and the previous selection becomes the current one. ' +
        '<br>Nerds: That\'s selections.pop()',
    ADD_SELECTIONS: 'Add the current selection to the previous selection. ' +
        '<br>My people: Think push(add(pop(), pop())',
    SUBTRACT_SELECTIONS: 'Subtract the current selection from the previous selection. ' +
        '<br>You know, push(subtract(pop(), pop()))',

    LINK: 'Link any input and output jacks in the current selection. ' +
        'Input jacks are on top of parts. Output jacks are on the bottom.',
    DELETE: 'Delete parts in the current selection, or delete links to selected jacks.',

    COPY: 'Copy the current selection to clipboard.',
    PASTE: 'Paste. Hold the key down and move the pointer to position the clip, ' +
        'and release the key to drop the clip in place.',

    UNDO: 'Undo',
    REDO: 'Redo',

    TOGGLE_CLIP_MENU: 'Toggle the Clip Menu',

    $:''
  }
};

/**
 * App-specific plugin for a GedUi.
 * @constructor
 */
function GedUiPlugin() {
}

/**
 * Called when the model has been altered,
 * which means it's possible the transformed state is stale.
 * This may be called several times between renderings, or
 * zero times. So invalidate the rendered data, and wait for a
 * "render(model)" call before regenerating the app state.
 */
GedUiPlugin.prototype.invalidate = function() {
  throw Error('implement me');
};

/**
 * The Ged rendering loop says its time to draw.
 * @param {GrafModel} grafModel to render.
 */
GedUiPlugin.prototype.render = function(grafModel) {
  throw Error('implement me');
};

/**
 * Supports high-level queries and operations on a GrafModel,
 * optionally backed by an OpStor.
 *
 * It hides all GrafOp stuff from clients.
 *
 * State:
 * - Maintains a GrafModel throughout all op changes from the client and from stor events.
 * - Selection state
 * - Drag-operation state?
 *
 * Queries:
 * - Provides the GrafModel (read-only, honor system) to clients.
 * - Handles spacial queries, like "get closest thing".
 *
 * Mutations:
 * - Handles high-level operations like drag, copy/paste, link, edit field, etc,
 *   so the UI never has to worry about operations.
 * - Stages continuous-preview mutations like dragging, without flooding LocalStorage with changes.
 *
 * Notification:
 * - PubSub says when the model changed due to another tab or something.
 *
 * @param {GrafModel} model  The already-populated model.
 * @param {OpStor=} opt_opStor  Optional OpStor to write to (and subscribe to & read from)
 * @constructor
 */
function GrafEd(model, opt_opStor) {
  this.model = model;
  this.geom = new GrafGeom(model);
  this.opStor = opt_opStor || null;

  this.selStack = new SelStack();

  this.selectionStart = null;
  this.selectionEnd = null;

  this.dragSelectionStart = null;
  this.dragSelectionEnd = null;

  this.dragPartId = null;
  this.dragPartStart = null;
  this.dragPartEnd = null;

  this.dragJackId = null;
  this.dragJackEnd = null;

  // A list of GrafOps that are reflected in the GrafModel, but not commited to the OpStor.
  // Used by continuous-preview changes, like dragging parts
  this.stagedOps = [];

  // for this to pass to OpStor
  this.opStorCallback = null;
  this.highestOpStorIndex = -1;

  // for GrafUi to set
  this.invalidationCallback = null;

  this.undoStack = [];
  this.redoStack = [];
}

GrafEd.createFromOpStor = function(opStor) {
  var grafEd = new GrafEd(new GrafModel(), opStor);
  grafEd.syncOps();
  return grafEd;
};

GrafEd.prototype.getModel = function() {
  return this.model;
};

GrafEd.prototype.getPart = function(id) {
  return this.model.getPart(id);
};

GrafEd.prototype.getJack = function(id) {
  return this.model.getJack(id);
};

/**
 * @param {GrafModel} clipModel
 * @param {Vec2d} offset
 * @return {Object} a map from the clipModel IDs to the level's model IDs
 */
GrafEd.prototype.pasteWithOffset = function(clipModel, offset) {
  var tempModel = new GrafModel();
  tempModel.addModel(clipModel);
  for (var partId in tempModel.parts) {
    var part = tempModel.parts[partId];
    part.x += offset.x;
    part.y += offset.y;
  }
  return this.paste(tempModel);
};

/**
 * @param {GrafModel} clipModel
 * @return {Object} a map from the clipModel IDs to the level's model IDs
 */
GrafEd.prototype.paste = function(clipModel) {
  var ops = clipModel.createOps();
  var idMap = this.model.rewriteOpIds(ops);
  this.commitOps(ops);

  this.selectByIds(plex.object.values(idMap), true);

  return idMap;
};

/**
 * Instantly commits reversible chunk of data edits.
 * @param objId id of obj whose data we'll edit
 * @param changes An object of key/value pairs representing "set" commands
 */
GrafEd.prototype.editObjData = function(objId, changes) {
  var ops = [];
  var obj = this.model.objs[objId];
  for (var key in changes) {
    ops.push({
      type: GrafOp.Type.SET_DATA,
      id: objId,
      key: key,
      oldValue: obj.data[key],
      value: changes[key]
    });
  }
  this.commitOps(ops);
};

/**
 * Gets the offset of a jack in the world, based on its type.
 * @param {boolean} isInput
 * @param {Vec2d=} opt_outVec
 * @return {Vec2d}
 */
GrafEd.prototype.getJackOffset = function(isInput, opt_outVec) {
  return this.geom.getJackOffset(isInput, opt_outVec);
};

/**
 * Gets the position of a jack in the world, based on its part's position
 * and the type of jack it is.
 * @param jackId
 * @param {Vec2d=} opt_outVec
 * @return {Vec2d}
 */
GrafEd.prototype.getJackPos = function(jackId, opt_outVec) {
  return this.geom.getJackPos(jackId, opt_outVec);
};

/**
 * Selects or unselects the closest part or jack.
 * @param {Vec2d} pos
 * @param {boolean} selected true if selecting or false if unselecting
 */
GrafEd.prototype.selectNearest = function(pos, selected) {
  this.selectById(this.geom.getNearestId(pos), selected);
};

GrafEd.prototype.popSelection = function() {
  return this.selStack.pop();
};

/**
 * Pops all selections off the stack.
 */
GrafEd.prototype.clearSelection = function() {
  while(this.selStack.pop());
};

GrafEd.prototype.getMoveSelectedPartsOps = function(offset, opt_snap) {
  var ops = [];
  var ids = this.getSelectedIds();
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var part = this.model.getPart(id);
    if (!part) continue; // may be a jack
    ops.push(this.getMovePartOp(id, offset, opt_snap));
  }
  return ops;
};

GrafEd.prototype.snap = function(num, opt_snap) {
  if (!opt_snap) return num;
  return Math.round(num / opt_snap) * opt_snap;
};

GrafEd.prototype.getMovePartOp = function(partId, offset, opt_snap) {
  var part = this.model.getPart(partId);
  return {
    type: GrafOp.Type.MOVE_PART,
    id: partId,
    x: this.snap(part.x + offset.x, opt_snap),
    y: this.snap(part.y + offset.y, opt_snap),
    oldX: part.x,
    oldY: part.y
  };
};

GrafEd.prototype.getPasteModelOps = function(offset, opt_snap) {
  var tempModel = new GrafModel();
  tempModel.addModel(this.pasteModel);
  for (var partId in tempModel.parts) {
    var part = tempModel.parts[partId];
    part.x = this.snap(part.x + offset.x, opt_snap);
    part.y = this.snap(part.y + offset.y, opt_snap);
  }
  var ops = tempModel.createOps();
  this.pasteIdMap = this.model.rewriteOpIds(ops);
  return ops;
};

/**
 * Moves all selected parts by the offset vector value.
 * @param {Vec2d} offset
 */
GrafEd.prototype.moveSelectedParts = function(offset) {
  var ops = this.getMoveSelectedPartsOps(offset);
  this.commitOps(ops);
};

GrafEd.prototype.isSelected = function(id, opt_num) {
  var num = opt_num || 0;
  var stringSet = this.selStack.peek(num);
  return stringSet && stringSet.contains(id);
};

GrafEd.prototype.getSelectedIds = function(opt_num) {
  var num = opt_num || 0;
  var stringSet = this.selStack.peek(num);
  return stringSet ? stringSet.getValues() : [];
};

/**
 * Creates links between all input jacks and all output jacks in the top two selections,
 * but not input/output jacks on the same part,
 * and not between jack pairs that are already linked to each other
 */
GrafEd.prototype.linkSelectedJacks = function() {
  var inputs = [];
  var outputs = [];
  var ids = this.getSelectedIds(0).concat(this.getSelectedIds(1));
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var jack = this.model.getJack(id);
    if (!jack) continue; // may be a part
    if (jack.isInput()) {
      inputs.push(jack);
    } else {
      outputs.push(jack);
    }
  }
  var ops = [];
  for (var inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
    var input = inputs[inputIndex];
    for (var outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
      var output = outputs[outputIndex];
      if (output.partId != input.partId &&
          0 == this.model.getLinksBetweenJacks(output.id, input.id).length) {
        ops.push(this.getLinkOp(output.id, input.id));
      }
    }
  }
  this.commitOps(ops);
};

GrafEd.prototype.getLinkOp = function(jackId1, jackId2) {
  // console.log(['linking jacks:', input.id, output.id].join(' '));
  return {
    type: GrafOp.Type.ADD_LINK,
    id: this.model.newId(),
    jackId1: jackId1,
    jackId2: jackId2
  };
};

GrafEd.prototype.setDataOnSelection = function(keyVals) {
  var ops = [];
  var ids = this.getSelectedIds();
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var obj = this.model.objs[id];
    for (var k in keyVals) {
      var v = keyVals[k];
      if (k in obj.data) {
        ops.push(this.opForSetDataById(id, k, v));
      }
    }
  }
  this.commitOps(ops);
};

GrafEd.prototype.startSelectionVec = function(v) {
  this.startSelectionXY(v.x, v.y);
};

GrafEd.prototype.startSelectionXY = function(x, y) {
  this.selectionStart = new Vec2d(x, y);
  this.selectionEnd = new Vec2d(x, y);
};

GrafEd.prototype.continueSelectionVec = function(v) {
  this.continueSelectionXY(v.x, v.y);
};
GrafEd.prototype.continueSelectionXY = function(x, y) {
  this.selectionEnd.setXY(x, y);
};

GrafEd.prototype.endSelection = function() {
  var ids = this.getHilitedIds();
  if (ids.length) {
    this.selStack.push((new plex.StringSet()).putArray(ids));
  }
  this.selectionStart = null;
  this.selectionEnd = null;
};

GrafEd.prototype.createSelectionWithId = function(id) {
  this.selStack.push((new plex.StringSet()).put(id));
  this.selectionStart = null;
  this.selectionEnd = null;
};

GrafEd.prototype.addSelections = function() {
  this.selStack.add();
};

GrafEd.prototype.subtractSelections = function() {
  this.selStack.subtract();
};

/**
 * @return {Array} of [x0, y0, x1, y1] or null
 */
GrafEd.prototype.getHiliteRect = function() {
  if (!this.selectionStart) return null;
  return [
    this.selectionStart.x, this.selectionStart.y,
    this.selectionEnd.x, this.selectionEnd.y];
};

/**
 * @return {Array} of IDs. If there aren't any, returns empty array.
 */
GrafEd.prototype.getHilitedIds = function() {
  if (!this.selectionStart) return [];
  return this.geom.getIdsInRect(
      this.selectionStart.x, this.selectionStart.y,
      this.selectionEnd.x, this.selectionEnd.y);
};


GrafEd.prototype.startDraggingSelectionVec = function(v) {
  this.startDraggingSelectionXY(v.x, v.y);
};

GrafEd.prototype.startDraggingSelectionXY = function(x, y) {
  this.dragSelectionStart = new Vec2d(x, y);
  this.dragSelectionEnd = new Vec2d(x, y);
};

GrafEd.prototype.continueDraggingSelectionVec = function(v, opt_snap) {
  this.continueDraggingSelectionXY(v.x, v.y, opt_snap);
};

GrafEd.prototype.continueDraggingSelectionXY = function(x, y, opt_snap) {
  this.dragSelectionEnd.setXY(x, y);
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  var offset = new Vec2d().set(this.dragSelectionEnd).subtract(this.dragSelectionStart);
  this.stagedOps = this.getMoveSelectedPartsOps(offset, opt_snap);
  this.model.applyOps(this.stagedOps);
};

GrafEd.prototype.endDraggingSelection = function() {
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  this.commitOps(this.stagedOps);
  this.stagedOps.length = 0;
  this.dragSelectionStart = null;
  this.dragSelectionEnd = null;
};


GrafEd.prototype.startDraggingPartVec = function(partId, v) {
  this.dragPartId = partId;
  this.dragPartStart = new Vec2d().set(v);
  this.dragPartEnd = new Vec2d().set(v);
};

GrafEd.prototype.continueDraggingPartVec = function(v, opt_snap) {
  this.dragPartEnd.set(v);
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  var offset = new Vec2d().set(this.dragPartEnd).subtract(this.dragPartStart);
  this.stagedOps = [this.getMovePartOp(this.dragPartId, offset, opt_snap)];
  this.model.applyOps(this.stagedOps);
};

GrafEd.prototype.endDraggingPart = function() {
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  this.commitOps(this.stagedOps);
  this.stagedOps.length = 0;
  this.dragPartId = null;
  this.dragPartStart = null;
  this.dragPartEnd = null;
};


GrafEd.prototype.startDraggingJack = function(jackId, endVec) {
  this.dragJackId = jackId;
  this.dragJackEnd = new Vec2d().set(endVec);
};

GrafEd.prototype.continueDraggingJackVec = function(v) {
  this.dragJackEnd.set(v);
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  // maybe create link ops
  var linkableJack = this.getLinkableJack(this.dragJackId, this.dragJackEnd);
  this.stagedOps.length = 0;
  if (linkableJack) {
    this.stagedOps.push(this.getLinkOp(this.dragJackId, linkableJack.id));
  }
  this.model.applyOps(this.stagedOps);
};

/**
 * @return {boolean}
 */
GrafEd.prototype.hasStagedOps = function() {
  return this.stagedOps && this.stagedOps.length > 0;
};

GrafEd.prototype.getLinkableJack = function(fromJackId, toVec) {
  var fromJack = this.model.getJack(fromJackId);
  var toJack = this.geom.getNearestJack(toVec);
  if (toJack && toJack.isInput() != fromJack.isInput() &&
      0 == this.model.getLinksBetweenJacks(fromJack.id, toJack.id).length) {
    return toJack;
  }
  return null;
};


GrafEd.prototype.endDraggingJack = function() {
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  if (this.stagedOps.length) {
    this.commitOps(this.stagedOps);
    this.stagedOps.length = 0;
  }
  this.dragJackId = null;
  this.dragJackEnd = null;
};


GrafEd.prototype.startPasteVec = function(model, v) {
  this.startPasteXY(model, v.x, v.y);
};

GrafEd.prototype.startPasteXY = function(model, x, y) {
  this.pasteModel = model;
  var geom = new GrafGeom(model);
  var center = geom.getCenter();
  this.pasteStart = new Vec2d(center.x, center.y);
  this.pasteEnd = new Vec2d(x, y);
};

GrafEd.prototype.continuePasteVec = function(v, opt_snap) {
  this.continuePasteXY(v.x, v.y, opt_snap);
};

GrafEd.prototype.continuePasteXY = function(x, y, opt_snap) {
  this.pasteEnd.setXY(x, y);
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  var offset = new Vec2d().set(this.pasteEnd).subtract(this.pasteStart);
  this.stagedOps = this.getPasteModelOps(offset, opt_snap);
  this.model.applyOps(this.stagedOps);
};

GrafEd.prototype.endPaste = function(autoSelect) {
  this.model.applyOps(GrafOp.createReverses(this.stagedOps));
  this.commitOps(this.stagedOps);

  if (autoSelect) {
    var pastedIds = plex.object.values(this.pasteIdMap);
    this.selStack.push((new plex.StringSet()).putArray(pastedIds));
  }
  this.pasteIdMap = null;

  this.stagedOps.length = 0;
  this.pasteStart = null;
  this.pasteEnd = null;
};


/**
 * Deleting a jack only deletes its links, not the jack.
 * Deleting a part deletes the part's entire cluster.
 */
GrafEd.prototype.deleteSelection = function() {
  var self = this;
  var deletedIds = {};
  var ops = [];

  function deleteCluster(cluster) {
    if (deletedIds[cluster.id]) return;
    deleteData(cluster);
    for (var id in cluster.parts) {
      deletePart(cluster.parts[id]);
    }
    ops.push({
      type: GrafOp.Type.REMOVE_CLUSTER,
      id: cluster.id
    });
    deletedIds[cluster.id] = true;
  }

  function deletePart(part) {
    if (deletedIds[part.id]) return;
    deleteData(part);
    for (var id in part.jacks) {
      deleteJack(part.jacks[id]);
    }
    ops.push({
      type: GrafOp.Type.REMOVE_PART,
      id: part.id,
      clusterId: part.clusterId,
      x: part.x,
      y: part.y
    });
    deletedIds[part.id] = true;
  }

  function deleteJack(jack) {
    if (deletedIds[jack.id]) return;
    deleteData(jack);
    deleteJackLinks(jack);
    ops.push({
      type: GrafOp.Type.REMOVE_JACK,
      id: jack.id,
      partId: jack.partId
    })
    deletedIds[jack.id] = true;
  }

  function deleteJackLinks(jack) {
    for (var id in jack.links) {
      deleteLink(self.model.getLink(id));
    }
  }

  function deleteLink(link) {
    if (deletedIds[link.id]) return;
    deleteData(link);
    ops.push({
      type: GrafOp.Type.REMOVE_LINK,
      id: link.id,
      jackId1: link.jackId1,
      jackId2: link.jackId2
    });
    deletedIds[link.id] = true;
  }

  function deleteData(obj) {
    for (var key in obj.data) {
      ops.push({
        type: GrafOp.Type.SET_DATA,
        id: obj.id,
        key: key,
        oldValue: obj.data[key]
      });
    }
  }

  var ids = this.getSelectedIds();

  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];

    var link = this.model.getLink(id);
    if (link) {
      // It's not actually possible to select a link directly yet, so this never happens.
      deleteLink(link);
    }
    var jack = this.model.getJack(id);
    if (jack) {
      // just delete links, not the jack itself
      deleteJackLinks(jack);
    }
    var part = this.model.getPart(id);
    if (part) {
      // nuke the whole cluster
      var cluster = this.model.getCluster(part.clusterId);
      if (cluster) {
        deleteCluster(cluster);
      }
    }
  }
  this.commitOps(ops);
};

GrafEd.prototype.copySelectedModel = function() {
  if (!this.selStack.size()) {
    return null;
  }

  // collect cluster IDs to copy
  var ids = this.getSelectedIds();
  var clusterIds = [];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var jack = this.model.getJack(id);
    if (jack) {
      var part = this.model.getPart(jack.partId);
      clusterIds.push(part.clusterId);
    }
    var part = this.model.getPart(id);
    if (part) {
      clusterIds.push(part.clusterId);
    }
  }
  var copy = this.model.copyClusters(clusterIds);
  return copy;
};

/**
 * @return {Number}
 */
GrafEd.prototype.getSelectionsSize = function() {
  return this.selStack.size();
};

/**
 * @param callback called with no params when the model changes due to LocalStorage stuff.
 */
GrafEd.prototype.setCallback = function(callback) {
  this.invalidationCallback = function() {
    callback.call(null);
  };
  if (this.opStor) {
    this.subscribeToOpStor();
  }
};

GrafEd.prototype.unsubscribe = function() {
  if (this.opStor) {
    this.unsubscribeFromOpStor();
  }
};


////////////////////////////////////////////////////////////////////////
// Below are the internal methods that UIs shouldn't have to use.
// They're still used by the more programatic LevelProg, though.
////////////////////////////////////////////////////////////////////////

/**
 * @param {string} objId The object whose data is to be set
 * @param {string} key The data key to set
 * @param {string} val The data value to set
 */
GrafEd.prototype.opForSetDataById = function(objId, key, val) {
  return {
    type: GrafOp.Type.SET_DATA,
    id: objId,
    key: key,
    value: val,
    oldValue: this.model.objs[objId].data[key]
  };
};

/**
 * @param {Vec2d} pos
 * @param {number=} opt_maxDist
 * @return a model ID, either a partId or a jackId, or null if nothing is close enough
 */
GrafEd.prototype.getNearestId = function(pos, opt_maxDist) {
  return this.geom.getNearestId(pos, opt_maxDist);
};

/**
 * Adds or removes a partId or jackId to/from the head selection.
 * @param partOrJackId
 * @param {boolean} selected true if selecting or false if unselecting
 */
GrafEd.prototype.selectById = function(partOrJackId, selected) {
  this.selStack.push((new plex.StringSet()).put(partOrJackId));
  if (selected) {
    this.selStack.add();
  } else {
    this.selStack.subtract();
  }
};

/**
 * Adds or removes partIds and jackIds to/from the head selection.
 * @param partOrJackIds
 * @param {boolean} selected true if selecting or false if unselecting
 */
GrafEd.prototype.selectByIds = function(partOrJackIds, selected) {
  var stringSet = new plex.StringSet();
  for (var i = 0; i < partOrJackIds.length; i++) {
    stringSet.put(partOrJackIds[i]);
  }
  this.selStack.push(stringSet);
  if (selected) {
    this.selStack.add();
  } else {
    this.selStack.subtract();
  }
};

/**
 * Commits ops the user manually performed.
 * Pushes to the undo stack and clears the redo stack.
 * @param {Array<GrafOp>} ops
 */
GrafEd.prototype.commitOps = function(ops) {
  this.commitOpsInternal(ops);
  this.undoStack.push(ops.concat()); // copy the ops array
  this.redoStack.length = 0;
};

/**
 * Undoes the ops on the undo stack, moving them to the redo stack.
 */
GrafEd.prototype.undo = function() {
  var ops = this.undoStack.pop();
  if (!ops) return;
  this.redoStack.push(ops);
  this.commitOpsInternal(GrafOp.createReverses(ops));
};

/**
 * Undoes the ops on the redo stack, moving them to the undo stack.
 */
GrafEd.prototype.redo = function() {
  var ops = this.redoStack.pop();
  if (!ops) return;
  this.undoStack.push(ops);
  this.commitOpsInternal(ops);
};

/**
 * Writes ops to the opstor if there is one.
 * Causes the model to be updated, maybe asynchronously.
 * @param {Array<GrafOp>} ops
 */
GrafEd.prototype.commitOpsInternal = function(ops) {
  if (this.opStor) {
    for (var i = 0; i < ops.length; i++) {
      this.opStor.appendOp(ops[i]);
    }
    this.syncOps();
  } else {
    // Can't bounce ops off opStor, so apply them directly.
    this.model.applyOps(ops);
  }
};

GrafEd.prototype.syncOps = function() {
  var opsSynced = 0;
  var values = this.opStor.getValuesAfterIndex(this.highestOpStorIndex);
  for (var i = 0; i < values.length; i++) {
    this.model.applyOp(values[i][OpStor.field.OP]);
    this.highestOpStorIndex = values[i][OpStor.field.OP_INDEX];
    opsSynced++;
  }
  if (opsSynced && this.invalidationCallback) {
    this.invalidationCallback.call(null);
  }
};

GrafEd.prototype.subscribeToOpStor = function() {
  if (this.opStorCallback) return;
  var self = this;
  this.opStorCallback = function() {
    self.syncOps();
  };
  this.opStor.subscribe(this.opStorCallback);
};

GrafEd.prototype.unsubscribeFromOpStor = function() {
  if (!this.opStorCallback) return;
  this.opStor.unsubscribe(this.opStorCallback);
  this.opStorCallback = null;
};

/**
 * Helps things agree where GrafModel stuff is and what it's shaped like.
 * @param {GrafModel} model
 * @constructor
 */
function GrafGeom(model) {
  this.model = model;
}

GrafGeom.PART_RADIUS = 30;
GrafGeom.JACK_RADIUS = 10;
GrafGeom.JACK_DISTANCE = GrafGeom.PART_RADIUS + GrafGeom.JACK_RADIUS;
GrafGeom.SELECTION_PADDING = 2;
GrafGeom.EDIT_RADIUS = 8;

/**
 * Sets the model contents, keeping the model reference.
 * @param {GrafModel} model
 */
GrafGeom.prototype.setModelContents = function(model) {
  this.model.clear();
  this.model.addModel(model);
};

/**
 * @return {GrafModel} reference to internal model
 */
GrafGeom.prototype.getModel = function() {
  return this.model;
};

/**
 * Gets the offset of a jack in the world, based on its type.
 * @param {boolean} isInput
 * @param {Vec2d=} opt_outVec
 * @return {Vec2d}
 */
GrafGeom.prototype.getJackOffset = function(isInput, opt_outVec) {
  var retval = opt_outVec || new Vec2d();
  return retval.setXY(0, GrafGeom.JACK_DISTANCE * (isInput ? -1 : 1));
};

/**
 * Gets the position of a jack in the world, based on its part's position
 * and the type of jack it is.
 * @param jackId
 * @param {Vec2d=} opt_outVec
 * @return {Vec2d}
 */
GrafGeom.prototype.getJackPos = function(jackId, opt_outVec) {
  // TODO: Link location, for deletion?
  var retval = opt_outVec || new Vec2d();
  var jack = this.model.getJack(jackId);
  var part = this.model.getPart(jack.partId);
  this.getJackOffset(jack.isInput(), retval);
  retval.addXY(part.x, part.y);
  return retval;
};

GrafGeom.prototype.getEditButtonPos = function(partId, opt_outVec) {
  var retval = opt_outVec || new Vec2d();
  var part = this.model.getPart(partId);
  var offset = Math.SQRT1_2 * (GrafGeom.PART_RADIUS + GrafGeom.EDIT_RADIUS);
  retval.setXY(part.x + offset, part.y + offset);
  return retval;
};

/**
 * @param {Vec2d} pos
 * @param {number=} opt_maxDist
 * @return {Vec2d} the position of the object closest to "pos", or null
 */
GrafGeom.prototype.getNearestPos = function(pos, opt_maxDist) {
  var id = this.getNearestId(pos, opt_maxDist);
  if (!id) return null;
  var jack = this.model.getJack(id);
  if (jack) {
    return this.getJackPos(id);
  }
  var part = this.model.getPart(id);
  return new Vec2d(part.x, part.y);
};

/**
 * @return {Array} of IDs. If there aren't any, returns empty array.
 */
GrafGeom.prototype.getIdsInRect = function(x0, y0, x1, y1) {
  var jackPos = Vec2d.alloc();
  var idSet = new plex.StringSet();
  for (var partId in this.model.parts) {
    var part = this.model.getPart(partId);
    var dist = aabb.rectCircleDist(x0, y0, x1, y1, part.x, part.y);
    if (dist < GrafGeom.PART_RADIUS + GrafGeom.SELECTION_PADDING) {
      idSet.put(partId);
    }
    for (var jackId in part.jacks) {
      this.getJackPos(jackId, jackPos);
      var dist = aabb.rectCircleDist(x0, y0, x1, y1, jackPos.x, jackPos.y);
      if (dist < GrafGeom.JACK_RADIUS + GrafGeom.SELECTION_PADDING) {
        idSet.put(jackId);
      }
    }
  }
  Vec2d.free(jackPos);
  return idSet.getValues();
};

/**
 * @return one ID, or null.
 */
GrafGeom.prototype.getIdAtVec = function(vec) {
  var jackPos = Vec2d.alloc();
  var lowestDistSq = Infinity;
  var retId = null;
  var maxPartDist = GrafGeom.PART_RADIUS + GrafGeom.SELECTION_PADDING;
  var maxPartDistSq = maxPartDist * maxPartDist;
  var maxJackDist = GrafGeom.JACK_RADIUS + GrafGeom.SELECTION_PADDING;
  var maxJackDistSq = maxJackDist * maxJackDist;
  for (var partId in this.model.parts) {
    var part = this.model.getPart(partId);
    var distSq = Vec2d.distanceSq(vec.x, vec.y, part.x, part.y);
    if (distSq < maxPartDistSq && distSq < lowestDistSq) {
      retId = partId;
      lowestDistSq = distSq;
    }
    for (var jackId in part.jacks) {
      this.getJackPos(jackId, jackPos);
      var distSq = Vec2d.distanceSq(vec.x, vec.y, jackPos.x, jackPos.y);
      if (distSq < maxJackDistSq && distSq < lowestDistSq) {
        retId = jackId;
        lowestDistSq = distSq;
      }
    }
  }
  Vec2d.free(jackPos);
  return retId;
};

/**
 * @return {Array} of IDs. If there aren't any, returns empty array.
 */
GrafGeom.prototype.getIdsAtXY = function(x, y) {
  return this.getIdsInRect(x, y, x, y);
};

/**
 * @return {Array} of IDs. If there aren't any, returns empty array.
 */
GrafGeom.prototype.getIdsAtVec = function(v) {
  return this.getIdsInRect(v.x, v.y, v.x, v.y);
};

/**
 * @return {Vec2d?}
 */
GrafGeom.prototype.getPosById = function(id) {
  var part = this.model.getPart(id);
  if (part) {
    return new Vec2d(part.x, part.y);
  }
  var jack = this.model.getJack(id);
  if (jack) {
    return this.getJackPos(id);
  }
  return null;
};

/**
 * @return {number?}
 */
GrafGeom.prototype.getRadById = function(id) {
  var part = this.model.getPart(id);
  if (part) {
    return GrafGeom.PART_RADIUS;
  }
  var jack = this.model.getJack(id);
  if (jack) {
    return GrafGeom.JACK_RADIUS;
  }
  return null;
};

/**
 * @param {Vec2d} pos
 * @return a part ID, or null if nothing is close enough
 */
GrafGeom.prototype.getNearestEditButtonPartId = function(pos) {
  var editPos = Vec2d.alloc();

  var maxDist = GrafGeom.EDIT_RADIUS + GrafGeom.SELECTION_PADDING;
  var leastDistSq = maxDist * maxDist;
  var retId = null;

  for (var partId in this.model.parts) {
    if (this.model.getPart(partId).hasData()) {
      this.getEditButtonPos(partId, editPos);
      var distSq = pos.distanceSquared(editPos);
      if (distSq < leastDistSq) {
        retId = partId;
        leastDistSq = distSq;
      }
    }
  }
  Vec2d.free(editPos);
  return retId;
};

/**
 * @param {Vec2d} pos
 * @param {number=} opt_maxDist
 * @return a model ID, either a partId or a jackId, or null if nothing is close enough
 */
GrafGeom.prototype.getNearestId = function(pos, opt_maxDist) {
  var obj = this.getNearestPartOrJack(pos, opt_maxDist);
  return obj ? obj.id : null;
};

/**
 * @param {Vec2d} pos
 * @param {number=} opt_maxDist
 * @return {GrafJack | GrafPart | null}
 */
GrafGeom.prototype.getNearestPartOrJack = function(pos, opt_maxDist) {
  var part = this.getNearestPart(pos, opt_maxDist);
  var jack = this.getNearestJack(pos, opt_maxDist);
  if (part && jack) {
    var partDistSq = Vec2d.distanceSq(pos.x, pos.y, part.x, part.y);
    var jackDistSq = Vec2d.distanceSq(pos.x, pos.y, jack.x, jack.y);
    return jackDistSq < partDistSq ? jack : part;
  }
  return part || jack;
};

/**
 * @param {Vec2d} pos
 * @param {number=} opt_maxDist defaults to jack radius + padding
 * @return {GrafJack?} a jack, or null
 */
GrafGeom.prototype.getNearestJack = function(pos, opt_maxDist) {
  var jackPos = Vec2d.alloc();

  var maxDist = opt_maxDist || (GrafGeom.JACK_RADIUS + GrafGeom.SELECTION_PADDING);
  var leastDistSq = maxDist * maxDist;
  var retId = null;

  for (var jackId in this.model.jacks) {
    this.getJackPos(jackId, jackPos);
    var distSq = pos.distanceSquared(jackPos);
    if (distSq < leastDistSq) {
      retId = jackId;
      leastDistSq = distSq;
    }
  }
  Vec2d.free(jackPos);
  return this.model.getJack(retId);
};

/**
 * @param {Vec2d} pos
 * @param {number=} opt_maxDist defaults to defaults to part radius + padding
 * @return {GrafPart?} a part, or null
 */
GrafGeom.prototype.getNearestPart = function(pos, opt_maxDist) {
  var partPos = Vec2d.alloc();

  var maxDist = opt_maxDist || 1;
  var leastDistSq = maxDist * maxDist;
  var retId = null;

  for (var partId in this.model.parts) {
    var part = this.model.getPart(partId);
    partPos.setXY(part.x, part.y);
    var distSq = pos.distanceSquared(partPos);
    if (distSq < leastDistSq) {
      retId = partId;
      leastDistSq = distSq;
    }
  }
  Vec2d.free(partPos);
  return this.model.getPart(retId);
};

/**
 * @return object representing rectangle {x0:.., y0:.., x1:.., y1:..}
 * that encloses all parts and jacks, or null if there are no objects.
 */
GrafGeom.prototype.getBoundingRect = function() {
  var bounds = null;

  function updateBounds(x, y, rad) {
    if (!bounds) {
      bounds = {x0: x, y0: y, x1: x, y1: y};
    }
    if (x - rad < bounds.x0) bounds.x0 = x - rad;
    if (y - rad < bounds.y0) bounds.y0 = y - rad;
    if (x + rad > bounds.x1) bounds.x1 = x + rad;
    if (y + rad > bounds.y1) bounds.y1 = y + rad;
  }

  for (var partId in this.model.parts) {
    var part = this.model.getPart(partId);
    // Incorporate the jack radius into every part,
    // so the clip menu parts will all be on the same center lines.
    updateBounds(part.x, part.y, GrafGeom.PART_RADIUS + 2 * GrafGeom.JACK_RADIUS);
  }
  return bounds;
};

GrafGeom.prototype.getCenter = function() {
  var brect = this.getBoundingRect();
  var cx = (brect.x0 + brect.x1) / 2;
  var cy = (brect.y0 + brect.y1) / 2;
  return new Vec2d(cx, cy);
};
/**
 * Does the rendering.
 * - Owns the pluggable underlayer, and controls its camera.
 * - Overlays the graf rendering stuff on top.
 *
 * @param plugin  app-specific thing with invalidate() and render(model)
 * @param {Renderer} renderer
 * @param {GrafGeom} geom
 * @constructor
 */
function GrafRend(plugin, renderer, geom) {
  this.plugin = plugin;
  this.renderer = renderer;
  this.geom = geom;
  this.viewDirty = true;
}

GrafRend.DATA_BUTTON_TEXT = '\u270E';

GrafRend.MODEL_LINE_WIDTH = 3;
GrafRend.MODEL_STROKE_STYLE = 'rgba(255, 255, 255, 0.3)';
GrafRend.MODEL_PREVIEW_STROKE_STYLE = 'rgba(255, 255, 255, 0.15)';

GrafRend.LABEL_LINE_WIDTH = 12/6;
GrafRend.LABEL_STROKE_STYLE = 'rgba(0, 0, 0, 0.5)';
GrafRend.LABEL_FILL_STYLE = 'rgba(255, 255, 255, 0.5)';
GrafRend.LABEL_FONT = '12pt Lucida Grande, Courier New, sans serif';

GrafRend.DATA_LINE_WIDTH = 7/6;
GrafRend.DATA_STROKE_STYLE = 'rgba(0, 0, 0, 0.5)';
GrafRend.DATA_FILL_STYLE = 'rgba(255, 255, 255, 0.5)';
GrafRend.DATA_FONT = '7pt Lucida Grande, Courier New, sans serif';

GrafRend.EDIT_BUTTON_FONT = '8pt Lucida Grande, Courier New, sans serif';

GrafRend.prototype.resize = function(width, height) {
  this.renderer.canvas.width = width;
  this.renderer.canvas.height = height;
  this.viewDirty = true;
};

GrafRend.prototype.frameContents = function(scale) {
  var bounds = this.geom.getBoundingRect();
  if (!bounds) return;
  this.renderer.setCenter(
      (bounds.x0 + bounds.x1) / 2,
      (bounds.y0 + bounds.y1) / 2);
  var boundsWidth = bounds.x1 - bounds.x0;
  var boundsHeight = bounds.y1 - bounds.y0;
  var xZoom = this.renderer.canvas.width / boundsWidth;
  var yZoom = this.renderer.canvas.height / boundsHeight;
  this.renderer.setZoom(Math.min(xZoom, yZoom));
  this.renderer.scaleZoom(scale);
};

/**
 * @param {GrafModel} model
 */
GrafRend.prototype.setModelContents = function(model) {
  this.geom.setModelContents(model);
  this.plugin.invalidate();
};

/**
 * @return {GrafModel}
 */
GrafRend.prototype.getModel = function() {
  return this.geom.getModel();
};

GrafRend.prototype.draw = function() {
  var model = this.geom.getModel();

  this.plugin.render(model);

  this.renderer.transformStart();

  this.renderer.setStrokeStyle(GrafRend.MODEL_STROKE_STYLE);
  this.renderer.setFillStyle(GrafRend.MODEL_STROKE_STYLE);
  this.renderer.context.lineWidth = GrafRend.MODEL_LINE_WIDTH / this.renderer.getZoom();

  // links
  for (var linkId in model.links) {
    this.drawLink(model.links[linkId]);
  }

  // clusters, parts, jacks
  for (var clusterId in model.clusters) {
    this.drawCluster(model.getCluster(clusterId));
  }

  // labels
  this.renderer.context.lineWidth = GrafRend.LABEL_LINE_WIDTH / this.renderer.getZoom();
  this.renderer.context.font = GrafRend.LABEL_FONT;
  this.renderer.context.textAlign = 'center';
  this.renderer.context.textBaseline = 'middle';
  this.renderer.setStrokeStyle(GrafRend.LABEL_STROKE_STYLE);
  this.renderer.setFillStyle(GrafRend.LABEL_FILL_STYLE);
  for (var clusterId in model.clusters) {
    this.drawClusterLabels(model.getCluster(clusterId));
  }

  // data
  this.renderer.context.lineWidth = GrafRend.DATA_LINE_WIDTH / this.renderer.getZoom();
  this.renderer.context.font = GrafRend.DATA_FONT;
  this.renderer.context.textAlign = 'left';
  this.renderer.context.textBaseline = 'top';
  this.renderer.setStrokeStyle(GrafRend.DATA_STROKE_STYLE);
  this.renderer.setFillStyle(GrafRend.DATA_FILL_STYLE);
  for (var clusterId in model.clusters) {
    this.drawClusterData(model.getCluster(clusterId));
  }

  this.renderer.transformEnd();
};

GrafRend.prototype.drawCluster = function(cluster) {
  var parts = cluster.getPartList();
  for (var i = 0; i < parts.length; i++) {
    this.drawPart(parts[i]);
  }
};

GrafRend.prototype.drawPart = function(part) {
  this.renderer.strokeCirclePosXYRad(part.x, part.y, GrafGeom.PART_RADIUS);
  for (var jackId in part.jacks) {
    if (!part.jacks.hasOwnProperty(jackId)) continue;
    var jackPos = this.geom.getJackPos(jackId);
    this.renderer.strokeCirclePosXYRad(jackPos.x, jackPos.y, GrafGeom.JACK_RADIUS);
  }
};

GrafRend.prototype.drawLink = function(link) {
  this.renderer.drawLineVV(
      this.geom.getJackPos(link.jackId1),
      this.geom.getJackPos(link.jackId2));
};

GrafRend.prototype.drawClusterLabels = function(cluster) {
  var parts = cluster.getPartList();
  for (var i = 0; i < parts.length; i++) {
    this.drawPartLabels(parts[i], cluster);
  }
};

GrafRend.prototype.drawPartLabels = function(part, cluster) {
  var text = part.data.type || cluster.data.type || null;
  if (text) {
    text = text.replace('_', ' ');
    this.renderer.context.strokeText(text, part.x, part.y);
    this.renderer.context.fillText(text, part.x, part.y);
  }
};

GrafRend.prototype.drawClusterData = function(cluster) {
  var parts = cluster.getPartList();
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].hasData()) {
      this.drawPartData(parts[i], cluster);
    }
  }
};

GrafRend.prototype.drawPartData = function(part, cluster) {
  var editPos = Vec2d.alloc();
  this.geom.getEditButtonPos(part.id, editPos);
  this.renderer.context.textAlign = 'center';
  this.renderer.context.textBaseline = 'middle';
  this.renderer.context.strokeText(GrafRend.DATA_BUTTON_TEXT, editPos.x, editPos.y);
  this.renderer.context.fillText(GrafRend.DATA_BUTTON_TEXT, editPos.x, editPos.y);
  this.renderer.fillCirclePosXYRad(editPos.x, editPos.y, GrafGeom.EDIT_RADIUS);

  var x = editPos.x + GrafGeom.EDIT_RADIUS * 1.2;
  var y = editPos.y;
  this.renderer.context.textAlign = 'left';
  for (var key in part.data) {
    var val = part.data[key];
    var text = key + ':' + val;
    this.renderer.context.strokeText(text, x, y);
    this.renderer.context.fillText(text, x, y);
    y += 9;
  }
};


/**
 * Converts user gestures to GrafStor actions.
 * Maintains UI mode
 * - dragging, linking, editing field, etc.
 * - clipboard (set by app code)
 * - (but selection is really backed by GrafStor's GrafEd).
 *
 * Mutations
 * - Mutates the GrafStor using its high-level action support.
 *
 * Cameraman
 * - pan and zoom
 * - translates gestures into world coords
 *
 * Does the rendering.
 * - Owns the pluggable underlayer, and controls its camera,
 *   state invalidation (retransformation), and rendering calls.
 * - Overlays the graf rendering stuff on top.
 * - Handles key/value input widgets.
 *
 *
 * @param {GrafEd} grafEd for editing
 * @param {Renderer} renderer for muching with the camera and measuring the canvas
 * @param {GrafRend} grafRend for uuuuh
 * @param {GrafGeom} grafGeom
 * @param plugin app-specific thing with invalidate() and render(model)
 * @param {Clipboard} clipboard
 * @param {ClipMenu} clipMenu
 * @param {GrafUiKeyCombos} keyCombos
 * @constructor
 */
function GrafUi(grafEd, renderer, grafRend, grafGeom, plugin, clipboard, clipMenu, keyCombos) {
  this.grafEd = grafEd;
  this.renderer = renderer;
  this.grafRend = grafRend;
  this.grafGeom = grafGeom;
  this.plugin = plugin;
  this.clipboard = clipboard;
  this.clipMenu = clipMenu;
  this.keyCombos = keyCombos;

  this.viewDirty = true;
  this.pointerWorldPosChanged = true;
  this.mode = GrafUi.Mode.DEFAULT;

  this.loop = null;
  this.canvasPos = null;
  this.worldPos = new Vec2d();
  this.deltaZoom = 0;
  this.panning = false;

  this.contentsFramed = false;

  this.snap = GrafUi.MIN_SNAP;

  this.editable = true;
}

GrafUi.FPS = 30;

GrafUi.MAX_ZOOM = 50;
GrafUi.MIN_ZOOM = 0.01;

GrafUi.MIN_SNAP = 8;
GrafUi.MAX_SNAP = 256;

GrafUi.HOVER_COLOR = 'rgba(255, 255, 255, 0.5)';
GrafUi.HILITE_COLOR = 'rgba(255, 255, 255, 0.9)';

GrafUi.SELECTION_RENDER_PADDING = 2;

GrafUi.SELECTION_COLORS = [
  'rgba(0, 255, 100, 0.95)',
  'rgba(220, 180, 0, 0.85)',
  'rgba(210, 100, 0, 0.5)',
  'rgba(200, 40, 0, 0.2)'
];

GrafUi.MODEL_LINE_WIDTH = 1.5;
GrafUi.SELECTION_LINE_WIDTH = 1.5;
GrafUi.HILITE_LINE_WIDTH = 1.5;

/**
 * Quasimodes the user can be in by holding a key.
 * @enum {String}
 */
GrafUi.Mode = {
  DEFAULT: 'default',
  DRAG_PART: 'drag_part',
  DRAG_JACK: 'drag_jack',
  DRAG_SELECTION: 'drag_sel',
  PASTE: 'paste',
  SELECT: 'select',
  EDIT_DATA: 'edit_data'
};

/**
 * Names of the actions the user can in the grafui.
 * @enum {string}
 */
GrafUi.Action = {
  GRID_SNAP: 'grid_snap',

  SELECT: 'select',
  UNSELECT: 'unselect',
  ADD_SELECTIONS: 'add_selections',
  SUBTRACT_SELECTIONS: 'subtract_selections',

  COPY: 'copy',
  PASTE: 'paste',
  DELETE: 'delete',

  LINK: 'link',

  UNDO: 'undo',
  REDO: 'redo',

  TOGGLE_CLIP_MENU: 'toggle_clip_menu'
};

GrafUi.prototype.setEditable = function(editable) {
  this.editable = editable;
};

GrafUi.prototype.startLoop = function() {
  this.grafEd.setCallback(this.getGrafEdInvalidationCallback());
  this.resize();
  this.clipboard.start();
  this.clipMenu.setOnSelect(this.getSelectClipMenuItemFn());
  this.clipMenu.render();

  if (!this.contentsFramed) {
    this.grafRend.frameContents(0.66);
    this.contentsFramed = true;
  }
  if (!this.listeners) {
    this.listeners = new plex.event.ListenerTracker();
    this.listeners.addListener(document, 'mousemove', this.getMouseMoveListener());

    this.listeners.addListener(this.renderer.canvas, 'mousedown', this.getMouseDownListener());
    this.listeners.addListener(document, 'mouseup', this.getMouseUpListener());

    this.listeners.addListener(this.renderer.canvas, 'mousewheel', this.getMouseWheelListener());
    this.listeners.addListener(this.renderer.canvas, 'DOMMouseScroll', this.getMouseWheelListener());
    this.listeners.addListener(this.renderer.canvas, 'wheel', this.getMouseWheelListener());

    this.listeners.addListener(document, 'keydown', this.getKeyDownListener());
    this.listeners.addListener(document, 'keyup', this.getKeyUpListener());

    this.listeners.addListener(window, 'resize', this.getResizeListener());
  }
  if (!this.loop) {
    var self = this;
    this.loop = new plex.Loop(
        function() {
          self.clock();
        },
        GrafUi.FPS);
  }
  this.loop.start();
};

GrafUi.prototype.stopLoop = function() {
  this.clipboard.stop();
  this.stopEditingData();
  if (this.listeners) {
    this.listeners.removeAllListeners();
    this.listeners = null;
  }
  if (this.loop) {
    this.loop.stop();
  }
  this.grafEd.unsubscribe();
};

GrafUi.prototype.setSnap = function(snap) {
  this.snap = snap;
};

GrafUi.prototype.getSelectClipMenuItemFn = function() {
  var self = this;
  return function(clip) {
    self.clipboard.setModel(clip.getModel());
    self.clipMenu.hide();
  };
};

GrafUi.prototype.getGrafEdInvalidationCallback = function() {
  var self = this;
  return function() {
    self.viewDirty = true;
    self.plugin.invalidate();
  };
};

GrafUi.prototype.getMouseMoveListener = function() {
  // Because there can be lots of mousemoves between frames,
  // defer handling moves until clock().
  var self = this;
  return function(event) {
    self.viewDirty = true;
    if (!self.panning) {
      self.pointerWorldPosChanged = true;
    }
    // Else we are mouse-panning, so the pointer's world pos remains the same,
    // even though the pointer's position on the viewport canvas changed.

    event = event || window.event;
    self.setCanvasPosWithEvent(event);
  };
};

GrafUi.prototype.getMouseDownListener = function() {
  var self = this;
  return function(event) {
    self.viewDirty = true;
    event = event || window.event;
    var worldPos = self.getWorldPosOfCanvasPos();
    var id = self.grafGeom.getIdAtVec(worldPos);
    var editId = self.grafGeom.getNearestEditButtonPartId(worldPos);
    var inDefaultMode = self.mode == GrafUi.Mode.DEFAULT;
    if (id == null && editId == null) {
      self.panning = true;
      self.setCanvasPosWithEvent(event);
    } else if (self.editable && inDefaultMode && editId) {
      self.startEditingData(editId);
    } else if (self.editable && inDefaultMode && self.grafEd.getJack(id)) {
      self.startDraggingJack(id);
    } else if (self.editable && inDefaultMode && self.grafEd.isSelected(id)) {
      self.startDraggingSelection();
    } else if (self.editable && inDefaultMode && self.grafEd.getPart(id)) {
      self.startDraggingPart(id);
    }
  };
};

GrafUi.prototype.getMouseUpListener = function() {
  var self = this;
  return function(event) {
    self.viewDirty = true;
    event = event || window.event;
    self.panning = false;
    self.setCanvasPosWithEvent(event);
    if (self.mode == GrafUi.Mode.DRAG_SELECTION) {
      self.endDraggingSelection();
    } else if (self.mode == GrafUi.Mode.DRAG_PART) {
      self.endDraggingPart();
    } else if (self.mode == GrafUi.Mode.DRAG_JACK) {
      self.endDraggingJack();
    }
  };
};

GrafUi.prototype.getMouseWheelListener = function() {
  var self = this;
  return function(event) {
    self.viewDirty = true;
    event = event || window.event;
    if ('wheelDeltaY' in event) {
      self.deltaZoom += event['wheelDeltaY'];
    } else if ('deltaY' in event) {
      self.deltaZoom += event['deltaY'];
    } else if ('detail' in event) {
      // Mozilla
      self.deltaZoom += event['detail'] * -30;
    }
    self.setCanvasPosWithEvent(event);
    event.preventDefault();
    return false;
  };
};

GrafUi.prototype.getKeyDownListener = function() {
  var self = this;
  return function(event) {
    // Don't act on keypresses if we're using the keyboard for data editing.
    if (self.mode == GrafUi.Mode.EDIT_DATA) return;

    event = event || window.event;

    if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.GRID_SNAP)) {
      self.snap *= 2;
      if (self.snap > GrafUi.MAX_SNAP) {
        self.snap = GrafUi.MIN_SNAP;
      }
    }

    if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.ADD_SELECTIONS)) {
      self.viewDirty = true;
      self.grafEd.addSelections();
    }
    if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.SUBTRACT_SELECTIONS)) {
      self.viewDirty = true;
      self.grafEd.subtractSelections();
    }

    // delete
    if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.DELETE)) {
      if (self.editable) {
        self.viewDirty = true;
        self.plugin.invalidate();
        self.grafEd.deleteSelection();
      }
      // don't do browser "back" navigation
      event.preventDefault();
    }

    // link
    if (self.editable && self.keyCombos.eventMatchesAction(event, GrafUi.Action.LINK)) {
      self.viewDirty = true;
      self.plugin.invalidate();
      self.grafEd.linkSelectedJacks();
    }

    // copy
    if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.COPY)) {
      self.copy();
    }

    // undo/redo
    if (self.editable && self.keyCombos.eventMatchesAction(event, GrafUi.Action.UNDO)) {
      self.viewDirty = true;
      self.plugin.invalidate();
      self.grafEd.undo();
    }
    if (self.editable && self.keyCombos.eventMatchesAction(event, GrafUi.Action.REDO)) {
      self.viewDirty = true;
      self.plugin.invalidate();
      self.grafEd.redo();
    }

    // toggle menu
    if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.TOGGLE_CLIP_MENU)) {
      self.clipMenu.toggle();
    }

    // unselect
    if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.UNSELECT)) {
      self.viewDirty = true;
      self.grafEd.popSelection();
    }
    // Mouse-motion quasimodes only work once we know where the mouse is.
    // Only allow one quasimode at a time.
    if (self.canvasPos && self.mode == GrafUi.Mode.DEFAULT) {

      // select pseudomode, or undo (pop) selection
      if (self.keyCombos.eventMatchesAction(event, GrafUi.Action.SELECT)) {
        self.startSelection();
      }

      // paste pseudomode
      if (self.editable && self.keyCombos.eventMatchesAction(event, GrafUi.Action.PASTE)) {
        var pasteModel = self.clipboard.getModel();
        if (pasteModel) {
          self.mode = GrafUi.Mode.PASTE;
          self.grafEd.startPasteVec(pasteModel, self.worldPos);
          self.viewDirty = true;
          self.plugin.invalidate();
        }
      }
    }
  };
};

GrafUi.prototype.getKeyUpListener = function() {
  var self = this;
  return function(event) {
    // Don't act on keypresses if we're using the keyboard for data editing.
    if (self.mode == GrafUi.Mode.EDIT_DATA) return;

    event = event || window.event;
    if (self.mode == GrafUi.Mode.PASTE &&
        self.keyCombos.eventMatchesAction(event, GrafUi.Action.PASTE)) {
      self.grafEd.continuePasteVec(self.worldPos, self.snap);
      self.grafEd.endPaste(false);
      self.viewDirty = true;
      self.mode = GrafUi.Mode.DEFAULT;
    }
    if (self.mode == GrafUi.Mode.SELECT &&
        self.keyCombos.eventMatchesAction(event, GrafUi.Action.SELECT)) {
      self.endSelection();
    }
  };
};


GrafUi.prototype.startEditingData = function(objId, opt_keys, opt_then) {
  if (!this.editable) return;
  this.editingId = objId;
  this.mode = GrafUi.Mode.EDIT_DATA;
  var obj = this.grafEd.getModel().getObj(objId);

  // create a little form I guess?
  this.editDiv = plex.dom.ce('div', document.body);
  this.editDiv.className = 'gedEditForm';

  var first = true;
  for (var key in obj.data) {
    if (opt_keys && !plex.array.contains(opt_keys, key)) continue;
    var field = plex.dom.ce('div', this.editDiv);
    field.classList.add('gedEditField');

    var labelElem = plex.dom.ce('label', field);
    labelElem.classList.add('gedEditLabel');
    plex.dom.ct(key + ':', labelElem);

    var val = obj.data[key];
    var inputElem = plex.dom.ce('input', field);
    inputElem.classList.add('gedEditInput');
    inputElem.value = val;
    inputElem.id = 'editdata_' + key;
    if (first) {
      window.setTimeout(function(){inputElem.focus()}, 0);
    }
    first = false;
  }
  var button = plex.dom.ce('button', this.editDiv);
  button.classList.add('gedEditButton');
  plex.dom.ct('Save & Close', button);
  button.onclick = this.getEditingOkFn(opt_then);
};

GrafUi.prototype.getEditingOkFn = function(opt_then) {
  var self = this;
  return function() {
    self.saveEditingData();
    self.stopEditingData();
    opt_then && opt_then();
  };
};

/**
 * Saves the data in the little object data form, if any
 */
GrafUi.prototype.saveEditingData = function() {
  if (!this.editDiv) return;
  var obj = this.grafEd.getModel().objs[this.editingId];
  var inputs = document.querySelectorAll('.gedEditInput');
  var changes = {};
  if (obj && inputs.length) {
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var key = input.id.split('_')[1];
      var val = input.value;
      if (key && key in obj.data && obj.data[key] != val) {
        changes[key] = input.value;
      }
    }
    if (!plex.object.isEmpty(changes)) {
      this.grafEd.editObjData(this.editingId, changes);
    }
  }
};

GrafUi.prototype.stopEditingData = function() {
  if (this.editDiv) {
    this.editDiv.innerHTML = '';
    document.body.removeChild(this.editDiv);
    this.editDiv = null;
  }
  this.editingId = null;
  this.mode = GrafUi.Mode.DEFAULT;
};

GrafUi.prototype.startSelection = function() {
  this.viewDirty = true;
  this.mode = GrafUi.Mode.SELECT;
  this.grafEd.startSelectionVec(this.worldPos);
};

GrafUi.prototype.endSelection = function() {
  this.grafEd.continueSelectionVec(this.worldPos);
  this.grafEd.endSelection();
  this.viewDirty = true;
  this.mode = GrafUi.Mode.DEFAULT;
};


GrafUi.prototype.startDraggingSelection = function() {
  this.mode = GrafUi.Mode.DRAG_SELECTION;
  this.grafEd.startDraggingSelectionVec(this.worldPos);
};

GrafUi.prototype.endDraggingSelection = function() {
  this.grafEd.continueDraggingSelectionVec(this.worldPos, this.snap);
  this.grafEd.endDraggingSelection();
  this.viewDirty = true;
  this.mode = GrafUi.Mode.DEFAULT;
};


/**
 * Start dragging a previously unselected part.
 * Creates a temporary selection.
 * @param partId
 */
GrafUi.prototype.startDraggingPart = function(partId) {
  //this.grafEd.createSelectionWithId(partId);
  this.mode = GrafUi.Mode.DRAG_PART;
  this.grafEd.startDraggingPartVec(partId, this.worldPos);
};

GrafUi.prototype.endDraggingPart = function() {
  this.grafEd.continueDraggingPartVec(this.worldPos, this.snap);
  this.grafEd.endDraggingPart();
  //this.grafEd.popSelection();
  this.viewDirty = true;
  this.mode = GrafUi.Mode.DEFAULT;
};

/**
 * Start to drag any jack, to form a link between two jacks.
 * Creates a temporary selection.
 * @param jackId
 */
GrafUi.prototype.startDraggingJack = function(jackId) {
  this.mode = GrafUi.Mode.DRAG_JACK;
  this.grafEd.startDraggingJack(jackId, this.worldPos);
};

GrafUi.prototype.endDraggingJack = function() {
  this.grafEd.continueDraggingJackVec(this.worldPos);
  this.grafEd.endDraggingJack();
  this.viewDirty = true;
  this.mode = GrafUi.Mode.DEFAULT;
};


GrafUi.prototype.getResizeListener = function() {
  var self = this;
  return function(event) {
    self.resize();
  };
};

GrafUi.prototype.resize = function() {
  var s = plex.window.getSize();
  this.renderer.setCanvasWidthHeight(s.width, s.height);
  this.viewDirty = true;
};

GrafUi.prototype.copy = function() {
  var model = this.grafEd.copySelectedModel();
  if (model) {
    this.clipboard.setModel(model);
  }
};

GrafUi.prototype.setCanvasPosWithEvent = function(event) {
  var target = plex.event.getTarget(event);
  if (!this.canvasPos) this.canvasPos = new Vec2d();
  this.canvasPos.setXY(
      event.pageX - this.renderer.getCanvasPageX(),
      event.pageY - this.renderer.getCanvasPageY());
};

GrafUi.prototype.getWorldPosOfCanvasPos = function() {
  return (new Vec2d())
      .set(this.canvasPos)
      .addXY(-this.renderer.getCanvasWidth() / 2, -this.renderer.getCanvasHeight() / 2)
      .scale(1 / this.renderer.getZoom())
      .add(this.renderer.getPan());
};

GrafUi.prototype.setWorldPos = function(pos) {
  this.worldPos.set(pos);
};

GrafUi.prototype.clock = function() {

  if (this.pointerWorldPosChanged && this.canvasPos) {
    this.setWorldPos(this.getWorldPosOfCanvasPos());
    this.pointerWorldPosChanged = false;
  }
  if (this.mode == GrafUi.Mode.SELECT) {
    this.grafEd.continueSelectionVec(this.worldPos);
  } else if (this.mode == GrafUi.Mode.DRAG_SELECTION) {
    this.grafEd.continueDraggingSelectionVec(this.worldPos, this.snap);
    this.plugin.invalidate();
  } else if (this.mode == GrafUi.Mode.DRAG_PART) {
    this.grafEd.continueDraggingPartVec(this.worldPos, this.snap);
    this.plugin.invalidate();
  } else if (this.mode == GrafUi.Mode.DRAG_JACK) {
    this.grafEd.continueDraggingJackVec(this.worldPos);
    this.plugin.invalidate();
  } else if (this.mode == GrafUi.Mode.PASTE) {
    this.grafEd.continuePasteVec(this.worldPos, this.snap);
    this.plugin.invalidate();
  }

  // Zooming
  if (this.deltaZoom) {
    this.viewDirty = true;
    this.renderer.scaleZoom(Math.exp(this.deltaZoom/2000));
    var z = this.renderer.getZoom();
    if (z < GrafUi.MIN_ZOOM) this.renderer.setZoom(GrafUi.MIN_ZOOM);
    if (z > GrafUi.MAX_ZOOM) this.renderer.setZoom(GrafUi.MAX_ZOOM);
    this.deltaZoom = 0;
  }

  if (this.canvasPos) {
    // If the the pointer's screen position doesn't match the pointer's world position,
    // then this will pan the canvas to adjust.
    // This is the mechanism that makes the pointer stick to the world perfectly while zooming,
    // and it's the way the view gets scrolled when panning.
    var worldPosOfCanvasPos = this.getWorldPosOfCanvasPos();
    var panCorrection = worldPosOfCanvasPos.subtract(this.worldPos).scale(-1);
    this.renderer.addPan(panCorrection);
  }
  this.draw();
};

GrafUi.prototype.draw = function() {
  if (!this.viewDirty) return;

  this.grafRend.draw();

  this.renderer.transformStart();

  // selections
  var selectionsSize = this.grafEd.getSelectionsSize();
  var alpha = 0.9;
  this.renderer.context.lineWidth = GrafUi.SELECTION_LINE_WIDTH / this.renderer.getZoom();
  for (var i = 0; i < Math.min(selectionsSize, GrafUi.SELECTION_COLORS.length); i++) {
    this.renderer.setStrokeStyle(GrafUi.SELECTION_COLORS[i]);
    var selIds = this.grafEd.getSelectedIds(i);
    for (var s = 0; s < selIds.length; s++) {
      var id = selIds[s];
      var selPos = this.grafGeom.getPosById(id);
      if (!selPos) continue;
      var selRad = this.grafGeom.getRadById(id);
      selRad += (GrafUi.SELECTION_COLORS.length - i) *
          GrafUi.SELECTION_RENDER_PADDING / this.renderer.getZoom();
      this.renderer.strokeCirclePosXYRad(selPos.x, selPos.y, selRad);
    }
    alpha *= 0.75;
  }

  // hilite
  this.renderer.setStrokeStyle(GrafUi.HILITE_COLOR);
  this.renderer.context.lineWidth = GrafUi.HILITE_LINE_WIDTH / this.renderer.getZoom();
  var hiliteRect = this.grafEd.getHiliteRect();
  if (hiliteRect) {
    this.renderer.strokeRectCornersXYXY(
        hiliteRect[0], hiliteRect[1],
        hiliteRect[2], hiliteRect[3]);
  }
  this.strokeHiliteForIds(this.grafEd.getHilitedIds());

  // hover
  this.renderer.setStrokeStyle(GrafUi.HOVER_COLOR);
  this.strokeHiliteForIds(this.grafGeom.getIdsAtXY(this.worldPos.x, this.worldPos.y));
  this.strokeHiliteForEditButton(this.grafGeom.getNearestEditButtonPartId(this.worldPos));

  // link-mode indicator, when there's no staged link operation
  if (this.mode == GrafUi.Mode.DRAG_JACK && !this.grafEd.hasStagedOps()) {
    this.renderer.context.lineWidth = GrafRend.MODEL_LINE_WIDTH / this.renderer.getZoom();
    this.renderer.setStrokeStyle(GrafRend.MODEL_PREVIEW_STROKE_STYLE);
    this.renderer.drawLineVV(
        this.grafGeom.getPosById(this.grafEd.dragJackId),
        this.grafEd.dragJackEnd);
  }

  this.renderer.transformEnd();
  this.viewDirty = false;

};

GrafUi.prototype.strokeHiliteForIds = function(ids) {
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var pos = this.grafGeom.getPosById(id);
    var rad = this.grafGeom.getRadById(id);
    this.renderer.strokeCirclePosXYRad(pos.x, pos.y, rad);
  }
};

GrafUi.prototype.strokeHiliteForEditButton = function(id) {
  if (!id) return;
  var pos = this.grafGeom.getEditButtonPos(id);
  this.renderer.strokeCirclePosXYRad(pos.x, pos.y, GrafGeom.EDIT_RADIUS);
};
/**
 * Map from GedUI.Action to plex.KeyEventDesc
 * @param {plex.Keys} keys for getting keycodes
 * @constructor
 */
function GrafUiKeyCombos(keys) {
  this.keys = keys;
  // map from action to array of key event descs
  this.keyEventDescs = null;
}

/**
 * @return map from action name to keyEventDesc
 */
GrafUiKeyCombos.prototype.getAll = function() {
  if (!this.keyEventDescs) {
    this.keyEventDescs = {};
    var self = this;
    function ked(action, keyName, opt_modifiers) {
      if (!self.keyEventDescs[action]) {
        self.keyEventDescs[action] = [];
      }
      self.keyEventDescs[action].push(new plex.KeyCombo(
          self.keys.getKeyCodeForName(keyName),
          opt_modifiers));
    }

    var SHIFT = [plex.KeyModifier.SHIFT];

    ked(GrafUi.Action.GRID_SNAP, 'g');

    ked(GrafUi.Action.SELECT, 's');
    ked(GrafUi.Action.UNSELECT, 's', SHIFT);
    ked(GrafUi.Action.ADD_SELECTIONS, 'a');
    ked(GrafUi.Action.SUBTRACT_SELECTIONS, 'a', SHIFT);

    ked(GrafUi.Action.COPY, 'c');
    ked(GrafUi.Action.PASTE, 'v');
    ked(GrafUi.Action.DELETE, plex.Key.Name.DELETE);
    ked(GrafUi.Action.DELETE, plex.Key.Name.BACKSPACE);

    ked(GrafUi.Action.DRAG_SELECTION, 'd');
    ked(GrafUi.Action.LINK, 'l');

    ked(GrafUi.Action.UNDO, 'z');
    ked(GrafUi.Action.REDO, 'z', SHIFT);

    ked(GrafUi.Action.TOGGLE_CLIP_MENU, 'm');
  }
  return this.keyEventDescs;
};

GrafUiKeyCombos.prototype.getCombo = function(action) {
  return this.getAll()[action];
};

GrafUiKeyCombos.prototype.eventMatchesAction = function(event, action) {
  var eventDescs = this.getCombo(action)
  if (!eventDescs) return false;
  for (var i = 0; i < eventDescs.length; i++) {
    var desc = eventDescs[i];
    if (desc.matches(event)) return true;
  }
  return false;
};

/**
 * A stack of StringSets.
 * Supports some stack math.
 * This doesn't make defensive copies, so try not to screw up.
 * @constructor
 */
function SelStack() {
  this.stack = [];
}

/**
 * @return {Number}
 */
SelStack.prototype.size = function() {
  return this.stack.length;
};

/**
 * @param {plex.StringSet} selection
 */
SelStack.prototype.push = function(selection) {
  if (selection.constructor != plex.StringSet) {
    throw Error("selection.constructor == " + (selection.constructor));
  }
  this.stack.push(selection);
};

/**
 * @return {plex.StringSet?} or undefined
 */
SelStack.prototype.pop = function() {
  if (!this.stack.length) return null;
  return this.stack.pop();
};

/**
 * @param {number?} opt_num  Distance from the head. Default is 0, the head.
 * @return {plex.StringSet?} or null
 */
SelStack.prototype.peek = function(opt_num) {
  var num = opt_num || 0;
  if (this.stack.length <= num) return null;
  return this.stack[this.stack.length - 1 - num] || null;
};

/**
 * Pops the top two selections and pushes the sum.
 * Does nothing if there are fewer than 2 selections.
 */
SelStack.prototype.add = function() {
  if (this.size() < 2) return;
  this.push(this.pop().add(this.pop()));
};

/**
 * Pops the top two elements and pushes the second selection minus the first one.
 * If there's just one, it pops it. If there's nothing, this does nothing.
 */
SelStack.prototype.subtract = function() {
  if (this.size() == 0) return;
  if (this.size() == 1) {
    this.pop();
    return;
  }
  var neg = this.pop();
  this.push(this.pop().subtract(neg));
};

/**
 * @constructor
 */
function GrafCluster(op) {
  this.id = op.id;
  this.data = {}; // key/value pairs.
  this.parts = {};
}

GrafCluster.prototype.isEmpty = function() {
  for (var d in this.data) return false;
  for (var p in this.parts) return false;
  return true;
};

GrafCluster.prototype.addPart = function(part) {
  this.parts[part.id] = part;
};

GrafCluster.prototype.removePart = function(part) {
  delete this.parts[part.id];
};

GrafCluster.prototype.getPartList = function() {
  return plex.object.values(this.parts);
};

GrafCluster.prototype.getType = function() {
  return this.data.type;
};

/**
 * @constructor
 */
function GrafJack(op) {
  this.id = op.id;
  this.data = {}; // key/value pairs.
  this.partId = op.partId;
  this.links = {};
}

GrafJack.prototype.isEmpty = function() {
  for (var d in this.data) return false;
  for (var l in this.links) return false;
  return true;
};

GrafJack.prototype.addLink = function(link) {
  this.links[link.id] = link;
};

GrafJack.prototype.removeLink = function(link) {
  delete this.links[link.id];
};

GrafJack.prototype.getType = function() {
  return this.data.type;
};

GrafJack.prototype.getName = function() {
  return this.data.name;
};

GrafJack.prototype.isInput = function() {
  return this.getType() == JackAddress.Type.INPUT;
};

GrafJack.prototype.isOutput = function() {
  return this.getType() == JackAddress.Type.OUTPUT;
};

/**
 * @constructor
 */
function GrafLink(op) {
  this.id = op.id;
  this.data = {}; // key/value pairs.
  this.jackId1 = op.jackId1;
  this.jackId2 = op.jackId2;
}

GrafLink.prototype.isEmpty = function() {
  for (var d in this.data) return false;
  return true;
};

/**
 * @constructor
 */
function GrafModel() {
  this.objs = {};
  this.clusters = {};
  this.parts = {};
  this.jacks = {};
  this.links = {};
  this.size = 0;

  this.lastId = 0;
}

/**
 * Returns a new ID that is not currently in use.
 * Will never return the same ID twice.
 * @return {number}
 */
GrafModel.prototype.newId = function() {
  this.lastId++;
  while (this.objs[this.lastId]) {
    this.lastId++;
  }
  return this.lastId;
};

/**
 * Mutates the model.  If an error happens, the model is left partly mutated.
 * @param ops  array of GrafOp JSON objects
 */
GrafModel.prototype.applyOps = function(ops) {
  for (var i = 0; i < ops.length; i++) {
    this.applyOp(ops[i]);
  }
};

/**
 * Mutates the model, or throws an error.
 * @param op  a GrafOp JSON object
 */
GrafModel.prototype.applyOp = function(op) {
  var cluster, part, jack, link, jack1, jack2, obj;
  function dumpOp() {
    return JSON.stringify(op);
  }
  var self = this;
  function assertOpIdFree() {
    if (self.objs[op.id]) {
      throw Error('Obj with ID already exists: ' + dumpOp());
    }
  }
  function assertObjExists(obj) {
    if (!obj) {
      throw Error('Obj does not exist: ' + dumpOp());
    }
  }
  function assertParentExists(obj) {
    if (!obj) {
      throw Error('Parent does not exist: ' + dumpOp());
    }
  }
  function assertIsEmpty(obj) {
    if (!obj.isEmpty()) {
      throw Error('Cannot apply op ' + dumpOp() +
          ' because obj to remove is not empty: ' + obj.toString());
    }
  }
  function assertRemovable(obj) {
    assertObjExists(obj);
    assertIsEmpty(obj);
  }
  if (!op) throw Error('Cannot apply falsy op: ' + op);
  switch (op.type) {
    case GrafOp.Type.ADD_CLUSTER: {
      assertOpIdFree();
      this.objs[op.id] = this.clusters[op.id] = new GrafCluster(op);
      this.size++;
      break;
    }
    case GrafOp.Type.REMOVE_CLUSTER: {
      cluster = this.getCluster(op.id);
      assertRemovable(cluster);
      delete this.clusters[op.id];
      delete this.objs[op.id];
      this.size--;
      break;
    }
    case GrafOp.Type.ADD_PART: {
      assertOpIdFree();
      cluster = this.getCluster(op.clusterId);
      assertParentExists(cluster);
      part = new GrafPart(op);
      cluster.addPart(part);
      this.objs[op.id] = this.parts[op.id] = part;
      this.size++;
      break;
    }
    case GrafOp.Type.REMOVE_PART: {
      part = this.getPart(op.id);
      assertRemovable(part);
      cluster = this.getCluster(part.clusterId);
      assertParentExists(cluster);
      cluster.removePart(part);
      delete this.parts[op.id];
      delete this.objs[op.id];
      this.size--;
      break;
    }
    case GrafOp.Type.MOVE_PART: {
      part = this.getPart(op.id);
      assertObjExists(part);
      if (part.x != op.oldX || part.y != op.oldY) {
        throw Error('Part\'s current coords ' + [part.x, part.y] +
            ' do not match op\'s oldX/Y coords. ' + dumpOp());
      }
      part.x = op.x;
      part.y = op.y;
      break;
    }
    case GrafOp.Type.ADD_JACK: {
      assertOpIdFree();
      part = this.getPart(op.partId);
      assertParentExists(part);
      jack = new GrafJack(op);
      part.addJack(jack);
      this.objs[op.id] = this.jacks[op.id] = jack;
      this.size++;
      break;
    }
    case GrafOp.Type.REMOVE_JACK: {
      jack = this.getJack(op.id);
      assertRemovable(jack);
      part = this.getPart(jack.partId);
      assertParentExists(part);
      part.removeJack(jack);
      delete this.jacks[op.id];
      delete this.objs[op.id];
      this.size--;
      break;
    }
    case GrafOp.Type.ADD_LINK: {
      assertOpIdFree();
      jack1 = this.getJack(op.jackId1);
      assertParentExists(jack1);
      jack2 = this.getJack(op.jackId2);
      assertParentExists(jack2);
      link = new GrafLink(op);
      jack1.addLink(link);
      jack2.addLink(link);
      this.objs[op.id] = this.links[op.id] = link;
      this.size++;
      break;
    }
    case GrafOp.Type.REMOVE_LINK: {
      link = this.getLink(op.id);
      assertRemovable(link);
      jack1 = this.getJack(link.jackId1);
      jack2 = this.getJack(link.jackId2);
      assertParentExists(jack1);
      assertParentExists(jack2);
      jack1.removeLink(link);
      jack2.removeLink(link);
      delete this.links[op.id];
      delete this.objs[op.id];
      this.size--;
      break;
    }
    case GrafOp.Type.SET_DATA: {
      obj = this.objs[op.id];
      assertObjExists(obj);
      if (obj.data[op.key] != op.oldValue) {
        throw Error('expected oldValue ' + op.oldValue +
            ' does not match actual value ' + obj.data[op.key]);
      }
      if (typeof op.value === 'undefined') {
        delete obj.data[op.key];
      } else {
        obj.data[op.key] = op.value;
      }
      break;
    }
    default:
      throw Error('cannot apply op: ' + expose(op));
  }
};

GrafModel.prototype.getCluster = function(id) {
  return this.clusters[id];
};

GrafModel.prototype.getPart = function(id) {
  return this.parts[id];
};

GrafModel.prototype.getJack = function(id) {
  return this.jacks[id];
};

GrafModel.prototype.getLink = function(id) {
  return this.links[id];
};

GrafModel.prototype.getObj = function(id) {
  return this.objs[id];
};

/**
 * @param {GrafModel} model  something to paste into this model
 * @return {Array.<Object>}
 */
GrafModel.prototype.opsForAddModel = function(model) {
  var ops = model.createOps();
  this.rewriteOpIds(ops);
  return ops;
};

/**
 * @param {GrafModel} model  something to paste into this model
 */
GrafModel.prototype.addModel = function(model) {
  this.applyOps(this.opsForAddModel(model));
};

GrafModel.prototype.clear = function() {
  plex.object.clear(this.objs);
  plex.object.clear(this.clusters);
  plex.object.clear(this.parts);
  plex.object.clear(this.jacks);
  plex.object.clear(this.links);
  this.size = 0;
};

GrafModel.prototype.createSetDataOps = function(objId) {
  var ops = [];
  var obj = this.objs[objId];
  for (var key in obj.data) {
    ops.push({
      type: GrafOp.Type.SET_DATA,
      id: Number(objId),
      key: key,
      oldValue: undefined,
      value: obj.data[key]
    });
  }
  return ops;
};

/**
 * @param clusterId
 * @return {Array} ops
 */
GrafModel.prototype.createClusterOps = function(clusterId) {
  var ops = [];
  var cluster = this.clusters[clusterId];
  clusterId = Number(clusterId);
  ops.push({
    type: GrafOp.Type.ADD_CLUSTER,
    id: clusterId
  });
  plex.array.extend(ops, this.createSetDataOps(clusterId));

  // Add cluster's parts.
  for (var partIdStr in cluster.parts) {
    var partId = Number(partIdStr);
    var part = cluster.parts[partId];
    ops.push({
      type: GrafOp.Type.ADD_PART,
      id: partId,
      clusterId: clusterId,
      x: part.x,
      y: part.y
    });
    plex.array.extend(ops, this.createSetDataOps(partId));

    // Add part's jacks.
    for (var jackIdStr in part.jacks) {
      var jackId = Number(jackIdStr);
      ops.push({
        type: GrafOp.Type.ADD_JACK,
        id: jackId,
        partId: partId
      });
      plex.array.extend(ops, this.createSetDataOps(jackId));
    }
  }
  return ops;
};

/**
 * @param linkId
 * @return {Array} ops
 */
GrafModel.prototype.createLinkOps = function(linkId) {
  var ops = [];
  linkId = Number(linkId);
  var link = this.links[linkId];
  ops.push({
    type: GrafOp.Type.ADD_LINK,
    id: linkId,
    jackId1: link.jackId1,
    jackId2: link.jackId2
  });
  plex.array.extend(ops, this.createSetDataOps(linkId));
  return ops;
};

/**
 * @return {Array.<Object>} a JSON array of ops that can be used to create an identical model.
 * Since that re-uses this model's IDs, it can't be added to this model.
 * See "rewriteOpIds(ops)"
 */
GrafModel.prototype.createOps = function() {
  var ops = [];
  for (var clusterId in this.clusters) {
    plex.array.extend(ops, this.createClusterOps(clusterId))
  }
  for (var linkId in this.links) {
    plex.array.extend(ops, this.createLinkOps(linkId));
  }
  return ops;
};

/**
 * Overwrites the op IDs to new IDs from this model's ID generator,
 * so the ops can be applied to this model.
 * So if this model is empty, the op IDs will be given small numbers.
 * @return {Object} idMap from old ID to new ID
 */
GrafModel.prototype.rewriteOpIds = function(ops) {
  var self = this;
  var idMap = {};

  function addId(oldId) {
    if (idMap[oldId]) {
      throw Error('the list of ops seems to have included the same ID twice: ' + oldId);
    }
    var newId = self.newId();
    idMap[oldId] = newId;
    return newId;
  }
  function getId(oldId) {
    var newId = idMap[oldId];
    if (!newId) {
      throw Error('model refers to nonexistent id: ' + oldId);
    }
    return newId;
  }

  function rewriteId(op, fieldName) {
    if (op[fieldName]) {
      op[fieldName] = getId(op[fieldName]);
    }
  }

  // These are the names of fields that reference other IDs.
  // Parts have clusterIds, jacks have partIds, and links have jackIds 1 and 2.
  var fieldNames = ['clusterId', 'partId', 'jackId1', 'jackId2'];

  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    if (GrafOp.isAddOpType(op.type)) {
      // For add ops, the id is the new object's ID.
      op.id = addId(op.id);
    } else {
      // For non-add ops, the id points to the object to be changed.
      rewriteId(op, "id");
    }
    for (var j = 0; j < fieldNames.length; j++) {
      rewriteId(op, fieldNames[j]);
    }
  }
  return idMap;
};

GrafModel.prototype.getLinksBetweenJacks = function(jackId1, jackId2) {
  var links = [];
  var jack1 = this.getJack(jackId1);
  var jack2 = this.getJack(jackId2);
  for (var linkId1 in jack1.links) {
    for (var linkId2 in jack2.links) {
      if (linkId1 == linkId2) {
        links.push(jack1.links[linkId1]);
      }
    }
  }
  return links;
};

/**
 * @param {Array} clusterIds the IDs of clusters in this model to copy.
 * @return {GrafModel} A new model containing only the clusters in clusterIds,
 * plus the links between jacks in those clusters.
 */
GrafModel.prototype.copyClusters = function(clusterIds) {
  var copy = new GrafModel();
  var handledClusters = {};
  for (var i = 0; i < clusterIds.length; i++) {
    var id = clusterIds[i];
    if (!handledClusters[id]) {
      copy.applyOps(this.createClusterOps(id));
      handledClusters[id] = true;
    }
  }
  for (var linkId in this.links) {
    var link = this.getLink(linkId);
    if (copy.jacks[link.jackId1] && copy.jacks[link.jackId2]) {
      copy.applyOps(this.createLinkOps(linkId));
    }
  }
  return copy;
};


/**
 * This class is just a namespace for static values and methods.
 * A real Graf operation is JSON, like so:
 *
 * { type:"addCluster",  id: 1 }
 * { type:"removeCluster", id:1 }
 *
 * { type:"addPart", id:2, clusterId:1, x:10, y:10 }
 * { type:“movePart", id:2, oldX:10, oldY:10, x:20, y:20}
 * { type:“removePart", id:2, clusterId:1, x:20, y:20 }
 *
 * { type:"addJack", id:3, partId:2 }
 * { type:"removeJack", id:3, partId:2 }
 *
 * { type:"addLink", id:5, jackId1:3, jackId2:4}
 * { type:"removeLink", id:5, jackId1:3, jackId2:4}
 *
 * Every instance of the object types above has its own key/value store.
 * Use "setData" ops to update those stores.  Set a value as undefined to erase
 * it.
 * { type:"setData", id:2, key:"color", oldValue:undefined, value:"red" }
 * { type:"setData", id:2, key:"color", oldValue:"red", value:"blue" }
 * { type:"setData", id:2, key:"color", oldValue:"blue", value:undefined }
 */
function GrafOp() {}

/**
 * @enum {string}
 */
GrafOp.Type = {
  ADD_CLUSTER: 'addCluster',
  REMOVE_CLUSTER: 'removeCluster',
  ADD_PART: 'addPart',
  MOVE_PART: 'movePart',
  REMOVE_PART: 'removePart',
  ADD_JACK: 'addJack',
  REMOVE_JACK: 'removeJack',
  ADD_LINK: 'addLink',
  REMOVE_LINK: 'removeLink',
  SET_DATA: 'setData'
};

GrafOp.isAddOpType = function(type) {
  return type == GrafOp.Type.ADD_CLUSTER ||
      type == GrafOp.Type.ADD_PART ||
      type == GrafOp.Type.ADD_JACK ||
      type == GrafOp.Type.ADD_LINK;
};

/**
 * Create a list of ops that will reverse the input list.
 */
GrafOp.createReverses = function(ops) {
  var reverses = [];
  for (var i = ops.length - 1; i >= 0; i--) {
    reverses.push(GrafOp.createReverse(ops[i]));
  }
  return reverses;
};

/**
 * Create the reverse of a single op.
 */
GrafOp.createReverse = function(op) {
  if (!op) throw Error('cannot reverse falsy op: ' + op);
  switch(op['type']) {
    case GrafOp.Type.ADD_CLUSTER:
      return {
        'type': GrafOp.Type.REMOVE_CLUSTER,
        'id': op['id']
      };
    case GrafOp.Type.REMOVE_CLUSTER:
      return {
        'type': GrafOp.Type.ADD_CLUSTER,
        'id': op['id']
      };
    case GrafOp.Type.ADD_PART:
      return {
        'type': GrafOp.Type.REMOVE_PART,
        'id': op['id'],
        'clusterId': op['clusterId'],
        'x': op['x'],
        'y': op['y']
      };
    case GrafOp.Type.REMOVE_PART:
      return {
        'type': GrafOp.Type.ADD_PART,
        'id': op['id'],
        'clusterId': op['clusterId'],
        'x': op['x'],
        'y': op['y']
      };
    case GrafOp.Type.MOVE_PART:
      return {
        'type': GrafOp.Type.MOVE_PART,
        'id': op['id'],
        'x': op['oldX'],
        'y': op['oldY'],
        'oldX': op['x'],
        'oldY': op['y']
      };
    case GrafOp.Type.ADD_JACK:
      return {
        'type': GrafOp.Type.REMOVE_JACK,
        'id': op['id'],
        'partId': op['partId']
      };
    case GrafOp.Type.REMOVE_JACK:
      return {
        'type': GrafOp.Type.ADD_JACK,
        'id': op['id'],
        'partId': op['partId']
      };
    case GrafOp.Type.ADD_LINK:
      return {
        'type': GrafOp.Type.REMOVE_LINK,
        'id': op['id'],
        'jackId1': op['jackId1'],
        'jackId2': op['jackId2']
      };
    case GrafOp.Type.REMOVE_LINK:
      return {
        'type': GrafOp.Type.ADD_LINK,
        'id': op['id'],
        'jackId1': op['jackId1'],
        'jackId2': op['jackId2']
      };
    case GrafOp.Type.SET_DATA:
      return {
        'type': GrafOp.Type.SET_DATA,
        'id': op['id'],
        'key': op['key'],
        'value': op['oldValue'],
        'oldValue': op['value']
      };
    default:
      throw Error('cannot reverse op: ' + expose(op));
  }
};

/**
 * @constructor
 */
function GrafPart(op) {
  this.id = op.id;
  this.data = {};
  this.clusterId = op.clusterId;
  this.x = op.x;
  this.y = op.y;
  this.jacks = {};
}

GrafPart.prototype.isEmpty = function() {
  for (var d in this.data) return false;
  for (var j in this.jacks) return false;
  return true;
};

GrafPart.prototype.hasData = function() {
  for (var d in this.data) return true;
  return false;
};

GrafPart.prototype.addJack = function(jack) {
  this.jacks[jack.id] = jack;
};

GrafPart.prototype.removeJack = function(jack) {
  delete this.jacks[jack.id];
};

GrafPart.prototype.getJack = function(id) {
  return this.jacks[id];
};

GrafPart.prototype.getJackList = function() {
  return plex.object.values(this.jacks);
};

/**
 * @constructor
 */
function GrafTemplate(id, ops) {
  this.id = id;
  this.ops = ops;
}

GrafTemplate.AUTO = '$TEMPLATE-AUTO';
GrafTemplate.PARAM = '$TEMPLATE-PARAM';

/**
 * If the template matches the realOps, then this returns the template array
 * that rebuilds the ops.
 * But if this isn't the right template for these ops, then this returns null.
 * @param {Array.<Object>} realOps
 * @return {Array.<Object>?}
 */
GrafTemplate.prototype.getParamsOrNull = function(realOps) {
  // Generate a list of param values, returning early if there's a clear mismatch.
  if (realOps.length != this.ops.length) return null;
  var params = [this.id];
  for (var i = 0; i < realOps.length; i++) {
    var tOp = this.ops[i], rOp = realOps[i];
    var tKeys = plex.object.keys(plex.object.deleteUndefined(tOp));
    var rKeys = plex.object.keys(plex.object.deleteUndefined(rOp));
    if (!plex.array.equals(tKeys, rKeys)) {
      return null;
    }
    for (var k = 0; k < tKeys.length; k++) {
      var key = tKeys[k];
      var tVal = tOp[key], rVal = rOp[key];
      if (tVal == GrafTemplate.PARAM) {
        params.push(rVal);
      }
    }
  }

  // Create ops using those params.
  // If the created ops match the real ops, we have a winner!
  var genOps = this.generateOps(params);
  var genJsons = [], realJsons = [];
  for (var i = 0; i < genOps.length; i++) {
    genJsons[i] = JSON.stringify(genOps[i]);
    realJsons[i] = JSON.stringify(realOps[i]);
  }
  genJsons.sort();
  realJsons.sort();
  if (JSON.stringify(genJsons) == JSON.stringify(realJsons)) {
    return params;
  } else {
    return null;
  }
};

/**
 * @param {Array} params
 * @return {Array}
 */
GrafTemplate.prototype.generateOps = function(params) {
  function assertIdSet(id) {
    if (!id) throw 'ID not set';
    return id;
  }
  var genOps = JSON.parse(JSON.stringify(this.ops));
  var op;
  var clusterId, partId, lastId;
  if (params[0] != this.id) {
    throw 'Expected param[0] to be ' + this.id + ' but was ' + params[0];
  }
  var nextParam = 1;
  for (var i = 0; i < genOps.length; i++) {
    op = genOps[i];
    for (var key in op) {
      if (op[key] == GrafTemplate.PARAM) {
        var paramVal = params[nextParam++];
        if (key == 'id' && op.type != GrafOp.Type.SET_DATA) {
          // Only the first op, a cluster or link, can have a param ID.
          if (i != 0) {
            throw 'Only the first op in a template can have a param for an ID. op #' + i + ': ' + JSON.stringify(op);
          }
          lastId = paramVal;
          // Maybe assign the top-level ID
          if (op.type == GrafOp.Type.ADD_CLUSTER) {
            clusterId = paramVal;
          } else if (op.type == GrafOp.Type.ADD_LINK) {
            // no need to track link's ID since links have no sub-objects
          } else {
            throw 'Only an add-cluster or add-link can have a param for an ID. op: ' + JSON.stringify(op);
          }
        }
        // OK, fill in the PARAM value.
        op[key] = paramVal;

      } else if (op[key] == GrafTemplate.AUTO) {
        if (!lastId) {
          throw 'cannot assign an ID automatically when there is no prev ID';
        }
        if (key == 'id' && op.type != GrafOp.Type.SET_DATA) {
          // Assign a new auto-gen ID and remember it.
          lastId++;
          if (op.type == GrafOp.Type.ADD_CLUSTER) {
            clusterId = lastId;
          } else if (op.type == GrafOp.Type.ADD_PART) {
            partId = lastId;
          }
          op[key] = lastId;
        } else if (key == 'clusterId') {
          // addPart to cluster
          op[key] = assertIdSet(clusterId);
        } else if (key == 'partId') {
          // addJack to part
          op[key] = assertIdSet(partId);
        } else if (key == 'id' && op.type == GrafOp.Type.SET_DATA) {
          // setData on something
          op[key] = lastId;
        } else {
          throw 'Cannot AUTO a non-ID field. Op: ' + JSON.stringify(op);
        }
      }
    }
  }
  return genOps;
};

/**
 * @param {Array.<GrafTemplate>} templates
 * @constructor
 */
function GrafTemplatizer(templates) {
  this.templates = templates;
  this.map = {};
  for (var i = 0; i < templates.length; i++) {
    var template = templates[i];
    this.map[template.id] = template;
  }
}

/**
 * @param graf
 * @return {Array} Array of param arrays
 */
GrafTemplatizer.prototype.templatize = function(graf) {
  var paramList = [];
  for (var id in graf.clusters) {
    var ops = graf.createClusterOps(id);
    paramList.push(this.createParamsForOps(ops));
  }
  for (var id in graf.links) {
    var ops = graf.createLinkOps(id);
    paramList.push(this.createParamsForOps(ops));
  }
  return paramList;
};

GrafTemplatizer.prototype.detemplatize = function(paramList) {
  var ops = [];
  for (var i = 0; i < paramList.length; i++) {
    var params = paramList[i];
    var template = this.map[params[0]];
    plex.array.extend(ops, template.generateOps(params));
  }
  return ops;
};

GrafTemplatizer.prototype.createParamsForOps = function(ops) {
  for (var i = 0; i < this.templates.length; i++) {
    var params = this.templates[i].getParamsOrNull(ops);
    if (params) {
      return params;
    }
  }
  throw 'no template found for ops ' + JSON.stringify(ops);
};


/**
 * A key/valuelist store where .
 * @param {Object} storage  usually localStorage or sessionStorage
 * @param {String} prefix A prefix to identify all the keys in storage that belong to this Stor.
 * @constructor
 */
function Stor(storage, prefix) {
  this.storage = storage;
  this.prefix = prefix;

  this.namePrefix = this.prefix + '/' + Stor.NAME + '/';
  this.dataPrefix = this.prefix + '/' + Stor.DATA + '/';
  this.lastIndex = {}; // cache of dataId to lastIndex
  this.idToName = {}; // another awesome cache
  this.pubsub = new plex.PubSub();
}

Stor.NAME = 'name';
Stor.DATA = 'data';

Stor.Ops = {
  APPEND_VALUE: 'append_value'
};

Stor.prototype.getPrefix = function() {
  return this.prefix;
};

//prefix/name/awesometown-level: abc
//prefix/data/abc/1: [{...},...]
//prefix/data/abc/2: [{...},...]

Stor.prototype.listenToStorage = function() {
  window.addEventListener("storage", this.getStorageListener(), true);
};

Stor.prototype.getStorageListener = function() {
  var self = this;
  return function storStorageListener(e) {
    var key = String(e.key);
    var keyRegex = /^([^\/]+)\/([^\/]+)\/(.*)$/g;
    var m = keyRegex.exec(key);
    // Other storage events, like clip manipulation, can trigger this listener.
    if (m && m[1] && m[2] && m[3]) {
      var prefix = m[1];
      var type = m[2];
      var tail = m[3];
      if (prefix != self.prefix) return;
      if (type == Stor.DATA) {
        var dataRegex = /^([^\/]+)\/(.*)$/g;
        var dataSplit = dataRegex.exec(tail);
        var id = dataSplit[1];
        var name = self.getNameForId(id);
        if (name) {
          self.pubsub.publish(Stor.Ops.APPEND_VALUE, name, JSON.parse(e.newValue));
        }
      } else if (type == Stor.NAME) {
        // TODO rename op?
      }
    }
  };
};

/**
 * @return {Array} the names of all the objects in this Stor
 */
Stor.prototype.getNames = function() {
  var names = [];
  for (var i = 0, n = this.storage.length; i < n; i++) {
    var k = this.storage.key(i);
    if (0 == k.lastIndexOf(this.namePrefix, 0)) {
      var name = k.substring(this.namePrefix.length);
      names.push(name);
      // populate idToName map while we're at it.
      var scanId = this.storage.getItem(this.getKeyForName(name));
      this.idToName[scanId] = name;
    }
  }
  return names;
};

/**
 * @return {boolean}
 */
Stor.prototype.containsName = function(name) {
  return plex.array.contains(this.getNames(), name);
};

/**
 * Appends new values to the stor. Creates a new names object if the name isn't in use.
 * @param name
 * @param values
 */
Stor.prototype.appendValues = function(name, values) {
  for (var i = 0; i < values.length; i++) {
    this.appendValue(name, values[i]);
  }
};

/**
 * Lazilly creates a data ID for this Stor, and returns it.
 * @param {String} name
 * @return {String} data ID
 */
Stor.prototype.getDataId = function(name) {
  var nameKey = this.getKeyForName(name);
  // see if the name is there
  var dataId = this.storage.getItem(nameKey);
  if (!dataId) {
    // assign a new data address
    while (true) {
      // pick a random non-zero 1-3 character base-32 number that's not in use.
      dataId = Number(Math.floor(Math.random() * (32 * 32 * 32 - 1)) + 1).toString(32);
      if (!this.storage.getItem(this.getKeyForDataIndex(dataId, 1))) {
        // Write the new name/dataId pair.
        this.storage.setItem(nameKey, dataId);
        break;
      }
    }
  }
  // keep the cache fresh
  this.idToName[dataId] = name;
  return dataId;
};

/**
 * Appends a new value to the stor. Creates a new names object if the name isn't in use.
 * @param name
 * @param value
 * @return the index of the newly appended value
 */
Stor.prototype.appendValue = function(name, value) {
  var dataId = this.getDataId(name);
  // Find the first unused index.
  var nextIndex = (this.lastIndex[dataId] || 0) + 1;
  var dataKey;
  while (this.storage.getItem(dataKey = this.getKeyForDataIndex(dataId, nextIndex))) {
    nextIndex++;
  }
  // Write to that index.
  this.storage.setItem(dataKey, JSON.stringify(value));
  // Cache the last index value, to avoid a chain of lookups next time.
  this.lastIndex[dataId] = nextIndex;

//  // Windows won't publish storage events they initiate, so publish one ourselves.
//  var self = this;
//  window.setTimeout(function(){self.pubsub.publish(Stor.Ops.APPEND_VALUE, name, value)}, 0);

  return this.lastIndex[dataId];
};

/**
 * All the values for one name in this Stor
 * @param name
 * @return {Array} of values, in the order in which they were inserted.
 */
Stor.prototype.getValues = function(name) {
  return this.getValuesAfterIndex(name, 0);
};

/**
 * All the values for one name in this Stor after some index
 * @param {string} name
 * @param {number} afterIndex
 * @return {Array} of values, in the order in which they were inserted.
 */
Stor.prototype.getValuesAfterIndex = function(name, afterIndex) {
  var dataId = this.storage.getItem(this.getKeyForName(name));
  if (!dataId) return [];
  var retval = [];
  if (isNaN(afterIndex)) throw Error("afterIndex is not a number: " + afterIndex);
  var index = Math.max(1, afterIndex + 1);
  while (true) {
    var valueString = this.storage.getItem(this.getKeyForDataIndex(dataId, index++));
    if (!valueString) break;
    var value = JSON.parse(valueString);
    retval.push(value);
  }
  return retval;
};

/**
 * @return {number} the next available index for the named item
 */
Stor.prototype.getNextIndex = function(name) {
  var dataId = this.storage.getItem(this.getKeyForName(name));
  var nextIndex = (this.lastIndex[dataId] || 0) + 1;
  var dataKey;
  while (this.storage.getItem(dataKey = this.getKeyForDataIndex(dataId, nextIndex))) {
    nextIndex++;
  }
  return nextIndex;
};

/**
 * Subscribe to the change-publisher. The listener will be called
 * with three params, like so:
 * fn(Stor.Ops.APPEND_VALUE, name, values);
 * @param fn
 */
Stor.prototype.subscribe = function(fn) {
  this.pubsub.subscribe(fn);
};

Stor.prototype.unsubscribe = function(callback) {
  this.pubsub.unsubscribe(callback);
};

/**
 * @private
 */
Stor.prototype.getKeyForName = function(name) {
  return this.namePrefix + name;
};

/**
 * @private
 */
Stor.prototype.getKeyForDataIndex = function(dataId, index) {
  return this.dataPrefix + dataId + '/' + index;
};

/**
 * Very expensive if the ID is not a real ID!
 * @private
 */
Stor.prototype.getNameForId = function(id) {
  // check the cache first
  var name = this.idToName[id];
  if (name) return name;

  // Scan all keys and populate the entire idToName cache.
  var retval = null;
  for (var i = 0, n = this.storage.length; i < n; i++) {
    var k = this.storage.key(i);
    if (0 == k.lastIndexOf(this.namePrefix, 0)) {
      // it is a name in this stor
      name = k.substring(this.namePrefix.length);
      var scanId = this.storage.getItem(this.getKeyForName(name));
      this.idToName[scanId] = name;
      if (scanId == id) {
        retval = name;
      }
    }
  }
  return retval;
};

/**
 * Delete all names and keys.
 * @param {String} name
 */
Stor.prototype.removeByName = function(name) {
  if (!this.containsName(name)) return;
  var dataId = this.getDataId(name);
  var index = 1;
  this.storage.removeItem(this.getKeyForName(name));
  while (true) {
    var key = this.getKeyForDataIndex(dataId, index++);
    var val = this.storage.getItem(key);
    if (!val) return;
    this.storage.removeItem(key);
  }
};

/**
 * A store for a single stream of operations, indexed by the server-assigned operation ID.
 * Backed by one named object within a Stor.
 * @param {Stor} stor
 * @param {String} name
 * @constructor
 */
function OpStor(stor, name) {
  this.stor = stor;
  this.name = name;
}

/**
 * @enum {Number
 */
OpStor.field = {
  OP_INDEX: 0,
  OP: 1
};

/**
 * @return {Stor}
 */
OpStor.prototype.getStor = function() {
  return this.stor;
};

/**
 * @return {String}
 */
OpStor.prototype.getName = function() {
  return this.name;
};

/**
 * Appends a new value to the opstor. Creates a new named object if the name isn't in use.
 * @param op The actual operation payload
 * @return the server ID of the appended value
 */
OpStor.prototype.appendOp = function(op) {
  var nextIndex = this.stor.getNextIndex(this.name);
  var value = [nextIndex, op];
  var actualIndex = this.stor.appendValue(this.name, value);
  if (nextIndex != actualIndex) {
    throw Error("nextIndex " + nextIndex + " != actualIndex " + actualIndex);
  }
  return actualIndex;
};

/**
 * Writes metadata for this opstor if there isn't any in the store yet.
 */
OpStor.prototype.touch = function() {
  this.stor.getDataId(this.name);
};

/**
 * @param {number} afterIndex
 * @return {Array<Array>} an array of rows where each has the fields in OpStor.fields.
 */
OpStor.prototype.getValuesAfterIndex = function(afterIndex) {
  return this.stor.getValuesAfterIndex(this.name, afterIndex);
};

/**
 * Register a callback that gets called with no parameters, just to trigger invalidation.
 * @param {function} callback
 */
OpStor.prototype.subscribe = function(callback) {
  this.stor.subscribe(callback);
};

OpStor.prototype.unsubscribe = function(callback) {
  this.stor.unsubscribe(callback);
};

OpStor.prototype.remove = function() {
  this.stor.removeByName(this.name);
};

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-01'] =
[[10,1,-450,0],
[18,3,580,0,"#lesson-02"],
[1,5,80,170,80,-160],
[1,8,840,-440,840,450],
[1,11,-640,-440,-640,450],
[1,14,-640,-440,840,-440],
[1,17,-640,450,840,450],
[20,999,"Lesson 1: Moving Around","Move with the arrow keys. Go touch the green thing!"]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-02'] =
[[16,1,880,1640],
[16,3,1240,1700],
[10,5,1220,2280],
[18,7,730,1140,"#lesson-03"],
[1,9,1380,920,1380,2480],
[1,12,500,920,500,2480],
[1,15,500,920,1380,920],
[1,18,500,2480,1380,2480],
[5,21,970,1670],
[5,23,790,1670],
[5,25,970,1610],
[5,27,790,1610],
[5,29,730,1670],
[5,31,670,1670],
[5,33,610,1670],
[5,35,550,1670],
[5,37,730,1610],
[5,39,670,1610],
[5,41,610,1610],
[5,43,550,1610],
[5,45,970,1730],
[5,47,910,1730],
[5,49,850,1730],
[5,51,790,1730],
[5,53,730,1730],
[5,55,670,1730],
[5,57,610,1730],
[5,59,550,1730],
[5,61,1150,1730],
[5,63,1090,1730],
[5,65,1030,1730],
[5,67,1330,1730],
[5,69,1150,1670],
[5,71,1090,1670],
[5,73,1030,1670],
[5,75,1210,1610],
[5,77,1150,1610],
[5,79,1090,1610],
[5,81,1030,1610],
[5,83,1330,1670],
[5,85,1330,1610],
[5,87,1270,1610],
[20,999,"Lesson 2: Pushing Things","Run into the blocks and push them out of your way to reach the exit."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-03'] =
[[10,1,-420,-190],
[1,3,140,-560,140,-110],
[1,6,-600,-560,-600,170],
[1,9,-600,-560,140,-560],
[1,12,-600,170,1430,170],
[6,15,230,-50],
[6,18,70,-190],
[1,21,140,-110,1430,-110],
[7,24,140,40],
[11,27,240,-220],
[1,31,1430,-110,1430,-110],
[1,34,1430,-110,2130,-110],
[1,37,1430,170,1430,600],
[1,40,1430,600,2130,600],
[1,43,2130,-110,2130,600],
[18,46,1790,390,"#lesson-04"],
[7,48,1220,30],
[4,51,1000,50],
[4,54,1430,10],
[2,57,1130,-260,"60"],
[9,61,17,29],
[9,62,20,29],
[9,63,30,26],
[9,64,53,59],
[9,65,56,59],
[9,66,60,50],
[20,999,"Lesson 3: Buttons and Stuff","Bump buttons and cross beams to activate doors and things."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-04'] =
[[1,1,-384,-64,1280,-64],
[1,4,-384,-64,-384,704],
[2,7,448,576,"Infinity"],
[1,11,-576,704,768,704],
[1,14,1280,-64,1280,960],
[10,17,1184,832],
[1,19,-576,960,1280,960],
[1,22,0,320,0,704],
[1,25,384,704,384,320],
[1,28,-576,576,-576,704],
[4,31,-64,320],
[4,34,256,320],
[1,37,-576,960,-576,1088],
[4,40,704,320],
[1,43,768,704,768,320],
[2,46,-128,320,"20"],
[2,50,192,320,"20"],
[2,54,640,384,"20"],
[1,58,-1088,576,-1088,1088],
[1,61,-1088,1088,-576,1088],
[1,64,-1088,576,-576,576],
[18,67,-832,832,"#lesson-05"],
[12,69,-192,384],
[2,72,256,512,"Infinity"],
[6,76,192,576],
[7,79,192,832],
[2,82,-64,512,"Infinity"],
[6,86,-192,576],
[7,89,-192,768],
[12,92,192,384],
[12,95,576,384],
[6,98,576,576],
[7,101,576,768],
[9,104,100,9],
[9,105,10,103],
[9,106,42,56],
[9,107,57,97],
[9,108,36,52],
[9,109,53,94],
[9,110,33,48],
[9,111,49,71],
[9,112,78,74],
[9,113,75,81],
[9,114,88,84],
[9,115,85,91],
[20,999,"Lesson 4: Getting Killed Is Completely Normal","Sometimes you've got to die on purpose to complete a level."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-05'] =
[[1,1,-420,-480,750,-480],
[5,4,690,-430],
[1,6,-420,-450,-420,430],
[1,9,-380,430,440,430],
[1,12,440,390,440,-340],
[1,15,440,-340,630,-340],
[1,18,630,-380,630,-340],
[1,21,630,-380,750,-380],
[1,24,750,-500,750,-710],
[1,27,770,-120,1340,-120],
[1,30,1340,-140,1340,-690],
[16,33,560,-410],
[1,35,750,-120,750,-360],
[1,38,770,-710,1340,-710],
[18,41,1040,-430,"#lesson-06"],
[10,43,10,330],
[5,45,430,-430],
[5,47,630,-430],
[5,49,350,-400],
[5,51,260,-420],
[5,53,310,-320],
[5,55,490,-390],
[20,999,"Lesson 5: You Have a Tractor Beam!","Press Z to grab things. Reach farther by using arrow keys. Press X to let go."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-06'] =
[[1,1,-1130,20,40,20],
[1,4,-1130,20,-1130,330],
[1,7,-860,330,-1130,330],
[1,10,-860,330,-860,780],
[1,13,40,20,40,2080],
[1,16,-180,570,-180,1190],
[1,19,-860,780,-180,780],
[1,22,-1700,2260,-1110,2260],
[1,25,-1110,2260,-1110,2080],
[10,28,-1020,170],
[7,30,-70,780],
[8,33,-230,570],
[5,36,-90,1950],
[5,38,-530,670],
[1,40,-720,1190,-180,1190],
[1,43,-720,1850,-720,1190],
[1,46,-1110,2080,40,2080],
[1,49,-1110,1850,-1110,1650],
[1,52,-530,1850,-1110,1850],
[1,55,-1700,2260,-1700,1650],
[1,58,-1700,1650,-1110,1650],
[18,61,-1400,1950,"#lesson-07"],
[8,63,-530,1740],
[7,66,-720,1960],
[9,69,35,32],
[9,70,65,68],
[20,999,"Lesson 6: Grip Switches","Put something (yourself, blocks, whatever) near a gripswitch to activate it."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-07'] =
[[10,1,-128,400],
[8,3,-1024,1160],
[8,6,-1024,440],
[1,9,-1088,800,-656,800],
[5,12,704,1160],
[1,14,-1088,1040,-480,1040],
[8,17,-1024,680],
[12,20,-656,928],
[8,23,-1024,920],
[1,26,-1088,320,832,320],
[1,29,-1088,320,-1088,1280],
[5,32,704,440],
[7,34,-128,1344],
[5,37,704,680],
[7,39,-128,1280],
[1,42,832,320,832,1280],
[7,45,-128,1312],
[1,48,400,800,832,800],
[1,51,224,1040,832,1040],
[12,54,576,688],
[12,57,224,1152],
[5,60,704,920],
[12,62,-832,688],
[7,65,-128,1376],
[1,68,-16,1280,832,1280],
[1,71,-1088,1280,-240,1280],
[1,74,-240,1280,-240,1616],
[1,77,-16,1280,-16,1616],
[1,80,-384,1616,-240,1616],
[1,83,-384,1616,-384,2120],
[1,86,-16,1616,128,1616],
[1,89,128,1616,128,2120],
[1,92,-384,2120,128,2120],
[18,95,-128,1864,"#lesson-08"],
[1,97,-1088,560,-832,560],
[1,100,576,560,832,560],
[12,103,400,928],
[12,106,-480,1152],
[9,109,8,41],
[9,110,47,19],
[9,111,36,25],
[9,112,67,5],
[20,999,"Lesson 7: You Can Throw Things","Grab a block, hold down Z, and without letting go, tap X."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-08'] =
[[1,1,-640,-256,384,-256],
[1,4,-640,-256,-640,256],
[1,7,-640,256,384,256],
[1,10,384,256,384,-256],
[10,13,-512,0],
[17,15,256,0,48,496],
[1,18,-720,376,-200,376],
[1,21,-720,376,-720,888],
[1,24,-720,888,-200,888],
[1,27,-200,888,-200,376],
[1,30,-632,1008,392,1008],
[1,33,-632,1008,-632,1520],
[1,36,-632,1520,392,1520],
[1,39,392,1520,392,1008],
[18,42,-512,1264,"#lesson-09"],
[17,44,-320,496,336,768],
[17,47,-608,768,272,1264],
[1,50,-72,376,448,376],
[1,53,-72,376,-72,888],
[1,56,-72,888,448,888],
[1,59,448,888,448,376],
[20,999,"Lesson 8: Teleport Yourself","Go ahead, touch it."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-09'] =
[[1,1,-700,-410,-130,-410],
[1,4,-700,80,-700,-410],
[1,7,-700,80,210,80],
[1,10,210,-740,210,80],
[1,13,-130,-410,-130,-740],
[10,16,-570,-170],
[1,18,-130,-740,210,-740],
[1,21,400,-740,970,-740],
[1,24,400,-740,400,80],
[1,27,400,80,970,80],
[7,30,140,-410],
[1,33,970,-740,970,80],
[18,36,40,-570,"#lesson-10"],
[8,38,540,-410],
[17,41,40,-170,690,-190],
[9,44,40,32],
[20,999,"Lesson 9: Move Teleporters Around","You can grab teleporters and use them like blocks."]];

var vorpLevels = vorpLevels || {};
vorpLevels['lesson-10'] =
[[1,1,-680,-610,350,-610],
[1,4,-680,-610,-680,-300],
[1,7,-680,-300,-380,-300],
[1,10,-380,-300,-380,610],
[1,13,350,860,350,-610],
[1,16,-380,610,130,610],
[1,19,80,390,350,390],
[10,22,-590,-460],
[7,24,290,610],
[7,27,260,640],
[7,30,220,670],
[8,33,280,-230],
[8,36,280,-20],
[8,39,280,190],
[1,42,560,-410,560,390],
[1,45,560,390,1100,390],
[1,48,560,-410,1100,-410],
[1,51,1100,-410,1100,390],
[1,54,-50,860,-50,1410],
[1,57,-50,860,130,860],
[1,60,-50,1410,530,1410],
[1,63,530,860,530,1410],
[1,66,350,860,530,860],
[1,69,130,610,130,860],
[18,72,240,1140,"#level-01"],
[5,74,710,-70],
[5,76,710,-250],
[17,78,830,120,-20,-20],
[9,81,41,32],
[9,82,26,35],
[9,83,38,29],
[20,999,"Lesson 10: Teleport Other Things","You can teleport blocks. Sure, why not?"]];
var vorpLevels = vorpLevels || {};
vorpLevels['level-01'] =
[[10,1,576,1536],
[5,3,832,1792],
[1,5,192,1376,192,2144],
[1,8,192,2144,704,2144],
[1,11,192,1376,960,1376],
[1,14,960,1376,960,2592],
[8,17,416,2080],
[7,20,800,2144],
[1,23,704,2144,704,2592],
[1,26,704,2592,448,2592],
[1,29,448,2592,448,3360],
[1,32,448,3360,704,3360],
[1,35,704,3360,704,4064],
[1,38,960,2592,1216,2592],
[1,41,1216,2592,1216,3360],
[1,44,1216,3360,960,3360],
[1,47,960,3360,960,3808],
[1,50,960,3808,1536,3808],
[1,53,448,2880,608,2880],
[1,56,448,3072,608,3072],
[7,59,800,3360],
[7,62,608,2976],
[8,65,480,2976],
[8,68,1152,2976],
[5,71,1120,2976],
[1,73,1536,3808,1536,3552],
[1,76,1536,3552,2080,3552],
[1,79,2304,3776,2304,4320],
[1,82,2304,4320,1536,4320],
[1,85,1536,4320,1536,4064],
[1,88,1536,4064,704,4064],
[1,91,2080,3008,2080,3776],
[1,94,2080,3776,2848,3776],
[1,97,2848,3776,2848,3008],
[1,100,2848,3008,2592,3008],
[17,103,1696,3712,2464,3360],
[5,106,1920,3936],
[8,108,2240,3552],
[7,111,2400,2880],
[8,114,2688,3552],
[7,117,2432,2816],
[8,120,2688,3232],
[7,123,2432,2752],
[8,126,2240,3232],
[7,129,2432,2688],
[1,132,2336,2560,2112,2560],
[1,135,2112,2560,2112,1856],
[1,138,2112,1856,2816,1856],
[1,141,2816,1856,2816,2560],
[1,144,2816,2560,2592,2560],
[1,147,2592,2560,2592,3008],
[18,150,2464,2208,"#level-02"],
[1,152,2336,3008,2080,3008],
[1,155,2336,2560,2336,3008],
[9,158,19,22],
[9,159,67,64],
[9,160,70,64],
[9,161,67,61],
[9,162,110,113],
[9,163,116,119],
[9,164,122,125],
[9,165,128,131],
[20,999,"Level 1: Block Collector","You'll need all of them."]];

var vorpLevels = vorpLevels || {};
vorpLevels['level-02'] =
[[1,1,-976,-144,-160,-144],
[4,4,8,2888],
[1,7,1048,2760,1048,3128],
[19,10,-496,544],
[1,14,112,-880,112,-784],
[1,17,896,1136,896,1760],
[1,20,1048,3128,1688,3128],
[12,23,-976,-816],
[1,26,792,1760,896,1760],
[7,29,0,448],
[4,32,-80,416],
[12,35,920,2648],
[12,38,1048,2664],
[10,41,-1296,-1088],
[8,43,384,1264],
[8,46,-112,1424],
[8,49,864,1440],
[1,52,224,2064,224,1760],
[1,55,-976,-144,-976,-576],
[1,58,512,1760,512,1832],
[7,61,144,-328],
[12,64,-16,496],
[7,67,664,2520],
[4,70,376,3240],
[7,73,840,2632],
[1,76,416,-784,112,-784],
[5,79,-1424,-720],
[1,81,112,1136,896,1136],
[7,84,-32,-144],
[6,87,648,1968],
[7,90,112,-600],
[7,93,648,1760],
[1,96,-104,2520,504,2520],
[1,99,504,2520,504,2216],
[1,102,792,1760,792,2064],
[1,105,792,2520,792,2216],
[7,108,872,2648],
[2,111,984,2168,"Infinity"],
[1,115,504,2216,792,2216],
[7,118,968,2616],
[7,121,1000,2632],
[1,124,-160,1760,-160,-144],
[12,127,792,2696],
[1,130,-160,1760,224,1760],
[1,133,144,-496,112,-496],
[1,136,416,-216,112,-216],
[7,139,304,1760],
[1,142,416,-784,416,-216],
[7,145,368,1792],
[4,148,72,2824],
[7,151,432,1824],
[17,154,368,1888,648,2376],
[1,157,224,2064,792,2064],
[1,160,-104,3352,-104,2520],
[1,163,-104,3352,792,3352],
[4,166,-640,-800],
[1,169,792,2760,792,3352],
[1,172,1688,2520,792,2520],
[1,175,792,2760,1048,2760],
[4,178,424,3208],
[1,181,-56,2824,8,2824],
[2,184,-1168,384,"120"],
[19,188,-1040,384],
[2,192,-816,448,"60"],
[1,196,1688,2520,1688,3128],
[18,199,1368,2824,"#level-03"],
[1,201,424,3240,424,3320],
[1,204,112,-216,112,1136],
[7,207,112,-296],
[4,210,-320,-800],
[7,213,0,896],
[4,216,-64,864],
[12,219,-16,944],
[6,222,272,-264],
[2,225,312,-320,"Infinity"],
[5,229,192,-360],
[1,231,-976,-880,112,-880],
[1,234,-976,-1232,-976,-880],
[1,237,-1616,-1232,-976,-1232],
[1,240,-1616,-1232,-1616,-576],
[1,243,-1616,-576,-976,-576],
[9,246,191,194],
[9,247,34,31],
[9,248,195,25],
[9,249,66,13],
[9,250,12,195],
[9,251,212,63],
[9,252,228,92],
[9,253,228,86],
[9,254,89,113],
[9,255,114,95],
[9,256,114,69],
[9,257,75,150],
[9,258,6,110],
[9,259,120,72],
[9,260,123,180],
[9,261,45,141],
[9,262,48,147],
[9,263,51,153],
[9,264,168,209],
[9,265,191,186],
[9,266,187,190],
[9,267,218,215],
[9,268,195,221],
[9,269,224,227],
[20,999,"Level 2: A Stretch","Your tractor beam has a long reach."]];

var vorpLevels = vorpLevels || {};
vorpLevels['level-03'] =
[[1,1,-248,-64,-160,-64],
[5,4,192,0],
[19,6,1152,1504],
[1,10,-960,-384,-960,160],
[7,13,992,-344],
[1,16,-1920,-448,-1664,-448],
[1,19,64,-448,2368,-448],
[1,22,2112,160,2112,-448],
[12,25,-1536,-448],
[1,28,1728,416,1728,896],
[1,31,-576,160,-576,-448],
[1,34,-1408,-704,-1408,-384],
[1,37,-160,-64,-160,160],
[1,40,-1920,-704,-1408,-704],
[1,43,1472,896,1728,896],
[1,46,1472,1376,1472,896],
[1,49,1088,-192,1088,416],
[1,52,1728,416,2368,416],
[8,55,744,280],
[1,58,1472,416,1472,416],
[1,61,1216,1376,1216,416],
[1,64,-576,-64,-488,-64],
[1,67,2368,416,2368,-448],
[1,70,896,-192,1088,-192],
[4,73,1408,1344],
[1,76,896,-192,896,416],
[7,79,1344,416],
[1,82,1216,416,1088,416],
[1,85,448,-448,448,0],
[7,88,-416,-64],
[7,91,-576,248],
[1,94,-1664,416,896,416],
[7,97,1280,896],
[12,100,1280,1376],
[2,103,1120,1216,100],
[1,107,-576,-448,-192,-448],
[7,110,1600,416],
[1,113,-1920,-256,-1920,-448],
[1,116,-576,160,-960,160],
[6,119,-1024,64],
[1,122,-2560,-256,-1920,-256],
[1,125,-2560,-256,-2560,-896],
[6,128,-1600,64],
[6,131,-368,272],
[1,134,-1920,-704,-1920,-896],
[1,137,-2560,-896,-1920,-896],
[1,140,-960,-384,-1408,-384],
[7,143,-1472,-384],
[7,146,-1592,-408],
[1,149,-1664,-448,-1664,416],
[10,152,-64,-1152],
[2,154,-1536,64,"40"],
[2,158,-1152,64,"40"],
[2,162,-384,512,"Infinity"],
[18,166,1344,1696,"#level-04"],
[7,168,-160,288],
[17,171,-1536,-576,-2240,-576],
[6,174,384,-64],
[2,177,232,128,"40"],
[6,181,1600,832],
[2,184,1472,768,"Infinity"],
[1,188,64,-704,64,-448],
[1,191,64,-704,256,-704],
[1,194,-384,-704,-192,-704],
[1,197,-384,-704,-384,-1344],
[1,200,256,-704,256,-1344],
[1,203,-384,-1344,256,-1344],
[1,206,-192,-704,-192,-448],
[1,209,1472,1376,1664,1376],
[1,212,1024,1376,1216,1376],
[1,215,1024,2016,1024,1376],
[1,218,1664,2016,1664,1376],
[1,221,1024,2016,1664,2016],
[6,224,2240,-320],
[2,227,2176,-208,"30"],
[9,231,57,15],
[9,232,106,8],
[9,233,9,102],
[9,234,75,105],
[9,235,165,93],
[9,236,180,90],
[9,237,165,170],
[9,238,164,133],
[9,239,121,160],
[9,240,161,145],
[9,241,130,156],
[9,242,157,148],
[9,243,179,176],
[9,244,186,183],
[9,245,187,99],
[9,246,187,81],
[9,247,229,226],
[9,248,230,112],
[20,999,"Level 3: Reaction Mass", "When you throw a block, the block throws you."]];

var vorpLevels = vorpLevels || {};
vorpLevels['level-04'] =
[[1,1,-1248,-128,-1056,-128],
[1,4,-288,-256,-512,-256],
[1,7,-288,0,-288,-256],
[1,10,-1056,256,-512,256],
[1,13,-768,-160,-768,-96],
[1,16,-1536,-512,-1536,-224],
[1,19,-1536,256,-1536,-32],
[1,22,-1536,256,-1248,256],
[10,25,-352,-128],
[1,27,-288,0,-512,0],
[1,30,-512,0,-512,256],
[1,33,-512,-256,-512,-512],
[15,36,-608,128],
[15,38,-1888,-296],
[15,40,-576,-384],
[1,42,-1248,352,-1056,352],
[1,45,-1056,352,-1056,256],
[1,48,-1248,352,-1248,256],
[1,51,-1056,-512,-512,-512],
[1,54,-1536,-512,-1248,-512],
[1,57,-1248,-608,-1056,-608],
[1,60,-1056,-608,-1056,-512],
[1,63,-1248,-608,-1248,-512],
[4,66,-512,-96],
[7,69,-768,-448],
[7,72,-768,192],
[1,75,-1792,-224,-1536,-224],
[1,78,-1792,-32,-1536,-32],
[1,81,-2304,-384,-1792,-384],
[1,84,-2304,-384,-2304,128],
[1,87,-2304,128,-1792,128],
[1,90,-1792,-224,-1792,-384],
[1,93,-1792,128,-1792,-32],
[7,96,-1536,-128],
[2,99,-608,-128,"120"],
[8,103,-1152,288],
[14,106,-1152,-544],
[18,108,-2048,-128,"#level-05"],
[9,110,68,101],
[9,111,102,71],
[9,112,102,74],
[9,113,105,98],
[20,999,"Level 4: Introducing Zombies", "They're hostile contagious destructible blocks"]];

var vorpLevels = vorpLevels || {};
vorpLevels['level-05'] =
[[15,1,-448,-704],
[1,3,-192,-736,-192,-576],
[1,6,-864,32,-864,-288],
[1,9,-864,-288,-576,-288],
[1,12,-576,-288,-576,-736],
[1,15,96,416,-32,416],
[4,18,528,-152],
[19,21,-144,184],
[1,25,-224,416,-224,256],
[15,28,1856,128],
[4,30,576,-152],
[12,33,320,-128],
[2,36,464,-352,"60"],
[7,40,-256,-576],
[12,43,352,-128],
[2,46,520,-352,"60"],
[12,50,384,-128],
[13,53,-640,-192],
[1,55,-864,32,-576,32],
[3,58,256,-416],
[19,62,192,-416],
[1,66,-192,-736,-576,-736],
[12,69,1472,-128],
[4,72,480,-160],
[7,75,-96,256],
[13,78,-640,-128],
[2,80,400,-352,"60"],
[13,84,-720,-128],
[13,86,-632,-64],
[12,88,1504,-128],
[12,91,1536,-128],
[12,94,1568,-128],
[1,97,928,-224,1120,-224],
[12,100,-512,-608],
[1,103,-32,416,-32,256],
[2,106,-488,-480,"150"],
[12,110,256,-608],
[2,113,-432,-368,"200"],
[1,117,-64,-736,-64,-576],
[1,120,928,-32,1120,-32],
[1,123,1120,-224,1120,-32],
[1,126,-576,256,-576,32],
[1,129,320,-256,320,-736],
[1,132,96,832,96,416],
[1,135,-352,832,96,832],
[7,138,-576,-128],
[7,141,0,-576],
[7,144,928,-96],
[2,147,-416,-248,"300"],
[2,151,-400,-112,"400"],
[1,155,-352,416,-224,416],
[1,158,-352,832,-352,416],
[1,161,576,-256,320,-256],
[15,164,-288,480],
[3,166,256,-224],
[19,170,192,-224],
[15,174,1056,-128],
[1,176,320,-736,-64,-736],
[3,179,256,-32],
[19,183,192,-32],
[2,187,-376,-8,"500"],
[1,191,320,256,-32,256],
[2,194,-328,104,"600"],
[15,198,-320,-704],
[1,200,-224,256,-576,256],
[15,203,64,-704],
[15,205,192,-704],
[10,207,-128,672],
[1,209,-64,-576,-192,-576],
[6,212,-128,-480],
[3,215,32,-480],
[19,219,-32,-480],
[1,223,576,-576,576,-256],
[1,226,576,-576,1472,-576],
[14,229,-704,-32],
[1,231,320,0,320,256],
[14,234,-704,-224],
[14,236,-800,-128],
[1,238,576,0,320,0],
[1,241,576,0,576,320],
[1,244,576,320,1472,320],
[1,247,1472,-576,1472,-256],
[1,250,1472,0,1472,320],
[1,253,1728,-256,1472,-256],
[1,256,1728,-448,1728,-256],
[1,259,1728,-448,2368,-448],
[1,262,1728,0,1472,0],
[1,265,1728,0,1728,192],
[1,268,1728,192,2368,192],
[1,271,2368,-448,2368,192],
[18,274,2048,-128,"#level-06"],
[8,276,768,-448],
[8,279,1280,-448],
[8,282,1280,256],
[8,285,768,256],
[12,288,960,-160],
[9,291,109,140],
[9,292,218,146],
[9,293,20,38],
[9,294,32,48],
[9,295,49,52],
[9,296,39,45],
[9,297,83,35],
[9,298,65,60],
[9,299,182,35],
[9,300,169,45],
[9,301,61,52],
[9,302,197,60],
[9,303,24,77],
[9,304,154,64],
[9,305,74,82],
[9,306,278,71],
[9,307,287,90],
[9,308,281,93],
[9,309,284,96],
[9,310,173,168],
[9,311,186,181],
[9,312,168,197],
[9,313,214,108],
[9,314,214,115],
[9,315,214,149],
[9,316,214,153],
[9,317,181,197],
[9,318,214,189],
[9,319,214,196],
[9,320,197,23],
[9,321,172,150],
[9,322,185,116],
[9,323,218,143],
[9,324,218,42],
[9,325,197,217],
[9,326,221,190],
[9,327,222,217],
[20,999,"Level 5: Zombie Extractor","With Plasma Autowash"]];

var vorpLevels = vorpLevels || {};
vorpLevels['level-06'] =
[[13,1,-464,-320],
[16,3,976,-200],
[13,5,-440,-440],
[3,7,-3080,-1392],
[13,11,-560,-64],
[13,13,-464,-64],
[1,15,-1232,208,-1232,512],
[2,18,-888,-384,"30"],
[13,22,-464,-192],
[13,24,-352,-512],
[13,26,-128,-576],
[13,28,-32,-576],
[8,30,-3256,-560],
[1,33,-1232,512,-864,512],
[1,36,-304,-432,-304,48],
[13,39,-192,-512],
[13,41,176,-416],
[13,43,80,-256],
[8,45,-3512,-560],
[1,48,-936,-512,-848,-512],
[13,51,80,-96],
[14,53,-400,-192],
[1,55,-936,128,-848,128],
[2,58,520,-376,"30"],
[13,62,-32,160],
[13,64,-192,128],
[14,66,16,-192],
[14,68,-400,-304],
[13,70,-256,192],
[1,72,464,-512,552,-512],
[13,75,176,-32],
[1,77,464,128,560,128],
[10,80,-2192,-192],
[1,82,-1232,-896,-1232,-592],
[14,85,16,-304],
[1,87,-1488,-592,-1488,-304],
[7,90,-936,-448],
[7,93,552,-448],
[4,96,-848,-448],
[4,99,464,-448],
[15,102,-1168,-192],
[1,104,-2776,-1168,-2776,-1520],
[1,107,480,512,848,512],
[1,110,368,-608,464,-608],
[1,113,368,-704,368,-608],
[14,116,-400,-80],
[1,118,-1680,-512,-1680,-304],
[6,121,-2648,-1464],
[1,124,480,-896,848,-896],
[14,127,0,-80],
[7,129,-2560,-1464],
[13,132,-680,-176],
[13,134,-576,-336],
[13,136,-560,-288],
[13,138,320,-248],
[13,140,120,-376],
[13,142,288,-120],
[13,144,64,64],
[1,146,-1680,-80,-1680,128],
[1,149,-80,-432,-80,48],
[13,152,24,-464],
[1,154,-1488,-304,-1680,-304],
[13,157,-408,24],
[13,159,-472,96],
[13,161,-376,128],
[1,163,-1488,-80,-1680,-80],
[1,166,-2320,-512,-2320,128],
[1,169,-1232,-304,-1232,-80],
[1,172,-2520,-1168,-2520,-1520],
[1,175,-2320,-512,-1680,-512],
[1,178,-2320,128,-1680,128],
[15,181,-1744,-384],
[1,183,-1232,-896,-864,-896],
[1,186,-2520,-1520,-2776,-1520],
[1,189,-2520,-400,-2520,-912],
[15,192,-2672,-1208],
[1,194,-1488,-80,-1488,208],
[8,197,-3256,-1040],
[1,200,-1488,-592,-1232,-592],
[12,203,-192,-432],
[1,206,-1488,208,-1232,208],
[18,209,-2000,-1040,"#level-08"],
[1,211,480,512,480,672],
[7,214,-192,16],
[12,217,-2648,-1328],
[8,220,-3000,-560],
[12,223,-2616,-1296],
[12,226,-2680,-1264],
[8,229,-192,-256],
[1,232,-848,224,-752,224],
[1,235,-752,224,-752,320],
[1,238,-3672,-1168,-3672,-400],
[1,241,368,224,464,224],
[1,244,368,224,368,320],
[1,247,-2776,-1168,-3672,-1168],
[1,250,-2520,-400,-3672,-400],
[1,253,-864,512,-864,672],
[1,256,-304,-192,-80,-192],
[1,259,-848,-608,-848,-512],
[8,262,-3480,-1040],
[1,265,464,-608,464,-512],
[1,268,-848,-608,-752,-608],
[1,271,-752,-704,-752,-608],
[12,274,-2592,-1392],
[17,277,-192,-88,-2688,-600],
[7,280,-192,-400],
[1,283,464,128,464,224],
[12,286,-2568,-1360],
[12,289,-192,48],
[19,292,-248,-280],
[8,296,-3000,-1040],
[1,299,480,-1056,480,-896],
[1,302,-864,-1056,-864,-896],
[1,305,-864,-1056,480,-1056],
[1,308,-848,128,-848,224],
[12,311,-2560,-1424],
[15,314,760,-200],
[1,316,-864,672,480,672],
[1,319,256,512,64,512],
[1,322,-448,512,-640,512],
[1,325,-96,512,-288,512],
[1,328,256,-896,64,-896],
[1,331,-448,-896,-640,-896],
[1,334,-96,-896,-288,-896],
[15,337,-2256,-1296],
[1,339,-2320,-1168,-2520,-1168],
[1,342,-2320,-1360,-2320,-1168],
[1,345,-2320,-1360,-1680,-1360],
[1,348,-2320,-912,-2520,-912],
[1,351,-2320,-912,-2320,-720],
[1,354,-2320,-720,-1680,-720],
[1,357,-1680,-1360,-1680,-720],
[7,360,-2520,-1040],
[2,363,-2432,-1320,"Infinity"],
[1,367,848,208,848,512],
[1,370,848,-896,848,-592],
[1,373,848,-304,848,-80],
[1,376,848,-592,1104,-592],
[1,379,848,208,1104,208],
[1,382,1104,-592,1104,208],
[9,385,98,20],
[9,386,21,92],
[9,387,101,60],
[9,388,61,95],
[9,389,10,131],
[9,390,9,222],
[9,391,9,32],
[9,392,9,47],
[9,393,228,222],
[9,394,32,225],
[9,395,219,47],
[9,396,231,216],
[9,397,282,295],
[9,398,294,231],
[9,399,264,288],
[9,400,264,9],
[9,401,199,276],
[9,402,199,9],
[9,403,298,9],
[9,404,298,313],
[9,405,123,365],
[9,406,366,362],
[20,999,"Level 6: Wield the Teleporter","Go on the Offensive"]];

var vorpLevels = vorpLevels || {};
vorpLevels['level-08'] =
[[13,1,1464,448],
[8,3,960,1048],
[13,6,1464,664],
[13,8,1216,720],
[13,10,1392,112],
[13,12,1656,192],
[13,14,1216,104],
[13,16,1472,-96],
[13,18,1504,-368],
[13,20,1464,-408],
[13,22,1440,-360],
[13,24,984,-336],
[13,26,968,-408],
[13,28,928,-360],
[13,30,976,208],
[1,32,576,768,448,768],
[1,35,1088,1048,1344,1048],
[15,38,2304,128],
[1,40,1344,1576,576,1576],
[15,43,1280,1288],
[19,45,1968,-160],
[19,49,2000,-160],
[19,53,2032,-160],
[1,57,1344,-256,1088,-256],
[1,60,576,0,448,0],
[1,63,576,-256,576,0],
[19,66,2064,-160],
[1,70,448,0,448,768],
[1,73,576,640,576,128],
[1,76,1856,256,1856,-256],
[10,79,960,1384],
[1,81,1856,1048,1856,512],
[19,84,2096,-160],
[1,88,1856,1048,1856,1048],
[19,91,2128,-160],
[19,95,2160,-160],
[19,99,2192,-160],
[4,103,1280,256],
[4,106,1152,256],
[1,109,1344,-512,1600,-512],
[1,112,1344,-256,1344,-512],
[1,115,1344,976,1344,1576],
[4,118,1120,512],
[4,121,1728,768],
[1,124,1600,-512,1600,-256],
[4,127,1344,912],
[15,130,1168,1016],
[1,132,1856,-256,1600,-256],
[1,135,1088,976,1088,1048],
[4,138,832,912],
[7,141,1152,968],
[4,144,704,0],
[4,147,1280,512],
[4,150,1600,912],
[4,153,1088,32],
[1,156,832,-256,576,-256],
[1,159,2176,256,1856,256],
[1,162,1856,1048,1344,1048],
[18,165,2560,384,"#"],
[1,167,2944,0,2176,0],
[15,170,1264,1016],
[1,172,2176,0,2176,256],
[1,175,2176,512,2176,768],
[1,178,2176,768,2944,768],
[1,181,2176,512,1856,512],
[1,184,864,976,1064,976],
[1,187,576,768,576,1576],
[12,190,1904,384],
[12,193,1936,384],
[12,196,1968,384],
[12,199,2032,384],
[12,202,2064,384],
[12,205,2000,384],
[12,208,2096,384],
[12,211,2128,384],
[1,214,832,-512,1088,-512],
[1,217,832,-256,832,-512],
[1,220,1088,-512,1088,-256],
[2,223,1968,-288,"30"],
[7,227,960,-256],
[7,230,1472,-256],
[2,233,2000,-304,"30"],
[2,237,2032,-320,"30"],
[2,241,2064,-336,"30"],
[1,245,2944,768,2944,0],
[2,248,2096,-352,"30"],
[2,252,2128,-368,"30"],
[2,256,2160,-384,"30"],
[2,260,2192,-400,"30"],
[7,264,696,968],
[13,267,1728,384],
[13,269,1664,320],
[13,271,1728,288],
[13,273,1496,344],
[13,275,1632,448],
[13,277,1760,448],
[4,279,752,1056],
[2,282,672,1152,"20"],
[14,286,960,-448],
[14,288,896,-384],
[1,290,1216,256,1216,256],
[14,293,1024,-384],
[14,295,1472,-448],
[1,297,1216,512,1216,512],
[14,300,1408,-384],
[12,302,1216,384],
[14,305,1536,-384],
[1,307,832,1048,832,976],
[2,310,1216,-416,"170"],
[9,314,105,225],
[9,315,5,143],
[9,316,120,235],
[9,317,140,225],
[9,318,155,262],
[9,319,102,213],
[9,320,98,210],
[9,321,94,204],
[9,322,87,201],
[9,323,207,69],
[9,324,56,198],
[9,325,195,52],
[9,326,48,192],
[9,327,47,226],
[9,328,236,51],
[9,329,55,240],
[9,330,244,68],
[9,331,86,251],
[9,332,255,93],
[9,333,97,259],
[9,334,263,101],
[9,335,152,239],
[9,336,123,243],
[9,337,129,250],
[9,338,105,254],
[9,339,120,258],
[9,340,108,239],
[9,341,149,243],
[9,342,155,250],
[9,343,146,258],
[9,344,140,262],
[9,345,284,281],
[9,346,285,266],
[9,347,281,312],
[9,348,313,229],
[9,349,313,232],
[20,999,"Level 8: Battle Grid", "Close combat. Clear the grid."]];

/**
 * A circular buffer, backed by an array.
 * 
 * @param {number} maxLen  Must be one or more.
 * @constructor
 */
function CircularQueue(maxLen) {
  if (maxLen < 1) {
    throw new Error('maxlen must be at least one, but it was ' + maxLen);
  }
  this.maxLen = maxLen;
  this.a = [];
  this.head = this.tail = -1;
}

/**
 * @return {boolean}
 */
CircularQueue.prototype.isEmpty = function() {
  return this.head == -1;
};

/**
 * @return {boolean}
 */
CircularQueue.prototype.isFull = function() {
  if (this.head == -1) return false;
  var nextHead = this.head + 1;
  if (nextHead >= this.maxLen) {
    nextHead = 0;
  }
  return nextHead == this.tail;
};

/**
 * Adds an item to the head of the queue.
 * If the queue is full, an item is dropped from the tail.
 * @param val  Any value, to be enqueued.
 * @return the object that fell off the tail, or null if nothing fell off
 */
CircularQueue.prototype.enqueue = function(val) {
  var whatFellOff = null;
  if (this.head == -1) {
    // was empty
    this.head = this.tail = 0;
  } else {
    this.head++;
    if (this.head >= this.maxLen) {
      this.head = 0;
    }
    if (this.head == this.tail) {
      whatFellOff = this.a[this.tail];
      // something falls off the tail
      this.tail++;
      if (this.tail >= this.maxLen) {
        this.tail = 0;
      }
    }
  }
  this.a[this.head] = val;
  return whatFellOff;
};


/**
 * @return Whatever was pulled off the tail of the queue, or null if the queue is empty.
 */
CircularQueue.prototype.dequeue = function() {
  if (this.tail == -1) {
    // empty
    return null;
  }
  var val = this.a[this.tail];
  if (this.tail == this.head) {
    // now it's empty
    this.head = this.tail = -1;
  } else {
    // move tail fwd
    this.tail++;
    if (this.tail >= this.maxLen) {
      this.tail = 0;
    }
  }
  return val;
};


/**
 * @return {number} number of elements in the queue, between 0 and maxLength
 */
CircularQueue.prototype.size = function() {
  if (this.tail == -1) {
    // empty
    return 0;
  }
  var size = 1 + this.head - this.tail;
  if (size <= 0) {
    size += this.maxLen;
  }
  return size;
};


/**
 * @param {number} index gets the nth index from the tail.  Does not dequeue.
 */
CircularQueue.prototype.getFromTail = function(index) {
  if (index < 0) {
    throw new Error("index " + index + " < 0");
  }
  if (index >= this.size()) {
    throw new Error("index " + index + " is greater than size " + this.size());
  }
  var i = index + this.tail;
  if (i >= this.maxLen) {
    // wrap around
    i -= this.maxLen;
  }
  return this.a[i];
};

/**
 * @param {number} index gets the nth index from the head.  Does not dequeue.
 */
CircularQueue.prototype.getFromHead = function(index) {
  if (index < 0) {
    throw new Error("index " + index + " < 0");
  }
  if (index >= this.size()) {
    throw new Error("index " + index + " is greater than size " + this.size());
  }
  var i = this.head - index;
  if (i < 0) {
    // wrap around
    i += this.maxLen;
  }
  return this.a[i];
};

/**
 * @constructor
 */
function DepInj() {
  this.scopedInstances = {};
  this.ctrScopes = {};
  this.inScopes = {};
  this.nextKey = 444;
}

DepInj.KEY = 'PLEX_DEPINJ_KEY';

DepInj.prototype.bind = function(ctr, scope) {
  if (ctr[DepInj.KEY]) {
    throw Error('constructor ' + ctr + ' already bound.');
  }
  var key = ctr[DepInj.KEY] = this.nextKey++;
  this.ctrScopes[key] = scope;
};

DepInj.prototype.inject = function(ctr) {
  var key = ctr[DepInj.KEY];
  var scope = this.ctrScopes[key];
  this.assertInScope(scope);
  var instance = this.scopedInstances[scope][key];
  if (!instance) {
    this.scopedInstances[scope][key] = instance = new ctr();
  }
  return instance;
};

DepInj.prototype.assertInScope = function(scope) {
  if (!this.inScopes[scope]) {
    throw Error('Not in expected scope: ' + scope);
  }
};

DepInj.prototype.assertNotInScope = function(scope) {
  if (this.inScopes[scope]) {
    throw Error('In unexpected scope: ' + scope);
  }
};

DepInj.prototype.enterScope = function(scope) {
  this.assertNotInScope(scope);
  this.inScopes[scope] = true;
  if (!this.scopedInstances[scope]) {
    this.scopedInstances[scope] = {};
  }
};

/**
 * Invalidates the scope and clears its cache of instances.
 * @param scope
 */
DepInj.prototype.exitScope = function(scope) {
  this.assertInScope(scope);
  delete this.inScopes[scope];
  var instances = this.scopedInstances[scope];
  for (var key in instances) {
    delete instances[key];
  }
};

// gameutil.js
// copyright 2005, Aaron Whyte
// TODO: move this to gaam?

var VK_UP=38, VK_RIGHT=39, VK_DOWN=40, VK_LEFT=37; // arrows
var VK_BACKSPACE = 8;
var VK_SPACE = 32;
var VK_DELETE = 46;
var VK_A = 65;
var VK_C = 67;
var VK_D = 68;
var VK_I = 73;
var VK_J = 74;
var VK_K = 75;
var VK_L = 76;
var VK_P = 80;
var VK_Q = 81;
var VK_S = 83;
var VK_V = 86;
var VK_W = 87;
var VK_X = 88;
var VK_Z = 90;
var VK_SEMICOLON = 186;
var VK_BACKSLASH = 220;
var GU_keys = [];

var GU_clientFunc;

var GU_lastMeasureTime = -1;
var GU_targetPeriod;
var GU_nextDelay;

function GU_start(func, opt_fps) {
  var fps = opt_fps || 60;
  GU_targetPeriod = 1000 / fps;
  GU_nextDelay = Math.floor(GU_targetPeriod);
  GU_clientFunc = func;
  GU_startKeyListener();

  GU_clock();
}

function GU_startKeyListener() {
  GU_keys.length = 0;
  document.onkeydown = GU_keyDown;
  document.onkeypress = null; // GU_keyDown;
  document.onkeyup = GU_keyUp;
}

function GU_clock() {
  GU_clientFunc();
  var now = (new Date()).getTime();
  var actualPeriod = now - GU_lastMeasureTime;
  GU_lastMeasureTime = now;
  GU_nextDelay += actualPeriod > GU_targetPeriod ? -1 : 1;
  if (GU_nextDelay < 1) GU_nextDelay = 0;
  setTimeout(GU_clock, GU_nextDelay, null);
}
function GU_keyDown(e) {
  if (!e) e = window.event;
  var key = e.keyCode;
  var shift = e.shiftKey;
  GU_keys[key] = true;
}

function GU_keyUp(e) {
  var key = -1;
  var shift;
  if (e && e.which) {
    // NS
    key = e.which;
    shift = e.shiftKey;
  } else {
    // IE
    key = window['event'].keyCode;
    shift = window['event'].shiftKey;
  }

  GU_keys[key] = false;
}

function GU_copyKeysVec(vec) {
  vec.setXY(
      (GU_keys[VK_LEFT] ? -1 : 0) + (GU_keys[VK_RIGHT] ? 1 : 0),
      (GU_keys[VK_UP] ? -1 : 0) + (GU_keys[VK_DOWN] ? 1 : 0));
  return vec;
}

function GU_copyCustomKeysVec(vec, up, right, down, left) {
  vec.setXY(
      (GU_keys[left] ? -1 : 0) + (GU_keys[right] ? 1 : 0),
      (GU_keys[up] ? -1 : 0) + (GU_keys[down] ? 1 : 0));
  return vec;
}


/**
 * A SkipQueue priority queue, ordered by time.
 * Nodes must have a "time" value, and this SkipQueue will
 * manage a "next" array, too.
 * @constructor
 */
function SkipQueue(expectedLength) {
  this.maxLevel = Math.ceil(Math.log(expectedLength) / Math.log(SkipQueue.BASE));
  this.level = this.maxLevel;
  this.next = [];
  this.size = 0;  
  this.prevs = [];
}

SkipQueue.BASE = 2;
SkipQueue.LEVEL_UP_ODDS = 1 / SkipQueue.BASE;

SkipQueue.prototype.randomLevel = function() {
  var level = 0;
  var rand = Math.random();
  var bar = SkipQueue.LEVEL_UP_ODDS;
  while (rand < bar && level < this.maxLevel) {
    level++;
    bar *= SkipQueue.LEVEL_UP_ODDS;
  }
  return level;
};

/**
 * Add a node, in the right order.
 * @param {Object} addMe
 */
SkipQueue.prototype.add = function(addMe) {
  if (!addMe) throw "addMe is " + addMe;
  var prevs = this.prevs;
  if (!addMe.next) {
    addMe.next = [];
  }
  addMe.level = this.randomLevel();
  
  // set up for traversal
  var level = this.maxLevel;
  var node = this;
  
  var next;
  for (var level = this.maxLevel; level >= 0; --level) {
    // right
    next = node.next[level];
    while (next && next.time < addMe.time) {
      node = next;
      next = node.next[level];
    }
    prevs[level] = node;
  }
  // For the levels that this node blocks, do inserts.
  for (level = addMe.level; level >= 0; --level) {
    addMe.next[level] = prevs[level].next[level];
    prevs[level].next[level] = addMe;
  }
  this.size++;
};

/**
 * Returns the first node, or null if empty, and also removes it.
 */
SkipQueue.prototype.removeFirst = function() {
  var node = this.next[0];
  if (!node) return null;
  for (var level = node.level; level >= 0; --level) {
    this.next[level] = node.next[level];
  }
  this.size--;
  return node;
};

/**
 * Returns the first node without removing it.
 */
SkipQueue.prototype.getFirst = function() {
  return this.next[0];
};

SkipQueue.prototype.toString = function() {
  var node = this.next[0];
  var out = [];
  while (node != null) {
    out.push(node.toString());
    node = node.next[0];
  }
  return '[' + out.join(',\n') + ']';
};
Math.sgn = function(n) {
  if (n < 0) return -1;
  if (n > 0) return 1;
  return 0;
};

function expose(obj) {
  var text='';
  for (var x in obj) {
    text += x + ' = ';
    try {
      text+=obj[x];
    } catch (e) {
      text += '*** ' + e + ' ***';
    }
    text += '\n';
  }
  return text;
}

function textToHtml(text) {
  var html = '';
  var subs = [
    ['<', '&lt;'],
    ['&', '&amp;'],
    ['"', '&quot;'],
    ['\n', '<br>']
  ];
  for (var i=0; i<text.length; i++) {
    var c = text.charAt(i);
    var found = false;
    for (var j=0; j<subs.length && !found; j++) {
      if (subs[j][0] == c) {
        html += subs[j][1];
        found = true;
      }
    }
    if (!found) html += c;
  }
  return html;
}

function gebi(id) {
  return document.getElementById(id);
}

function ce(name, opt_parent) {
  var e = document.createElement(name);
  if (opt_parent) {
    opt_parent.appendChild(e);
  }
  return e;
}

function ct(text, parent) {
  var e = document.createTextNode(text);
  if (parent) {
    parent.appendChild(e);
  }
  return e;
}


Vec2d.pool = [];
Vec2d.poolSize = 0;

/**
 * @param {number=} x
 * @param {number=} y
 * @constructor
 */
function Vec2d(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vec2d.prototype.reset = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
};

/**
 * @param {number=} x
 * @param {number=} y
 */
Vec2d.alloc = function(x, y) {
  var retval;
  if (Vec2d.poolSize) {
    retval = Vec2d.pool[--Vec2d.poolSize];
    retval.reset(x, y);
  } else {
    retval = new Vec2d(x, y);
  }
  return retval;
};

Vec2d.free = function(hit) {
  Vec2d.pool[Vec2d.poolSize++] = hit;
};


Vec2d.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
  return this;
};

Vec2d.prototype.addXY = function(x, y) {
  this.x += x;
  this.y += y;
  return this;
};

Vec2d.prototype.subtract = function(v) {
  this.x -= v.x;
  this.y -= v.y;
  return this;
};

Vec2d.prototype.set = function(v) {
  this.x = v.x;
  this.y = v.y;
  return this;
};

Vec2d.prototype.setXY = function(xx, yy) {
  this.x = xx;
  this.y = yy;
  return this;
};

Vec2d.prototype.scale = function(s) {
  this.x *= s;
  this.y *= s;
  return this;
};

Vec2d.prototype.scaleXY = function(sx, sy) {
  this.x *= sx;
  this.y *= sy;
  return this;
};

Vec2d.prototype.abs = function() {
  this.x = Math.abs(this.x);
  this.y = Math.abs(this.y);
  return this;
};

Vec2d.prototype.rot90Right = function() {
  var tmp = this.x;
  this.x = -this.y;
  this.y = tmp;
  return this;
};

Vec2d.prototype.rot = function(rads) {
  if (!rads) {
    // no rotation
    return this;
  }
  var sin = Math.sin(rads);
  var cos = Math.cos(rads);
  var nx = cos * this.x + sin * this.y;
  var ny = -sin * this.x + cos * this.y;
  this.x = nx;
  this.y = ny;
  return this;
};

Vec2d.prototype.dot = function(that) {
  return this.x * that.x + this.y * that.y;
};

Vec2d.dotXYXY = function(x0, y0, x1, y1) {
  return x0 * x1 + y0 * y1;
};

Vec2d.prototype.magnitudeSquared = function() {
  return this.x * this.x + this.y * this.y;
};

Vec2d.prototype.magnitude = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec2d.prototype.distanceSquared = function(that) {
  var dx = this.x - that.x;
  var dy = this.y - that.y;
  return dx * dx + dy * dy;
};

Vec2d.prototype.distance = function(that) {
  var dx = this.x - that.x;
  var dy = this.y - that.y;
  return Math.sqrt(dx * dx + dy * dy);
};

Vec2d.magnitude = function(x, y) {
  return Math.sqrt(x * x + y * y);
};

/**
 * Scales to the desired length, or 0 if the vector is {0, 0}
 */
Vec2d.prototype.scaleToLength = function(length) {
  var m = this.magnitude();
  if (m) {
    this.scale(length / m);
  }
  return this;
};

/**
 * If the magnitude is over the max, this scales it down.
 */
Vec2d.prototype.clipToMaxLength = function(maxLength) {
  var m = this.magnitude();
  if (m > maxLength) {
    this.scale(maxLength / m);
  }
  return this;
};

Vec2d.prototype.equals = function(v) {
  return (this.x == v.x && this.y == v.y);
};

Vec2d.prototype.isZero = function() {
  return this.x == 0 && this.y == 0;
};

Vec2d.prototype.toString = function() {
  return '(' + this.x + ', ' + this.y + ')';
};

Vec2d.dirs = [
  new Vec2d(0, -1),
  new Vec2d(1, -1),
  new Vec2d(1, 0),
  new Vec2d(1, 1),
  new Vec2d(0, 1),
  new Vec2d(-1, 1),
  new Vec2d(-1, 0),
  new Vec2d(-1, -1)
];

// static func
Vec2d.randDir = function() {
  var dir = Vec2d.dirs[Math.floor(Math.random()*8)];
  return new Vec2d(dir.x, dir.y);
};

Vec2d.alongRayDistance = function(startPoint, towardsPoint, distance) {
  return new Vec2d()
      .set(towardsPoint)
      .subtract(startPoint)
      .scaleToLength(distance)
      .add(startPoint);
};

Vec2d.alongRayFraction = function(startPoint, towardsPoint, fraction) {
  return new Vec2d()
      .set(towardsPoint)
      .subtract(startPoint)
      .scale(fraction)
      .add(startPoint);
};

Vec2d.midpoint = function(a, b) {
  return new Vec2d()
      .set(a)
      .add(b)
      .scale(0.5);
};

Vec2d.distance = function(x0, y0, x1, y1) {
  var dx = x0 - x1;
  var dy = y0 - y1;
  return Math.sqrt((dx * dx) + (dy * dy));
};

Vec2d.distanceSq = function(x0, y0, x1, y1) {
  var dx = x0 - x1;
  var dy = y0 - y1;
  return (dx * dx) + (dy * dy);
};
// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview array math and utils
 */
plex.array = {};

/**
 * Finds the region of difference between arrays 'a' and 'b', using ===.
 *
 * @param {Array} a
 * @param {Array} b
 * @return {Array} null if there's no diff, or an array of the form
 * <code>[start of diff, length of diff in 'a', length of diff in 'b']</code>
 * <br>
 * examples:<br>
 * arrayDiff([0, 11, 11, 0], [0, 22, 0]) returns [1, 2, 1]<br>
 */
plex.array.diff = function(a, b) {
  // find beginning of diff
  for (var i = 0; i < a.length || i < b.length; ++i) {
    if (a[i] !== b[i]) {
      // find lengths of diff
      var ai = a.length - 1;
      var bi = b.length - 1;
      while (ai >= i && bi >= i) {
        if (a[ai] !== b[bi]) {
          break;
        }
        --ai;
        --bi;
      }
      return [i, ai - i + 1, bi - i + 1];
    }
  }
  return null;
};

/**
 * Tests to see if two arrays are equal, using === on the items.  Tests
 * array lengths first for an easy fast fail.
 * @return {boolean} true iff they're equal.
 */
plex.array.equals = function(a, b) {
  if (a.length != b.length) {
    return false;
  }
  // same length; compare entries
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};


/**
 * Sorts a list by item length.  Good for strings or arrays.
 * Keeps the original list order, within each length-bucket.
 * @return a new sorted array
 */
plex.array.sortByLength = function(strs) {
  var buckets = [];
  for (var i = 0; i < strs.length; ++i) {
    var s = strs[i];
    var len = s.length;
    if (!buckets[len]) {
      buckets[len] = [];
    }
    buckets[len].push(s);
  }
  var retval = [];
  for (var b = 0; b < buckets.length; ++b) {
    if (buckets[b]) {
      retval = buckets[b].concat(retval);
    }
  }
  return retval;
};


/**
 * Gets the index of an element in an array, using ===.
 * @param {Array} a  the array in which to look
 * @param {Object} val  the value for which to look
 * @param {number=} opt_fromIndex  optional starting index.  Default is 0.
 * @return {number} the index of the val, or -1 if it's not in the array
 */
plex.array.indexOf = function(a, val, opt_fromIndex) {
  for (var i = opt_fromIndex || 0, n = a.length; i < n; ++i) {
    if (a[i] === val) {
      return i;
    }
  }
  return -1;
};


/**
 * Gets the index of an element in an array, using ===.
 * @param {Array} a  the array in which to look
 * @param {Object} val  the value for which to look
 * @return {boolean}
 */
plex.array.contains = function(a, val) {
  return plex.array.indexOf(a, val) !== -1;
};


/**
 * Makes a shallow copy of the array.
 * @param {Array} a  the array to copy
 * @return {Array} the new array
 */
plex.array.copy = function(a) {
  var b = [];
  for (var i = 0; i < a.length; ++i) {
    b[i] = a[i];
  }
  return b;
};

/**
 * Like Python, this adds all the elements in addMe to toMe.
 * Unlike Array.contat, this does not create a new array. This modifies toMe.
 * @param {Array} toMe
 * @param {Array} addMe
 * @return {Array} toMe after modification
 */
plex.array.extend = function(toMe, addMe) {
  for (var i = 0; i < addMe.length; i++) {
    toMe.push(addMe[i]);
  }
  return toMe;
};

///**
//* crazy HTML formatter for side-by-side array diffing.
//* @return a n HTML table with class 'diff' and with diffed regions as divs
//* also having class 'diff'
//* @deprecated
//*/
//formatDiff: function(a, b, diff) {
//var h = [];
//
//function pushDiffCell(c, length) {
// h.push('<td><div class="diff">');
// for (var i = diff[0]; i < diff[0] + length; ++i) {
//   if (c[i].toString() === "") {
//     // string is empty
//     h.push('&nbsp;<br>');
//   } else {
//     h.push(plex.textToHtml(c[i], true));
//     h.push('<br>');
//   }
// }
// h.push('</div></td>');
//}
//
//function pushSameCell(c, start, end) {
// h.push('<td>');
// for (var i = start; i < end; ++i) {
//   if (c[i].toString() === "") {
//     // string is empty or all spaces
//     h.push('&nbsp;<br>');
//   } else {
//     h.push(plex.textToHtml(c[i], true));
//     h.push('<br>');
//   }
// }
// //h.push(plex.textToHtml(c.slice(start, end).join('\n')));
// h.push('</td>');
//}
//
//h.push('<table class="diff" cellpadding=0 cellspacing=0>');
//
//// same region
//h.push('<tr>');
//pushSameCell(a, 0, diff[0]);
//pushSameCell(b, 0, diff[0]);
//h.push('</tr>');
//
//// diff region
//h.push('<tr>');
//pushDiffCell(a, diff[1]);
//pushDiffCell(b, diff[2]);
//h.push('</div></tr>');
//
//// same region
//h.push('<tr>');
//pushSameCell(a, diff[0] + diff[1], a.length);
//pushSameCell(b, diff[0] + diff[2], b.length);
//h.push('</tr>');
//
//h.push('</table>');
//return h.join('');
//},



// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Code for handling DOM events in a cross-browser way.
 */
this.plex = this.plex || {};
plex.event = {};

/**
 * keycodes for key event.keyCode
 */
plex.event.KEYCODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  UP_SAFARI: 63232,
  DOWN_SAFARI: 63233,
  LEFT_SAFARI: 63234,
  RIGHT_SAFARI: 63235,
  ENTER: 77,
  RETURN: 13,
  ESC: 27,
  DOT: 46,
  SPACE: 32,
  C: 67,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  P: 80,
  S: 83,
  X: 88,
  Z: 90,
  BACKSLASH: 220
};

/**
 * Adds an event listener.
 * @param {object} element  DOM element to which to attach listener
 * @param {string} eventName  like 'click', without the 'on' part
 * @param {function} fn  listener function to add
 */
plex.event.addListener = function(element, eventName, fn) {
  if (element.addEventListener) {
    // DOM Level 2
    element.addEventListener(eventName, fn, false);
  } else if (element.attachEvent) {
    // IE
    element.attachEvent('on' + eventName, fn);
  }
};


/**
 * Adds a listener to multiple events.
 * @param {object} element  DOM element to which to attach listener
 * @param {array.<string>} eventNames  like 'click', without the 'on' part
 * @param {function} fn  listener function to add
 */
plex.event.addListenerToEvents = function(element, eventNames, fn) {
  for (var i = 0; i < eventNames.length; ++i) {
    plex.event.addListener(element, eventNames[i], fn);
  }
};


/**
 * Removes an event listener.
 * @param {object} element  DOM element from which to remove listener
 * @param {string} eventName  like 'click', without the 'on' part
 * @param {function} fn  listener function to remove
 */
plex.event.removeListener = function(element, eventName, fn) {
  if (element.removeEventListener) {
    // DOM level 2
    element.removeEventListener(eventName, fn, false);
  } else if (element['detatchEvent']) {
    // IE
    element['detatchEvent']('on' + eventName, fn);
  }
};


/**
 * Removes an event listener from multiple events.
 * @param {object} element  DOM element from which to remove listener
 * @param {array.<string>} eventNames  like 'click', without the 'on' part
 * @param {function} fn  listener function to remove
 */
plex.event.removeListenerFromEvents = function(element, eventNames, fn) {
  for (var i = 0; i < eventNames.length; ++i) {
    plex.event.removeListener(element, eventNames[i], fn);
  }
};


/**
 * Gets the event target from an event object.
 * @param {object} event
 */
plex.event.getTarget = function(event) {
  return event.target || event.srcElement;
};


/**
 * Gets the related target for a mouseover/mouseout event.
 * @param {object} event  must not be null
 * @return {object} element or null
 */
plex.event.getRelatedTarget = function(event) {
  // Other
  if (event.relatedTarget) return event.relatedTarget;
  // IE
  switch(event.type) {
    case 'mouseover': return event.fromElement;
    case 'mouseout': return event.toElement;
  }
  return null;
};


/**
 * For mouseover/mouseout, returns the element that the mouse left.
 * May return null when the mouse is entering from off-window.
 * @param {object} event  must not be null
 * @return {object} element or null
 */
plex.event.getFromElement = function(event) {
  // IE
  if (event.fromElement) return event.fromElement;
  // Other
  switch(event.type) {
    case 'mouseover': return event.relatedTarget;
    case 'mouseout': return event.target;
  }
  return null;
};


/**
 * For mouseover/mouseout, returns the element that the mouse entered.
 * May return null when the mouse is leaving the window.
 * @param {object} event  must not be null
 * @return {object} element or null
 */
plex.event.getToElement = function(event) {
  // IE
  if (event.toElement) return event.toElement;
  // Other
  switch(event.type) {
    case 'mouseover': return event.target;
    case 'mouseout': return event.relatedTarget;
  }
  return null;
};


plex.event.preventDefault = function(event) {
  if ('preventDefault' in event) {
    // DOM2
    event.preventDefault();
  }
  if ('returnValue' in event) {
    event.returnValue = false;
  }
  if ('cancelBubble' in event) {
    event.cancelBubble = true;
  }
};

plex.event.isRightClick = function(mouseClickEvent) {
  // see http://www.quirksmode.org/js/events_properties.html#button
  return mouseClickEvent.button == 2;
};

/**
 * Tracks listeners so unlistening can be done easily.
 * @constructor
 */
plex.event.ListenerTracker = function() {
  this.listeners = [];
};

plex.event.ListenerTracker.prototype.addListener = function(element, eventName, fn) {
  plex.event.addListener(element, eventName, fn);
  this.listeners.push([element, eventName, fn]);
};

plex.event.ListenerTracker.prototype.removeAllListeners = function() {
  var a;
  while (a = this.listeners.pop()) {
    plex.event.removeListener(a[0], a[1], a[2]);
  }
};

this.plex = this.plex || {};

/**
 * @param {string} name
 * @param {number} keyCode
 * @constructor
 */
plex.Key = function(name, keyCode) {
  this.name = name;
  this.keyCode = keyCode;
};

/**
 * Names of keys that don't always have a
 * readable single character representation.
 * @enum {string}
 */
plex.Key.Name = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  BACKSPACE: 'backspace',
  DELETE: 'delete',
  SPACE: 'space',
  SEMICOLON: ';',
  BACKSLASH: '\\',
  ESC: 'esc'
};

this.plex = this.plex || {};

/**
 * Simply associates numeric keycodes  programmer-friendly names.
 * @constructor
 */
plex.Keys = function() {
  // Index the keys by both fields.
  this.byKeyCode = {};
  this.byName = {};

  this.initialized = false;
};

plex.Keys.prototype.getKeyCodeForName = function(name) {
  if (!this.initialized) this.initKeys();
  var key = this.byName[name];
  return key ? key.keyCode : null;
};

plex.Keys.prototype.getNameForKeyCode = function(keyCode) {
  if (!this.initialized) this.initKeys();
  var key = this.byKeyCode[keyCode];
  return key ? key.name : null;
};

/**
 *  Add all letters, numbers, and plex.Key.Name values to byKeyCode and byName indexes.
 */
plex.Keys.prototype.initKeys = function() {
  var self = this;

  function addKey(name, keyCode) {
    var key = new plex.Key(name, keyCode);
    self.byName[name] = key;
    self.byKeyCode[keyCode] = key;
  }

  function addKeySequence(firstChar, firstKeyCode, lastChar) {
    var firstCharCode = firstChar.charCodeAt(0);
    var lastCharCode = lastChar.charCodeAt(0);
    if (firstCharCode > lastCharCode) throw Error(firstChar + ' > ' + lastChar);
    var keyCode = firstKeyCode;
    for (var charCode = firstCharCode; charCode <= lastCharCode; charCode++) {
      addKey(String.fromCharCode(charCode), keyCode);
      keyCode++;
    }
  }
  addKeySequence('a', 65, 'z');
  addKeySequence('0', 48, '9');

  addKey(plex.Key.Name.LEFT, 37);
  addKey(plex.Key.Name.UP, 38);
  addKey(plex.Key.Name.RIGHT, 39);
  addKey(plex.Key.Name.DOWN, 40);

  addKey(plex.Key.Name.BACKSPACE, 8);
  addKey(plex.Key.Name.DELETE, 46);
  addKey(plex.Key.Name.SPACE, 32);

  addKey(plex.Key.Name.SEMICOLON, 186);
  addKey(plex.Key.Name.BACKSLASH, 220);

  addKey(plex.Key.Name.ESC, 27);

  this.initialized = true;
};
// Copyright 2012 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * Animation loop.
 * @param func  The funtion to call (in the context of the window) every tick
 * @param targetFps The desired number of ticks per second.
 * @constructor
 */
plex.Loop = function(func, targetFps) {
  this.func = func;
  this.targetFps = targetFps;

  this.targetPeriod = 1000 / this.targetFps;
  this.delay = Math.floor(this.targetPeriod);
  this.running = false;
  this.prevTime = 0;
  var self = this;
  this.timeoutFunc = function() {
    self.clock();
  };
};

plex.Loop.prototype.start = function() {
  if (this.running) return;
  this.running = true;
  this.clock();
};

plex.Loop.prototype.clock = function() {
  if (!this.running) return; // exception?
  this.func.call();
  var now = (new Date()).getTime();
  var actualPeriod = now - this.prevTime;
  this.prevTime = now;
  this.delay += (actualPeriod < this.targetPeriod) ? 1 : -1;
  if (this.delay < 0) this.delay = 0;
  this.timeoutId = setTimeout(this.timeoutFunc, this.delay);
};

plex.Loop.prototype.stop = function() {
  if (!this.running) return;
  clearTimeout(this.timeoutId);
  this.running = false;
};

// Copyright 2012 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview Map class, with arbitrary keys that won't collide with any system stuff.
 */

/**
 * @constructor
 */
plex.Map = function() {
  this.m = {};
  this.length = 0;
};

plex.Map.PREFIX = '=';

plex.Map.prototype.set = function(k, v) {
  var objKey = plex.Map.PREFIX + k;
  if (!this.m[objKey]) this.length++;
  this.m[objKey] = v;
  return this;
};

plex.Map.prototype.get = function(k) {
  return this.m[plex.Map.PREFIX + k];
};

plex.Map.prototype.contains = function(k) {
  return this.get(k) !== undefined;
};

plex.Map.prototype.remove = function(k) {
  var objKey = plex.Map.PREFIX + k;
  if (this.m[objKey]) this.length--;
  delete this.m[objKey];
};

/**
 * @return {Array}
 */
plex.Map.prototype.getKeys = function() {
  var keys = [];
  for (var pk in this.m) {
    keys.push(pk.substr(1));
  }
  return keys;
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview
 */
this.plex = this.plex || {};
plex.object = {};

plex.object.expose = function(obj) {
  var text = [];
  for (var x in obj) {
    try {
      text.push(x + ' = ' + obj[x]);
    } catch (e) {
      text.push('*** ' + e + ' ***');
    }
  }
  return text.join('\n');
};

plex.object.isEmpty = function(obj) {
  for (var k in obj) {
    return false;
  }
  return true;
};

plex.object.set = function(obj, attrs) {
  for (var a in attrs) {
    obj[a] = attrs[a];
  }
  return obj;
};

plex.object.keys = function(obj) {
  var keys = [];
  try {
    for (var key in obj) {
      keys.push(key);
    }
  } catch (e) {
    // some kinda access violation
  }
  return keys;
};

plex.object.length = function(obj) {
  var len = 0;
  for (var k in obj) {
    len++;
  }
  return len;
};

plex.object.values = function(obj) {
  var values = [];
  try {
    for (var key in obj) {
      values.push(obj[key]);
    }
  } catch (e) {
    // some kinda access violation
  }
  return values;
};

plex.object.deleteUndefined = function(obj) {
  try {
    for (var key in obj) {
      if (typeof obj[key] == 'undefined') {
        delete obj[key];
      }
    }
  } catch (e) {
    // some kinda access violation
  }
  return obj;
};

plex.object.clear = function(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
  return obj;
};


// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * A point, or really an xy pair.
 * @param {number=} opt_x
 * @param {number=} opt_y
 * @constructor
 */
plex.Point = function(opt_x, opt_y) {
  this.x = Number(opt_x || 0);
  this.y = Number(opt_y || 0);
};


plex.Point.prototype.equals = function(that) {
  return this.x == that.x && this.y == that.y;
};


plex.Point.prototype.toString = function() {
  return '{x:' + this.x + ', y:' + this.y + '}';
};


plex.Point.prototype.boundingRect = function() {
  return new plex.Rect(this, this);
};


plex.Point.prototype.setX = function(x) {
  this.x = Number(x);
};


plex.Point.prototype.setY = function(y) {
  this.y = Number(y);
};


plex.Point.prototype.setXy = function(x, y) {
  this.x = Number(x);
  this.y = Number(y);
  return this;
};

plex.Point.prototype.set = function(that) {
  this.x = Number(that.x);
  this.y = Number(that.y);
  return this;
};

plex.Point.prototype.getX = function() {
  return this.x;
};


plex.Point.prototype.getY = function() {
  return this.y;
};

plex.Point.prototype.add = function(that) {
  this.x += Number(that.x);
  this.y += Number(that.y);
  return this;
};

plex.Point.prototype.subtract = function(that) {
  this.x -= that.x;
  this.y -= that.y;
  return this;
};

plex.Point.prototype.scale = function(s) {
  this.x *= s;
  this.y *= s;
  return this;
};


// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview  Rectangle math
 */

this.plex = this.plex || {};
plex.rect = {};

plex.rect.HORIZ = 1;
plex.rect.FAR = 2;

plex.rect.TOP = plex.rect.HORIZ;
plex.rect.RIGHT = plex.rect.FAR;
plex.rect.BOTTOM = plex.rect.FAR | plex.rect.HORIZ;
plex.rect.LEFT = 0;

plex.rect.getOppositeEdge = function(edge) {
  var r = plex.rect;
  switch (edge) {
    case r.TOP: return r.BOTTOM;
    case r.RIGHT: return r.LEFT;
    case r.BOTTOM: return r.TOP;
    case r.LEFT: return r.RIGHT;
  }
  throw Error('Unknown edge: ' + edge);
};

plex.rect.PARSE_VALUE_RE = /s*(-?\d+(.\d+)?)(\%|px)?\s*$/;


/**
 * Allows negative numbers, fractions, and leading and trailing whitespace.
 * Legal units are "%" and "px".  If no units are given, "px" are assumed.
 * @param {string|number} str
 * @return an array [number, units], or null
 */
plex.rect.parseMeasurement = function(str) {
  str = String(str);
  var m = str.match(plex.rect.PARSE_VALUE_RE);
  return m ? [parseFloat(m[1]), m[3] ? m[3] : 'px'] : null;
};


/**
 * Creates a rect using the coordinates specified.
 * 
 * @param {number} x0 left
 * @param {number} y0 top
 * @param {number} x1 right
 * @param {number} y1 bottom
 * @return {plex.Rect} the new rect
 */
plex.rect.createXyxy = function(x0, y0, x1, y1) {
  return new plex.Rect(new plex.Point(x0, y0), new plex.Point(x1, y1));
};


/**
 * Creates a rect using the top-left coords and the width and height.
 * @param {number} x left
 * @param {number} y top
 * @param {number} w width
 * @param {number} h height
 * @return {plex.Rect} the new rect
 */
plex.rect.createXywh = function(x, y, w, h) {
  return plex.rect.createXyxy(x, y, x + w, y + h);
};


/**
 * Creates a bounding rect from a list of boundingRects
 * @param {Array} objs  an array of 1 or more objects that implement
 * boundingRect()
 * @return {plex.Rect} a new rectangle bounding all the inputs.
 */
plex.rect.boundingRect = function(objs) {
  for (var i = 0; i < objs.length; ++i) {
    var r = objs[i].boundingRect();
    if (!i) {
      var left = r.getLeft();
      var top = r.getTop();
      var right = r.getRight();
      var bottom = r.getBottom();
    } else {
      left = Math.min(left, r.getLeft());
      top = Math.min(top, r.getTop());
      right = Math.max(right, r.getRight());
      bottom = Math.max(bottom, r.getBottom());
    }
  }
  return plex.rect.createXyxy(left, top, right, bottom);
};


/**
 * Creates new rectangle with new points p0 and p1 representing the top-left
 * and bottom-right corners.  Optional point param values are copied, not
 * set by reference.
 * @param {plex.Point} opt_p0
 * @param {plex.Point} opt_p1
 * @constructor
 */
plex.Rect = function(opt_p0, opt_p1) {
  this.p0 = new plex.Point();
  this.p1 = new plex.Point();
  if (opt_p0) this.p0.set(opt_p0);
  if (opt_p1) this.p1.set(opt_p1);
};


plex.Rect.prototype.set = function(rect) {
  this.p0.set(rect.p0);
  this.p1.set(rect.p1);
};

plex.Rect.prototype.setP0 = function(p) {
  this.p0.set(p);
};


plex.Rect.prototype.setP1 = function(p) {
  this.p1.set(p);
};


plex.Rect.prototype.setTop = function(top) {
  this.p0.setY(top);
};


plex.Rect.prototype.setRight = function(right) {
  this.p1.setX(right);
};


plex.Rect.prototype.setBottom = function(bottom) {
  this.p1.setY(bottom);
};


plex.Rect.prototype.setLeft = function(left) {
  this.p0.setX(left);
};


plex.Rect.prototype.setXyxy = function(x0, y0, x1, y1) {
  this.p0.setXy(x0, y0);
  this.p1.setXy(x1, y1);
};


/**
 * Compare rects for equality
 * @param {plex.Rect} that
 * @return {boolean}
 */
plex.Rect.prototype.equals = function(that) {
  return this.p0.equals(that.p0) && this.p1.equals(that.p1);
};


plex.Rect.prototype.toString = function() {
  return '{p0:' + this.p0.toString() + ', p1:' + this.p1.toString() + '}';
};


plex.Rect.prototype.boundingRect = function() {
  return this;
};


plex.Rect.prototype.getTop = function() {
  return this.p0.getY();
};


plex.Rect.prototype.getRight = function() {
  return this.p1.getX();
};


plex.Rect.prototype.getBottom = function() {
  return this.p1.getY();
};


plex.Rect.prototype.getLeft = function() {
  return this.p0.getX();
};


plex.Rect.prototype.getWidth = function() {
  return this.p1.getX() - this.p0.getX();
};


plex.Rect.prototype.getHeight = function() {
  return this.p1.getY() - this.p0.getY();
};


plex.Rect.prototype.getEdgePos = function(edge) {
  var r = plex.rect;
  switch (edge) {
    case r.TOP: return this.getTop();
    case r.RIGHT: return this.getRight();
    case r.BOTTOM: return this.getBottom();
    case r.LEFT: return this.getLeft();
    default: throw 'unknown fromEdge "' + edge + '"';
  }
};


/**
 * 
 * @param {number} edge one of the plex.rect.TOP|RIGHT|BOTOM|LEFT constants
 * @param {number|string|Array} dist can be either a measurement [val, units],
 *     or a string or number to parse.
 */
plex.Rect.prototype.getInsetPosition = function(edge, dist) {
  var r = plex.rect;
  var isHoriz = r.HORIZ & edge;
  var isFar = r.FAR & edge;
  var m = plex.type.isArray(dist) ? dist : 
      plex.rect.parseMeasurement(( /** @type {string} */ dist));
  var pos = this.getEdgePos(edge);
  switch(m[1]) {
    case '%':
      pos += 0.01 * m[0] * (isFar ? -1 : 1) *
             (isHoriz ? this.getHeight() : this.getWidth());
      break;
    case 'px':
      pos += (isFar ? -1 : 1) * m[0];
      break;
    default:
      throw 'unknown units "' + m[1] + '"';
  }
  return pos;
};


/**
 * Get the document-pixel position of a point that's a that is x% from the
 * left edge of the rect, and y% from the top. 
 * @param {number} xPercent
 * @param {number} yPercent
 * @param {plex.Point} opt_ptOut  optional point to set.
 * @return {plex.Point} either opt_ptOut or a new Point
 */
plex.Rect.prototype.getPercentPoint = function(xPercent, yPercent, opt_ptOut) {
  var p = opt_ptOut || new plex.Point();
  return p.setXy(this.getInsetPosition(plex.rect.LEFT, [xPercent, '%']),
                 this.getInsetPosition(plex.rect.TOP, [yPercent, '%']));
};


/**
 * Create an inset rectangle.  
 * @param {string} top
 * @param {string=} opt_right
 * @param {string=} opt_bottom
 * @param {string=} opt_left
 * @return {plex.Rect}
 */
plex.Rect.prototype.createInsetRect = function(
    top, opt_right, opt_bottom, opt_left) {
  var r = plex.rect;
  var right = (/** @type {string} */ opt_right || top);
  var bottom = (/** @type {string} */ opt_bottom || top);
  var left = (/** @type {string} */ opt_left || right);
  return plex.rect.createXyxy(
      this.getInsetPosition(r.LEFT, left),
      this.getInsetPosition(r.TOP, top),
      this.getInsetPosition(r.RIGHT, right),
      this.getInsetPosition(r.BOTTOM, bottom));
};


/**
 * Creates a rect by splitting this at a distance 'val' from 'edge',
 * and returning the rect near 'fromEdge', or the other half, depending on
 * 'nearHalf'.
 * @param {number} edge  one of plex.rect.(TOP|RIGHT|BOTTOM|LEFT)
 * @param {string} val  how far from the edge to make the split
 * @param {boolean} nearHalf  return the half near the edge, or the other half
 * @return {plex.Rect} a new Rect
 */
plex.Rect.prototype.createHalf = function(edge, val, nearHalf) {
  var mid = this.getInsetPosition(edge, val);
  var r = plex.rect;
  if (!nearHalf) edge = r.getOppositeEdge(edge);
  var left = edge == r.RIGHT ? mid : this.getLeft(); 
  var right = edge == r.LEFT ? mid : this.getRight();
  var top = edge == r.BOTTOM ? mid : this.getTop();
  var bottom = edge == r.TOP ? mid : this.getBottom();
  return plex.rect.createXyxy(left, top, right, bottom);
};


/**
 * @param {Object} columns
 * @param {Object} rows
 * @param {Object} column
 * @param {Object} row
 */
plex.Rect.prototype.createGridCell = function(columns, rows, column, row) {
  var cellWidth = this.getWidth() / columns;
  var cellLeft = this.getLeft() + cellWidth * column;

  var cellHeight = this.getHeight() / rows;
  var cellTop = this.getTop() + cellHeight * row;

  return plex.rect.createXywh(cellLeft, cellTop, cellWidth, cellHeight);
};


/**
 * @return {Array} rows, each containing an Array of plex.Rect objs.
 */
plex.Rect.prototype.createGrid = function(cols, rows) {
  var height = this.getHeight();
  var width = this.getWidth();
  var top = this.getTop();
  var left = this.getLeft();
  var i;

  var cellTops = [];
  var cellHeight = height / rows;
  for (i = 0; i <= rows; ++i) {
    cellTops[i] = top + cellHeight * i;
  }
  var cellLefts = [];
  var cellWidth = width / cols;
  for (i = 0; i <= cols; ++i) {
    cellLefts[i] = left + cellWidth * i;
  }

  var grid = [];
  for (i = 0; i < rows; ++i) {
    var row = [];
    for (var j = 0; j < cols; ++j) {
      var cell = plex.rect.createXyxy(cellTops[i], cellLefts[j],
                                      cellTops[i + 1], cellLefts[j + 1]);
      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
};

// Copyright 2012 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};

/**
 * @fileoverview Set of strings.
 */

this.plex = this.plex || {};

/**
 * @constructor
 */
plex.StringSet = function() {
  this.m = {};
};

plex.StringSet.PREFIX = '=';

plex.StringSet.prototype.put = function(v) {
  this.m[plex.StringSet.PREFIX + v] = true;
  return this;
};

plex.StringSet.prototype.putArray = function(a) {
  for (var i = 0; i < a.length; i++) {
    this.m[plex.StringSet.PREFIX + a[i]] = true;
  }
  return this;
};

plex.StringSet.prototype.contains = function(v) {
  return !!this.m[plex.StringSet.PREFIX + v];
};

plex.StringSet.prototype.remove = function(v) {
  delete this.m[plex.StringSet.PREFIX + v];
  return this;
};

plex.StringSet.prototype.add = function(that) {
  for (var key in that.m) {
    this.m[key] = true;
  }
  return this;
};

plex.StringSet.prototype.subtract = function(that) {
  for (var key in that.m) {
    delete this.m[key];
  }
  return this;
};

/**
 * @return {Array}
 */
plex.StringSet.prototype.getValues = function() {
  var vals = [];
  for (var key in this.m) {
    vals.push(key.substr(1));
  }
  return vals;
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

/**
 * @fileoverview Code for figuring out the type of an object.
 */

this.plex = this.plex || {};
plex.type = {};

/**
 * Figures out the most specific type of an object.
 * Possible values, from most specific to least specific:
 * null, undefined, number, boolean, string, function, array, object
 * @param a
 * @return {string} a lowercase type string
 */
plex.type.getType = function(a) {
  if (a === null) return 'null';
  var t = typeof a;
  switch (t) {
    case 'boolean':
    case 'function':
    case 'number':
    case 'string':
    case 'undefined':
      return t;
    case 'object':
      try {
        if (a.constructor == Array) return 'array';
      } catch(e) {
        // ignore - some object don't allow property access
      }
      return 'object';
  }
};


/**
 * @param a
 * @return {boolean} true iff 'a' is an object, array, or function
 */
plex.type.isObject = function(a) {
  var t = plex.type.getType(a);
  return t == 'object' || t == 'array' || t == 'function';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isArray = function(a) {
  return plex.type.getType(a) == 'array';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isBoolean = function(a) {
  return typeof a == 'boolean';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isFunction = function(a) {
  return typeof a == 'function';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isNumber = function(a) {
  return typeof a == 'number';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isString = function(a) {
  return typeof a == 'string';
};


/**
 * @param a
 * @return {boolean}
 */
plex.type.isUndefined = function(a) {
  return typeof a == 'undefined';
};

// Copyright 2006 Aaron Whyte
// All Rights Reserved.

this.plex = this.plex || {};
plex.window = {};
  
/**
 * Figures out the window's inner height and width.
 * @param {Window} opt_win  Option window.  If not provided, uses global
 *   context.
 * @return {Object} an obj like {width:321, height:123}, or null if the
 *   situation is hopeless.
 */
plex.window.getSize = function(opt_win) {
  var win = opt_win || window;
  var size = null;
  if (win.innerHeight) {
    // non-IE
    size = {width: win.innerWidth,
            height: win.innerHeight};
  } else {
    // IE messing with our heads
    var de = win.document.documentElement;
    if (de && de.clientHeight) {
      // IE 6 strict, yay!
      size = {width: de.clientWidth,
              height: de.clientHeight};
    } else {
      size = {width: document.body.clientWidth,
              height: document.body.clientHeight};
    }
  }
  return size;
};

plex.window.getRect = function(opt_win) {
  var size = plex.window.getSize(opt_win);
  return plex.rect.createXywh(0, 0, size.width, size.height);
};

/**
 * @constructor
 */
function Vorp(vorpOut, phy, wham, gameClock, sledgeInvalidator) {
  this.vorpOut = vorpOut;
  this.phy = phy;
  this.wham = wham;
  this.gameClock = gameClock;
  this.sledgeInvalidator = sledgeInvalidator;

  this.playerSprite = null;
  this.playerAssemblyTime = null;
  this.cameraPos = new Vec2d();

  this.accelerationsOut = [new Vec2d(), new Vec2d()];

  this.links = {};
  this.editable = false;
}

Vorp.EXPLODED_PLAYER_REASSEMBLY_DELAY = 30;
Vorp.ZOMBIFIED_PLAYER_REASSEMBLY_DELAY = 40;

Vorp.PORTAL_SCRY_RADIUS = 160;

Vorp.FRICTION = 0.07;

Vorp.ZOOM = 0.34;

// Target frames per second.
Vorp.FPS = 60;

Vorp.EMPTY_GROUP = 1;
Vorp.NO_HIT_GROUP = 2;
Vorp.PLAYER_GROUP = 3;
Vorp.MONSTER_GROUP = 4;
Vorp.WALL_GROUP = 5;
Vorp.GENERAL_GROUP = 6;
Vorp.ZAPPER_GROUP = 7;
Vorp.PORTAL_GROUP = 8;
Vorp.PORTAL_PROBE_GROUP = 9;
Vorp.PORTAL_REPEL_GROUP = 10
Vorp.GRIP_BLOCKER_GROUP = 11;
Vorp.PLASMA_PROBE_GROUP = 12;
Vorp.PLASMA_GROUP = 13;
Vorp.TRACTOR_BEAM_GROUP = 14;

Vorp.COLLIDER_GROUP_PAIRS = [
  [Vorp.EMPTY_GROUP, Vorp.EMPTY_GROUP],
  [Vorp.NO_HIT_GROUP, Vorp.EMPTY_GROUP],

  [Vorp.MONSTER_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.MONSTER_GROUP, Vorp.MONSTER_GROUP],

  [Vorp.WALL_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.WALL_GROUP, Vorp.MONSTER_GROUP],

  [Vorp.GENERAL_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.GENERAL_GROUP, Vorp.MONSTER_GROUP],
  [Vorp.GENERAL_GROUP, Vorp.WALL_GROUP],
  [Vorp.GENERAL_GROUP, Vorp.GENERAL_GROUP],

  [Vorp.ZAPPER_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.ZAPPER_GROUP, Vorp.MONSTER_GROUP],

  [Vorp.PORTAL_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.PORTAL_GROUP, Vorp.MONSTER_GROUP],
  [Vorp.PORTAL_GROUP, Vorp.WALL_GROUP],
  [Vorp.PORTAL_GROUP, Vorp.GENERAL_GROUP],
  [Vorp.PORTAL_GROUP, Vorp.PORTAL_GROUP],

  [Vorp.PORTAL_PROBE_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.PORTAL_PROBE_GROUP, Vorp.MONSTER_GROUP],
  [Vorp.PORTAL_PROBE_GROUP, Vorp.WALL_GROUP],
  [Vorp.PORTAL_PROBE_GROUP, Vorp.GENERAL_GROUP],
  [Vorp.PORTAL_PROBE_GROUP, Vorp.PORTAL_GROUP],

  [Vorp.PORTAL_REPEL_GROUP, Vorp.WALL_GROUP],

  [Vorp.GRIP_BLOCKER_GROUP, Vorp.WALL_GROUP],

  [Vorp.PLASMA_PROBE_GROUP, Vorp.ZAPPER_GROUP],

  [Vorp.PLASMA_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.PLASMA_GROUP, Vorp.MONSTER_GROUP],
  [Vorp.PLASMA_GROUP, Vorp.WALL_GROUP],
  [Vorp.PLASMA_GROUP, Vorp.GENERAL_GROUP],
  [Vorp.PLASMA_GROUP, Vorp.PORTAL_GROUP],

  [Vorp.TRACTOR_BEAM_GROUP, Vorp.PLAYER_GROUP],
  [Vorp.TRACTOR_BEAM_GROUP, Vorp.MONSTER_GROUP],
  [Vorp.TRACTOR_BEAM_GROUP, Vorp.WALL_GROUP],
  [Vorp.TRACTOR_BEAM_GROUP, Vorp.GENERAL_GROUP],
  [Vorp.TRACTOR_BEAM_GROUP, Vorp.PORTAL_GROUP]
];

Vorp.CELL_SIZE = 100;

// Ordered list of paint layers
Vorp.LAYERS = [
  Vorp.LAYER_SPARKS = 'sparks',
  Vorp.LAYER_MASSES = 'masses',
  Vorp.LAYER_SUPERSPARKS = 'supersparks'
];
// optional layers
Vorp.LAYER_DEBUG = 'debug';
Vorp.LAYER_EDIT = 'edit';

Vorp.createVorp = function(vorpOut, gameClock, sledgeInvalidator) {
  var collider = new CellCollider(
      Vorp.CELL_SIZE, Vorp.COLLIDER_GROUP_PAIRS, gameClock);
  var wham = new VorpWham();
  var phy = new Phy(collider, gameClock, sledgeInvalidator);
  var vorp = new Vorp(vorpOut, phy, wham, gameClock, sledgeInvalidator);
  phy.setOnSpriteHit(vorp, vorp.onSpriteHit);
  return vorp;
};

Vorp.prototype.setEditable = function(editable) {
  this.editable = editable;
  this.vorpOut.setEditable(editable);
};

Vorp.prototype.startLoop = function() {
  if (!this.editable) {
    this.resize();
    if (!this.listeners) {
      // TODO: remove all GU_* stuff
      GU_keys.length = 0;
      this.listeners = new plex.event.ListenerTracker();
      this.listeners.addListener(document, 'keydown', GU_keyDown);
      this.listeners.addListener(document, 'keyup', GU_keyUp);
      this.listeners.addListener(window, 'resize', this.getResizeListener());
    }
  }
  if (!this.loop) {
    var self = this;
    this.loop = new plex.Loop(
        function() {
          self.clock();
        },
        Vorp.FPS);
  }
  this.loop.start();
};

Vorp.prototype.stopLoop = function() {
  if (this.listeners) {
    this.listeners.removeAllListeners();
    this.listeners = null;
    GU_keys.length = 0;
  }
  if (this.vorpOut) {
    this.vorpOut.disconnect();
  }
  if (this.loop) {
    this.loop.stop();
  }
};

Vorp.prototype.getResizeListener = function() {
  var self = this;
  return function(event) {
    self.resize();
  };
};

Vorp.prototype.resize = function() {
  var header = document.getElementById('levelHeader');
  var headerHeight = (header && header.offsetHeight + header.offsetTop) || 0;
  var footer = document.getElementById('levelFooter');
  var footerHeight = (footer && footer.offsetHeight) || 0;

  var s = plex.window.getSize();
  var maxHeight = s.height - (footerHeight + headerHeight);
  var maxWidth = s.width;
  var dim = Math.min(maxWidth, maxHeight);
  var left;
  if (maxWidth < maxHeight) {
    left = '0';
  } else {
    left = (s.width / 2 - dim / 2);
  }
  this.vorpOut.setCanvasSizeLeftTop(dim, left, headerHeight);
};


Vorp.prototype.getBaseSpriteTemplate = function() {
  if (!this.baseSpriteTemplate) {
    this.baseSpriteTemplate = VorpSpriteTemplate.createBase(this, this.gameClock, this.sledgeInvalidator);
  }
  return this.baseSpriteTemplate;
};

Vorp.prototype.addSprites = function(sprites) {
  for (var i = 0; i < sprites.length; i++) {
    this.addSprite(sprites[i]);
  }
};

/**
 * @param {Sprite} sprite
 */
Vorp.prototype.addSprite = function(sprite) {
  this.phy.addSprite(sprite);
  var painter = sprite.getPainter();
  if (painter) {
    this.vorpOut.addPainter(painter);
  }
  var singer = sprite.getSinger();
  if (singer) {
    this.vorpOut.addSinger(singer);
  }
  if (sprite instanceof PlayerAssemblerSprite) {
    // Assume there's exactly one PlayerAssembler per level for now.
    /** @type {PlayerAssemblerSprite} */
    this.playerAssembler = sprite;
    this.assemblePlayer();
  }
};

/**
 * @param {Sprite} sprite
 */
Vorp.prototype.setPlayerSprite = function(sprite) {
  this.playerSprite = sprite;
};

/**
 * @param {LogicLink} link
 */
Vorp.prototype.addLogicLink = function(link) {
  var id = link.id;
  if (!id) throw "Invalid falsy link ID: " + id;
  if (this.links[id]) throw "Link with ID " + id + " already exists.";
  this.links[id] = link;
};

/**
 * @return a new array with all sprites in it. Probably useful for tests.
 */
Vorp.prototype.getSprites = function() {
  var sprites = [];
  for (var id in this.phy.sprites) {
    sprites.push(this.phy.sprites[id]);
  }
  return sprites;
};

/**
 * Moves time forward by one and then draws.
 */
Vorp.prototype.clock = function() {
  if (this.playerAssemblyTime && this.now() >= this.playerAssemblyTime) {
    this.assemblePlayer();
    this.playerAssemblyTime = null;
  }
  this.phy.clock(1);
  this.clockSprites();
  this.clockLinks();
  this.draw();
};

Vorp.prototype.clockSprites = function() {
  // clear teleport counts
  for (var id in this.phy.sprites) {
    var sprite = this.phy.sprites[id];
    sprite.portalCount = 0;
  }
  // sprites act
  for (var id in this.phy.sprites) {
    var sprite = this.phy.sprites[id];
    if (sprite.sledgeDuration != Infinity) {
      sprite.invalidateSledge();
    }
    sprite.act(this);
  }
  // sprites are affected by simultaneous accelerations
  for (var id in this.phy.sprites) {
    var sprite = this.phy.sprites[id];
    sprite.affect(this);
  }
};

Vorp.prototype.clockLinks = function() {
  // Clear old input buffers.
  for (var id in this.links) {
    var link = this.links[id];
    var inputSprite = this.getSprite(link.inputSpriteId);
    if (!inputSprite) throw "no sprite with ID " + link.inputSpriteId;
    inputSprite.clearInputs();
  }
  // Set new input buffer values.
  for (var id in this.links) {
    var link = this.links[id];
    var outputSprite = this.getSprite(link.outputSpriteId);
    if (!outputSprite) throw "no sprite with ID " + link.outputSpriteId;
    var inputSprite = this.getSprite(link.inputSpriteId);
    inputSprite.addToInput(link.inputIndex, outputSprite.outputs[link.outputIndex]);
  }
};

/**
 * Draws and repositions the audio listener.
 */
Vorp.prototype.draw = function() {
  var now = this.now();
  if (this.playerSprite) {
    this.playerSprite.getPos(this.cameraPos);
  }
  this.vorpOut.draw(now, this.cameraPos.x, this.cameraPos.y);
};


Vorp.prototype.now = function() {
  return this.gameClock.getTime();
};

Vorp.prototype.getPlayerSprite = function() {
  return this.playerSprite;
};

Vorp.prototype.isPlayerSpriteId = function(id) {
  return !!this.playerSprite && this.playerSprite.id == id
      && (this.playerSprite instanceof PlayerSprite);
};

Vorp.prototype.exitToUrl = function(url) {
  window.location = url;
};

Vorp.prototype.removeSprite = function(id) {
  this.phy.removeSprite(id);
};

Vorp.prototype.getZombieSpriteFactory = function() {
  if (!this.zombieSpriteFactory) {
    this.zombieSpriteFactory = new ZombieSpriteFactory(this.getBaseSpriteTemplate());
  }
  return this.zombieSpriteFactory;
};

Vorp.prototype.splashPortal = function(pos, exiting) {
  // TODO: remove this middleman
  this.vorpOut.splashPortal(pos, exiting);
};

Vorp.prototype.splashPlasma = function(x, y) {
  // TODO: remove this middleman
  this.vorpOut.splashPlasma(x, y);
};

Vorp.prototype.explodePlayer = function() {
  var pos = this.playerSprite.getPos(new Vec2d());
  this.vorpOut.explode(pos.x, pos.y);
  this.playerSprite.die();
  this.removeSprite(this.playerSprite.id);
  this.playerAssemblyTime = this.now() + Vorp.EXPLODED_PLAYER_REASSEMBLY_DELAY;
  this.playerSprite = null;
};

Vorp.prototype.explodeZombie = function(id) {
  var sprite = this.getSprite(id);
  var pos = sprite.getPos(new Vec2d());
  this.vorpOut.explode(pos.x, pos.y);
  sprite.die();
  this.removeSprite(id);
};

Vorp.prototype.createZombieAtXY = function(x, y) {
  var zombieSprite = this.getZombieSpriteFactory().createXY(x, y);
  this.addSprite(zombieSprite);
  zombieSprite.act();
};

Vorp.prototype.playerFullyZombified = function() {
  var playerPos = this.playerSprite.getPos(new Vec2d());
  this.createZombieAtXY(playerPos.x, playerPos.y);

  this.playerSprite.die();
  this.removeSprite(this.playerSprite.id);

  this.playerAssemblyTime = this.now() + Vorp.ZOMBIFIED_PLAYER_REASSEMBLY_DELAY;
};

Vorp.prototype.assemblePlayer = function() {
  this.playerSprite = this.playerAssembler.createPlayer();
  this.addSprite(this.playerSprite);
  this.vorpOut.assemblePlayerNoise(this.playerSprite.getPos(new Vec2d()));
};

Vorp.prototype.firePlasma = function(px, py, vx, vy) {
  this.splashPlasma(px, py);
  var rad = PlasmaSprite.RADIUS / 2;
  var plasmaSprite = new PlasmaSprite(
    this.getBaseSpriteTemplate()
        .makeMovable()
        .setGroup(Vorp.PLASMA_GROUP)
        .setPainter(new PlasmaPainter())
        .setPosXY(px, py)
        .setVelXY(vx, vy)
        .setRadXY(rad, rad)
        .setMass(0.1 / (rad * rad)));
  this.addSprite(plasmaSprite);
};

/**
 * Performs a rayscan, and sets rayscan.hitSpriteId to the sprite ID or null
 * if there wasn't any.
 * @param {RayScan} rayScan
 * @param {number} group
 * @return the hitSpriteId, or null if there wasn't any.
 */
Vorp.prototype.rayScan = function(rayScan, group) {
  this.phy.rayScan(rayScan, group);
  rayScan.hitSpriteId = rayScan.hitSledgeId
      ? this.phy.getSpriteIdBySledgeId(rayScan.hitSledgeId)
      : null;
  return rayScan.hitSpriteId;
};

Vorp.prototype.getSprite = function(id) {
  return this.phy.getSprite(id);
};


/**
 * Extent to which one object will pull another along perpendicular to the collision axis.
 * @type {Number}
 */
Vorp.GRIP = 0.5;

/**
 * How much things bounce off of each other along the collision axis.
 * Weird interpenetration stuff happens at less than 0.5.
 * @type {Number}
 */
Vorp.ELASTICITY = 0.6;

/**
 * Mutates sprites.
 * @param spriteId1
 * @param spriteId2
 * @param xTime
 * @param yTime
 * @param overlapping
 */
Vorp.prototype.onSpriteHit = function(spriteId1, spriteId2, xTime, yTime, overlapping) {
  var s1 = this.getSprite(spriteId1);
  var s2 = this.getSprite(spriteId2);

  if (overlapping) {
    this.wham.calcRepulsion(s1, s2, this.accelerationsOut);
  } else {
    this.wham.calcAcceleration(s1, s2, xTime, yTime,
        Vorp.GRIP, Vorp.ELASTICITY,
        this.accelerationsOut);
  }
  var a1 = this.accelerationsOut[0];
  var a2 = this.accelerationsOut[1];

  var handled = false;
  var pos = Vec2d.alloc();
  if (!handled && s1 instanceof PortalSprite && !(s2 instanceof PortalSprite)) {
    handled = s1.onSpriteHit(s2, a1, a2, xTime, yTime, overlapping);
  }
  if (!handled && s2 instanceof PortalSprite && !(s1 instanceof PortalSprite)) {
    handled = s2.onSpriteHit(s1, a2, a1, xTime, yTime, overlapping);
  }
  if (!handled) {
    var vol = 0.005 * (a1.magnitude() * s1.mass);
    if (vol > 0.01) {
      this.vorpOut.tap(s1.getPos(pos), vol);
    }
    var vol = 0.005 * (a2.magnitude() * s2.mass);
    if (vol > 0.01) {
      this.vorpOut.tap(s2.getPos(pos), vol);
    }
    s1.addVel(a1);
    s2.addVel(a2);
    s1.onSpriteHit(s2);
    s2.onSpriteHit(s1);
  }
  Vec2d.free(pos);
};


/**
 * One per Vorp instance. This is in charge of rendering and sound.
 * It manages the list of Painter objects, removing kaput ones, and visiting the rest to do rendering.
 * It also manages the list of Singer objects, removing kaput ones, and visiting the rest to adjust sounds.
 * @param {Renderer} renderer
 * @param {SoundFx} soundFx
 * @constructor
 */
function VorpOut(renderer, soundFx) {
  this.renderer = renderer;
  this.soundFx = soundFx;
  this.painters = [];
  this.singers = [];

  this.canvasSize = -1;
  this.editable = false;

  this.vec = new Vec2d();
}

VorpOut.prototype.setEditable = function(editable) {
  this.editable = editable;
};

VorpOut.prototype.r = function(x) {
  var f = 0.3;
  return x += x * f * (Math.random() - f/2);
};

VorpOut.prototype.setCanvasSizeLeftTop = function(size, left, top) {
  var canvas = this.renderer.canvas;
  canvas.width = size;
  canvas.height = size;
  canvas.style.left = left + 'px';
  canvas.style.top = top + 'px';
  this.canvasSize = size;
};

/**
 * @param {Painter} painter
 */
VorpOut.prototype.addPainter = function(painter) {
  this.painters.push(painter);
};

/**
 * @param {Singer} singer
 */
VorpOut.prototype.addSinger = function(singer) {
  this.singers.push(singer);
};

/**
 * Paints with the painters and sings with the singers, and cleans out the kaput ones.
 */
VorpOut.prototype.draw = function(now, cameraX, cameraY) {
  this.renderer.clear();
  if (!this.editable) {
    this.renderer.setZoom(Vorp.ZOOM * this.canvasSize / 600);
    this.renderer.setCenter(cameraX, cameraY);
    this.soundFx && this.soundFx.setCenter(cameraX, cameraY);
  }

  // Tell painters to advance. Might as well remove any that are kaput.
  // (The timing of isKaput() returning true isn't critical;
  // it doesn't have to be decided during advance().)
  for (var i = 0; i < this.painters.length; i++) {
    var painter = this.painters[i];
    if (painter.isKaput()) {
      var popped = this.painters.pop();
      if (i < this.painters.length) {
        this.painters[i] = popped;
        i--;
      } // else we're trying to remove the final one
    } else {
      painter.advance(now);
    }
  }

  this.drawWorld();

  if (!this.editable) {
    this.renderer.stats();
  }

  // Tell singers to advance. Remove any that are kaput.
  // (The timing of isKaput() returning true isn't critical;
  // it doesn't have to be decided during advance().)
  for (var i = 0; i < this.singers.length; i++) {
    var singer = this.singers[i];
    if (singer.isKaput()) {
      var popped = this.singers.pop();
      if (i < this.singers.length) {
        this.singers[i] = popped;
        i--;
      } // else we're trying to remove the final one
    } else {
      singer.advance(now);
    }
  }

  if (!this.editable) {
    this.singWorld();
  }

};

VorpOut.prototype.drawWorld = function() {
  this.renderer.transformStart();
  for (var i = 0; i < Vorp.LAYERS.length; i++) {
    this.drawLayer(Vorp.LAYERS[i]);
  }
  if (this.editable) {
    this.drawLayer(Vorp.LAYER_EDIT);
  }
  this.renderer.transformEnd();
};

VorpOut.prototype.drawLayer = function(layer) {
  for (var i = 0; i < this.painters.length; i++) {
    var painter = this.painters[i];
    painter.paint(this, layer);
  }
};

VorpOut.prototype.singWorld = function() {
  for (var i = 0; i < this.singers.length; i++) {
    this.singers[i].sing(this);
  }
};

VorpOut.prototype.setLineWidth = function(w) {
  this.renderer.context.lineWidth = w;
};

VorpOut.prototype.setStrokeStyle = function(style) {
  this.renderer.setStrokeStyle(style);
};

VorpOut.prototype.drawLineXYXY = function(x0, y0, x1, y1) {
  this.renderer.drawLineXYXY(x0, y0, x1, y1);
};

VorpOut.prototype.setFillStyle = function(style) {
  this.renderer.setFillStyle(style);
};

VorpOut.prototype.fillRectPosXYRadXY = function(x, y, rx, ry) {
  this.renderer.fillRectPosXYRadXY(x, y, rx, ry);
};

VorpOut.prototype.beginPath = function() {
  this.renderer.context.beginPath();
};

VorpOut.prototype.lineTo = function(x, y) {
  this.renderer.context.lineTo(x, y);
};

VorpOut.prototype.moveTo = function(x, y) {
  this.renderer.context.moveTo(x, y);
};

VorpOut.prototype.stroke = function() {
  this.renderer.context.stroke();
};

VorpOut.prototype.splashPortal = function(pos, exiting) {
  var painter = new PortalSplashPainter(exiting);
  painter.setPosition(pos.x, pos.y);
  this.addPainter(painter);
  var attack, decay, freq1, freq2;
  if (exiting) {
    attack = 0.2;
    decay = 0.001;
    freq1 = this.r(50);
    freq2 = this.r(2000);
  } else {
    attack = 0.001;
    decay = 0.2;
    freq1 = this.r(2000);
    freq2 = this.r(50);
  }
  this.soundFx && this.soundFx.sound(pos, 0.2, attack, decay, freq1, freq2, 'square');
};


VorpOut.prototype.splashPlasma = function(x, y) {
  var painter = new PlasmaSplashPainter();
  painter.setPosition(x, y);
  this.addPainter(painter);
};


VorpOut.prototype.explode = function(x, y) {
  var painter = new ExplosionPainter();
  painter.setPosition(x, y);
  this.addPainter(painter);

  this.vec.setXY(x, y);
  var decay = Math.random() * 0.3 + 0.3;
  for (var i = 0; i < 3; i++) {
    var attack = 0.001;
    var freq1 = (Math.random() * 200 + 100);
    var freq2 = 1;
    this.soundFx && this.soundFx.sound(this.vec, 0.3, attack, decay, freq1, freq2, 'square');
  }
};


VorpOut.prototype.tap = function(pos, vol) {
  this.soundFx && this.soundFx.sound(pos, vol, 0, 0.005, this.r(1000), this.r(2000), 'square');
  this.soundFx && this.soundFx.sound(pos, vol, 0, 0.01, this.r(2000), this.r(1000), 'sine');
};


VorpOut.prototype.assemblePlayerNoise = function(pos) {
  if (!this.soundFx) return;
  this.soundFx.sound(pos, 0.09,
      0.04, 0.04,
      50, 1000,
      'sine', 0);
  this.soundFx.sound(pos, 0.09,
      0.06, 0.06,
      100, 2000,
      'sine', 0.03);
  this.soundFx.sound(pos, 0.06,
      0.08, 0.08,
      200, 4000,
      'sine', 0.06);
  this.soundFx.sound(pos, 0.03,
      0.1, 0.1,
      400, 8000,
      'square', 0.09);
};

VorpOut.prototype.disconnect = function() {
  if (this.soundFx) {
    this.soundFx.disconnect();
  }
};

/**
 * Vorp-specific sprite template stuff
 * @constructor
 */
function VorpSpriteTemplate() {
  SpriteTemplate.call(this);
}
VorpSpriteTemplate.prototype = new SpriteTemplate();
VorpSpriteTemplate.prototype.constructor = VorpSpriteTemplate;

/**
 * @param {Vorp} vorp
 * @param {GameClock} gameClock
 * @param {SledgeInvalidator} sledgeInvalidator
 * @return {VorpSpriteTemplate}
 */
VorpSpriteTemplate.createBase = function(vorp, gameClock, sledgeInvalidator) {
  return new VorpSpriteTemplate()
      .setWorld(vorp)
      .setGameClock(gameClock)
      .setSledgeInvalidator(sledgeInvalidator);
};

VorpSpriteTemplate.prototype.makeIntangible = function() {
  return this.setGroup(Vorp.NO_HIT_GROUP)
      .setMass(Infinity)
      .setSledgeDuration(Infinity);
};

VorpSpriteTemplate.prototype.makeImmovable = function() {
  return this.setGroup(Vorp.WALL_GROUP)
      .setMass(Infinity)
      .setSledgeDuration(Infinity);
};

VorpSpriteTemplate.prototype.makeMovable = function() {
  return this.setGroup(Vorp.GENERAL_GROUP)
      .setSledgeDuration(1.01);
};


/**
 * @constructor
 * @extends {Wham}
 */
function VorpWham() {
  Wham.call(this);
  this.p1 = new Vec2d();
  this.p2 = new Vec2d();
  this.p1p2 = new Vec2d();
}
VorpWham.prototype = new Wham();
VorpWham.prototype.constructor = VorpWham;

VorpWham.prototype.calcRepulsion = function(s1, s2, accOut) {
  var p1 = s1.getPos(this.p1);
  var p2 = s2.getPos(this.p2);
  var p1p2 = this.p1p2.set(p2).subtract(p1);
  var lowMass = Math.min(s1.mass, s2.mass);
  var ACC = 1;
  var f = lowMass * ACC;
  var maxRx = Math.max(s1.rad.x, s2.rad.x);
  var maxRy = Math.max(s1.rad.y, s2.rad.y);
  if (maxRx > maxRy) {
    p1p2.x = 0;
  } else if (maxRx < maxRy) {
    p1p2.y = 0;
  }
  accOut[0].set(p1p2).scaleToLength(-f / s1.mass);
  accOut[1].set(p1p2).scaleToLength(f / s2.mass);
};
/**
 * @constructor
 * @extends {Painter}
 */
function BeamerPainter() {
  Painter.call(this, 1);
  this.kaput = false;
  this.beamEnd = new Vec2d();
}
BeamerPainter.prototype = new Painter(1);
BeamerPainter.prototype.constructor = BeamerPainter;

BeamerPainter.prototype.setBeamEndXY = function(x, y) {
  this.beamEnd.setXY(x, y);
};

BeamerPainter.prototype.advance = function(now) {
  this.now = now;
};

BeamerPainter.prototype.paint = function(vorpOut, layer) {
  var e = this.events.getFromHead(0);
  e.moveToTime(this.now);
  if (layer == Vorp.LAYER_SPARKS) {
    vorpOut.setLineWidth(Math.random() + 1.5);
    vorpOut.setStrokeStyle('rgb(200, 0, 0)');
    vorpOut.drawLineXYXY(e.px, e.py, this.beamEnd.x, this.beamEnd.y);
  } else if (layer == Vorp.LAYER_MASSES) {
    vorpOut.setFillStyle('rgb(128, 128, 128)');
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

BeamerPainter.prototype.isKaput = function() {
  // They can't kill The Rooster.
  return false;
};

/**
 * @constructor
 * @extends {Painter}
 */
function ButtonPainter() {
  Painter.call(this, 1);
  this.lastClickTime = -Infinity;
}

ButtonPainter.prototype = new Painter(1);
ButtonPainter.prototype.constructor = ButtonPainter;

ButtonPainter.prototype.debounceFraction = function(now) {
  return Math.max(this.lastClickTime + ButtonSprite.DEBOUNCE - now, 0) /
      ButtonSprite.DEBOUNCE;
};

ButtonPainter.prototype.setLastClickTime = function(t) {
  this.lastClickTime = t;
};

ButtonPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_MASSES) {
    var val = Math.min(255, Math.floor(255 - 100 + this.debounceFraction(this.now) * 200));
    vorpOut.setFillStyle('rgb(' + val + ', ' + val + ', ' + val + ')');
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

ButtonPainter.prototype.isKaput = function() {
  // I promise: I will never die.
  return false;
};

/**
 * Death-by-plasma explosion painter.
 * @constructor
 * @extends {Painter}
 */
function ExplosionPainter() {
  Painter.call(this, 1);
  this.kaput = false;
  this.sparks = this.createSparkList();
  
  this.sparked = false;
  this.sparkTemplate = ExplosionPainter.SPARK_ALLOC();
}

ExplosionPainter.prototype = new Painter();
ExplosionPainter.prototype.constructor = ExplosionPainter;

ExplosionPainter.sparkPos = new Vec2d();

///////////////////////////////////////
// sparklist implementation functions
///////////////////////////////////////

ExplosionPainter.SPARK_ALLOC = function() {
  return {
    startTime: 0,
    endTime: 0,
    pos: new Vec2d(),
    vel: new Vec2d()
  };
};

ExplosionPainter.SPARK_COPY = function(src, dest) {
  dest.startTime = src.startTime;
  dest.endTime = src.endTime;
  dest.pos.set(src.pos);
  dest.vel.set(src.vel);
};

ExplosionPainter.SPARK_ISKAPUT = function(spark, now) {
  return spark.endTime <= now;
};

ExplosionPainter.SPARK_ADVANCESPARK = function(spark, now) {
  spark.vel.scale(0.95);
  spark.pos.add(spark.vel);
};

ExplosionPainter.SPARK_PAINT = function(vorpOut, spark, now) {
  var timeFrac = (spark.endTime - now) / (spark.endTime - spark.startTime);
  var alpha = 0.25 + 0.75 * timeFrac;
  var size = Math.max(0.2, timeFrac) * Transformer.BOX_RADIUS;
  vorpOut.setFillStyle('rgba(255, 255, 255, ' + alpha + ')');
  vorpOut.fillRectPosXYRadXY(spark.pos.x, spark.pos.y, size, size);
};


////////////
// methods
////////////

ExplosionPainter.prototype.advance = function(now) {
  Painter.prototype.advance.call(this, now);
  this.sparks.advance(now);
};

ExplosionPainter.prototype.createSparkList = function() {
  var s = new SparkList();
  s.alloc = ExplosionPainter.SPARK_ALLOC;
  s.copy = ExplosionPainter.SPARK_COPY;
  s.isKaput = ExplosionPainter.SPARK_ISKAPUT;
  s.advanceSpark = ExplosionPainter.SPARK_ADVANCESPARK;
  s.paint = ExplosionPainter.SPARK_PAINT;
  return s;
};


ExplosionPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_SUPERSPARKS) {
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);

    // sparks
    if (!this.sparked) {
      this.createSparks(e.px, e.py, this.now);
      this.sparked = true;
    }
    this.sparks.paintAll(vorpOut, this.now);
  }
};

ExplosionPainter.prototype.createSparks = function(px, py, now) {
  // fast-moving short-lived sparks
  for (var a = 0; a < 2 * Math.PI; a += Math.random() * 2 * Math.PI / 10) {
    this.sparkTemplate.startTime = now;
    this.sparkTemplate.endTime = now + 10 + 10 * Math.random();
    this.sparkTemplate.pos.setXY(px, py);
    var speed = 10 + 4 * Math.random();
    this.sparkTemplate.vel.setXY(speed * Math.sin(a), speed * Math.cos(a));
    this.sparks.add(this.sparkTemplate);
  }
  // slow-moving longer-lived smoke-sparks
  for (var a = 0; a < 2 * Math.PI; a += 2 * Math.PI / 30 + 2 * Math.PI / 30 * Math.random()) {
    this.sparkTemplate.startTime = now;
    this.sparkTemplate.endTime = now + 30 + 45 * Math.random();
    this.sparkTemplate.pos.setXY(px, py);
    var speed = 3;
    this.sparkTemplate.vel.setXY(speed * Math.sin(a), speed * Math.cos(a));
    this.sparks.add(this.sparkTemplate);
  }
};

ExplosionPainter.prototype.isKaput = function() {
  return this.sparked && this.sparks.isEmpty();
};

/**
 * @constructor
 * @extends {Painter}
 */
function GripPainter() {
  Painter.call(this, 1);
  this.kaput = false;
  this.tractorBeamPainter = new TractorBeamPainter();
}
GripPainter.prototype = new Painter(1);
GripPainter.prototype.constructor = GripPainter;

GripPainter.prototype.addRayScan = function(rayScan) {
  if (Math.random() > 0.3) {
    return;
  }
  this.tractorBeamPainter.addRayScan(rayScan);
};

GripPainter.prototype.clearRayScans = function() {
  this.tractorBeamPainter.clearRayScans();
};

GripPainter.prototype.setHolderPos = function(pos) {
  this.tractorBeamPainter.setHolderPos(pos);
};

GripPainter.prototype.setHeldPos = function(pos) {
  this.tractorBeamPainter.setHeldPos(pos);
};

GripPainter.prototype.setHolding = function(str) {
  this.isHolding = true;
  this.tractorBeamPainter.setHolding(str);
};

GripPainter.prototype.setReleasing = function(kick) {
  this.isHolding = false;
  this.tractorBeamPainter.setReleasing(0);
};

GripPainter.prototype.advance = function(now) {
  this.now = now;
  this.tractorBeamPainter.advance(now);
};

GripPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_SPARKS) {
    this.tractorBeamPainter.paint(vorpOut, layer);
  } else if (layer == Vorp.LAYER_MASSES) {
    vorpOut.setFillStyle(this.isHolding ? '#9f9' : '#7a7');
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

GripPainter.prototype.isKaput = function() {
  // They can't kill The Rooster.
  return false;
};

/**
 * @constructor
 * @extends {Painter}
 */
function PlasmaPainter() {
  Painter.call(this, 10);
  this.dying = false;
  this.kaput = false;
}
PlasmaPainter.prototype = new Painter(null);
PlasmaPainter.prototype.constructor = PlasmaPainter;

PlasmaPainter.TRAIL_TIMESPAN = 3;

PlasmaPainter.prototype.advance = function(now) {
  this.now = now;

  // Remove obsolete events
  while(this.events.size()) {
    if (this.events.getFromTail(0).time + PlasmaPainter.TRAIL_TIMESPAN < now) {
      PaintEvent.free(this.events.dequeue());
    } else {
      break;
    }
  }
};

PlasmaPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_SPARKS) {
    vorpOut.beginPath();
    for (var s = 0; s < 2; s++) {
      var prevEvent = null;
      if (s) {
        vorpOut.setStrokeStyle('rgba(255, 0, 255, 0.4)');
        vorpOut.setLineWidth(PlasmaSprite.RADIUS * 4);
      } else {
        vorpOut.setStrokeStyle('rgba(255, 0, 255, 0.8)');
        vorpOut.setLineWidth(PlasmaSprite.RADIUS);
      }
      for (var i = 0, n = this.events.size(); i < n; i++) {
        var event = this.events.getFromTail(i);
        if (prevEvent) {
          prevEvent.moveToTime(event.startTime);
          vorpOut.lineTo(prevEvent.px, prevEvent.py);
        }
        event.moveToTime(event.startTime);
        vorpOut.moveTo(event.px, event.py);
        prevEvent = event;
      }
      vorpOut.stroke();
    }
  }
};

PlasmaPainter.prototype.isKaput = function() {
  return this.dying && this.events.isEmpty();
};

PlasmaPainter.prototype.die = function() {
  this.dying = true;
};

/**
 * Splash when plasma hits non-exploding thing, like wall or block.
 * @constructor
 * @extends {Painter}
 */
function PlasmaSplashPainter() {
  Painter.call(this, 1);
  this.kaput = false;
  this.sparks = this.createSparkList();
  
  this.sparked = false;
  this.sparkTemplate = PlasmaSplashPainter.SPARK_ALLOC();
}

PlasmaSplashPainter.prototype = new Painter();
PlasmaSplashPainter.prototype.constructor = PlasmaSplashPainter;

///////////////////////////////////////
// sparklist implementation functions
///////////////////////////////////////

PlasmaSplashPainter.SPARK_ALLOC = function() {
  return {
    startTime: 0,
    endTime: 0,
    pos: new Vec2d(),
    vel: new Vec2d()
  };
};

PlasmaSplashPainter.SPARK_COPY = function(src, dest) {
  dest.startTime = src.startTime;
  dest.endTime = src.endTime;
  dest.pos.set(src.pos);
  dest.vel.set(src.vel);
};

PlasmaSplashPainter.SPARK_ISKAPUT = function(spark, now) {
  return spark.endTime <= now;
};

PlasmaSplashPainter.SPARK_ADVANCESPARK = function(spark, now) {
  spark.vel.scale(0.95);
  spark.pos.add(spark.vel);
};

PlasmaSplashPainter.SPARK_PAINT = function(vorpOut, spark, now) {
  var timeFrac = 1 - (spark.endTime - now) / (spark.endTime - spark.startTime);
  var alpha = 0.5;
  var size = (1 - timeFrac/2) * PlasmaSprite.RADIUS * 2;
  vorpOut.setFillStyle('rgba(255, 0, 255, ' + alpha + ')');
  vorpOut.fillRectPosXYRadXY(spark.pos.x, spark.pos.y, size, size);
};


////////////
// methods
////////////

PlasmaSplashPainter.prototype.advance = function(now) {
  Painter.prototype.advance.call(this, now);
  this.sparks.advance(now);
};

PlasmaSplashPainter.prototype.createSparkList = function() {
  var s = new SparkList();
  s.alloc = PlasmaSplashPainter.SPARK_ALLOC;
  s.copy = PlasmaSplashPainter.SPARK_COPY;
  s.isKaput = PlasmaSplashPainter.SPARK_ISKAPUT;
  s.advanceSpark = PlasmaSplashPainter.SPARK_ADVANCESPARK;
  s.paint = PlasmaSplashPainter.SPARK_PAINT;
  return s;
};


PlasmaSplashPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_SPARKS) {
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);

    // sparks
    if (!this.sparked) {
      this.createSparks(e.px, e.py, this.now);
      this.sparked = true;
    }
    this.sparks.paintAll(vorpOut, this.now);
  }
};

PlasmaSplashPainter.prototype.createSparks = function(px, py, now) {
  // fast-moving short-lived sparks
  var n = 3 + Math.floor(Math.random() * 3);
  var a = Math.random() * 2 * Math.PI;
  for (var i = 0; i < n; i++) {
    a += Math.PI * 2 / n;
    this.sparkTemplate.startTime = now;
    this.sparkTemplate.endTime = now + 7 + 5 * Math.random();
    this.sparkTemplate.pos.setXY(px, py);
    var speed = 2 + 1 * Math.random();
    this.sparkTemplate.vel.setXY(speed, 0).rot(a);
    this.sparks.add(this.sparkTemplate);
  }
};

PlasmaSplashPainter.prototype.isKaput = function() {
  return this.sparked && this.sparks.isEmpty();
};

/**
 * @constructor
 * @extends {Painter}
 */
function PlayerAssemblerPainter() {
  Painter.call(this, 1);
  this.kaput = false;
  this.sparks = this.createSparkList();

  this.sparkTemplate = PlayerAssemblerPainter.SPARK_ALLOC();

  this.glowStartTime = -Infinity;
}

PlayerAssemblerPainter.prototype = new Painter();
PlayerAssemblerPainter.prototype.constructor = PlayerAssemblerPainter;

///////////////////////////////////////
// sparklist implementation functions
///////////////////////////////////////

PlayerAssemblerPainter.SPARK_ALLOC = function() {
  return {
    startTime: 0,
    endTime: 0,
    pos: new Vec2d(),
    vel: new Vec2d(),
    rot: 0
  };
};

PlayerAssemblerPainter.SPARK_COPY = function(src, dest) {
  dest.startTime = src.startTime;
  dest.endTime = src.endTime;
  dest.pos.set(src.pos);
  dest.vel.set(src.vel);
  dest.rot = src.rot;
};

PlayerAssemblerPainter.SPARK_ISKAPUT = function(spark, now) {
  return spark.endTime <= now;
};

PlayerAssemblerPainter.SPARK_ADVANCESPARK = function(spark, now) {
  spark.vel.scale(0.89);
  spark.vel.rot(spark.rot);
  spark.pos.add(spark.vel);
};

PlayerAssemblerPainter.SPARK_PAINT = function(vorpOut, spark, now) {
  var timeFrac = 1 - (spark.endTime - now) / (spark.endTime - spark.startTime);
  var alpha = 1 - 0.8 * timeFrac;
  var size = (1 - (timeFrac * 0.9)) * Transformer.BOX_RADIUS;
//  var red = Math.floor(128 + 127 * Math.cos(1.3 * timeFrac * 2 * Math.PI));
//  var green = Math.floor(128 - 127 * Math.cos(timeFrac * 2 * Math.PI));
//  var blue = Math.floor(255 * timeFrac) % 256;
//  vorpOut.setFillStyle('rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')');
  var lite = Math.floor(255 - 128 * timeFrac);
  vorpOut.setFillStyle('rgba(' + lite + ',' + lite + ',' + lite + ',' + alpha + ')');
  vorpOut.fillRectPosXYRadXY(spark.pos.x, spark.pos.y, size, size);
};


////////////
// methods
////////////

PlayerAssemblerPainter.prototype.glowFraction = function(now) {
  return Math.min(1, (now - this.glowStartTime) / 35) ;
};

PlayerAssemblerPainter.prototype.advance = function(now) {
  Painter.prototype.advance.call(this, now);
  this.sparks.advance(now);
};

PlayerAssemblerPainter.prototype.createSparkList = function() {
  var s = new SparkList();
  s.alloc = PlayerAssemblerPainter.SPARK_ALLOC;
  s.copy = PlayerAssemblerPainter.SPARK_COPY;
  s.isKaput = PlayerAssemblerPainter.SPARK_ISKAPUT;
  s.advanceSpark = PlayerAssemblerPainter.SPARK_ADVANCESPARK;
  s.paint = PlayerAssemblerPainter.SPARK_PAINT;
  return s;
};

PlayerAssemblerPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_MASSES) {
    var lite = Math.floor(255 -  128 * this.glowFraction(this.now));
    vorpOut.setFillStyle('rgb(' + lite + ', ' + lite + ', ' + lite + ')');
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);

  } else if (layer == Vorp.LAYER_SUPERSPARKS) {
    this.sparks.paintAll(vorpOut, this.now);
  }
};

PlayerAssemblerPainter.prototype.createSparks = function(x0, y0, x1, y1, now) {
  this.glowStartTime = now;
  for (var i = -1.2; i <= 1.21; i += 0.2) {
    this.sparkTemplate.startTime = now;
    this.sparkTemplate.endTime = now + 35 + Math.random() * 2;
    this.sparkTemplate.pos.setXY(x1, y1);
    var speed = 6;
    var a = Math.PI * i;
    this.sparkTemplate.vel.setXY(x1 - x0, y1 - y0).scaleToLength(speed).rot(Math.PI / 2 * i);
    this.sparkTemplate.rot = 0;
    this.sparks.add(this.sparkTemplate);
  }
};

PlayerAssemblerPainter.prototype.isKaput = function() {
  return this.sparked && this.sparks.isEmpty();
};

/**
 * @constructor
 * @extends {Painter}
 */
function PlayerPainter() {
  FLAGS && FLAGS.init('playerTrail', false);
  Painter.call(this, 600);
  this.dying = false;
  this.kaput = false;
  this.tractorBeamPainter = new TractorBeamPainter();
  this.zombieness = 0;
  this.color = [0, 0, 0];
}
PlayerPainter.prototype = new Painter(1);
PlayerPainter.prototype.constructor = PlayerPainter;

PlayerPainter.RGB = [255, 68, 221];

PlayerPainter.TRAIL_TIMESPAN = 200;

PlayerPainter.prototype.addRayScan = function(rayScan) {
  if (Math.random() > 0.2) {
    return;
  }
  this.tractorBeamPainter.addRayScan(rayScan);
};

PlayerPainter.prototype.clearRayScans = function() {
  this.tractorBeamPainter.clearRayScans();
};

PlayerPainter.prototype.setHolderPos = function(pos) {
  this.tractorBeamPainter.setHolderPos(pos);
};

PlayerPainter.prototype.setHeldPos = function(pos) {
  this.tractorBeamPainter.setHeldPos(pos);
};

PlayerPainter.prototype.setHolding = function(str) {
  this.tractorBeamPainter.setHolding(str);
};

PlayerPainter.prototype.setReleasing = function(kick) {
  this.tractorBeamPainter.setReleasing(kick);
};

PlayerPainter.prototype.advance = function(now) {
  this.now = now;
  this.tractorBeamPainter.advance(now);
  
  // Remove obsolete events
  while(this.events.size()) {
    if (this.events.getFromTail(0).time + PlayerPainter.TRAIL_TIMESPAN < now) {
      PaintEvent.free(this.events.dequeue());
    } else {
      break;
    }
  }
  //this.clearPoly();
};

PlayerPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_SPARKS) {
    this.tractorBeamPainter.paint(vorpOut, layer);
    if ((FLAGS && FLAGS.get('playerTrail'))) {
      var prevEvent = null;
      vorpOut.beginPath();
      vorpOut.setStrokeStyle('rgba(255, 68, 221, 0.5)');
      vorpOut.setLineWidth(10);
      for (var i = 0, n = this.events.size(); i < n; i++) {
        var event = this.events.getFromTail(i);
        if (prevEvent) {
          prevEvent.moveToTime(event.startTime);
          vorpOut.lineTo(prevEvent.px, prevEvent.py);
        }
        event.moveToTime(event.startTime);
        vorpOut.moveTo(event.px, event.py);
        prevEvent = event;
      }
      vorpOut.stroke();
    }
  } else if (layer == Vorp.LAYER_MASSES && !this.dying && !this.events.isEmpty()) {
    var color;
    if (this.zombieness) {
      color = this.color;
      var z = this.zombieness;
      for (var i = 0; i < 3; i++) {
        this.color[i] = Math.round((1 - z) * PlayerPainter.RGB[i] + z * ZombiePainter.RGB[i]);
      }
    } else {
      color = PlayerPainter.RGB;
    }
    vorpOut.setFillStyle('rgb(' + color.join(',') + ')');
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

PlayerPainter.prototype.isKaput = function() {
  // They *can* kill The Rooster.  Just not for more than a second.
  return this.dying && this.events.isEmpty() && this.tractorBeamPainter.isEmpty();
};

PlayerPainter.prototype.die = function() {
  this.dying = true;
};

PlayerPainter.prototype.setZombieness = function(zombieness) {
  this.zombieness = zombieness;
};
/**
 * @constructor
 * @extends {Painter}
 */
function PortalPainter() {
  Painter.call(this, 1);
  this.kaput = false;

  this.twinPos = new Vec2d();
  this.towardsTwinPos = new Vec2d();
}

PortalPainter.prototype = new Painter();
PortalPainter.prototype.constructor = PortalPainter;

PortalPainter.PERSPECTIVE = 0.8;

PortalPainter.prototype.setTwinPos = function(twinPos) {
  this.twinPos.set(twinPos);
};

PortalPainter.prototype.advance = function(now) {
  Painter.prototype.advance.call(this, now);
};

PortalPainter.prototype.paint = function(vorpOut, layer) {
  var e = this.events.getFromHead(0);
  e.moveToTime(this.now);
  vorpOut.setLineWidth(6);
  if (layer == Vorp.LAYER_MASSES) {
    vorpOut.setFillStyle('rgb(0, 223, 255)');
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);

  } else if (layer == Vorp.LAYER_SPARKS) {
    var rad = e.rx;
    var radSum = 0;
    var t = this.towardsTwinPos.set(this.twinPos).addXY(-e.px, -e.py);
    for (var i = 1, n = 4; i < n; i++) {
      rad *= PortalPainter.PERSPECTIVE;
      radSum += rad;
      t.scaleToLength(radSum);
      vorpOut.setFillStyle('rgba(0, 223, 255, ' +  0.6 * (n - i) / n + ')');
      vorpOut.fillRectPosXYRadXY(e.px + t.x , e.py + t.y, rad , rad);
    }
  }
};

PortalPainter.prototype.isKaput = function() {
  return false;
};

/**
 * Splash when something teleports.
 * @constructor
 * @extends {Painter}
 */
function PortalSplashPainter(exiting) {
  Painter.call(this, 1);
  this.exiting = exiting;
  this.kaput = false;
  this.sparks = this.createSparkList();
  
  this.sparked = false;
  this.sparkTemplate = PortalSplashPainter.SPARK_ALLOC();
}

PortalSplashPainter.prototype = new Painter();
PortalSplashPainter.prototype.constructor = PortalSplashPainter;

//PortalSplashPainter.sparkPos = new Vec2d();

///////////////////////////////////////
// sparklist implementation functions
///////////////////////////////////////

PortalSplashPainter.SPARK_ALLOC = function() {
  return {
    startTime: 0,
    endTime: 0,
    pos: new Vec2d(),
    vel: new Vec2d()
  };
};

PortalSplashPainter.SPARK_COPY = function(src, dest) {
  dest.startTime = src.startTime;
  dest.endTime = src.endTime;
  dest.pos.set(src.pos);
  dest.vel.set(src.vel);
};

PortalSplashPainter.SPARK_ISKAPUT = function(spark, now) {
  return spark.endTime <= now;
};

PortalSplashPainter.SPARK_ADVANCESPARK = function(spark, now) {
  spark.pos.add(spark.vel);
};

PortalSplashPainter.SPARK_PAINT = function(vorpOut, spark, now) {
  var timeFrac = 1 - (spark.endTime - now) / (spark.endTime - spark.startTime);
  var alpha = 1 - timeFrac * 0.9;
  var size = 6 - timeFrac * 2;
  vorpOut.setFillStyle('rgba(0, 223, 255, ' + alpha + ')');
  vorpOut.fillRectPosXYRadXY(spark.pos.x, spark.pos.y, size, size);
};


////////////
// methods
////////////

PortalSplashPainter.prototype.advance = function(now) {
  Painter.prototype.advance.call(this, now);
  this.sparks.advance(now);
};

PortalSplashPainter.prototype.createSparkList = function() {
  var s = new SparkList();
  s.alloc = PortalSplashPainter.SPARK_ALLOC;
  s.copy = PortalSplashPainter.SPARK_COPY;
  s.isKaput = PortalSplashPainter.SPARK_ISKAPUT;
  s.advanceSpark = PortalSplashPainter.SPARK_ADVANCESPARK;
  s.paint = PortalSplashPainter.SPARK_PAINT;
  return s;
};


PortalSplashPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_SPARKS) {
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);

    // sparks
    if (!this.sparked) {
      this.createSparks(e.px, e.py, this.now);
      this.sparked = true;
    }
    this.sparks.paintAll(vorpOut, this.now);
  }
};

PortalSplashPainter.prototype.createSparks = function(px, py, now) {
  // fast-moving short-lived sparks
  var n = 6 + Math.floor(Math.random() * 3);
  var a = Math.random() * 2 * Math.PI;
  var duration = 20;
  var size = Transformer.BOX_RADIUS * 2;
  for (var i = 0; i < n; i++) {
    a += Math.PI * 2 / n;
    this.sparkTemplate.startTime = now;
    this.sparkTemplate.endTime = now + duration;
    var speed = 1.2 * size / duration;
    if (this.exiting) {
      this.sparkTemplate.pos.setXY(px, py);
    } else {
      this.sparkTemplate.pos.setXY(-size, 0).rot(a).addXY(px, py);
    }
    this.sparkTemplate.vel.setXY(speed, 0).rot(a);
    this.sparks.add(this.sparkTemplate);
  }
};

PortalSplashPainter.prototype.isKaput = function() {
  return this.sparked && this.sparks.isEmpty();
};

/**
 * Basic painter for colored rectangles.
 * @param {string} color
 * @constructor
 * @extends {Painter}
 */
function RectPainter(color) {
  Painter.call(this, 1);
  this.color = color;
  this.kaput = false;
}

RectPainter.prototype = new Painter();
RectPainter.prototype.constructor = RectPainter;

/**
 * @param {string} color
 */
RectPainter.prototype.setColor = function(color) {
  this.color = color;
};

RectPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_MASSES) {
    vorpOut.setFillStyle(this.color);
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

/**
 * @param {boolean} kaput
 */
RectPainter.prototype.setKaput = function(kaput) {
  this.kaput = kaput;
};

RectPainter.prototype.isKaput = function() {
  return this.kaput;
};

/**
 * @constructor
 */
function SparkList() {
  this.now = -1;
  this.sparks = [];
  this.size = 0;
  this.lastAdvanceTime = -1;
}

//////////////
// Abstract
//////////////

/**
 * @return a new Spark instance
 */
SparkList.prototype.alloc = function() {
  throw Error('Implement SparkList.alloc()');
};

/**
 * Copy the fields from src to dest, without any allocation
 */
SparkList.prototype.copy = function(src, dest) {
  throw Error('Implement SparkList.copy(src, dest)');
};

/**
 * @return {boolean} true if the spark will never be painted again,
 * and is ready to be recycled
 */
SparkList.prototype.isKaput = function(spark, now) {
  throw Error('Implement SparkList.isKaput(spark, now)');
};

/**
 * Override if the sparks have some behavior.
 */
SparkList.prototype.advanceSpark = function(spark, now) {
};

/**
 * Render the spark.
 */
SparkList.prototype.paint = function(vorpOut, spark, now) {
  throw Error('Implement paint(vorpOut, spark, now)');
};


////////////
// Public
////////////

/**
 * Adds a single spark.
 */
SparkList.prototype.add = function(src) {
  if (this.size >= this.sparks.length) {
    this.sparks[this.size] = this.alloc();
  }
  var dest = this.sparks[this.size];
  this.copy(src, dest);
  this.size++;
};

/**
 * Clears out the kaput sparks, and calls advanceSpark() on the rest
 */
SparkList.prototype.advance = function(now) {
  if (now == this.lastAdvanceTime) return;
  for (var i = 0; i < this.size; i++) {
    if (this.isKaput(this.sparks[i], now)) {
      if (i < this.size - 1) {
        this.copy(this.sparks[this.size - 1], this.sparks[i]);
      }
      this.size--;
      i--;
    }
  }
  for (var i = 0; i < this.size; i++) {
    this.advanceSpark(this.sparks[i], now);
  }
  this.lastAdvanceTime = now;
};

/**
 * Calls paint() for all the sparks.
 */
SparkList.prototype.paintAll = function(vorpOut, now) {
  for (var i = 0; i < this.size; i++) {
    this.paint(vorpOut, this.sparks[i], now);
  }
};

SparkList.prototype.isEmpty = function() {
  return this.size == 0;
};
/**
 * @constructor
 * @extends {Painter}
 */
function TimerPainter() {
  Painter.call(this, 1);
}
TimerPainter.prototype = new Painter(1);
TimerPainter.prototype.constructor = TimerPainter;

TimerPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_EDIT) {
  }
};

TimerPainter.prototype.isKaput = function() {
  // I promise: I will never die.
  return false;
};

/**
 * @constructor
 * @extends {Painter}
 */
function TractorBeamPainter() {
  Painter.call(this, 1); // doesn't really track events, though.
  //FLAGS && FLAGS.init('tractorSparksFromSource', false);
  //FLAGS && FLAGS.init('tractorSparksWhileHolding', false);
  FLAGS && FLAGS.init('tractorSparksWhileSeeking', true);
  this.kaput = false;

  this.sparks = new TractorBeamSparkList();
  this.sparkTemplate = this.sparks.alloc();

  this.holderPos = new Vec2d();
  this.heldPos = new Vec2d();
  this.holdStrength = 0;  
  this.kickStrength = 0;
  this.state = TractorBeamPainter.State.EMPTY;
  
  this.workVec = new Vec2d();
}
TractorBeamPainter.prototype = new Painter(1);
TractorBeamPainter.prototype.constructor = TractorBeamPainter;

/**
 * @enum {number}
 */
TractorBeamPainter.State = {
  EMPTY: 0,
  HOLDING: 1,
  RELEASING: 2
};

TractorBeamPainter.SPARK_RAD = 6;

TractorBeamPainter.prototype.addRayScan = function(rayScan) {
  if (FLAGS && !FLAGS.get('tractorSparksWhileSeeking')) return;
  if (Math.random() < 0.4) return;
  var temp = this.sparkTemplate;
  var coef = Math.random() * 0.85;
  coef = 1 - (coef * coef * coef);
  temp.pos.setXY(
      rayScan.x0 + (rayScan.x1 - rayScan.x0) * (rayScan.time || 1) * coef,
      rayScan.y0 + (rayScan.y1 - rayScan.y0) * (rayScan.time || 1) * coef);
  temp.vel.setXY(0, 0);
  temp.rad = TractorBeamPainter.SPARK_RAD;// + Math.random() * 2;
  temp.endTime = this.now + 8 + 10 * Math.random();
  this.sparks.add(temp);
};

TractorBeamPainter.prototype.clearRayScans = function() {
  // no-op
};

TractorBeamPainter.prototype.setHolderPos = function(pos) {
  this.holderPos.set(pos);
};

TractorBeamPainter.prototype.setHeldPos = function(pos) {
  this.heldPos.set(pos);
};

TractorBeamPainter.prototype.setHolding = function(str) {
  this.holdStrength = str;
  this.state = TractorBeamPainter.State.HOLDING;
  this.sparks.heldPos = this.heldPos;
};

TractorBeamPainter.prototype.setReleasing = function(kick) {
  this.kickStrength = kick;
  this.state = TractorBeamPainter.State.RELEASING;
  this.sparks.heldPos = null;
};

TractorBeamPainter.prototype.advance = function(now) {
  this.now = now;
  if (this.now == this.lastAdvanceTime) return;
  if (this.state == TractorBeamPainter.State.RELEASING) {
    this.state = TractorBeamPainter.State.EMPTY;
    var temp = this.sparkTemplate;
    //if (!this.kickStrength) return;
    var baseVel = Vec2d.alloc();
    baseVel.set(this.heldPos).subtract(this.holderPos).scaleToLength(1).rot90Right();
    for (var i = 0; i <= 1; i += 0.05 + Math.random() * 0.05) {
      temp.pos.set(this.heldPos).subtract(this.holderPos).scale(i).add(this.holderPos);
      //temp.vel.setXY(Math.random() - 0.5, Math.random() - 0.5);
      temp.vel.set(baseVel);
      temp.vel.scaleToLength((this.kickStrength/10) * (Math.random() > 0.5 ? 1 : -1));
      temp.rad = TractorBeamPainter.SPARK_RAD;
      temp.endTime = this.now + (Math.random() * (5 + this.kickStrength/3 + this.holdStrength/10));// * (1 - Math.abs(0.5 - i));
      this.sparks.add(temp);
    }
    this.lastAdvanceTime = this.now;
  }
  this.sparks.advance(now);
};

TractorBeamPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_SPARKS) {
    vorpOut.setFillStyle('rgba(50, 200, 50, 0.6)');
    this.sparks.paintAll(vorpOut, this.now);
    if (this.state == TractorBeamPainter.State.HOLDING) {
      vorpOut.setStrokeStyle("rgba(50, 200, 50, " + (Math.random() * 0.2 + 0.6) + ")");
      vorpOut.setLineWidth(6 + this.holdStrength * 0.9);
      vorpOut.beginPath();
      vorpOut.moveTo(this.holderPos.x, this.holderPos.y);
      vorpOut.lineTo(this.heldPos.x, this.heldPos.y);
      vorpOut.stroke();
    }
  }
};

TractorBeamPainter.prototype.isEmpty = function() {
  return this.sparks.isEmpty();
};

/**
 * @constructor
 * @extends {SparkList}
 */
function TractorBeamSparkList() {
  SparkList.call(this);
  this.heldPos = null;
  FLAGS && FLAGS.init('tractorSparks', true);
}
TractorBeamSparkList.prototype = new SparkList();
TractorBeamSparkList.prototype.constructor = TractorBeamSparkList;

TractorBeamSparkList.FRICTION = 0.05;
TractorBeamSparkList.RAND_ACCEL = 1;
  
TractorBeamSparkList.prototype.alloc = function() {
  return {
    pos: new Vec2d(),
    vel: new Vec2d(),
    rad: 0,
    endTime: 0
  };
};

/**
 * Adds a single spark.
 */
TractorBeamSparkList.prototype.add = function(src) {
  if (FLAGS && !FLAGS.get('tractorSparks')) return;
  SparkList.prototype.add.call(this, src);
};

TractorBeamSparkList.prototype.copy = function(src, dest) {
  dest.pos.set(src.pos);
  dest.vel.set(src.vel);
  dest.rad = src.rad;
  dest.endTime = src.endTime;
};

TractorBeamSparkList.prototype.isKaput = function(spark, now) {
  return spark.endTime <= now;
};

TractorBeamSparkList.prototype.advanceSpark = function(spark, now) {
  spark.vel.scale(1 - TractorBeamSparkList.FRICTION);
  var vx = spark.vel.x; 
  var vy = spark.vel.y; 
  spark.vel.x = vx + TractorBeamSparkList.RAND_ACCEL * (Math.random() - 0.5);
  spark.vel.y = vy + TractorBeamSparkList.RAND_ACCEL * (Math.random() - 0.5);

  spark.pos.add(spark.vel);
};

TractorBeamSparkList.prototype.paint = function(vorpOut, spark, now) {
  vorpOut.setFillStyle('rgba(50, 255, 50, ' + (Math.random() * 0.2 + 0.4) + ')');
  vorpOut.fillRectPosXYRadXY(spark.pos.x, spark.pos.y, spark.rad, spark.rad);
};

/**
 * @constructor
 * @extends {Painter}
 */
function TurretPainter() {
  Painter.call(this, 1);
  this.lastFireTime = -Infinity;
}

TurretPainter.prototype = new Painter(1);
TurretPainter.prototype.constructor = TurretPainter;

TurretPainter.prototype.glowFraction = function(now) {
  return Math.min(1, (now - this.lastFireTime) / (1.5 * TurretSprite.COOLDOWN)) ;
};

TurretPainter.prototype.setLastFireTime = function(t) {
  this.lastFireTime = t;
};

TurretPainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_MASSES) {
    var lite = Math.floor(255 -  128 * this.glowFraction(this.now));
    vorpOut.setFillStyle('rgb(' + lite + ', ' + lite + ', ' + lite + ')');
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

TurretPainter.prototype.isKaput = function() {
  // I promise: I will never die.
  return false;
};

/**
 * @constructor
 * @extends {Painter}
 */
function ZapperPainter(active) {
  Painter.call(this, 1);
  this.active = active;
}

ZapperPainter.prototype = new Painter(1);
ZapperPainter.prototype.constructor = ZapperPainter;

ZapperPainter.prototype.setActive = function(active) {
  this.active = active;
};

ZapperPainter.prototype.paint = function(vorpOut, layer) {
  if (!this.active) return;
  if (layer == Vorp.LAYER_SUPERSPARKS) {
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.setFillStyle('rgba(' +
        (Math.floor(Math.random() * 55) + 150) + ',' +
        0 + ',' +
        (Math.floor(Math.random() * 55) + 170) + ',' +
        (Math.random() * 0.15 + 0.6) +
        ')');
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

ZapperPainter.prototype.isKaput = function() {
  return !this.active;
};

/**
 * @constructor
 * @extends {Painter}
 */
function ZombiePainter() {
  Painter.call(this, 1);
  this.dying = false;
}
ZombiePainter.prototype = new Painter();
ZombiePainter.prototype.constructor = ZombiePainter;

ZombiePainter.RGB = [100, 240, 100];
ZombiePainter.COLOR = 'rgb(' + ZombiePainter.RGB.join(',') + ')';

ZombiePainter.prototype.paint = function(vorpOut, layer) {
  if (layer == Vorp.LAYER_MASSES && !this.events.isEmpty()) {
    vorpOut.setFillStyle(ZombiePainter.COLOR);
    var e = this.events.getFromHead(0);
    e.moveToTime(this.now);
    vorpOut.fillRectPosXYRadXY(e.px, e.py, e.rx, e.ry);
  }
};

ZombiePainter.prototype.isKaput = function() {
  return this.dying;
};

ZombiePainter.prototype.die = function() {
  this.dying = true;
};

/**
 * @constructor
 * @extends {Singer}
 */
function PlayerSinger() {
  Singer.call(this);
  this.dieTime = Infinity;
  this.dying = false;
  this.now = 0;
  this.thrustFraction = 0;
  this.seekFraction = 0;
  this.holdFraction = 0;
  this.speed = 0;
  this.kick = 0;

  // audio nodes
  this.thrustWub = null;
  this.thrustGain = null;

  this.tractorSeekWub = null;
  this.tractorHoldWub = null;
  this.tractorGain = null;

  this.masterGain = null;
  this.panner = null;
}
PlayerSinger.prototype = new Singer();
PlayerSinger.prototype.constructor = PlayerSinger;

PlayerSinger.DEATH_DURATION = 30;

PlayerSinger.prototype.advance = function(now) {
  this.now = now;
};

PlayerSinger.prototype.sing = function(vorpOut, x, y) {
  var sfx = vorpOut.soundFx;
  if (!sfx || !sfx.ctx) return;
  if (!this.masterGain) {
    this.initNodes(sfx);
  }
  if (!this.dying) {
    this.panner.setPosition(this.pos.x, this.pos.y, 150);

    // movement noises
    var s = this.speed / 30;
    var t = this.thrustFraction;
    if (t) t = 0.3 + this.thrustFraction * 0.7;
    var thrustVal = s * 0.7 + t * 0.3;
    if (thrustVal < 0.01) thrustVal = 0;
    this.thrustWub.setValue(thrustVal);
    this.thrustGain.gain.value = thrustVal ? 1 : 0;

    // tractor noises
    this.tractorSeekWub.setValue(this.seekFraction);
    this.tractorHoldWub.setValue(Math.max(0, this.holdFraction - 0.15));
    if (this.kick) {
      var pitch = Math.random() * 20 + 1500 - 100 * this.kick;
      var length = 0.07 + 0.12 * this.kick;
      var voices = 2;
      for (var i = 0; i < voices; i++) {
        var p = pitch / Math.pow(2, i);
        sfx.sound(this.pos,
            0.2 * (0.3 + 0.3 * this.kick) / voices,
            0.001, length,
            p, p/4,
            'sawtooth');
        sfx.sound(this.pos,
            0.015 * (0.2 + 0.3 * this.kick) / voices,
            0.001, length,
            p, p/4,
            'sine');
      }
      this.kick = 0;
    }
  }
};

PlayerSinger.prototype.initNodes = function(sfx) {
  var c = sfx.ctx;
  var t = c.currentTime;

  // thrust
  this.thrustWub = new WubOscillator(
      30, 300,
      5, 30,
      0.3, 0.5,
      'square');
  this.thrustWub.createNodes(c);
  this.thrustWub.setValue(0);
  this.thrustWub.start(t);
  this.thrustGain = sfx.createGain();
  this.thrustGain.gain.value = 1.5;
  this.thrustWub.connect(this.thrustGain);

  this.tractorGain = sfx.createGain();
  this.tractorGain.gain.value = 3;

  // tractor seek
  this.tractorSeekWub = new WubOscillator(
      125, 1000,
      20, 30,
      0, 0.5,
      'sawtooth');
  this.tractorSeekWub.createNodes(c);
  this.tractorSeekWub.setValue(0);
  this.tractorSeekWub.start(t);
  this.tractorSeekWub.connect(this.tractorGain);

  // tractor hold
  this.tractorHoldWub = new WubOscillator(
      3602, 100,
      75, 0.1,
      0, 0.8,
      'square');
  this.tractorHoldWub.createNodes(c);
  this.tractorHoldWub.setValue(0);
  this.tractorHoldWub.start(t);
  this.tractorHoldWub.connect(this.tractorGain);

  this.masterGain = sfx.createGain();
  this.masterGain.gain.value = 1;
  this.panner = c.createPanner();

  this.thrustGain.connect(this.masterGain);
  this.tractorGain.connect(this.masterGain);
  this.masterGain.connect(this.panner);
  this.panner.connect(sfx.getMasterGainNode());
};

PlayerSinger.prototype.isKaput = function() {
  return this.now >= this.dieTime;
};

PlayerSinger.prototype.die = function() {
  this.dieTime = this.now + PlayerSinger.DEATH_DURATION;
  this.dying = true;
  if (this.masterGain) {
    this.masterGain.gain.value = 0;
  }
};

PlayerSinger.prototype.setThrusting = function(thrustFraction, speed) {
  this.thrustFraction = thrustFraction;
  this.speed = speed;
};

PlayerSinger.prototype.setTractoring = function(seekFraction, holdFraction) {
  this.seekFraction = seekFraction;
  this.holdFraction = holdFraction;
};

PlayerSinger.prototype.setKick = function(kick) {
  this.kick = kick;
};
/**
 * @constructor
 * @extends {Singer}
 */
function ZapperSinger() {
  Singer.call(this);

  // audio nodes
  this.oscillator = null;
  this.panner = null;
  this.masterGain = null;

  this.active = false;
  this.rad = new Vec2d();
}
ZapperSinger.prototype = new Singer();
ZapperSinger.prototype.constructor = ZapperSinger;

//ZapperSinger.prototype.advance = function(now) {
//  this.now = now;
//};

ZapperSinger.prototype.setRadXY = function(x, y) {
  this.rad.setXY(x, y);
};

ZapperSinger.prototype.setActive = function(a) {
  this.active = a;
};

ZapperSinger.prototype.sing = function(vorpOut, x, y) {
  var sfx = vorpOut.soundFx;
  if (!sfx || !sfx.ctx) return;
  var c = sfx.ctx;
  if (!this.masterGain) {
    this.initNodes(sfx);
  }
  if (this.active) {
    this.panner.setPosition(
        this.pos.x + (Math.random() - 0.5) * 2 + this.rad.x,
        this.pos.y + (Math.random() - 0.5) * 2 + this.rad.y,
        0);
    sfx.sound(this.pos,
        0.2 * (0.3 + 0.3 * this.kick) / voices,
        0.001, length,
        p, p/4,
        'sawtooth');
  }
};

ZapperSinger.prototype.initNodes = function(sfx) {
  var c = sfx.ctx;
  var t = c.currentTime;

  this.oscillator = c.createOscillator();
  this.oscillator.frequency.value = 2000;
  this.oscillator.type = 'sawtooth';
  this.oscillator.start(t);
  this.masterGain = sfx.createGain();
  this.masterGain.gain.value = 2;
  this.panner = c.createPanner();
  this.masterGain.connect(this.panner);
  this.panner.connect(sfx.getMasterGainNode());
};

ZapperSinger.prototype.isKaput = function() {
  return this.now >= this.dieTime;
};

ZapperSinger.prototype.die = function() {
  this.dieTime = this.now + ZapperSinger.DEATH_DURATION;
  this.dying = true;
  if (this.masterGain) {
    this.masterGain.gain.value = 0;
  }
};

ZapperSinger.prototype.setThrusting = function(thrustFraction, speed) {
  this.thrustFraction = thrustFraction;
  this.speed = speed;
};

ZapperSinger.prototype.setTractoring = function(seekFraction, holdFraction) {
  this.seekFraction = seekFraction;
  this.holdFraction = holdFraction;
};

ZapperSinger.prototype.setKick = function(kick) {
  this.kick = kick;
};
/**
 * @constructor
 * @extends {Sprite}
 */
function AndSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
}
AndSprite.prototype = new Sprite(null);
AndSprite.prototype.constructor = AndSprite;

AndSprite.prototype.inputIds = {
  X: 0
};

AndSprite.prototype.outputIds = {
  AND_X: 0
};

AndSprite.prototype.act = function() {
  this.outputs[this.outputIds.AND_X] = this.getInputAnd(this.inputIds.X);
};

/**
 * This is the beam-shooting end of a break-beam sensor.
 * @constructor
 * @extends {Sprite}
 */
function BeamerSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.targetSprite = null;
}

BeamerSprite.prototype = new Sprite(null);
BeamerSprite.prototype.constructor = BeamerSprite;

BeamerSprite.prototype.setTargetSprite = function(t) {
  this.targetSprite = t;
};

BeamerSprite.prototype.outputIds = {
  BEAM_BROKEN: 0
};

BeamerSprite.prototype.act = function() {
  if (this.targetSprite == null) return;
  var pos = this.getPos(Vec2d.alloc());
  var targetPos = this.targetSprite.getPos(Vec2d.alloc());
  var rayScan = RayScan.alloc(
      pos.x, pos.y,
      targetPos.x, targetPos.y,
      1, 1);
  var hitSpriteId = this.world.rayScan(rayScan, Vorp.GENERAL_GROUP);
  if (hitSpriteId) {
    this.painter.setBeamEndXY(
        pos.x + rayScan.time * (targetPos.x - pos.x),
        pos.y + rayScan.time * (targetPos.y - pos.y));
  }
  RayScan.free(rayScan);
  this.outputs[this.outputIds.BEAM_BROKEN] =
      hitSpriteId == this.targetSprite.id ? 0 : 1;
  Vec2d.free(pos);
  Vec2d.free(targetPos);
};

/**
 * @constructor
 * @extends {Sprite}
 */
function BlockSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
}

BlockSprite.prototype = new Sprite(null);
BlockSprite.prototype.constructor = BlockSprite;

BlockSprite.prototype.act = function() {
  this.addFriction(Vorp.FRICTION);
};

/**
 * @constructor
 * @extends {Sprite}
 */
function ButtonSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.lastClickTime = -Infinity;
  this.clicked = false;
}
ButtonSprite.prototype = new Sprite(null);
ButtonSprite.prototype.constructor = ButtonSprite;

ButtonSprite.prototype.outputIds = {
  CLICKED: 0
};

ButtonSprite.DEBOUNCE = 15;

ButtonSprite.prototype.isDebouncing = function() {
  return this.lastClickTime + ButtonSprite.DEBOUNCE - this.now() > 0;
};

ButtonSprite.prototype.act = function() {
  this.outputs[this.outputIds.CLICKED] = this.clicked ? 1 : 0;
  this.clicked = false;
};

ButtonSprite.prototype.onSpriteHit = function(hitSprite) {
  if (!this.isDebouncing()) {
    this.lastClickTime = this.now();
    this.painter.setLastClickTime(this.lastClickTime);
    this.clicked = true;
  }
};

/**
 * An invisible logic sprite that can open and close a pair of door sprites.
 * @constructor
 * @extends {Sprite}
 */
function DoorControlSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.speed = 0;
  this.closedness = 1;
  this.doorSprites = [];
}

DoorControlSprite.prototype = new Sprite(null);
DoorControlSprite.prototype.constructor = DoorControlSprite;

DoorControlSprite.prototype.inputIds = {
  OPEN: 0
};

DoorControlSprite.TOP_SPEED = 0.3;
DoorControlSprite.ACCEL = 0.02;
DoorControlSprite.MIN_CLOSEDNESS = 0.03;

DoorControlSprite.prototype.addDoorSprite = function(s) {
  this.doorSprites.push(s);
};

DoorControlSprite.prototype.act = function() {
  var destClosedness = this.getInputOr(this.inputIds.OPEN) ? DoorControlSprite.MIN_CLOSEDNESS : 1;
  if (this.closedness != destClosedness) {
    this.speed = Math.min(this.speed + DoorControlSprite.ACCEL, DoorControlSprite.TOP_SPEED);
    if (this.closedness < destClosedness) {
      this.closedness = Math.min(this.closedness + this.speed, destClosedness);
    } else {
      this.closedness = Math.max(this.closedness - this.speed, destClosedness);
    }
    for (var i = 0; i < this.doorSprites.length; i++) {
      this.doorSprites[i].setClosedness(this.closedness);
    }
  }
  if (this.closedness == destClosedness) {
    this.speed = 0;
  }
};

/**
 * The params for a door are unlike most other sprites, so heads up.
 * @param x0 {number} where the door is attached to the wall
 * @param y0 {number} where the door is attached to the wall
 * @param x1 {number} the point the door extends to when closed
 * @param y1 {number} the point the door extends to when closed
 * @constructor
 * @extends {Sprite}
 */
function DoorSprite(spriteTemplate, x0, y0, x1, y1) {
  Sprite.call(this, spriteTemplate);
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
  this.prevClosedness = this.closedness = 1;
  this.dimensionsInitialized = false;
}
DoorSprite.prototype = new Sprite(null);
DoorSprite.prototype.constructor = DoorSprite;

DoorSprite.THICKNESS = 10;

DoorSprite.prototype.act = function() {
  if (!this.dimensionsInitialized || this.closedness != this.prevClosedness) {
    this.setDimensions();
  }
};

DoorSprite.prototype.setClosedness = function(closedness) {
  this.closedness = closedness;
};

DoorSprite.prototype.setDimensions = function() {
  if (this.x0 == this.x1) {
    // vertical
    var offY = this.closedness * (this.y1 - this.y0) * 0.5;
    this.setPosXY(this.x0, this.y0 + offY);
    this.setRadXY(DoorSprite.THICKNESS, Math.abs(offY));
  } else if (this.y0 == this.y1) {
    // horizontal
    var offX = this.closedness * (this.x1 - this.x0) * 0.5;
    this.setPosXY(this.x0 + offX, this.y0);
    this.setRadXY(Math.abs(offX), DoorSprite.THICKNESS);
  } else {
    throw Error("Door is neither horizontal nor vertical. x0, y0, x1, y1: " +
        [this.x0, this.y0, this.x1, this.y1]);
  }
  this.prevClosedness = this.closedness;
  this.dimensionsInitialized = true;
};

/**
 * @constructor
 * @extends {Sprite}
 */
function ExitSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.url = null;
}

ExitSprite.prototype = new Sprite(null);
ExitSprite.prototype.constructor = ExitSprite;

ExitSprite.prototype.setUrl = function(url) {
  this.url = url;
};

ExitSprite.prototype.onSpriteHit = function(hitSprite) {
  if (hitSprite == this.world.getPlayerSprite()) {
    this.world.exitToUrl(this.url);
  }
};

/**
 * @constructor
 * @extends {Sprite}
 */
function GripSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.targetPos = null;  // vec

  this.pos = new Vec2d();
  this.heldPos = new Vec2d();
  this.accel = new Vec2d();
  this.heldSprite = null;
  this.distToTarget = 0;
  
  this.scanVec = new Vec2d();
  this.scanInitVec = new Vec2d();
}

GripSprite.prototype = new Sprite(null);
GripSprite.prototype.constructor = GripSprite;

GripSprite.GRIP_STRENGTH = 0.014;

GripSprite.prototype.outputIds = {
  GRIPPING: 0
};

GripSprite.prototype.setTargetPos = function(vec) {
  this.targetPos = (new Vec2d()).set(vec);
  this.distToTarget = vec.distance(this.getPos(this.pos));
};

GripSprite.prototype.act = function() {
  this.painter.clearRayScans();
  var p = this.getPos(this.pos);
  this.painter.setHolderPos(p);
  if (!this.heldSprite) {
    for (var i = 0; !this.heldSprite && i < 2; i++) {
      this.gripScan();
    }
  } else if (this.maybeBreakGrip()) {
    // grip broken
    this.painter.setReleasing(0);
  } else {
    // keep on grippin'
    this.gripForce();
  }
  this.outputs[this.outputIds.GRIPPING] = this.heldSprite ? 1 : 0;
};

GripSprite.prototype.gripScan = function() {
  if (!this.targetPos) return;
  this.scanInitVec.set(this.targetPos).subtract(this.getPos(this.pos)).scale(1.5);
  this.gripScanSweep(this.scanInitVec, 1/10, 1);
};

/**
 * @param {Vec2d} vec  line down the center of the scan arc
 * @param {number} arc  number from 0 to 1 indicating
 * what fraction of the circle to cover.  1 means a full circle.
 * @param {number} scans  number of steps in the scan sweep.
 */
GripSprite.prototype.gripScanSweep = function(vec, arc, scans) {
  var p = this.getPos(this.pos);
  var minTime = Infinity;
  for (var i = 0; i < scans; i++) {
    this.scanVec.set(vec);
    this.scanVec.rot(arc * (i / scans) * 2 * Math.PI +
        (Math.random() - 0.5) * 4 * Math.PI * arc / scans);
    var rayScan = RayScan.alloc(
        p.x, p.y,
        p.x + this.scanVec.x, p.y + this.scanVec.y,
        1, 1);
    var hitSpriteId = this.world.rayScan(rayScan, Vorp.TRACTOR_BEAM_GROUP);
    if (hitSpriteId && rayScan.time < minTime) {
      var sprite = this.world.getSprite(hitSpriteId);
      if (sprite.mass < Infinity) {
        this.heldSprite = sprite;
        this.heldSprite.getPos(this.heldPos);
        this.painter.clearRayScans();
        // Pick the closest target.
        minTime = rayScan.time;
      }
    }
    if (!this.heldSprite) {
      this.painter.addRayScan(rayScan);
    }
    RayScan.free(rayScan);
  }
};

GripSprite.prototype.gripForce = function() {
  var heldPos = this.heldSprite.getPos(this.heldPos);
  this.accel.set(this.targetPos).subtract(heldPos).scale(GripSprite.GRIP_STRENGTH / this.heldSprite.mass);
  this.heldSprite.accelerate(this.accel);

  this.painter.setHolding(3); // TODO what's the real strength?
  this.painter.setHeldPos(this.heldPos);
};

/**
 * @return {boolean} true iff the grip is broken
 */
GripSprite.prototype.maybeBreakGrip = function() {
  // existence check
  if (!this.world.getSprite(this.heldSprite.id)) {
    this.heldSprite = null;
    return true;
  }
  var p = this.targetPos;
  var h = this.heldSprite.getPos(this.heldPos);
  if (p.distanceSquared(h) > this.distToTarget * this.distToTarget * 1.2) {
    this.heldSprite = null;
    return true;
  }
  return false;
};

/**
 * @constructor
 * @extends {Sprite}
 */
function NotSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
}
NotSprite.prototype = new Sprite(null);
NotSprite.prototype.constructor = NotSprite;

NotSprite.prototype.inputIds = {
  X: 0
};

NotSprite.prototype.outputIds = {
  NOT_X: 0
};

NotSprite.prototype.act = function() {
  this.outputs[this.outputIds.NOT_X] = !this.getInputOr(this.inputIds.X);
};

/**
 * @constructor
 * @extends {Sprite}
 */
function PlasmaSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
}

PlasmaSprite.prototype = new Sprite(null);
PlasmaSprite.prototype.constructor = PlasmaSprite;

PlasmaSprite.prototype.act = function() {
};

PlasmaSprite.RADIUS = 5;

PlasmaSprite.prototype.onSpriteHit = function(hitSprite) {
  this.addKaputPaintEvent();
  if (hitSprite instanceof ZombieSprite) {
    this.world.explodeZombie(hitSprite.id);
  } else if (this.world.isPlayerSpriteId(hitSprite.id)) {
    this.world.explodePlayer();
  } else {
    var p = this.getPos(new Vec2d());
    this.world.splashPlasma(p.x, p.y);
  }
  this.world.removeSprite(this.id);
  return true;
};

/**
 * @constructor
 * @extends {Sprite}
 */
function PlayerAssemblerSprite(spriteTemplate, playerSpriteFactory) {
  Sprite.call(this, spriteTemplate);
  this.playerSpriteFactory = playerSpriteFactory;

  /**
   * Spot where the player will be assembled
   */
  this.targetPos = this.getPos(new Vec2d());
}
PlayerAssemblerSprite.prototype = new Sprite(null);
PlayerAssemblerSprite.prototype.constructor = PlayerAssemblerSprite;

PlayerAssemblerSprite.prototype.setTargetPos = function(vec) {
  this.targetPos.set(vec);
};

PlayerAssemblerSprite.prototype.createPlayer = function() {
  var pos = this.getPos(Vec2d.alloc());
  this.painter.createSparks(pos.x, pos.y, this.targetPos.x, this.targetPos.y, this.now());
  Vec2d.free(pos);
  return this.playerSpriteFactory.createXY(this.targetPos.x, this.targetPos.y);
};

/**
 * @param {SpriteTemplate} spriteTemplate
 * @constructor
 * @extends {Sprite}
 */
function PlayerSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);

  this.pos = new Vec2d();

  this.scanVec = new Vec2d();
  this.scanInitVec = new Vec2d();
  
  this.heldPos = new Vec2d();
  this.keysVec = new Vec2d();

  this.grip = PlayerSprite.Grip.NONE;
  this.heldSprite = null;
  this.stiffPose = new Vec2d();
  this.kickPow = 0;
  this.canGrip = true;
  this.accel = PlayerSprite.MIN_ACCEL;
  this.zombieness = 0;
}
PlayerSprite.prototype = new Sprite(null);
PlayerSprite.prototype.constructor = PlayerSprite;

PlayerSprite.ZOMBIFICATION_DURATION = 60;

PlayerSprite.TRACTOR_ACCEL_MAX = 2.5;

/**
 * @enum {number}
 */
PlayerSprite.Grip = {
  NONE: 1,
  STIFF: 2,
  LOOSE: 3
};

PlayerSprite.GRIP_RANGE = 140;
PlayerSprite.GRIP_SEEK_RANGE = 5 * PlayerSprite.GRIP_RANGE;
PlayerSprite.PULL = 0.024;
PlayerSprite.DAMP = 0.15;
PlayerSprite.MAX_KICK_POW = 24;
PlayerSprite.KICK_FORCE_MAGNIFIER = 1.1;
PlayerSprite.KICK_DECAY = 0.4;

PlayerSprite.MIN_ACCEL = 0.5;
PlayerSprite.MULT_ACCEL = 1.1;
PlayerSprite.MULT_DECEL = 0.8;
PlayerSprite.MAX_ACCEL = 1.4;
PlayerSprite.BRAKE = 0.0;

PlayerSprite.prototype.act = function() {
  this.painter.clearRayScans();
  this.addFriction(Vorp.FRICTION);

  if (this.zombieness) {
    this.zombieness += 1 / PlayerSprite.ZOMBIFICATION_DURATION;
    this.painter.setZombieness(this.zombieness);
    if (this.zombieness >= 1) {
      this.world.playerFullyZombified();
      return;
    }
  }

  GU_copyKeysVec(this.keysVec);
  var accelerating = false;
  if (!this.keysVec.isZero()) {
    var speed = this.zombieness ? Math.max(0, (0.7 - this.zombieness) / 3) : 1;
    this.accelerate(this.keysVec.scaleToLength(this.accel * speed));
    this.accel *= PlayerSprite.MULT_ACCEL;
    this.accel = Math.min(this.accel, PlayerSprite.MAX_ACCEL);
    accelerating = true;
  } else {
    //this.addFriction(PlayerSprite.BRAKE);
    this.accel *= PlayerSprite.MULT_DECEL;
    this.accel = Math.max(this.accel, PlayerSprite.MIN_ACCEL);
  }
  this.pos = this.getPos(this.pos);
  this.singer.setPosition(this.pos.x, this.pos.y);
  this.singer.setThrusting(
      (this.accel - PlayerSprite.MIN_ACCEL) /
          (PlayerSprite.MAX_ACCEL - PlayerSprite.MIN_ACCEL),
      this.vel.magnitude());

  if (this.zombieness) return;

  // gripper
  var kickDown = this.kickKeyDown();
  if (kickDown) {
    this.kick();
  }
  if (this.grip == PlayerSprite.Grip.NONE) {
    if (!this.gripKeyDown()) {
      this.canGrip = true;
      this.singer.setTractoring(0, 0);
    } else if (this.canGrip) {
      this.gripScan();
    }
  } else if (this.grip == PlayerSprite.Grip.LOOSE) {
    this.kickPow *= (1 - PlayerSprite.KICK_DECAY);
    if (this.gripKeyDown()) {
      this.initStiffPose();
    } else {
      this.looseForce();
    }
  } else if (this.grip == PlayerSprite.Grip.STIFF) {
    if (this.gripKeyDown()) {
      this.kickPow = Math.min(this.kickPow + 2, PlayerSprite.MAX_KICK_POW);
      this.stiffForce();
    } else {
      this.grip = PlayerSprite.Grip.LOOSE;
      this.looseForce();
    }
  }
  if (this.heldSprite) {
    this.painter.setHolderPos(this.getPos(this.pos));
    //this.painter.setHeldPosVel(this.heldSprite.getPos(this.pos), this.heldSprite.getVel(this.vel));
    this.painter.setHeldPos(this.heldSprite.getPos(this.pos));
    this.painter.setHolding(5 + this.kickPow);
  }
};

/**
 * @return {boolean}
 */
PlayerSprite.prototype.gripKeyDown = function() {
  return GU_keys[VK_Z] || GU_keys[VK_SEMICOLON];
};

/**
 * @return {boolean}
 */
PlayerSprite.prototype.kickKeyDown = function() {
  return GU_keys[VK_X] || GU_keys[VK_Q];
};

PlayerSprite.prototype.gripScan = function() {
  GU_copyKeysVec(this.keysVec);

  if (!this.keysVec.isZero()) {
    // long-range directional seek
    this.scanInitVec.set(this.keysVec).scaleToLength(PlayerSprite.GRIP_SEEK_RANGE);
    this.gripScanSweep(this.scanInitVec, 1/8, 16);
    this.singer.setTractoring(1, 0);
  } else {  
    // short-range circular seek
    this.scanInitVec.setXY(PlayerSprite.GRIP_RANGE, 0);
    this.gripScanSweep(this.scanInitVec, 1 , 16);
    this.singer.setTractoring(0.8, 0);
  }
};

/**
 * @param {Vec2d} vec  line down the center of the scan arc
 * @param {number} arc  number from 0 to 1 indicating
 * what fraction of the circle to cover.  1 means a full circle.
 * @param {number} scans  number of steps in the scan sweep.
 */
PlayerSprite.prototype.gripScanSweep = function(vec, arc, scans) {
  var p = this.getPos(this.pos);
  var minTime = Infinity;
  for (var i = 0; i < scans; i++) {
    this.scanVec.set(vec);
    this.scanVec.rot(arc * (i / (scans - 1) - 0.5) * 2 * Math.PI +
        (Math.random() - 0.5) * 2 * Math.PI * arc / scans);
    var rayScan = RayScan.alloc(
        p.x, p.y,
        p.x + this.scanVec.x, p.y + this.scanVec.y,
        5, 5);
    var hitSpriteId = this.world.rayScan(rayScan, Vorp.TRACTOR_BEAM_GROUP);
    if (hitSpriteId && rayScan.time < minTime) {
      var sprite = this.world.getSprite(hitSpriteId);
      if (sprite.mass < Infinity) {
        this.heldSprite = sprite;
        this.grip = PlayerSprite.Grip.LOOSE;
        if (this.canGrip) {
          // Not any more.
          this.canGrip = false;
          //this.painter.clearRayScans();
        }
        // Pick the closest target.
        minTime = rayScan.time;
      }
    }
    this.painter.addRayScan(rayScan);
    RayScan.free(rayScan);
  }
};

PlayerSprite.prototype.calcKickPower = function() {
  return this.kickPow * PlayerSprite.KICK_FORCE_MAGNIFIER;
};

PlayerSprite.prototype.kick = function() {
  if (!this.heldSprite) return;
  var kick = this.calcKickPower();
  this.kickPow = 0;
  var heldPos = this.heldSprite.getPos(Vec2d.alloc());
  var pushVec = this.getPos(Vec2d.alloc()).subtract(heldPos).scaleToLength(kick);
  this.accelerate(pushVec);
  var massRatio = this.mass / this.heldSprite.mass;
  this.heldSprite.accelerate(pushVec.scale(-massRatio));
  this.breakGrip(kick);
  Vec2d.free(pushVec);
  Vec2d.free(heldPos);
};

PlayerSprite.prototype.looseForce = function() {
  var playerPos = this.getPos(Vec2d.alloc());
  var dPos = this.heldSprite.getPos(Vec2d.alloc()).subtract(playerPos);
  var dist = dPos.magnitude();
  if (this.maybeBreakGrip(dist)) {
    Vec2d.free(playerPos);
    Vec2d.free(dPos);
    return;
  }
  var aimUnit = Vec2d.alloc().set(dPos).scale(1 / dist);
  var pull = (PlayerSprite.GRIP_RANGE - dist) * PlayerSprite.PULL;
  var dVel = Vec2d.alloc().set(this.vel).subtract(this.heldSprite.vel);
  var damp = PlayerSprite.DAMP * dVel.dot(dPos) / dist;
  var accel = aimUnit.scale(pull + damp).scale(-1);
  if (dist > PlayerSprite.GRIP_RANGE) {
    var distFactor = (PlayerSprite.GRIP_SEEK_RANGE - dist) / PlayerSprite.GRIP_SEEK_RANGE;
    distFactor = Math.max(0.1, distFactor);
    accel.scale(distFactor);
  }
  //accel.clipToMaxLength(PlayerSprite.MAX_TRACTOR_ACCEL);
  this.accelerate(accel);

  this.setSingerTractorAccel(accel);

  var massRatio = this.mass / this.heldSprite.mass;
  this.heldSprite.accelerate(accel.scale(-massRatio));
  Vec2d.free(playerPos);
  Vec2d.free(dPos);
  Vec2d.free(aimUnit);
  Vec2d.free(dVel);
};

PlayerSprite.prototype.setSingerTractorAccel = function(accel) {
  var accelMag = accel.magnitude();
  this.singer.setTractoring(0,
      0.1 * this.kickPow / PlayerSprite.MAX_KICK_POW +
          0.9 * accelMag / PlayerSprite.TRACTOR_ACCEL_MAX);
};

PlayerSprite.prototype.initStiffPose = function() {
  var playerPos = this.getPos(Vec2d.alloc());
  var dPos = this.heldSprite.getPos(Vec2d.alloc()).subtract(playerPos);
  this.stiffPose.set(dPos).scaleToLength(PlayerSprite.GRIP_RANGE * 0.95);
  this.grip = PlayerSprite.Grip.STIFF;
  Vec2d.free(playerPos);
  Vec2d.free(dPos);
};


PlayerSprite.prototype.stiffForce = function() {
  var heldSpritePos = this.heldSprite.getPos(Vec2d.alloc());
  var thisPos = this.getPos(Vec2d.alloc());
  var dPos = heldSpritePos.subtract(thisPos).subtract(this.stiffPose);
  var dist = dPos.magnitude();
  if (this.maybeBreakGrip(dist)) {
    Vec2d.free(heldSpritePos);
    Vec2d.free(thisPos);
    return;
  }
  var dVel = this.getVel(Vec2d.alloc()).subtract(this.heldSprite.vel);
  var accel = Vec2d.alloc().set(dVel).scale(-PlayerSprite.DAMP);
  accel.add(dPos.scale(PlayerSprite.PULL));
  if (dist > PlayerSprite.GRIP_RANGE) {
    var distFactor = (PlayerSprite.GRIP_SEEK_RANGE - dist) / PlayerSprite.GRIP_SEEK_RANGE;
    distFactor = Math.max(0.1, distFactor);
    accel.scale(distFactor);
  }
  //accel.clipToMaxLength(PlayerSprite.MAX_TRACTOR_ACCEL);

  this.setSingerTractorAccel(accel);

  this.accelerate(accel);
  var massRatio = this.mass / this.heldSprite.mass;
  this.heldSprite.accelerate(accel.scale(-massRatio));
  Vec2d.free(heldSpritePos);
  Vec2d.free(thisPos);
  Vec2d.free(dVel);
  Vec2d.free(accel);
};


PlayerSprite.prototype.maybeBreakGrip = function(dist) {
  // existence check
  if (!this.world.getSprite(this.heldSprite.id)) {
    this.breakGrip();
    return true;
  }
  // distance check
  if (dist > PlayerSprite.GRIP_SEEK_RANGE * 1.05) {
    this.breakGrip();
    return true;
  }
  // line-of-sight check
  var p = this.getPos(this.pos);
  var h = this.heldSprite.getPos(this.heldPos);
  var rayScan = RayScan.alloc(
      p.x, p.y,
      h.x, h.y,
      1, 1);
  var hitSpriteId = this.world.rayScan(rayScan, Vorp.GRIP_BLOCKER_GROUP);
  RayScan.free(rayScan);
  if (hitSpriteId) {
    this.breakGrip();
    return true;
  }
  return false;
};

/**
 * @param {number=} opt_kick
 */
PlayerSprite.prototype.breakGrip = function(opt_kick) {
  if (this.grip == PlayerSprite.Grip.NONE) return;
  this.grip = PlayerSprite.Grip.NONE;
  var holderSpritePos = this.getPos(Vec2d.alloc());
  this.painter.setHolderPos(holderSpritePos);
  Vec2d.free(holderSpritePos);
  this.heldSprite = null;
  this.kickPow = 0;
  this.painter.setReleasing(opt_kick || 0);
  this.singer.setKick((opt_kick || 0.05) / PlayerSprite.MAX_KICK_POW);
  this.singer.setTractoring(0, 0);
};

PlayerSprite.prototype.die = function() {
  this.breakGrip();
  this.painter.die();
  this.singer.die();
};

PlayerSprite.prototype.touchedByAZombie = function() {
  if (!this.zombieness) {
    this.zombieness = 1 / PlayerSprite.ZOMBIFICATION_DURATION;
    this.breakGrip();
  }
};

/**
 * @constructor
 */
function PlayerSpriteFactory(baseTemplate) {
  this.baseTemplate = baseTemplate;
}

PlayerSpriteFactory.prototype.createXY = function(x, y) {
  var r = Transformer.BOX_RADIUS;
  return new PlayerSprite(
      this.baseTemplate
          .makeMovable()
          .setPainter(new PlayerPainter())
          .setSinger(new PlayerSinger())
          .setPosXY(x, y)
          .setRadXY(r, r)
          .setMass(1)
          .setGroup(Vorp.PLAYER_GROUP));
};

/**
 * @constructor
 * @extends {Sprite}
 */
function PortalSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.targetSprite = this;
  this.pos = new Vec2d();
  this.vec = new Vec2d();
  this.thrust = new Vec2d();
  this.hitPos = new Vec2d();
  this.targetPos = new Vec2d();
}

PortalSprite.prototype = new Sprite(null);
PortalSprite.prototype.constructor = PortalSprite;


PortalSprite.THRUST = 0.1;

PortalSprite.prototype.setTargetSprite = function(targetSprite) {
  this.targetSprite = targetSprite;
};

PortalSprite.prototype.act = function() {
  this.targetSprite.getPos(this.pos);
  this.painter.setTwinPos(this.pos);

  this.addFriction(Vorp.FRICTION);
  this.avoidObstacles();
};

PortalSprite.prototype.onSpriteHit = function(
    hitSprite, thisAcc, hitAcc, xTime, yTime, overlapping) {
  if (!this.targetSprite ||
      hitSprite == this.targetSprite ||
      hitSprite.mass == Infinity ||
      hitSprite.area() > this.area() ||
      !thisAcc || !hitAcc ||
      hitSprite.portalCount > 3) {
    return false;
  }
  hitSprite.portalCount++;

  this.getPos(this.pos);
  var targetPos = this.targetSprite.getPos(this.targetPos);
  var dPos = hitSprite.getPos(this.hitPos).subtract(this.pos);
  var dest = Vec2d.alloc().set(targetPos);
  dest.x -= xTime ? dPos.x : 0;
  dest.y -= yTime ? dPos.y : 0;
  var teleportOK = !overlapping;
  if (teleportOK) {
    var rayScan = RayScan.alloc(
        targetPos.x, targetPos.y,
        dest.x, dest.y,
        hitSprite.rad.x * 1.01, hitSprite.rad.y * 1.01);  // fudge factor
    var otherSideSpriteId = this.world.rayScan(rayScan, Vorp.PORTAL_PROBE_GROUP);
    RayScan.free(rayScan);
    if (otherSideSpriteId) {
      var otherSideSprite = this.world.getSprite(otherSideSpriteId);
      if (otherSideSprite && (
          otherSideSprite.mass == Infinity || 
          otherSideSprite == hitSprite || 
          otherSideSprite == this.targetSprite)) {
        teleportOK = false;
      }
    }
  }

  if (teleportOK) {
    hitSprite.getPos(this.hitPos);
    this.world.splashPortal(this.hitPos, false);
    var dVel = this.targetSprite.getVel(Vec2d.alloc()).subtract(this.vel);
    // A little randomness, too.
    dVel.addXY(0.001 * (Math.random() - 0.5), 0.001 * (Math.random() - 0.5));
    // Break tractor grips
    // TODO: Generalize so all (significant?) spacial discontinuity breaks all grips.
    var player = this.world.getPlayerSprite();
    if (player && (player == hitSprite || player.heldSprite == hitSprite)) {
      player.breakGrip(0);
    }

    hitSprite.setPos(dest);
    this.world.splashPortal(dest, true);
    hitSprite.addVel(dVel);

    Vec2d.free(dVel);
  } else {
    hitSprite.addVel(hitAcc.subtract(thisAcc));
  }
  Vec2d.free(dest);
  return true;
};

PortalSprite.prototype.avoidObstacles = function() {
  var p = this.getPos(this.pos);
  var v = this.vec.setXY(0, this.rad.x * 2.1);
  var t = this.thrust.setXY(0, 0);
  for (var i = 0; i < 4; i++) {
    v.rot90Right();
    var rayScan = RayScan.alloc(
        p.x, p.y,
        p.x + v.x, p.y + v.y,
        this.rad.x, this.rad.y);
    var spriteId = this.world.rayScan(rayScan, Vorp.PORTAL_REPEL_GROUP);
    if (spriteId) {
      t.subtract(v);
    }
    RayScan.free(rayScan);
  }
  t.scaleToLength(PortalSprite.THRUST);
  this.accelerate(t);
};

/**
 * This is the sensor end of a break-beam sensor.
 * @constructor
 * @extends {Sprite}
 */
function SensorSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
}

SensorSprite.prototype = new Sprite(null);
SensorSprite.prototype.constructor = SensorSprite;

/**
 * @constructor
 * @extends {Sprite}
 */
function TimerSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.startTime = -Infinity;
  this.timeoutLength = null;
}

TimerSprite.prototype = new Sprite(null);
TimerSprite.prototype.constructor = TimerSprite;

TimerSprite.prototype.inputIds = {
  RESTART: 0
};

TimerSprite.prototype.outputIds = {
  RUNNING: 0
};

/**
 * @param {number} timeoutLength  timeout length length in ticks
 */
TimerSprite.prototype.setTimeoutLength = function(timeoutLength) {
  this.timeoutLength = timeoutLength;
};

TimerSprite.prototype.isRunning = function() {
  return this.now() < this.startTime + this.timeoutLength;
};

TimerSprite.prototype.restart = function() {
  this.startTime = this.now();
};

TimerSprite.prototype.act = function() {
  if (this.getInputOr(this.inputIds.RESTART)) {
    this.restart();
  }
  this.outputs[this.outputIds.RUNNING] = this.isRunning() ? 1 : 0;
};

/**
 * @constructor
 * @extends {Sprite}
 */
function ToggleSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.state = false;
}
ToggleSprite.prototype = new Sprite(null);
ToggleSprite.prototype.constructor = ToggleSprite;

ToggleSprite.prototype.inputIds = {
  TOGGLE: 0
};

ToggleSprite.prototype.outputIds = {
  STATE: 0
};

ToggleSprite.prototype.act = function() {
  if (this.getInputOr(this.inputIds.TOGGLE)) {
    this.state = !this.state;
  }
  this.outputs[this.outputIds.STATE] = this.state;
};

/**
 * Turret that scans for stuff and shoots at it.
 * For now it's immobile, and fires plasma at zombies.
 * Seems friendly enough...
 * @constructor
 * @extends {Sprite}
 */
function TurretSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);

  this.pos = new Vec2d();

  this.scanVec = new Vec2d();
  this.scanInitVec = new Vec2d();

  this.lastFireTime = TurretSprite.COOLDOWN;
}

TurretSprite.prototype = new Sprite(null);
TurretSprite.prototype.constructor = TurretSprite;

TurretSprite.SCAN_RANGE = 1500;
TurretSprite.PLASMA_SPEED = 60;
TurretSprite.SCANS = 5;
TurretSprite.COOLDOWN = 7;

// fraction of a circle
TurretSprite.FIRE_ARC = 0.5;

TurretSprite.prototype.setTargetPos = function(vec) {
  this.targetPos = (new Vec2d()).set(vec);
  this.distToTarget = vec.distance(this.getPos(this.pos));
};

TurretSprite.prototype.act = function() {
  if (!this.targetPos || this.coolingDown()) return;
  this.scanInitVec.set(this.targetPos).subtract(this.getPos(this.pos));
  this.scanSweep(this.scanInitVec, TurretSprite.FIRE_ARC, TurretSprite.SCANS);
};

TurretSprite.prototype.coolingDown = function() {
  return this.now() < this.lastFireTime + TurretSprite.COOLDOWN;
};

/**
 * @param {Vec2d} vec  line down the center of the scan arc
 * @param {number} arc  number from 0 to 1 indicating
 * what fraction of the circle to cover.  1 means a full circle.
 * @param {number} scans  number of steps in the scan sweep.
 */
TurretSprite.prototype.scanSweep = function(vec, arc, scans) {
  var p = this.getPos(this.pos);
  var minTime = Infinity;
  for (var i = 0; i < scans; i++) {
    this.scanVec.set(vec);
    this.scanVec.rot(arc * Math.PI * (2 * Math.random() - 1));
    var rayScan = RayScan.alloc(
        p.x, p.y,
        p.x + this.scanVec.x, p.y + this.scanVec.y,
        PlasmaSprite.RADIUS, PlasmaSprite.RADIUS);
    var hitSpriteId = this.world.rayScan(rayScan, Vorp.GENERAL_GROUP);
    if (hitSpriteId && rayScan.time < minTime) {
      var sprite = this.world.getSprite(hitSpriteId);
      if (sprite instanceof ZombieSprite) {
        this.firePlasma(this.scanVec.rot(0.1 * (Math.random() - 0.5)));
        break;
      }
    }
    RayScan.free(rayScan);
  }
};

TurretSprite.prototype.firePlasma = function(dirVec) {
  var p = this.getPos(this.pos);
  dirVec.scaleToLength(Transformer.BOX_RADIUS * 1.5);
  var px = p.x + dirVec.x;
  var py = p.y + dirVec.y;
  dirVec.scaleToLength(TurretSprite.PLASMA_SPEED);
  this.world.firePlasma(
      px, py,
      dirVec.x, dirVec.y);
  this.lastFireTime = this.now();
  this.painter.setLastFireTime(this.lastFireTime);
};

/**
 * @constructor
 * @extends {Sprite}
 */
function WallSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
}

WallSprite.prototype = new Sprite(null);
WallSprite.prototype.constructor = WallSprite;

/**
 * The params for a door are unlike most other sprites, so heads up.
 * @constructor
 * @extends {Sprite}
 */
function ZapperControlSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.zapperSprite = null;
  this.oldOpen = 0;
}

ZapperControlSprite.prototype = new Sprite(null);
ZapperControlSprite.prototype.constructor = ZapperControlSprite;

ZapperControlSprite.prototype.inputIds = {
  OPEN: 0
};

ZapperControlSprite.prototype.setZapperSprite = function(s) {
  this.zapperSprite = s;
};

ZapperControlSprite.prototype.act = function() {
  var newOpen = this.getInputOr(this.inputIds.OPEN);
  if (!this.oldOpen && newOpen) {
    this.world.removeSprite(this.zapperSprite.id);
  } else if (this.oldOpen && !newOpen) {
    this.world.addSprite(this.zapperSprite);
  }
  this.zapperSprite.getPainter().setActive(!newOpen);
  this.oldOpen = newOpen;
};

/**
 * @constructor
 * @extends {Sprite}
 */
function ZapperSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
}

ZapperSprite.prototype = new Sprite(null);
ZapperSprite.prototype.constructor = ZapperSprite;

ZapperSprite.prototype.onSpriteHit = function(hitSprite) {
  if (hitSprite instanceof PlayerSprite) {
    this.world.explodePlayer();
  } else if (hitSprite instanceof ZombieSprite) {
    this.world.explodeZombie(hitSprite.id);
  }
};

/**
 * @constructor
 * @extends {Sprite}
 */
function ZombieAssemblerSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.nextAssemblyTime = null;

  /**
   * Spot where the zombie will be assembled
   */
  this.targetPos = this.getPos(new Vec2d());

  this.pos = new Vec2d();
}
ZombieAssemblerSprite.prototype = new Sprite(null);
ZombieAssemblerSprite.prototype.constructor = ZombieAssemblerSprite;

ZombieAssemblerSprite.AVERAGE_PRODUCTION_TIME = 60 * 5;

ZombieAssemblerSprite.prototype.act = function() {
  if (!this.nextAssemblyTime) {
    this.calcNextAssemblyTime();
  }
  if (this.now() > this.nextAssemblyTime) {
    var p = this.getPos(this.pos);

    // The rayscan should be flat but as wide as the zombie, and should
    // go all the way to the top of the potential spawn volume.
    var destVec = (new Vec2d()).set(this.targetPos).subtract(p);
    var destVecLen = destVec.magnitude();
    destVec.scaleToLength(destVecLen + Transformer.BOX_RADIUS);
    destVec.add(p);

    var radiusVec = (new Vec2d()).set(this.targetPos).subtract(p)
        .rot90Right().scaleToLength(Transformer.BOX_RADIUS).abs();

    var rayScan = RayScan.alloc(
        p.x, p.y,
        destVec.x, destVec.y,
        radiusVec.x, radiusVec.y);
    var hitSpriteId = this.world.rayScan(rayScan, Vorp.GENERAL_GROUP);
    if (!hitSpriteId) {
      this.createZombie();
      this.calcNextAssemblyTime();
    }
    RayScan.free(rayScan);
  }
};

ZombieAssemblerSprite.prototype.calcNextAssemblyTime = function() {
  this.nextAssemblyTime = Math.round(this.now() +
      ZombieAssemblerSprite.AVERAGE_PRODUCTION_TIME * (0.5 + Math.random()));
};

ZombieAssemblerSprite.prototype.setTargetPos = function(vec) {
  this.targetPos.set(vec);
};

ZombieAssemblerSprite.prototype.createZombie = function() {
  var pos = this.getPos(this.pos);
  this.world.createZombieAtXY(this.targetPos.x, this.targetPos.y);
  this.painter.createSparks(pos.x, pos.y, this.targetPos.x, this.targetPos.y, this.now());
};

/**
 * @constructor
 * @extends {Sprite}
 */
function ZombieSprite(spriteTemplate) {
  Sprite.call(this, spriteTemplate);
  this.mass = 1;

  this.pos = new Vec2d();
  this.vec = new Vec2d();
}
ZombieSprite.prototype = new Sprite(null);
ZombieSprite.prototype.constructor = ZombieSprite;

ZombieSprite.FWD_ACCEL = 0.25;
ZombieSprite.RAND_ACCEL = 0.2;
ZombieSprite.APPROACH_PLAYER_ACCEL = 0.5;
ZombieSprite.RUSH_PLAYER_RANGE = 200;
ZombieSprite.RUSH_PLAYER_ACCEL = 0.8;
ZombieSprite.AVOID_PLASMA_ACCEL = 0.3;
ZombieSprite.OBSTACLE_SCAN_RANGE = 70;
ZombieSprite.PLASMA_SCAN_RANGE = 80;
ZombieSprite.PLAYER_SCAN_RANGE = 500;

ZombieSprite.prototype.act = function() {
  this.addFriction(Vorp.FRICTION);
  this.avoidPlasma() || this.approachPlayer() || this.avoidObstacles();
};

ZombieSprite.prototype.avoidObstacles = function() {
  var p = this.getPos(this.pos);
  var v = this.vec;

  var fwdFactor = 1;
  var randFactor = 1;

  var p2 = this.getVel(v).scaleToLength(ZombieSprite.OBSTACLE_SCAN_RANGE).add(p);
  var rayScan = RayScan.alloc(
      p.x, p.y,
      p2.x, p2.y,
      this.rad.x, this.rad.y);
  var generalSpriteId = this.world.rayScan(rayScan, Vorp.GENERAL_GROUP);
  if (generalSpriteId) {
    fwdFactor = -0.5;
    randFactor = 0.5;
  }
  RayScan.free(rayScan);

  this.getVel(v).scaleToLength(Math.random() * ZombieSprite.FWD_ACCEL * fwdFactor);
  this.accelerate(v);

  v.setXY(0, randFactor * ZombieSprite.RAND_ACCEL).rot(Math.random() * 2 * Math.PI);
  this.accelerate(v);
};

ZombieSprite.prototype.avoidPlasma = function() {
  var p = this.getPos(this.pos);
  var v = this.vec;

  var fwdFactor = 1;
  var randFactor = 1;

  for (var i = 0; i < 3; i++) {
    var rot = Math.random() * 2 * Math.PI;
    var p2 = v.setXY(ZombieSprite.PLASMA_SCAN_RANGE, 0).rot(rot).add(p);
    var rayScan = RayScan.alloc(
        p.x, p.y,
        p2.x, p2.y,
        this.rad.x, this.rad.y);
    var plasmaSpriteId = this.world.rayScan(rayScan, Vorp.PLASMA_PROBE_GROUP);
    if (plasmaSpriteId) {
      v.setXY(rayScan.x0 - rayScan.x1, rayScan.y0 - rayScan.y1)
          .scaleToLength(ZombieSprite.AVOID_PLASMA_ACCEL);
      this.accelerate(v);
    }
    RayScan.free(rayScan);
  }

  return !!plasmaSpriteId;
};

ZombieSprite.prototype.approachPlayer = function() {
  var player = this.world.getPlayerSprite();
  if (!player || player.zombieness) {
    return;
  }
  var p = this.getPos(this.pos);
  var v = player.getPos(this.vec);
  if (!v) return false;
  var foundPlayer = false;
  var rayScan = RayScan.alloc(
      p.x, p.y,
      v.x, v.y,
      1, 1);
  var hitSpriteId = this.world.rayScan(rayScan, Vorp.GENERAL_GROUP);
  if (this.world.isPlayerSpriteId(hitSpriteId)) {
    var accel = p.distance(v) <= ZombieSprite.RUSH_PLAYER_RANGE ?
        ZombieSprite.RUSH_PLAYER_ACCEL :
        ZombieSprite.APPROACH_PLAYER_ACCEL;
    v.subtract(p).scaleToLength(Math.random() * accel).rot(Math.random() - 0.5);
    this.accelerate(v);
    foundPlayer = true;
  }
  RayScan.free(rayScan);
  return foundPlayer;
};

ZombieSprite.prototype.onSpriteHit = function(hitSprite) {
  if (this.world.isPlayerSpriteId(hitSprite.id)) {
    this.world.getPlayerSprite().touchedByAZombie();
  }
  return true;
};

ZombieSprite.prototype.die = function() {
  this.painter.die();
};
/**
 * @constructor
 */
function ZombieSpriteFactory(baseTemplate) {
  this.baseTemplate = baseTemplate;
}

ZombieSpriteFactory.prototype.createXY = function(x, y) {
  var r = Transformer.BOX_RADIUS;
  return new ZombieSprite(
      this.baseTemplate
          .makeMovable()
          .setGroup(Vorp.MONSTER_GROUP)
          .setPainter(new ZombiePainter())
          .setPosXY(x, y)
          .setVelXY(0, 0)
          .setRadXY(r, r)
          .setMass(1));
};

/**
 * @constructor
 */
function HugPoint(vec, touches) {
  this.vec = vec;
  this.touches = touches;
}

/**
 * Address of a particular jack in a Vorp instance.
 * @param sprite
 * @param type
 * @param index
 * @constructor
 */
function JackAddress(sprite, type, index) {
  this.sprite = sprite;
  this.type = type;
  this.index = index;
}

JackAddress.Type = {
  INPUT: 'input',
  OUTPUT: 'output'
};


/**
 * Populates a Vorp using a VedModel
 * @param {Vorp} vorp
 * @param {GameClock} gameClock
 * @param {SledgeInvalidator} sledgeInvalidator
 * @constructor
 */
function Transformer(vorp, gameClock, sledgeInvalidator) {
  this.vorp = vorp;
  this.gameClock = gameClock;
  this.sledgeInvalidator = sledgeInvalidator;

  // Maps model jackIds to JackAddress objects, to locate jacks in the Vorp instance.
  // Gets populated as sprites are created, and used when links are added.
  this.jackMap = {};
}

Transformer.BOX_RADIUS = 20;
Transformer.WALL_RADIUS = 24;

Transformer.CARDINAL_DIRECTIONS = [
  new Vec2d(0, -1),
  new Vec2d(1, 0),
  new Vec2d(0, 1),
  new Vec2d(-1, 0)
];

Transformer.MAX_HUG_DIST = 2000;
Transformer.FREE_FLOATING_DIST = 15;

/**
 * @param {GrafModel} model  stuff to add to Vorp
 */
Transformer.prototype.transformModel = function(model) {
  var id, cluster;

  // Add all wall sprites first,
  // so wallhugger rayscans will see them.
  for (id in model.clusters) {
    cluster = model.clusters[id];
    if (cluster.getType() == VedType.WALL) {
      this.vorp.addSprites(this.transformCluster(cluster));
    }
  }

  // Compile all non-wall sprites before adding them,
  // so the wallhugger rayscans will only see the walls.
  var sprites = [];
  for (id in model.clusters) {
    cluster = model.clusters[id];
    if (cluster.getType() != VedType.WALL) {
      var clusterSprites = this.transformCluster(model.clusters[id]);
      for (var i = 0; i < clusterSprites.length; i++) {
        sprites.push(clusterSprites[i]);
      }
    }
  }
  this.vorp.addSprites(sprites);

  for (id in model.links) {
    this.transformLink(model.links[id], model);
  }
};

Transformer.prototype.createBaseTemplate = function() {
  return VorpSpriteTemplate.createBase(this.vorp, this.gameClock, this.sledgeInvalidator);
};

Transformer.prototype.mid = function(a, b) {
  return (a + b) / 2;
};

Transformer.prototype.rad = function(a, b, r) {
  return Math.abs(a - b) / 2 + r;
};

/**
 * Transforms graf clusters into sprites.
 * @param {GrafCluster} cluster
 * @return {Array.<Sprite>} an array of sprites
 */
Transformer.prototype.transformCluster = function(cluster) {
  var sprites = [];
  var controlVec, controlSprite, template, sprite, part, hugPoints;
  var parts = cluster.getPartList();
  switch (cluster.getType()) {

    case VedType.AND:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeIntangible()
          .setPos(controlVec);
      sprite = new AndSprite(template);
      this.transformJacks(sprite, part.getJackList());
      sprites.push(sprite);
      break;

    case VedType.ANTI_ZOMBIE_TURRET:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new TurretPainter());
      this.positionMonoHugger(template, controlVec,
          Transformer.WALL_RADIUS * 1.5, Transformer.WALL_RADIUS * 1.3);
      sprite = new TurretSprite(template);
      sprite.setTargetPos(Vec2d.alongRayDistance(
          this.calcMonoHugPoint(controlVec).vec, controlVec,
          TurretSprite.SCAN_RANGE));
//      this.transformJacks(sprite, part.getJackList());
      sprites.push(sprite);
      break;

    case VedType.BEAM_SENSOR:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      hugPoints = this.calcDoubleHugPoints(controlVec);

      // BeamerSprite
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new BeamerPainter());
      this.positionHugger(template, hugPoints[0], controlVec,
          0.5 * Transformer.WALL_RADIUS,
          0.6 * Transformer.WALL_RADIUS);
      var beamer = new BeamerSprite(template);
      this.transformJacks(beamer, part.getJackList());
      sprites.push(beamer);

      // SensorSprite
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new RectPainter('#888'));
      this.positionHugger(template, hugPoints[1], controlVec,
          0.6 * Transformer.WALL_RADIUS,
          0.2 * Transformer.WALL_RADIUS);
      var sensor = new SensorSprite(template);
      sprites.push(sensor);
      beamer.setTargetSprite(sensor);
      break;

    case VedType.BIG_BLOCK:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeMovable()
          .setPainter(new RectPainter("#dd4"))
          .setPos(controlVec)
          .setRadXY(Transformer.BOX_RADIUS * 2, Transformer.BOX_RADIUS * 2)
          .setMass(4);
      sprite = new BlockSprite(template);
      sprites.push(sprite);
      break;

    case VedType.BLOCK:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeMovable()
          .setPainter(new RectPainter("#dd4"))
          .setPos(controlVec)
          .setRadXY(Transformer.BOX_RADIUS, Transformer.BOX_RADIUS)
          .setMass(1);
      sprite = new BlockSprite(template);
      sprites.push(sprite);
      break;

    case VedType.BUTTON:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new ButtonPainter());
      this.positionMonoHugger(template, controlVec,
          Transformer.WALL_RADIUS * 1.9, Transformer.WALL_RADIUS * 0.6);
      sprite = new ButtonSprite(template);
      this.transformJacks(sprite, part.getJackList());
      sprites.push(sprite);
      break;

    case VedType.DOOR:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);

      // DoorControlSprite
      template = this.createBaseTemplate()
          .makeIntangible()
          .setPos(controlVec);
      controlSprite = new DoorControlSprite(template);
      this.transformJacks(controlSprite, part.getJackList());
      sprites.push(controlSprite);

      // DoorSprite x2
      hugPoints = this.calcDoubleHugPoints(controlVec);
      var butts = [];
      butts[0] = this.getButt(hugPoints[0], controlVec, 0);
      butts[1] = this.getButt(hugPoints[1], controlVec, 0);
      var midpoint = Vec2d.midpoint(butts[0], butts[1]);
      for (var i = 0; i < 2; i++) {
        template = this.createBaseTemplate()
            .makeImmovable()
            .setPainter(new RectPainter("#aaa"));
        //var butt = this.getButt(hugPoints[i], midpoint, 0);
        sprite = new DoorSprite(template, butts[i].x, butts[i].y, midpoint.x, midpoint.y);
        controlSprite.addDoorSprite(sprite);
        sprites.push(sprite);
      }
      break;

    case VedType.EXIT:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new RectPainter("#080"))
          .setPos(controlVec)
          .setRadXY(Transformer.BOX_RADIUS * 1.5, Transformer.BOX_RADIUS * 1.5);
      sprite = new ExitSprite(template);
      sprite.setUrl(parts[0].data['url']);
      sprites.push(sprite);
      break;

    case VedType.GRIP:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new GripPainter());
      this.positionMonoHugger(template, controlVec,
          Transformer.WALL_RADIUS, Transformer.WALL_RADIUS * 0.5);
      sprite = new GripSprite(template);
      sprite.setTargetPos(Vec2d.alongRayDistance(
          this.calcMonoHugPoint(controlVec).vec, controlVec,
          Transformer.BOX_RADIUS * 4 + Transformer.WALL_RADIUS * 0.5));
      this.transformJacks(sprite, part.getJackList());
      sprites.push(sprite);
      break;

    case VedType.NOT:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeIntangible()
          .setPos(controlVec);
      sprite = new NotSprite(template);
      this.transformJacks(sprite, part.getJackList());
      sprites.push(sprite);
      break;

    case VedType.PLAYER_ASSEMBLER:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new PlayerAssemblerPainter());
      this.positionMonoHugger(template, controlVec,
          Transformer.WALL_RADIUS * 4, Transformer.WALL_RADIUS);
      sprite = new PlayerAssemblerSprite(template,
          new PlayerSpriteFactory(this.createBaseTemplate()));
      // there's enough room to assemble a player sprite
      sprite.setTargetPos(Vec2d.alongRayDistance(
          this.calcMonoHugPoint(controlVec).vec, controlVec,
          Transformer.WALL_RADIUS * 1.01 + Transformer.BOX_RADIUS));
      sprites.push(sprite);
      break;

    case VedType.PORTAL:
      var portals = [];
      for (var i = 0; i < 2; i++) {
        controlVec = new Vec2d(parts[i].x, parts[i].y);
        template = this.createBaseTemplate()
            .makeMovable()
            .setPainter(new PortalPainter())
            .setPos(controlVec)
            .setRadXY(Transformer.BOX_RADIUS * 1.1, Transformer.BOX_RADIUS * 1.1)
            .setMass(1.1);
        portals[i] = new PortalSprite(template);
        sprites.push(portals[i]);
      }
      portals[0].setTargetSprite(portals[1]);
      portals[1].setTargetSprite(portals[0]);
      break;

    case VedType.TIMER:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeIntangible()
          .setPainter(new TimerPainter())
          .setPos(controlVec);
      sprite = new TimerSprite(template);
      sprite.setTimeoutLength(Number(parts[0].data['timeout']));
      this.transformJacks(sprite, part.getJackList());
      sprites.push(sprite);
      break;

    case VedType.TOGGLE:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeIntangible()
          .setPos(controlVec);
      sprite = new ToggleSprite(template);
      this.transformJacks(sprite, part.getJackList());
      sprites.push(sprite);
      break;

    case VedType.WALL:
      if (parts.length != 2) {
        throw Error("Expected 2 parts in a wall cluster, found " + parts.length +
            ", in cluster with id " + cluster.id);
      }
      var x0 = parts[0].x;
      var y0 = parts[0].y;
      var x1 = parts[1].x;
      var y1 = parts[1].y;
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new RectPainter("rgb(70, 70, 210)"))
          .setPosXY(this.mid(x0, x1), this.mid(y0, y1))
          .setRadXY(
              this.rad(x0, x1, Transformer.WALL_RADIUS),
              this.rad(y0, y1, Transformer.WALL_RADIUS));
      sprite = new WallSprite(template);
      sprites.push(sprite);
      break;

    case VedType.ZAPPER:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      hugPoints = this.calcDoubleHugPoints(controlVec);

      // ZapperControlSprite
      template = this.createBaseTemplate()
          .makeIntangible()
          .setPos(controlVec);
      controlSprite = new ZapperControlSprite(template);
      this.transformJacks(controlSprite, part.getJackList());
      sprites.push(controlSprite);

      // ZapperSprite
      var butt0 = this.getButt(hugPoints[0], controlVec, 0.2);
      var butt1 = this.getButt(hugPoints[1], controlVec, 0.2);
      template = this.createBaseTemplate()
          .makeImmovable()
          .setGroup(Vorp.ZAPPER_GROUP)
          .setPainter(new ZapperPainter(true))
          .setPos(Vec2d.midpoint(butt0, butt1))
          .setRadXY(
              this.rad(butt0.x, butt1.x, Transformer.WALL_RADIUS * 0.4 * (butt0.x - butt1.x ? -1 : 1)),
              this.rad(butt0.y, butt1.y, Transformer.WALL_RADIUS * 0.4 * (butt0.y - butt1.y ? -1 : 1)));
      sprite = new ZapperSprite(template);
      controlSprite.setZapperSprite(sprite);
      sprites.push(sprite);

      // Zapper's WallSprite x2
      for (var i = 0; i < 2; i++) {
        template = this.createBaseTemplate()
            .makeImmovable()
            .setPainter(new RectPainter("#88f"));
        this.positionHugger(template, hugPoints[i], controlVec,
            Transformer.WALL_RADIUS, Transformer.WALL_RADIUS * 0.5);
        sprite = new WallSprite(template);
        sprites.push(sprite);
      }
      break;

    case VedType.ZOMBIE:
      part = parts[0];
      sprite = new ZombieSpriteFactory(this.createBaseTemplate())
          .createXY(part.x, part.y);
      sprites.push(sprite);
      break;

    case VedType.ZOMBIE_ASSEMBLER:
      part = parts[0];
      controlVec = new Vec2d(part.x, part.y);
      template = this.createBaseTemplate()
          .makeImmovable()
          .setPainter(new PlayerAssemblerPainter());
      this.positionMonoHugger(template, controlVec,
          Transformer.WALL_RADIUS * 4, Transformer.WALL_RADIUS);
      sprite = new ZombieAssemblerSprite(template);
      sprite.setTargetPos(Vec2d.alongRayDistance(
          this.calcMonoHugPoint(controlVec).vec, controlVec,
          Transformer.WALL_RADIUS * 1.01 + Transformer.BOX_RADIUS));
      sprites.push(sprite);
      break;

  }
  return sprites;
};

Transformer.prototype.transformJacks = function(sprite, jackList) {
  for (var i = 0; i < jackList.length; i++) {
    var jack = jackList[i];
    var type = jack.getType();
    var jackIndexMap = null;
    if (type === JackAddress.Type.INPUT) {
      jackIndexMap = sprite.inputIds;
    } else if (type === JackAddress.Type.OUTPUT) {
      jackIndexMap = sprite.outputIds;
    }
    this.jackMap[jack.id] = new JackAddress(sprite, type, jackIndexMap[jack.getName()]);
  }
};

/**
 * @param {GrafLink} link
 * @param {GrafModel} model
 */
Transformer.prototype.transformLink = function(link, model) {
  var jack1 = model.getJack(link.jackId1);
  var jack2 = model.getJack(link.jackId2);
  if (jack1.isOutput() == jack2.isOutput()) {
    throw Error('Both jacks are ' + (jack1.isOutput() ? 'output' : 'input'));
  }
  var ja1 = this.jackMap[link.jackId1];
  var ja2 = this.jackMap[link.jackId2];
  if (jack1.isInput()) {
    // Logic links require the first jack to be output, and the second to be input.
    // They're backwards, so swap them.
    var tmp = ja1;
    ja1 = ja2;
    ja2 = tmp;
  }
  this.vorp.addLogicLink(new LogicLink(ja1.sprite.id, ja1.index, ja2.sprite.id, ja2.index));
};

/**
 * Sets the template's pos and rad.
 * @param {SpriteTemplate} template
 * @param {Vec2d} controlVec  the control point from the graf cluster
 * @param {number} width  the length of the edge that touches the wall
 * @param {number} height  how far the sprite extends away from the wall
 */
Transformer.prototype.positionMonoHugger = function(template, controlVec, width, height) {
  var hugPoint = this.calcMonoHugPoint(controlVec);
  this.positionHugger(template, hugPoint, controlVec, width, height);
};

/**
 * @param template
 * @param hugPoint
 * @param facingPoint
 * @param width
 * @param height
 */
Transformer.prototype.positionHugger = function(template, hugPoint, facingPoint, width, height) {
  var butt = this.getButt(hugPoint, facingPoint, height);
  var normalUnitVec = new Vec2d().set(facingPoint).subtract(butt).scaleToLength(1);
  template.pos.set(normalUnitVec).scaleToLength(height / 2).add(butt);

  template.rad.set(normalUnitVec).scaleToLength(height / 2);
  template.rad.add(normalUnitVec.rot90Right().scaleToLength(width / 2));
  template.rad.abs();
};

Transformer.prototype.calcMonoHugPoint = function(controlVec) {
  var hugPoints = this.calcHugPoints(controlVec);
  var index = this.indexOfClosestTouchingPoint(controlVec, hugPoints);
  return hugPoints[index];
};

Transformer.prototype.calcDoubleHugPoints = function(controlVec) {
  var hugPoints = this.calcHugPoints(controlVec);
  var index = this.indexOfClosestTouchingPoint(controlVec, hugPoints);
  var oppositeIndex = (index + 2) % 4;
  return [hugPoints[index], hugPoints[oppositeIndex]];
};

/**
 * @param {Vec2d} controlVec
 * @return {Array<HugPoint>} an array of four HugPoint objs
 * in cardinal directions from controlVec,
 * where a rayscan intersected a wall, or at the maximum scan length.
 */
Transformer.prototype.calcHugPoints = function(controlVec) {
  var hugPoints = [];
  for (var i = 0; i < Transformer.CARDINAL_DIRECTIONS.length; i++) {
    var targetPos = new Vec2d()
        .set(Transformer.CARDINAL_DIRECTIONS[i])
        .scale(Transformer.MAX_HUG_DIST)
        .add(controlVec);
    var rayScan = new RayScan(
        controlVec.x, controlVec.y,
        targetPos.x, targetPos.y,
        1, 1);
    // time is zero to one
    var time, touches;
    if (this.vorp.rayScan(rayScan, Vorp.GENERAL_GROUP)) {
      time = rayScan.time;
      touches = true;
    } else {
      time = 1;
      touches = false;
    }
    hugPoints[i] = new HugPoint(Vec2d.alongRayFraction(controlVec, targetPos, time), touches);
  }
  return hugPoints;
};

Transformer.prototype.indexOfClosestTouchingPoint = function(controlVec, hugPoints) {
  var lowestDistSquared = Infinity;
  var index = 0;
  for (var i = 0; i < hugPoints.length; i++) {
    if (hugPoints[i].touches) {
      var distSquared = hugPoints[i].vec.distanceSquared(controlVec);
      if (distSquared < lowestDistSquared) {
        lowestDistSquared = distSquared;
        index = i;
      }
    }
  }
  return index;
};

/**
 * If a hugpoint is touching its target, then it is returned unchanged.
 * If it's hanging in space, then this returns a vec that's much closer
 * to the contronVec, not one that's out at the max scan distance.
 * @param {HugPoint} hugPoint
 * @param {Vec2d} contronVec
 * @param {number} height
 * @return {Vec2d}
 */
Transformer.prototype.getButt = function(hugPoint, contronVec, height) {
  var butt;
  if (hugPoint.touches) {
    butt = hugPoint.vec;
  } else {
    butt = new Vec2d().set(hugPoint.vec).subtract(contronVec)
        .scaleToLength(Transformer.FREE_FLOATING_DIST + height)
        .add(contronVec);
  }
  return butt;
};
/**
 * Top level class for the Vorp EDitor.
 * @param {Element} rootNode
 * @param {Stor} stor
 * @constructor
 */
function VedApp(rootNode, stor) {
  this.rootNode = rootNode;
  this.stor = stor;
  this.listeningToHashChanges = false;
  this.squisher = new plex.Squisher(VedApp.DICT);
}

VedApp.DICT = ['],['];

VedApp.CLIPBOARD_STORAGE_KEY = 'vedClipBoard';

/**
 * @enum {string}
 */
VedApp.Params = {
  MODE: 'mode',
  LEVEL: 'level'
};

/**
 * @enum {string}
 */
VedApp.Mode = {
  EDIT: 'edit',
  PLAY: 'play',
  JSON: 'json'
};

VedApp.LevelPrefix = {
  BUILTIN: 'builtin~',
  LOCAL: 'local~',
  DATA: 'data~'
};

VedApp.prototype.render = function() {

  if (!this.listeningToHashChanges) {
    plex.event.addListener(window, 'hashchange', this.getHashChangeListener());
    this.listeningToHashChanges = true;
  }

  // Stop any running timer loops instance.
  if (this.looper) {
    this.looper.stopLoop();
    this.looper = null;
  }

  this.rootNode.innerHTML = '';
  var appDiv = plex.dom.ce('div', this.rootNode);

  var hash = plex.url.getFragment();
  var query = plex.url.decodeQuery(hash);
  var mode = query[VedApp.Params.MODE];
  var levelAddress = query[VedApp.Params.LEVEL];
  if (!levelAddress) {
    for (var key in query) {
      if (!query[key]) {
        // The "default key" is level, and level becomes the value.
        levelAddress = key;
      }
    }
  }

  mode = mode || VedApp.Mode.PLAY;
  this.renderModeSwitch(appDiv, levelAddress, mode);
  if (!levelAddress) {
    this.renderDirectory(appDiv, mode);
  } else {
    if (this.maybeRenderLevelNotFound(appDiv, levelAddress)) return;
    this.renderLevelHeader(appDiv, levelAddress, mode);
    if (mode == VedApp.Mode.PLAY) {
      this.renderPlayMode(appDiv, levelAddress);
    } else if (mode == VedApp.Mode.EDIT) {
      this.renderEditMode(appDiv, levelAddress);
    } else if (mode == VedApp.Mode.JSON) {
      this.renderJsonMode(appDiv, levelAddress);
    }
  }
};

VedApp.prototype.getHashChangeListener = function() {
  var self = this;
  return function() {
    self.render();
  };
};

VedApp.prototype.renderDirectory = function(appDiv, mode) {
  var centerDiv = plex.dom.ce('div', appDiv);
  centerDiv.className = 'center';
  centerDiv.innerHTML +=
      '<div class=center>' +
      '<h1>What?</h1>' +
      'Vorp is a free 2D physics-based action/puzzle game that runs in modern web browsers.' +
      '<p>It\'s written in JavaScript, using the HTML5 &lt;canvas&gt; element to render all the graphics. ' +
      'There are few sound effects, the graphics are terrible, and you need a keyboard to play.' +
      '<p>It works well in <a href="http://www.google.com/chrome/">Chrome</a>, ' +
      '<a href="http://www.mozilla.org/firefox">Firefox</a>, ' +
      '<a href="http://www.apple.com/safari/">Safari</a>, and ' +
      '<a href="http://www.opera.com/browser">Opera</a>.<br>' +
      '<a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home">IE 9</a> and up might work.' +
      '<p>The built-in editor stores your work on your computer using localstorage. ' +
      'You can share what you make, by sending a URL.' +
      '<h1>Official Levels</h1>' +
      '</div>';

  var self = this;
  function renderRow(levelAddress) {
    var playLink = plex.dom.ce('a', centerDiv);
    playLink.href = '#' + plex.url.encodeQuery(self.createQueryObj(mode, levelAddress));
    var split = self.splitLevelAddress(levelAddress);
    var dispName = '';
    if (split[0] == VedApp.LevelPrefix.LOCAL) {
      dispName += split[1] + ' - ';
    }
    try {
      dispName += self.getTitleForLevelAddress(levelAddress);
    } catch (e) {
      console.log(e);
      dispName += 'LEVEL CORRUPTED';
    }
    plex.dom.ct(dispName, playLink);
    plex.dom.appendClass(playLink, 'vedDirectoryLink');
  }

  // builtin levels
  var levelAddresss = plex.object.keys(vorpLevels);
  levelAddresss.sort();
  for (var i = 0; i < levelAddresss.length; i++) {
    renderRow(levelAddresss[i]);
  }

  plex.dom.ce('p', centerDiv);

  // local levels
  var localNames = this.stor.getNames();
  if (localNames.length) {
    centerDiv.innerHTML += '<h1>Editable Levels</h1>';
  }
  localNames.sort();
  for (var i = 0; i < localNames.length; i++) {
    renderRow(VedApp.LevelPrefix.LOCAL + localNames[i]);
  }

  plex.dom.ce('br', centerDiv);

  // create level button
  var createButton = plex.dom.ce('button', centerDiv);
  plex.dom.appendClass(createButton, 'vedButton');
  plex.dom.ct('Create new level', createButton);
  createButton.onclick = function() {
    var newName = prompt("New level name?");
    if (!newName) {
//      alert("That's not a name.");
      return;
    }
    if (self.stor.containsName(newName)) {
      alert("There's already a level with that name");
      return;
    }
    self.createLevel(newName, self.getNewLevelOps());
    self.render();
  };
};

VedApp.prototype.getNewLevelOps = function() {
  var metaTemplate = VedTemplates.getClusterMap()[VedType.META];
  return this.getTemplatizer().detemplatize([[metaTemplate.id, 1, 'untitled', 'nondescript']]);
};

VedApp.prototype.createQueryObj = function(mode, levelAddress) {
  var query = {};
  if (mode != VedApp.Mode.PLAY) query[VedApp.Params.MODE] = mode;
  if (levelAddress) query[VedApp.Params.LEVEL] = levelAddress;
  return query;
};

VedApp.prototype.renderModeSwitch = function(appDiv, levelAddress, renderMode) {
  var order = [
    VedApp.Mode.PLAY,
    VedApp.Mode.EDIT];
  var modesDiv = plex.dom.ce('div', appDiv);
  modesDiv.className = 'vedModesDiv';
  for (var i = 0; i < order.length; i++) {
    var mode = order[i];
    var modeElem;
    if (renderMode == mode) {
      modeElem = plex.dom.ce('span', modesDiv);
    } else {
      modeElem = plex.dom.ce('a', modesDiv);
      modeElem.href = '#' + plex.url.encodeQuery(this.createQueryObj(mode, levelAddress));
      modeElem.onclick = this.getModeLinkFn(mode, levelAddress);
    }
    modeElem.className = 'vedModeLink';
    plex.dom.ct(mode, modeElem);
  }
};

VedApp.prototype.renderLevelHeader = function(appDiv, levelAddress, mode) {
  var leftLink = plex.dom.ce('a', appDiv);
  leftLink.href = '#' + plex.url.encodeQuery(this.createQueryObj(mode, null));
  leftLink.innerHTML = '&laquo;';
  leftLink.className = 'vedLeftLink';

  // name
  var nameSpan = plex.dom.ce('span', appDiv);
  nameSpan.className = 'vedLevelName';
  var nameText = levelAddress;
  if (nameText.indexOf(VedApp.LevelPrefix.DATA) == 0) {
    if (nameText.length > 20) {
      nameText = nameText.substring(0, 8) + '...' +
          nameText.substring(nameText.length - 8);
    }
  }
  plex.dom.ct(nameText, nameSpan);

  plex.dom.ce('div', appDiv).className = 'vedButtonBar';
  plex.dom.ce('div', appDiv).className = 'vedMetaWrapper';

  this.renderMetaContent(levelAddress, mode);
};

VedApp.prototype.renderMetaContent = function(levelAddress, mode) {
  var metaWrapper = document.querySelector('.vedMetaWrapper');
  metaWrapper.innerHTML = '';

  // title
  var titleElem = plex.dom.ce('span', metaWrapper);
  titleElem.className = 'vedLevelTitle';

  // meta-data edit button
  if (mode == VedApp.Mode.EDIT) {
    var metaButtonWrap = plex.dom.ce('span', metaWrapper);
    metaButtonWrap.style.position = 'relative';
    var metaEditElem = plex.dom.ce('button', metaButtonWrap);
    metaEditElem.className = 'vedMetaEdit';
    plex.dom.ct(GrafRend.DATA_BUTTON_TEXT, metaEditElem);
  }

  // desc
  var descElem = plex.dom.ce('div', metaWrapper);
  descElem.className = 'vedLevelDesc';

  this.updateMetaContent(levelAddress);
};

VedApp.prototype.updateMetaContent = function(levelAddress) {
  document.querySelector('.vedLevelTitle').innerHTML =
      plex.string.textToHtml(this.getTitleForLevelAddress(levelAddress)) || '&nbsp;';
  document.querySelector('.vedLevelDesc').innerHTML =
      plex.string.textToHtml(this.getDescForLevelAddress(levelAddress)) || '&nbsp;';
};

VedApp.prototype.getModeLinkFn = function(mode, levelAddress) {
  var self = this;
  return function(event) {
    event && event.preventDefault();
    var href = '#' + plex.url.encodeQuery(self.createQueryObj(mode, levelAddress));
    history.pushState(null, document.title, href);
    self.render();
  };
};

VedApp.prototype.splitLevelAddress = function(levelAddress) {
  for (var key in VedApp.LevelPrefix) {
    var prefix = VedApp.LevelPrefix[key];
    if (levelAddress.indexOf(prefix) == 0 && levelAddress.length > prefix.length) {
      return [prefix, levelAddress.substring(prefix.length)];
    }
  }
  // default prefix is BUILTIN
  return [VedApp.LevelPrefix.BUILTIN, levelAddress];
};

VedApp.prototype.getGrafForLevelAddress = function(levelAddress) {
  var ops = [];
  var split = this.splitLevelAddress(levelAddress);
  var levelPrefix = split[0];
  var name = split[1];
  if (levelPrefix == VedApp.LevelPrefix.BUILTIN) {
    ops = this.getTemplatizer().detemplatize(vorpLevels[name]);
  } else if (levelPrefix == VedApp.LevelPrefix.LOCAL) {
    var opStor = new OpStor(this.stor, name);
    ops = opStor.getValuesAfterIndex(-1);
    for (var i = 0; i < ops.length; i++) {
      ops[i] = ops[i][OpStor.field.OP];
    }
  } else if (levelPrefix == VedApp.LevelPrefix.DATA) {
    var json = this.squisher.unsquish(name);
    var paramList = JSON.parse(json);
    ops = this.getTemplatizer().detemplatize(paramList);
  }
  var graf = new GrafModel();
  graf.applyOps(ops);
  return graf;
};

VedApp.prototype.getOpsForLevelAddress = function(levelAddress) {
  return this.getGrafForLevelAddress(levelAddress).createOps();
};

VedApp.prototype.getMetaClusterForGraf = function(graf) {
  for (var id in graf.clusters) {
    var cluster = graf.getCluster(id);
    if (cluster.data['type'] == VedType.META) {
      return cluster;
    }
  }
  return null;
};

VedApp.prototype.getMetaClusterForLevelAddress = function(levelAddress) {
  var graf = this.getGrafForLevelAddress(levelAddress);
  return this.getMetaClusterForGraf(graf);
};

VedApp.prototype.getTitleForLevelAddress = function(levelAddress) {
  var mc = this.getMetaClusterForLevelAddress(levelAddress);
  return mc ? mc.data['title'] : '';
};

VedApp.prototype.getDescForLevelAddress = function(levelAddress) {
  var mc = this.getMetaClusterForLevelAddress(levelAddress);
  return mc ? mc.data['desc'] : '';
};

VedApp.prototype.maybeRenderLevelNotFound = function(appDiv, levelAddress) {
  var splitName = this.splitLevelAddress(levelAddress);
  if (splitName[0] == VedApp.LevelPrefix.BUILTIN) {
    if (vorpLevels[splitName[1]]) {
      return false;
    }
  } else if (splitName[0] == VedApp.LevelPrefix.LOCAL) {
    if (plex.array.contains(this.stor.getNames(), splitName[1])) {
      return false;
    }
  } else if (splitName[0] == VedApp.LevelPrefix.DATA) {
    return false;
  }
  var errorDiv = plex.dom.ce('div', appDiv);
  plex.dom.appendClass(errorDiv, 'vedError');
  plex.dom.ct('The level "' + levelAddress + '" was not found.', errorDiv);
  return true;
};

VedApp.prototype.renderCopyButton = function(buttonBarElem, levelAddress) {
  var btn = plex.dom.ce('button', buttonBarElem);
  plex.dom.appendClass(btn, 'vedButton');
  plex.dom.ct('copy level', btn);
  var self = this;
  btn.onclick = function () {
    var newName = prompt("New level name?");
    if (!newName) {
//      alert("That's not a name.");
      return;
    }
    if (self.stor.containsName(newName)) {
      alert("There's already a level with that name");
      return;
    }
    self.createLevel(newName, self.getOpsForLevelAddress(levelAddress));
    self.getModeLinkFn(VedApp.Mode.EDIT, VedApp.LevelPrefix.LOCAL + newName)();
  };
};

VedApp.prototype.renderDeleteButton = function(buttonBarElem, levelName) {
  var btn = plex.dom.ce('button', buttonBarElem);
  plex.dom.appendClass(btn, 'vedButton');
  plex.dom.ct('delete', btn);
  var self = this;
  btn.onclick = function () {
    if (confirm("Are you sure you want to delete this level?")) {
      var opStor = new OpStor(self.stor, levelName);
      opStor.remove();
      plex.url.setFragment(plex.url.encodeQuery(self.createQueryObj(VedApp.Mode.EDIT)));
    }
  };
};

VedApp.prototype.renderShareButton = function(buttonBarElem, levelAddress) {
  var btn = plex.dom.ce('button', buttonBarElem);
  plex.dom.appendClass(btn, 'vedButton');
  plex.dom.ct('share', btn);
  var self = this;
  btn.onclick = function () {
    // hide the pane if it is showing
    var pane = document.querySelector('.vedSharePane');
    if (pane) {
      pane.parentNode.removeChild(pane);
      return;
    }
    var json = JSON.stringify(self.getTemplatizedJsonForLevel(levelAddress));
    var base64 = self.squisher.squish(json);
    pane = plex.dom.ce('div', buttonBarElem);
    pane.className = 'vedSharePane';
    plex.dom.ce('div', pane).innerHTML = plex.string.textToHtml(
        'This level is encoded in the URL below. ' +
            'You can email it, IM it, post it, bookmark it, whatever.\n' +
            'Anyone who opens it can to play it, copy and edit, and re-share it.', true);
    // The "level=" prefix must be included, to prevent the first "=" sign
    // in the data from being interpreted as a key/value separator.
    var url = [
      location.origin, location.pathname, '#',
      VedApp.Params.LEVEL, '=', VedApp.LevelPrefix.DATA, base64].join('');
    var a = plex.dom.ce('a', pane);
    a.className = 'selectable vedShareLink';
    a.href = url;
    a.innerHTML = plex.string.textToHtml(url);
    var closeDiv = plex.dom.ce('div', pane);
    closeDiv.style.textAlign = 'center';
    var closeBtn = plex.dom.ce('button', closeDiv);
    closeBtn.className = 'vedButton';
    closeBtn.innerText = 'close';
    closeBtn.onclick = function() {
      pane.parentNode.removeChild(pane);
    }
  };
};

VedApp.prototype.renderEditMode = function(appDiv, levelAddress) {
  var split = this.splitLevelAddress(levelAddress);
  var levelPrefix = split[0];
  var levelName = split[1];

  var buttonBarElem = document.querySelector('.vedButtonBar');
  var notice;
  if (levelPrefix == VedApp.LevelPrefix.BUILTIN) {
    notice = plex.dom.ce('span', buttonBarElem);
    notice.className = 'vedEditorNotice';
    plex.dom.ct('Official level. Copy before editing.', notice);
  }
  if (levelPrefix == VedApp.LevelPrefix.DATA) {
    notice = plex.dom.ce('span', buttonBarElem);
    notice.className = 'vedEditorNotice';
    plex.dom.ct('Data-URL level. Copy before editing.', notice);
  }

  this.renderCopyButton(buttonBarElem, levelAddress);
  if (levelPrefix == VedApp.LevelPrefix.LOCAL) {
    this.renderDeleteButton(buttonBarElem, levelName);
    this.renderShareButton(buttonBarElem, levelAddress);
  }

  var plexKeys = new plex.Keys();
  var grafUiKeyCombos = new GrafUiKeyCombos(plexKeys);
  this.renderHelp(appDiv, plexKeys, grafUiKeyCombos);
  var clipboard = this.createClipboard(appDiv);
  var grafEd, grafUi, editable;
  if (levelPrefix == VedApp.LevelPrefix.LOCAL) {
    editable = true;
    grafEd = GrafEd.createFromOpStor(new OpStor(this.stor, levelName));
  } else {
    editable = false;
    var model = new GrafModel();
    var ops = this.getOpsForLevelAddress(levelAddress);
    model.applyOps(ops);
    grafEd = new GrafEd(model);
  }
  grafUi = this.createGrafUi(appDiv, grafEd, clipboard, grafUiKeyCombos);
  grafUi.setEditable(editable);
  grafUi.startLoop();
  var metaEditElem = document.querySelector('.vedMetaEdit');
  metaEditElem.style.display = editable ? '' : 'none';
  if (editable) {
    var metaCluster = this.getMetaClusterForGraf(grafEd.model);
    var self = this;
    metaEditElem.onclick = function() {
      grafUi.startEditingData(metaCluster.id, ['title', 'desc'], function() {
        self.updateMetaContent(levelAddress);
      });
    };
  }
  this.looper = grafUi;
};

VedApp.prototype.renderHelp = function(appDiv, plexKeys, grafUiKeyCombos) {
  var wrapper = plex.dom.ce('div', appDiv);
  wrapper.id = 'gedHelpWrapper';
  wrapper.style.display = 'none';
  var gedHelp = new GedHelp(GedMsgs, plexKeys, grafUiKeyCombos);
  wrapper.innerHTML = gedHelp.formatHtml();

  var toggle = plex.dom.ce('button', appDiv);
  toggle.id = 'gedHelpToggle';
  toggle.onclick = this.getToggleFunc(wrapper.id);
  toggle.innerHTML = GedMsgs.help.HELP;
};

VedApp.prototype.getToggleFunc = function(idToToggle) {
  return function() {
    var helpDiv = document.getElementById(idToToggle);
    helpDiv.style.display = helpDiv.style.display == 'none' ? 'block' : 'none';
  };
};

VedApp.prototype.renderSysClipWrapper = function(appDiv) {
  var wrapper = plex.dom.ce('div', appDiv);
  wrapper.id = 'gedSysClipsWrapper';
  wrapper.style.display = 'none';

  var toggle = plex.dom.ce('button', appDiv);
  toggle.id = 'gedSysClipsToggle';
  toggle.onclick = this.getToggleFunc(wrapper.id);
  toggle.innerHTML = GedMsgs.TOGGLE_CLIP_MENU;
  return wrapper;
};

VedApp.prototype.createGrafUi = function(appDiv, grafEd, clipboard, grafUiKeyCombos) {
  var canvas = plex.dom.ce('canvas', appDiv);
  canvas.className = 'vedEditCanvas';
  var model = grafEd.getModel();
  var camera = new Camera();
  var renderer = new Renderer(canvas, camera);
  var plugin = new VedUiPlugin(renderer);

  var pluginFactory = {
    create: function(renderer) {
      return new VedUiPlugin(renderer);
    }
  };
  var clipMenu = new ClipMenu(
      VedSysClipListBuilder.createDefaultInstance(),
      pluginFactory,
      this.renderSysClipWrapper(appDiv));
  var grafGeom = new GrafGeom(model);
  var grafRend = new GrafRend(plugin, renderer, grafGeom);
  return new GrafUi(grafEd, renderer, grafRend, grafGeom, plugin,
      clipboard, clipMenu,
      grafUiKeyCombos);
};

VedApp.prototype.createClipboard = function(appDiv) {
  var canvas = plex.dom.ce('canvas', appDiv);
  canvas.className = 'vedClipboard';
  canvas.height = 100;
  canvas.width = 100;
  var model = new GrafModel();
  var camera = new Camera();
  var renderer = new Renderer(canvas, camera);
  var grafGeom = new GrafGeom(model);
  var plugin = new VedUiPlugin(renderer);
  var grafRend = new GrafRend(plugin, renderer, grafGeom);
  return new Clipboard(grafRend, localStorage, VedApp.CLIPBOARD_STORAGE_KEY);
};

VedApp.prototype.createVorpFromGraf = function(graf) {
  var gameClock = new GameClock();
  var sledgeInvalidator = new SledgeInvalidator();
  var vorpOut = new VorpOut(new Renderer(canvas, new Camera()), SoundFx.createInstance());
  var vorp = Vorp.createVorp(vorpOut, gameClock, sledgeInvalidator);

  // Use Transformer to populate Vorp with Model.
  var transformer = new Transformer(vorp, gameClock, sledgeInvalidator);
  transformer.transformModel(graf);
  return vorp;
};

VedApp.prototype.renderPlayMode = function(appDiv, levelAddress) {
  var graf = this.getGrafForLevelAddress(levelAddress);

  // hacky fake header/footer to restrict the canvas positioning
  // TODO: better canvas resize cues, maybe owned by the renderer
  var fakeHeader = plex.dom.ce('div', appDiv);
  fakeHeader.id = 'levelHeader';
  var fakeFooter = plex.dom.ce('div', appDiv);
  fakeFooter.id = 'levelFooter';

  var canvas = plex.dom.ce('canvas', appDiv);
  canvas.id = 'canvas';

  // Start the game up.
  var vorp = this.createVorpFromGraf(graf);
  vorp.startLoop();
  this.looper = vorp;
};

VedApp.prototype.renumberOps = function(ops) {
  (new GrafModel()).rewriteOpIds(ops);
  return ops;
};

VedApp.prototype.getTemplatizer = function() {
  var templates = plex.object.values(VedTemplates.getClusterMap());
  plex.array.extend(templates, plex.object.values(VedTemplates.getLinkMap()));
  return new GrafTemplatizer(templates);
};

VedApp.prototype.getTemplatizedJsonForLevel = function(levelAddress) {
  var graf = new GrafModel();
  var ops = this.getOpsForLevelAddress(levelAddress);
  this.renumberOps(ops);
  graf.applyOps(ops);
  return this.getTemplatizer().templatize(graf);
};

VedApp.prototype.renderJsonMode = function(appDiv, levelAddress) {
  var div = plex.dom.ce('div', appDiv);
  div.style.clear = 'both';
  div.className = 'selectable';
  var json = this.getTemplatizedJsonForLevel(levelAddress);
  var text = JSON.stringify(json);
  text = plex.string.replace(text, '],', '],\n');
  div.innerHTML = plex.string.textToHtml(text, true);
};

VedApp.prototype.createLevel = function(name, ops) {
  var opStor = new OpStor(this.stor, name);
  opStor.touch();
  for (var i = 0; i < ops.length; i++) {
    opStor.appendOp(ops[i]);
  }
};

/**
 * @constructor
 */
function VedModel() {
}

/**
 * Static namespace only.
 * @type {Object}
 */
VedSysClipListBuilder = {};

/**
 * @return {ClipList}
 */
VedSysClipListBuilder.createDefaultInstance = function() {
  return VedSysClipListBuilder.createFromMap(
      VedSysClipListBuilder.createDefaultDataMap());
};

/**
 * @param {Object} idToGraf map from ved type name to graf for that clip
 * @return {ClipList}
 */
VedSysClipListBuilder.createFromMap = function(idToGraf) {
  var clipList = new ClipList();
  for (var id in idToGraf) {
    var graf = idToGraf[id];
    var clip = new Clip(0, id, graf);
    clipList.addClip(id, clip);
  }
  return clipList;
};

/**
 * @return {Object} map from ved type to graf for that clip
 */
VedSysClipListBuilder.createDefaultDataMap = function() {
  var map = {};

  var templates = VedTemplates.getClusterMap();
  for (var vedType in templates) {
    var template = templates[vedType];
    var id = template.id;
    var params = [id, 1]; // "1" is the cluster ID
    // X, Y
    if (vedType == VedType.WALL || vedType == VedType.PORTAL) {
      // These templates have four point coords.
      plex.array.extend(params, [-Transformer.WALL_RADIUS * 1.5, 0, Transformer.WALL_RADIUS * 1.5, 0]);
    } else {
      plex.array.extend(params, [0, 0]);
    }
    // Misc params
    if (vedType == VedType.EXIT) {
      params.push('.'); // url
    } else if (vedType == VedType.TIMER) {
      params.push(100); // timeout in game clocks (1/60 seconds)
    }
    var ops = template.generateOps(params);
    var model = new GrafModel();
    model.applyOps(ops);
    map[id] = model;
  }
  return map;
};

/**
 * @constructor
 */
function VedTemplateBuilder(id) {
  this.id = id;
  this.ops = [];
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.push = function(op) {
  this.ops.push(op);
  return this;
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.extend = function(ops) {
  plex.array.extend(this.ops, ops);
  return this;
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.cluster = function(type) {
  return this.push({
    type: GrafOp.Type.ADD_CLUSTER,
    id: GrafTemplate.PARAM
  }).data('type', type);
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.data = function(key, value) {
  return this.push({
    type: GrafOp.Type.SET_DATA,
    id: GrafTemplate.AUTO,
    key: key,
    value: value
  });
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.dataParam = function(key) {
  return this.data(key, GrafTemplate.PARAM);
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.part = function() {
  return this.push({
    type: GrafOp.Type.ADD_PART,
    id: GrafTemplate.AUTO,
    clusterId: GrafTemplate.AUTO,
    x: GrafTemplate.PARAM,
    y: GrafTemplate.PARAM
  });
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.jack = function(type, name) {
  return this.push({
    type: GrafOp.Type.ADD_JACK,
    id: GrafTemplate.AUTO,
    partId: GrafTemplate.AUTO
  }).data('type', type).data('name', name);
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.input = function(name) {
  return this.jack(JackAddress.Type.INPUT, name);
};

/**
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.output = function(name) {
  return this.jack(JackAddress.Type.OUTPUT, name);
};

/**
 * @param spriteClass A sprite class whose inputs and outputs will be
 * scraped in order to provide inputs and output jacks in this template.
 * @return {VedTemplateBuilder}
 */
VedTemplateBuilder.prototype.jacks = function(spriteClass) {
  var name, inputs = spriteClass.prototype.inputIds;
  for (name in inputs) {
    this.input(name);
  }
  var outputs = spriteClass.prototype.outputIds;
  for (name in outputs) {
    this.output(name);
  }
  return this;
};

/**
 * @return {GrafTemplate}
 */
VedTemplateBuilder.prototype.build = function() {
  return new GrafTemplate(this.id, this.ops);
};

/**
 * Static namespace only.
 * @type {Object}
 */
VedTemplates = {};

/**
 * @return {Object} A map from VedType value to GrafTemplate for that value
 */
VedTemplates.getClusterMap = function() {
  var map = {};

  function t(shortId, vedType) {
    var template = (new VedTemplateBuilder(shortId)).cluster(vedType);
    map[vedType] = template;
    return template;
  }
  // Fill the map with builders first.
  t(1, VedType.WALL).part().part();
  t(2, VedType.TIMER).part().dataParam('timeout').jacks(TimerSprite);
  t(3, VedType.AND).part().jacks(AndSprite);
  t(4, VedType.BEAM_SENSOR).part().jacks(BeamerSprite);
  t(5, VedType.BLOCK).part();
  t(6, VedType.BUTTON).part().jacks(ButtonSprite);
  t(7, VedType.DOOR).part().jacks(DoorControlSprite);
  t(8, VedType.GRIP).part().jacks(GripSprite);
  // 9 is is for links
  t(10, VedType.PLAYER_ASSEMBLER).part();
  t(11, VedType.TOGGLE).part().jacks(ToggleSprite);
  t(12, VedType.ZAPPER).part().jacks(ZapperControlSprite);
  t(13, VedType.ZOMBIE).part();
  t(14, VedType.ZOMBIE_ASSEMBLER).part();
  t(15, VedType.ANTI_ZOMBIE_TURRET).part();
  t(16, VedType.BIG_BLOCK).part();
  t(17, VedType.PORTAL).part().part();
  t(18, VedType.EXIT).part().dataParam('url');
  t(19, VedType.NOT).part().jacks(NotSprite);
  t(20, VedType.META).dataParam('title').dataParam('desc');

  // Build all templates.
  for (var vedType in map) {
    map[vedType] = map[vedType].build();
  }
  return map;
};

VedTemplates.getLinkMap = function() {
  var template = new GrafTemplate(9, [{
    "type": "addLink",
    "id": GrafTemplate.PARAM,
    "jackId1": GrafTemplate.PARAM,
    "jackId2": GrafTemplate.PARAM
  }]);
  return {'link': template};
};

/**
 * @enum {string}
 */
VedType = {
  AND: 'and',
  BEAM_SENSOR: 'beam_sensor',
  BIG_BLOCK: 'big_block',
  BLOCK: 'block',
  BUTTON: 'button',
  DOOR: 'door',
  EXIT: 'exit',
  GRIP: 'gripper',
  META: 'meta',
  NOT: 'not',
  PLAYER_ASSEMBLER: 'player_assembler',
  PORTAL: 'portal',
  TIMER: 'timer',
  TOGGLE: 'toggle',
  ANTI_ZOMBIE_TURRET: 'anti_zombie_turret',
  WALL: 'wall',
  ZAPPER: 'zapper',
  ZOMBIE: 'zombie',
  ZOMBIE_ASSEMBLER: 'zombie_assembler'
};

/**
 * @param {Renderer} renderer
 * @extends GedUiPlugin
 * @constructor
 */
function VedUiPlugin(renderer) {
  GedUiPlugin.call(this);
  this.renderer = renderer;
  this.vorp = null;
}
VedUiPlugin.prototype = new GedUiPlugin();
VedUiPlugin.prototype.constructor = VedUiPlugin;

VedUiPlugin.prototype.invalidate = function() {
  this.vorp = null;
};

VedUiPlugin.prototype.render = function(grafModel) {
  if (!this.vorp) {
    this.vorp = this.createVorp(grafModel);
  }
  this.vorp.draw();
};

VedUiPlugin.prototype.createVorp = function(grafModel) {
  // create vorp instance
  var gameClock = new GameClock();
  var sledgeInvalidator = new SledgeInvalidator();
  var vorpOut = new VorpOut(this.renderer, null);
  var vorp = Vorp.createVorp(vorpOut, gameClock, sledgeInvalidator);
  vorp.setEditable(true);
  var transformer = new Transformer(vorp, gameClock, sledgeInvalidator);
  transformer.transformModel(grafModel);

  // Clock twice 'cause the doors require it for some reason.
  // TODO: fix that - only clock once
  vorp.clock();
  vorp.clock();
  return vorp;
};


