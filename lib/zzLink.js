class zzLink{
    DOMFind(selector, zzField){
        var DOMel = (selector !== null)?
            zzField.DOM.find( selector ):
            zzField.DOM.childs();
    
        if (DOMel.length === 0){
            console.error('Wrong selector', selector);
        }
        
        return DOMel;
    }
}

class zzLinkAdd extends zzLink{
    addEvents(DOMfield){
        var DOMel = this.DOMFind(this.find, DOMfield);

        let els = DOMel.elements;
        for (let i in els){
            this.__zzAddEventToEL(els[i], DOMfield);
        }
    }

    constructor(DOMFind){
        super();
        
        this.find = DOMFind;
    }
}

module.exports = {zzLink, zzLinkAdd};