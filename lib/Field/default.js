const {zzLinkFind} = require('./zzLink');
const {zzDataRef} = require('../index');

class zzLinkPreventSubmit extends zzLinkFind{
    addEventToEL(el){
        el.addEventListener('submit', function(event){
            event.preventDefault();
        }.bind(this), false);
    }
    
    constructor(DOMFind, modelRel, fnChange){
        super(DOMFind);
    }
}

class zzLinkInputValue extends zzLinkFind{
    addEventToEL(el){
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
        }.bind(this), false);

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

class zzLinkAutoResizeTextarea extends zzLinkFind{
    delayedResize (text) {
        setTimeout(() => {
            text.style.height = 'auto';
            text.style.height = text.scrollHeight+'px';
        }, 0);
    }
    
    addEventToEL(text){
        text.addEventListener('change',  this.delayedResize.bind(this, text), false);
        text.addEventListener('input',  this.delayedResize.bind(this, text), false);
        text.addEventListener('cut',  this.delayedResize.bind(this, text), false);
        text.addEventListener('paste',  this.delayedResize.bind(this, text), false);
        text.addEventListener('drop',  this.delayedResize.bind(this, text), false);
        text.addEventListener('keydown',  this.delayedResize.bind(this, text), false);

        this.delayedResize(text);
    }
}

class zzLinkTextValue extends zzLinkFind{
    onModelSet(DOMText, event){
        DOMText.data = event.value;
    };
        
    addEventToEL(el){
        el.innerHTML = '';
        for (let i in this.modelRel){
            let text = this.modelRel[i];
            
            let DOMText = document.createTextNode('');
            
            if (typeof text === 'string'){
                DOMText.data = text;
            }
            
            if (text instanceof zzDataRef){
                text.onSet( this.onModelSet.bind(this, DOMText), this );
                DOMText.data = text.value;
            }

            el.appendChild(DOMText);
        }
    }

    clearEvents(DOMel){
        for (let i in this.modelRel){
            if (this.modelRel[i] instanceof zzDataRef){
                this.modelRel[i].off( this );
            }
        }
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        !Array.isArray(modelRel) && (modelRel = [modelRel]);
        
        this.modelRel = modelRel;
    }
}

class zzLinkHtmlValue extends zzLinkFind{
    onModelSet(DOMEl, event){
        DOMEl.innerHTML = event.value;
    };
        
    addEventToEL(el){
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

class zzLinkSwitchValue extends zzLinkFind{
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
    
    addEventToEL(el){
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
        this.skeys = this.sets.map(s => s.value);
    }
}

class zzLinkAttributeValue extends zzLinkFind{
    addEventToEL(el){
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

class zzLinkStyleValue extends zzLinkFind{
    setupStyle(style, model, el){
        if (model instanceof zzDataRef){
            model.onSet( function(event){
                el.style[style] = event.value;
            }, this);

            el.style[style] = model.value;
        }else if (typeof model === 'string'){
            el.style[style] = model;
        }
    }
    
    addEventToEL(el){
        if (typeof this.style === 'string'){
            this.setupStyle(this.style, this.modelRel, el);
        }else if (typeof this.style === 'object'){
            for (let name in this.style){
                this.setupStyle(name, this.style[name], el);
            }
        }
    }

    clearEvents(){
        if (typeof this.style === 'string' && this.modelRel instanceof zzDataRef){
            this.modelRel.off( this );
        }else if (typeof this.style === 'object'){
            for (let name in this.style){
                if (this.style[name] instanceof zzDataRef){
                    this.style[name].off( this );
                }
            }
        }
    }

    constructor(DOMFind, style, modelRel){
        super(DOMFind);
        
        this.style = style;
        this.modelRel = modelRel;
    }
}

class zzLinkClassValue extends zzLinkFind{
    addEventToEL(el){
        let listener = function(event){
            var cels = el.className.split(' ');
            
            if (event.last){
                var remove = event.last.split(' ');
                for (var r in remove){
                    let i = cels.indexOf(remove[r]);
                    if (i !== -1){
                        cels.splice(i, 1);
                    }            
                }
            }

            cels.push(event.value);

            el.className = cels.join(' ').replace(/\s+/gmi,' ');
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

class zzLinkClick extends zzLinkFind{
    addEventToEL(el, DOMfield){
        el.addEventListener('click', this.fn.bind(this.self?this.self:DOMfield, el, DOMfield));
    }

    constructor(DOMFind, fn, self){
        super(DOMFind);
        
        this.fn = fn;
        this.self = self;
    }
}

module.exports = {
    __zzFieldAddon:{
        /* shortcuts */
        preventSubmit(DOMFind){
           return this.link( new zzLinkPreventSubmit(DOMFind) );
        },
        input(DOMFind, modelRel, changeFn){
           return this.link( new zzLinkInputValue(DOMFind, modelRel, changeFn) );
        },
        inputInteger(DOMFind, modelRel){
           return this.input(DOMFind, modelRel, (value) => {
                let val = parseInt(value);
                return isNaN(val)?undefined:val;
           });
        },
        inputFloat(DOMFind, modelRel){
           return this.input(DOMFind, modelRel, (value) => {
                let val = parseFloat(value);
                return isNaN(val)?undefined:val;
           });
        },
        autoResizeTextarea(DOMFind){
           return this.link( new zzLinkAutoResizeTextarea(DOMFind) );
        },
        text(DOMFind, modelRel){
           return this.link( new zzLinkTextValue(DOMFind, modelRel) );
        },
        html(DOMFind, modelRel){
           return this.link( new zzLinkHtmlValue(DOMFind, modelRel) );
        },
        switch(DOMFind, modelRel, sets){
           return this.link( new zzLinkSwitchValue(DOMFind, modelRel, sets) );
        },
        attr(DOMFind, attrName, modelRel){
            return this.link( new zzLinkAttributeValue(DOMFind, attrName, modelRel) );
        },
        style(DOMFind, cssName, modelRel){
            return this.link( new zzLinkStyleValue(DOMFind, cssName, modelRel) );
        },
        class(DOMFind, modelRel){
            return this.link( new zzLinkClassValue(DOMFind, modelRel) );
        },
        click(DOMFind, fn, self){
            return this.link( new zzLinkClick(DOMFind, fn, self) );
        }
    }
};
