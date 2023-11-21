/**
 * --------------
 * DATE:            2019-08-14 @ 13:33
 * AUTHOR:          ollie
 * ORIGINAL NAME:   /./index
 * --------------
 * Created for the olivers-tools
 */

exports.config = {
    post: {
        upload: {
            enabled: true,
            storageType: 'filesystem', // memory, filesystem, s3 (overrides the global config)
            requestFileKey: 'data', // defaults to "files"
            maxFileSize: 1000 * 1000 * 1000 * 1000 * 2, // 2GB
            maxFiles: 1,
            s3ACL: 'public-read',
            subDirectory: 'test'        
        },
        cache: false
    }
};

exports.post = async req => {

    return { json: req.file, headers: { 'Content-Type': 'application/octet-stream' } };
};
