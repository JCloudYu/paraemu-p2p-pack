(() => {
    'use strict';

    require('../lib/customize');
    const tiiny = require('tiinytiny');

    module.exports = (pemu) => {

        let isInit = false;
        let centralId = null;
        let corePrepared;
        const corePromise = new Promise((resolve) => { corePrepared = resolve });

        let defaultOptions = {
            maxPeers: 3,

            /**
             * Node agree or disagree to become a peer
             * 1. has maxPeers
             * 2. peers count less than maxPeers
             * 3. have not become a peer
             * @param {string} nodeId node id for asker
             * @return {boolean} true: agree, false: disagree
             */
            agreeBecomePeer: function(nodeId) {
                // if maxPeers not set in node code, pemu.maxPeers = undefined, so it must use this.maxPeers in there
                return ((this.maxPeers > 0) && (pemu.peers.length < this.maxPeers) && (pemu.peers.indexOf(nodeId) === -1));
            }
        }
        let config = {};

        let __wiredNeighbors = [];
        let __peers = [];

        pemu
        .on('tasks-ready', () => {
            if (isInit) return;

            config = Object.assign(config, defaultOptions, pemu);
            isInit = true;
        })
        .on('__p2p-central-identification', async (e) => {
            if (centralId) return;

            centralId = e.sender;
            try {
                pemu.wiredNeighbors = await pemu.deliver(centralId, '__p2p-node-connect');
                corePrepared();
            }
            catch (e) {
                console.log(e);
            }
        })
        .on('__p2p-node-disconnect', (e, nodeId) => {
            // clean peers cache
            let idx = pemu.peers.indexOf(nodeId);
            if (idx !== -1) {
                pemu.peers.splice(idx, 1);
            }
        })
        .on('__p2p-node-find-peer', (e, nodeId) => {
            if (!e.respondWith) return;

            let agree = Object.callMethod(config, 'agreeBecomePeer', nodeId);
            if (agree === true) {
                pemu.peers.push(nodeId);
                e.respondWith(pemu.uniqueId);
                return;
            }

            e.respondWith(null);
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

            init: (cb) => {
                if (typeof cb !== 'function') {
                    return corePromise;
                }

                return Promise.all([Promise.resolve(cb()), corePromise]);
            },
            fetchNeighbors: async () => {
                try {
                    pemu.wiredNeighbors = await pemu.deliver(centralId, '__p2p-fetch-neighbors');
                }
                catch (e) {
                    console.log(e);
                }
            },
            findPeer: async () => {
                const promises = [];
                let peerCnt = 0;
                for (let nodeId of pemu.wiredNeighbors) {
                    // find peers less than pemu.maxPeers
                    if ((pemu.maxPeers > 0) && (peerCnt >= pemu.maxPeers)) {
                        break;
                    }

                    let promise = pemu.deliver(nodeId, '__p2p-node-find-peer', pemu.uniqueId);
                    promises.push(promise);
                    peerCnt++;
                }

                let results = await tiiny.PromiseWaitAll(promises);
                results.forEach((pRes)=>{
                    let { result: nodeId } = pRes;
                    if (!nodeId) return;

                    pemu.peers.push(nodeId);
                });
            },
            disconnect: async () => {
                pemu.emit('__p2p-node-disconnect', pemu.uniqueId);
            }
        };

        return module;
    }
})();
