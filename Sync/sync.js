let {Event} = require('../Event');

class Sync extends Event{
    uniqid(){
        return Date.now() + Math.random();
    }
    
    serializeVar(data, key){
        if (Array.isArray(data)){
            return data.map(this.serializeVar);
        }else if (typeof data === 'object'){
            let tid = this.data.get(data);
            
            if (tid !== undefined){
                return {'___': String(tid.id)};
            }else{
                if (data.toJSON){
                    data = data.toJSON(key);
                }

                //object without ID
                let result = {};

                for (let k in data){
                    result[k] = this.serializeVar(data[k], k);
                }

                return result;
            }
        }else{
            return null;
        }
    }
    
    serializeData(data, key, tid){
        if (data.toJSON){
            data = data.toJSON(key);
        }

        let result = {'___': [tid.id, tid.class]};

        for (let k in data){
            result[k] = this.serializeVar(data[k], k);
        }

        return result;
    }
    
    toJSON(){
        let result = [];
        
        this.data.forEach((tid, data) => {
            result.push(this.serializeData(data, tid.id, tid));
        });
        
        return result;
    }
    
    emitChanges(data){
        this.emit('sync:change', data, this);
    }
    
    watch(data){
        if (data.__zzSyncedEvents !== undefined){
            let tid = this.data.get(data);
            if (tid !== undefined){
                tid.used++;
            }else{
                let event = data.on(data.__zzGetSyncedEvents(), this.emitChanges.bind(this, data), this);
                let id = this.uniqid();
                
                tid = {
                    used: 0,
                    //version: 0,
                    id: id,
                    //json: data.toJSON(id),
                    class: data.__zzSerializeClass(),
                    event: event
                };
                
                this.data.set(data, tid);
                this.id.set(tid.id, data);
                                
                data.emit('sync:watch', data, this);
                this.emit('sync:watch', data, this);
            }
        }
        
        return this;
    }
    
    unwatch(data){
        let tid = this.data.get(data);

        if (tid !== undefined){
            tid.used--;
            if (tid.used <= 0){
                this.data.delete(data);
                this.id.delete(tid.id);
                
                tid.event.off();

                data.emit('sync:unwatch', data, this);
                this.emit('sync:unwatch', data, this);
            }
        }
        
        return this;
    }
    
    constructor(){
        super();
        
        this.id = new Map;
        this.data = new Map;
    }
}

module.exports = Sync;