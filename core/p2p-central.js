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
			let nodeIds = await pemu.nodeGroupDetach(e.sender);
			if( !Array.isArray(nodeIds) ){
				nodeIds = ((nodeIds) ? [nodeIds] : []);
			}
			
			for( let nodeId of nodeIds ){
				pemu.emit('__p2p-node-disconnect', nodeId);
			}
		})
		.on('__p2p-node-connect', async (e)=>{
			pemu.nodeConnect(e.sender);
		})
		.on('__p2p-node-disconnect', (e, ...args)=>{
			pemu.nodeDisconnect(...args);
		})
		.on('__p2p-fetch-neighbors', async (e)=>{
			if( !e.respondWith ) return;
			
			// get neighbors and response
			let neighbors = await pemu.fetchNeighbors(e.sender);
			e.respondWith(neighbors);
		});
	}
})();
