const getCacheKey = (config, req) => {
    let url = req.routeOptions.url;

    for (const [ param, value ] of Object.entries( req.params || {} )) {
        url = url.replace(`:${param}`, value);
    }

    return `${config?.cache?.redisPrefix || ''}:${req.method.toLowerCase()}:${url}:${JSON.stringify( req.query )}`;
};

exports.initialiseCaching = async ( app, config ) => {

    if ( config.cache && config.cache.enabled && config.cache.redisClient ) {

        await app.register ( require ( '@fastify/redis' ), { client: config.cache.redisClient } );
        await app.register ( require ( '@fastify/caching' ), require ( 'abstract-cache' ) ( {
            useAwait: true,
            driver: {
                name: 'abstract-cache-redis',
                options: { client: config.cache.redisClient }
            }
        } ) );

    }

    return;
};

exports.checkRequestCache = async ( app, req, reply, handleConfig, globalConfig ) => {

    if ( globalConfig?.cache?.enabled && handleConfig?.[ req.method.toLowerCase () ]?.cache ) {
        
        const cacheKey = getCacheKey ( globalConfig, req );
        const script = `
        local value = redis.call('GET', KEYS[1])
        local ttl = redis.call('TTL', KEYS[1])
                return {value, ttl}
            `;
        const result = await app.redis.eval ( script, 1, cacheKey );
    
        if ( result[ 0 ] ) {
            const cachedResponse = JSON.parse ( result[ 0 ] );
            const ttl = result[ 1 ];
            const maxAge = handleConfig?.[ req.method.toLowerCase () ]?.expires || globalConfig?.cache?.expires || 60;
            const ageInSeconds = maxAge - ttl; // Calculate the age based on TTL and maxAge
    
            if ( globalConfig?.cache?.addCacheHeaders ){
                cachedResponse.headers ??= {};
                cachedResponse.headers[ 'X-Cache' ] = 'HIT';
                cachedResponse.headers[ 'X-Cache-Age' ] = ageInSeconds;
                cachedResponse.headers[ 'X-Cache-Expires' ] = maxAge;
            }
            
            return cachedResponse;
        }
            
    }
    
    return null;
};

exports.setRequestCache = async ( app, req, response, handleConfig, globalConfig ) => {

    if ( globalConfig?.cache?.enabled && handleConfig?.[ req.method.toLowerCase () ]?.cache ){
        const cacheKey = getCacheKey ( globalConfig, req );

        await app.redis.set ( cacheKey, JSON.stringify ( response ), 'EX', handleConfig?.[ req.method.toLowerCase () ]?.expires || globalConfig?.cache?.expires || 60 );

        if ( globalConfig?.cache?.addCacheHeaders ){
            response.headers ??= {};
            response.headers[ 'X-Cache' ] = 'MISS';
            response.headers[ 'X-Cache-Age' ] = 0;
            response.headers[ 'X-Cache-Expires' ] = handleConfig?.[ req.method.toLowerCase () ]?.expires || globalConfig?.cache?.expires || 60;
        }

    }
};

exports.invalidateRequestCache = async ( app, req, globalConfig ) => {
    if ( globalConfig?.cache?.enabled ) {
        const cacheKey = getCacheKey ( globalConfig, req );

        await app.redis.del ( cacheKey );
    }
};
