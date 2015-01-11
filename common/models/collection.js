module.exports = function(Collection) {

  Collection.types = function (collectionId, types, cb) {
    Collection.findOne({where: {id: collectionId}}, function (err, collection) {
      collection.types.destroyAll(function () {
        types.forEach(function (type) {
          collection.types.add(type, function(err, type) {
            // FIXME: Handle errors
          });
        });
      });
    });

    // Return { "success": true  }
    cb(null, true);
  }

  Collection.remoteMethod(
    'types',
    {
      accepts: [
        {arg: 'collectionId', type: 'string'},
        {arg: 'types', type: 'array'},
      ],
      returns: {arg: 'success', type: 'boolean'}
    }
  );
};
