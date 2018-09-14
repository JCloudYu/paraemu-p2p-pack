(async () => {
    'use strict';

    const pemu = require('paraemu');
    require('../../../index').expand('central', pemu);
    const { MongoClient } = require('mongodb');

    // node connect logic in config
    pemu.nodeConnect = async (nodeId) => {
        if (!nodeId || !collection) return;

        // get N random neighbors
        let randomMax = await collection.countDocuments();
        let randomN = __getRandom(1, randomMax);
        let neighborObjectIds = [];
        let neighborNodeIds = [];
        await collection.aggregate(
            [ { $sample: { size: randomN } } ]
        )
        .forEach((data) => {
            neighborObjectIds.push(data._id);
            neighborNodeIds.push(data.nodeId);
        });

        // save node info
        const [groupId, taskId = null, jobId = null] = nodeId.split('-');
        const insertedId = await collection
        .insertOne({
            groupId,
            taskId,
            jobId,
            nodeId,
            neighbors: neighborObjectIds,
            time: Math.round(new Date().getTime() / 1000)
        })
        .then(data => {
            return data.insertedId;
        });

        // update neighbors in old nodes
        await collection
        .updateMany(
            { _id: { $in: neighborObjectIds } },
            { $push: { neighbors: insertedId } }
        );

        console.log(`* [Central] Node connect: ${nodeId}`);
        return neighborNodeIds;
    };

    // node disconnect logic in config
    pemu.nodeDisconnect = async (nodeId) => {
        if (!nodeId || !collection) return;

        const deleteData = await collection.findOne({ nodeId });
        const { _id: deleteObjectId = null, neighbors: neighborObjectIds = [] } = deleteData;

        // delete node info
        collection.deleteOne(
            { _id: deleteObjectId }
        );

        // update neighbors in old nodes
        collection
        .updateMany(
            { _id: { $in: neighborObjectIds } },
            { $pull: { neighbors: deleteObjectId } },
            { multi: true }
        );

        console.log(`* Node disconnect: ${nodeId}`);
    };

    // node group detach logic in config
    pemu.nodeGroupDetach = async (groupId) => {
        if (!groupId || !collection) return;

        // find disconnect nodes id
        let nodeIds = [];
        await collection
        .find(
            { groupId },
            { nodeId: true }
        )
        .forEach((data) => {
            nodeIds.push(data.nodeId);
        });

        return nodeIds;
    };

    const dbUrl = 'mongodb://127.0.0.1:27017/';
    const dbName = 'p2p-central';
    const colName = 'node';

    let collection = null;
    await pemu.init(() => {
        return new Promise(async (resolve) => {
            // init mongodb
            const connect = await MongoClient.connect(dbUrl, { useNewUrlParser: true });
            resolve(connect.db(dbName));
        })
        .then((db) => {
            collection = db.collection(colName);
            
            // clean old data
            collection.deleteMany({});
            
            console.log('* [Central] Central init');
        });
    });

    function __getRandom(minNum, maxNum) {
        return Math.floor( Math.random() * (maxNum - minNum + 1) ) + minNum;
    }
})();