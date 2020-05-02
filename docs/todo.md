## TO DO Example

`app/addCard.html`
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
```

`app/addCard.js`
```javascript
const Field = require('lizzi/Field');
const {Data} = require('lizzi');
const Card = require('./card');
/* use webpack html template inline loader plugin */
const T = require('./addCard.html');

/* Class for adding new card */
class AddCard extends Data{
    /* create new Field UI */
    createField(){
        // create Field using #admin-card-add from template
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
                // when Field is removed, turn off all events for this field 
                this.off(field);
            }.bind(this))
            .click('.submit', function(){
                this.collection.add(new Card(this));
                
                // when we submit, clear all fields and add new Card to our cards collection
                this.todo = '';
                this.emit('focus');
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

module.exports = AddCard;
```

`app/card.html`
```html
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
```

`app/card.js`
```javascript
const Field = require('lizzi/Field');
const {Data} = require('lizzi');
/* use webpack html template inline loader plugin */
const T = require('./card.html');

class Card extends Data{
    createField(){
        return new Field(T.find('#admin-card'), this)
            //when index set, then change text in .id element (draw 1. 2. 3. etc)
            .text('.id', [this.ref('index'), '.'])
            //if we click on remove element, then emit 'admin:remove'
            .click('.remove', () => this.emit('admin:remove') )
            //switch this.done by click on .done element
            //adds 'on' to class .done element when this.done is true
            //adds 'off' to class .done element when this.done is false
            .switch('.done', this.ref('done'))
            //add to .row element class value from doneClass
            .class('.row', this.ref('doneClass'))
            .text('.todo', this.ref('todo'));
    }
    
    constructor(data){
        super(data);
        
        //set and make todo value reactive
        this.set({
            todo: data.todo || ''
        });

        //set and make index, doneClass and done values reactive
        this.set({
            index: 0,
            doneClass: '',
            done: false
        });
        
        //when done is true, then add to done class 'line-through'
        //when done is false, then do empty done class
        this.on('set:done', e => this.doneClass = this.done?'line-through':'', this)
            //run listener function instanly with empty arguments
            .run();
        //when todo or done changed, then current class emit 'admin:change' event
        this.on(['set:todo', 'set:done'], () => this.emit('admin:change'), this);
    }
}

module.exports = Card;
```

`app/cards.html`
```html
<div id="admin-cards">
    <div>
        <input type="text" class="search" placeholder="Search tasks">
    </div>
    <div class="cards"></div>
    <div class="add"></div>
</div>
```

`app/cards.js`
```javascript
const Field = require('lizzi/Field');
const {Data, Collection, CollectionFilter} = require('lizzi');
const AddCard = require('./addCard');
/* use webpack html template inline loader plugin */
const T = require('./cards.html');

class Cards extends Collection{
    constructor(){
        super();
        
        //when element added to Collection
        this.on('add', function(data){
            //link Card events to this class
            data.on('admin:remove', function(){
                this.remove(data);
            }, this);
        }, this);
        
        //when element removed from Collection
        this.on('remove', function(data){
            //remove all linked events
            data.off(this);
        }, this);
    }
};

class SearchFilter extends CollectionFilter{
    filter(values){
        //make index for all elements
        values.forEach(v, i => v.index = i+1);
    
        //filter results
        if (this.searchRef.value){
            //get value from reference searchRef
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

class CardsView extends Collection{
    createField(){
        return new Field(T.find('#admin-cards'), this)
            //append to .cards all fields created by Card.createField which are in this Collection
            .collection('.cards', this, 'createField')
            //append to .add field created by AddCard.createField
            .fieldData('.add', this.addCard, 'createField')
            //link input.search with DSearch.search variable
            .input('.search', this.DSearch.ref('search'));
    }
    
    constructor(WCards){
        super();
        
        this.WCardsCollection = WCards;        
        this.addCard = new AddCard(WCards);
        
        this.DSearch = new Data({
            search: ''
        });
        
        //filter get array from WCards, filter with DSearch.search and replace results array to this Collection
        new SearchFilter(WCards, this.DSearch.ref('search')).to(this);
    }
};

module.exports = {Cards, CardsView};
```

`app/index.js`
```javascript
const {Cards, CardsView} = require('./cards');
const {MainApp} = require('../lizzi/Field/MainApp');

const WCards = new Cards();
const WCardsView = new CardsView(WCards);

class MyApp extends MainApp{
    constructor(){
        super();
        
        this.app = WCardsView.createField();
    }
};
```

`webpack.config.js`
```javascript
const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: {
        main: './app/index.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    optimization: {
        splitChunks:{
            chunks: 'all'
        }
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: './assets/index.html'
        })
    ],
    module:{
        rules: [
            {
                test: /\.html/,
                use: ['html-loader']
            }
        ]
    }
};
```
