/*
 * Docs https://github.com/myrpg-fun/lizzi
 */

let {zzReference} = require('../zzReference');
let {Collection, LazyCollection} = require('../index');
let {Event} = require('../Event');
let {zzLink, zzLinkFind} = require('./zzLink');

class zzCollectionDOM{
    replace(newValues){
        let newViewComponent = [];
        this.nodes.forEach((d, i) => d.data.__zzIndeX = i);
        
        if (newValues.length > 0){
            let maxIndex = this.nodes.length;
            let nodeBefore = null;
            
            let aValues;
            
            if (Array.isArray(newValues)){
                aValues = newValues;
            }else if (newValues instanceof LazyCollection || newValues instanceof Collection){
                aValues = newValues.toArray();
            }else{
                aValues = [];
            }
            
            for (let i = aValues.length - 1; i >= 0; i--){
                let data = aValues[i];
                
                if (!data){
                    continue;
                }
                
                let node = null;
                if ('__zzIndeX' in data){
                    let index = data.__zzIndeX;
                    node = this.nodes[index].node;
                    
                    if (index < maxIndex){
                        maxIndex = index;
                    }else{
                        node.appendTo(this.DOM, nodeBefore);
                    }
                        
                    delete data.__zzIndeX;
                }else{
                    if (data instanceof ViewComponent){
                        node = data;
                    }else if (data && data[this.fnname]){
                        node = data[this.fnname].call(data);
                    }
                    
                    if (node instanceof ViewComponent){
                        node.appendTo(this.DOM, nodeBefore);
                    }
                }
                
                if (node instanceof ViewComponent){
                    nodeBefore = node;
//                    node.appendTo(this.DOM);

                    newViewComponent.unshift({
                        data: data,
                        node: node
                    });
                }
            };
        }
        
        let removeSort = this.nodes.slice(0);
        for (let f of removeSort){
            if ('__zzIndeX' in f.data){
                delete f.data.__zzIndeX;
                f.node.removeDOM();
            }
        }            
        
        this.nodes = newViewComponent;
    }
    
    remove(element, index){
        if (this.nodes[index]){
            if (this.nodes[index].data !== element){
                console.error("Unsynced data found");
                return;
            }
            
            this.nodes.splice(index, 1)[0].node.removeDOM();
        }
    }
    
    add(data, idx){
        if (data[this.fnname]){
            let node = data[this.fnname].call(data);
            if (node){
                node.appendTo(this.DOM, this.nodes[idx]?this.nodes[idx].node:null);

                this.nodes.splice(idx, 0, {
                    data: data,
                    node: node
                });
            }
        }
    }
    
    removeDOM(){
        this.collection.off(this);

        this.nodes.forEach(function(node){
            node.node.removeDOM();
        });       
        
        //this.DOM.remove();
        this.collection = null;
    }
    
    connectDOM(collection){
        if (!(collection instanceof Collection) && !(collection instanceof LazyCollection)){
            console.error('Error: '+collection+' is not Collection');
            return;
        }
        
        this.collection = collection;
        this.collection.on('add', this.add, this);
        this.collection.on('remove', this.remove, this);
        this.collection.on('replace-values', this.replace, this);
        this.replace( collection.elements, this );
    }
    
    constructor(Template, collection, fnname){
        this.nodes = [];
        this.DOM = Template;
        this.fnname = fnname;
        
        this.connectDOM(collection);
    }
}

class zzLinkCollection extends zzLinkFind{
    addEventToEL(el){
        this.added.push(
            new zzCollectionDOM(new Template(el), this.collection, this.fnname)
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
        
        if (!(collection instanceof Collection) && !(collection instanceof LazyCollection)){
            console.error('Error: linked collection is not Collection');
        }
        
        this.collection = collection;
        this.fnname = fnname;
        this.added = [];
    }
}

class zzCollectionAnimationDOM extends zzCollectionDOM{
    replace(newValues){        
        let newViewComponent = [];
        this.nodes.forEach((d, i) => d.data.__zzIndeX = i);
                
        if (newValues.length > 0){
            for (let data of newValues){
                if (!data){
                    continue;
                }
                
                let node = null;
                if ('__zzIndeX' in data){
                    node = this.nodes[data.__zzIndeX].node;
                    delete data.__zzIndeX;
                }else{
                    if (data instanceof ViewComponent){
                        node = data;
                    }else if (data && data[this.fnname]){
                        node = data[this.fnname].call(data);
                    }
                    
                    if (node instanceof ViewComponent){
                        //only if new
                        node.appendTo(this.DOM);
                    }
                }
                
                if (node instanceof ViewComponent){
                    newViewComponent.push({
                        data: data,
                        node: node
                    });
                }
            };
        }
        
        let removeSort = this.nodes;//.slice(0);
        for (let f of removeSort){
            if ('__zzIndeX' in f.data){
                delete f.data.__zzIndeX;
                f.node.removeDOM();
            }
        }            
        
        this.nodes = newViewComponent;
    }
}

class zzLinkCollectionAnimation extends zzLinkCollection{
    addEventToEL(el){
        this.added.push(
            new zzCollectionAnimationDOM(new Template(el), this.collection, this.fnname)
        );
    }
}

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
            const node = data[this.fnname].call(data);

