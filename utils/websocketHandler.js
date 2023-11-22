const WebsocketGroup = require ( './WebsocketGroup' );

const websocketGroups = {};

const getGroupInstance = async ( groupName ) => {
    if ( !websocketGroups[ groupName ] ) {
        websocketGroups[ groupName ] = new WebsocketGroup ( groupName );
        await websocketGroups[ groupName ].initialize ();
    }
    
    return websocketGroups[ groupName ];
};

module.exports = getGroupInstance;