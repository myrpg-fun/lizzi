/**
 * Copyright (c) Stanislav Shishankin
 *
 * This source code is licensed under the MIT license.
 */

const {zzLinkFind, ViewElements} = require('./zzLink');
const {zzReactive, zzStringConcat} = require('../index');
const {Event} = require('../Event');
const {Router} = require('../Router');

class zzLinkPreventSubmit extends zzLinkFind{
    addEventToEL(el, view){
        view.addEv(el, 'submit', function(event){
            event.preventDefault();
        }.bind(this), false);
    }
}

class zzLinkInputValue extends zzLinkFind{
    addEventToEL(el, view){
        view.addEv(this.modelRel, 'change', function(event){
            if (el.value !== event.value){
                el.value = event.value;
            }
        }, this);
        
        view.addEv(el, 'input', function(){
            if (el.value !== this.modelRel.value){
                let value = this.fnChange(el.value);
                if (value !== undefined){
                    this.modelRel.value = value;
                }
            }
        }.bind(this), false);
        
        view.addEv(el, 'blur', function(){
            if (el.value !== this.modelRel.value){
                el.value = this.modelRel.value;
            }
        }.bind(this), false);

        el.value = this.modelRel.value;
    }

    constructor(DOMFind, modelRel, fnChange){
        super(DOMFind);
        
        this.modelRel = modelRel;
        this.fnChange = fnChange?fnChange:(v) => v;
    }
}

class zzLinkAutoResizeTextarea extends zzLinkFind{
    delayedResize (text) {
        text.style.height = 'auto';
        text.style.height = text.scrollHeight+'px';
    }
    
    addEventToEL(text, view){
        var fn = Event.Defer(this.delayedResize.bind(this, text));
        view.addEv(text, 'focus', fn, false);
        view.addEv(text, 'change', fn, false);
        view.addEv(text, 'input', fn, false);
        view.addEv(text, 'cut', fn, false);
        view.addEv(text, 'paste', fn, false);
        view.addEv(text, 'drop', fn, false);
        view.addEv(text, 'keydown', fn, false);

        if (this.modelRel){
            view.addEv(this.modelRel, 'change', fn);
        }

        fn();
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = modelRel;
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
        this.model.change( this.onModelSet.bind(this, DOMText, this.model), this );
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
        
        this.model = new zzStringConcat(modelRel);
        this.append = append?true:false;
        this.nodes = [];
    }
};

class zzLinkHtmlValue extends zzLinkFind{
    onModelChange(el, model){
        el.innerHTML = model.value;
    };
        
    addEventToEL(el){
        this.model.change( this.onModelChange.bind(this, el, this.model), this );
        
        this.onModelChange(el, this.model);
    }

