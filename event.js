/*
 * Docs https://github.com/myrpg-fun/lizzi
 */

class EventStack{
    removeAll(){
        let arr = this.events;
        
        for (let l in arr){
            if (arr[l] instanceof EventListener){
                arr[l].off();
            }
        }
        
        this.events = [];
        
        return this;
    }
    
    add(events){
        !Array.isArray(events) && (events = [events]);
        
        this.events = this.events.concat(events);
        
        return this;
    }
    
    constructor(){
        this.events = [];
    }
};

class EventsGroup{
    add(listener, once, prepend){
        let toGroup = once?this.once:this.many;
        
        if (listener instanceof EventListener){
            if (prepend){
                toGroup.unshift(listener);
            }else{
                toGroup.push(listener);
            }
            
            listener.__zzAddGroup(this);
        }
    }
    
    remove(listener){
        if (listener instanceof EventListener){
            let i = this.once.indexOf(listener);
            (i !== -1) && this.once.splice(i, 1);
            
            i = this.many.indexOf(listener);
            (i !== -1) && this.many.splice(i, 1);
        }
    }
    
    removeFn(fn){
        let i = 0;
        do{
            i = this.many.findIndex(l => l.fn === fn, i);
            (i !== -1) && this.many.splice(i, 1);
        }while(i !== -1);
        
        i = 0;
        do{
            i = this.once.findIndex(l => l.fn === fn, i);
            (i !== -1) && this.once.splice(i, 1);
        }while(i !== -1);
    }
    
    removeBySelf(self){
        let i = 0;
        do{
            i = this.many.findIndex(l => l.self === self, i);
            (i !== -1) && this.many.splice(i, 1);
        }while(i !== -1);
        
        i = 0;
        do{
            i = this.once.findIndex(l => l.self === self, i);
            (i !== -1) && this.once.splice(i, 1);
        }while(i !== -1);
    }
    
    removeAll(){
        let m = this.many;
        let o = this.once;
        
        this.many = [];
        this.once = [];
        
        for (let ml of m){
            ml.off();
        }
        
        for (let ol of o){
            ol.off();
        }
        
        return this;
    }
    
    enable(args){
        if (Array.isArray(args)){
            this.enabled = args;
        }else{
            this.enabled = false;
        }
    }
    
    isEnabled(){
        return this.enabled !== false;
    }
    
    emit(argsArray){
        let events = this.many.slice(0);
        for (let i in events){
            events[i].run(argsArray);
        }

        events = this.once.slice(0);
        for (let i in events){
            events[i].run(argsArray);
        }
        this.once = [];
    }
    
    constructor(name){
        this.name = name;
        this.many = [];
        this.once = [];
        this.enabled = false;
    }
}

class EventListener{
    off(){
        for (let group of this.group){
            group.remove(this);
        }
        
        return this;
    }
    
    run(argsArray){
        if (this.isCalled){
            return;
        }
        
        this.isCalled = true;
        this.fn.apply(this.self, argsArray);
        this.isCalled = false;
        
        return this;
    }
    
    call(){
        if (this.isCalled){
            return;
        }
        
        this.isCalled = true;
        this.fn.apply(this.self, arguments);
        this.isCalled = false;
        
        return this;
    }
    
    addToStack(stack){
        stack.add(this);
        
        return this;
    }
    
    __zzAddGroup(group){
        if (group instanceof EventsGroup){
            this.group.push(group);
        }
        
        return this;
    }
    
    constructor(fn, self){
        this.fn = fn;
        this.self = self;
        this.isCalled = false;
        this.group = [];
    }
}

class Event{
    __zzGetEvents(){
        return this.__zzEvents;
    }
    
    __zzGetEvent(name){
        return this.__zzEvents[name];
    }
    
    __zzCheckExistsEvent(name){
        if (!this.__zzGetEvent(name)){
            this.__zzEvents[name] = new EventsGroup(name);
        }
        return this.__zzEvents[name];
    }
    
