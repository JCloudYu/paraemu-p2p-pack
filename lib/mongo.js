(() => {
    "use strict";

    const MongoClient = require('mongodb').MongoClient;
    
    let __dbInst = null;
    module.exports = {

        colName: 'node',
        init: function(host, port, db) {

            return MongoClient.connect(`mongodb://${host}:${port}/${db}`).then((client) => {
                __dbInst = client;
            });
        },
        release: function() {

            if ( __dbInst ) {
                return __dbInst.close();
            }
            
            return Promise.resolve(__dbInst = null);
        },
        getDoc: function(filter={}) {

            return this.getDocs(filter, {page: 1, pageSize: 1})
            .then((value) => {
                return Promise.resolve(value[0]);
            });
        },
        getDocs: function(filter={}, pagination={}) {

            let {page=1, pageSize=20} = pagination,
                skipNum = ((page - 1) * pageSize > 0) ? (page - 1) * pageSize : 0;
            return new Promise((fulfill, reject) => {
                __dbInst.collection(this.colName)
                .find({
                    'id': filter.id,
                })
                .sort({init: -1})
                .skip(skipNum)
                .limit(pageSize)
                .toArray()
                .then((value) => {
                    fulfill(value);
                })
                .catch(reject);
            });
        },
        setDoc: function(id=null, content='') {

            // insert one record and update data
            let col = __dbInst.collection(this.colName),
                timestamp = Math.round(new Date().getTime() / 1000);

            return new Promise((fulfill, reject) => {
                col.insert({})
                .then((value) => {
                    let mongo_id = value.ops[0]._id;
                    col.save({
                        _id: mongo_id,
                        id: id || mongo_id,
                        time: timestamp,
                        content: content
                    }, () => {
                        fulfill(mongo_id);
                    });
                });
            });
        },
        get db(){ return __dbInst; }
    }
})();
