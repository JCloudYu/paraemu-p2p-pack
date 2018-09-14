(async () => {
    'use strict';

    const pemu = require('paraemu');
    require('../../../index').expand('node', pemu);
    
    pemu.maxPeers = 5;
    await pemu.init();
    console.log(`* [Multi-Node] Node init: ${pemu.uniqueId}`);
})();
