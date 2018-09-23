(async () => {
    'use strict';

    const pemu = require('paraemu');
    require('../../../index').expand('node', pemu);
    
    pemu.maxPeers = 5;

    /**
     * Node agree or disagree to become a peer (Optional)
     * 1. has maxPeers
     * 2. peers count less than maxPeers
     * 3. have not become a peer
     * @param {string} nodeId node id for asker
     * @return {boolean} true: agree, false: disagree
     */
    pemu.agreeBecomePeer = (nodeId) => {
        return ((pemu.maxPeers > 0) && (pemu.peers.length < pemu.maxPeers) && (pemu.peers.indexOf(nodeId) === -1));
    };

    const timeout = 500;
    let main = async () => {
        // node fetch new neighbors
        await pemu.fetchNeighbors();
        
        // check neighbor is more than zero
        if (!pemu.wiredNeighbors || pemu.wiredNeighbors.length === 0) {
            setTimeout(main, timeout);
        }
        else if (pemu.wiredNeighbors && pemu.wiredNeighbors.length > 0) {
            // node find peer
            await pemu.findPeer();
            console.log('* [Single-Node] Neighbors:');
            console.log(pemu.wiredNeighbors);
            console.log('* [Single-Node] Peers:');
            console.log(pemu.peers);
        }
    };

    await pemu.init(() => {
        console.log(`* [Single-Node] Node init: ${pemu.uniqueId}`);
    });
    setTimeout(main, timeout);
})();
