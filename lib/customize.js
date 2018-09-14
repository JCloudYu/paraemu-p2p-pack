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

    // Object.isGetter = (obj, prop) => {
    //     return !!Object.getOwnPropertyDescriptor(obj, prop)['get'];
    // };

    Object.callMethod = (obj, methodName, ...args) => {
        if (!obj.hasOwnProperty(methodName) || typeof obj[methodName] !== 'function') return;

        return obj[methodName](...args);
    }

    Array.prototype.diff = function(array) {
        return this.filter((i) => {
            return (array.indexOf(i) === -1);
        });
    };

    Array.prototype.randomKey = function() {
        return Math.floor(Math.random() * this.length).toString();
    }

    // get minNum ~ maxNum random number
    function getRandom(minNum, maxNum) {
        return Math.floor( Math.random() * (maxNum - minNum + 1) ) + minNum;
    }

    // get n-length random array
    Array.prototype.randomArray = function(minNum = 1, maxNum = this.length) {
        let result = [];
        if (maxNum < minNum) return result;

        let n = getRandom(minNum, maxNum);
        while(result.length < n) {
            let ran = Math.floor(Math.random() * this.length);
            result.push(this.splice(ran, 1)[0]);
        }
        return result;
    }
})();
