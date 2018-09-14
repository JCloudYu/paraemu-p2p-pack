(async () => {
    'use strict';

    const pemu = require('paraemu');
    require('../../../index').expand('node', pemu);
    
    pemu.maxPeers = 5;
    await pemu.init();
    console.log(`* [Single-Node] Node init: ${pemu.uniqueId}`);

    // check neighbor is more than zero
    let intervalId = setInterval(async() => {
        if (pemu.wiredNeighbors.length > 0) {
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
            
            process.exit(0);
        }
    }, 500);
})();
