(() => {
    'use strict';

    Object.setConstant = (target, props, hidden = false) => {
        for (let prop in props) {
            if (!props.hasOwnProperty(prop)) continue;
            
            Object.defineProperty(target, prop, {
                value: props[prop],
                configurable: false, writable: false, enumerable: !hidden
            })
        }
        
        return target;
    };

    Object.callMethod = (obj, methodName, ...args) => {
        if (!obj.hasOwnProperty(methodName) || typeof obj[methodName] !== 'function') return;

        return obj[methodName](...args);
    }
})();
