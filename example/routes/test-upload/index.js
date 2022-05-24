/**
 * --------------
 * DATE:            2019-08-14 @ 13:33
 * AUTHOR:          ollie
 * ORIGINAL NAME:   /./index
 * --------------
 * Created for the olivers-tools
 */
exports.post = async req => {
    return { file: req.body, headers: { 'Content-Type': 'application/octet-stream' } };
};
