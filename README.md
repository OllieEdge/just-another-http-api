![just-another-http-api](https://github.com/OllieEdge/just-another-http-api/blob/main/logo/logo.png?raw=true "Just Another HTTP API")

[![Run Unit Tests](https://github.com/OllieEdge/just-another-http-api/actions/workflows/main.yml/badge.svg)](https://github.com/OllieEdge/just-another-http-api/actions/workflows/main.yml)
[![Open Source? Yes!](https://badgen.net/badge/Open%20Source%20%3F/Yes%21/blue?icon=github)](https://github.com/Naereen/badges/)
[![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/Naereen/StrapDown.js/blob/master/LICENSE)
[![Awesome Badges](https://img.shields.io/badge/badges-awesome-green.svg)](https://github.com/Naereen/badges)


# Just Another HTTP API
A framework built on top of restify aimed at removing the need for any network or server configuration. You can install this package and immediately begin coding logic for your endpoints.

This framework scans your `./routes` directory (*configurable*) and automatically builds all of your endpoints using the file and folder structure you setup. For each endpoint a single `*.js` will be able to split logic based on the method of the requests.


## Quickstart
- Install package: `npm i just-another-http-api`
- Make routes directory: `mkdir routes`
- Add the following to your app.js: 
```
const API = require('just-another-http-api');

const server = await API();
// server is now ready.
```
- Add a route: `touch ./routes/endpoint.js`
- Handle request in your new endpoint:
```
exports.get = async req => {
    return {
        "hello": "world"
    };
}
```
- Run server: `npm start`
- Load http://localhost:4001/endpoint in your browser and you will see the JSON response.


## Supported Node Versions
This is a personal project I've modified a few times over the years, I've just cleaned everything up and made OpenSource, in the process I've made it compatible with the latest Node as of May 2022 (v18), previous node versions are not supported.

| Node Release  | Supported in Current Version | Notes    |
| :--:     | :---: | :---:       | 
| 18.x | **Yes**      | Current stable | 
| <18 | **No**      | No Support | 

# Usage
## Initialise server
Pretty simple to get the server running, use one of the following options:
```
const API = require ( 'just-another-http-api' );

// Option 1
const server = await API();

// Option 2 - you should use this option.Find more about config settings below.
const config = {
    docRoot: 'customDir',
    bodyParser: true,
    queryParser: true
}
const server = await API( config );

// Option 3
const restify = require ( 'restify' );
const config = {
    docRoot: 'customDir',
    bodyParser: true,
    queryParser: true
}
const reportAnalytics = ( endpointUsage => { console.log ( endpointUsage.path ) } );
const customServer = restify.createServer();
const server = await API( config, reportAnalytics, customServer );
```

If you need to shut the server down, make sure you have stored the server instance and call its `close()` method. eg:
```
server.close();
```

## Set up your endpoints
Create routes using your file and folder structure. By default Just Another HTTP API will look for a routes folder in your working directory, you can change this by parsing a docRoot in the config.
```
// Config Object

{
    docRoot: 'customFolder'
}
```

If your folder structure was the following:
```
root/
├── app.js
├── routes/
│   ├── index.js
│   ├── users/
│   │   ├── index.js
│   │   ├── userId.js
│   └── atoms/
│       ├── index.js
│       ├── atomId.js
│       ├── protons/
│       │   └── protonId.js
│       ├── neutrons/
│       │   └── neutronId.js
│       └── electrons/
│           └── electronId.js
└── package.json
```
It would give you the following endpoints:
```
Endpoint                                    File used
--------                                    ---------
...                                         (routes/index.js)
.../users                                   (routes/users/index.js)
.../users/:userId                           (routes/users/userId.js)
.../atoms                                   (routes/atoms/index.js)
.../atoms/:atomId                           (routes/atoms/atomId.js)
.../atoms/protons/:protonId                 (routes/atoms/protons/protonId.js)
.../atoms/neutrons/:neutronId               (routes/atoms/neutrons/neutronId.js)  
.../atoms/electrons/:electronsId            (routes/atoms/electrons/electronsId.js)
```
---
### Configuring your endpoint logic
Each endpoint can export any of the follow http methods: `head, get, post, put, patch, del`

Just Another HTTP API doesn't really care about the method you are using, there is not logical difference so it will be up to you to decide how you implement them. Typically HEAD and GET never changes anything it only returns information, whereas PUT, POST, PATCH and DEL will most likely modify some kind of data. More about HTTP Methods can be found here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods

For this example we are going to be using a file located at `./routes/users/userId.js` in our project. It will accept GET and POST methods. Here is the code for this file:
```
exports.get = async req => {

    // Because this filename has 'Id' in its title it will extract the userId provided in the request and make it avaiable via the request parameters
    const { userId } = req.params;

    // Connect to a datastore and retrieve user data using the userId provided in the params.
    const user = await db.query(`SELECT * FROM users WHERE id = ${ userId }`);

    // Return the data in the response
    return user;
}

exports.post = async req => {

    // extract the JSON we sent in the request. Requires config.bodyParser to be true
    const { body } = req;
    const { userId } = req.params;

    // Update a user login goes here
    const user = {};

    return user;
}

exports.put = async req => { throw new Error ( 'Not configured' ) };
exports.del = async req => { throw new Error ( 'Not configured' ) };
exports.patch = async req => { throw new Error ( 'Not configured' ) };
```
---
## Example configuration
When initialising the API you can parse it a config object. Below is a typical variant:
```
{
    bodyParser: true,
    queryParser: true,
    uploads: {
        enabled: true
    },
    docRoot: './routes',
    port: 4001,
    cors: {
        credentials: false,
        origins: [ '*' ],
        allowHeaders: [
            'accept',
            'accept-version',
            'content-type',
            'request-id',
            'origin',
            'x-api-version',
            'x-request-id'
        ],
        exposeHeaders: [
            'accept',
            'accept-version',
            'content-type',
            'request-id',
            'origin',
            'x-api-version',
            'x-request-id'
        ],
    }
};
```

| Config option | Default | Type | Description | Notes    |
| :--:     | :--: | :--:  | :---: | :---:       | 
| bodyParser | `false` | Boolean | Will enable the `.body` attribute of the `request` object | -
| queryParser | `false` | Boolean | Will enable the `.query` attribute of the `request` object | Query parameters will be stored in a key/value object
| uploads | `null` | Object | Enables the `application/octet-stream` content-type | Supported by the multer module, see more here for config options: https://github.com/expressjs/multer
| docRoot | `./routes` | String | Changes the directory to map endpoints with | -
| port | `4001` | Integer | Set the port number the server runs on | -
| cors | `null` | Object | Set the default cors | -


## LICENSE
MIT License

Copyright (c) 2022 Oliver Edgington

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Contact & Links
Oliver Edgington <oliver@edgington.com>

[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/cloudposse.svg?style=social&label=Follow%20%40OllieEdge)](https://twitter.com/OllieEdge)
