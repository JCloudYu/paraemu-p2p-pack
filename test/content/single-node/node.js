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

    await pemu.init(() => {
        console.log(`* [Single-Node] Node init: ${pemu.uniqueId}`);
    });

    // check neighbor is more than zero
    let intervalId = setInterval(async () => {
        if (pemu.wiredNeighbors && pemu.wiredNeighbors.length > 0) {
            // node find peer
            await pemu.findPeer();
            console.log('* [Single-Node] Neighbors:');
            console.log(pemu.wiredNeighbors);
            console.log('* [Single-Node] Peers:');
            console.log(pemu.peers);

            // node disconnect
            await pemu.disconnect();
            
            // stop set interval
            clearInterval(intervalId);
            
            console.log('* [Single-Node] Node disconnect');
            process.exit(0);
        }
    }, 500);
})();
