/**
 * Copyright (c) Stanislav Shishankin
 *
 * This source code is licensed under the MIT license.
 */

class zzLink{
    addEvents(view){}
    clearEvents(view){}
    linkToView(view){}
}

class zzLinkFind extends zzLink{
    addEvents(view){
        for (let els of this.elements){
            this.addEventToEL(els, view);
        }
    }
    
    clearEvents(view){}

    linkToView(view){
        this.elements = view.find(this.selector).toArray();
    }
    
    constructor(selector){
        super();
        
        this.selector = selector;
        this.elements = [];
    }
}

class ViewElements{
    addEventToEL(el, view){}

    addEvents(elements, view){
        for (let el of elements){
            this.addEventToEL(el, view);
        }
    }
    
    clearEvents(elements, view){}
    constructView(elements, view){}
}

module.exports = {zzLink, zzLinkFind, ViewElements};