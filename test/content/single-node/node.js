(async () => {
    'use strict';

    const pemu = require('paraemu');
    require('../../../index').expand('node', pemu);
    
    pemu.maxPeers = 5;

    /**
     * Node agree or disagree to become a peer (Optional)
     * @return {boolean}
     */
    pemu.agreeBecomePeer = () => {
        if ((pemu.maxPeers > 0) && (pemu.peers.length < pemu.maxPeers)) {
            return true;
        }

        return false;
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
