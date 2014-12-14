
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