    clearEvents(){
        this.model.off( this );
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.model = new zzStringConcat(modelRel);
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
    
    addEventToEL(el, view){
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
        
        view.addEv(this.modelRel, 'change', onModelSet, this);
        view.addEv(el, 'click', onClick, false);

        this.skeys.forEach(v => this.removeClass(el, this.sets[v]));
        
        onModelSet({last: null, value: this.modelRel.value});
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

class zzLinkCheckboxValue extends zzLinkFind{
    addEventToEL(el, view){
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
        
        view.addEv(this.modelRel, 'change', onModelSet, this);
        view.addEv(el, 'click', onClick, false);

        onModelSet({last: null, value: this.modelRel.value});
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
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
    
    addEventToEL(el, view){
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
        
        view.addEv(this.modelRel, 'change', onModelSet, this);
        view.addEv(el, 'click', onClick, false);

        onModelSet({last: null, value: this.modelRel.value});
    }

    constructor(DOMFind, modelRel, className, attrName){
        super(DOMFind);
        
        this.modelRel = modelRel;
        this.className = className;
        this.attrName = attrName || 'value';
    }
}

class zzLinkElements extends zzLinkFind{
    addEvents(view){
        if (this.initFn){
            if (this.initFn instanceof ViewElements){
                this.initFn.addEvents(this.elements, view);
            }else{
                for (let els of this.elements){
                    if (!(els instanceof HTMLElement)){
                        continue;
                    }
            
                    this.initFn(els, view);
                }
            }
        }
    }
    
    clearEvents(view){
        if (this.initFn instanceof ViewElements){
            this.initFn.clearEvents(this.elements, view);
        }
        
        if (this.destroyFn){
            for (let els of this.elements){
                if (!(els instanceof HTMLElement)){
                    continue;
                }
        
                this.destroyFn(els, view);
            }
        }
    }

    linkToView(view){
        super.linkToView(view);

        if (this.initFn instanceof ViewElements){
            this.initFn.constructView(this.selector, view);
        }
    }
    
    constructor(DOMFind, initFn, destroyFn){
        super(DOMFind);
        
        this.initFn = initFn;
        this.destroyFn = destroyFn;
    }
}

class zzLinkAttributeValue extends zzLinkFind{
    onModelChange(attr, model, el){
        let value = model.value;
        
        if (!value && value !== ''){
            el.removeAttribute(attr);
        }else if(value === true){
            el.setAttribute(attr, '');
        }else{
            el.setAttribute(attr, value);
        }
    }
    
    setupAttr(attr, model, el){
        model.change(this.onModelChange.bind(this, attr, model, el), this);

        this.onModelChange(attr, model, el);
    }
    
    addEventToEL(el){
        if (!(el instanceof HTMLElement)){
            return;
        }

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
            if (!(attr[name] instanceof zzReactive)){
                attr[name] = new zzStringConcat(attr[name]);
            }
        }
        
        this.attr = attr;
    }
}

class zzLinkStyleValue extends zzLinkAttributeValue{
    onModelChange(el, style, model){
        el.style[style] = model.value;
    }
    
    setupAttr(style, model, el){
        model.change(this.onModelChange.bind(this, el, style, model), this);

        this.onModelChange(el, style, model);
    }
}

class zzLinkClassValue extends zzLinkFind{
    addEventToEL(el){
        if (!(el instanceof HTMLElement)){
            return;
        }

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

        if (this.modelRel instanceof zzReactive){
            this.modelRel.change( listener, this);
            
            listener({
                last: null,
                value: this.modelRel.value
            });
        }else{
            el.className += ' '+this.modelRel;
        }
    }

    clearEvents(DOMel){
        if (this.modelRel instanceof zzReactive){
            this.modelRel.off( this );
        }
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = new zzStringConcat(modelRel);
    }
}

class zzLinkClassObjectValue extends zzLinkFind{
    setupClass(className, model, el){
        if (model instanceof zzReactive){
            let listener = () => {
                var cels = el.className.split(' ');

                var remove = className.split(' ');
                for (var r in remove){
                    let i = cels.indexOf(remove[r]);
                    if (i !== -1){
                        cels.splice(i, 1);
                    }            
                }

                if (model.value){
                    cels.push(className);
                }

                el.className = cels.join(' ').replace(/\s+/gmi,' ');
            };

            model.change( listener, this);

            listener({
                last: null,
                value: model.value
            });
        }else if (model){
            el.className += ' '+className;
        }
    }
    
    addEventToEL(el){
        if (!(el instanceof HTMLElement)){
            return;
        }

        for (let name in this.classes){
            this.setupClass(name, this.classes[name], el);
        }
    }

    clearEvents(field){
        for (let name in this.classes){
            if (this.classes[name] instanceof zzReactive){
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
    addEventToEL(el, view){
        view.addEv(el, 'click', this.fn.bind(this.self?this.self:view, el, view));
    }

    constructor(DOMFind, fn, self){
        super(DOMFind);
        
        this.fn = fn;
        this.self = self;
    }
}

class zzLinkIf extends zzLinkFind{
    addEventToEL(el){
        let DOMEmpty = document.createTextNode('');
        el.parentNode.insertBefore(DOMEmpty, el);

        let last = 1;
        let listener = () => {
            let visible = Boolean(this.modelRel.value) ^ this.inverse;
            if (last !== visible){
                if (visible){
                    DOMEmpty.parentNode.insertBefore(el, DOMEmpty);
                }else{
                    el.remove();
                }

                last = visible;
            }
        };

        this.modelRel.change( listener, this);
        
        listener();
        
        this.nodes.push({
            text: DOMEmpty,
            el: el
        });
    }

    clearEvents(DOMel){
        this.modelRel.off( this );
        
        for (let node of this.nodes){
            node.text.parentNode.insertBefore(node.el, node.text);
            node.text.parentNode.removeChild(node.text);
        }
        this.nodes = [];
    }

    constructor(DOMFind, modelRel, inverse){
        super(DOMFind);

        if (!(modelRel instanceof zzReactive)){
            console.error('Error: condition is not zzReactive');
        }
        
        this.modelRel = modelRel;
        this.nodes = [];
        this.inverse = inverse || false;
    }
}

class zzLinkRoute extends zzLinkFind{
    getValue(v){
        return '/'+(Array.isArray(v)?v.join('/'):v);
    }
    
    addEventToEL(el, view){
        var DOMAttr = document.createAttribute('href');
        el.setAttributeNode( DOMAttr );

        view.addEv(el, 'click', function(ev){
            ev.preventDefault();
            Router.go((this.modelRel instanceof zzReactive)?this.modelRel.value:this.modelRel);
        }.bind(this));
        
        view.addEv(this.modelRel, 'change', function(){
            DOMAttr.value = this.getValue(this.modelRel.value);
        }, this);
        
        DOMAttr.value = this.getValue(this.modelRel.value);
    }

    constructor(DOMFind, modelRel){
        super(DOMFind);
        
        this.modelRel = new zzStringConcat(modelRel);
    }
}

class zzLinkRouteHref extends zzLinkFind{
    addEventToEL(el, view){
        view.addEv(el, 'click', function(ev){
            ev.preventDefault();
            Router.go( el.getAttribute( 'href' ) );
        }.bind(this));
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
        checkbox(DOMFind, modelRel){
           return this.link( new zzLinkCheckboxValue(DOMFind, modelRel) );
        },
        radio(DOMFind, modelRel, sets){
           return this.link( new zzLinkCheckboxValue(DOMFind, modelRel, sets) );
        },
        select(DOMFind, modelRel, className, attrName){
           return this.link( new zzLinkSelectValue(DOMFind, modelRel, className, attrName) );
        },
        elements(DOMFind, initFn, destroyFn){
            return this.link( new zzLinkElements(DOMFind, initFn, destroyFn) );
        },
        autoResizeTextarea(DOMFind, modelRel){
           return this.link( new zzLinkAutoResizeTextarea(DOMFind, modelRel) );
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
            if (typeof modelRel === 'string' || modelRel instanceof zzReactive || Array.isArray(modelRel)){
                return this.link( new zzLinkClassValue(DOMFind, modelRel) );
            }else{
                return this.link( new zzLinkClassObjectValue(DOMFind, modelRel) );
            }
        },
        click(DOMFind, fn, self){
            return this.link( new zzLinkClick(DOMFind, fn, self) );
        },
        if(DOMFind, modelRel, inverse){
            return this.link( new zzLinkIf(DOMFind, modelRel, inverse) );
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
