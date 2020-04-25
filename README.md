# Lizzi
Lizzi is reactive javascript library for Node.js and Web UI.

### Why Lizzi library?
* Lizzi is easy to use. You make it fast.
* Lizzi have independed HTML, CSS and JS code.
### Manual
* [Reactive Classes](./docs/Lizzi.md)
* [HTML Template Class](./docs/Field.md)
* [Event Classes](./docs/Event.md).
### Example
```html
<!-- HTML template -->
<div id="admin-cards">
    <div>
        <input type="text" class="search" placeholder="Search">
    </div>
    <div class="cards"></div>
    <div class="add"></div>
</div>

<div id="admin-card">
    <div class="row">
        <div class="id"></div>
        <div class="option-a">
            <input type="text" class="form-control option-a" placeholder="Option A">
        </div>
        <div class="option-b">
            <input type="text" class="form-control option-b" placeholder="Option B">
        </div>
        <div class="checkbox"><span class="opt-checkbox"></span> Checkbox</div>
        <div class="remove">X</div>
    </div>
    <div class="card-error error"></div>
</div>

<div id="admin-card-add">
    <form class="add-form">
        <div class="add-header">Would You Rather...</div>
        <div class="option-a">
            <input type="text" class="form-control option-a" placeholder="Option A">
            <div class="icon"></div>
        </div>
        <div class="add-or">or</div>
        <div class="option-b">
            <input type="text" class="form-control option-b" placeholder="Option B">
            <div class="icon"></div>
        </div>
        <div class="checkbox">
            <span class="opt-checkbox"></span> is Checkbox
        </div>
        <div class="margin-add-button">
            <button type="submit" class="btn btn-primary submit">Add new card</button>
        </div>
    </form>
</div>
```

```javascript
const Field = require('../../lizzi/Field');
const {Data, Collection, CollectionFilter} = require('../../lizzi');

/* Class for adding new card */
class AddCard extends Data{
    /* create new Field UI */
    createField(){
        /* clone #admin-card-add from template */
        return new Field(T.find('#admin-card-add'), this)
            /* prevent submit event from <form> */
            .preventSubmit('.add-form')
            /* link this.option1 variable with input.option-a */
            .input('input.option-a', this.ref('option1'))
            /* link this.option2 variable with input.option-b */
            .input('input.option-b', this.ref('option2'))
            /* link this.isCheckbox variable with .checkbox div element */
            .switch('.checkbox', this.ref('isCheckbox'))
            .init(function(field){
                /* when Field created, add focus react event */
                this.on('focus', function(){
                    let input = field.find('input.option-a');
                    input = input.elements[0];
                    input.focus();
                }, field);
            }.bind(this), function(field){
                this.off('focus', field);
            }.bind(this))
            .click('.submit', function(){
                /* when we submit, clear all fields and add new Card to our cards collection */
                this.option1 = '';
                this.isCheckbox = false;
                this.option2 = '';
                this.emit('focus');
                
                this.collection.add(new Card(this));
            }.bind(this));
    }
    
    constructor(collection){
        super();
        
        this.collection = collection;
        
        /* initialize reactive variables */
        this.set({
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
