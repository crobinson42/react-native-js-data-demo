/**
 * This is a fork from js-data-localstorage project and mostly only changes
 * the use of "localStorage" to react-native "AsyncStorage"
 *
 */

import { Query, utils } from "js-data";
import { Adapter } from "js-data-adapter";

import { AsyncStorage } from "react-native";

import guid from 'uuid'

const __super__ = Adapter.prototype;

const DEFAULTS = {
  /**
   * Add a namespace to keys as they are stored.
   *
   * @firstName AsyncStorageAdapter#basePath
   * @type {string}
   */
  basePath: "",

  /**
   * Storage provider for this adapter. The default implementation is simply
   * `getItem`, `setItem`, and `removeItem`. Each method accepts the same
   * arguments as `localStorage#getItem`, `localStorage#setItem`, and
   * `localStorage#removeItem`, but instead of being synchronous, these methods
   * are asynchronous and return promises. This means you can swap out
   * `localStorage` for `localForage`.
   *
   * @example <caption>Use localForage instead of localStorage</caption>
   * const adapter = new AsyncStorageAdapter({
   *   storage: localForage
   * })
   *
   * @firstName AsyncStorageAdapter#storage
   * @type {Object}
   * @default localStorage
   */
  storage: {
    getItem: function(key) {
      return utils.resolve(AsyncStorage.getItem(key));
    },
    setItem: function(key, value) {
      return utils.resolve(AsyncStorage.setItem(key, value));
    },
    removeItem: function(key) {
      return utils.resolve(AsyncStorage.removeItem(key));
    }
  }
};

function isValidString(value) {
  return value != null && value !== "";
}
function join(items, separator) {
  separator || (separator = "");
  return items.filter(isValidString).join(separator);
}
function makePath(...args) {
  let result = join(args, "/");
  return result.replace(/([^:\/]|^)\/{2,}/g, "$1/");
}
let queue = [];
let taskInProcess = false;

function enqueue(task) {
  queue.push(task);
}

function dequeue() {
  if (queue.length && !taskInProcess) {
    taskInProcess = true;
    queue[0]();
  }
}

function queueTask(task) {
  if (!queue.length) {
    enqueue(task);
    dequeue();
  } else {
    enqueue(task);
  }
}

function createTask(fn) {
  return new Promise(fn).then(
    function(result) {
      taskInProcess = false;
      queue.shift();
      setTimeout(dequeue, 0);
      return result;
    },
    function(err) {
      taskInProcess = false;
      queue.shift();
      setTimeout(dequeue, 0);
      return utils.reject(err);
    }
  );
}

/**
 * {@link AsyncStorageAdapter} class.
 *
 * @firstName module:js-data-AsyncStorage.AsyncStorageAdapter
 * @see AsyncStorageAdapter
 */

/**
 * {@link AsyncStorageAdapter} class. ES2015 default import.
 *
 * @firstName module:js-data-AsyncStorage.default
 * @see AsyncStorageAdapter
 */

/**
 * AsyncStorageAdapter class.
 *
 * @example
 * import {DataStore} from 'js-data'
 * import {AsyncStorageAdapter} from 'js-data-localstorage'
 * const store = new DataStore()
 * const adapter = new AsyncStorageAdapter()
 * store.registerAdapter('ls', adapter, { 'default': true })
 *
 * @class AsyncStorageAdapter
 * @alias AsyncStorageAdapter
 * @extends Adapter
 * @param {Object} [opts] Configuration options.
 * @param {string} [opts.basePath=''] See {@link AsyncStorageAdapter#basePath}.
 * @param {boolean} [opts.debug=false] See {@link Adapter#debug}.
 * @param {boolean} [opts.raw=false] See {@link Adapter#raw}.
 * @param {Object} [opts.storeage=localStorage] See {@link AsyncStorageAdapter#storage}.
 */
export function AsyncStorageAdapter(opts) {
  utils.classCallCheck(this, AsyncStorageAdapter);
  opts || (opts = {});
  utils.fillIn(opts, DEFAULTS);
  Adapter.call(this, opts);
}

// Setup prototype inheritance from Adapter
AsyncStorageAdapter.prototype = Object.create(Adapter.prototype, {
  constructor: {
    value: AsyncStorageAdapter,
    enumerable: false,
    writable: true,
    configurable: true
  }
});

Object.defineProperty(AsyncStorageAdapter, "__super__", {
  configurable: true,
  value: Adapter
});

