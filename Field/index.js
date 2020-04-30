/*
 * Docs https://github.com/myrpg-fun/lizzi
 */

let {zzDataRef, Collection} = require('../index');
let {Event, EventListener} = require('../event');
let {zzTemplate} = require('./Template');
let {zzLink, zzLinkFind} = require('./zzLink');
//const EventEmitter = require('events');

class zzCollectionFieldDOM{
    replace(newValues){        
        let newFields = [];
        this.fields.forEach((d, i) => d.data.__zzIndeX = i);
                
        if (newValues.length > 0){
            for (let data of newValues){
                if (!data){
                    continue;
                }
                
                let field = null;
                if ('__zzIndeX' in data){
                    field = this.fields[data.__zzIndeX].field;
                    delete data.__zzIndeX;
                }else{
                    if (data[this.fnname]){
                        field = data[this.fnname].call(data);
                    }
                }
                
                if (field instanceof Field){
                    field.appendTo(this.DOM);

                    newFields.push({
                        data: data,
                        field: field
                    });
                }
            };
        }
        
        let removeSort = this.fields.slice(0);
        for (let f of removeSort){
            if ('__zzIndeX' in f.data){
                delete f.data.__zzIndeX;
                f.field.removeDOM();
            }
        }            
        
        this.fields = newFields;
    }
    
    remove(element, index){
        if (this.fields[index]){
            if (this.fields[index].data !== element){
                console.error("Unsynced data found");
                return;
            }
            
            this.fields.splice(index, 1)[0].field.removeDOM();
        }
    }
    
    add(data){
        if (data[this.fnname]){
            let field = data[this.fnname].call(data);
            if (field){
                this.DOM.append( field.DOM );

                this.fields.push({
                    data: data,
                    field: field
                });
            }
        }
    }
    
    removeDOM(){
        this.collection.off(this);

        this.fields.forEach(function(field){
            field.field.removeDOM();
        });       
        
        //this.DOM.remove();
        this.collection = null;
    }
    
    connectDOM(collection){
        if (!(collection instanceof Collection)){
            console.error('Error: '+collection+' is not Collection');
            return;
        }
        
        this.collection = collection;
        this.collection.on('add', this.add, this);
        this.collection.on('remove', this.remove, this);
        this.collection.on('replace-values', this.replace, this);
        this.replace( collection.elements, this );
    }
    
    constructor(zzTemplate, collection, fnname){
        this.fields = [];
        this.DOM = zzTemplate;
        this.fnname = fnname;
        
        this.connectDOM(collection);
    }
}

class zzLinkCollection extends zzLinkFind{
    addEventToEL(el){
        this.added.push(
            new zzCollectionFieldDOM(new zzTemplate(el), this.collection, this.fnname)
        );
    }

    clearEvents(DOMel){
        for (let i in this.added){
            this.added[i].removeDOM();
        }
        
        this.added = [];
    }

    constructor(DOMFind, collection, fnname){
        super(DOMFind);
        
        if (!(collection instanceof Collection)){
            console.error('Error: linked collection is not Collection');
        }
        
        this.collection = collection;
        this.fnname = fnname;
        this.added = [];
    }
}

class zzCollectionAnimationFieldDOM extends zzCollectionFieldDOM{
    replace(newValues){        
        let newFields = [];
        this.fields.forEach((d, i) => d.data.__zzIndeX = i);
                
        if (newValues.length > 0){
            for (let data of newValues){
                if (!data){
                    continue;
                }
                
                let field = null;
                if ('__zzIndeX' in data){
                    field = this.fields[data.__zzIndeX].field;
                    delete data.__zzIndeX;
                }else{
                    if (data[this.fnname]){
                        field = data[this.fnname].call(data);
                        
                        if (field instanceof Field){
                            //only if new
                            field.appendTo(this.DOM);
                        }
                    }
                }
                
                if (field instanceof Field){
                    newFields.push({
                        data: data,
                        field: field
                    });
                }
            };
        }
        
        let removeSort = this.fields;//.slice(0);
        for (let f of removeSort){
            if ('__zzIndeX' in f.data){
                delete f.data.__zzIndeX;
                f.field.removeDOM();
            }
        }            
        
        this.fields = newFields;
    }
}

class zzLinkCollectionAnimation extends zzLinkCollection{
    addEventToEL(el){
        this.added.push(
            new zzCollectionAnimationFieldDOM(new zzTemplate(el), this.collection, this.fnname)
        );
    }
}

class zzLinkDataField extends zzLinkFind{
    async removeDOM(){
        if (this.added.length > 0){
            let l;
            for (let i in this.added){
                l = this.added[i].removeDOM();
            }
            await l;
        }
        
        this.added = [];
    }
    
    addDOM(data, el){
        if (data && data[this.fnname]){
            const field = data[this.fnname].call(data);

            if (field instanceof Field){
                field.appendTo(el);
                
                this.added.push(
                    field
                );
            }
        }
    }
    
    addEventToEL(el){
        const DataRef = this.modelRel;
        
        if (DataRef instanceof zzDataRef){
            const data = DataRef.value;
            this.addDOM(data, el);

            let inside = false;
            DataRef.onSet(async function(){
                if (!inside){
                    inside = true;
                    await this.removeDOM();

                    this.addDOM(DataRef.value, el);
                    inside = false;
                }
            }, this);
        }else{
            this.addDOM(DataRef, el);
        }
    }

    clearEvents(DOMel){
        this.modelRel.off(this);
    }

    constructor(DOMFind, modelRel, fnname){
        super(DOMFind);
        
        this.modelRel = modelRel;
        this.fnname = fnname;
        this.added = [];
    }
}

class zzLinkField extends zzLinkFind{
    async removeDOM(field){
        if (field instanceof Field){
            await field.removeDOM();
        }
    }
    
