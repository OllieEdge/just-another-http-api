/**
 * Generate a standardized response object.
 * 
 * @param {object} options - The options for the response.
 * @param {string} [options.json] - Sends JSON as the response body.
 * @param {string} [options.html] - Sends HTML as the response body.
 * @param {string} [options.text] - Sends plain text as the response body.
 * @param {object} [options.file] - Sends a file as the response.
 * @param {object} [options.redirect] - Redirects to a specified URL.
 * @param {object} [options.headers={}] - Sets the headers for the response.
 * @param {number} [options.code] - The HTTP status code for the response.
 * @param {object} [options.error={message, code=500}] - Error response with message and code.
 * @returns {object} An object containing the response data.
 */
function createResponse ( options = {} ) {
    const response = {
        headers: options.headers || {},
        code: options.code || 200,
    };

    if ( 'json' in options ) {
        response.json = options.json;
        response.headers[ 'Content-Type' ] = 'application/json';
    }
    else if ( 'html' in options ) {
        response.html = options.html;
        response.headers[ 'Content-Type' ] = 'text/html';
    }
    else if ( 'text' in options ) {
        response.text = options.text;
        response.headers[ 'Content-Type' ] = 'text/plain';
    }
    else if ( 'file' in options ) {
        response.file = options.file; // Assuming this is a buffer or stream
    }
    else if ( 'redirect' in options ) {
        response.redirect = options.redirect;
    }
    else if ( options.error ) {
        response.error = options.error;
        response.code = options.error.code || 500;
        response.headers[ 'Content-Type' ] = 'application/json';
    }

    return response;
}

module.exports = createResponse;
