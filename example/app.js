const httpApi = require ( '../api.js' );
const { redis } = require ( 'eip-cloud-services' );

const getConfig = async () => {

    const redisClient = await redis.getClient ();

    const jwtLogin = async ( loginBody ) => {
        const { user, password } = loginBody;

        if ( user === 'admin' && password === 'admin' ) {
            return 'username';
        }
        else return false;
    };

    const storeRefreshToken = async ( user, refreshToken ) => {
        await redis.set ( `refresh-token:${ user }`, refreshToken, 60 * 60 * 24 * 30 ); // Set expiry here

        return;
    };

    const retrieveRefreshToken = async ( user, refreshToken ) => {
        const storedRefreshToken = await redis.get ( `refresh-token:${ user }` );

        return storedRefreshToken === refreshToken;
    };

    return {
        name: 'Server Name',
        version: '1.0.0',
        uploads: {
            enabled: true
        },
        cache: {
            defaultExpiry: 60, //seconds
            enabled: true,
            addCacheHeaders: true, // This will add the Age header to the response
            redisClient,
            redisPrefix: 'network-cache:'
        },
        auth: {
            requiresAuth: true,
            type: 'jwt',
            jwtSecret: 'f376abcf-d927-404f-98a2-62a079c4f28f',
            jwtLoginHandle: jwtLogin, // promise
            jwtExpiresIn: 20, // 1 hour
            jwtEnabledRefreshTokens: true,
            jwtStoreRefreshToken: storeRefreshToken, // promise
            jwtRetrieveRefreshToken: retrieveRefreshToken, // promise
            jwtRefreshExpiresIn: 604800, // 1 week
        },
        docRoot: './routes',
        port: 4001,
        logs: false,
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
                'x-request-id',
                'x-cache',
                'x-cache-age',
                'x-cache-expires',
            ],
            methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ],
            optionsSuccessStatus: 204
        },
        middleware: [ ], // function ( req, res, next ) { next (); }   
    };
};

( async () => {
    const server = await httpApi ( await getConfig () );

    process.stdout.write ( '\x1B[38;5;9m┌-- [ \x1B[0m\x1B[38;5;118mSERVER READY (v2.0) \x1B[0m\x1B[38;5;9m] ---------------------------------------\x1B[0m\n' );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;244mRunning on: \x1B[38;5;214m${ server.url }\n` );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;244mStarted with args: [ \x1B[38;5;214m${ process.argv.join ( ', ' ) }\x1B[38;5;244m ]\n` );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( '\x1B[38;5;9m└-- [ \x1B[0m\x1B[38;5;118mSERVER READY (v2.0)\x1B[0m\x1B[38;5;9m] ---------------------------------------\x1B[0m\n' );
} ) ();