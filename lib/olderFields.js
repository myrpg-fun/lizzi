import zzLink from './zzLink';

function autoResizeTextarea (text) {
    function resize () {
        text.style.height = 'auto';
        text.style.height = text.scrollHeight+'px';
    }
    function delayedResize () {
        window.setTimeout(resize, 0);
    }
    text.on('change',  resize, false);
    text.on('cut',  delayedResize, false);
    text.on('paste',  delayedResize, false);
    text.on('drop',  delayedResize, false);
    text.on('keydown',  delayedResize, false);

    delayedResize ();
}

class zzLinkInputValue extends zzLink{
    constructor(DOMfind, model, modelName, fnChange){
        super();
        
        var listener;
        var keyup = !fnChange;
        if (!fnChange){
            fnChange = function(value){return value};
        }
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            let el = DOMel[0];
            
            listener = function(event){
                if (el.value !== event.value){
                    el.value = event.value;
                }
            };
            model.on('set:'+modelName, listener, model);

            function inputListener(){
                if (el.value !== model[modelName]){
                    console.log(modelName);
                    model[modelName] = fnChange(el.value);
                }
            }

            if (keyup){
                DOMel.on('keyup', inputListener);
            }
            
            DOMel.on('change', inputListener);

            el.value = model.get(modelName);
            
            if (el.type === 'textarea'){
                autoResizeTextarea(DOMel);
            }
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkEditableValue extends SFLink{
    constructor(DOMfind, model, modelName){
        super();
        
        var listener;
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel = DOMel[0];
            
            $(DOMel).bind("selectstart", function(event){
                event.stopPropagation();
            });
            
            DOMel.contentEditable = true;
            
            var listen = true;
            listener = function(event){
                if (listen && DOMel.innerHTML !== event.value){
                    //DOMel.innerHTML = event.value;
                }
            };
            model.on('set:'+modelName, listener, model);

            function inputListener(){
                if (DOMel.innerHTML !== model.get(modelName)){
                    var o = {};
                    o[modelName] = DOMel.innerHTML;
                    listen = false;
                    //model.set(o);
                    listen = true;
                }
            }

            //DOMel.on('input', inputListener);
            /*DOMel.on('keypress', function(ev){
                if(ev.keyCode == '13'){
                    document.execCommand('formatBlock', false, 'p');
                }
            }, false);*/

            DOMel.innerHTML = model.get(modelName);
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkInputInteger extends SFLink{
    constructor(DOMfind, model, modelName){
        super();
        
        var listener;
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel = DOMel[0];
            
            listener = function(event){
                if (DOMel.value !== event.value){
                    DOMel.value = event.value;
                }
            };
            model.on('set:'+modelName, listener, model);

            function inputListener(){
                if (DOMel.value !== model.get(modelName)){
                    var val = parseInt(DOMel.value);
                    if (isNaN(val)){
                        return;
                    }
                    
                    model.setAttribute(modelName, val);
                }
            }

            DOMel.on('keyup', inputListener);
            DOMel.on('change', inputListener);

            DOMel.value = model.get(modelName);
            
            if (DOMel.type === 'textarea'){
                autoResizeTextarea(DOMel);
            }
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkInputColor extends SFLink{
    constructor(DOMfind, model, modelName, opacityName){
        super();
        
        var listener, listenero;
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel.minicolors({
                defaultValue: model.get(modelName),
                opacity: opacityName?true:false,
                change: function(value, opacity) {
                    if (value !== model.get(modelName)){
                        model.setAttribute(modelName, value);
                    }
                    
                    if (opacityName && opacity !== model.get(opacityName)){
                        model.setAttribute(opacityName, opacity);
                    }
                }
            });
            window.setTimeout(function(){
                DOMel.minicolors('value', {color: model.get(modelName), opacity: opacityName?model.get(opacityName):1});
            }, 0);

            var el = DOMel[0];
            
            listener = function(event){
                if (el.value !== event.value){
                    DOMel.minicolors('value', {color: model.get(modelName), opacity: opacityName?model.get(opacityName):1});
                }
            };
            model.on('set:'+modelName, listener, model);

            if (opacityName){
                listenero = function(event){
                    DOMel.minicolors('value', {color: model.get(modelName), opacity: opacityName?model.get(opacityName):1});
                };
                model.on('set:'+opacityName, listenero, model);
            }

            function inputListener(){
                if (el.value !== model.get(modelName)){
                    var val = el.value;
                    model.setAttribute(modelName, val);
                }
            }

            el.on('keyup', inputListener);
            el.on('change', inputListener);

            if (el.type === 'textarea'){
                autoResizeTextarea(el);
            }
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
            if (opacityName){
                model.off('set:'+opacityName, listenero);
            }
        };
    }
}

class SFLinkInputFloat extends SFLink{
    constructor(DOMfind, model, modelName){
        super();
        
        var listener;
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel = DOMel[0];
            
            listener = function(event){
                if (DOMel.value !== event.value){
                    DOMel.value = event.value;
                }
            };
            model.on('set:'+modelName, listener, model);

            function inputListener(){
                if (DOMel.value !== model.get(modelName)){
                    var val = parseFloat(DOMel.value);
                    if (isNaN(val)){
                        return;
                    }
                    
                    model.setAttribute(modelName, val);
                }
            }

            DOMel.on('keyup', inputListener);
            DOMel.on('change', inputListener);

            DOMel.value = model.get(modelName);
            
            if (DOMel.type === 'textarea'){
                autoResizeTextarea(DOMel);
            }
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkAttributeValue extends SFLink{
    constructor(DOMfind, attrName, model, modelName){
        super();
        
        var listener;
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            var DOMattr = document.createAttribute(attrName);

            DOMel = DOMel[0];
            
            listener = function(event){
                DOMattr.value = event.value;
            };
            model.on('set:'+modelName, listener);

            DOMattr.value = model.get(modelName);

            DOMel.setAttributeNode( DOMattr );
        }.bind(this);
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkClassNameValue extends SFLink{
    constructor(DOMfind, model, modelName, trueClassName, falseClassName){
        super();
        
        var listener;
        var lastAddedClassName = null;
        
        if (falseClassName === undefined){
            falseClassName = null;
        }
        
        if (typeof model === 'string'){
            trueClassName = model;
            model = null;
            modelName = null;
        }
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);
            DOMel = DOMel[0];

            listener = function(event){
                var newName = DOMel.className;
                
                if (lastAddedClassName){
                    newName = newName.replace(lastAddedClassName, '');
                }
                
                if (event.value){
                    lastAddedClassName = trueClassName?' '+trueClassName:null;
                }else{
                    lastAddedClassName = falseClassName?' '+falseClassName:null;
                }
                
                if (lastAddedClassName){
                    newName = newName+lastAddedClassName;
                }
                
                DOMel.className = newName;
            };
            
            if (model){
                model.on('set:'+modelName, listener);
                listener({value: model.get(modelName)});
            }else if (model === null){
                listener({value: true});
            }
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            if (model){
                model.off('set:'+modelName, listener);
            }
        };
    }
}

class SFLinkClassValue extends SFLink{
    constructor(DOMfind, model, modelName){
        super();
        
        var listener;
        var lastAddedClassName = null;
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);
            DOMel = DOMel[0];

            listener = function(event){
                var newName = DOMel.className;
                
                if (lastAddedClassName){
                    newName = newName.replace(lastAddedClassName, '');
                }
                
                lastAddedClassName = ' '+event.value;
                
                if (lastAddedClassName){
                    newName = newName+lastAddedClassName;
                }
                
                DOMel.className = newName;
            };
            
            model.on('set:'+modelName, listener);
            listener({value: model.get(modelName)});
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            if (model){
                model.off('set:'+modelName, listener);
            }
        };
    }
}

class SFLinkTextValue extends SFLink{
    constructor(DOMfind, model, modelName){
        super();
        
        var listener;
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            var DOMtext = document.createTextNode('');

            DOMel = DOMel[0];

            DOMel.innerHTML = '';
            DOMel.appendChild(DOMtext);

            listener = function(event){
                DOMtext.data = event.value;
            };

            model.on('set:'+modelName, listener);

            DOMtext.data = model.get(modelName);
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkHtmlValue extends SFLink{
    constructor(DOMfind, model, modelName){
        super();
        
        var listener;
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel = DOMel[0];

            listener = function(event){
                DOMel.innerHTML = event.value;
            };

            model.on('set:'+modelName, listener);

            DOMel.innerHTML = model.get(modelName);
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkSwitchValue extends SFLink{
    constructor(DOMfind, model, modelName, sets){
        super();
        
        if (!sets){
            sets = [
                {value: false, class: 'off'},
                {value: true, class: 'on'}
            ];
        }

        var skeys = sets.map(s => s.value);
        
        var listener;
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel.click(function(){
                let k = skeys.indexOf(model[modelName])+1;
                
                if (!skeys[k]){k = 0;}
                
                model[modelName] = skeys[k];
            });

            listener = function(ev){
                let s = sets.find(f => f.value === ev.lastValue);
                if (s){
                    DOMel.removeClass(s.class);
                }
                
                s = sets.find(f => f.value === ev.value);
                if (s){
                    DOMel.addClass(s.class);
                }
            };

            model.on('set:'+modelName, listener);

            skeys.forEach(v => DOMel.removeClass(sets[v]));
            
            listener({lastValue: null, value: model[modelName]});
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            model.off('set:'+modelName, listener);
        };
    }
}

class SFLinkCollection extends SFLink{
    constructor(DOMfind, collection, fnname){
        super();
        
        var SCDF = null;
        
        if (!(collection instanceof zzFCollection)){
            console.error('linked collection is not zzFCollection');
        }
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            SCDF = collection.createCollectionDOM(DOMel, DOMfield, fnname);
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            if (SCDF){
                SCDF.removeDOM();
            }
        };
    }
}

class SFLinkField extends SFLink{
    constructor(DOMfind, field){
        super();
        
        var SCDF = null;
        
        if (!(field instanceof zzField)){
            console.error('linked field is not zzField');
        }
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            SCDF = field.createFieldDOM(DOMfield);
            
            DOMel.append(SCDF.DOM);
        }.bind(this);
        
        this.clearEventFn = function(DOMel){
            if (SCDF){
                SCDF.removeDOM();
            }
        };
    }
}
    
class SFClick extends SFLink{
    constructor(DOMfind, fn){
        super();
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel.click(function(event){
                return fn.call(this, DOMfield, DOMel);
            });
        }.bind(this);
        
        this.clearEventFn = function(){};
    }
}

class SFLinkUploadFile extends SFLink{
    constructor(DOMfind, uploadurl, filterFn, successFn, errorFn, progressFn){
        super();
        
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            DOMel.change(function(){
                var files = $(this).get(0).files;

                if (files.length > 0){
                    var formData = new FormData();
                    for (var i = 0; i < files.length; i++) {
                        if (filterFn(files[i])){
                            formData.append('uploadfiles[]', files[i], files[i].name);
                        }
                    }
                    
                    if (typeof uploadurl === 'function'){
                        uploadurl = uploadurl();
                    }

                    var ajaxdata = {
                        url: uploadurl,
                        type: 'POST',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function(file){return successFn(file, DOMfield);},
                        error: errorFn
                    };
                    
                    if (progressFn){
                        ajaxdata.xhr = function() {
                            var xhr = new XMLHttpRequest();

                            xhr.upload.on('progress', function(evt) {
                                if (evt.lengthComputable) {
                                    var percentComplete = evt.loaded / evt.total;
                                    percentComplete = parseInt(percentComplete * 100);

                                    progressFn(percentComplete);
                                }
                            }, false);

                            return xhr;
                        };
                    }

                    $.ajax(ajaxdata);
                }
            });
        }.bind(this);
        
        this.clearEventFn = function(){};
    }
}

class SFAddEventListener extends SFLink{
    constructor(DOMfind, model, event, fn, self){
        super();
        
        var evListener;
        this.addEventFn = function(DOMfield){
            var DOMel = this.DOMFind(DOMfind, DOMfield);

            evListener = model.on(event, function(ev){
                return fn.call(self, DOMel, ev, DOMfield);
            });
        }.bind(this);
        
        this.clearEventFn = (function(){
            model.off(evListener);
        });
    }
}

class SFInitialize extends SFLink{
    constructor(DOMfind, initFn, destroyFn){
        super();
        
        var listener;
        this.addEventFn = function(DOMfield){
            if (initFn){
                var DOMel = this.DOMFind(DOMfind, DOMfield);
                
                initFn(DOMel, DOMfield);
            }
        }.bind(this);
        
        this.clearEventFn = (function(){
            if (destroyFn){
                destroyFn();
            }
        });
    }
}

class zzField extends Event{
    /* shortcuts */
    linkEditableValue(DOMfind, model, modelName){
       return this.link( new SFLinkEditableValue(DOMfind, model, modelName) );
    }
    
    linkInputValue(DOMfind, model, modelName, changeFn){
       return this.link( new SFLinkInputValue(DOMfind, model, modelName, changeFn) );
    }
    
    linkInputInteger(DOMfind, model, modelName){
       return this.link( new SFLinkInputInteger(DOMfind, model, modelName) );
    }
    
    linkInputFloat(DOMfind, model, modelName){
       return this.link( new SFLinkInputFloat(DOMfind, model, modelName) );
    }
    
    linkInputColor(DOMfind, model, modelName, opacityName){
       return this.link( new SFLinkInputColor(DOMfind, model, modelName, opacityName) );
    }
    
    linkTextValue(DOMfind, model, modelName){
       return this.link( new SFLinkTextValue(DOMfind, model, modelName) );
    }
    
    linkHtmlValue(DOMfind, model, modelName){
       return this.link( new SFLinkHtmlValue(DOMfind, model, modelName) );
    }
   
    linkSwitchValue(DOMfind, model, modelName, sets){
       return this.link( new SFLinkSwitchValue(DOMfind, model, modelName, sets) );
    }
    
    linkAttributeValue(DOMfind, attrName, model, modelName){
        return this.link( new SFLinkAttributeValue(DOMfind, attrName, model, modelName) );
    }
    
    linkClassNameValue(DOMfind, model, modelName, trueClassName, falseClassName){
        return this.link( new SFLinkClassNameValue(DOMfind, model, modelName, trueClassName, falseClassName) );
    }
    
    linkClassValue(DOMfind, model, modelName){
        return this.link( new SFLinkClassValue(DOMfind, model, modelName) );
    }
    
    linkCollection(DOMfind, collection, fnname){
        return this.link( new SFLinkCollection(DOMfind, collection, fnname) );
    }
    
    linkField(DOMfind, field){
        return this.link( new SFLinkField(DOMfind, field) );
    }
    
    click(DOMfind, fn){
        return this.link( new SFClick(DOMfind, fn) );
    }
    
    linkUploadFile(DOMfind, uploadurl, successFn, progressFn){
        return this.link( new SFLinkUploadFile(DOMfind, uploadurl, successFn, progressFn) );
    }
    
    initEvent(DOMfind, model, event, fn, self){
        return this.link( new SFAddEventListener(DOMfind, model, event, fn, self) );
    }
    
    init(DOMfind, initFn, destroyFn){
        return this.link( new SFInitialize(DOMfind, initFn, destroyFn) );
    }
    
    /* class */
    link(SFEvent){
        this.events.push(SFEvent);
        return this;
    }
    
    callEventsFn(fieldDOM){
        this.events.forEach(function(eventFn){
            eventFn.addEventFn(fieldDOM, this);
        }, this);
    }
   
    callClearEventsFn(fieldDOM){
        this.events.forEach(function(eventFn){
            eventFn.clearEventFn(fieldDOM, this);
        }, this);
    }
    
    /* Create DOM Field */
    createFieldDOM(){
        var fieldDOM = new zzFieldDOM(this.zzTemplate, this);
        this.callEventsFn(fieldDOM);

        return fieldDOM;
    }
    
    appendTo(DOM){
        DOM.append(this.createFieldDOM(null));
    }
    
    constructor(zzTemplate){
        super();
        
        this.zzTemplate = zzTemplate;
        
        this.events = [];
    }
}

class zzTemplate{
    childs(){
        let result = [];
        for (let i in this.elements){
            result = result.concat(this.elements[i].children);
        }
        
        return new zzTemplate(result);
    }
    
    find(selector){
        let result = [];
        for (let i in this.elements){
            result = result.concat(this.elements[i].querySelectorAll(selector));
        }
        
        return new zzTemplate(result);
    }

    __zzConvert(template){
        if (template === undefined){
            template = document;
        }
        
        if (typeof template === 'string'){
            template = (new DOMParser).parseFromString(template, 'text/html');
        }
        
        return template;
    }
    
    constructor(template){
        !Array.isArray(template) && (template = [template]);
        
        Object.defineProperty(this, 'length', {
            get: () => this.elements.length
        });
        
        this.elements = [];
        for (let i in template){
            this.elements.push( this.__zzConvert(template[i]) );
        }
    }
}

