const datap = require("./datap");

module.exports = (microServer) => {
  return {
    data: datap(microServer.config),
  };
};
