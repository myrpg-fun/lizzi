# Lizzi
Lizzi is reactive javascript library for Node.js and Web UI.

### Why Lizzi library?
* Lizzi is easy to use. You make it fast.
* Lizzi have independed HTML, CSS and JS code.

* [Reactive Classes](./docs/Lizzi.md)
* [HTML Template Class](./docs/Field.md)
* [Event Classes](./docs/Event.md).

```javascript
const Field = require('../../lizzi/Field');
const {Data, Collection, CollectionFilter} = require('../../lizzi');

class AddCard extends Data{
    createField(){
        return new Field(T.find('#admin-card-add'), this)
            .preventSubmit('.add-form')
            .input('input.option-a', this.ref('option1'))
            .input('input.option-b', this.ref('option2'))
            .switch('.rude', this.ref('isCheckbox'))
            .init(function(field){
                this.on('focus', function(){
                    let input = field.find('input.option-a');
                    input = input.elements[0];
                    input.focus();
                }, field);
            }.bind(this), function(field){
                this.off('focus', field);
            }.bind(this))
            .click('.submit', function(){
                this.option1 = '';
                this.isCheckbox = false;
                this.option2 = '';
                this.emit('focus');
                
                this.collection.add(new Card(this));
            }.bind(this));
    }
    
    constructor(data, collection){
        super(data);
        
        this.collection = collection;
        
        data || this.set({
            option1: '',
            option2: '',
            isCheckbox: false
        });
    }
}

class Card extends Data{
    createField(){
        return new Field(T.find('#admin-card'), this)
            .text('.id', this.ref('idTxt'))
            .click('.remove', function(){
                this.emit('admin:remove');
            }.bind(this))
            .switch('.checkbox', this.ref('isCheckbox'))
            .class('.row', this.ref('checkboxClass'))
            .input('input.option-a', this.ref('option1'))
            .input('input.option-b', this.ref('option2'));
    }
    
    constructor(data){
        super(data);
        
        data || this.set({
            option1: '',
            option2: '',
            isCheckbox: false
        });

        this.set({
            index: 0,
            idTxt: 0+'.',
            checkboxClass: ''
        });
        
        this.on('set:isCheckbox', e => this.checkboxClass = this.isCheckbox?'checked':'', this).run();
        this.on('set:index', e => this.idTxt = e.value+'.', this);
        this.on(['set:option1', 'set:option2', 'set:isCheckbox'], () => this.emit('admin:change'), this);
    }
}

class Cards extends Collection{
    constructor(){
        super();
        
        this.on('add', function(data){
            data.off(this);
            data.on('admin:remove', function(){
                this.remove(data);
            }, this);
        }, this);
        
        this.on('remove', function(data){
            data.off(this);
        }, this);
    }
};

class CardsView extends Collection{
    createField(){
        return new Field(T.find('#admin-cards'), this)
            .collection('.cards', this, 'createField')
            .fieldData('.add', new AddCard(this.collection), 'createField')
            .input('.search', this.DSearch.ref('search'));
    }
    
    constructor(collection){
        super();
        
        this.collection = collection;
        
        this.DSearch = new Data({
            search: ''
        });
    }
};

class SearchFilter extends CollectionFilter{
    filter(values){
        if (this.searchRef.value){
            let value = this.searchRef.value.toLowerCase();
            return values.filter(d => d.option1.toLowerCase().indexOf(value) !== -1 || d.option2.toLowerCase().indexOf(value) !== -1);
        }
        
        return values;
    }
    
    constructor(collection, searchRef){
        super(collection);
        
        this.searchRef = searchRef;
        
        searchRef.onSet(this.refresh, this);
    }
}

const WCards = new Cards();
const WCardsView = new CardsView(WCards);

new SearchFilter(WCards, WCardsView.DSearch.ref('search')).to(WCardsView);

WCardsView.createField().appendTo('body');

```
