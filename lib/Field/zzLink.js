class zzLink{
    clearEvents(DOMel){}
    addEvents(DOMel){}
}

class zzLinkAdd extends zzLink{
    addEvents(DOMfield){
        var DOMel = DOMfield.find(this.find);

        let els = DOMel.elements;
        for (let i in els){
            this.addEventToEL(els[i], DOMfield);
        }
    }
    
    clearEvents(DOMel){}

    constructor(selector){
        super();
        
        this.find = selector;
    }
}

module.exports = {zzLink, zzLinkAdd};