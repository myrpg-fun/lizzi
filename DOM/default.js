const {zzLinkFind} = require('./zzLink');
const {zzReference, zzArrayRef} = require('../zzReference');
const {EventStack} = require('../Event');
const {Router} = require('../Router');

class zzLinkPreventSubmit extends zzLinkFind{
    addEventToEL(el){
        this.ev.add(el, 'submit', function(event){
            event.preventDefault();
        }.bind(this), false);
    }
    
    clearEvents(DOMel){
        this.ev.off();
    }

    constructor(DOMFind){
        super(DOMFind);
        
        this.ev = new EventStack;
    }
}

class zzLinkInputValue extends zzLinkFind{
    addEventToEL(el){
        this.ev
            .add(this.modelRel, function(event){
                if (el.value !== event.value){
                    el.value = event.value;
                }
            }, this)
            .add(el, 'input', function(){
                if (el.value !== this.modelRel.value){
                    let value = this.fnChange(el.value);
                    if (value !== undefined){
                        this.modelRel.value = value;
                    }
                }
            }.bind(this), false)
            .add(el, 'blur', function(){
                if (el.value !== this.modelRel.value){
                    el.value = this.modelRel.value;
                }
            }.bind(this), false);

        el.value = this.modelRel.value;
    }
    
    clearEvents(DOMel){
        this.ev.off();
    }

    constructor(DOMFind, modelRel, fnChange){
        super(DOMFind);
        
        this.ev = new EventStack;
        this.modelRel = modelRel;
        this.fnChange = fnChange?fnChange:(v) => v;
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
};

class zzLinkTextValue extends zzLinkFind{
    onModelSet(DOMText, model){
        DOMText.data = model.value;
    };
        
    addEventToEL(el){
        if (!this.append){
            el.innerHTML = '';
        }
        
        let DOMText = document.createTextNode('');
        this.model.onSet( this.onModelSet.bind(this, DOMText, this.model), this );
        this.onModelSet(DOMText, this.model);

        el.appendChild(DOMText);
        this.nodes.push(DOMText);
    }

    clearEvents(){
        this.model.off( this );
        
        for (let node of this.nodes){
            node.parentNode.removeChild(node);
        }
        this.nodes = [];
    }

    constructor(DOMFind, modelRel, append){
        super(DOMFind);
        
        this.model = new zzArrayRef(modelRel);
        this.append = append?true:false;
        this.nodes = [];
    }
};

class zzLinkHtmlValue extends zzLinkFind{
    onModelChange(el, model){
        el.innerHTML = model.value;
    };
        
    addEventToEL(el){
        this.model.onSet( this.onModelChange.bind(this, el, this.model), this );
        
        this.onModelChange(el);
    }

    clearEvents(){
        this.model.off( this );
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.model = new zzArrayRef(modelRel);
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
        
        this.ev.add(this.modelRel, onModelSet, this);
        this.ev.add(el, 'click', onClick, false);

        this.skeys.forEach(v => this.removeClass(el, this.sets[v]));
        
        onModelSet({last: null, value: this.modelRel.value});
    }

    clearEvents(DOMel){
        this.ev.off();
    }

    constructor(DOMFind, modelRel, sets){
        super(DOMFind);
        
        this.ev = new EventStack;
        this.modelRel = modelRel;
        this.sets = sets?sets:[
            {value: false, class: 'off'},
            {value: true, class: 'on'}
        ];
        this.skeys = this.sets.map(s => s.value);
    }
}

class zzLinkCheckboxValue extends zzLinkFind{
    addEventToEL(el){
        let onModelSet = function(ev){
            if (el.value !== 'on'){
                el.checked = (ev.value === el.value);
            }else{
                el.checked = ev.value?true:false;
            }
        }.bind(this);
        
        let onClick = function(e){
            if (el.checked){
                this.modelRel.value = el.value?el.value:true;
            }else{
                this.modelRel.value = el.value?'':false;
            }
        }.bind(this);
        
        this.ev.add(this.modelRel, onModelSet, this);
        this.ev.add(el, 'click', onClick, false);

        onModelSet({last: null, value: this.modelRel.value});
    }

