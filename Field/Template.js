const {Event} = require('../event');

class zzTemplate{
    childs(){
        let result = [];
        for (let i in this.__zzElements){
            result = result.concat(Array.prototype.slice.call(this.__zzElements[i].childNodes));
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
    
    remove(){
        for (let i in this.__zzElements){
            //if (this.__zzElements[i].parentNode){
                this.__zzElements[i].parentNode.removeChild( this.__zzElements[i] );
            //}
        }
        return this;
    }
    
    clone(){
        return new zzTemplate( this.__zzElements.map( el => el.cloneNode(true) ) );
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

class zzLoader extends Event{
    find(){
        return this.zzTemplate.find.apply(this.zzTemplate, arguments);
    }
    
    template(){
        return this.zzTemplate;
    }
    
    constructor(url){
        super();
        
        this.zzTemplate = null;
        
        fetch(url).then(function (response) {
            return response.text();
        }).then(function (html) {
            this.zzTemplate = new zzTemplate(html);

            this.enable('load', this.zzTemplate);
        }.bind(this)).catch(function (error) {
            console.error(error);
        });
    }
}

module.exports = {
    zzTemplate,
    zzLoader
};