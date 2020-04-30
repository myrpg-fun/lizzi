const Field = require('./index');
const {Data} = require('../index');
const {zzTemplate} = require('./Template');

class Body extends Field{
    __initDOM(T){
        this.DOM = new zzTemplate(document).find('body');
    }
};

class MainApp extends Data{
    main(field){
        this.app = field;
        
        return this;
    }
    
    __initBody(){
        new Body().field('body', this.ref('app')).addEvents();
    }
    
    constructor(){
        super({
            app: null
        });
        
        this.__initBody();
    }
};

module.exports = {MainApp};