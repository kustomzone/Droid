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
