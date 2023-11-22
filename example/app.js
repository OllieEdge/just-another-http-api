const justAnotherHttpApi = require ( '../api.js' );
const { redis, s3 } = require ( 'eip-cloud-services' );

const getConfig = async () => {

    const redisClient = await redis.getClient ();
    const s3Client = s3.s3Client;

    const authenticateNewUser = async ( requestBody ) => {
        const { username, password } = requestBody;

        // Do your own authentication here, this is just an example
        if ( username === 'admin' && password === 'admin' ) {
            return 'username'; // A unique identifier that can be used to identify the user
        }
        else return false; // Login failed
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
        websocket: {
            enabled: true,
            options: {
                maxPayload: 1048576,
            }
        },
        cache: {
            defaultExpiry: 60, //seconds
            enabled: true,
            addCacheHeaders: true, // This will add the Age header to the response
            redisClient,
            redisPrefix: 'network-cache:'
        },
        auth: {
            requiresAuth: false,
            tokenEndpoint: '/auth/login',
            refreshTokenEndpoint: '/auth/refresh',
            type: 'jwt', //only support for JWT currently
            jwtSecret: 'f376abcf-d927-404f-98a2-62a079c4f28f',
            jwtLoginHandle: authenticateNewUser, // promise
            jwtExpiresIn: 3600, // 1 hour
            jwtEnabledRefreshTokens: true,
            jwtStoreRefreshToken: storeRefreshToken, // promise
            jwtRetrieveRefreshToken: retrieveRefreshToken, // promise
            jwtRefreshExpiresIn: 604800, // 1 week
        },
        docRoot: './routes',
        port: 4001,
        logs: false,
        uploads: {
            enabled: true,
            storageType: 'memory', // s3, memory or filesystem
            localUploadDirectory: '/tmp/uploads', // if unset, this will use the os.tmpdir value, if set the directory will be created if it doesn't exist
            s3Client, // connected s3 client
            s3UploadDirectory: 'test-uploads',
            s3UploadBucket: 's3-test.eip.telegraph.co.uk',
        },
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
        middleware: [ ], // not implemented yet.
    };
};

( async () => {
    const server = await justAnotherHttpApi ( await getConfig () );

    process.stdout.write ( '\x1B[38;5;9m┌-- [ \x1B[0m\x1B[38;5;118mSERVER READY (v1.2.0) \x1B[0m\x1B[38;5;9m] ---------------------------------------\x1B[0m\n' );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    server.addresses ().forEach ( address => {
        process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;244mServer listening at: \x1B[38;5;214m${ address.address } \x1B[38;5;244mon port: \x1B[38;5;214m${ address.port } \x1B[38;5;244m(${ address.family })\n` );
    } );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( '\x1B[38;5;9m└-- [ \x1B[0m\x1B[38;5;118mSERVER READY (v1.2.0)\x1B[0m\x1B[38;5;9m] ----------------------------------------\x1B[0m\n' );
} ) ();