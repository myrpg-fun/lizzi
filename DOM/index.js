/**
 * Copyright (c) Stanislav Shishankin
 *
 * This source code is licensed under the MIT license.
 */

let {zzArray, zzReactive} = require('../index');
let {Event, EventStack} = require('../Event');
let {zzLink, zzLinkFind, ViewElements} = require('./zzLink');

class zzCollectionDOM{
    appendTo(data, viewBefore){
        let view;
        if (data instanceof ViewComponent){
            view = data;
        }else if (typeof this.fnname === 'function'){
            view = this.fnname.call(data, data);
        }else if (data && data[this.fnname]){
            view = data[this.fnname].call(data);
        }
        
        if (view instanceof ViewComponent){
            view.appendTo(this.DOM, viewBefore);
        }
        return view;
    }
    
    replace(){
        let newValues = this.array.value;
        let newViewComponent = new Map;
        let maxIndex = this.views.length;
        let viewBefore = null;
        
        for (let i = newValues.length - 1; i >= 0; i--){
            let data = newValues[i];
            
            if (!data){
                continue;
            }
            
            let view = null;
            let dataView = this.views.get(data);
            if (dataView){
                view = dataView.view;
                
                if (dataView.index < maxIndex){
                    maxIndex = dataView.index;
                }else{
                    view.appendTo(this.DOM, viewBefore);
                }

                this.views.delete(data);
            }else{
                view = this.appendTo(data, viewBefore);
            }
            
            if (view instanceof ViewComponent){
                viewBefore = view;

                newViewComponent.set(data, {
                    view: view,
                    index: i
                });
            }
        };
        
        this.views.forEach((d) => d.view.removeDOM());
        this.views.clear();
        
        this.views = newViewComponent;
    }
    
    remove(event){
        for (let data of event.removed){
            let d = this.views.get(data);
            if (d){
                d.view.removeDOM();
                this.views.delete(data);
            }else{
                console.error("Unsynced data found", data);
                return;
            }
        }
    }
    
    add(event){
        let idx = event.index;
        let viewBefore = null;
        if (idx < this.views.length){
            for (let d of this.views){
                if (d.index === idx){
                    viewBefore = d.view;
                }

                if (d.index >= idx){
                    d.index += event.added.length;
                }
            }
        }

        for (let i in event.added){
            let data = event.added[i];
            let view = this.appendTo(data, viewBefore);

            if (view instanceof ViewComponent){
                this.views.set(data, {
                    view: view,
                    index: idx + i
                });
            }
        }
    }
    
    removeDOM(){
        this.array.off(this);

        this.views.forEach(function(d){
            d.view.removeDOM();
        });
        
        this.array = null;
    }
    
    connectDOM(array){
        if (!(array instanceof zzArray)){
            console.error('Error: '+collection+' is not zzArray');
            return;
        }
        
        this.array = array;
        this.array.on('add', this.add, this);
        this.array.on('remove', this.remove, this);
        this.array.on('replace', this.replace, this);
        this.replace( array.value );
    }
    
    constructor(el, array, fnname, view){
        this.views = new Map;
        this.el = el;
        this.DOM = new Template(el);
        this.fnname = fnname;
        this.view = view;
        
        this.connectDOM(array);
    }
}

class zzCollectionAnimationDOM extends zzCollectionDOM{
    replace(newValues){        
        let newViewComponent = [];
        this.views.forEach((d, i) => d.data.__zzIndeX = i);
                
        if (newValues.length > 0){
            for (let data of newValues){
                if (!data){
                    continue;
                }
                
                let view = null;
                if ('__zzIndeX' in data){
                    view = this.views[data.__zzIndeX].view;
                    delete data.__zzIndeX;
                }else{
                    if (data instanceof ViewComponent){
                        view = data;
                    }else if (data && data[this.fnname]){
                        view = data[this.fnname].call(data);
                    }
                    
                    if (view instanceof ViewComponent){
                        //only if new
                        view.appendTo(this.DOM);
                    }
                }
                
                if (view instanceof ViewComponent){
                    newViewComponent.push({
                        data: data,
                        view: view
                    });
                }
            };
        }
        
        let removeSort = this.views;//.slice(0);
        for (let f of removeSort){
            if ('__zzIndeX' in f.data){
                delete f.data.__zzIndeX;
                f.view.removeDOM();
            }
        }            
        
        this.views = newViewComponent;
    }
};

