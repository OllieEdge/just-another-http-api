const restify = require ( 'restify' );
const restifyErrors = require ( 'restify-errors' );
const corsPlugin = require ( 'restify-cors-middleware2' );
const recursiveRead = require ( 'recursive-readdir' );
const packageJson = require ( './package.json' );
const path = require ( 'path' );
const multer = require ( 'multer' );
const storage = multer.memoryStorage ();

/**
 * See README for config setup.
 * 
 * @param {Object} config The config, see readme for example configurations
 * @param {Function} every An optional agrument that accepts a function ready to receive an object. The function will be called everytime a endpoint is requested (good for analytical usage)
 * @param {RestifyServer} _server Optionally override the restify instance in this API and use your own. Accepts a `restify.createServer()` instance.
 */
module.exports = async ( config, every = null, _server = null ) => {

    if ( !config ) console.log ( 'JustAnother: WARNING: You\'ve initialised Just Another Http API without any config. This is not recommended.' );

    let upload;
    let server = _server;

    if ( _server ) console.debug ( 'JustAnother: Using restify override instance provided.' );
    else {
        server = restify.createServer ( {
            name: packageJson.name,
            version: packageJson.version
        } );

        if ( config?.bodyParser ) server.use ( restify.plugins.queryParser () );
        if ( config?.bodyParser ) server.use ( restify.plugins.bodyParser () );
        if ( config?.uploads && config?.uploads.enabled ) upload = multer ( { storage: storage } );

        if ( config?.cors ){
            const cors = corsPlugin ( config.cors );
            server.pre ( cors.preflight );
            server.use ( cors.actual );
        }
    }

    server.on ( 'MethodNotAllowed', unknownMethodHandler );

    const files = await recursiveReadDir ( config?.docRoot || 'routes' );
    const endpoints = files.map ( ( filePath ) => ( {
        handlers: require ( path.resolve ( filePath ) ),
        path: handlerPathToApiPath ( filePath, config?.docRoot || 'routes' )
    } ) );

    endpoints.forEach ( endpoint => {
        Object.keys ( endpoint.handlers ).forEach ( method => {
            const endpointArgs = [
                endpoint.path,
                method === 'post' && upload ? upload.single ( 'file' ) : null
            ].filter ( Boolean );

            server[ method ] ( ...endpointArgs, async ( req, res ) => {
                try {
                    const response = await endpoint.handlers[ method ] ( req );
                
                    if ( every ) {
                        every ( { path: endpoint.path, method, req } );
                    }

                    // If optional headers have been provided in the response add them here.
                    if ( response.hasOwnProperty ( 'headers' ) ){
                        res.set ( response.headers ); 
                    }

                    // If response.html is set, we want to send the HTML back as a raw string and set the content type.
                    if ( response.hasOwnProperty ( 'html' ) ){
                        res.sendRaw ( 200, response.html, { 'Content-Type': 'text/html' } );
                    } //
                    else if ( response.hasOwnProperty ( 'json' ) || response.hasOwnProperty ( 'body' ) || response.hasOwnProperty ( 'response' ) || typeof response === 'string' ){
                        data = response?.json || response?.body || response?.response || response;
                        res.setHeader ( 'Content-Type', 'application/json' );
                        res.send ( method === 'post' ? 201 : 200, data );
                    }
                    else if ( response.hasOwnProperty ( 'error' ) ){
                        console.error ( error );
                        res.setHeader ( 'Content-Type', 'application/json' );
                        res.send ( new restifyErrors.makeErrFromCode ( response?.error?.statusCode, response?.error?.message ) );
                    }
                    else if ( response.hasOwnProperty ( 'file' ) ){
                        res.sendRaw ( response.file );
                    }
                    else if ( typeof response === 'object' ){
                        res.send ( response ); //Try and send whatever it is
                    }
                    else if ( !response ){
                        res.send ( 204 );
                    }
                    else {
                        res.setHeader ( 'Content-Type', 'application/json' );
                        res.send ( new restifyErrors.makeErrFromCode ( 500, `Just Another Http API did not understand the response provided for request: ${ method } to ${ endpoint.path }. Check your return value.` ) );
                    }

                    return;
                }
                catch ( error ){
                    res.setHeader ( 'Content-Type', 'application/json' );
                    if ( error instanceof Error ) {
                        res.send ( new restifyErrors.InternalServerError ( { code: 500 }, error.stack.replace ( /\n/g, ' ' ) ) );
                    }
                    else {
                        if ( error.code ) {
                            res.send ( new restifyErrors.makeErrFromCode ( error.code, error.message ) );
                        }
    
                        res.send ( new restifyErrors.InternalServerError ( { code: 500 }, JSON.stringify ( error, null, 2 ) ) );
                    }

                    return;
                }
            } );
        } );
    } );
            
    await server.listen ( process.env.PORT || config?.port || 4001 );
    
    return server;
};

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
        
        // Remove all falsy values and reverse the array.
        return files.filter ( filePath => filePath ? !filePath.includes ( 'DS_Store' ) : false ).reverse ();
    }
    catch ( e ){
        console.error ( 'JustAnother: Failed to load your routes directory for generating endpoints.' );
        throw e;
    }  
};

const unknownMethodHandler = ( req, res ) => {
    if ( req.method.toLowerCase () === 'options' ) {
        const allowHeaders = [ '*' ];

        if ( res.methods.indexOf ( 'OPTIONS' ) === -1 ) res.methods.push ( 'OPTIONS' );

        res.header ( 'Access-Control-Allow-Credentials', true );
        res.header ( 'Access-Control-Allow-Headers', allowHeaders.join ( ', ' ) );
        res.header ( 'Access-Control-Allow-Methods', res.methods.join ( ', ' ) );
        res.header ( 'Access-Control-Allow-Origin', req.headers.origin );

        return res.send ( 204 );
    }

    return res.send ( new restifyErrors.MethodNotAllowedError ( { code: 405 }, `${ req.method } method is not available on this endpoint` ) );
};