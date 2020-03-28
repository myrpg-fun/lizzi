import {zzLinkAdd} from './zzLink';

class zzLinkInputValue extends zzLinkAdd{
    __zzAddEventToEL(el){
        this.modelRel.onSet( function(event){
            if (el.value !== event.value){
                el.value = event.value;
            }
        }, this );

        el.addEventListener('input', function(){
            if (el.value !== this.modelRel.value){
                let value = this.fnChange(el.value);
                if (value !== undefined){
                    this.modelRel.value = value;
                }
            }
        }.bind(this), false);
        el.addEventListener('blur', function(){
            if (el.value !== this.modelRel.value){
                el.value = this.modelRel.value;
            }
        }, false);

        el.value = this.modelRel.value;
    }
    
    clearEvents(DOMel){
        this.modelRel.off( this );
    }

    constructor(DOMFind, modelRel, fnChange){
        super(DOMFind);
        
        this.modelRel = modelRel;
        this.fnChange = fnChange?fnChange:(v) => v;
        this.el = null;
    }
}

class zzLinkAutoResizeTextarea extends zzLinkAdd{
    delayedResize (text) {
        setTimeout(() => {
            text.style.height = 'auto';
            text.style.height = text.scrollHeight+'px';
        }, 0);
    }
    
    __zzAddEventToEL(text){
        text.addEventListener('change',  this.delayedResize.bind(this, text), false);
        text.addEventListener('input',  this.delayedResize.bind(this, text), false);
        text.addEventListener('cut',  this.delayedResize.bind(this, text), false);
        text.addEventListener('paste',  this.delayedResize.bind(this, text), false);
        text.addEventListener('drop',  this.delayedResize.bind(this, text), false);
        text.addEventListener('keydown',  this.delayedResize.bind(this, text), false);

        this.delayedResize(text);
    }
}

class zzLinkTextValue extends zzLinkAdd{
    onModelSet(DOMText, event){
        DOMText.data = event.value;
    };
        
    __zzAddEventToEL(el){
        let DOMText = document.createTextNode('');
        el.innerHTML = '';
        el.appendChild(DOMText);
        this.modelRel.onSet( this.onModelSet.bind(this, DOMText), this );
        DOMText.data = this.modelRel.value;
    }

    clearEvents(DOMel){
        this.modelRel.off( this );
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = modelRel;
    }
}

class zzLinkHtmlValue extends zzLinkAdd{
    onModelSet(DOMEl, event){
        DOMEl.innerHTML = event.value;
    };
        
    __zzAddEventToEL(el){
        this.modelRel.onSet( this.onModelSet.bind(this, el), this );
        el.innerHTML = this.modelRel.value;
    }

    clearEvents(){
        this.modelRel.off( this );
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = modelRel;
    }
}

class zzLinkSwitchValue extends zzLinkAdd{
    removeClass(el, className){
        let cels = el.className.split(' ');
        let i = cels.indexOf(className);
        if (i !== -1){
            cels.splice(i, 1);
            el.className = cels.join(' ');
        }
    }
    
    addClass(el, className){
        let cels = el.className.split(' ');
        cels.push(className);
        el.className = cels.join(' ');
    }
    
    __zzAddEventToEL(el){
        let onModelSet = function(ev){
            let s = this.sets.find(f => f.value === ev.last);
            if (s){
                this.removeClass(el, s.class);
            }

            s = this.sets.find(f => f.value === ev.value);
            if (s){
                this.addClass(el, s.class);
            }
        }.bind(this);
        
        let onClick = function(){
            let k = this.skeys.indexOf( this.modelRel.value )+1;

            if (!this.skeys[k]){k = 0;}

            this.modelRel.value = this.skeys[k];
        }.bind(this);
        
        this.modelRel.onSet( onModelSet, this);
        el.addEventListener('click', onClick, false);

        this.skeys.forEach(v => this.removeClass(el, this.sets[v]));
        
        onModelSet({last: null, value: this.modelRel.value});
    }

    clearEvents(DOMel){
        this.modelRel.off( this );
    }

    constructor(DOMFind, modelRel, sets){
        super(DOMFind);
        
        this.modelRel = modelRel;
        this.sets = sets?sets:[
            {value: false, class: 'off'},
            {value: true, class: 'on'}
        ];
        this.skeys = sets.map(s => s.value);
    }
}

