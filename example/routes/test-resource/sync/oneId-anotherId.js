exports.get = async req => {
    return {
        oneThing: req.params.oneId,
        anotherThing: req.params.anotherId
    };
};