const {ViewComponent, Loader} = require('./index');
const {Data} = require('../index');

class zzTitleView extends ViewComponent{
    __initDOM(T){
        this.DOM = Loader(document).find('title');
    }
};

class zzBodyView extends ViewComponent{
    __initDOM(T){
        this.DOM = Loader(document).find('body');
    }
};

class MainApp extends Data{
    main(field){
        this.app = field;
        
        return this;
    }
    
    setTitle(title){
        this.title = title;
        
        return this;
    }
    
    __initBody(){
        new zzBodyView().view('body', this.ref('app')).addEvents();
        new zzTitleView().text('title', this.ref('title')).addEvents();
    }
    
    constructor(options){
        super();
        
        options || (options = {});
        options.app || (options.app = null);
        options.title || (options.title = 'No title');
        
        this.set(options);
        
        this.__initBody();
    }
};

module.exports = {MainApp};