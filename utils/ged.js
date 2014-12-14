
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

