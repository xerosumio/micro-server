const path = require("path");
const { ObjectId, MongoClient, Db } = require("mongodb");
const JSONdb = require("simple-json-db");
const _ = require("lodash");
const mysql = require("mysql2/promise");
class MongoConnector {
  #url = "";
  #dbName = "";
  /**
   * @type MongoClient | null
   */
  #mongoClient = null;
  /**
   * @type Db | null
   */
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
   * @returns {Db}
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

  /**
   * @param {string} coll
   * @param {object} doc
   */
  async create(coll, doc) {
    const db = await this.db();
    return db.collection(coll).insertOne({
      ...doc,
    });
  }

  /**
   *
   * @param {string} coll
   * @param {Array<object>} docs
   * @returns {Array<string>}
   */
  async createmany(coll, docs) {
    const db = await this.db();
    const result = await db.collection(coll).insertMany([...docs]);
    if (result?.insertedIds) {
      result.insertedIds = Object.values(result.insertedIds);
    }
    return result;
  }

  /**
   *
   * @param {string} coll
   * @param {object} query See https://www.mongodb.com/docs/manual/tutorial/query-documents/
   * @param {object} sort either {key:-1} or {key:1}, while the key is sortable properties of the querying object
   * @returns {Array<object>}
   */
  async readone(coll, query, sort = { _id: -1 }) {
    const db = await this.db();
    return db.collection(coll).findOne(query, {
      sort,
    });
  }

  /**
   *
   * @param {string} coll
   * @param {object} query See https://www.mongodb.com/docs/manual/tutorial/query-documents/
   * @param {object} sort either {key:-1} or {key:1}, while the key is sortable properties of the querying object
   * @returns {Array<object>}
   */
  async readNewone(coll, query, sort) {
    const db = await this.db();
    return db.collection(coll).findOne(query, {
      sort: sort,
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

  /**
   *
   * @param {string} coll
   * @param {string} id
   * @returns {object}
   */
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

  /**
   *
   * @param {string} coll
   * @param {object} doc while the _id change to id
   * @returns
   */
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

  /**
   *
   * @param {string} coll
   * @param {string} id
   * @returns
   */
  async delete2(coll, id) {
    const db = await this.db();
    return db.collection(coll).deleteMany({
      _id: new ObjectId(id),
    });
  }

  /**
   *
   * @param {string} coll
   * @param {object} q see https://www.mongodb.com/docs/manual/tutorial/query-documents/ to query specified records to be removed
   * @returns
   */
  async deletequery(coll, q) {
    const db = await this.db();
    return db.collection(coll).deleteMany(q);
  }

  async count(coll, q) {
    const db = await this.db();
    return db.collection(coll).count(q);
  }
}

class JSONConnector {
  #filePath;
  #client = null;
  constructor(filePath) {
    this.#filePath = filePath;
  }

  async connect(filePath) {
    this.#client = new JSONdb(filePath ?? this.#filePath, {
      asyncWrite: true,
    });
  }

  async db() {
    if (this.#client == null) {
      this.connect();
    }
    return this.#client;
  }

  async create(coll, doc) {
    const db = await this.db();
    let docs = db.get(coll);
    if (!Array.isArray(docs)) {
      docs = [];
    }
    docs.push({
      _id: _.uniqueId(Date.now()),
      ...doc,
    });
    db.set(coll, docs);
    db.sync();
    return;
  }

  async readone(coll, query) {
    const db = await this.db();
    const docs = db.get(coll);
    return _.chain(docs).orderBy(["_id"], ["desc"]).find(query).value();
  }

  async read(coll, query, limit, skip, sort = [["_id"], ["desc"]]) {
    const db = await this.db();
    const docs = db.get(coll);

    return _.chain(docs)
      .filter(_.isEmpty(query) ? () => true : query)
      .orderBy(...sort)
      .slice(skip ?? 0, skip + limit)
      .value();
  }

  async update(coll, query) {
    const db = await this.db();
    const docs = db.get(coll);
    const foundObj = _.find(docs, (doc) => doc._id === query.id);
    _.merge(
      foundObj,
      {
        lastModified: new Date(),
      },
      _.omit(query, "id")
    );

    db.set(coll, docs);
    db.sync();
  }

  async updatemany(coll, q, doc) {
    const db = await this.db();
    const docs = db.get(coll);

    _.filter(docs, q).forEach((d) => {
      _.merge(
        d,
        {
          lastModified: new Date(),
        },
        doc
      );
    });

    db.set(coll, docs);
    db.sync();
  }

  async upsert(coll, doc) {
    const db = await this.db();
    const docs = db.get(coll);
    const foundDoc = _.find(docs, {
      [doc["key"]]: doc[doc["key"]],
    });

    if (foundDoc) {
      _.merge(
        foundDoc,
        {
          lastModified: new Date(),
        },
        _.omit(doc, "key")
      );
    } else {
      docs.push({
        _id: _.uniqueId(Date.now()),
        ...doc,
      });
    }

    db.set(coll, docs);
    db.sync();
  }

  async delete(coll, id) {
    return this.deletequery(coll, { _id: id });
  }

  async deletequery(coll, q) {
    const db = await this.db();
    const docs = db.get(coll);
    const removedDocs = _.reject(docs, q);
    db.set(coll, removedDocs);
    db.sync();
  }

  async count(coll, q) {
    const db = await this.db();
    const docs = db.get(coll);
    return docs.length;
  }
}

class SQLConnector {
  // db connection object
  #pool;
  #db;

  constructor(object) {
    this.#connect(object);
  }

