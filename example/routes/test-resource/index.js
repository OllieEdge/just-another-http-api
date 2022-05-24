exports.get = async req => {
    throw new Error ( 'Hello i am an error' );
};
exports.post = async req => {
    return { html: '<div>I TEXT IN A DIV!</div>' };
};
exports.del = async req => {
    return { deleted: 'something' };
};
exports.put = async req => {
    return { updated: 'something' };
};