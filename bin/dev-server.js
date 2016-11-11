const fs = require("fs");
const path = require("path");
const serveIndex = require("serve-index");
const express = require("express");

const toolbox = require("../node_modules/devtools-local-toolbox/index");
const feature = require("devtools-config");
const getConfig = require("../configs/getConfig");

const envConfig = getConfig();
feature.setConfig(envConfig);

const webpackConfig = require("../webpack.config")(envConfig);
toolbox.startDevServer(envConfig, webpackConfig);

const examples = express();
examples.use(express.static("public/js/test/examples"));
examples.use(serveIndex("public/js/test/examples", { icons: true }));

const examplesPort = feature.getValue("development.examplesPort");
examples.listen(examplesPort, "0.0.0.0", (err, result) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`View debugger examples at http://localhost:${examplesPort}`);
  }
});
