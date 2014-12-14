

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