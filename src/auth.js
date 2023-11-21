let config;

exports.initialiseAuth = async ( app, _config ) => {
    config = _config;

    const authType = config?.auth?.type;

    switch ( authType ) {
        case 'jwt':

            checkJwtIsAvailable ( config );

            app.register ( require ( '@fastify/jwt' ), {
                secret: config.auth.jwtSecret,
            } );

            app.decorate ( 'authenticate', async function ( request, reply ) {
                try {
                    await request.jwtVerify ();
                }
                catch ( err ) {
                    if ( err.name === 'JsonWebTokenError' ) {
                        reply.status ( 400 ).send ( { error: 'Invalid Token' } );
                    }
                    else if ( err.name === 'TokenExpiredError' ) {
                        reply.status ( 401 ).send ( { error: 'Token Expired' } );
                    }
                    else {
                        reply.send ( err );
                    }
                }
            } );

            app.post ( config?.auth?.tokenEndpoint || '/auth/login', async ( req, reply ) => {

                const jwtToTokenise = await config.auth.jwtLoginHandle ( req.body );

                if ( !jwtToTokenise ) {
                    reply.status ( 401 );
                    reply.send ( { error: 'Invalid credentials' } );
                    
                    return;
                }

                const accessToken = app.jwt.sign ( { username: jwtToTokenise }, { expiresIn: config.auth.jwtExpiresIn } );
                const refreshToken = config.auth.jwtEnabledRefreshTokens && checkJwtRefreshIsAvailable ( config )  ? app.jwt.sign ( { username: jwtToTokenise }, { expiresIn: config.auth.jwtRefreshExpiresIn } ) : null;
                const expires = config.auth.jwtExpiresIn;

                await config.auth.jwtStoreRefreshToken ( jwtToTokenise, refreshToken );

                reply.send ( { user: jwtToTokenise, accessToken, refreshToken, expires } );

                return;

            } );

            if ( config.auth.jwtEnabledRefreshTokens && checkJwtRefreshIsAvailable ( config ) ){
                app.post ( config?.auth?.refreshTokenEndpoint || '/auth/refresh', async ( req, reply ) => {

                    const { user, refreshToken } = req.body;

                    const isValid = await config.auth.jwtRetrieveRefreshToken ( user, refreshToken );
                    if ( !isValid ) {
                        reply.status ( 401 ).send ( { error: 'Invalid refresh token' } );
                        
                        return;
                    }

                    const accessToken = app.jwt.sign ( { username: user }, { expiresIn: config.auth.jwtExpiresIn } );
                    const newRefreshToken = config.auth.jwtEnabledRefreshTokens && checkJwtRefreshIsAvailable ( config )  ? app.jwt.sign ( { username: user }, { expiresIn: config.auth.jwtRefreshExpiresIn } ) : null;
                    const expires = config.auth.jwtExpiresIn;

                    await config.auth.jwtStoreRefreshToken ( user, newRefreshToken );

                    reply.send ( { user, accessToken, refreshToken: newRefreshToken, expires } );

                    return;

                } );
            }

            break;
        default: 
            return;
    }

};

exports.checkAuth = async ( req, reply ) => {
    const authType = config.auth.type; // authConfig is set in each route

    try {
        switch ( authType ) {
            case 'jwt':
                await req.jwtVerify ();
                break;
            case 'basic':
                // Basic auth logic
                break;
            case 'oauth2':
                // OAuth2 auth logic
                break;
            case 'token':
                // Token-based auth logic
                break;
            default:
                throw new Error ( 'Unsupported authentication type' );
        }

        return;
    }
    catch ( err ) {
        reply.send ( err );
    }
};

const checkJwtIsAvailable = ( config ) => {
    if ( !config?.auth?.jwtLoginHandle || typeof config.auth.jwtLoginHandle !== 'function' ){
        throw new Error ( '`auth.type` is set to "jwt", but `auth.jwtLoginHandle` is not a function or is not defined.' );
    }
    if ( !config?.auth?.jwtExpiresIn || typeof config.auth.jwtExpiresIn !== 'number' ){
        throw new Error ( '`auth.jwtEnabledRefreshTokens` is set to true, but `auth.jwtExpiresIn` is not a number or is not defined.' );
    }

    return true;
};

const checkJwtRefreshIsAvailable = ( config ) => {
    if ( !config?.auth?.jwtStoreRefreshToken || typeof config.auth.jwtStoreRefreshToken !== 'function' ){
        throw new Error ( '`auth.jwtEnabledRefreshTokens` is set to true, but `auth.jwtStoreRefreshToken` is not a function or is not defined.' );
    }
    if ( !config?.auth?.jwtRetrieveRefreshToken || typeof config.auth.jwtRetrieveRefreshToken !== 'function' ){
        throw new Error ( '`auth.jwtEnabledRefreshTokens` is set to true, but `auth.jwtRetrieveRefreshToken` is not a function or is not defined.' );
    }
    if ( !config?.auth?.jwtRefreshExpiresIn || typeof config.auth.jwtRefreshExpiresIn !== 'number' ){
        throw new Error ( '`auth.jwtEnabledRefreshTokens` is set to true, but `auth.jwtRefreshExpiresIn` is not a number or is not defined.' );
    }

    return true;
};