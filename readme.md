# Micro Server
## Usage
### How to install?

```
npm install git@gitlab.com:tuofaninfo/micro-server.git
```

### Use in your project.
```javascript
const microServer = require("micro-server");
microServer.start({ projectDir: __dirname });
// any program e.g. watcher, cron job you wish to run
//below is an example of a cron job
const {getMail}=require('./services/sms/gmail');
const cron = require('node-cron');
cron.schedule('0 0 * * *', () => {
    getMail().then(()=>console.log('data stored')).catch(err=>console.log(err));
});
```

### How to start the server
for the below examples, they will use the config.dev.js
```bash
# Unix system, the SERVER_ENV should match the files in the config folder
SERVER_ENV=dev node server.js
```
```powershell
# Window System
set SERVER_ENV=dev
node server.js
```

### How to use datap?
```javascript
const microServer = require('micro-server')
const { datap, joi } = microServer.helper;

// for operating with the default mongo link
datap.mongo.readone(...)

// for operating with more than one mongo link
const { config } = microServer.microConfig;
const mailBox=new datap.MongoConnector(config.db.mailbox);
const dashboard=new datap.MongoConnector(config.db.dashboard);

```
### How to load config within the project
```javascript
const microServer=require('micro-server');
const { config } = microServer.microConfig;
```

## Format of the config
```javascript
module.exports=()=>{
    return {
        db: {
            mongo: "mongodb+srv://user:xxxxxxxxxxxx@cluster0.lst9u.mongodb.net/db?retryWrites=true&w=majority",
            json: path.join(__dirname, "../db/db.json"),
            mailbox: "mongodb+srv://user:xxxxxxxxxx@mqtt.3ksw9dn.mongodb.net/db",
            dashboard:"mongodb+srv://user:xxxxxxxxxxxxxx@mqtt.aqeicjn.mongodb.net/db?retryWrites=true&w=majority"
        },
        port:8080,
        bodyParser:{
            jsonLimit:'5gb',
            textLimit:'5gb'
        }
    }
}
```

**Common attribute for the config file**

|attributes|description|
|----|----|
|port|port number|
|db.mongo|default mongodb link|
|bodyParser.jsonLimit|the json limitation of the body-parser middleware|
|bodyParser.textLimit|the text limitation of the body-parser middleware|

attributes other than the table are custom values, you can still use the custom values through out the program.

### Adding services
Be sure your services are placing under the directory name `services`, under it should be have a folder and js files for hosting your functions.

e.g.:
```javascript
// filename: services/auth/user.js
const login=({data})=>{
    // if it encounter the exception, its status code will be 400
     if (/* condition does not fulfill */) {
        const err = new Error(/* any error message back to the server */);
        err.code = 400;
        throw err;
    }

    // return will returns the data back to frontend, and its status code will be 200
    // it does not have to be the following format, you can construct your own, the return object will goes to the data of the response.
    return {message:'login sucessful'}
};

module.export={login}
```

### Helper Functions
#### To call them
```javascript
const { utils } = microServer.helper;
```
##### Functions in the utils object
|function name|parameter|output type|description|
|----|----|----|----|
|guid|none|string|generate a series of guid randomly|
|retry|timeOfRetry:number,function|any or null, depends on the function|retry the input function for the given time, default retry is 3|
|sleep|ms:number|null|only let the server wait a while for the given time|
|compose|fns:Array<Function>|depends on the last function|It warp the functions together and execute it in order. For example, you want to check the credential before executing the next process|
|pipe|same as compose|same as compose|the alaise of compose|
|generateKey|size:number,format:string|string|generate an encrypted key with the given byte size and format for encryption|
|generateSecretHash|key:string|string|generate a hash with the key generated using the generateKey|
|compareKeys|storedKey:string,suppliedKey:string|boolean|compare if both key are the same|
|logger.info|obj:Array<any>|null|output the given objects into the console with a timestamp in cyan color|
|logger.debug|obj:Array<any>|null|output the given objects into the console with a timestamp in yellow color|
|logger.error|obj:Array<any>|null|output the given objects into the console with a timestamp in red color|