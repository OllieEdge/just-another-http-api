const fastify = require ( 'fastify' );
const recursiveRead = require ( 'recursive-readdir' );
const packageJson = require ( './package.json' );
const path = require ( 'path' );

const caching = require ( './src/cache' );
const uploads = require ( './src/upload' );
const auth = require ( './src/auth' );
const cors = require ( './src/cors' );

const preventDuplicateRequests = require('./utils/preventDuplicateRequest');

let app;

module.exports = async ( config, _app = null ) => {
    app = _app || await createServer ( config );

    const endpoints = await loadEndpoints ( config );
    endpoints.forEach ( endpoint => registerEndpoint ( app, endpoint, config ) );

    await app.listen ( { port: process.env.PORT || config?.port || 4001 } );

    return app;
};

async function createServer ( config ) {
    const app = fastify ( {
        logger: config.logs || false,
        name: config.name || packageJson.name,
        ...( config?.fastify || {} )
    } );

    try {
        
        if ( config.cors ) {
            app.register ( require ( '@fastify/cors' ), config.cors );
        }
        if ( config.websocket?.enabled ){
            app.register ( require ( '@fastify/websocket' ), config.websocket?.options );
        }
        if (config.cookies?.enabled) {
            app.register ( require ( '@fastify/cookie' ), config.cookies );
        }
        await uploads.initialiseUploads ( app, config );
        await caching.initialiseCaching ( app, config );
        await auth.initialiseAuth ( app, config );

        if ( config.middleware && Array.isArray ( config.middleware ) ) {
            for ( const func of config.middleware ) {
                if ( typeof func === 'function' ) {
                    await app.register ( func );
                }
            }
        }
    }
    catch ( error ) {
        console.error ( 'Error during server initialization:', error );
        throw error; // Rethrow the error to handle it at a higher level, if necessary
    }

    return app;
}

async function loadEndpoints ( config ) {
    const files = await recursiveReadDir ( config?.docRoot || 'routes' );

    return files.map ( filePath => ( {
        handlers: require ( path.resolve ( filePath ) ),
        path: handlerPathToApiPath ( filePath, config?.docRoot || 'routes' )
    } ) );
}

function registerEndpoint ( app, endpoint, globalConfig ) {
    Object.keys ( endpoint.handlers ).filter ( method => method !== 'config' ).forEach ( method => {
        const handlerConfig = endpoint.handlers.config?.[ method ] || {};
        const requiresAuth = handlerConfig?.requiresAuth !== undefined ? handlerConfig.requiresAuth : !!globalConfig?.auth?.requiresAuth;

        const preHandlers = [];
        if ( requiresAuth ) {
            preHandlers.push ( async ( req, reply ) => {
                req.authConfig = handlerConfig.auth || globalConfig.auth;
                await auth.checkAuth ( req, reply );
            } );
        }

        if ( globalConfig?.uploads?.enabled && handlerConfig?.upload?.enabled ) {
            preHandlers.push ( uploads.handleUpload ( handlerConfig, globalConfig ) );
        }
        if ( handlerConfig?.cors !== undefined ) {
            preHandlers.push ( cors.addCustomCors ( handlerConfig, globalConfig ) );
        }
        if ( method.toLowerCase() === 'post' && handlerConfig?.preventDuplicate ) {
            preHandlers.push( preventDuplicateRequests );
        }

        const fastifyMethod = translateLegacyMethods ( method.toLowerCase () );
        const handler = endpoint.handlers[ method ];
        const wrappedHandler = fastifyHandlerWrapper ( handler, endpoint.handlers.config, globalConfig, method );

        app[ fastifyMethod ] ( 
            endpoint.path, 
            { 
                preHandler: preHandlers,
                websocket: handlerConfig?.websocket || false,
                bodyLimit: handlerConfig?.bodyLimit || undefined,
            },
            wrappedHandler 
        );
    } );
}

function translateLegacyMethods ( method ) {
    switch ( method ) {
        case 'del':
            return 'delete';
        default: 
            return method;
    }
}

function fastifyHandlerWrapper ( handler, config, globalConfig, method ) {
    if ( config?.[ method ]?.websocket ){
        return handler;
    }
    else {
        return async ( req, reply ) => {
            try {
                let response;
                if ( globalConfig?.cache?.enabled ){
                    const request = { method: req.method, query: JSON.parse ( JSON.stringify ( req.query ) ), routeOptions: req.routeOptions, params: JSON.parse ( JSON.stringify ( req.params ) ) };
                    response = await caching.checkRequestCache ( app, request, reply, config, globalConfig );

                    if ( !response ){
                        response = await handler ( req, { invalidateRequest: ( _req ) => caching.invalidateRequestCache( app, _req, globalConfig ) } );
                        await caching.setRequestCache ( app, request, response, config, globalConfig );
                    }
                }
                else {
                    response = await handler ( req );
                }

                handleResponse ( reply, response, req.method, req.routeOptions.url );
            }
            catch ( error ) {
                handleError ( reply, error );
            }
        };
    }
};