/**
 * Alternative to ES6 class syntax for extending `AsyncStorageAdapter`.
 *
 * @example <caption>Using the ES2015 class syntax.</caption>
 * class MyLocalStorageAdapter extends AsyncStorageAdapter {...}
 * const adapter = new MyLocalStorageAdapter()
 *
 * @example <caption>Using {@link AsyncStorageAdapter.extend}.</caption>
 * var instanceProps = {...}
 * var classProps = {...}
 *
 * var MyLocalStorageAdapter = AsyncStorageAdapter.extend(instanceProps, classProps)
 * var adapter = new MyLocalStorageAdapter()
 *
 * @method AsyncStorageAdapter.extend
 * @static
 * @param {Object} [instanceProps] Properties that will be added to the
 * prototype of the subclass.
 * @param {Object} [classProps] Properties that will be added as static
 * properties to the subclass itself.
 * @return {Constructor} Subclass of `AsyncStorageAdapter`.
 */
AsyncStorageAdapter.extend = utils.extend;

utils.addHiddenPropsToTarget(AsyncStorageAdapter.prototype, {
  /**
   * Retrieve the number of records that match the selection query. Internal
   * method used by Adapter#count.
   *
   * @method AsyncStorageAdapter#_count
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _count(mapper, query, opts) {
    return this._findAll(mapper, query, opts).then(result => {
      result[0] = result[0].length;
      return result;
    });
  },

  _createHelper(mapper, props, opts) {
    props = utils.plainCopy(props);
    const idAttribute = mapper.idAttribute;
    const ids = props.map(_props => {
      let id = utils.get(_props, idAttribute);
      if (utils.isUndefined(id)) {
        id = guid();
        utils.set(_props, idAttribute, id);
      }
      return id;
    });
    const keys = ids.map(id => this.getIdPath(mapper, opts, id));
    const tasks = props.map((_props, i) =>
      this.storage.setItem(keys[i], utils.toJson(_props))
    );
    return utils.Promise.all(tasks)
      .then(() => this.ensureId(ids, mapper, opts))
      .then(() => utils.Promise.all(keys.map(key => this.storage.getItem(key))))
      .then(records => records.map(record => utils.fromJson(record)));
  },

  /**
   * Create a new record. Internal method used by Adapter#create.
   *
   * @method AsyncStorageAdapter#_create
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _create(mapper, props, opts) {
    return this._createHelper(mapper, [props], opts).then(records => [
      records[0],
      {}
    ]);
  },

  /**
   * Create multiple records in a single batch. Internal method used by
   * Adapter#createMany.
   *
   * @method AsyncStorageAdapter#_createMany
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The records to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _createMany(mapper, props, opts) {
    return this._createHelper(mapper, props, opts).then(records => [
      records,
      {}
    ]);
  },

  /**
   * Destroy the record with the given primary key. Internal method used by
   * Adapter#destroy.
   *
   * @method AsyncStorageAdapter#_destroy
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroy(mapper, id, opts) {
    // Remove record from storage
    return (
      this.storage
        .removeItem(this.getIdPath(mapper, opts, id))
        // Remove record's key from storage
        .then(() => this.removeId(id, mapper, opts))
        .then(() => [undefined, {}])
    );
  },

  /**
   * Destroy the records that match the selection query. Internal method used by
   * Adapter#destroyAll.
   *
   * @method AsyncStorageAdapter#_destroyAll
   * @private
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroyAll(mapper, query, opts) {
    return this._findAll(mapper, query, opts)
      .then(results => {
        const [records] = results;
        const idAttribute = mapper.idAttribute;
        // Gather IDs of records to be destroyed
        const ids = records.map(record => utils.get(record, idAttribute));
        // Remove records from storage
        const tasks = ids.map(id =>
          this.storage.removeItem(this.getIdPath(mapper, opts, id))
        );
        // Remove records' keys from storage
        return utils.Promise.all(tasks).then(() =>
          this.removeId(ids, mapper, opts)
        );
      })
      .then(() => [undefined, {}]);
  },

  /**
   * Retrieve the record with the given primary key. Internal method used by
   * Adapter#find.
   *
   * @method AsyncStorageAdapter#_find
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _find(mapper, id, opts) {
    const key = this.getIdPath(mapper, opts, id);
    return this.storage
      .getItem(key)
      .then(record => [record ? utils.fromJson(record) : undefined, {}]);
  },

  /**
   * Retrieve the records that match the selection query. Internal method used
   * by Adapter#findAll.
   *
   * @method AsyncStorageAdapter#_findAll
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _findAll(mapper, query, opts) {
    query || (query = {});
    // Load all records into memory...
    return this.getIds(mapper, opts)
      .then(ids => {
        const tasks = Object.keys(ids).map(id =>
          this.storage.getItem(this.getIdPath(mapper, opts, id))
        );
        return utils.Promise.all(tasks);
      })
      .then(records =>
        records
          .map(record => (record ? utils.fromJson(record) : undefined))
          .filter(record => record)
      )
      .then(records => {
        const _query = new Query({
          index: {
            getAll() {
              return records;
            }
          }
        });
        return [_query.filter(query).run(), {}];
      });
  },

  /**
   * Retrieve the number of records that match the selection query. Internal
   * method used by Adapter#sum.
   *
   * @method AsyncStorageAdapter#_sum
   * @private
   * @param {Object} mapper The mapper.
   * @param {string} field The field to sum.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _sum(mapper, field, query, opts) {
    return this._findAll(mapper, query, opts).then(result => {
      result[0] = result[0].reduce(
        (sum, record) => sum + (utils.get(record, field) || 0),
        0
      );
      return result;
    });
  },

  /**
   * Apply the given update to the record with the specified primary key.
   * Internal method used by Adapter#update.
   *
   * @method AsyncStorageAdapter#_update
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _update(mapper, id, props, opts) {
    props || (props = {});
    return this._find(mapper, id, opts)
      .then(result => {
        const [record] = result;
        if (!record) {
          throw new Error("Not Found");
        }
        const key = this.getIdPath(mapper, opts, id);
        utils.deepMixIn(record, props);
        return this.storage.setItem(key, utils.toJson(record));
      })
      .then(() => this._find(mapper, id, opts));
  },

  /**
   * Apply the given update to all records that match the selection query.
   * Internal method used by Adapter#updateAll.
   *
   * @method AsyncStorageAdapter#_updateAll
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateAll(mapper, props, query, opts) {
    return this._findAll(mapper, query, opts)
      .then(results => {
        let [records] = results;
        const idAttribute = mapper.idAttribute;
        const tasks = records.map(record => {
          record || (record = {});
          const id = utils.get(record, idAttribute);
          const key = this.getIdPath(mapper, opts, id);
          utils.deepMixIn(record, props);
          return this.storage
            .setItem(key, utils.toJson(record))
            .then(() => this._find(mapper, id, opts))
            .then(result => result[0]);
        });
        return utils.Promise.all(tasks);
      })
      .then(records => [records, {}]);
  },

  /**
   * Update the given records in a single batch. Internal method used by
   * Adapter#updateMany.
   *
   * @method AsyncStorageAdapter#updateMany
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object[]} records The records to update.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateMany(mapper, records, opts) {
    records || (records = []);
    const idAttribute = mapper.idAttribute;
    const tasks = records
      .filter(record => record)
      .map(record => {
        const id = utils.get(record, idAttribute);
        if (utils.isUndefined(id)) {
          return;
        }
        const key = this.getIdPath(mapper, opts, id);
        return this.storage
          .getItem(key)
          .then(json => {
            if (!json) {
              return;
            }
            const existingRecord = utils.fromJson(json);
            utils.deepMixIn(existingRecord, record);
            return this.storage.setItem(key, utils.toJson(existingRecord));
          })
          .then(() => this._find(mapper, id, opts))
          .then(result => result[0]);
      })
      .filter(promise => promise);
    return utils.Promise.all(tasks).then(records => [records, {}]);
  },

  create(mapper, props, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.create.call(this, mapper, props, opts).then(success, failure);
      });
    });
  },

  createMany(mapper, props, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.createMany
          .call(this, mapper, props, opts)
          .then(success, failure);
      });
    });
  },

  destroy(mapper, id, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.destroy.call(this, mapper, id, opts).then(success, failure);
      });
    });
  },

  destroyAll(mapper, query, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.destroyAll
          .call(this, mapper, query, opts)
          .then(success, failure);
      });
    });
  },

  /**
   * Store a given primary key
   *
   * @method AsyncStorageAdapter#ensureId
   * @param {(string|number)} id Primary key of the record.
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   */
  ensureId(id, mapper, opts) {
    return this.getIds(mapper, opts).then(ids => {
      if (utils.isArray(id)) {
        if (!id.length) {
          return;
        }
        id.forEach(_id => {
          ids[_id] = 1;
        });
      } else {
        ids[id] = 1;
      }
      return this.saveKeys(ids, mapper, opts);
    });
  },

  /**
   * Get a path firstName
   *
   * @method AsyncStorageAdapter#getPath
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   * @return {string} The path firstName
   */
  getPath(mapper, opts) {
    opts = opts || {};
    return makePath(
      opts.basePath === undefined
        ? mapper.basePath === undefined
          ? this.basePath
          : mapper.basePath
        : opts.basePath,
      mapper.firstName
    );
  },

  /**
   * Get a path for a given primary key
   *
   * @method AsyncStorageAdapter#getIdPath
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   * @param {(string|number)} id Primary key of the record.
   * @return {string} The path firstName
   */
  getIdPath(mapper, opts, id) {
    opts = opts || {};
    return makePath(
      opts.basePath || this.basePath || mapper.basePath,
      mapper.endpoint,
      id
    );
  },

  /**
   * Retrieve all primary keys
   *
   * @method AsyncStorageAdapter#getIds
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   * @return {Object} Stored ids
   */
  getIds(mapper, opts) {
    let ids;
    const idsPath = this.getPath(mapper, opts);
    return this.storage.getItem(idsPath).then(idsJson => {
      if (idsJson) {
        ids = utils.fromJson(idsJson);
      } else {
        ids = {};
      }
      return ids;
    });
  },

  /**
   * Remove a given primary key
   *
   * @method AsyncStorageAdapter#removeId
   * @param {(string|number)} id Primary key of the record.
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   */
  removeId(id, mapper, opts) {
    return this.getIds(mapper, opts).then(ids => {
      if (utils.isArray(id)) {
        if (!id.length) {
          return;
        }
        id.forEach(function(_id) {
          delete ids[_id];
        });
      } else {
        delete ids[id];
      }
      return this.saveKeys(ids, mapper, opts);
    });
  },

  /**
   * Store primary keys
   *
   * @method AsyncStorageAdapter#saveKeys
   * @param {(string|number)} id Primary key of the record.
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   */
  saveKeys(ids, mapper, opts) {
    ids || (ids = {});
    const idsPath = this.getPath(mapper, opts);
    if (Object.keys(ids).length) {
      return this.storage.setItem(idsPath, utils.toJson(ids));
    } else {
      return this.storage.removeItem(idsPath);
    }
  },

  update(mapper, id, props, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.update
          .call(this, mapper, id, props, opts)
          .then(success, failure);
      });
    });
  },

  updateAll(mapper, props, query, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.updateAll
          .call(this, mapper, props, query, opts)
          .then(success, failure);
      });
    });
  },

  updateMany(mapper, records, opts) {
    return createTask((success, failure) => {
      queueTask(() => {
        __super__.updateMany
          .call(this, mapper, records, opts)
          .then(success, failure);
      });
    });
  }
});