    clearEvents(){
        this.ev.off();
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.ev = new EventStack;
        this.modelRel = modelRel;
    }
}

class zzLinkSelectValue extends zzLinkFind{
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
            let value = el.getAttribute(this.attrName) || (el.dataset[this.attrName]);
            if (value){
                if (ev.value === value){
                    this.addClass(el, this.className);
                }else{
                    this.removeClass(el, this.className);
                }
            }else if (!ev.value){
                this.addClass(el, this.className);
            }else{
                this.removeClass(el, this.className);
            }
        }.bind(this);
        
        let onClick = function(e){
            let value = el.getAttribute(this.attrName) || (el.dataset[this.attrName]);
            if (value){
                this.modelRel.value = value;
            }else{
                this.modelRel.value = false;
            }
        }.bind(this);
        
        this.ev.add(this.modelRel, onModelSet, this);
        this.ev.add(el, 'click', onClick, false);

        onModelSet({last: null, value: this.modelRel.value});
    }

    clearEvents(DOMel){
        this.ev.off();
    }

    constructor(DOMFind, modelRel, className, attrName){
        super(DOMFind);
        
        this.ev = new EventStack;
        this.modelRel = modelRel;
        this.className = className;
        this.attrName = attrName || 'value';
    }
}

class zzLinkAttributeValue extends zzLinkFind{
    onModelChange(DOMAttr, model){
        DOMAttr.value = model.value;
    }
    
    setupAttr(attr, model, el){
        var DOMAttr = document.createAttribute(attr);
        el.setAttributeNode( DOMAttr );

        model.onSet(this.onModelChange.bind(this, DOMAttr, model), this);

        this.onModelChange(DOMAttr, model);
    }
    
    addEventToEL(el){
        for (let name in this.attr){
            this.setupAttr(name, this.attr[name], el);
        }
    }

    clearEvents(){
        for (let name in this.attr){
            this.attr[name].off( this );
        }
    }

    constructor(DOMFind, attr){
        super(DOMFind);

        for (let name in attr){
            attr[name] = new zzArrayRef(attr[name]);
        }
        
        this.attr = attr;
    }
}

class zzLinkStyleValue extends zzLinkAttributeValue{
    onModelChange(el, style, model){
        el.style[style] = model.value;
    }
    
