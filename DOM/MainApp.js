/**
 * Copyright (c) Stanislav Shishankin
 *
 * This source code is licensed under the MIT license.
 */

const {ViewComponent, Loader} = require('./index');
const {zzString, zzObj} = require('../index');
const {Event} = require('../Event');

class zzDocumentView extends ViewComponent{
    __initDOM(T){
        this.DOM = Loader(document);
    }
};

class MainApp extends Event{
    setView(field){
        this.app = field;
        
        return this;
    }
    
    setTitle(title){
        this.title = title;
        
        return this;
    }
    
    __initBody(){
        new zzDocumentView()
            .text(this.options.titleSelector, this.title)
            .view(this.options.appSelector, this.app)
            .addEvents();
    }
    
    constructor(options){
        super();
        
        options || (options = {});
        options.appSelector || (options.appSelector = 'body');
        options.titleSelector || (options.titleSelector = 'title');
        options.app || (options.app = null);
        options.title || (options.title = 'No title');
        
        this.options = options;
        this.title = new zzString(options.title);
        this.app = new zzObj(options.app);
        
        this.__initBody();
    }
};

module.exports = {MainApp, zzDocumentView};