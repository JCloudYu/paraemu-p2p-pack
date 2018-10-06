(()=>{
	'use strict';
	
	require('./lib/customize');
	
	let coreList = ['central', 'node'];
	
	module.exports.expand = (pemu, coreName = 'node')=>{
		if( (coreList.indexOf(coreName) === -1) || !pemu ) return;
		
		let props = {}, methods = {};
		const core = require(`./core/p2p-${coreName}`)(pemu);
		if ( !core ) return;
		
		
		
		for( let prop in core ){
			if( !core.hasOwnProperty(prop) ) continue;
			
			// classify methods
			if( typeof(core[prop]) === 'function' ){
				methods[prop] = core[prop]
			}
			else{
				props[prop] = core[prop];
			}
		}
		
		// assign property
		for( let prop in props ){
			if( !props.hasOwnProperty(prop) ) continue;
			
			pemu[prop] = props[prop];
		}
		
		// assign method
		Object.setConstant(pemu, methods);
	};
})();
