/**
 * --------------
 * DATE:            2019-06-04 @ 11:12
 * AUTHOR:          ollie
 * ORIGINAL NAME:   /./index
 * --------------
 * Created for the olivers-tools
 */
exports.get = async req => {

    // This will produce a 500 internal error
    //throw new Error ( 'Not Authorised' ); 

    // Return a formatted error object to customise http status codes.
    return { error: { statusCode: 401, message: 'Not Authorised' } };
    
};