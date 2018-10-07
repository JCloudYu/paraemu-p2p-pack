(()=>{
	'use strict';
	
	
	
	module.exports = (pemu)=>{
		const RUNTIME = {
			_initialized: false
		};
		
		
		
		let corePrepared;
		const corePromise = new Promise((resolve)=>{ corePrepared = resolve });
		Object.defineProperties(pemu, {
			initP2PEnv: {
				value: (cb)=>{
					if( typeof cb !== 'function' ){
						return corePromise;
					}
					
					return Promise.all([Promise.resolve(cb()), corePromise]);
				},
				enumerable: true
			}
		});
		
		
		
		pemu
		.on('tasks-ready', ()=>{
			if( RUNTIME._initialized ) return;
			
			pemu.local('__p2p-central-identification');
			RUNTIME._initialized = true;
			corePrepared();
		})
		.on('net-group-attach', (e)=>{
			pemu.send(e.sender, '__p2p-central-identification');
			corePrepared();
		})
		.on('net-group-detach', async (e)=>{
			if( typeof pemu.nodeGroupDetach !== "function" ) return;
			
			let nodeIds = await pemu.nodeGroupDetach(e.sender);
			if( !Array.isArray(nodeIds) ){
				nodeIds = ((nodeIds) ? [nodeIds] : []);
			}
			
			for( let nodeId of nodeIds ){
				pemu.emit('__p2p-node-disconnect', nodeId);
			}
		})
		.on('__p2p-node-connect', async (e)=>{
			if( !e.respondWith ) return;
			if( typeof pemu.nodeConnect !== "function" ) return;
			
			// get neighbors and response
			let neighbors = await pemu.nodeConnect(e.sender);
			e.respondWith(neighbors);
			
			for( let nodeId of neighbors ){
				pemu.send(nodeId, 'p2p-update-neighbors');
			}
		})
		.on('__p2p-node-disconnect', (e, ...args)=>{
			if( typeof pemu.nodeDisconnect !== "function" ) return;
			pemu.nodeDisconnect(...args);
		})
		.on('__p2p-fetch-neighbors', async (e)=>{
			if( !e.respondWith ) return;
			if( typeof pemu.fetchNeighbors !== "function" ) return;
			
			// get neighbors and response
			let neighbors = await pemu.fetchNeighbors(e.sender);
			e.respondWith(neighbors);
		});
	}
})();
