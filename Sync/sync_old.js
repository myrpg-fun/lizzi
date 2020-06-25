let {Event} = require('./event');
let zzSync = require('./zzSync');
let __zzSyncCounter = 0;



class Sync extends Event{
    addSyncedClass(classTable){
        for (let name in classTable){
            this.syncedClassTable[name] = classTable[name];
        }
        return this;
    }
    
    addConnection(socket, options){
        !options || (options = {});

        //on receive data
        socket.on('sync:data', function(dataArray){
            this.receiveData(dataArray);
        }.bind(this));
        
        this.on('sync:data', function(dataArray){
            socket.emit('sync:data', dataArray);
        }, socket);
        
        socket.on('disconnect', () => this.off(socket));
        
        //send current state
        let array = [];
        for (let i in this.synced){
            array.push( this.packRefs( this.synced[i].__zzSerialize() ) );
        }

        socket.emit('sync:data', array);
        
        return this;
    }

    unpackRefs(data){
        if (Array.isArray(data)){
            data = data.slice();
            for (let i in data){
                data[i] = this.unpackRefs(data[i]);
            }
        }else if (typeof data === 'object'){
            if ('___' in data){
                return this.synced[data[this.uidName].id]?this.synced[data[this.uidName].id]:data;
            }else{
                data = Object.assign({}, data);
                for (let i in data){
                    data[i] = this.unpackRefs(data[i]);
                }
            }
        }
        
        return data;
    }
    
    receiveData(dataArray){
        !Array.isArray(dataArray) || (dataArray = [dataArray]);
        
        
    }

    packRefs(data){
        if (Array.isArray(data)){
            data = data.slice();
            for (let i in data){
                data[i] = this.packRefs(data[i]);
            }
        }else if (typeof data === 'object'){
            if (this.uidName in data){
                return {'___': data[this.uidName].id};
            }else{
                data = Object.assign({}, data);
                for (let i in data){
                    data[i] = this.packRefs(data[i]);
                }
            }
        }
        
        return data;
    }

    __findClassName(data){
        for (let className in this.syncedClassTable){
            if (this.syncedClassTable[className]){
                return className;
            }
        }
        
        return null;
    }

    packData(data){
        let className = this.__findClassName(data);
        
        if (!className){
            console.error('unknown class name for Sync', data.constructor.name);
            return null;
        }
        
        return {
            id: data[this.uidName],
            class: className,
            data: this.packRefs( data.__zzSerialize() )
        };
    }

    sendData(data){
        let values = this.packData(data);
        
        if (values){
            this.emit('sync:data', [values]);
        }
    }
    
    watch(data){
        if (data instanceof zzSync){
            if (data[this.uidName]){
                data[this.uidName].used++;
            }else{
                data[this.uidName] = {
                    id: Date.now() + Math.random(),
                    time: 0,
                    used: 1
                };
                
                data.on(data.__zzGetSyncedEvents(), this.sendData.bind(this, data), this);
                
                console.log('add watch');
                data.emit('sync:watch', this);
                
                this.sendData(data);
            }
        }
        
        return this;
    }
    
    unwatch(data){
        if (data instanceof zzSync && data[this.uidName]){
            data[this.uidName].used--;
            if (data[this.uidName].used <= 0){
                data.off(this);
                delete this.synced[data[this.uidName]];
                delete data[this.uidName];
                
                data.emit('sync:unwatch', this);
            }
        }
        
        return this;
    }
    
    constructor(){
        super();
        
        this.synced = {};
        this.syncedClassTable = {};
        this.uid = __zzSyncCounter++;
        this.uidName = '__zzSyncId'+this.uid;
    }
}

module.exports = Sync;