// isObject: https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L11743
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

// reIsUint: https://github.com/lodash/lodash/blob/master/.internal/isIndex.js
const rxIsIndex = /^(?:0|[1-9]\d*)$/;

function get(obj, path) {
  for (let i = 0; i < path.length; i++) {
    if (!isObject(obj)) {
      return undefined;
    }

    obj = obj[path[i]];
  }

  return obj;
}

function set(obj, path, val) {
  if (!isObject(obj)) {
    throw new Error('Cannot set property ' + path[0] + ' of not an object.');
  }

  for (let i = 0; i < path.length - 1; i++) {
    if (!isObject(obj[path[i]])) {
      obj[path[i]] = rxIsIndex.test(path[i + 1]) ? [] : {};
    }

    obj = obj[path[i]];
  }

  obj[path[path.length - 1]] = val;
}

export default class DeltaPlane {
  constructor(original, delta) {
    this.original = original;
    if (delta === undefined) {
      delta = Array.isArray(original) ? [] : {};
    }

    this.delta = delta;
  }

  getPlane(path = []) {
    var me = this;
    // if(parent===undefined){
    //   parent = this
    // }
    return new Proxy(me.delta, {
      get: function (delta, prop) {
        const p = [...path, prop];

        let val = get(delta, p);
        if (val === undefined) {
          val = get(me.original, p);
        }

        if (!isObject(val)) {
          return val;
        }

        return me.getPlane(p);
      },
      set: function (delta, prop, val) {
        set(delta, [...path, prop], val);
      },
      ownKeys: function (delta) {
        return [
          ...Object.getOwnPropertyNames(delta),
          ...Object.getOwnPropertyNames(me.original),
          ...Object.getOwnPropertySymbols(delta),
          ...Object.getOwnPropertySymbols(me.original),
        ].filter((v, i, a) => a.indexOf(v) === i);
      },
    });
  }

  getDelta() {
    return this.delta;
  }
}
