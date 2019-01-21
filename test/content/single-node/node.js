(async () => {
    'use strict';

    const pemu = require('paraemu');

    /**
     * Node agree or disagree to become a peer (Optional)
     * 1. has maxPeers
     * 2. peers count less than maxPeers
     * 3. have not become a peer
     * @param {string} nodeId node id for asker
     * @return {boolean} true: agree, false: disagree
     */
    pemu.canAddPeer = (nodeId) => {
        return ((pemu.maxPeers > 0) && (pemu.peers.length < pemu.maxPeers) && (pemu.peers.indexOf(nodeId) === -1));
    };

    require('../../../index').expand(pemu, 'node');
    pemu.maxPeers = 5;

    let printDetail = async () => {
        if (!pemu.wiredNeighbors || pemu.wiredNeighbors.length === 0) return;

        // node find peer
        await pemu.findPeer();
        console.log('* [Single-Node] Neighbors:');
        console.log(pemu.wiredNeighbors);
        console.log('* [Single-Node] Peers:');
        console.log(pemu.peers);
    };

    await pemu.initP2PEnv(() => {
        console.log(`* [Single-Node] Node init: ${pemu.uniqueId}`);
    })
    .then(() => {
        printDetail();
    });

    pemu
    .on('__p2p-update-neighbors', async(e) => {
        // old node fetch new neighbors
        await pemu.fetchNeighbors();
        await printDetail();

        pemu.peers.forEach(async (peer) => {
            let response = await pemu.deliver(peer, 'say-hello', 'Hi');
            if (response) {
                console.log(response);
            }
        });
    })
    .on('say-hello', (e, msg) => {
        e.respondWith(`* [Single-Node] ${pemu.uniqueId} respond to ${e.sender}`);
        console.log(`* [Single-Node] ${e.sender} send ${msg} to ${pemu.uniqueId}`);
    });
})();
