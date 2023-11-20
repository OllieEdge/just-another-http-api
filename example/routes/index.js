const response = require ( '../../utils/response' );

exports.config = {
    get: {
        cache: true,
        expires: 50, //seconds
        requiresAuth: true
    },
    post: {
        cache: false
    }
};

exports.get = async req => {
    // error example

    return response ( { json: { test: 'test' } } );

    return { error: { statusCode: 501, message: 'This is a test error message for Just Another Http API' } };
};
exports.post = async req => {
    // success response example

    return req.body ;
};