    setupAttr(style, model, el){
        model.onSet(this.onModelChange.bind(this, el, style, model), this);

        this.onModelChange(el, style, model);
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

class zzLinkClassObjectValue extends zzLinkFind{
    setupClass(className, model, el){
        if (model instanceof zzReference){
            let listener = function(event){
                var cels = el.className.split(' ');

                var remove = className.split(' ');
                for (var r in remove){
                    let i = cels.indexOf(remove[r]);
                    if (i !== -1){
                        cels.splice(i, 1);
                    }            
                }

                if (event.value){
                    cels.push(className);
                }

                el.className = cels.join(' ').replace(/\s+/gmi,' ');
            };

            model.onSet( listener, this);

            listener({
                last: null,
                value: model.value
            });
        }else if (typeof model === 'string'){
            el.className += ' '+model;
        }
    }
    
    addEventToEL(el){
        for (let name in this.classes){
            this.setupClass(name, this.classes[name], el);
        }
    }

    clearEvents(field){
        for (let name in this.classes){
            if (this.classes[name] instanceof zzReference){
                this.classes[name].off( this );
            }
        }
    }

    constructor(DOMFind, classes){
        super(DOMFind);
        
        this.classes = classes;
    }
}

class zzLinkClick extends zzLinkFind{
    addEventToEL(el, DOMfield){
        this.ev.add(el, 'click', this.fn.bind(this.self?this.self:DOMfield, el, DOMfield));
    }

    clearEvents(DOMel){
        this.ev.off();
    }
    
    constructor(DOMFind, fn, self){
        super(DOMFind);
        
        this.fn = fn;
        this.self = self;
        this.ev = new EventStack;
    }
}

class zzLinkIf extends zzLinkFind{
    addEventToEL(el){
        let DOMEmpty = document.createTextNode('');
        el.parentNode.insertBefore(DOMEmpty, el);
        
        let listener = function(event){
            let visible = Boolean(event.value);
            if (Boolean(event.last) !== visible){
                if (visible){
                    DOMEmpty.parentNode.insertBefore(el, DOMEmpty);
                }else{
                    el.remove();
                }
            }
        };

        this.modelRel.onSet( listener, this);
        
        listener({
            last: true,
            value: this.modelRel.value
        });
        
        this.nodes.push(DOMEmpty);
    }

    clearEvents(DOMel){
        this.modelRel.off( this );
        
        for (let node of this.nodes){
            node.parentNode.removeChild(node);
        }
        this.nodes = [];
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = modelRel;
        this.nodes = [];
    }
}

class zzLinkRoute extends zzLinkFind{
    getValue(v){
        return '/'+(Array.isArray(v)?v.join('/'):v);
    }
    
    addEventToEL(el){
        var DOMAttr = document.createAttribute('href');
        el.setAttributeNode( DOMAttr );

        this.ev.add(el, 'click', function(ev){
            ev.preventDefault();
            Router.go((this.modelRel instanceof zzReference)?this.modelRel.value:this.modelRel);
        }.bind(this));
        
        this.ev.add(this.modelRel, function(){
            DOMAttr.value = this.getValue(this.modelRel.value);
        }, this);
        
        DOMAttr.value = this.getValue(this.modelRel.value);
    }

    clearEvents(DOMel){
        this.ev.off();
    }
        
    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = new zzArrayRef(modelRel);
        this.ev = new EventStack;
    }
}

class zzLinkRouteHref extends zzLinkFind{
    addEventToEL(el){
        this.ev.add(el, 'click', function(ev){
            ev.preventDefault();
            Router.go( el.getAttribute( 'href' ) );
        }.bind(this));
    }

    clearEvents(DOMel){
        this.ev.off();
    }
        
    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.ev = new EventStack;
    }
}

module.exports = {
    __zzViewAddon:{
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
        checkbox(DOMFind, modelRel, sets){
           return this.link( new zzLinkCheckboxValue(DOMFind, modelRel, sets) );
        },
        radio(DOMFind, modelRel, sets){
           return this.link( new zzLinkCheckboxValue(DOMFind, modelRel, sets) );
        },
        select(DOMFind, modelRel, className, attrName){
           return this.link( new zzLinkSelectValue(DOMFind, modelRel, className, attrName) );
        },
        autoResizeTextarea(DOMFind){
           return this.link( new zzLinkAutoResizeTextarea(DOMFind) );
        },
        text(DOMFind, modelRel, append){
           return this.link( new zzLinkTextValue(DOMFind, modelRel, append) );
        },
        html(DOMFind, modelRel){
           return this.link( new zzLinkHtmlValue(DOMFind, modelRel) );
        },
        switch(DOMFind, modelRel, sets){
           return this.link( new zzLinkSwitchValue(DOMFind, modelRel, sets) );
        },
        attr(DOMFind, modelRel){
            return this.link( new zzLinkAttributeValue(DOMFind, modelRel) );
        },
        style(DOMFind, modelRel){
            return this.link( new zzLinkStyleValue(DOMFind, modelRel) );
        },
        class(DOMFind, modelRel){
            if (typeof modelRel === 'string' || modelRel instanceof zzReference){
                return this.link( new zzLinkClassValue(DOMFind, modelRel) );
            }else{
                return this.link( new zzLinkClassObjectValue(DOMFind, modelRel) );
            }
        },
        click(DOMFind, fn, self){
            return this.link( new zzLinkClick(DOMFind, fn, self) );
        },
        if(DOMFind, modelRel){
            return this.link( new zzLinkIf(DOMFind, modelRel) );
        },
        route(DOMFind, data){
            if (data === undefined){
                return this.link( new zzLinkRouteHref(DOMFind) );
            }else{
                return this.link( new zzLinkRoute(DOMFind, data) );
            }
        }    
    }
};