class zzLinkCollection extends zzLinkFind{
    addEventToEL(el, view){
        this.added.push(
            new this.zzCollectionDOM(el, this.collection, this.fnname, view)
        );
    }

    clearEvents(DOMel){
        for (let i in this.added){
            this.added[i].removeDOM();
        }
        
        this.added = [];
    }

    constructor(DOMFind, zzCollectionDOM, collection, fnname){
        super(DOMFind);
        
        if (!(collection instanceof zzArray)){
            console.error('Error: linked array is not zzArray');
        }
        
        this.zzCollectionDOM = zzCollectionDOM;
        this.collection = collection;
        this.fnname = fnname;
        this.added = [];
    }
};

class zzLinkData extends zzLinkFind{
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
            const view = data[this.fnname].call(data);

            if (view instanceof ViewComponent){
                view.appendTo(el);
                
                this.added.push(
                    view
                );
            }
        }
    }
    
    addEventToEL(el){
        const value = this.var;
        
        if (value instanceof zzReactive){
            const data = value.value;
            this.addDOM(data, el);

            let inside = false;
            value.change(async function(){
                if (!inside){
                    inside = true;
                    await this.removeDOM();

                    this.addDOM(value.value, el);
                    inside = false;
                }
            }, this);
        }else{
            this.addDOM(value, el);
        }
    }

    clearEvents(DOMel){
        if (this.var instanceof zzReactive){
            this.var.off(this);
        }
        this.removeDOM();
    }

    constructor(DOMFind, value, fnname){
        super(DOMFind);
        
        this.var = value;
        this.fnname = fnname;
        this.added = [];
    }
}

class zzLinkViewComponent extends zzLinkFind{
    async removeDOM(view){
        if (view instanceof ViewComponent){
            await view.removeDOM();
        }
    }
    
    addDOM(view, el){
        if (view instanceof ViewComponent){
            view.appendTo(el);
        }
    }
    
    addEventToEL(el){
        const view = this.view;
        
        if (view instanceof zzReactive){
            this.addDOM(view.value, el);

            let inside = false;
            view.change(async function(ev){
                if (!inside){
                    inside = true;
                    if (ev.last instanceof ViewComponent){
                        await this.removeDOM(ev.last);
                    }

                    this.addDOM(view.value, el);
                    inside = false;
                }
            }, this);
        }else if(view instanceof ViewComponent){
            this.addDOM(view, el);
        }
    }

    clearEvents(){
        const view = this.view;
        
        if (view instanceof zzReactive){
            this.removeDOM(view.value);
            view.off(this);
        }else if(view instanceof ViewComponent){
            this.removeDOM(view);
        }
    }

    constructor(DOMFind, view){
        super(DOMFind);
        
        if (!(view instanceof ViewComponent || view instanceof zzReactive)){
            console.error('Error: linked view is not ViewComponent or not zzReactive');
        }
        
        this.view = view;
    }
}

class zzInitialize extends zzLink{
    addEvents(view){
        if (this.initFn){
            view.afterAppend(this.initFn);
        }
    }

    async clearEvents(view){
        if (this.destroyFn){
            await this.destroyFn(view);
        }
    }

    constructor(initFn, destroyFn){
        super();
        
        this.initFn = initFn;
        this.destroyFn = destroyFn;
    }
}

class zzLinkOn extends zzLink{
    addEvents(view){
        if (this.self){
            let ev = view.addEv(this.self, this.eventName, this.listenerFn);

            if (this.isRun){
                ev.run(this.isRun);
            }
        }
    }

    linkToView(view){
        if (typeof this.self === 'string'){
            this.self = view.find(this.self)[0];
        }
    }

    constructor(self, eventName, listenerFn, isRun){
        super();
        
        this.initEv = null;
        this.self = self;
        this.listenerFn = listenerFn;
        this.eventName = eventName;
        this.isRun = isRun;
    }
}

