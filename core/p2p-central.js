(() => {
    'use strict';

    require('../lib/customize');

    module.exports = (pemu) => {

        let isInit = false;

        let corePrepared;
        const corePromise = new Promise((resolve) => { corePrepared = resolve } );

        pemu
        .on('tasks-ready', (e) => {
            if (isInit) return;

            pemu.local('__p2p-central-identification');
            isInit = true;
            corePrepared();
        })
        .on('net-group-attach', (e) => {
            pemu.send(e.sender, '__p2p-central-identification');
            corePrepared();
        })
        .on('net-group-detach', async (e) => {
            let nodeIds = await Object.callMethod(pemu, 'nodeGroupDetach', e.sender);
            if (!Array.isArray(nodeIds)) {
                nodeIds = ((nodeIds) ? [nodeIds] : []);
            }

            for (let nodeId of nodeIds) {
                pemu.send(pemu.uniqueId, '__p2p-node-disconnect', nodeId);
            }
        })
        .on('__p2p-node-connect', async (e) => {
            // get neighbors and response
            let neighbors = await Object.callMethod(pemu, 'nodeConnect', e.sender);
            e.respondWith(neighbors);
        })
        .on('__p2p-node-disconnect', (e, ...args) => {
            Object.callMethod(pemu, 'nodeDisconnect', ...args);
        });

        let module = {
            init: (cb) => {
                if (typeof cb !== 'function') {
                    return corePromise;
                }
    
                return Promise.all([Promise.resolve(cb()), corePromise]);
            }
        };

        return module;
    } 
})();
