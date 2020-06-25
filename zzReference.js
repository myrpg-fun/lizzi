class zzReference{
    onSet(fn, self){}    
    off(fn, self){}
}

class zzDataRef extends zzReference{
    onSet(fn, self){
        return this.model.on('set:'+this.name, fn, self);
    }
    
    off(fn, self){
        this.model.off('set:'+this.name, fn, self);
    }

    constructor(model, name){
        super();
        
        this.model = model;
        this.name = name;
        
        Object.defineProperty(this, 'value', {
            get: () => this.model[this.name],
            set: (value) => this.model[this.name] = value
        });
    }
}

class zzFunctionRef extends zzReference{
    onSet(fn, self){
        for (let ref of this.refs){
            ref.onSet(fn, self);
        }
    }
    
    off(fn, self){
        for (let ref of this.refs){
            ref.off(fn, self);
        }
    }

    constructor(fn, refs){
        super();
        
        this.refs = refs;
        
        Object.defineProperty(this, 'value', {
            get: () => fn()
        });
    }
}

class zzArrayRef extends zzReference{
    onSet(fn, self){
        for (let model of this.models){
            if (model instanceof zzReference){
                model.onSet(fn, self);
            }
        }
    }
    
    off(fn, self){
        for (let model of this.models){
            if (model instanceof zzReference){
                model.off(fn, self);
            }
        }
    }
    
    constructor(model){
        super();
        
        this.models = Array.isArray(model)?model:[model];
        Object.defineProperty(this, 'value', {
            get: () => {
                let value = '';
                
                for (let model of this.models){
                    if (model instanceof zzReference){
                        value += model.value;
                    }else{
                        value += model;
                    }
                }
                
                return value;
            }
        });
    }
}

if (!Function.prototype.ref){
    Function.prototype.ref = function(){
        return new zzFunctionRef(this, [].slice.call(arguments, 0));
    };
}

module.exports = {zzReference, zzArrayRef, zzDataRef, zzFunctionRef};