exports.get = async req => {
    // error example
    return { error: { statusCode: 501, message: 'This is a test error message for Just Another Http API' } };
};
exports.post = async req => {
    // success response example
    console.log ( req );

    return req.body ;
};
