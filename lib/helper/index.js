const datap = require("./datap");
const joi = require("joi");

module.exports = (microServer) => {
  return {
    datap: datap(microServer.config),
    joi,
  };
};
