let {Event} = require('./event');

class zzSync extends Event{
    __zzSerialize(){
        return {};
    }
    
    __zzGetSyncedEvents(){
        return [];
    }
};

module.exports = zzSync;