(()=>{
    'use strict';
    
    const USER_DEFINE_LIST = {
        'node': [ 'canAddPeer' ],
        'central': [ 'nodeConnect', 'nodeDisconnect', 'nodeGroupDetach', 'fetchNeighbors' ]
    };
    
    const CORE_NAME_LIST = Object.keys(USER_DEFINE_LIST);
    module.exports.expand = (pemu, coreName = CORE_NAME_LIST[0]) => {
        if( (CORE_NAME_LIST.indexOf(coreName) === -1) || !pemu ) return;
        
        require(`./core/p2p-${coreName}`)(pemu);

        // check methods are defined
        for (let methodName of USER_DEFINE_LIST[coreName]) {
            if (!pemu.hasOwnProperty(methodName) || typeof pemu[methodName] !== 'function') {
                throw new TypeError(
                    `Function ${methodName} is not defined.`
                );
            }
        }
    };
})();
