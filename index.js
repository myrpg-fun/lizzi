/*
 * Docs https://github.com/myrpg-fun/lizzi
 */

let {Event} = require('./event');
const zzSync = require('./zzSync');

class zzDataRef{
    onSet(fn, self){
        return this.model.on('set:'+this.name, fn, self);
    }
    
    off(fn, self){
        this.model.off('set:'+this.name, fn, self);
    }

    __init(model, name){
        this.model = model;
        this.name = name;
        this.events = [];
        
        Object.defineProperty(this, 'value', {
            get: () => this.model[this.name],
            set: (value) => this.model[this.name] = value
        });
        
    }
    
    constructor(model, name){
        this.__init(model, name);
    }
}

class Data extends zzSync{
    __zzSerialize(){
        return this.values();
    }
    
    __zzGetSyncedEvents(){
        return ['set', 'remove-value'];
    }
    
    __zzEmitAfterSet(name, value){
        if (this.__zzAfterEmitValues === null){
            setTimeout(() => {
                this.emit('set-values', {
                    values: this.__zzAfterEmitValues, target: this
                });
                
                this.__zzAfterEmitValues = null;
            }, 0);
            
            this.__zzAfterEmitValues = {};
        }
        
        this.__zzAfterEmitValues[name] = value;
    }
    
    __zzSet(name, value){
        var last = this.__zzValues[name];
        if (last !== value){
            this.__zzValues[name] = value;
            this.emit('set', {
                name: name, value: value, last: last, target: this
            });
            this.emit('set:'+name, {
                name: name, value: value, last: last, target: this
            });
//            this.__zzEmitAfterSet(name, value);
        }
    }
    
    ref(name){
        return new zzDataRef(this, name);
    }
    
    set(values){
        let last = {};
        //set all values
        for (let name in values){
            if (!(name in this.__zzValues)){
                Object.defineProperty(this, name, {
                    get: () => this.__zzValues[name],
                    set: this.__zzSet.bind(this, name)
                });
            }

            last[name] = this.__zzValues[name];
            this.__zzValues[name] = values[name];
        }
        
        //then emit
        for (let name in values){
            let value = this.__zzValues[name];
            if (last[name] !== value){
                this.emit('set', {
                    name: name, value: value, last: last[name], target: this
                });
                this.emit('set:'+name, {
                    name: name, value: value, last: last[name], target: this
                });
//                this.__zzEmitAfterSet(name, value);
            }
        }
        
        return this;
    }
    
    values(){
        return Object.assign({}, this.__zzValues);
    }
    
    get(name){
        return this.__zzValues[name];
    }
    
    unset(name){
        Object.defineProperty(this, name, {set:undefined, get:undefined});
        
        this.emit('remove-value', {
            name: name, value: this.__zzValues[name], target: this
        });
        
        delete this.__zzValues[name];
    }
    
    constructor(data){
        super();
        
        !data && (data = {});
        
        this.__zzValues = {};
        this.__zzAfterEmitValues = null;
        
        this.set(data);
    }
}

class Collection extends zzSync{
    __zzSerialize(){
        return this.elements;
    }
    
    __zzGetSyncedEvents(){
        return ['change-values'];
    }
    
    add(data){
        !Array.isArray(data) && (data = [data]);
        
        data.forEach(function(val){
            this.__zzArray.push(val);
            this.emit('add', val, this.__zzArray.length-1, this);
        }, this);
        
        this.emit('add-values', data, this);
        this.emit('change-values', this.__zzArray, this);
        
        return this;
    }
    
    removeAll(){
        let all = this.__zzArray;
        
        this.__zzArray = [];
        
        all.forEach(function(val, idx){
            this.emit('remove', val, idx, this);
        }, this);
        
        this.emit('remove-values', all, this);
        this.emit('change-values', all, this);
        
        return this;
    }
    
    splice(index, count){
        let val = this.__zzArray.splice(index, count);
        for (let i in val){
            this.emit('remove', val[i], index*1+i*1, this);
        }
    }
    
    remove(data){
        !Array.isArray(data) && (data = [data]);
        
        data.forEach(function(val){
            let i = this.indexOf(val);
            if (i !== -1){
                this.splice(i, 1);
            }
        }.bind(this));
        
        this.emit('remove-values', data, this);
        this.emit('change-values', this.__zzArray, this);
        
        return this;
    }
    
    getByIndex(index){
        return this.__zzArray[index];
    }
    
    findIndex(func){
        return this.__zzArray.findIndex(func);
    }
    
    find(func){
        return this.__zzArray.find(func);
    }
    
    filter(func){
        return this.__zzArray.filter(func);
    }
    
    indexOf(val){
        return this.__zzArray.indexOf(val);
    }
    
    replace(data){
        !Array.isArray(data) && (data = [data]);
        
        let last = this.__zzArray;
        this.__zzArray = data;
        
        this.emit('replace-values', data, last, this);
        this.emit('change-values', data, this);
        
        return this;
    }
    
    async forEach(fn, self){
        for (let i in this.__zzArray){
            let result = fn.call(self, this.__zzArray[i], i, this.__zzArray);
            if (result instanceof Promise){
                await result;
            }
        }
    }
    
    initSyncEvents(){
        this.on('sync:watch', function(sync){
            this.elements.forEach(e => sync.watch(e));
        }, this);
        
        this.on('sync:unwatch', function(sync){
            this.elements.forEach(e => sync.unwatch(e));
        }, this);
    }
    
    constructor(array){
        super();
        
        this.__zzArray = [];
  
        Object.defineProperty(this, 'length', {
            get: () => this.__zzArray.length
        });
        
        Object.defineProperty(this, 'elements', {
            get: () => this.__zzArray.slice()
        });
        
        this.initSyncEvents();
        
        if (array){
            this.add(array);
        }
    }
}

/*
 * Collection filter used for sort and filter elements in Collections
 * 
 * @param {Collection} collection - inner collection
 * 
 * use: new CFilter(innerCollection)
 *          .setFilterFn(filterFunction)
 *          .to(outerCollection);
 */

class CollectionFilter extends Event{
    /*
     * filter/sort class
     * 
     * @param {Array} elements - array of original elements
     * @returns {Array} - filtered / sorted array for new collection
     */
    filter(elements){
        return elements;
    }
    
    setFilterFn(fn){
        if (typeof fn === 'function'){
            this.__zzFilterFn = fn;
            this.refresh();
        }
        return this;
    }
    
    refresh(){
        this.emit('change', this.__zzFilterFn(this.collection.elements));
    }
    
    __zzSendChanges(collection, elements){
        if (!Array.isArray(elements)){
            console.error('CollectionFilter filter function returns not array');
            
            return;
        }
        
        collection.replace(elements);
    }
    
    /*
     * add to filter outer collection to set filtered array
     * 
     * @param {zzFCollection} collection - outer collection
     */
    to(collection){
        this.on('change', this.__zzSendChanges.bind(this, collection), collection);
        
        //setup current elements
        this.__zzSendChanges(collection, this.__zzFilterFn(this.collection.elements));
        
        return this;
    }
    
    off(collection){
        if (collection){
            this.off(collection);
        }else{
            this.collection.off(this);
        }
        return this;
    }
    
    constructor(collection){
        super();
        
        this.collection = collection;
        this.collection.on(['add-values', 'remove-values', 'replace-values'], this.refresh, this);
        
        this.__zzFilterFn = this.filter;
    }
}

module.exports = {zzDataRef, Data, Collection, CollectionFilter};