  async #connect(object) {
    if (
      object?.host === undefined ||
      object?.database === undefined ||
      object?.user === undefined ||
      object?.password === undefined
    ) {
      const err = new Error(
        "missing fields for establising sql db connection."
      );
      err.code = 500;
      throw err;
    }

    if (object?.database === undefined && object?.db !== undefined) {
      object.database = object.db;
      delete object.db;
    }

    if (object?.user === undefined && object?.usr !== undefined) {
      object.user = object.usr;
      delete object.usr;
    }

    if (object?.password === undefined && object?.pw !== undefined) {
      object.password = object.pw;
      delete object.pw;
    }

    (object.connectionLimit = 10), (this.#db = object.database);

    this.#pool = await mysql.createPool(object);
  }

  #constructSqlStringObj(obj) {
    const returner = {
      toSqlString: function () {
        let string = ``;
        for (const key in obj) {
          string += `${key}`;
          switch (typeof obj[key].value) {
            case "number":
              if (obj[key]?.operator !== undefined) {
                string += ` ${obj[key].operator} ${obj[key].value}`;
              } else {
                string += `=${obj[key].value}`;
              }
              break;
            case "string":
              // if this is an Date ISOString, remove the T and Z
              if (
                /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(
                  obj[key].value
                )
              ) {
                if (obj[key]?.operatpr !== undefined) {
                  string += ` ${obj[key].operator} '${obj[key].value
                    .substring(0, obj[key].value.lastIndexOf("Z"))
                    .split("T")
                    .join(" ")}'`;
                } else {
                  string += `= '${obj[key].value
                    .substring(0, obj[key].value.lastIndexOf("Z"))
                    .split("T")
                    .join(" ")}'`;
                }
              } else {
                if (obj[key]?.operator !== undefined) {
                  string += ` ${obj[key].operator} '${obj[key].value}'`;
                } else {
                  string += ` LIKE '%${obj[key].value}%'`;
                }
              }
              break;
            default:
              string += `=${obj[key]}`;
              break;
          }
          if (Object.keys(obj).indexOf(key) < Object.keys(obj).length - 1) {
            string += ` AND `;
          }
        }
        console.log(string);
        return string;
      },
    };
    return returner;
  }

  #constroctOrderStringobj(obj) {
    const returner = {
      toSqlString: function () {
        for (const key in obj) {
          string += `${key} ${obj[key]}`;
          if (Object.keys(obj).indexOf(key) < Object.keys(obj).length - 1) {
            string += `,`;
          }
        }
        return string;
      },
    };
    return returner;
  }

  async createone(table, object) {
    const connection = await this.#pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO ${table} SET ?`,
      object
    );
    await connection.release();
    return result.insertId;
  }

  async uploadimg(table,file,img_col){
    const connection = await this.#pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO ${table} (${img_col}) VALUES (BINARY(?))`,file
    );
    await connection.release();
    return result.insertId;
  }

  async createmany(table, objects) {
    // let results
    // for(const object of objects){
    //   const insertedId=await this.createOne(table,object);
    //   results.push(insertedId);
    // }
    // return results;
  }

  /* 
  filter format:

  {
    key:{
      value:value,
      operator:'<','>','<=','>='
    }
  }
  for date object, pass the iso string to the value
  */

  async read(table, filter = null, limit = null, order = null) {
    const connection = await this.#pool.getConnection();
    let values = [];
    if (!(filter === null || filter === undefined)) {
      const obj = this.#constructSqlStringObj(filter);
      values.push(obj);
    }
    limit ? values.push(limit) : null;
    if (!(order === null || order === undefined)) {
      const obj = this.#constroctOrderStringobj(order);
      values.push(obj);
    }
    const [result] = await connection.query(
      `SELECT * FROM ${table} ${filter ? `WHERE ?` : ``}
      ${limit ? `LIMIT ?` : ""}
      ${order ? `ORDER BY ?` : ""}`,
      values
    );
    await connection.release();
    return result;
  }

  async readone(table, filter = null) {
    const connection = await this.#pool.getConnection();
    let value = [];
    let obj;
    if (!(filter === null || filter === undefined)) {
      obj = this.#constructSqlStringObj(filter);
      value.push(obj);
    }
    const [result] = await connection.query(
      `SELECT * FROM ${table} ${filter ? `WHERE ?` : ``} LIMIT 1`,
      obj
    );
    await connection.release();
    return result[0];
  }

  async readid(table, id) {
    const connection = await this.#pool.getConnection();
    const [result] = await connection.query(
      `SELECT * FROM ${table} WHERE id =?`,
      id
    );
    await connection.release();
    return result[0];
  }

  async deleteid(table, id) {
    const connection = await this.#pool.getConnection();
    const [result] = await connection.query(
      `DELETE FROM ${table} WHERE id =?`,
      [id]
    );
    await connection.release();
    return result.affectedRows;
  }

  async deletemany(table, filter) {}

  async updateid(table, object, id) {
    const connection = await this.#pool.getConnection();
    const [result] = await connection.query(
      `UPDATE ${table} SET? WHERE id =?`,
      [object, id]
    );
    await connection.release();
    return result.affectedRows;
  }

  async updatemany(table, objects) {}
}
// may need to add mysql connector for later some mysql use case, or just make a one-time file for that use

/**
 *
 * @param {*} config
 * @returns {{mongo:typeof MongoConnector,json:typeof JSONConnector,MongoConnector:typeof MongoConnector,JSONConnector:typeof JSONConnector}}
 */
module.exports = (config) => {
  return {
    mongo: new MongoConnector(config.db?.mongo),
    json: new JSONConnector(config.db?.json),
    mysql: new SQLConnector(config.db?.sql),
    MongoConnector,
    JSONConnector,
  };
};
