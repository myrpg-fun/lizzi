class zzLink{
    addEvents(Field){}
    clearEvents(Field){}
    linkToView(Field){}
}

class zzLinkFind extends zzLink{
    addEvents(Field){
        for (let els of this.elements){
            this.addEventToEL(els, Field);
        }
    }
    
    clearEvents(Field){}

    linkToView(Field){
        this.elements = Field.find(this.find).elements;
    }
    
    constructor(selector){
        super();
        
        this.find = selector;
        this.elements = [];
    }
}

module.exports = {zzLink, zzLinkFind};