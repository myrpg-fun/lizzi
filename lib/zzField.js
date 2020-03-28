let {Collection} = require('./reactive');
let {Event} = require('./event');
let {zzLinkAdd} = require('./zzLink');

class zzCollectionFieldDOM{
    replace(ev){
        let newSort = ev.values;
        
        let newFields = [];
        this.fields.forEach((d, i) => d.data.__zzIndeX = i);
                
        if (newSort.length > 0){
            this.collection.resultIsEmpty(false);

            for (let data of newSort){
                if (!data){
                    continue;
                }
                
                let fieldDOM = null;
                if (data.__zzIndeX !== undefined){
                    fieldDOM = this.fields[data.__zzIndeX].field;
                    delete data.__zzIndeX;
                }else{
                    if (data[this.fnname]){
                        fieldDOM = data[this.fnname].call(data);
                    }
                }
                
                if (fieldDOM){
                    this.DOM.append( fieldDOM.childs() );

                    newFields.push({
                        data: data,
                        field: fieldDOM
                    });
                }
            };
        }else{
            this.collection.resultIsEmpty(true);
        }
        
        let removeSort = this.fields.slice(0);
        for (let f of removeSort){
            if (f.data.__zzIndeX !== undefined){
                delete f.data.__zzIndeX;
                f.field.removeDOM();
            }
        }            
        
        this.fields = newFields;
    }
    
    remove(event){
        if (this.fields[event.index]){
            if (this.fields[event.index].data !== event.element){
                console.error("Unsynced data found");
                return;
            }
            
            this.fields.splice(event.index, 1)[0].field.removeDOM();
        }
    }
    
    add(event){
        let fieldDOM = null;
        let data = event.element;
        if (data[this.fnname]){
            fieldDOM = data[this.fnname].call(data);
            if (fieldDOM){
                this.DOM.append( fieldDOM.childs() );

                this.fields.push({
                    data: data,
                    field: fieldDOM
                });
            }
        }
    }
    
    removeDOM(){
        this.collection.off(this);

        this._collectionDOM.forEach(function(fieldDOM){
            if (fieldDOM){
                fieldDOM.removeDOM();
            }
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
        this.replace( {values: collection.elements, target: this} );
    }
    
    constructor(zzTemplate, collection, fnname){
        this.fields = [];
        this.DOM = zzTemplate;
        this.fnname = fnname;
        
        this.connectDOM(collection);
    }
}

class zzFieldDOM{
    removeDOM(){
        this.zzField.clearEvents(this);
        
        this.DOM.remove();
        return this;
    }
    
    childs(){
        return this.DOM.childs();
    }
    
    constructor(zzTemplate, zzField){
        this.zzField = zzField;
        this.DOM = zzTemplate.clone();
    }
}

class zzLinkCollection extends zzLinkAdd{
    __zzAddEventToEL(el){
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

class zzLinkField extends zzLinkAdd{
    __zzAddEventToEL(el){
        this.added.push(
            this.field.createFieldDOM().appendTo(el)
        );
    }

    clearEvents(DOMel){
        for (let i in this.added){
            this.added[i].removeDOM();
        }
        
        this.added = [];
    }

    constructor(DOMFind, field){
        super(DOMFind);
        
        if (!(field instanceof zzField)){
            console.error('Error: linked field is not zzField');
        }
        
        this.field = field;
        this.added = [];
    }
}

class zzField extends Event{
    collection(DOMFind, collection, fnname){
        return this.link( new zzLinkCollection(DOMFind, collection, fnname) );
    }
    
    field(DOMFind, field){
        return this.link( new zzLinkField(DOMFind, field) );
    }    
    
    data(DOMFind, data, fnname){
        return this.link( new zzLinkDataField(DOMFind, data, fnname) );
    }    
    
    /* main class*/
    link(zzLinkEvent){
        if (zzLinkEvent instanceof zzLink){
            this.events.push(zzLinkEvent);
        }
        return this;
    }
    
    addEvents(fieldDOM){
        this.events.forEach(function(eventFn){
            eventFn.addEvents(fieldDOM, this);
        }, this);
        return this;
    }
   
    clearEvents(fieldDOM){
        this.events.forEach(function(eventFn){
            eventFn.clearEvents(fieldDOM, this);
        }, this);
        return this;
    }
    
    /* Create DOM Field */
    createFieldDOM(){
        var fieldDOM = new zzFieldDOM(this.zzTemplate, this);
        this.addEvents(fieldDOM);

        return fieldDOM;
    }
    
    appendTo(DOMElement){
        if (!(DOMElement instanceof zzTemplate)){
            if (typeof DOMElement === 'string'){
                DOMElement = new zzTemplate(document).find(DOMElement);
            }else{
                DOMElement = new zzTemplate(DOMElement);
            }
        }
        
        DOMElement.append(this.createFieldDOM().childs());
        return this;
    }
    
    constructor(zzTemplate, zzData){
        super();
        
        this.zzTemplate = zzTemplate;
        this.zzData = zzData;
        
        this.events = [];
    }
}

function addon(file){
    if (typeof file === 'string'){
        file = require(file);
    }
    
    if (file && file.__zzFieldAddon){
        file = file.__zzFieldAddon;
        
        for (let i in file){
            if (typeof file[i] === 'function'){
                zzField.prototype[i] = file[i];
            }
        }
    }
}

class zzTemplate{
    childs(){
        let result = [];
        for (let i in this.__zzElements){
            result = result.concat(Array.from(this.__zzElements[i].childNodes));
        }
        
        return new zzTemplate(result);
    }
    
    html(){
        return this.__zzElements.map(el => el.innerHTML).join('');
    }
    
    parse(){
        return new zzTemplate(this.html());
    }
    
    find(selector){
        let result = [];
        for (let i in this.__zzElements){
            result = result.concat(Array.from(this.__zzElements[i].querySelectorAll(selector)));
        }
        
        return new zzTemplate(result);
    }

    __zzConvert(template){
        if (template instanceof zzTemplate){
            return template.__zzElements;
        }
        
        if (typeof template === 'string'){
            if (template.indexOf('<') !== -1){
                try {
                    template = (new DOMParser).parseFromString(template, 'text/html');
                    return []
                        .concat(Array.from(template.head.childNodes))
                        .concat(Array.from(template.body.childNodes));
                }catch(err){
                    console.error(err);
                    return [];
                }
            }else{
                template = document.querySelectorAll(template);
            }
        }
        
        if (template instanceof NodeList){
            return Array.from(template);
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
    
    remove(){
        for (let i in this.__zzElements){
            this.__zzElements[i].parentNode.removeChild( this.__zzElements[i] );
        }
        return this;
    }
    
    clone(){
        return new zzTemplate( this.__zzElements.map( el => el.cloneNode() ) );
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
        for (let i in template){
            this.__zzElements = this.__zzElements.concat( this.__zzConvert( template[i] ) );
        }
    }
}

module.exports = {
    zzFCollectionDOM, 
    zzFCollection,
    zzFieldDOM, 
    zzField,
    CollectionFilter,
    addon,
    zzTemplate
};