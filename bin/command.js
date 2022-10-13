#!/usr/bin/env node
const path = require("path");

const fsp = require("fs/promises");
const { program } = require("commander");
const package = require("../package.json");

program.version(package.version);

program.command("init").action(async () => {});

program.parse();
