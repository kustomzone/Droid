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