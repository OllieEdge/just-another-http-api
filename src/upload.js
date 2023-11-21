const multer = require ( 'fastify-multer' );
const os = require ( 'os' );
const crypto = require ( 'crypto' );
const fs = require ( 'fs' );
const path = require ( 'path' );
const { Upload } = require ( '@aws-sdk/lib-storage' );
const { PassThrough } = require ( 'stream' );

let upload;

exports.initialiseUploads = async ( app, config ) => {
    if ( config?.uploads?.enabled ) {
        try {
            app.register ( multer.contentParser );
        }
        catch ( error ) {
            console.error ( 'Error registering multer content parser:', error );
            throw error;
        }
    }
};

exports.handleUpload = ( handlerConfig, globalConfig ) => {
    let storage;
    try {
        switch ( handlerConfig?.upload?.storageType || globalConfig.uploads.storageType ) {
            case 's3':
                storage = s3Storage ( handlerConfig, globalConfig );
                break;
            case 'filesystem':
                const uploadDir = globalConfig.uploads.localUploadDirectory || os.tmpdir ();
                ensureDirectoryExists ( uploadDir );
                storage = multer.diskStorage ( {
                    destination: ( req, file, cb ) => cb ( null, uploadDir ),
                    filename: ( req, file, cb ) => cb ( null, crypto.randomUUID () + path.extname ( file.originalname ) )
                } );
                break;
            case 'memory':
            default:
                storage = multer.memoryStorage ();
                break;
        }
    }
    catch ( error ) {
        console.error ( 'Error setting up storage:', error );
        throw error;
    }

    upload = multer ( {
        storage,
        limits: {
            fileSize: handlerConfig.upload.maxFileSize,
            files: handlerConfig.upload.maxFiles
        }
    } );

    return async ( req, reply ) => {
        const fieldName = handlerConfig?.upload?.requestFileKey || 'file';

        const multerHandler = handlerConfig.upload.maxFiles > 1 ? upload.array ( fieldName, handlerConfig.upload.maxFiles ) : upload.single ( fieldName );
        
        return new Promise ( ( resolve, reject ) => {
            multerHandler ( req, reply.raw, ( err ) => {
                if ( err ) {
                    console.error ( 'Multer error:', err );
                    reply.code ( 500 ).send ( err );
                    reject ( err );
                }
                else {
                    resolve ();
                }
            } );
        } );
    };
};

function ensureDirectoryExists ( dir ) {
    try {
        if ( !fs.existsSync ( dir ) ) {
            fs.mkdirSync ( dir, { recursive: true } );
        }
    }
    catch ( error ) {
        console.error ( `Error ensuring directory ${dir} exists:`, error );
        throw error;
    }
}

const s3Storage = ( handlerConfig, globalConfig ) => {
    const _handleFile = function ( req, file, cb ) {
        const passThroughStream = new PassThrough ();
        const filename = crypto.randomUUID () + path.extname ( file.originalname );
        const Key = [ globalConfig.uploads.s3UploadDirectory, handlerConfig?.upload?.subDirectory, filename ].filter ( Boolean ).join ( '/' );

        const params = {
            Bucket: globalConfig.uploads.s3UploadBucket,
            Key,
            Body: passThroughStream,
            ContentType: file.mimetype,
            ACL: handlerConfig?.upload?.s3ACL || 'public-read'
        };

        const upload = new Upload ( {
            client: globalConfig.uploads.s3Client,
            params
        } );

        upload.done ()
            .then ( () => cb ( null, {
                path: params.Key,
                size: file.size
            } ) )
            .catch ( error => {
                console.log ( 'ERROR UPLOADING FILE', error );
                _removeFile ( req, { Key, Bucket: params.Bucket }, () => cb ( error ) );
            } );

        file.stream.pipe ( passThroughStream );
    };

    const _removeFile = function ( req, file, cb ) {
        if ( !file || !file.Key || !file.Bucket ) {
            console.log ( 'No file information available for deletion' );
            cb ();
            
            return;
        }

        const deleteParams = {
            Bucket: file.Bucket,
            Key: file.Key
        };

        globalConfig.uploads.s3Client.send ( new DeleteObjectCommand ( deleteParams ) )
            .then ( () => {
                console.log ( `File deleted: ${file.Key}` );
                cb ();
            } )
            .catch ( error => {
                console.log ( `Error deleting file: ${file.Key}`, error );
                cb ( error );
            } );
    };

    return { _handleFile, _removeFile };
};