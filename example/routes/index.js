const response = require ( '../../utils/response' );
const websocketHandler = require ( '../../utils/websocketHandler' );

exports.config = {
    get: {
        websocket: true,
        cache: true,
        expires: 50, //seconds
        requiresAuth: false,
    },
    post: {
        upload: {
            enabled: true,
            maxFileSize: 1000000, //bytes
            maxFiles: 1
        },
        cache: false
    }
};

exports.get = async ( connection, req ) => {

    // See "messageReceivedHandler" below for an example of how to handle messages from clients
    // See "connectionClosedHandler" below for an example of how to handle a client disconnecting
    const websocketGroup = await websocketHandler ( req.url, messageReceivedHandler, connectionClosedHandler );
    const { connectionId, groupName } = websocketGroup.addNewConnection ( connection );
};

// Example messageReceivedHandler
const messageReceivedHandler = async ( { groupName, message, connectionId } ) => {

    console.log('New message received from client!', message, 'from connection:', connectionId, 'in group:', groupName, 'at:', new Date().toISOString() );

    // Access the websocket group instance null if all connections are closed
    const websocketGroup = await websocketHandler ( groupName );

    // Get all current connections for this group
    const currentConnections = websocketGroup.getConnections ();

    // Access the message data
    const messageData = JSON.parse ( message );

    // do stuff here when a message is received from a client
    // for example:
    // await websocketGroup.broadcastMessage ( { foo: 'bar' } );
}

// Example connectionClosedHandler
const connectionClosedHandler = async ( { groupName, connectionId } ) => {

    console.log('Client disconnected!', 'from connection:', connectionId, 'in group:', groupName, 'at:', new Date().toISOString() );

    // Access the websocket group instance null if all connections are closed
    const websocketGroup = await websocketHandler ( groupName );

    // Get all current connections for this group
    const currentConnections = websocketGroup.getConnections ();

    // do stuff here when a client disconnects
    // for example:
    // await websocketGroup.broadcastMessage ( { users: [] } );
};

exports.post = async req => {
    // success response example

    return req.body ;
};
