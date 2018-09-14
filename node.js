(() => {
    'use strict';

    require('./lib/customize');

    module.exports.expand = (pemu) => {
        let props = {}, methods = {};
        const node = require('./core/p2p-node')(pemu);
        for (let prop in node) {
            if (!node.hasOwnProperty(prop)) continue;

            // classify methods
            if (typeof(node[prop]) === 'function') {
                methods[prop] = node[prop]
            }
            else {
                props[prop] = node[prop];
            }
        }

        // assign property
        for (let prop in props) {
            if (!props.hasOwnProperty(prop)) continue;
            
            pemu[prop] = props[prop];
        }

        // assign method
        Object.setConstant(pemu, methods);
    };
})();
