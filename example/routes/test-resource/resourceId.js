exports.get = async req => {
    return {
        resource: req.params.resourceId
    };
};
