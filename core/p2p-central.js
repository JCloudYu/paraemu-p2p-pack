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

            pemu.local('central-identification');
            isInit = true;
        })
        .on('net-group-attach', (e) => {
            pemu.send(e.sender, 'central-identification');
        })
        .on('node-connect', async (e) => {
            // get neighbors and response
            let neighbors = await Object.callMethod(pemu, 'nodeConnect', e.sender);
            e.respondWith(neighbors);
            corePrepared();
        })
        .on('net-group-detach', async (e) => {
            let nodeIds = await Object.callMethod(pemu, 'nodeGroupDetach', e.sender);
            if (!Array.isArray(nodeIds)) {
                nodeIds = ((nodeIds) ? [nodeIds] : []);
            }

            for (let nodeId of nodeIds) {
                pemu.send(pemu.uniqueId, 'node-disconnect', nodeId);
            }
        })
        .on('node-disconnect', (e, ...args) => {
            Object.callMethod(pemu, 'nodeDisconnect', ...args);
        });

        module.init = (cb) => {
            return Promise.all([Promise.resolve(cb()), corePromise]);
        };

        return module;
    } 
})();
