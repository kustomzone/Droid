
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
