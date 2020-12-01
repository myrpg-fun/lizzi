/**
 * Copyright (c) Stanislav Shishankin
 *
 * This source code is licensed under the MIT license.
 */

let {Event} = require('./Event');

class pEventChange{
    constructor(value, last, target){
        this.value = value;
        this.last = last;
        this.target = target;
    }
}

class zzReactive extends Event{
    toString(){
        return String(this.value);
    }

    change(fn, self){
        return this.on('change', fn, self);
    }

    destroy(){
        this.off();
        this.emit('destroy', this);
        return this;
    }
}

class zzAny extends zzReactive{
    constructor(value){
        super();

        (value instanceof zzReactive) && (value = value.value);

        Object.defineProperty(this, 'value', {
            get: () => value,
            set: (newValue) => {
                if (value !== newValue){
                    let ev = new pEventChange(newValue, value, this);
                    value = newValue;
                    this.emit('change', ev);
                }
            }
        });
    }
}

class zzType extends zzReactive{
    isType(){
        return true;
    }

    constructor(value){
        super();

        (value instanceof zzReactive) && (value = value.value);

        if (!this.isType(value)){
            throw new TypeError("Value is not match type "+this.constructor.name);
        }

        Object.defineProperty(this, 'value', {
            get: () => value,
            set: (newValue) => {
                if (value !== newValue){
                    if (this.isType(newValue)){
                        let ev = new pEventChange(newValue, value, this);
                        value = newValue;
                        this.emit('change', ev);
                    }else{
                        throw new TypeError("Value is not match type "+this.constructor.name);
                    }
                }
            }
        });
    }
}

class zzNumber extends zzType{
    isType(value){
        return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);
    }
}

class zzInteger extends zzNumber{
    isType(value){
        return Number.isInteger(value);
    }
}

class zzInt extends zzInteger{}

class zzFloat extends zzNumber{
    isType(value){
        return typeof value === 'number' && !Number.isNaN(value);
    }
}

class zzString extends zzType{
    isType(value){
        return typeof value === 'string';
    }
}

class zzStr extends zzString{}

class zzBoolean extends zzType{
    isType(value){
        return typeof value === 'boolean';
    }
}

class zzBool extends zzBoolean{}

class zzObject extends zzType{
    itemListener(name, fn, self){
        this.change((ev) => {
            if (ev.last instanceof Event){
                ev.last.off(this);
            }

            if (ev.value instanceof Event){
                ev.value.on(name, fn.bind(self), this);
            }
        }, this).run([{last: null, value: this.value}]);
    }

    isType(value){
        return typeof value === 'object';
    }

    constructor(value){
        super(value);

        this.on('destroy', () => {
            this.value = null;
        });
    }
}

class zzObj extends zzObject{}

class zzInstance extends zzReactive{
    itemListener(name, fn, self){
        this.change((ev) => {
            if (ev.last instanceof Event){
                ev.last.off(this);
            }

            if (ev.value instanceof Event){
                ev.value.on(name, fn.bind(self), this);
            }
        }, this).run([{last: null, value: this.value}]);
    }

    isType(value, instance){
        return (value === null || value instanceof instance);
    }

    constructor(value, instance){
        super();

        (value instanceof zzReactive) && (value = value.value);

        if (!this.isType(value)){
            throw new TypeError("Value is not match type "+this.constructor.name);
        }

        Object.defineProperty(this, 'value', {
            get: () => value,
            set: (newValue) => {
                if (value !== newValue){
                    if (this.isType(newValue, instance)){
                        let ev = new pEventChange(newValue, value, this);
                        value = newValue;
                        this.emit('change', ev);
                    }else{
                        throw new TypeError("Value is not match type "+this.constructor.name);
                    }
                }
            }
        });

        this.on('destroy', () => {
            this.value = null;
        });
    }
}

class zzReactiveDWatcher extends zzReactive{
    _changefn(){
        let value = this.value;

        if (value !== this.last){
            this.emit('change', new pEventChange(value, this.last, this));
            this.last = value;
        }
    }

    _addListeners(){
        if (this.noListeners){
            this.last = this.value;
            //append relations
            for (let rc of this._dependencies){
                if (rc instanceof zzReactive){
                    rc.change(this._changefn, this);
                }
            }        
            this.noListeners = false;
        }
    }

    _removeListeners(){
        this.noListeners = this.listenerCount('change') === 0;
        if (this.noListeners){
            //remove relations
            for (let rc of this._dependencies){
                if (rc instanceof zzReactive){
                    rc.off(this);
                }
            }
        }
    }

