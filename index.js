(()=>{
	'use strict';
	
	
	
	const CORE_NAME_LIST = [ 'node', 'central' ];
	module.exports.expand = (pemu, coreName = CORE_NAME_LIST[0])=>{
		if( (CORE_NAME_LIST.indexOf(coreName) === -1) || !pemu ) return;
		
		require(`./core/p2p-${coreName}`)(pemu);
	};
})();
