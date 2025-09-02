/**
 * Mock Database Service
 * This file provides a mock implementation of MongoDB functionality for development purposes
 * when a real MongoDB instance is not available.
 */

const EventEmitter = require("events");
const mongoose = require("mongoose");

// Create a mock connection event emitter
const connectionEmitter = new EventEmitter();

// Mock collections to store data
const collections = {
  users: [],
  books: [
    {
      _id: "mock-book-1",
      title: "Tamil Literature Classics",
      titleTamil: "தமிழ் இலக்கிய சிறப்பு",
      author: "Tamil Scholar",
      authorTamil: "தமிழ் அறிஞர்",
      description: "A collection of classic Tamil literary works",
      descriptionTamil: "தமிழ் இலக்கிய சிறப்பு நூல்கள்",
      category: "literature",
      price: 25.99,
      originalPrice: 29.99,
      discount: 13,
      inStock: true,
      stockQuantity: 50,
      featured: true,
      status: "active",
      rating: 4.5,
      reviewCount: 12,
      createdBy: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: "mock-book-2",
      title: "Tamil Poetry Collection",
      titleTamil: "தமிழ் கவிதை தொகுப்பு",
      author: "Modern Poet",
      authorTamil: "நவீன கவிஞர்",
      description: "Beautiful collection of modern Tamil poetry",
      descriptionTamil: "நவீன தமிழ் கவிதைகளின் அழகான தொகுப்பு",
      category: "poetry",
      price: 18.99,
      originalPrice: 22.99,
      discount: 17,
      inStock: true,
      stockQuantity: 30,
      featured: false,
      status: "active",
      rating: 4.2,
      reviewCount: 8,
      createdBy: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  ebooks: [],
  messages: [],
  content: {
    homepage: {
      title: "Welcome to Tamil Language Society",
      subtitle: "Preserving and promoting Tamil literature and culture",
      featuredBooks: []
    },
    about: {
      mission: "Our mission is to promote Tamil literature and culture",
      vision: "To be the leading platform for Tamil literary works",
      team: []
    }
  }
};

// Mock ObjectId generator
const generateObjectId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Mock mongoose connection
const mockConnection = {
  on: (event, callback) => {
    connectionEmitter.on(event, callback);
    return mockConnection;
  },
  once: (event, callback) => {
    connectionEmitter.once(event, callback);
    return mockConnection;
  }
};

class MockQuery {
  constructor(model, query = {}) {
    this.model = model;
    this.query = query;
    this.sortOptions = null;
    this.skipCount = 0;
    this.limitCount = null;
    this.populateFields = [];
  }

  find(additionalQuery) {
    // Merge additional query conditions
    this.query = { ...this.query, ...additionalQuery };
    return this;
  }

  sort(sortBy) {
    this.sortOptions = sortBy;
    return this;
  }

  skip(count) {
    this.skipCount = count;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  populate(field, select) {
    this.populateFields.push({ field, select });
    return this;
  }

  getQuery() {
    return this.query;
  }

  async exec() {
    let results = this.model.filterCollection(this.query);

    // Apply sorting
    if (this.sortOptions) {
      let sortBy, isDescending;
      
      // Handle both string and object sort formats
      if (typeof this.sortOptions === "string") {
        sortBy = this.sortOptions.replace("-", "");
        isDescending = this.sortOptions.startsWith("-");
      } else if (typeof this.sortOptions === "object") {
        // Handle object format like { order: 1 } or { createdAt: -1 }
        const sortKey = Object.keys(this.sortOptions)[0];
        sortBy = sortKey;
        isDescending = this.sortOptions[sortKey] === -1;
      }
      
      if (sortBy) {
        results.sort((a, b) => {
          if (sortBy === "createdAt") {
            const aDate = new Date(a.createdAt);
            const bDate = new Date(b.createdAt);
            return isDescending ? bDate - aDate : aDate - bDate;
          }
          if (a[sortBy] < b[sortBy]) return isDescending ? 1 : -1;
          if (a[sortBy] > b[sortBy]) return isDescending ? -1 : 1;
          return 0;
        });
      }
    }

    // Apply skip and limit
    if (this.skipCount > 0) {
      results = results.slice(this.skipCount);
    }
    if (this.limitCount) {
      results = results.slice(0, this.limitCount);
    }

    // Apply population (simplified - just return the field value)
    if (this.populateFields.length > 0) {
      results = results.map(item => {
        const populated = { ...item };
        this.populateFields.forEach(({ field, select }) => {
          // Simplified population - just keep the original value
          // In a real implementation, this would fetch related documents
        });
        return populated;
      });
    }

    return results;
  }

  // Make the query thenable so it can be awaited
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

// Mock mongoose model operations
class MockModel {
  constructor(collectionName, schema) {
    this.collectionName = collectionName;
    this.schema = schema;
    this.collection = collections[collectionName] || [];
    collections[collectionName] = this.collection;
  }

  static init(collectionName, schema) {
    return new MockModel(collectionName, schema);
  }

  async save() {
    if (!this._id) {
      this._id = generateObjectId();
      this.createdAt = new Date();
      collections[this.collectionName].push(this);
    } else {
      this.updatedAt = new Date();
      const index = collections[this.collectionName].findIndex(item => item._id === this._id);
      if (index !== -1) {
        collections[this.collectionName][index] = this;
      } else {
        collections[this.collectionName].push(this);
      }
    }
    return this;
  }

  static async create(data) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.create(item)));
    }
    
    const instance = new this();
    Object.assign(instance, data);
    instance._id = generateObjectId();
    instance.createdAt = new Date();
    collections[this.collection.collectionName].push(instance);
    return instance;
  }

  static find(query = {}) {
    return new MockQuery(this, query);
  }

  static async findOne(query = {}) {
    const results = this.filterCollection(query);
    return results.length > 0 ? results[0] : null;
  }

  static async findById(id) {
    return this.findOne({ _id: id });
  }

  static async updateOne(query, update) {
    const results = this.filterCollection(query);
    if (results.length > 0) {
      const item = results[0];
      Object.assign(item, update.$set || {});
      item.updatedAt = new Date();
      return { modifiedCount: 1, acknowledged: true };
    }
    return { modifiedCount: 0, acknowledged: true };
  }

  static async updateMany(query, update) {
    const results = this.filterCollection(query);
    results.forEach(item => {
      Object.assign(item, update.$set || {});
      item.updatedAt = new Date();
    });
    return { modifiedCount: results.length, acknowledged: true };
  }

  static async deleteOne(query) {
    const collection = collections[this.collection.collectionName];
    const index = collection.findIndex(item => this.matchQuery(item, query));
    if (index !== -1) {
      collection.splice(index, 1);
      return { deletedCount: 1, acknowledged: true };
    }
    return { deletedCount: 0, acknowledged: true };
  }

  static async deleteMany(query) {
    const collection = collections[this.collection.collectionName];
    const initialLength = collection.length;
    collections[this.collection.collectionName] = collection.filter(item => !this.matchQuery(item, query));
    return { deletedCount: initialLength - collections[this.collection.collectionName].length, acknowledged: true };
  }

  static async countDocuments(query = {}) {
    console.log(`[MOCK DB] countDocuments called for collection: ${this.collection?.collectionName}`);
    console.log("[MOCK DB] Query:", query);
    const result = this.filterCollection(query).length;
    console.log("[MOCK DB] Count result:", result);
    return result;
  }

  static async distinct(field, query = {}) {
    console.log(`[MOCK DB] distinct called for field: ${field}`);
    const results = this.filterCollection(query);
    const distinctValues = [...new Set(results.map(item => item[field]).filter(val => val != null))];
    console.log("[MOCK DB] Distinct values:", distinctValues);
    return distinctValues;
  }

  static filterCollection(query) {
    console.log(`[MOCK DB] filterCollection for: ${this.collection?.collectionName}`);
    const collection = collections[this.collection.collectionName] || [];
    console.log("[MOCK DB] Collection data:", collection.length, "items");
    const filtered = collection.filter(item => this.matchQuery(item, query));
    console.log("[MOCK DB] Filtered result:", filtered.length, "items");
    return filtered;
  }

  static matchQuery(item, query) {
    for (const key in query) {
      if (key === "_id") {
        if (item._id !== query._id) return false;
      } else if (typeof query[key] === "object" && query[key] !== null) {
        // Handle operators like $eq, $gt, $lt, etc.
        for (const op in query[key]) {
          switch (op) {
            case "$eq":
              if (item[key] !== query[key].$eq) return false;
              break;
            case "$ne":
              if (item[key] === query[key].$ne) return false;
              break;
            case "$gt":
              if (item[key] <= query[key].$gt) return false;
              break;
            case "$gte":
              if (item[key] < query[key].$gte) return false;
              break;
            case "$lt":
              if (item[key] >= query[key].$lt) return false;
              break;
            case "$lte":
              if (item[key] > query[key].$lte) return false;
              break;
            case "$in":
              if (!query[key].$in.includes(item[key])) return false;
              break;
            case "$nin":
              if (query[key].$nin.includes(item[key])) return false;
              break;
            default:
              // Unsupported operator
              return false;
          }
        }
      } else if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  }
}

// Mock mongoose
const mockMongoose = {
  connect: (uri, options) => {
    console.log(`[Mock MongoDB] Connected to ${uri}`);
    setTimeout(() => connectionEmitter.emit("connected"), 0);
    return Promise.resolve(mockConnection);
  },
  connection: mockConnection,
  Schema: function(definition, options) {
    this.definition = definition;
    this.options = options;
    
    // Add pre-save hook functionality
    this.preSave = null;
    this.pre = function(event, callback) {
      if (event === "save") {
        this.preSave = callback;
      }
      return this;
    };
    
    // Add methods functionality
    this.methods = {};
    
    // Add statics functionality
    this.statics = {};
    
    // Add virtual functionality
    this.virtual = function(path) {
      return {
        get: function(fn) {
          // Mock virtual getter - just store it but don't actually use it
          return this;
        }
      };
    };
    
    // Add index functionality
    this.index = function(fields, options) {
      // Mock index creation - just ignore it
      return this;
    };
    
    return this;
  },
  model: function(name, schema) {
    const collectionName = name.toLowerCase() + "s";
    
    // Create a model constructor
    function Model(data) {
      Object.assign(this, data);
    }
    
    // Inherit from MockModel
    Model.prototype = Object.create(MockModel.prototype);
    Model.prototype.constructor = Model;
    
    // Add collection reference
    Model.collection = { collectionName };
    
    // Add static methods from MockModel
    Object.getOwnPropertyNames(MockModel).forEach(prop => {
      if (typeof MockModel[prop] === "function" && prop !== "constructor") {
        Model[prop] = MockModel[prop].bind(Model);
      }
    });
    
    // Add schema methods
    if (schema.methods) {
      Object.keys(schema.methods).forEach(method => {
        Model.prototype[method] = schema.methods[method];
      });
    }
    
    // Add schema statics
    if (schema.statics) {
      Object.keys(schema.statics).forEach(method => {
        Model[method] = schema.statics[method].bind(Model);
      });
    }
    
    // Add pre-save hook
    const originalSave = Model.prototype.save;
    Model.prototype.save = async function() {
      if (schema.preSave) {
        const next = () => {};
        await schema.preSave.call(this, next);
      }
      return originalSave.call(this);
    };
    
    return Model;
  },
  Types: {
    ObjectId: {
      isValid: (id) => typeof id === "string" && id.length > 0
    }
  }
};

// Add Schema.Types for compatibility
mockMongoose.Schema.Types = {
  ObjectId: {
    isValid: (id) => typeof id === "string" && id.length > 0
  }
};

// Export the mock mongoose
module.exports = mockMongoose;