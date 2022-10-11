const datap = require("./datap");

module.exports = (microServer) => {
  console.log("hello");
  return {
    data: datap(microServer.config),
  };
};