/**
 * Details of the current version of the `js-data-localstorage` module.
 *
 * @firstName module:js-data-AsyncStorage.version
 * @type {Object}
 * @property {string} version.full The full semver value.
 * @property {number} version.major The major version number.
 * @property {number} version.minor The minor version number.
 * @property {number} version.patch The patch version number.
 * @property {(string|boolean)} version.alpha The alpha version value,
 * otherwise `false` if the current version is not alpha.
 * @property {(string|boolean)} version.beta The beta version value,
 * otherwise `false` if the current version is not beta.
 */
export const version = "<%= version %>";

/**
 * Registered as `js-data-localstorage` in NPM and Bower.
 *
 * @example <caption>Script tag</caption>
 * var AsyncStorageAdapter = window.JSDataAsyncStorage.AsyncStorageAdapter
 * var adapter = new AsyncStorageAdapter()
 *
 * @example <caption>CommonJS</caption>
 * var AsyncStorageAdapter = require('js-data-localstorage').AsyncStorageAdapter
 * var adapter = new AsyncStorageAdapter()
 *
 * @example <caption>ES2015 Modules</caption>
 * import {AsyncStorageAdapter} from 'js-data-localstorage'
 * const adapter = new AsyncStorageAdapter()
 *
 * @example <caption>AMD</caption>
 * define('myApp', ['js-data-localstorage'], function (JSDataLocalStorage) {
 *   var AsyncStorageAdapter = JSDataAsyncStorage.AsyncStorageAdapter
 *   var adapter = new AsyncStorageAdapter()
 *
 *   // ...
 * })
 *
 * @module js-data-localstorage
 */

export default AsyncStorageAdapter;
