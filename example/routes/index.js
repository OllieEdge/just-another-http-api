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
    const websocketGroup = await websocketHandler ( req.routeOptions.url );
    const { connectionId, groupName } = websocketGroup.addNewConnection ( connection );
};

exports.post = async req => {
    // success response example

    return req.body ;
};
