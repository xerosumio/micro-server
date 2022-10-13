#!/usr/bin/env node
const path = require("path");

const fsp = require("fs/promises");
const { program } = require("commander");
const package = require("../package.json");

program.version(package.version);

const serverJS = `
  const microServer = require('micro-server');
  microServer.start();
`;

program.command("init").action(async () => {
  // const projectDir = process.cwd();
  // const serverFile = path.join(projectDir, "./server.js");
  // const serverStat = await fsp.stat(serverFile);
  // console.log(serverStat);
  // // fse.readFile(process.cwd(), "./config");
});

program.parse();
