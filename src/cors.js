exports.addCustomCors = ( handlerConfig ) => ( req, reply, done ) => {

    Object.entries ( handlerConfig.cors ).forEach ( ( [ key, value ] ) => {
        reply.header ( key, value );
    } );

    done ();

};