    _initDWatcher(){
        this.noListeners = true;

        this.on('newListener', name => {
            if (name === 'change'){
                this._addListeners();
            }
        }, this);

        this.on('removeListener', name => {
            if (name === 'change'){
                this._removeListeners();
            }
        }, this);
    }
}

class zzFunction extends zzReactiveDWatcher{
    constructor(fn, reacts){
        super();

        this._dependencies = reacts;

        for (let i in this._dependencies){
            let rvar = this._dependencies[i];
            if (!rvar instanceof zzReactive){
                console.error('zzFunction error: argument '+(i+1)+' must be zzReactive');
            }
        }

        Object.defineProperty(this, 'value', {
            get: () => fn(this)
        });

        this._initDWatcher();
    }
}

Function.prototype.zzF = function(){
    return new zzFunction(this, Array.prototype.slice.call(arguments));
};

class pEventArrayChange{
    constructor(added, removed, index, target){
        this.added = added;
        this.removed = removed;
        this.index = Number(index);
        this.target = target;
    }
}

class zzStringConcat extends zzReactiveDWatcher{
    constructor(array, join){
        super();

        join || (join = '');

        if (!Array.isArray(array)){
            if (array instanceof zzArray){

            }else{
                array = [array];
            }
        }

        this._dependencies = array;

        Object.defineProperty(this, 'value', {
            get: () => array.map(v => v.toString()).join(join)
        });

        this.last = this.value;

        this._initDWatcher();
    }
}

class zzArray extends zzReactive{
    add(newData, idx){
        idx === undefined && (idx = this.__zzArray.length);
        Array.isArray(newData) || (newData = [newData]);

        this.__zzArray.splice(idx, 0, ...newData);
        
        this.emit('add', new pEventArrayChange(newData, [], idx, this));
        this.emit('change', new pEventChange(this.__zzArray, this.__zzArray, this));
        
        return this;
    }

    addBefore(data, before){
        let idx = this.indexOf(before);
        if (idx === -1){
            return this;
        }
        
        return this.add(data, idx);
    }
    
    addAfter(data, after){
        let idx = this.indexOf(after);
        if (idx === -1){
            return this;
        }
        
        return this.add(data, idx+1);
    }

    removeAll(){
        let last = this.__zzArray;
        
        this.__zzArray = [];
        
        this.emit('remove', new pEventArrayChange([], last, 0, this));
        this.emit('change', new pEventChange(last, this.__zzArray, this));
        
        return this;
    }
    
    remove(data){
        Array.isArray(data) || (data = [data]);

        for (let d of data){
            let idx = this.__zzArray.indexOf(d);
            if (idx !== -1){
                this.__zzArray.splice(idx, 1);
                this.emit('remove', new pEventArrayChange([], [d], idx, this));
            }
        }

        this.emit('change', new pEventChange(this.__zzArray, this.__zzArray, this));
        
        return this;
    }

    replace(newData){
        Array.isArray(newData) || (newData = [newData]);

        let last = this.__zzArray.slice(0);
        this.__zzArray = newData;

        this.emit('replace', new pEventArrayChange(newData, last, 0, this));
        this.emit('change', new pEventChange(last, this.__zzArray, this));
        
        return this;
    }

    refresh(){
        this.emit('change', new pEventChange(this.__zzArray, this.__zzArray, this));
        
        return this;
    }

    *[Symbol.iterator]() {
        for (let el of this.toArray()){
            yield el;
        }
    }

    toArray(){
        return this.__zzArray;
    }

    /* helpers */
    itemsListener(name, fn, self){
        this.on('add', (ev) => {
            for (let item of ev.added){
                item.on(name, fn.bind(self, item), this);
            }
        }, this).run([{added: this.__zzArray}]);

        this.on('remove', (ev) => {
            for (let item of ev.removed){
                item.off(this);
            }
        }, this);

        this.on('replace', function(ev){
            for (let item of ev.added){
                item.on(name, fn.bind(self, item), this);
            }

            for (let item of ev.removed){
                item.off(this);
            }
        }, this);
    }

    initArray(array){
        array || (array = []);
        (array instanceof zzArray) && (array = array.value);

        if (!Array.isArray(array)){
            console.error('zzArray error: first argument must be Array');
        }

        this.__zzArray = array;
  
        Object.defineProperty(this, 'value', {
            get: () => this.__zzArray,
            set: (array) => this.replace(array)
        });

        Object.defineProperty(this, 'length', {
            get: () => this.__zzArray.length
        });
    }

    constructor(array){
        super();

        this.initArray(array);
    }
}

