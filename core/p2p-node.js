(()=>{
    'use strict';
    
    module.exports = (pemu) => {
        const RUNTIME = {
            _initialized: false,
            _centralId: null,
            _wired_neighbors: [],
            _peers: [],
            _max_peers: 10
        };
    
        Object.defineProperties(pemu, {
            maxPeers:{
                get: () => {
                    return RUNTIME._max_peers;
                },
                set: (value) => {
                    if (typeof value !== 'number' || value <= 0) {
                        throw new TypeError('maxPeers only accept integers greater than 0!');
                    }
                    
                    RUNTIME._max_peers = Math.floor(value);
                },
                enumerable:true
            },
            wiredNeighbors: {
                get: () => {
                    return RUNTIME._wired_neighbors.slice(0);
                },
                enumerable: true
            },
            peers: {
                get: () => {
                    return RUNTIME._peers.slice(0);
                },
                enumerable:true
            },
            initP2PEnv:{
                value: (cb = null) => {
                    let promises = [FLOW_CONTROL_PROMISE];
                    if( typeof cb === 'function' ){
                        promises.push(Promise.resolve(cb()));
                    }
                    
                    return Promise.all(promises);
                },
                enumerable:true
            },
            fetchNeighbors: {
                value: async () => {
                    try{
                        RUNTIME._wired_neighbors = await pemu.deliver(RUNTIME._centralId, '__p2p-fetch-neighbors');
                    }
                    catch(e){
                        console.log(e);
                    }
                },
                enumerable:true
            },
            findPeer: {
                value: async () => {
                    const promises = [];
                    let peerCnt = 0;
                    for ( let nodeId of RUNTIME._wired_neighbors ) {
                        // find peers less than pemu.maxPeers
                        if ( peerCnt >= RUNTIME._max_peers ) break;
                        
                        let promise = pemu.deliver(nodeId, '__p2p-node-find-peer', pemu.uniqueId);
                        promises.push(promise);
                        peerCnt++;
                    }
                    
                    let results = await PromiseWaitAll(promises);
                    results.forEach((pRes) => {
                        let {result: nodeId} = pRes;
                        if ( !nodeId ) return;
                        
                        RUNTIME._peers.push(nodeId);
                    });
                },
                enumerable:true
            },
            disconnect: {
                value: async () => {
                    pemu.emit('__p2p-node-disconnect', pemu.uniqueId);
                },
                enumerable:true
            }
        });

        if (typeof pemu.canAddPeer !== 'function') {
            pemu.canAddPeer = ___CAN_ADD_PEER_WITH_ID;
        }
        
        
        
        let FLOW_CONTROL_TRIGGER;
        const FLOW_CONTROL_PROMISE = new Promise((resolve) => { FLOW_CONTROL_TRIGGER=resolve })
        
        
        
        pemu
        .on('tasks-ready', ()=>{
            if ( RUNTIME._initialized ) return;
            RUNTIME._initialized = true;
        })
        .on('__p2p-central-identification', async (e)=>{
            if ( RUNTIME._centralId ) return;
            
            RUNTIME._centralId = e.sender;
            try {
                RUNTIME._wired_neighbors = await pemu.deliver(RUNTIME._centralId, '__p2p-node-connect');
                FLOW_CONTROL_TRIGGER();
            }
            catch(e){
                console.log(e);
            }
        })
        .on('__p2p-node-disconnect', (e, nodeId)=>{
            // update neighbors and peers cache
            let neighborIdx = RUNTIME._wired_neighbors.indexOf(nodeId);
            if( neighborIdx >= 0 ){
                RUNTIME._wired_neighbors.splice(neighborIdx, 1);
            }
            
            let peerIdx = RUNTIME._peers.indexOf(nodeId);
            if( peerIdx >= 0 ){
                RUNTIME._peers.splice(peerIdx, 1);
            }
        })
        .on('__p2p-node-find-peer', (e, nodeId)=>{
            if ( !e.respondWith || typeof pemu.canAddPeer !== 'function' ) return;
            
            let responseData = null;
            if ( pemu.canAddPeer(nodeId) === true ) {
                RUNTIME._peers.push(nodeId);
                responseData = pemu.uniqueId;
            }
            
            e.respondWith(responseData);
        });
        
        function ___CAN_ADD_PEER_WITH_ID(nodeId) {
            if ( RUNTIME._peers.length >= RUNTIME._max_peers ) {
                return false;
            }

            if ( RUNTIME._peers.indexOf(nodeId) >= 0 ) {
                return false;
            }

            return true;
        }
    };
    
    function PromiseWaitAll(promise_queue=[]) {
		if ( !Array.isArray(promise_queue) ){
			promise_queue = [promise_queue];
		}
		
		if( promise_queue.length === 0 ){
			return Promise.resolve([]);
		}
		
		return new Promise((resolve, reject) =>{
			let result_queue=[], ready_count=0, resolved = true;
			for(let idx=0; idx<promise_queue.length; idx++) {
				let item = {resolved:true, seq:idx, result:null};
				
				result_queue.push(item);
				Promise.resolve(promise_queue[idx]).then(
					(result)=>{
						resolved = (item.resolved = true) && resolved;
						item.result = result;
					},
					(error)=>{
						resolved = (item.resolved = false) && resolved;
						item.result = error;
					}
				).then(()=>{
					ready_count++;
					
					if ( promise_queue.length === ready_count ) {
						(resolved?resolve:reject)(result_queue);
					}
				});
			}
		});
	};
})();
