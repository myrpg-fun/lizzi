/**
 * Copyright (c) Stanislav Shishankin
 *
 * This source code is licensed under the MIT license.
 */

class EventsGroup{
    add(listener, once, prepend){
        let toGroup = once?this.once:this.many;
        
        if (listener instanceof EventListener){
            this.self.emit('newListener', this.name, listener);

            if (prepend){
                toGroup.unshift(listener);
            }else{
                toGroup.push(listener);
            }
            
            //listener.__zzAddGroup(this);
        }
    }
    
    remove(listener){
        if (listener instanceof EventListener){
            let i = this.once.indexOf(listener);
            if (i !== -1){
                this.self.emit('removeListener', this.name, this.once.splice(i, 1)[0]);
            }
            
            i = this.many.indexOf(listener);
            if (i !== -1){
                this.self.emit('removeListener', this.name, this.many.splice(i, 1)[0]);
            }
        }
    }
    
    removeFn(fn){
        this.many = this.many.filter(l => {
            if (l.fn === fn){
                this.self.emit('removeListener', this.name, l);
                return false;
            }
            return true;
        });

        this.once = this.once.filter(l => {
            if (l.fn === fn){
                this.self.emit('removeListener', this.name, l);
                return false;
            }
            return true;
        });
    }
    
    removeBySelf(self){
        this.many = this.many.filter(l => {
            if (l.self === self){
                this.self.emit('removeListener', this.name, l);
                return false;
            }
            return true;
        });

        this.once = this.once.filter(l => {
            if (l.self === self){
                this.self.emit('removeListener', this.name, l);
                return false;
            }
            return true;
        });
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
    
    emit(argsArray){
        let events = this.many.slice(0);
        for (let ev of events){
            ev.run(argsArray);
        }

        events = this.once.slice(0);
        for (let ev of events){
            ev.run(argsArray);
            this.self.emit('removeListener', this.name, ev);
        }
        this.once = [];
    }

    listenerCount(){
        return this.many.length + this.once.length;
    }
    
    constructor(name, self){
        this.name = name;
        this.many = [];
        this.once = [];
        this.self = self;
    }
}

class EventListener{
    off(){
        this.group.remove(this);
        
        return this;
    }
    
    run(argsArray){
        if (this.isCalled){
            return this;
        }
        
        this.isCalled = true;
        this.fn.apply(this.self, argsArray);
        this.isCalled = false;
        
        return this;
    }
    
    call(){
        if (this.isCalled){
            return this;
        }
        
        this.isCalled = true;
        this.fn.apply(this.self, arguments);
        this.isCalled = false;
        
        return this;
    }

    constructor(group, fn, self){
        this.fn = fn;

        this.self = self;
        this.isCalled = false;
        this.group = group;
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
        if (!this.__zzEvents[name]){
            this.__zzEvents[name] = new EventsGroup(name, this);
        }
        return this.__zzEvents[name];
    }
    
    __zzAddEventListener(name, fn, self, once, prepend){
        self || (self = this);
        once || (once = false);
        prepend || (prepend = false);

        let evGroup = this.__zzCheckExistsEvent(name);

        let evListener = new EventListener(evGroup, fn, self);
        
        evGroup.add(evListener, once, prepend);

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
    off(evName, fn, self){
        !fn && (fn = self);

        if (typeof evName === 'string'){
            let evGroup = this.__zzEvents[evName];

            if (evGroup){
                if (typeof fn === 'function'){
                    evGroup.removeFn(fn);
                }else{
                    evGroup.removeBySelf(fn);
                }
            }
        }else{
            let events = this.__zzEvents;
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
    
    listenerCount(name){
        let group = this.__zzEvents[name];
        return group?(group.listenerCount()):0;
    }

    /**
     * Emit event
     *
     * @param   {string} name - key/index of the element in the list of jobs
     */
    emit(name){
        let evGroup = this.__zzEvents[name];
        if (!evGroup){
            return false;
        }
        
        evGroup.emit(Array.prototype.slice.call(arguments, 1));
        
        return true;
    }
        
    /* Event helpers */

    /**
     * Delay event run by time
     * 
     * @param {function} EventFunction
     * @param {int} [Time = 0]
     */
    static Defer(fn, time){
        var __zzAfterEmitValues = [];
        time || (time = 0);
        let timer = null;
        let timeoutfn = () => {
            fn.call(this, __zzAfterEmitValues);

            __zzAfterEmitValues = [];
        };

        return function(){
            if (__zzAfterEmitValues.length === 0){
                clearTimeout(timer);
                timer = setTimeout(timeoutfn, time);
    
                __zzAfterEmitValues.push([].slice(arguments));
            }
        };
    }

    static AvoidRunner(){
        return new EventAvoidRunner;
    }

    /**
     * Make event, that avoid selfs
     * 
     * @param {function} EventFunction
     * @param {...Event.AvoidRunner} AvoidRunners
     */
    static avoid(fn){
        let targs = [].slice.call(arguments, 1);
    
        let args
        for (let run of args){
            if (!(run instanceof EventAvoidRun)){
                console.error('Error: arguments of EventAvoid needs to be EventAvoidRun');
            }
        }

        if (args.length < 1){
            console.error('Error: Event.AvoidRunner\'s objects needs to be more than 1');
        }

        return function(){
            for (let run of args){
                if (run.r){
                    return;
                }
            }
    
            for (let run of args){
                run.r = true;
            }
    
            fn.apply(this, arguments);
    
            for (let run of args){
                run.r = false;
            }
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

class EventAvoidRunner{
    run(fn){
        if (this.r){
            return;
        }
        this.r = true;

        fn.apply(this, Array.prototype.slice.call(arguments, 1));

        this.r = false;
    }
    
    constructor(){
        this.r = false;
    }
}

class EventInStack{
    run(args){
        this.args[1].apply(this.element, args);

        return this;
    }

    off(){
        let el = this.element;

        let off = (el.off || el.removeEventListener || el.removeListener);

        off.apply(el, this.args);

        return this;
    }

    constructor(element, args){
        this.element = element;
        this.args = args;

        let on = (element.on || element.addEventListener || element.addListener);

        on.apply(element, this.args);
    }
}

class EventStack{
    off(){
        for (let el of this.events){
            el.off();
        }
        
        this.events = [];
        
        return this;
    }
    
    add(/*...*/){
        let el = arguments[0];
        
        if (el instanceof EventListener || el instanceof EventInStack){
            this.events.push(el);
            return el;
        }else{
            let ev = new EventInStack(el, [].slice.call(arguments, 1));
            this.events.push(ev);
            return ev;
        }
    }
    
    remove(el){
        let i = this.events.indexOf(el);
        if (i !== -1){
            this.events[i].off();
            this.events.splice(i, 1);
        }
    }

    constructor(){
        this.events = [];
    }
};

module.exports = {EventListener, EventsGroup, Event, EventStack};
