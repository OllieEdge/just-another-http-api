const WebsocketGroup = require ( './WebsocketGroup' );

const websocketGroups = {};

const getGroupInstance = async ( groupName, messageReceivedHandler, connectionClosedHandler ) => {
    if ( !websocketGroups[ groupName ] && messageReceivedHandler && connectionClosedHandler ) {
        websocketGroups[ groupName ] = new WebsocketGroup ( groupName, removeGroupInstance, messageReceivedHandler, connectionClosedHandler );
        await websocketGroups[ groupName ].initialize ();
    }
    
    return websocketGroups[ groupName ] || null;
};

const removeGroupInstance = async groupName => {
    if ( websocketGroups[ groupName ] ) {
        delete websocketGroups[ groupName ];
    }
}

module.exports = getGroupInstance;