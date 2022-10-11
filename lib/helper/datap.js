const { ObjectId, MongoClient } = require("mongodb");
class MongoConnector {
  #url = "";
  #dbName = "";
  #mongoClient = null;
  #db = null;
  /** Create a mongodb instance
   * @param {string} url - Connect to MongoDB using a url
   * @param {string} dbName - Mongodb database name
   */
  constructor(url, dbName) {
    this.#url = url;
    this.#dbName = dbName;
  }

  /**
   * Connect to Mongodb database
   * @param {string} url  - Connect to MongoDB using a url
   * @param {string} dbName  - Mongodb database name
   */
  async connect(url, dbName) {
    this.#mongoClient = await MongoClient.connect(url ?? this.#url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    this.#db = this.#mongoClient.db(dbName ?? this.#dbName);
  }

  /**
   *  Get the database instance
   * @param {string} [dbName] - if not passed, use the default database
   * @returns {object}
   */
  async db(dbName) {
    if (this.#mongoClient == null) {
      await this.connect();
    }
    if (dbName && this.#dbName !== dbName) {
      this.#db = this.#mongoClient.db(dbName);
      this.#dbName = dbName;
    }
    return this.#db;
  }

  async create(coll, doc) {
    const db = await this.db();
    return db.collection(coll).insertOne({
      ...doc,
    });
  }

  async createmany(coll, docs) {
    const db = await this.db();
    const result = await db.collection(coll).insertMany([...docs]);
    if (result?.insertedIds) {
      result.insertedIds = Object.values(result.insertedIds);
    }
    return result;
  }

  async readone(query, coll) {
    const db = await this.db();
    return db.collection(coll).findOne(query, {
      sort: { _id: -1 },
    });
  }

  /**
   * @deprecated
   */

  async readid(id, coll) {
    const db = await this.db();
    return db.collection(coll).findOne(
      {
        _id: new ObjectId(id),
      },
      {
        sort: { _id: -1 },
      }
    );
  }

  async readid2(coll, id) {
    const db = await this.db();
    return db.collection(coll).findOne(
      {
        _id: new ObjectId(id),
      },
      {
        sort: { _id: -1 },
      }
    );
  }

  /**
   * Read documents with specified conditions
   * @param {string} coll - collection name
   * @param {object} query
   * @param {number} limit
   * @param {number} skip
   * @param {number} sort
   * @returns {object[]}
   */
  async read(coll, query, limit = 0, skip = 0, sort) {
    const db = await this.db();
    return db
      .collection(coll)
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();
  }

  async update(coll, doc) {
    const db = await this.db();
    const { id, ...restDoc } = doc;
    return db.collection(coll).updateOne(
      {
        _id: ObjectId(id),
      },
      {
        $set: { ...restDoc },
        $currentDate: {
          lastModified: true,
        },
      }
    );
  }

  async updatemany(coll, q, doc) {
    const db = await this.db();
    return db.collection(coll).updateMany(q, {
      $set: { ...doc },
      $currentDate: {
        lastModified: true,
      },
    });
  }

  async upsert(coll, doc) {
    const db = await this.db();
    return db.collection(coll).updateOne(
      {
        [doc["key"]]: doc[doc["key"]],
      },
      {
        $set: { ...doc },
        $currentDate: {
          lastModified: true,
        },
      },
      {
        upsert: true,
      }
    );
  }

  /**
   * @deprecated
   */

  async delete(id, coll) {
    const db = await this.db();
    return db.collection(coll).deleteMany({
      _id: new ObjectId(id),
    });
  }

  async delete2(coll, id) {
    const db = await this.db();
    return db.collection(coll).deleteMany({
      _id: new ObjectId(id),
    });
  }

  async deletequery(coll, q) {
    const db = await this.db();
    return db.collection(coll).deleteMany(q);
  }

  async count(coll, q) {
    const db = await this.db();
    return db.collection(coll).count(q);
  }
}

module.exports = (config) => {
  return {
    mongo: new MongoConnector(config.db?.mongo),
  };
};
