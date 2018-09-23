# Paraemu P2P Pack #

## For user ##

### How to use ###

1. Install global package [paraemu](https://www.npmjs.com/package/paraemu)
    > npm i -g paraemu

2. Setting config file:

    File structure:
    ```javascript
    {
        "server": undefined | {                     // server config
            "host": @string,
            "port": @int
        },
        "remote": undefined | {                     // client config
            "host": @string,
            "port": @int
        },
        "processes" : [
            {
                "tag": undefined | @string,
                "root": undefined | @string,        // root path
                "script": @string,                  // execute file name
                "args": undefined | [ @any, ... ],  // node js command line arguments
                "env": undefined | [ @string, ... ] // node js command line options
            },
            ...
        ]
    }
    ```

    * Script execute path is `./${root}/${script}`.

    Central Example:
    ```javascript
    // ./test/config-central.json
    {
        "server": {
            "host": "127.0.0.1",
            "port": 23410
        },
        "processes" : [
            {
                "root": "./content/central/",
                "script": "./central.js"
            }
        ]
    }
    ```

    Node Example:
    ```javascript
    // ./test/config-single-node.json
    {
        "remote": {
            "host": "127.0.0.1",
            "port": 23410
        },
        "processes" : [
            {
                "root": "./content/single-node",
                "script": "./node.js"
            }
        ]
    }
    ```

3. Write script file:

    (1) Central Example:
    ```javascript
    // ./test/content/central/central.js
    const pemu = require('paraemu');
    require('paraemu-p2p-pack').expand('central', pemu);

    /**
     * Node connect logic
     * @async
     * @param {string} nodeId
     * @return {Promise<string[]>} Neighbor node ids
     */
    pemu.nodeConnect = async (nodeId) => {
        ...
        return neighborNodeIds;
    };

    /**
     * Node disconnect logic
     * @async
     * @param {string} nodeId
     * @return {Promise<undefined>}
     */
    pemu.nodeDisconnect = async (nodeId) => {
        ...
    };

    /**
     * Node group detach logic
     * @async
     * @param {string} groupId
     * @return {Promise<string[]>} Node ids
     */
    pemu.nodeGroupDetach = async (groupId) => {
        ...
        return nodeIds;
    };

    /**
     * Fetch neighbors logic
     * @async
     * @param {string} nodeId
     * @return {Promise<string[]>} Neighbor node ids
     */
    pemu.fetchNeighbors = async (nodeId) => {
        ...
        return nodeIds;
    };

    await pemu.init(callback1);         // init central
    ```

    (2) Node Example:
    ```javascript
    // ./test/content/single-node/node.js
    const pemu = require('paraemu');
    require('paraemu-p2p-pack').expand('node', pemu);

    pemu.maxPeers = 5;                  // set maximum peers

    /**
     * Node agree or disagree to become a peer (Optional)
     * @param {string} nodeId node id for asker
     * @return {boolean} true: agree, false: disagree
     */
    pemu.agreeBecomePeer = (nodeId) => {
        ...
    };

    await pemu.init(callback2);         // init node
    console.log(pemu.wiredNeighbors);   // list of wired neighbors

    await pemu.fetchNeighbors();        // fetch the newest wired neighbors
    console.log(pemu.wiredNeighbors);   // list of wired neighbors

    await pemu.findPeer();              // find peers by wired neighbors
    console.log(pemu.peers);            // list of peers

    await pemu.disconnect();            // disconnect
    ```

4. Run command line:
    > paraemu ./config.json

5. Debug task use Chrome DevTools (Optional):  
    (1) Add "--inspect-brk" in "env" field in config.json  
    (2) Run commend line which is similar to step 3  
    (3) Url set "chrome://inspect" in Chrome  
    (4) Click "Open dedicated DevTools for Node" link  
    (5) Click "Add connection" button  
    (6) Add "localhost:9230" in url field  
        (Debugger listening start from 9230 port in first child process)  
    (7) Press "F5" key to refresh page  
    (8) Click "inspect" link in Remote Target  

6. Debug main task use Chrome DevTools (Optional):  
    (1) Run command line which is different from step 3:  
    > paraemu --inspect-brk ./config

    (2) Url set "chrome://inspect" in Chrome  
    (3) Click"Open dedicated DevTools for Node" link  
    (4) Click "Add connection" button  
    (5) Add "localhost:9229" in url field  
        (Debugger listening start from 9229 port in main process)  
    (6) Press "F5" key to refresh page  
    (7) Click "inspect" link in Remote Target

### Noun Definition ###

* Group: Total workspace in config.
* Task: Each child process in config.
* Job: Detailed work in each child process.

---

## For maintainer ##

### Install project ###

* Clone project:
    > git clone \<project-url\>

* Install dependency package:
    > npm install

### Build and Run ###

* Run test-all (use npm):
    > npm run test-all

* Run test-central (use npm):
    > npm run test-central

* Run test-multi-node (use npm):
    > npm run test-multi-node

* Run test-single-node (use npm):
    > npm run test-single-node

### Debug ###

* Run test-all (use npm):
    > npm run test-all-inspect

* Run test-central (use npm):
    > npm run test-central-inspect

* Run test-multi-node (use npm):
    > npm run test-multi-node-inspect

* Run test-single-node (use npm):
    > npm run test-single-node-inspect
