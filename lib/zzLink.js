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



module.exports = {zzLink, zzLinkAdd};