![just-another-http-api](https://github.com/OllieEdge/just-another-http-api/blob/main/logo/logo.png?raw=true "Just Another HTTP API")

[![Run Unit Tests](https://github.com/OllieEdge/just-another-http-api/actions/workflows/main.yml/badge.svg)](https://github.com/OllieEdge/just-another-http-api/actions/workflows/main.yml)
[![Open Source? Yes!](https://badgen.net/badge/Open%20Source%20%3F/Yes%21/blue?icon=github)](https://github.com/Naereen/badges/)
[![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/Naereen/StrapDown.js/blob/master/LICENSE)
[![Awesome Badges](https://img.shields.io/badge/badges-awesome-green.svg)](https://github.com/Naereen/badges)


# Just Another HTTP API

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Terminology](#terminology)
4. [Quickstart](#quickstart)
5. [Configuration](#configuration)
6. [Examples](#examples)
--
1. [Upload](#uploads)
2. [Caching](#caching)
3. [Authentication](#authentication)

## Introduction
This module provides a comprehensive but *extremely* simple solution for creating HTTP servers with support for features like caching, authentication, file uploads, and more. It leverages Fastify for high performance and includes integrations with Redis for caching and AWS S3 for file uploads. This lightweight HTTP API is used by businesses receiving over 100,000 requests every minute but can also been seen as a quick solution for those devs who want to get something up and running quickly! Unique for its simplicity and efficiency, it's designed to streamline the process of setting up an HTTP server.

## Installation
To use this module, you need to have Node v18+ and npm installed. You can then include it in your project by cloning the repository or copying the module file.

## Terminology
- **Endpoint** - A url that points to a particular part of a servers functionality e.g. `domain.com/endpoint`
- **Endpoint Handler** - The javascript file that handles that endpoint e.g. `./routes/endpoint/index.js`
- **Endpoint Handler Methods** - The function that handles the particular HTTP Method for that endpoint e.g. `exports.get` in `./routes/endpoint/index.js` would handle HTTP GET requests to `domain.com/endpoint`
- **Endpoint Handler Config** The config object defined in an endpoint handler by `exports.config`
- **Global Config** The config that is parse to **just-another-http-api** during initialization e.g. `const server = await justAnotherHttpApi ( globalConfig )`

## Quickstart

- Create new project in directory of your choice - `npm init`
- Install module `npm i just-another-http-api`
- Copy the following in to your `index.js`

```javascript
const justAnotherHttpApi = require ( 'just-another-http-api' );

const globalConfig = { 
    name: 'My Server',
    port: 4500
};

( async () => {
    const server = await justAnotherHttpApi( globalConfig );
    console.log ( 'Server Ready' );
} ) ();
```

- Add a new endpoint by creating a the following folder structure: `/routes/myendpoint/index.js`
- Copy the following to `/routes/myendpoint/index.js`

```javascript
const response = require ( 'just-another-http-api/utils/response' );

exports.get = async req => {
    return response ( { json: { hello: 'world' } } );
};
```

- Run your server `node index.js`
- Open a browser and navigate to `http://localhost:4500/myendpoint` and see your response.

## Configuration
The HTTP API module requires a configuration object to initialize. Here's a breakdown of the configuration options:

- `name`: Name of the server.
- `cache`: Caching configuration.
  - `defaultExpiry`: Default cache expiry time in seconds.
  - `enabled`: Enable or disable caching.
  - `addCacheHeaders`: Add cache-related headers to the response.
  - `redisClient`: Redis client instance.
  - `redisPrefix`: Prefix for Redis cache keys.
- `auth`: Authentication configuration.
  - `requiresAuth`: Global flag to require authentication.
  - `type`: Type of authentication (currently only JWT).
  - `jwtSecret`: Secret key for JWT.
  - `jwtLoginHandle`: Function to handle login logic.
  - `jwtExpiresIn`: JWT expiry time in seconds.
  - `jwtEnabledRefreshTokens`: Enable or disable refresh tokens.
  - `jwtStoreRefreshToken`: Function to store refresh tokens.
  - `jwtRetrieveRefreshToken`: Function to retrieve refresh tokens.
  - `jwtRefreshExpiresIn`: Expiry time for refresh tokens.
- `docRoot`: Directory containing route definitions.
- `port`: Port number for the server.
- `logs`: Enable or disable logging. Accepts a function or false.
- `uploads`: File upload configuration.
  - `enabled`: Enable or disable file uploads.
  - `storageType`: Type of storage ('s3', 'memory', or 'filesystem').
  - `localUploadDirectory`: Directory for local file uploads.
  - `s3Client`: AWS S3 client instance.
  - `s3UploadDirectory`: S3 directory for file uploads.
  - `s3UploadBucket`: S3 bucket for file uploads.
- `cors`: CORS configuration.
- `middleware`: Array of additional middleware functions.

## Examples
Here's an example of how to set up the **global configuration**:

```javascript
const getConfig = async () => {
  // Initialize Redis and S3 clients, and define authentication functions
  ...
  return {
    name: 'Server Name',
    cache: {...}, // See Caching section for details
    auth: {...}, // See Authentication section for details
    docRoot: './routes', // This is where you store your endpoint handlers
    port: 4500,
    logs: false, // Accepts function or false
    uploads: {...}, // See Uploads section for details
    cors: {
        allowedHeaders: [
            'accept',
            'accept-version',
            'content-type',
            'request-id',
            'origin',
        ],
        exposedHeaders: [
            'accept',
            'accept-version',
            'content-type',
            'request-id',
            'origin',
            'x-cache',
            'x-cache-age',
            'x-cache-expires',
        ],
        origin: '*',
        methods: 'GET,PUT,POST,DELETE,OPTIONS',
        optionsSuccessStatus: 204
    }, 
    middleware: [] // Currently not implemented
  };
};
```

Here's an example of how to set up the **endpoint handler configuration**:

```javascript
// ./routes/endpoint/index.js
exports.config = {
    get: {
        cache: true,
        expires: 50, //seconds
        requiresAuth: false
    },
    post: {
        upload: {
            enabled: true,
            storageType: 'filesystem', // memory, filesystem, s3 (overrides the global config)
            requestFileKey: 'data', // defaults to "files"
            maxFileSize: 1000 * 1000 * 1000 * 1000 * 2, // 2GB
            maxFiles: 1,
            s3ACL: 'public-read',
            subDirectory: 'test'        
        },
        cache: false
    }
};

// endpoint method handlers
exports.get = async ( req ) => { ... }
exports.post = async ( req ) => { ... }
// ...etc
```

## Uploads

The upload functionality in the API allows for file uploads with various storage options including in-memory, filesystem, and Amazon S3. The configuration is flexible and can be set globally or overridden on a per-endpoint basis.

### Configuration

Uploads are configured through the `exports.config` object. Here's an example of how you can configure uploads for a particular endpoint handler:

```javascript
exports.config = {
    post: {
        upload: {
            enabled: true,
            storageType: 's3', // Options: 'memory', 'filesystem', 's3'
            requestFileKey: 'data', // Field name in the multipart form, defaults to 'files'
            maxFileSize: 1000 * 1000 * 1000 * 1000 * 2, // Maximum file size, here set to 2GB
            maxFiles: 5, // Maximum number of files
            s3ACL: 'public-read', // S3 Access Control List setting
            subDirectory: 'test' // Optional subdirectory for file storage in S3
        },
        cache: false
    }
};
```

### Storage Options

- **Memory**: Stores the files in the server's memory. Suitable for small files and testing environments.
- **Filesystem**: Stores the files on the server's file system. Requires setting the `localUploadDirectory` in the global configuration.
- **S3**: Stores the files in an Amazon S3 bucket. Requires the S3 client configuration.

### Handling Uploads

The upload handler middleware is automatically invoked for endpoints configured with upload functionality. It handles the file upload process based on the specified configuration, including the management of storage and any necessary cleanup in case of errors.

### Error Handling

The upload middleware provides comprehensive error handling to cover various scenarios such as file size limits, unsupported file types, and storage issues. Users will receive clear error messages guiding them to resolve any issues that may arise during the file upload process.


## Accessing Uploaded Files

After configuring the upload settings, you can access the uploaded files in your request handler. The uploaded file data will be available in the request (`req`) object. Depending on the storage type and the `maxFiles` setting, the structure of the uploaded file data may vary.

### S3 Storage
When using S3 storage, the uploaded files are available in the `req.files` array. Each file in the array is an object containing metadata and the path of the uploaded file in the S3 bucket. For example:

```json
[
    {
        "fieldname": "<input field name>",
        "originalname": "<original file name>",
        "encoding": "7bit",
        "mimetype": "<mime type>",
        "path": "<S3 bucket path>"
    },
    ...
]
```

If `maxFiles` is set to 1, the file information will be available as a single object in `req.file`.

### Memory Storage
When using memory storage, the file's content is stored in memory. The file data can be accessed through `req.file` or `req.files` depending on `maxFiles`. An example structure is:

```json
{
    "fieldname": "<input field name>",
    "originalname": "<original file name>",
    "encoding": "7bit",
    "mimetype": "<mime type>",
    "buffer": "<file data buffer>",
    "size": <file size in bytes>
}
```

### Filesystem Storage
For filesystem storage, the file is saved to the specified directory on the server. The file information, including the path to the saved file, can be accessed in a similar way:

```json
{
    "fieldname": "<input field name>",
    "originalname": "<original file name>",
    "encoding": "7bit",
    "mimetype": "<mime type>",
    "destination": "<file save directory>",
    "filename": "<generated file name>",
    "path": "<full file path>",
    "size": <file size in bytes>
}
```

## Caching
The API module provides a robust caching system to enhance performance and reduce load on the server. This system caches responses based on the request URL and query parameters.

### Configuration
Caching can be configured in the handlerConfig for each endpoint. Here is an example configuration:

```javascript
exports.config = {
    get: {
        cache: true,
        expires: 50, // seconds
    },
    post: {
        cache: false
    }
};
```

In this configuration:

- **GET** requests are cached for 50 seconds.
- **POST** requests are not cached.

### How It Works
When a request is made, the cache middleware checks if a valid, non-expired cache entry exists.
If a valid cache exists, the response is served from the cache, bypassing the handler.
If no valid cache is found, the request proceeds to the handler, and the response is cached for future use.

### Features
- **Default Expiry**: You can set a default cache expiry time in the global configuration.
- **Custom Expiry**: Each endpoint can have a custom cache expiry time.
- **Cache Headers**: The module can add cache-related headers (Age, Cache-Control, etc.) to responses.
- **Redis Integration**: The caching system is integrated with Redis for efficient, scalable storage.

### Usage
The provided example below assumes your docRoot is `./routes`. The following file would be `./routes/example/index.js`

Below would provide you with the following endpoints:
- **GET** `http://localhost:4500/example` (cached)
- **POST** `http://localhost:4500/example` (not cached)

```javascript
const response = require ( 'just-another-http-api/utils/response' );

exports.config = {
    get: {
        cache: true,
        expires: 50, //seconds
    },
    post: {
        cache: false
    }
};

exports.get = async req => {
    return response ( { html: '<p>hello world</p>' } );
};
exports.post = async req => {
    return req.body ;
};

```

The caching system handles the caching and retrieval of responses automatically, based on the provided configuration. Responses that are cached do not execute any code in your endpoint method handler.

### Cache Headers
The API module utilizes specific headers to convey caching information to clients. These headers are included in responses to indicate whether the data was served from the cache or generated afresh, as well as to provide information about the age and expiry of the cache data.

Headers for Cache Miss (Data not served from cache)
When the response data is not served from the cache (Cache Miss), the following headers are added:

- **X-Cache**: Set to 'MISS' to indicate that the response was generated anew and not served from the cache.
- **X-Cache-Age**: Set to 0, as the response is fresh.
- **X-Cache-Expires**: Indicates the time (in seconds) until this response will be cached. This is determined by the expires configuration in the handlerConfig or the default cache expiry time.


When the response data is served from the cache (Cache Hit), the following headers are included:

- **X-Cache**: Set to 'HIT' to indicate that the response was served from the cache.
- **X-Cache-Age**: Shows the age of the cached data in seconds.
- **X-Cache-Expires**: The maximum age of the cache entry. When `X-Cache-Age` reaches this number is will no longer be cached.

These headers provide valuable insights into the caching status of the response, helping clients to understand the freshness and validity of the data they receive.

## Authentication

### Overview
The API module supports JWT (JSON Web Token) based authentication. This provides a secure way to handle user authentication and authorization throughout the API.

### Configuration
Authentication is configurable through the `auth` object in the global configuration. Here are the key options and their descriptions:

- **requiresAuth**: A boolean value to enable or disable authentication globally. Default is `false`.
- **type**: Currently, the module supports only JWT authentication.
- **tokenEndpoint**: The endpoint you want to use for authenticating a new user. e.g.`/auth/login` (Default)
- **refreshTokenEndpoint**: The endpoint you want to use for refreshing tokens. e.g.`/auth/refresh` (Default)
- **jwtSecret**: A secret key used to sign the JWT tokens.
- **jwtLoginHandle**: A promise-based function to handle the login logic. It should return a user identifier (like a username) on successful login, or `false` on failure.
- **jwtExpiresIn**: Token expiry time in seconds. For example, `3600` for 1 hour.
- **jwtEnabledRefreshTokens**: Boolean value to enable or disable refresh tokens.
- **jwtStoreRefreshToken**: A promise-based function to store the refresh token. Typically, it involves storing the token in a database or a cache system.
- **jwtRetrieveRefreshToken**: A promise-based function to retrieve and validate the stored refresh token.
- **jwtRefreshExpiresIn**: Refresh token expiry time in seconds. For example, `604800` for 1 week.

### Implementation
The authentication logic is integrated with the Fastify server instance. The `auth` plugin is responsible for setting up the necessary routes and middleware for handling JWT-based authentication.

### Example

Coniguration for JWT auth:
```javascript
const config = {
    auth: {
        requiresAuth: true,
        tokenEndpoint: '/auth/login',
        refreshTokenEndpoint: '/auth/refresh',
        type: 'jwt', //only support for JWT currently
        jwtSecret: 'secretkey', // can be any string
        jwtLoginHandle: authenticateNewUser, // promise - see example below
        jwtExpiresIn: 3600, // 1 hour
        jwtEnabledRefreshTokens: true,
        jwtStoreRefreshToken: storeRefreshToken, // promise - see example below
        jwtRetrieveRefreshToken: retrieveRefreshToken, // promise - see example below
        jwtRefreshExpiresIn: 604800, // 1 week
    }
}
```

Example for authenticating a new user:
```javascript
// Add this as the `jwtLoginHandle` in the config
const authenticateNewUser = async ( requestBody ) => {
    const { username, password } = requestBody;

    // Do your own authentication here, this is just an example
    if ( username === 'admin' && password === 'admin' ) {

        return 'username'; // A unique identifier that can be used to identify the user
    }
    else return false; // Login failed
};
```

Example for storing a refresh token:
```javascript
// Add this as the `jwtStoreRefreshToken` in the config
const storeRefreshToken = async ( username, refreshToken ) => {
    await redis.set ( `refresh-token:${ username }`, refreshToken, 60 * 60 * 24 * 30 ); // Set expiry here

    return;
};
```

Example for retrieving a refresh token:
```javascript
// Add this as the `jwtRetrieveRefreshToken` in the config
const retrieveRefreshToken = async ( username, refreshToken ) => {
    const storedRefreshToken = await redis.get ( `refresh-token:${ username }` );

    return storedRefreshToken === refreshToken;
};
```

### Usage
To use JWT authentication, the `requiresAuth` flag must be set to `true` in the global configuration or at the endpoint level. The API will then require a valid JWT token for accessing protected routes.

#### Generating Tokens
Upon successful login (as determined by the `jwtLoginHandle` function), the API generates a JWT token based on the provided `jwtSecret` and `jwtExpiresIn` configuration.

#### Refresh Tokens
If `jwtEnabledRefreshTokens` is set to `true`, the API also generates a refresh token, allowing users to obtain a new access token without re-authenticating. This token is managed by the `jwtStoreRefreshToken` and `jwtRetrieveRefreshToken` functions.

#### Token Validation
For each request to a protected route, the API validates the provided JWT token. If the token is invalid or expired, the request is denied with an appropriate error message.

### Security
- Ensure the `jwtSecret` is kept secure and confidential.
- Regularly rotate the `jwtSecret` to maintain security.
- Implement robust login logic in the `jwtLoginHandle` function to prevent unauthorized access.

By integrating JWT authentication, the API ensures secure and efficient user authentication and authorization.

## Contributing
Contributions to improve the module or add new features are welcome. Please follow the standard GitHub pull request process.

## License
Specify the license under which this module is released.

## LICENSE
MIT License

Copyright (c) 2024 Oliver Edgington

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