    __zzAddEventListener(name, fn, self, once, prepend){
        !Array.isArray(name) && (name = [name]);
        !self && (self = this);
        !once && (once = false);
        !prepend && (prepend = false);

        let evListener;
        if (fn instanceof EventListener){
            evListener = fn;
            self = evListener.self;
            fn = evListener.fn;
        }else{
            evListener = new EventListener(fn, self);
        }
        
        for (let i in name){
            let evGroup = this.__zzCheckExistsEvent(name[i]);

            if (evGroup.isEnabled()){
                fn.apply(self, evGroup.enabled);
                if (!once){
                    evGroup.add(evListener, once, prepend);
                }
            }else{
                evGroup.add(evListener, once, prepend);
            }
        }

        return evListener;
    }
    
    on(name, fn, self){
        return this.__zzAddEventListener(name, fn, self, false, false);
    }

    once(name, fn, self){
        return this.__zzAddEventListener(name, fn, self, true, false);
    }

    prependListener(name, fn, self){
        return this.__zzAddEventListener(name, fn, self, false, true);
    }

    prependOnceListener(name, fn, self){
        return this.__zzAddEventListener(name, fn, self, true, true);
    }

    /**
     * remove event listener by name, function or class object
     *
     * @param {string} [name] - event name 
     * @param {string} [fn] - event function
     * @param {string} [self] - event class object
     */
    off(name, fn, self){
        if (name instanceof EventListener){
            name.off();
            
            return;
        }
        
        !Array.isArray(name) && (name = [name]);
        !fn && (fn = self);

        for (let i in name){
            let evName = name[i];
            if (typeof evName === 'string'){
                let evGroup = this.__zzGetEvent(evName);

                if (evGroup){
                    if (typeof fn === 'function'){
                        evGroup.removeFn(fn);
                    }else{
                        evGroup.removeBySelf(fn);
                    }
                }
            }else{
                let events = this.__zzGetEvents();
                if (typeof evName === 'function'){
                    for (let eventName in events){
                        events[eventName].removeFn(evName);
                    }
                }else{
                    for (let eventName in events){
                        events[eventName].removeBySelf(evName);
                    }
                }
            }
        }
    }
    
    /**
     * Emit event
     *
     * @param   {string} name - key/index of the element in the list of jobs
     */
    emit(name){
        let evGroup = this.__zzGetEvent(name);
        if (!evGroup){
            return false;
        }
        
        evGroup.emit([].slice.call(arguments, 1));
        
        return true;
    }
    
    /**
     * Enable event, if event enabled, all new listeners will call automatically
     *
     * @param   {string} name - key/index of the element in the list of jobs
     */
    enable(name){
        let evGroup = this.__zzCheckExistsEvent(name);
        evGroup.enabled = [].slice.call(arguments);
        
        this.emit.apply(this, evGroup.enabled);
    }
    
    isEnabled(name){
        let evGroup = this.__zzCheckExistsEvent(name);
        return evGroup && evGroup.isEnabled();
    }
    
    /**
     * Disable enabled event
     *
     * @param   {string} name - key/index of the element in the list of jobs
     */
    disable(name){
        let evGroup = this.__zzCheckExistsEvent(name);
        if (evGroup.isEnabled()){
            evGroup.enabled = false;

            this.emit.apply(this, ['disable:'+name].concat([].slice.call(arguments, 1)));
        }
    }
    
    constructor(){
        this.__zzEvents = {};

        //aliases
        this.addListener = this.on;
        this.removeListener = this.off;
        this.callListener = this.emit;
    }
};

function EventAfterAll(fn){
    var __zzAfterEmitValues = [];
    
    return function(){
        if (__zzAfterEmitValues.length === 0){
            setTimeout(() => {
                fn.call(this, __zzAfterEmitValues);

                __zzAfterEmitValues = [];
            }, 0);

            __zzAfterEmitValues.push([].slice(arguments));
        }
    };
}

module.exports = {EventStack, EventListener, EventsGroup, EventAfterAll, Event};
