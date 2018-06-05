import { DataStore, Schema } from "js-data";

import {
  // AsyncStorageAdapter,
  HttpAdapter
} from "./adapters/index";
import config from './config'

const store = new DataStore();

const httpAdapter = new HttpAdapter({
  basePath: config.api,
  deserialize: function (mapper, response, opts) {
    // over-ride the api servers responses for js-data parsing
    if (response && response.data) {
      response.data = response.data.data
    }
    // then do default behavior
    return HttpAdapter.prototype.deserialize.call(this, mapper, response, opts);
  }
});
store.registerAdapter("http", httpAdapter, { default: true });

// const asyncAdapter = new AsyncStorageAdapter();
// store.registerAdapter("asyncStorage", asyncAdapter, { default: true });

// Define a Mapper for a "user" resource
store.defineMapper("users");
// store.defineMapper("books");

/**********************
    stub out some data
 *********************/

// optional
const userOpts = {
  // relations: {
  //   hasMany: {
  //     books: { localField: "books" }
  //   }
  // },
  schema: new Schema({
    type: "object",
    properties: {
      first_name: { type: "string" },
      books: { type: "array" }
    },
    required: ["name"]
  })
};

// const bookSchema = new Schema({
//   type: "object",
//   properties: {
//     title: { type: "string" }
//   },
//   required: ["title"]
// });

// simulate restoring localStorage by adding some users to the store when instantiated
store.add("users", { first_name: "Cory William", books: [] }, userOpts);
store.add("users", { first_name: "Dan Handy", books: [] }, userOpts);
store.add("users", { first_name: "Al Martini", books: [] }, userOpts);

// store.add("books", { title: "Moby Dick" }, bookSchema);
// store.add("books", { title: "20 Leagues Under the Sea" }, bookSchema);
// store.add("books", { title: "Mice and Men" }, bookSchema);

export default store;
