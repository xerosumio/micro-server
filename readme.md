# Micro Server
## Usage
### How to install?

```
npm install @xerosumio/micro-server
```
However, since this has became a private package, you will need `.npmrc` to access this package. This usually done by me, but just in case: you will need to create a personal access token with permission that able to read package at least, then the following is the `.npmrc`:
```.npmrc
//npm.pkg.github.com/:_authToken=PERSONAL_ACCESS_TOKEN
@NAMESPACE:registry=https://npm.pkg.github.com
```

### Use in your project.
```javascript
const microServer = require("@xerosumio/micro-server");
microServer.start({ projectDir: __dirname /* or cwd() of process package*/ });
// any program e.g. watcher, cron job you wish to run
//below is an example of a cron job
const {getMail}=require('./services/sms/gmail');
const cron = require('node-cron');
cron.schedule('0 0 * * *', () => {
    getMail().then(()=>console.log('data stored')).catch(err=>console.log(err));
});
```
**For the example usage, please refer to [this repo](https://github.com/xerosumio/micro-server-sample)**

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
const microServer = require('@xerosumio/micro-server')
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
const microServer=require('@xerosumio/micro-server');
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
            dashboard:"mongodb+srv://user:xxxxxxxxxxxxxx@mqtt.aqeicjn.mongodb.net/db?retryWrites=true&w=majority",
            sql:{
                host:"localhost",
                port:3306,
                user:"root",
                password:"<PASSWORD>",
                database:"micro_server"
            }
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

|attributes|type|description|
|----|----|----|
|port|`number`|port number|
|db.mongo|`string`|default mongodb link|
|db.sql|`object`|default config for mysql, now only support mysql and only one instance of it|
|bodyParser.jsonLimit|`string`|the json limitation of the body-parser middleware|
|bodyParser.textLimit|`string`|the text limitation of the body-parser middleware|
|static.enabled|`boolean`|indicate does it store/host the static assets|
|static.dirName|`string`|indicates where to put the static assets, to find them in the web, use the format `<host>:<port>`, for example, your web is host under port number `3000`, you can find the static assets under `http://localhost:3000`|
|upload.enabled|`boolean`|indicates is upload enabled|

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
|matchPasswordRule|ruleRegExp:`RegExp`,password:`string`,message:`string`,errorCode:`number`|none|a password checker that check password with the given regul expression rules. Only throws error when it is not match with the rule.message and errorCode are optional|
|isEmail|string:`string`|boolean|check if the given string is an email|
|randString|e:`number`|`string`|generate a random string with the given length `e`|
|cryptoPwd|str:`string`,salt:`string`|`string`|return an encrypted string with the given string and salt|
|storeUploadedFile|readerStream:`ReadStream`,filePath:`string`|`Array<Promises<T>>`|It used to store the files uploaded from the client side to the destinated `filePath`. For the reason why it has to pass the reader stream to the function rather than passing the name itself, cause the source maybe from network, so it will be better if this is passed as stream.|

Also, this libraries included the lodash package, you can use it by referencing to the following:
```js
const {utils}=require('@xerosumio/micro-server').helper;
const object={
    pw:'123jreanfdklvgnfdg',
    username:'IamSlickBACK'
}
utils._.omit(object,['pw']);
```
The above example initialize the `utils` object in the micro-server package, and this `utils` object has included the `_` of lodash with it. And its `omit` functions has been called to remove the `pw` property in the object and does not have any side effect in the object.

For further documentation to the library, please view the [documentation](https://lodash.com/docs/4.17.15)

Apart from `lodash` you can also use `fs-extra` package for further file manipulation. For how to use it is just the same way as `lodash` above.

For further documentation to the library, please view the [documentation](https://www.npmjs.com/package/fs-extra) of the package.

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
|update|coll:`string`,doc:`object`|`{acknowledged:boolean,matchedCount:number,modifiedCount:number,upsertedCount:number,upsertedId:string}`|update one document with the given document. Before using it, turn the `_id` of the object into `id`|
|updatemany|coll:`string`,q:`object`,doc:`object`|`{acknowledged:boolean,matchedCount:number,modifiedCount:number,upsertedCount:number,upsertedId:string}`|update the documents fulfill the criteria of `q` with the given `doc`|
|upsert|coll:`string`,doc:`object`|`{acknowledged:boolean,matchedCount:number,modifiedCount:number,upsertedCount:number,upsertedId:string}`|update the given document, if the document not exists, insert it|
|delete2|coll:`string`,id:`string`|`{acknowledged:boolean,deletedCount:number}`|remove the document with the given id|
|deletequery|coll:`string`,q:`object`|`{acknowledged:boolean,deletedCount:number}`|remove documents from the given collection `coll` with the given `q`|

2. SQLConnector
**input object**
This is to specified the objects in the `filter` parameters:
```js
// the following is the generic filter object
// key stands for column name, value stands for the value of the column, while operator is for the comparison operator mainly
// for string type value, the default operator is 'like', while for number type value, the default operator is '='
// for date obnject, please convert them into iso string, it will convert automatically
{
    key:{
        value:value,
        operator:'='
    },
    ...
}
```
for `order` parameter:
```js
// the following is the generic order object
// value only acepts 'asc' and 'desc'
{key:value}
```

|function name|parameters|output type|description|
|----|----|----|----|
|createone|table:`string`,object:`object`|`number`|insert `object` into the table `table`|
|read|table:`string`,filter:`Nullable<object>`,limit:`Nullable<number>`,order:`Nullable<object>`|`array<object>`|read the data from the table `table` with the given filter, limit|
|readone|table:`string`,filter:`Nullable<object>`|`object`|read the data from the table `table` with the given filter|
|readid|table:`string`,id:`string`|`object`|read the data from the table `table` with the given id|
|deleteid|table:`string`,id:`string`|`number`|delete the data from the table `table` with the given id|
|updateid|table:`string`,id:`string`,object:`object`|`number`|update the data from the table `table` with the given id|

3. JSONConnector
|function name|parameters|output type|description|
|----|----|----|----|
|connect|filePath|none|connect json db with the given file|
|db|none|`object`|return the db object|
|create|coll:`string`,doc:`object`|none|insert data `doc` into collection `coll`|


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
### Handling Files
This package also support files uploading. To do this, you should append the files to `files` key of the `FormData` class. After send it to the server, the server will process and pass the files under the `data.data._files` for request handler. And this have a function for converting the file stream back into its original form.
```js
// client
// consider this is the file upload element
document.getElementById("file-upload").addEventListener('change',e=>{
    let formData=new FormData();
    // in case it is multiple
    for(var i=0;i<e.target.files.length;i++){
        formData.append('files',e.target.files[i]);
    }
    axios({
        url:"http://localhost:3000/res/file/upload",
        method:"POST",
        data:formData,
    })
    .then(console.log)
    .catch(console.log);
});
// config in the server
module.export=()=>{
    return{
        upload: {
            // you must have this enabled before upload any files
            enabled: true,
            // this storage attributes is customizable, it just used for specifying where will the files truly stored
            storage:'uploads',
            multer:{
                // the files in this dir is only in binaries,
                // you cannot see its content after writing it
                // back into its original file format
                dest:'temp/'
            },
        },
    }
}
// corresponding request path(services/res/file.js in this example) in the server
const {utils}=require('@xerosumio/micro-server').helper;
const { cwd } = require('process');
const {config}=require('@xerosumio/micro-server').microConfig;
const isLogEnabled=config.log===true;
const fs=require('fs');
const storage=`${cwd()}/${config.upload.storage}`;

const upload=async({data})=>{
    if(isLogEnabled){
        utils.logger.debug('data: ',data._files);
    }
    utils.fsExtra.ensureDirSync(storage);
    data._files.forEach(async(v)=>{
        // open stream to read the file in temp storage
        const reader=fs.createReadStream(`${cwd()}/${v.path}`);
        await utils.storeUploadedFile(reader,`${storage}/${v.originalname}`);
    });


    return {
        message:'upload successfully'
    };
};

module.exports={
    upload
};
```
