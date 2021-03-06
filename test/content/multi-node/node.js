(async () => {
    'use strict';

    const pemu = require('paraemu');
    require('../../../index').expand(pemu, 'node');
    
    pemu.maxPeers = 5;
    await pemu.initP2PEnv();
    console.log(`* [Multi-Node] Node init: ${pemu.uniqueId}`);
})();
