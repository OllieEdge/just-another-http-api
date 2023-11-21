const response = require ( '../../utils/response' );

exports.config = {
    get: {
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

exports.get = async req => {
    // error example

    return response ( { html: '<p>hello world</p>' } );

    return { error: { statusCode: 501, message: 'This is a test error message for Just Another Http API' } };
};
exports.post = async req => {
    // success response example

    return req.body ;
};
