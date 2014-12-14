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

// ******** PLEX ********* /

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

// The problem is that I want to express (pos,vel,pos,vel) but beziers are (pos,control,control,pos)

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
 
// Chars (?) = Chars
plex.Chars = function(alphabet) {
  this.alphabet = alphabet;
};

plex.Chars.STOPCODE = 0;

/**
 * @param {string} str  A string made up only of what's in the alphabet.
 * @return {Array} An array of integers.
 */
plex.Chars.prototype.encodeToIntegers = function(str) {
  if (str == '') {
    return [plex.Chars.STOPCODE];
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
  result.push(plex.Chars.STOPCODE);
  return result;
};

/**
 * @param {Array} ints  An array of integers.
 * @return {string} A string made up only of what's in the alphabet.
 */
plex.Chars.prototype.decodeFromIntegers = function(ints) {
  if (ints.length == 1 && ints[0] == plex.Chars.STOPCODE) {
    return '';
  }
  var entry = '';
  var dict = this.createDecodingDictionary();
  var w = dict.get(ints[0]);
  var result = w;

  for (var i = 1; i < ints.length; i++) {
    var k = ints[i];
    if (k == plex.Chars.STOPCODE) {
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
    throw Error('k:' + k + ' but expected stop-code:' + plex.Chars.STOPCODE);
  }
  return result;
};

plex.Chars.prototype.encodeToBitQueue = function(str, opt_bitQueue) {
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

plex.Chars.prototype.decodeFromBitQueue = function(bitQueue) {
  var highestValuePossible = this.createEncodingDictionary().length + 1; // +1 for stopcode
  var ints = [];
  var num = -1;
  while (num != plex.Chars.STOPCODE) {
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
plex.Chars.prototype.encodeToBytes = function(str) {
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
plex.Chars.prototype.decodeFromBytes = function(bytes) {
  var q = new plex.BitQueue();
  q.enqueueBytes(bytes);
  return this.decodeFromBitQueue(q);
};

plex.Chars.prototype.createEncodingDictionary = function() {
  var dict = new plex.Map();
  var nextKey = 1;
  for (var i = 0; i < this.alphabet.length; i++) {
    dict.set(this.alphabet.charAt(i), nextKey++);
  }
  return dict;
};

plex.Chars.prototype.createDecodingDictionary = function() {
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

  var lz = new plex.Chars(this.getAlphabet());
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
    var lz = new plex.Chars(this.getAlphabet());
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



this.plex = this.plex || {};

/**
 * @fileoverview
 */
plex.time = {};

plex.time.now = function() {
  return (new Date()).getTime();
};




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

//*********************************************************************************************************************/
//*********************************************************************************************************************/

/**

http://plexode.com/vorp/#level=data~

aeotB48JkRpIaDqVqccRUA1qIPTCnxQNuhOhyozgqqACkKAGwCQoGiYaMxoaHDIkLw8SKx4sMC8eMCkm0TUkIswcNDUXQ0dMMsAyGjUeLywcJxrBTxYdQy4lFgYoIwzRJR4qK1rNYhojKM9eHWNGMignmCbQHDAjZTk9FicSLjFwMjU9Eic1n2XJuxVaJCInZC14wDAaKNGlcXlW0BRLNx8ItVQNDvh7wVcrQzrxRv2DhUzQJpg2BA56NQJJYKolsJ1YBF/BYGhWSA4KBlZMV/SWEwyKwqILwGhYzBlkwsMssJSQLIl9o9poczBaSQ9aQdMIoJJldqeHU+DhdRyynsRjMpWA0LolptFyodLBd0xdVLauO9frJEBdWgOHMGAriqK2MJlDq8MJaNxVcp1VosMO+JQ8JSo01RgoxFzmM1xLTxFhmSKV+PEK2JGXa6o92QcNROQLnMK50vB5aBExfHuWpGjXBKozqGmXXwRX7LEJChvfULB5vVhBGTzi2aVIY7hGeRUynaR5bWH5iD7JP8fog4KsPoZlhRvPcpcVaMcKob5rOl99XbRfUQHRz23eyPcZH++sXb31teJqZAqcRDneCbcg03ZsksAYCGCU58sgUZoEOkhEFkvyWOqkDZNs7rpPuCz5rUV6glmiR7DOCrxqyUikvAjbilEzywxbADPRgbD5xmZydwhEphHo5x0gsYsgEeyz+SEdzOJEMC+KWnMELQXRZuydg0ri6pkvdD53tm+SRjOcMwJycqeNyC7cuQSJJtyTiGxOME2Sa5jMzZCZxHwZc2E0ChEp7OAzgwe4LpICYLT+pp3zuCxqTZERhAwCVDp2ix7p3SQ0UCi08jODLBUxNdOKAfQMUkviGHhSLcspE7vg1SRQQ+M8+Uk3wLTNRlOHersTgqHwfAAA=?

**/

//*********************************************************************************************************************/
//*********************************************************************************************************************/


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

//************************************************************


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


/**********************************************************************/
/******************************* SNIP *********************************/
/**********************************************************************/


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
      '<h2>Droid</h2>' +
      'Droid is a clone of a 2D physics-based editor that runs in modern browsers.' +
      '<p>The built-in editor stores your work on your computer using localstorage. ' +
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
  var levelAddresss = plex.object.keys(droidLevels);
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
    ops = this.getTemplatizer().detemplatize(droidLevels[name]);
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
    if (droidLevels[splitName[1]]) {
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
  
  // repair editor button..
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

// editor canvas..
// eg. <canvas class="vedEditCanvas" width="1393" height="777"></canvas>

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

//********** eof ***********/