class zzLink{
    addEvents(Field){}
    clearEvents(Field){}
}

class zzLinkFind extends zzLink{
    addEvents(Field){
        var els = Field.find(this.find).elements;
        for (let i in els){
            this.addEventToEL(els[i], Field);
        }
    }
    
    clearEvents(Field){}

    constructor(selector){
        super();
        
        this.find = selector;
    }
}

module.exports = {zzLink, zzLinkFind};