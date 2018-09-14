(() => {
    'use strict';

    require('../lib/customize');
    const tiiny = require('tiinytiny');

    module.exports = (pemu) => {
        
        let isInit = false;
        let centralId = null;

        let __wiredNeighbors = [];
        let __peers = [];

        let corePrepared;
        const corePromise = new Promise((resolve) => { corePrepared = resolve } );

        pemu
        .on('tasks-ready', () => {
            if (isInit) return;

            isInit = true;
        })
        .on('net-connection-ready', (e) => {
            corePrepared();
        })
        .on('central-identification', async (e) => {
            if (centralId) return;

            centralId = e.sender;
            try {
                pemu.wiredNeighbors = await pemu.deliver(centralId, 'node-connect');
            }
            catch (e) {
                console.log(e);
            }
        })
        .on('node-find-peer', (e, nodeId) => {
            if ((!pemu.maxPeers) || (pemu.peers.length >= pemu.maxPeers)) {
                e.respondWith(null);
                return;
            }

            e.respondWith(pemu.uniqueId);
            pemu.peers.push(nodeId);
        });

        let module = {
            get wiredNeighbors() {
                return __wiredNeighbors;
            },
            set wiredNeighbors(value) {
                __wiredNeighbors = value;
            },

            get peers() {
                return __peers;
            },
            set peers(value) {
                __peers = value;
            },

            init: () => {
                return corePromise;
            },
            findPeer: async () => {
                const promises = [];
                for (let nodeId of pemu.wiredNeighbors) {
                    let promise = pemu.deliver(nodeId, 'node-find-peer', pemu.uniqueId);
                    promises.push(promise);
                }

                let results = await tiiny.PromiseWaitAll(promises);
                results.forEach((pRes)=>{
                    let { result: nodeId } = pRes;
                    if (!nodeId) return;

                    pemu.peers.push(nodeId);
                });
            },
            disconnect: async () => {
                pemu.send(centralId, 'node-disconnect', pemu.uniqueId);
            }
        };

        return module;
    }
})();
