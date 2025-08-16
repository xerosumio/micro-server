function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let clients={};

module.exports = async function ({ sse }) {
  console.log(sse.ctx);
  console.log(sse.ctx.query);

  // insert to the clients object for specified notification
  clients[sse.ctx.query.id]=sse.ctx;
  // broadcast once
  sse.send({
    event: "connected",
    data: JSON.stringify({status:true}),
  });
  // example for sending data to specific client
  // this is useful when there is any discount or offer which the clients should know
  const first=Object.keys(clients).at(0);
  clients[first].sse.send({event:'notice',data:'You are the first one to connect'});

  if(clients[first].sse.closed){
    delete clients[first];
  }
  console.log(clients);
  
  // auto broadcast
  setInterval(() => {
    sse.send({
      event: "events",
      data: new Date().toLocaleTimeString(),
    });
  }, 1000);
};