class Template{
    children(){
        let result = [];
        for (let i in this.__zzElements){
            if (this.__zzElements[i].content){
                result = result.concat(Array.prototype.slice.call(this.__zzElements[i].content.childNodes));
            }else if (this.__zzElements[i].childNodes){
                result = result.concat(Array.prototype.slice.call(this.__zzElements[i].childNodes));
            }
        }
        
        return new Template(result);
    }
    
    html(){
        return this.__zzElements.map(el => el.innerHTML).join('');
    }
    
    parse(){
        return new Template(this.html());
    }
    
    find(selector){
        let result = [];
        for (let i in this.__zzElements){
            let el = this.__zzElements[i];
            if (el instanceof Element){
                result = result
                    .concat(Array.prototype.slice.call(el.querySelectorAll(selector)))
                    .concat(el.matches(selector)?[el]:[]);
            }
        }
        
        if (result.length === 0){
            console.error('Template can not find:', selector);
        }
        
        return new Template(result);
    }

    __zzConvert(template){
        if (template instanceof Template){
            return template.__zzElements;
        }
        
        if (typeof template === 'string'){
            if (template.indexOf('<') !== -1){
                try {
                    /*template = (new DOMParser).parseFromString(template, 'text/html');
                    return []
                        .concat(Array.prototype.slice.call(template.head.childNodes))
                        .concat(Array.prototype.slice.call(template.body.childNodes));*/
                    var tmp = document.implementation.createHTMLDocument();
                    tmp.body.innerHTML = template;
                    return tmp.body.children;
                }catch(err){
                    console.error(err);
                    return [];
                }
            }else{
                template = document.querySelectorAll(template);
            }
        }
        
        if (template instanceof NodeList){
            return Array.prototype.slice.call(template);
        }
        
        if (template === undefined){
            template = document.documentElement;
        }
        
        if (template instanceof Document){
            template = template.documentElement;
        }
        
        if (template instanceof Node){
            return [template];
        }
        
        return [];
    }
    
    append(DOMElement){
        let appendTo = this.__zzElements.find(el => el instanceof Node && !(el instanceof Text));
        if (appendTo){
            //append to first DOM element
            DOMElement = this.__zzConvert(DOMElement);

            for (let i in DOMElement){
                if (!(DOMElement[i] instanceof Document)){
                    appendTo.appendChild(DOMElement[i]);
                }
            }
        }
        return this;
    }
    
    appendBefore(DOMElement, BeforeElement){
        let appendTo = this.__zzElements.find(el => el instanceof Node && !(el instanceof Text));
        if (appendTo){
            //append to first DOM element
            DOMElement = this.__zzConvert(DOMElement);

            for (let i in DOMElement){
                if (!(DOMElement[i] instanceof Document)){
                    if (BeforeElement instanceof Template){
                        BeforeElement = BeforeElement[0];
                    }
                    
                    appendTo.insertBefore(DOMElement[i], BeforeElement?BeforeElement:null);
                }
            }
        }
        return this;
    }
    
    getBoundingClientRect(){
        let rect = {
            left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity
        };
        
        for (let el of this.__zzElements){
            if (el.getBoundingClientRect){
                let box = el.getBoundingClientRect();
                rect.left = Math.min(box.left, rect.left);
                rect.top = Math.min(box.top, rect.top);
                rect.right = Math.max(box.right, rect.right);
                rect.bottom = Math.max(box.bottom, rect.bottom);
            }
        }
        
        rect.height = rect.bottom - rect.top;
        rect.width = rect.right - rect.left;
        
        return rect;
    }
    
    remove(){
        for (let el of this.__zzElements){
            if (el.parentNode){
                el.parentNode.removeChild( el );
            }
        }
        return this;
    }
    
    clone(){
        return new Template( this.__zzElements.map( el => el.cloneNode(true) ) );
    }
    
    *[Symbol.iterator] () {
        for (let el of this.__zzElements){
            yield el;
        }
    }

    toArray(){
        return this.__zzElements;
    }
    
    createView(selector, data){
        return new ViewComponent( (selector === null)? this : this.find(selector), data);
    }
    
    constructor(template){
        !Array.isArray(template) && (template = [template]);
        
        Object.defineProperty(this, 'length', {
            get: () => this.__zzElements.length
        });

        Object.defineProperty(this, 'elements', {
            get: () => this.__zzElements
        });
        
        this.__zzElements = [];
        let index = 0;
        for (let t of template){
            let elements = this.__zzConvert( t );
            for (let el of elements){
                this[index++] = el;
                this.__zzElements.push(el);
            }
        }
    }
}

