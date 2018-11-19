(async ()=>{
	'use strict';
	
	const pemu = require('paraemu');
	const {MongoClient} = require('mongodb');
	const dbUrl = 'mongodb://127.0.0.1:27017/';
	const dbName = 'p2p-central';
	const colName = 'node';
	let collection = null;
	let novice_queue = [];
	
	/**
	 * Node connect logic
	 * @async
	 * @param {string} nodeId
	 * @return {Promise<string[]>} Neighbor node ids
	 */
	pemu.nodeConnect = async (nodeId)=>{
		if( !nodeId || !collection ) return;
		
		// save node info
		const [groupId, taskId=null, jobId=null] = nodeId.split('-');
		const {insertedId} = await collection.insertOne({
			groupId, taskId, jobId, nodeId, neighbors:[],
			time: Math.round(Date.now() / 1000)
		});
		
		novice_queue.push({insertedId, nodeId});
		console.log(`* [Central] Node connect: ${nodeId}`);
	};
	
	/**
	 * Node disconnect logic
	 * @async
	 * @param {string} nodeId
	 * @return {Promise<undefined>}
	 */
	pemu.nodeDisconnect = async (nodeId)=>{
		if( !nodeId || !collection ) return;
		
		const deleteData = await collection.findOne({nodeId});
		const {_id: deleteObjectId = null, neighbors: neighborObjectIds = []} = deleteData;
		
		// delete node info
		collection.deleteOne(
			{_id: deleteObjectId}
		);
		
		// update neighbors in old nodes
		collection
		.updateMany(
			{_id: {$in: neighborObjectIds}},
			{$pull: {neighbors: deleteObjectId}},
			{multi: true}
		);
		
		console.log(`* Node disconnect: ${nodeId}`);
	};
	
	/**
	 * Node group detach logic
	 * @async
	 * @param {string} groupId
	 * @return {Promise<string[]>} Node ids
	 */
	pemu.nodeGroupDetach = async (groupId)=>{
		if( !groupId || !collection ) return;
		
		// find disconnect nodes id
		let nodeIds = [];
		await collection
		.find(
			{groupId},
			{nodeId: true}
		)
		.forEach((data)=>{
			nodeIds.push(data.nodeId);
		});
		
		return nodeIds;
	};
	
	/**
	 * Fetch neighbors logic
	 * @async
	 * @param {string} nodeId
	 * @return {Promise<string[]>} Neighbor node ids
	 */
	pemu.fetchNeighbors = async (nodeId)=>{
		if( !nodeId || !collection ) return;
		
		// find neighbors object id by node id
		const nodeData = await collection.findOne({nodeId});
		const {neighbors: neighborObjectIds = []} = nodeData;
		
		// find neighbors nodes id
		let nodeIds = [];
		await collection
		.find(
			{_id: {$in: neighborObjectIds}},
			{nodeId: true}
		)
		.forEach((data)=>{
			nodeIds.push(data.nodeId);
		});
		
		return nodeIds;
	};
	
	require('../../../index').expand(pemu, 'central');
	
	
	
	await pemu.initP2PEnv(()=>{
		return new Promise(async (resolve)=>{
			// init mongodb
			const connect = await MongoClient.connect(dbUrl, {useNewUrlParser: true});
			resolve(connect.db(dbName));
		})
		.then((db)=>{
			collection = db.collection(colName);
			
			// clean old data
			collection.deleteMany({});
		});
	});
	console.log('* [Central] Central init');
	
	
	
	let neighbor_timeout = setTimeout(___ASSIGN_NEIGHBORS, 5000);
	let dynamic_timeout = setTimeout( ___CHANGE_NEIGHBORS, 10000 );



	async function ___ASSIGN_NEIGHBORS() {
		for( let {nodeId:sourceId, insertedId} of novice_queue ) {
			// get N random neighbors
			let neighborOIds = [];
			let neighborIds = [];
			await collection.aggregate([
				{$match:{$and:[
					{_id:{$not:{$eq:insertedId}}},
					{neighbors:{$not:{$elemMatch:{$eq:insertedId}}}}
				]}},
				{$sample: {size: (((Math.random()*10)|0)+1)}}
			])
			.forEach((data)=>{
				let {_id, nodeId} = data;
				neighborOIds.push(_id);
				neighborIds.push(nodeId);
				pemu.send(nodeId, '__p2p-update-neighbors', [sourceId], []);
			});
			
			if ( neighborOIds.length > 0 ) {
				await collection.updateOne({_id:insertedId}, {$addToSet:{neighbors:{$each:neighborOIds}}});
			
				// update neighbors in old nodes
				await collection
				.updateMany(
					{_id: {$in: neighborOIds}},
					{$addToSet: {neighbors: insertedId}}
				);
				
				pemu.send( sourceId, '__p2p-update-neighbors', neighborIds, []);
			}
		}
		
		novice_queue.splice(0);
		neighbor_timeout = setTimeout(___ASSIGN_NEIGHBORS, 5000);
	}

	async function ___CHANGE_NEIGHBORS() {
		const totalNodes = await collection.countDocuments();
		let nodeOIds = [];

		await collection.aggregate(
			[ { $sample: {size: (totalNodes / 3) | 0} } ]
		)
		.forEach(async(data)=>{
			const {_id, neighbors} = data;
			nodeOIds.push( _id );

			if( Math.random() > 0.05 ) return;


			const newNeighborId = nodeOIds[ Math.floor( Math.random()*nodeOIds.length ) ];
			// INFO: Remove a neighbor
			if( (newNeighborId === _id) || neighbors.includes( newNeighborId ) ) {
				const oldNeighborId = neighbors[ Math.floor( Math.random()*neighbors.length ) ];
				if( !oldNeighborId ) return;

				await collection
				.updateOne(
					{_id: _id},
					{$pull: {neighbors: oldNeighborId}}
				);
				return;
			}


			// INFO: Add a neighbor
			await collection
			.updateOne(
				{_id: _id},
				{$addToSet: {neighbors: newNeighborId}}
			);
		});



		dynamic_timeout = setTimeout(___CHANGE_NEIGHBORS, 10000);
	}
})();
