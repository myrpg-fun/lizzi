# Lizzi
Lizzi is reactive javascript library for Node.js and Web UI.

### Why Lizzi library?
* Lizzi is easy to use. You make it fast.
* Lizzi have independed HTML, CSS and JS code.
### Manual
* [Reactive Classes](./docs/Lizzi.md)
* [HTML Template Class](./docs/Field.md)
* [Event Classes](./docs/Event.md).
### TODO Example
```html
<!-- HTML template -->
<div id="admin-card-add">
    <form class="add-form">
        <div class="header">TO DO...</div>
        <div class="option">
            <input type="text" class="todo" placeholder="TO DO">
        </div>
        <div class="margin-add-button">
            <button type="submit" class="submit">Add new task</button>
        </div>
    </form>
</div>

<div id="admin-card">
    <div class="row">
        <div class="id"></div>
        <div class="todo"></div>
        <div class="checkbox done">
            <span class="opt-checkbox"></span> Done
        </div>
        <div class="remove">X</div>
    </div>
</div>

<div id="admin-cards">
    <div>
        <input type="text" class="search" placeholder="Search tasks">
    </div>
    <div class="cards"></div>
    <div class="add"></div>
</div>
```

```javascript
const Field = require('lizzi/Field');
const {Data, Collection, CollectionFilter} = require('lizzi');

/* Class for adding new card */
class AddCard extends Data{
    /* create new Field UI */
    createField(){
        // clone #admin-card-add from template
        return new Field(T.find('#admin-card-add'), this)
            // prevent submit event from <form>
            .preventSubmit('.add-form')
            // link this.todo variable with input.todo
            .input('input.todo', this.ref('todo'))
            .init(function(field){
                // when Field created, add focus event
                this.on('focus', function(){
                    // find input in field
                    let input = field.find('input.todo');
                    // get finded input DOMElement from Template
                    input = input.elements[0];
                    // focus
                    input.focus();
                }, field);
            }.bind(this), function(field){
                // when Field is removed, turn off focus event
                this.off('focus', field);
            }.bind(this))
            .click('.submit', function(){
                // when we submit, clear all fields and add new Card to our cards collection
                this.todo = '';
                this.emit('focus');
                
                this.collection.add(new Card(this));
            }.bind(this));
    }
    
    constructor(collection){
        super();
        
        this.collection = collection;
        
        // initialize reactive variables
        this.set({
            todo: ''
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
            .switch('.done', this.ref('done'))
            .class('.row', this.ref('doneClass'))
            .text('.todo', this.ref('todo'));
    }
    
    constructor(data){
        super(data);
        
        this.set({
            todo: data.todo || ''
        });

        this.set({
            index: 0,
            idTxt: 0+'.',
            doneClass: '',
            done: false
        });
        
        this.on('set:done', e => this.doneClass = this.done?'is-done':'', this).run();
        this.on('set:index', e => this.idTxt = e.value+'.', this);
        this.on(['set:todo', 'set:done'], () => this.emit('admin:change'), this);
    }
}

class Cards extends Collection{
    constructor(){
        super();
        
        //when element added to Collection
        this.on('add', function(data){
            //link to data events
            data.off(this);
            data.on('admin:remove', function(){
                this.remove(data);
            }, this);
        }, this);
        
        //when element removed from Collection
        this.on('remove', function(data){
            data.off(this);
        }, this);
    }
};

class CardsView extends Collection{
    createField(){
        return new Field(T.find('#admin-cards'), this)
            //append to .cards all fields created by Card.createField which are in this Collection
            .collection('.cards', this, 'createField')
            //append to .add field created by AddCard.createField
            .fieldData('.add', new AddCard(this.collection), 'createField')
            //link input.search with DSearch.search variable
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
        //make index for all elements
        values.forEach(v, i => v.index = i+1);
    
        //filter results
        if (this.searchRef.value){
            let value = this.searchRef.value.toLowerCase();
            return values.filter(d => d.todo.toLowerCase().indexOf(value) !== -1);
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
