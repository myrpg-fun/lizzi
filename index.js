/*
 * Docs https://github.com/myrpg-fun/lizzi
 */

let {zzDataRef} = require('./zzReference');
let {Event} = require('./Event');

class Data extends Event{
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
        }
    }
    
    ref(name){
        return new zzDataRef(this, name);
    }
    
    set(values){
        if (values instanceof Data){
            values = values.values();
        }
        
        let last = {};
        //set all values
        for (let name in values){
            if (!(name in this.__zzValues) && name !== '__zzValues'){
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
        
        this.set(data);
    }
}

class Collection extends Event{
    add(data, idx){
        idx === undefined && (idx = this.__zzArray.length);
        !Array.isArray(data) && (data = [data]);
        
        return this.splice(idx, 0, ...data);
    }
    
    addBefore(element, data){
        let idx = this.indexOf(element);
        if (idx === -1){
            return this;
        }
        
        return this.add(data, idx);
    }
    
    addAfter(element, data){
        let idx = this.indexOf(element);
        if (idx === -1){
            return this;
        }
        
        return this.add(data, idx+1);
    }
    
    removeAll(){
        let all = this.__zzArray;
        
        this.__zzArray = [];
        
        all.forEach(function(val, idx){
            this.emit('remove', val, 0, this);
        }, this);
        
        this.emit('remove-values', all, this);
        this.emit('change-values', all, this);
        
        return this;
    }
    
    splice(index, count){
        let newData = [].slice.call(arguments, 2);
        let removeData = this.__zzArray.splice(index, count, ...newData);
        
        if (count > 0){
            for (let i in removeData){
                this.emit('remove', removeData[i], Number(index)+Number(i), this);
            }
        
            this.emit('remove-values', removeData, this);
        }

        if (newData.length > 0){
            newData.forEach((val, i) => {
                this.emit('add', val, i+index, this);
            });

            this.emit('add-values', newData, index, this);
        }
        
        this.emit('change-values', this.__zzArray, this);
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
    
    has(val){
        return this.__zzArray.indexOf(val) !== -1;
    }
    
    replace(data){
        !Array.isArray(data) && (data = [data]);
        
        let last = this.__zzArray;
        this.__zzArray = data;
        
        this.emit('replace-values', data, last, this);
        this.emit('change-values', data, this);
        
        return this;
    }
    
    refresh(){
        this.emit('change-values', this.__zzArray, this);
    }
    
    async forEach(fn, self){
        for (let i in this.__zzArray){
            let result = fn.call(self, this.__zzArray[i], i, this.__zzArray);
            if (result instanceof Promise){
                await result;
            }
        }
    }
    
    *[Symbol.iterator]() {
        for (let el of this.__zzArray){
            yield el;
        }
    }

    toArray(){
        return this.__zzArray;
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
        
        if (array){
            this.add(array);
        }
    }
}

class LazyCollection extends Event{
    /*
     * filter/sort class
     * 
     * @param {Array} elements - array of original elements
     * @returns {Array} - filtered / sorted array for new collection
     */
    filter(elements){
        return elements;
    }
    
    setFilter(fn){
        if (typeof fn === 'function'){
            this.__zzFilterFn = fn;
            this.refresh();
        }
        return this;
    }

    refresh(){
        this.__zzNeedUpdate = true;
        this.emit('replace-values', this, this.__zzArray.slice(), this);
        this.emit('change-values', this, this);
    }
    
    /*
     * add to filter outer collection to set filtered array
     * 
     * @param {zzFCollection} collection - outer collection
     */
    to(collection){
        this.on('change-values', () => collection.replace(this.elements), collection);
        
        collection.replace(this.elements);
        
        return this;
    }
    
    toArray(){
        if (this.__zzNeedUpdate){
            this.__zzArray = this.__zzFilterFn(this.collection.elements);
            this.__zzNeedUpdate = false;
        };
        
        return this.__zzArray;
    }
    
    async forEach(fn, self){
        for (let i in this.toArray()){
            let result = fn.call(self, this.__zzArray[i], i, this.__zzArray);
            if (result instanceof Promise){
                await result;
            }
        }
    }
    
    *[Symbol.iterator]() {
        for (let el of this.toArray()){
            yield el;
        }
    }
    
    constructor(collection){
        super();
        
        this.collection = collection;
        this.collection.on('change-values', this.refresh, this);
        
        this.__zzFilterFn = this.filter;
        this.__zzArray = [];
        this.__zzNeedUpdate = true;
        
        Object.defineProperty(this, 'length', {
            get: () => this.toArray().length
        });
        
        Object.defineProperty(this, 'elements', {
            get: () => this.toArray().slice()
        });
    }
}

module.exports = {Data, Collection, LazyCollection};