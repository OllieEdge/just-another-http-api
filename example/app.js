const httpApi = require ( '../api.js' );
const _ = require ( 'lodash' );
const config = {
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

httpApi ( config ).then ( server => {
    process.stdout.write ( '\x1B[38;5;9m┌-- [ \x1B[0m\x1B[38;5;118mJUST ANOTHER HTTP API SERVER READY \x1B[0m\x1B[38;5;9m] ---------------------------------------\x1B[0m\n' );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;244mRunning on: \x1B[38;5;214m${ server.url }\n` );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;214m${ _.filter ( server.router._registry._routes, { method: 'GET' } ).length }\x1B[0m\x1B[38;5;244m GET endpoints      \x1B[0m\n` );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;214m${ _.filter ( server.router._registry._routes, { method: 'POST' } ).length }\x1B[0m\x1B[38;5;244m POST endpoints      \x1B[0m\n` );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;214m${ _.filter ( server.router._registry._routes, { method: 'PUT' } ).length }\x1B[0m\x1B[38;5;244m PUT endpoints      \x1B[0m\n` );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;214m${ _.filter ( server.router._registry._routes, { method: 'DELETE' } ).length }\x1B[0m\x1B[38;5;244m DELETE endpoints      \x1B[0m\n` );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( `\x1B[38;5;9m|    \x1B[38;5;244mStarted with args: [ \x1B[38;5;214m${ process.argv.join ( ', ' ) }\x1B[38;5;244m ]\n` );
    process.stdout.write ( '\x1B[38;5;9m|\n' );
    process.stdout.write ( '\x1B[38;5;9m└-- [ \x1B[0m\x1B[38;5;118mJUST ANOTHER HTTP API SERVER READY \x1B[0m\x1B[38;5;9m] ---------------------------------------\x1B[0m\n' );
} );