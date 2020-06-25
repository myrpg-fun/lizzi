let {Data, Collection} = require('./event');

class SyncData extends Data{
    toJSON(){
        return this.values();
    }
    
    __zzSerializeClass(){
        return this.constructor.name;
    }
    
    __zzSyncedEvents(){
        return ['set', 'remove-value'];
    }
};

class SyncCollection extends Collection{
    toJSON(){
        return this.elements;
    }
    
    __zzSerializeClass(){
        return this.constructor.name;
    }
    
    __zzSyncedEvents(){
        return ['change-values'];
    }
};

module.exports = {SyncData, SyncCollection};