class zzArrayInstance extends zzArray{
    checkDataInstance(data){
        for (let d of data){
            if (!(d instanceof this.instance)){
                throw new TypeError("Array value is not match type "+this.instance.name);
            }
        }

        return true;
    }

    add(newData, idx){
        idx === undefined && (idx = this.__zzArray.length);
        Array.isArray(newData) || (newData = [newData]);

        this.checkDataInstance(newData);

        this.__zzArray.splice(idx, 0, ...newData);
        
        this.emit('add', new pEventArrayChange(newData, [], idx, this));
        this.emit('change', new pEventChange(this.__zzArray, this.__zzArray, this));
        
        return this;
    }

    replace(newData){
        Array.isArray(newData) || (newData = [newData]);

        this.checkDataInstance(newData);

        let last = this.__zzArray.slice(0);
        this.__zzArray = newData;

        this.emit('replace', new pEventArrayChange(newData, last, 0, this));
        this.emit('change', new pEventChange(last, this.__zzArray, this));
        
        return this;
    }

    initArray(array){
        array || (array = []);
        (array instanceof zzArray) && (array = array.value);

        if (!Array.isArray(array)){
            console.error('zzArray error: first argument must be Array');
        }

        this.checkDataInstance(array);

        this.__zzArray = array;
  
        Object.defineProperty(this, 'value', {
            get: () => this.__zzArray,
            set: (array) => this.replace(array)
        });

        Object.defineProperty(this, 'length', {
            get: () => this.__zzArray.length
        });
    }

    constructor(array, instance){
        super();

        this.instance = instance;

        this.initArray(array);
    }
}

class zzArrayFilter extends zzArray{
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
        if (this.listenerCount('change') + this.listenerCount('replace') > 0){
            this.__zzNeedUpdate = true;
            let last = this.__zzArray.slice();
            let value = this.toArray();
            this.emit('replace', new pEventArrayChange(value, last, 0, this));
            this.emit('change', new pEventChange(value, value, this));
        }
    }
    
    toArray(){
        if (this.__zzNeedUpdate){
            this.__zzArray = this.__zzFilterFn(this.array.value.slice());
            this.__zzNeedUpdate = false;
        };
        
        return this.__zzArray;
    }
    
    *[Symbol.iterator]() {
        for (let el of this.toArray()){
            yield el;
        }
    }
    
    setArray(array){
        if (array instanceof zzArray){
            if (this.array){
                this.array.off('change', this.refresh, this);
            }
            this.array = array;
            this.array.on('change', this.refresh, this);
        }else{
            console.error('zzArrayFilter error: first argument must be zzArray');
        }
    }
    
    initArray(array){
        this.setArray(array);
        
        this.__zzFilterFn = this.filter;
        this.__zzArray = [];
        this.__zzNeedUpdate = true;
        
        Object.defineProperty(this, 'length', {
            get: () => this.toArray().length
        });
        
        Object.defineProperty(this, 'value', {
            get: () => this.toArray()
        });
    }
}

class zzModel extends zzReactive{
    values(){
        let result = {};

        for (let name in this.__zzValues){
            let value = this.__zzValues[name];
            if (value instanceof zzReactive){
                result[name] = value.value;
            }else{
                result[name] = value;
            }
        }

        return result;
    }

    update(values){
        for (let name in values){
            if (this.__zzValues[name] === undefined){
                continue;
            }

            if (this.__zzValues[name] instanceof zzReactive){
                this.__zzValues[name].value = values[name];
            }else{
                this.__zzValues[name] = values[name];
            }
        }
    }

    refresh(ev){
        this.emit('change', new pEventChange(this.__zzValues, this.__zzValues, this));
    }

    sync(values){
        for (let name in values){
            if (this.__zzValues[name] instanceof zzReactive){
                this.__zzValues[name].off(this);
            }

            let newValue = values[name];
            if (newValue instanceof zzReactive){
                newValue.change(this.refresh, this);
            }

            this.__zzValues[name] = newValue;
        }

        this.refresh();
    }

    constructor(values){
        super();

        this.__zzValues = {};

        this.sync(values);

        Object.defineProperty(this, 'value', {
            get: () => this.values(),
            set: values => this.sync(values)
        });
    }
}

module.exports = {zzReactive, zzAny, zzType, zzNumber, zzInt, zzInteger, zzFloat, zzStr, zzString, zzBool, zzBoolean, zzObj, zzObject, zzInstance, zzFunction, zzStringConcat, zzArray, zzArrayInstance, zzArrayFilter, zzModel};