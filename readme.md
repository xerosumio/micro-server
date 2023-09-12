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
**For the example usage, please refer to [this repo]()**

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
const { utils,datap,joi } = microServer.helper;
```
##### Functions in the utils object
|function name|parameter|output type|description|
|----|----|----|----|
|guid|none|string|generate a series of guid randomly|
|retry|timeOfRetry:`number`,function|any or null, depends on the function|retry the input function for the given time, default retry is 3|
|sleep|ms:`number`|`null`|only let the server wait a while for the given time in milliseconds|
|compose|fns:Array<Function>|depends on the last function|It warp the functions together and execute it in order. For example, you want to check the credential before executing the next process|
|pipe|same as compose|same as compose|the alaise of compose|
|generateKey|size:`number`,format:`string`|`string`|generate an encrypted key with the given byte size and format for encryption|
|generateSecretHash|key:`string`|`string`|generate a hash with the key generated using the generateKey|
|compareKeys|storedKey:`string`,suppliedKey:`string`|`boolean`|compare if both key are the same|
|logger.info|obj:Array<any>|null|output the given objects into the console with a timestamp in cyan color|
|logger.debug|obj:Array<any>|null|output the given objects into the console with a timestamp in yellow color|
|logger.error|obj:Array<any>|null|output the given objects into the console with a timestamp in red color|

##### Functions in Datap
1. MongoConnector

For parameter `query` and `sort`, please refer to the [here](https://www.mongodb.com/docs/manual/tutorial/query-documents/)

|function name|parameters|output type|description|
|----|----|----|----|
|connect|url:`string`,dbName:`string`|`MongoDb`|connect to the db using the given dbName and url|
|db|dbName:string|`MongoDb`|return the db with the given db name|
|create|coll:`string`,doc:`string`|`{insertedId,acknowledged}`|create a document into the connected mongodb, it will return the `insertedId`, which is the `_id` in common mongodb document, while the `acknowledged` indicates whether this write result was acknowledged|
|createmany|coll:`string`,doc:`string`|`{insertedIds}`|create multiple documents in the db, the insertedIds is an array of `_id` of the created documents|
|readone|coll:`string`,query:`object`,sort:`object`|`object`|find one document with the given query, the sort can be optional, it will fetch the most recent data if none of the sort criteria is inserted|
|readid2|coll:`string`,id:`string`|`object`|find the document with the given id|
|read|coll:`string`,query:`string`,limit:`number`,skip:`number`,sort:`object`|`array<object>`|it retrieve the documents specified in query as an array. limit, skip and sort are optional.|
|update|coll:`string`,doc:`object`|`{acknowledged,matchedCount,modifiedCount,upsertedCount,upsertedId}`|update one document with the given document. Before using it, turn the `_id` of the object into `id`|

2. JSONConnector

## Interact with the Server through Client
Given that your project structure is like this below

\(we will use axios for convenience\)

```javascript
// react
import default as axios from "axios";
import {useState,useEffect} from "react";

// e.g. server port is 3000
const BASE_URL='http://localhost:3000'

function List(){
    const [data,setData]=useState([]);


    // e.g. the server have a get function in the book.js under the services/res folder
    // load data from start
    useEffect(()=>{
        axios({
            method: 'post',
            url: `${BASE_URL}/res/book/get`,
            data: {
                /* criteria for querying data, example books */
                id:1,
                title:'Brave New World',
                author:'Aldous Huxley'
            }
        })
            .then((res)=>setData(res.data.data))
            .catch(err=>{console.log(err)});
    },[]);

    return (<>
        {data.map(d=>(<li key={d.id}>{d.txt}</li>))}
    </>);
}

export {List}

//vue
<tmeplate></template>
<script setup>
import {ref,onMounted}from 'vue';
import axios from 'axios';

const BASE_URL='http://localhost:3000'
const data=ref([]);

onMounted(()=>{
    axios({
            method: 'post',
            url: `${BASE_URL}/res/book/get`,
            data: {
                /* criteria for querying data, example books */
                id:1,
                title:'Brave New World',
                author:'Aldous Huxley'
            }
        })
        .then(res=>{data.value=res.data.data})
        .catch(err=>console.log(err))
});
</script>
```