class zzLinkAttributeValue extends zzLinkAdd{
    __zzAddEventToEL(el){
        var DOMAttr = document.createAttribute(this.attr);

        this.modelRel.onSet( function(event){
            DOMAttr.value = event.value;
        }, this);

        DOMAttr.value = this.modelRel.value;
        el.setAttributeNode( DOMAttr );
    }

    clearEvents(DOMel){
        this.modelRel.off( this );
    }

    constructor(DOMFind, attr, modelRel){
        super(DOMFind);
        
        this.attr = attr;
        this.modelRel = modelRel;
    }
}

class zzLinkClassValue extends zzLinkAdd{
    __zzAddEventToEL(el){
        let listener = function(event){
            var cels = el.className.split(' ');
            let i = cels.indexOf(event.last);
            if (i !== -1){
                cels.splice(i, 1);
            }            

            cels.push(event.value);

            el.className = cels.join(' ');
        };

        this.modelRel.onSet( listener, this);
        
        listener({
            last: null,
            value: this.modelRel.value
        });
    }

    clearEvents(DOMel){
        this.modelRel.off( this );
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = modelRel;
    }
}

class zzLinkClick extends zzLinkAdd{
    __zzAddEventToEL(el, DOMfield){
        el.addEventListener('click', function(){
            return this.fn.call(this, DOMfield, el);
        }.bind(this));
    }

    constructor(DOMFind, fn){
        super(DOMFind);
        
        this.fn = fn;
    }
}

class zzInitialize extends zzLinkAdd{
    addEvents(DOMfield){
        if (this.initFn){
            var DOMel = this.DOMFind(this.find, DOMfield);

            let els = DOMel.elements;
            for (let i in els){
                this.initFn(els[i], DOMfield);
            }
        }
    }

    clearEvents(DOMfield){
        if (this.destroyFn){
            var DOMel = this.DOMFind(this.find, DOMfield);

            let els = DOMel.elements;
            for (let i in els){
                this.destroyFn(els[i], DOMfield);
            }
        }
    }

    constructor(DOMFind, initFn, destroyFn){
        super(DOMFind);
        
        this.initFn = initFn;
        this.destroyFn = destroyFn;
    }
}

export default {
    __zzFieldAddon:{
        /* shortcuts */
        input(DOMFind, modelRel, changeFn){
           return this.link( new zzLinkInputValue(DOMFind, modelRel, changeFn) );
        },
        inputInteger(DOMFind, model, modelName){
           return this.input(DOMFind, model, modelName, (value) => {
                let val = parseInt(value);
                return isNaN(val)?undefined:val;
           });
        },
        inputFloat(DOMFind, model, modelName){
           return this.input(DOMFind, model, modelName, (value) => {
                let val = parseFloat(value);
                return isNaN(val)?undefined:val;
           });
        },
        autoResizeTextarea(DOMFind){
           return this.link( new zzLinkAutoResizeTextarea(DOMFind) );
        },
        text(DOMFind, model, modelName){
           return this.link( new zzLinkTextValue(DOMFind, model, modelName) );
        },
        html(DOMFind, model, modelName){
           return this.link( new zzLinkHtmlValue(DOMFind, model, modelName) );
        },
        switch(DOMFind, model, modelName, sets){
           return this.link( new zzLinkSwitchValue(DOMFind, model, modelName, sets) );
        },
        attr(DOMFind, attrName, model, modelName){
            return this.link( new zzLinkAttributeValue(DOMFind, attrName, model, modelName) );
        },
        class(DOMFind, model, modelName){
            return this.link( new zzLinkClassValue(DOMFind, model, modelName) );
        },
        collection(DOMFind, collection, fnname){
            return this.link( new zzLinkCollection(DOMFind, collection, fnname) );
        },
        field(DOMFind, field){
            return this.link( new zzLinkField(DOMFind, field) );
        },
        click(DOMFind, fn){
            return this.link( new zzLinkClick(DOMFind, fn) );
        },
        init(DOMFind, initFn, destroyFn){
            return this.link( new zzInitialize(DOMFind, initFn, destroyFn) );
        }
    }
}
