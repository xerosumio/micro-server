const crypto = require("crypto");
const guid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
};

function randString(e) {
  e = e || 32;
  const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  const a = t.length;
  let n = "";
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

function cryptoPwd(str, salt) {
  return crypto.createHmac("sha256", salt).update(str).digest("hex");
}

const retry = async (max = 3, fn) => {
  let count = 0;
  const errors = [];
  while (count < max) {
    try {
      return await fn();
    } catch (e) {
      count++;
      errors.push(e);
    }
  }
  const e = new Error("Retry exceeded!");
  e.details = errors;
  throw e;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const compose = (...fns) => {
  return async (_reqObj) => {
    const reqObj = { ..._reqObj, state: {} };
    let result;
    for (const fn of fns) {
      result = await fn(reqObj);
    }
    return result;
  };
};

const pipe = compose;

const args = (fn, args) => {
  return async (thisArgs) => {
    return fn(_.merge({}, { ...thisArgs }, { ...args }));
  };
};

const visible = ({ includes, excludes }) => {
  return async ({ from }) => {
    if (includes?.includes) {
      assert(includes.includes(from), "cannot be call");
    }

    if (excludes?.includes) {
      assert(!excludes.includes(from), "cannot be call");
    }
  };
};

const generateKey = (size = 32, format = "base64") => {
  return crypto.randomBytes(size).toString(format);
};

const generateSecretHash = (key) => {
  const salt = crypto.randomBytes(8).toString("hex");
  return `${crypto.scryptSync(key, salt, 64).toString("hex")}.${salt}`;
};

const compareKeys = (storedKey, suppliedKey) => {
  const [hashedPassword, salt] = storedKey.split(".");

  const buffer = crypto.scryptSync(suppliedKey, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hashedPassword, "hex"), buffer);
};

const logger = {
  info: (...obj) => {
    console.log(`\x1b[36m[${new Date().toISOString()}]\x1b[0m`, ...obj);
  },
  debug: (...obj) => {
    console.log(`\x1b[33m[${new Date().toISOString()}]\x1b[0m`, ...obj);
  },
  error: (...obj) => {
    console.log(`\x1b[31m[${new Date().toISOString()}]\x1b[0m`, ...obj);
  },
};

function isEmail(str) {
  const reg = /^\w+@[a-zA-Z0-9]{2,10}(?:\.[a-z]{2,4}){1,3}$/;
  return reg.test(str);
}

/**
 * 
 * @param {RegExp} ruleRegExp 
 * @param {string} password 
 * @param {number} errorCode 
 */
const matchPasswordRule = (ruleRegExp,password,message="password must be numbers, uppercase/lowercase letters, between 6 and 16 in length, (at least one uppercase letter)", errorCode = 102) => {
  if (!ruleRegExp.test(password)) {
      const err = new Error(
          message
      );
      err.code = errorCode;
      throw err;
  }
};

module.exports = {
  guid,
  cryptoPwd,
  generateKey,
  generateSecretHash,
  compareKeys,
  randString,
  compose,
  pipe,
  sleep,
  visible,
  retry,
  logger,
  isEmail,
  matchPasswordRule
};
