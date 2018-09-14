(() => {
    'use strict';

    require('./lib/customize');

    module.exports.expand = (pemu) => {
        let props = {}, methods = {};
        const central = require('./core/p2p-central')(pemu);
        for (let prop in central) {
            if (!central.hasOwnProperty(prop)) continue;

            // classify methods
            if (typeof(central[prop]) === 'function') {
                methods[prop] = central[prop]
            }
            else {
                props[prop] = central[prop];
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