    addDOM(field, el){
        if (field instanceof Field){
            field.appendTo(el);
        }
    }
    
    addEventToEL(el){
        const field = this.field;
        
        if (field instanceof zzDataRef){
            this.addDOM(field.value, el);

            let inside = false;
            field.onSet(async function(ev){
                if (!inside){
                    inside = true;
                    if (ev.last instanceof Field){
                        await this.removeDOM(ev.last);
                    }

                    this.addDOM(field.value, el);
                    inside = false;
                }
            }, this);
        }else if(field instanceof Field){
            this.addDOM(field, el);
        }
    }

    clearEvents(){
        const field = this.field;
        
        if (field instanceof zzDataRef){
            this.removeDOM(field.value);
            field.off(this);
        }else if(field instanceof Field){
            this.removeDOM(field);
        }
    }

    constructor(DOMFind, field){
        super(DOMFind);
        
        if (!(field instanceof Field || field instanceof zzDataRef)){
            console.error('Error: linked field is not Field or not zzDataRef');
        }
        
        this.field = field;
    }
}

class zzInitialize extends zzLink{
    addEvents(DOMfield){
        if (this.initFn){
            this.initFn(DOMfield);
        }
    }

    async clearEvents(DOMfield){
        if (this.destroyFn){
            await this.destroyFn(DOMfield);
        }
    }

    constructor(initFn, destroyFn){
        super();
        
        this.initFn = initFn;
        this.destroyFn = destroyFn;
    }
}

class zzLinkOn extends zzLink{
    addEvents(DOMfield){
        this.initEv = this.self.on(this.eventName, this.listenerFn, DOMfield);
        if (this.isRun){
            if (this.initEv instanceof EventListener){
                this.initEv.run(this.isRun);
            }else{
                this.listenerFn.apply(DOMfield, this.isRun);
            }
        }
    }

    clearEvents(DOMfield){
        if (this.initEv){
            if (this.initEv instanceof EventListener){
                this.initEv.off();
            }else{//Event Emitter ?
                this.initEv.off(this.eventName, this.listenerFn);
            }
        }
    }

    constructor(self, eventName, listenerFn, isRun){
        super();
        
        this.initEv = null;
        this.listenerFn = listenerFn;
        this.eventName = eventName;
        this.self = self;
        this.isRun = isRun;
    }
}

class zzLinkTimer extends zzLink{
    addEvents(DOMfield){
        if (this.initFn){
            this.initFn(DOMfield);
        }
    }

    constructor(initFn, timer){
        super();
        
        this.initFn = initFn;
        this.timer = timer;
    }
}

class Field extends Event{
    async removeDOM(){
        if (this.__zzRemoveDOM){
            this.__zzRemoveDOM = false;
            await this.clearEvents();

            this.DOM.remove();
            this.__zzRemoveDOM = true;
        }
        return this;
    }
    
    appendTo(DOMElement){
        if (!(DOMElement instanceof zzTemplate)){
            DOMElement = new zzTemplate(DOMElement);
        }
        
        if (DOMElement.length > 0){
            this.addEvents();

            DOMElement.append( this.DOM );
        }
    }
    
    collection(DOMFind, collection, fnname, animation){
        if (animation === true){
            return this.link( new zzLinkCollectionAnimation(DOMFind, collection, fnname) );
        }
        
        return this.link( new zzLinkCollection(DOMFind, collection, fnname) );
    }
    
    field(DOMFind, field){
        return this.link( new zzLinkField(DOMFind, field) );
    }    
    
    fieldData(DOMFind, data, fnname){
        return this.link( new zzLinkDataField(DOMFind, data, fnname) );
    }
    
    init(initFn, destroyFn){
        return this.link( new zzInitialize(initFn, destroyFn) );
    }
    
    on(self, eventName, listenerFn, isRun){
        return this.link( new zzLinkOn(self, eventName, listenerFn, isRun) );
    }
    
    timer(fn, time){
        return this.link( new zzLinkTimer(fn, time) );
    }
    
    /* main class*/
    link(zzLinkEvent){
        if (zzLinkEvent instanceof zzLink){
            this.events.push(zzLinkEvent);
        }
        return this;
    }
    
    addEvents(){
        if (this.__zzClearEvents === false){
            for (let eventFn of this.events){
                eventFn.addEvents(this);
            }
            
            this.__zzClearEvents = true;
        }else if (this.__zzClearEvents === null){
            this.once('after-clear-events', this.addEvents, this);            
        }
        
        return this;
    }
    
    async clearEvents(){
        if (this.__zzClearEvents === true){
            this.__zzClearEvents = null;
            
            for (let eventFn of this.events){
                await eventFn.clearEvents(this);
            }
            
            this.__zzClearEvents = false;
            this.emit('after-clear-events');
        }
        
        return this;
    }
    
    find(selector){
        var DOMel = (selector !== null)?
            this.DOM.find( selector ):
            this.DOM;
    
        if (DOMel.length === 0){
            console.error('Wrong selector', selector);
        }
        
        return DOMel;
    }

    static addon(file){
        if (file && file.__zzFieldAddon){
            file = file.__zzFieldAddon;

            for (let i in file){
                if (typeof file[i] === 'function'){
                    Field.prototype[i] = file[i];
                }
            }
        }
    }
    
    __initDOM(T){
        this.DOM = new zzTemplate(T).childs().clone();
    }
    
    /* Create DOM Field */
    constructor(T, Data){
        super();
        
        this.__zzRemoveDOM = true;
        this.__zzClearEvents = false;
        this.Data = Data;
        
        this.events = [];

        this.__initDOM(T);
    }
}

Field.addon(require('./default'));

module.exports = Field;