            if (node instanceof ViewComponent){
                node.appendTo(el);
                
                this.added.push(
                    node
                );
            }
        }
    }
    
    addEventToEL(el){
        const DataRef = this.modelRel;
        
        if (DataRef instanceof zzReference){
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
        if (this.modelRel){
            this.modelRel.off(this);
        }
    }

    constructor(DOMFind, modelRel, fnname){
        super(DOMFind);
        
        this.modelRel = modelRel;
        this.fnname = fnname;
        this.added = [];
    }
}

class zzLinkViewComponent extends zzLinkFind{
    async removeDOM(node){
        if (node instanceof ViewComponent){
            await node.removeDOM();
        }
    }
    
    addDOM(node, el){
        if (node instanceof ViewComponent){
            node.appendTo(el);
        }
    }
    
    addEventToEL(el){
        const node = this.node;
        
        if (node instanceof zzReference){
            this.addDOM(node.value, el);

            let inside = false;
            node.onSet(async function(ev){
                if (!inside){
                    inside = true;
                    if (ev.last instanceof ViewComponent){
                        await this.removeDOM(ev.last);
                    }

                    this.addDOM(node.value, el);
                    inside = false;
                }
            }, this);
        }else if(node instanceof ViewComponent){
            this.addDOM(node, el);
        }
    }

    clearEvents(){
        const node = this.node;
        
        if (node instanceof zzReference){
            this.removeDOM(node.value);
            node.off(this);
        }else if(node instanceof ViewComponent){
            this.removeDOM(node);
        }
    }

    constructor(DOMFind, node){
        super(DOMFind);
        
        if (!(node instanceof ViewComponent || node instanceof zzReference)){
            console.error('Error: linked node is not ViewComponent or not zzReference');
        }
        
        this.node = node;
    }
}

class zzInitialize extends zzLink{
    addEvents(DOMnode){
        if (this.initFn){
            this.initFn(DOMnode);
        }
    }

    async clearEvents(DOMnode){
        if (this.destroyFn){
            await this.destroyFn(DOMnode);
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
        if (typeof this.self === 'string'){
            this.self = view.find(this.self).elements[0];
        }
        
        let fn = this.self.on || this.self.addEventListener || this.self.addListener;
        
        this.initEv = fn(this.eventName, this.listenerFn.bind(view));
        if (this.isRun){
            this.listenerFn.apply(view, this.isRun);
        }
    }

    clearEvents(view){
        if (this.initEv){
            let fn = this.initEv.off || this.initEv.removeEventListener || this.initEv.removeListener;
            fn(this.eventName, this.listenerFn);
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
                    template = (new DOMParser).parseFromString(template, 'text/html');
                    return []
                        .concat(Array.prototype.slice.call(template.head.childNodes))
                        .concat(Array.prototype.slice.call(template.body.childNodes));
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
        }
        return this;
    }
    
    appendTo(DOMElement, BeforeElement){
        if (!(DOMElement instanceof Template)){
            DOMElement = new Template(DOMElement);
        }
        
        if (DOMElement.length > 0){
            if (BeforeElement instanceof ViewComponent){
                BeforeElement = BeforeElement.DOM;
            }
            
            this.addEvents();

            DOMElement.appendBefore( this.DOM, BeforeElement );
        }
    }
    
    collection(DOMFind, collection, fnname, animation){
        if (animation === true){
            return this.link( new zzLinkCollectionAnimation(DOMFind, collection, fnname) );
        }
        
        return this.link( new zzLinkCollection(DOMFind, collection, fnname) );
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
    
    on(self, eventName, listenerFn, isRun){
        return this.link( new zzLinkOn(self, eventName, listenerFn, isRun) );
    }
    
    /* main class*/
    link(zzLinkEvent){
        if (zzLinkEvent instanceof zzLink){
            this.events.push(zzLinkEvent);
            zzLinkEvent.linkToView(this);
        }
        return this;
    }
    
    addEvents(){
        if (this.__zzClearEvents === false){
            this.emit('add-events', this);
            for (let eventFn of this.events){
                eventFn.addEvents(this);
            }
            
            this.__zzClearEvents = true;
            this.emit('after-add-events', this);
        }else if (this.__zzClearEvents === null){
            this.once('after-clear-events', this.addEvents, this);            
        }
        
        return this;
    }
    
    async clearEvents(){
        if (this.__zzClearEvents === true){
            this.__zzClearEvents = null;
            
            this.emit('clear-events', this);
            for (let eventFn of this.events){
                await eventFn.clearEvents(this);
            }
            
            this.__zzClearEvents = false;
            this.emit('after-clear-events', this);
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
        
    }
    
    /* Create Html DOM ViewComponent */
    constructor(T, Data){
        super();
        
        this.__zzRemoveDOM = true;
        this.__zzClearEvents = false;
        this.Data = Data;
        
        this.events = [];

        this.__initDOM(T);
    }
}

ViewComponent.addon( require('./default').__zzViewAddon );

function Loader(html){
    return new Template(html);
}

module.exports = {ViewComponent, Loader, zzLink, zzLinkFind};