function handleResponse ( reply, response, method, path ) {
    
    if ( !response ) {
        reply.code ( 204 ).send ();
        
        return;
    }

    if ( typeof response !== 'object' || response === null ) {
        handleNonObjectResponse ( reply, response, method );
        
        return;
    }

    setResponseHeaders ( reply, response );
    handleSpecialResponseTypes ( reply, response, method, path );
}

function setResponseHeaders ( reply, response ) {
    if ( response.headers ) {
        Object.entries ( response.headers ).forEach ( ( [ key, value ] ) => {
            reply.header ( key, value );
        } );
    }
}

function handleSpecialResponseTypes ( reply, response, method, path ) {
    if ( response.redirect ) {
        reply.redirect ( 301, response.redirect.url );
        
        return;
    }

    if ( response.html ) {
        reply.code ( 200 ).type ( 'text/html' ).send ( response.html );
        
        return;
    }

    if ( response.text ) {
        reply.code ( 200 ).type ( 'text/plain' ).send ( response.text );
        
        return;
    }

    if ( response.error ) {
        handleErrorResponse ( reply, response.error );
        
        return;
    }

    if ( response.file ) {
        reply.send ( response.file );
        
        return;
    }

    sendGenericResponse ( reply, response, method, path );
}

function sendGenericResponse ( reply, response, method, path ) {
    const data = response.json !== undefined ? response.json : response.body ?? response.response ?? response;

    if ( data !== undefined ) {
        reply.type ( 'application/json' ).code ( method === 'post' ? 201 : 200 ).send ( data );
    }
    else {
        handleUnknownResponseType ( reply, method, path );
    }

}

function handleErrorResponse ( reply, error ) {
    console.error ( error );
    const statusCode = error?.statusCode ?? 500;
    reply.code ( statusCode ).type ( 'application/json' ).send ( { error: error.message } );
}

function handleUnknownResponseType ( reply, method, path ) {
    reply.type ( 'application/json' ).code ( 500 ).send ( {
        error: `Unrecognized response type for ${method} ${path}`
    } );
}

function handleNonObjectResponse ( reply, response, method ) {
    reply.type ( 'text/plain' ).code ( method === 'post' ? 201 : 200 ).send ( response.toString () );
}

function handleError ( reply, error ) {
    // Set content type for the error response
    reply.header ( 'Content-Type', 'application/json' );

    if ( error instanceof Error ) {
        // Send internal server error with the error stack
        reply.status ( 500 ).send ( { 
            error: 'Internal Server Error', 
            message: error.message, 
            stack: error.stack 
        } );
    }
    else {
        // Check if error object contains a specific status code
        if ( error.code && typeof error.code === 'number' ) {
            reply.status ( error.code ).send ( { 
                error: 'Error',
                message: error.message 
            } );
        }
        else {
            // Send a generic internal server error response
            reply.status ( 500 ).send ( { 
                error: 'Internal Server Error', 
                message: 'An unknown error occurred' 
            } );
        }
    }
}

const handlerPathToApiPath = ( path, docRoot ) => {

    const targetPath = path.replace ( docRoot.replace ( /.\//igm, '' ), '' ).split ( '/' );

    return '/' + targetPath.map ( subPath => {
        if ( subPath.includes ( 'index.js' ) && path.substr ( path.lastIndexOf ( '/' ) ).includes ( 'index' ) ) return null;
        if ( ( subPath.includes ( '-' ) || subPath.includes ( 'Id' ) ) && ( subPath.includes ( '.js' ) || subPath.includes ( 'Id' ) ) ) {
            subPath = subPath.split ( '-' ).map ( urlParameter => {
                urlParameter = urlParameter.replace ( /-/igm, '' );

                return ':' + urlParameter;
            } ).join ( '/' );
        }
        
        return subPath.replace ( /.js/igm, '' );
    } ).filter ( Boolean ).join ( '/' );

};

const recursiveReadDir = async ( docRoot ) => {
    try {
        const files = await recursiveRead ( docRoot );
        
        return files.filter ( filePath => filePath ? !filePath.includes ( 'DS_Store' ) : false ).reverse ();
    }
    catch ( e ){
        console.error ( 'JustAnother: Failed to load your routes directory for generating endpoints.' );
        throw e;
    }  
};