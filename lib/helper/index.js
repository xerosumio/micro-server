const datap = require("./datap");
const joi = require("joi");

module.exports = (microServer) => {
  return {
    data: datap(microServer.config),
    joi,
  };
};