class ViewComponent extends Event{
    async removeDOM(){
        if (this.__zzRemoveDOM){
            this.__zzRemoveDOM = false;
            await this.clearEvents();

            this.DOM.remove();
            this.__zzRemoveDOM = true;

            this.emit('after-dom-removed');
        }
        return this;
    }

    __zzAppend(DOMElement, BeforeElement){
        if (this.__zzClearEvents === null){
            this.once('after-dom-removed', this.__zzAppend.bind(this, DOMElement, BeforeElement), this);            
        }else{ 
            DOMElement.appendBefore( this.DOM, BeforeElement );
            if (this.__zzClearEvents === false){
                this.addEvents();
            }
            this.emit('after-append', this);
        }
    }

    afterAppend(fn){
        this.once('after-append', fn);
    }

    appendTo(DOMElement, BeforeElement){
        if (!(DOMElement instanceof Template)){
            DOMElement = new Template(DOMElement);
        }
        
        if (DOMElement.length > 0){
            if (BeforeElement instanceof ViewComponent){
                BeforeElement = BeforeElement.DOM;
            }
            
            this.__zzAppend(DOMElement, BeforeElement);
        }
    }
    
    getBoundingClientRect(){
        return this.DOM.getBoundingClientRect();
    }
    
    array(DOMFind, collection, fnname, animation){
        if (animation === true){
            return this.link( new zzLinkCollection(DOMFind, zzCollectionAnimationDOM, collection, fnname) );
        }else if (!animation){
            return this.link( new zzLinkCollection(DOMFind, zzCollectionDOM, collection, fnname) );
        }else{
            return this.link( new zzLinkCollection(DOMFind, animation, collection, fnname) );
        }
    }
    
    view(DOMFind, component){
        return this.link( new zzLinkViewComponent(DOMFind, component) );
    }    
    
    data(DOMFind, data, fnname){
        return this.link( new zzLinkData(DOMFind, data, fnname) );
    }
    
    init(initFn, destroyFn){
        return this.link( new zzInitialize(initFn, destroyFn) );
    }
    
    event(self, eventName, listenerFn, isRun){
        return this.link( new zzLinkOn(self, eventName, listenerFn, isRun) );
    }
    
    router(route, fn){
        return this.link( new zzLinkRouter(route, fn) );
    }

    /* main class*/
    link(zzLinkEvent){
        if (zzLinkEvent instanceof zzLink){
            this.__events.push(zzLinkEvent);
        }
        
        zzLinkEvent.linkToView(this);

        return this;
    }
    
    addEvents(){
        this.emit('add-events', this);
        for (let eventFn of this.__events){
            eventFn.addEvents(this);
        }
        
        this.__zzClearEvents = true;
        this.emit('after-add-events', this);
        
        return this;
    }
    
    async clearEvents(){
        if (this.__zzClearEvents === true){
            this.__zzClearEvents = null;
            
//            this.emit('clear-events', this);
            this.__eventStack.off();
            for (let eventFn of this.__events){
                await eventFn.clearEvents(this);
            }
            
            this.__zzClearEvents = false;
//            this.emit('after-clear-events', this);
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
        if (file){
            for (let i in file){
                if (typeof file[i] === 'function'){
                    ViewComponent.prototype[i] = file[i];
                }
            }
        }
    }
    
    __initDOM(T){
        this.DOM = new Template(T).children().clone();
        this.T = T;
    }
    
    /**
     * shortcut Add Event to View EventStack
     */
    addEv(){
        return this.__eventStack.add.apply(this.__eventStack, arguments);
    }

    /* Create Html DOM ViewComponent */
    constructor(T){
        super();
        
        this.__zzRemoveDOM = true;
        this.__zzClearEvents = false;
        
        this.__events = [];
        this.__eventStack = new EventStack;

        this.__initDOM(T);
    }
}

ViewComponent.addon( require('./default').__zzViewAddon );

function Loader(html){
    return new Template(html);
}

module.exports = {ViewComponent, ViewElements, Loader, zzLink, zzLinkFind, zzCollectionDOM, zzLinkCollection};