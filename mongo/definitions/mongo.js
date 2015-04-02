var MC = require('mongodb').MongoClient;
var DB = null;

/*  Add to config file:
 ==========================================================
 database   : mongodb://user:password@127.0.0.1:27017/database

*/

MC.connect(CONFIG('database'), function(err, db) {
    if (err)
        throw err;
    DB = db;
});

framework.database = function(collection) {
    if (collection)
        return DB.collection(collection);
    return DB;
};