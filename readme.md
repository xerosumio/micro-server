## How to install?

```
npm install git@gitlab.com:tuofaninfo/micro-server.git
```

## Use in your project.
```javascript
const microServer = require("micro-server");
microServer.start({ projectDir: __dirname });
```

## How to use datap?
```javascript
const microServer = require('micro-server')
const { datap, joi } = microServer.helper;

datap.mongo.readone(...)

```
## How to load config within the project
```javascript
const microServer=require('micro-server');
const { config } = microServer.microConfig;
```