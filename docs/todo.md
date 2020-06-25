## TO DO Example

`app/addtodo.html`
```html
<!-- HTML template -->
<template id="todo-add">
    <form class="add-form">
        <h4 class="card-title">What I want to do?</h4>
        <div class="add-items d-flex"> 
            <input type="text" class="form-control todo-list-input todo" placeholder="What I want to do?"> 
            <button class="add btn btn-primary font-weight-bold todo-list-add-btn submit">Add</button> 
        </div>
    </form>
</template>
```

`app/addtodo.js`
```javascript
import {Data, Collection, LazyCollection} from 'lizzi';
import {TodoCard} from './todocard';

import {Loader} from 'lizzi/DOM';
const T = Loader( require('./addtodo.html') );

export class AddTodo extends Data{
    createView(){
        return T.createView('#todo-add', this)
            .preventSubmit('.add-form')
            .input('input.todo', this.ref('todo'))
            .click('.submit', () => {
                this.collection.add( new TodoCard(this) );
                this.todo = '';
            });
    }
    
    constructor(collection){
        super();
        
        this.collection = collection;
        
        this.set({
            todo: ''
        });
    }
};
```

`app/filter.html`
```html
<template id="no-todo-cards">
    <li>
        <h6> 
            Nothing TO DO...
        </h6>
    </li>
</template>

<template id="not-found-todo-cards">
    <li>
        <h6> 
            Nothing found...
        </h6>
    </li>
</template>
```

`app/filter.js`
```javascript
import {Data, LazyCollection} from 'lizzi';

import {Loader} from 'lizzi/DOM';
const T = Loader( require('./filter.html') );

class NoTodos extends Data{
    createView(){
        return T.createView('#no-todo-cards', this);
    }
};

class NotFoundTodos extends Data{
    createView(){
        return T.createView('#not-found-todo-cards', this);
    }
};

export class SearchFilter extends LazyCollection{
    filter(values){
        //if empty
        if (values.length === 0){
            return [
                this.noToDos
            ];
        }
        
        values.forEach((v, i) => v.index = i+1);
        
        if (this.searchRef.value){
            let value = this.searchRef.value.toLowerCase();
            values = values.filter(d => d.todo.toLowerCase().indexOf(value) !== -1);
            
            //if not found
            if (values.length === 0){
                return [
                    this.notFoundToDos
                ];
            }
        }
        
        return values;
    }
    
    constructor(collection, searchRef){
        super(collection);
        
        this.searchRef = searchRef;
        this.noToDos = new NoTodos();
        this.notFoundToDos = new NotFoundTodos();
        
        this.searchRef.onSet(this.refresh, this);
    }
};
```

`app/todo.html`
```html
<template id="todo-card">
    <li>
        <div class="form-check"> 
            <label class="form-check-label"> 
                <span class="id"></span> <input class="checkbox" type="checkbox"> <i class="input-helper"></i> <span class="todo"></span>
            </label> 
        </div> 
        <i class="remove mdi mdi-close-circle-outline"></i>
    </li>
</template>

<template id="todo">
    <div class="page-content page-container" id="page-content">
        <div class="row container d-flex justify-content-center">
            <div class="col-lg-12">
                <div class="card px-3">
                    <div class="card-body">
                        <h1>To do example...</h1>
                        <div class="d-flex"> 
                            <input type="text" class="form-control search" placeholder="Search tasks"> 
                        </div>
                        <div class="list-wrapper">
                            <ul class="d-flex flex-column todo-list"></ul>
                        </div>
                        <div class="add"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
```

`app/todo.js`
```javascript
//import './todo.css';

import {Data, Collection} from 'lizzi';
import {AddTodo} from './addtodo';
import {SearchFilter} from './filter';
import {TodoCard, TodoList} from './todocard';

import {Loader} from 'lizzi/DOM';
const T = Loader( require('./todo.html') );

class TodoApp extends Data{
    createView(){
        return T.createView('#todo', this)
            .collection('.todo-list', this.cards, 'createView')
            .data('.add', this.addCard, 'createView')
            .input('.search', this.ref('search'));
    }
    
    constructor(WCards){
        super({
            search: ''
        });
        
        this.addCard = new AddTodo(WCards);
        
        this.cards = new SearchFilter(WCards, this.ref('search'));
    }
};

const TodoAppView = new TodoApp(new TodoList([
    new TodoCard({todo: 'Make new game', done: true}),
    new TodoCard({todo: 'Get profit'}),
    new TodoCard({todo: 'Figure it out'})
]));

const MyApp = new MainApp({
    title: 'To do App',
    app: TodoAppView.createView()
});
```

`app/todocard.html`
```html
<template id="todo-card">
    <li>
        <div class="form-check"> 
            <label class="form-check-label"> 
                <span class="id"></span> <input class="checkbox" type="checkbox"> <i class="input-helper"></i> <span class="todo"></span>
            </label> 
        </div> 
        <i class="remove mdi mdi-close-circle-outline"></i>
    </li>
</template>

```

`app/todocard.js`
```javascript
import {Data, Collection} from 'lizzi';

import {Loader} from 'lizzi/DOM';
const T = Loader( require('./todocard.html') );

export class TodoList extends Collection{
    constructor(todos){
        super();
        
        this.on('add', function(data){
            data.on('todo:remove', function(){
                this.remove(data);
            }, this);
        }, this);
        
        this.on('remove', function(data){
            data.off(this);
        }, this);
        
        this.add(todos);
    }
};

export class TodoCard extends Data{
    createView(){
        return T.createView('#todo-card', this)
            .text('.id', [this.ref('index'), '.'])
            .click('.remove', () => this.emit('todo:remove') )
            .checkbox('.checkbox', this.ref('done'))
            .class('li', this.ref('doneClass'))
            .text('.todo', this.ref('todo'));
    }
    
    constructor(data){
        super();
        
        this.set({
            todo: data.todo || '',
            done: data.done || false
        });

        this.set({
            index: 0,
            doneClass: ''
        });
        
        this.on('set:done', e => this.doneClass = this.done?'completed':'', this)
            .run();
    
        this.on(['set:todo', 'set:done'], () => this.emit('todo:change'), this);
    }
}
```

`webpack.config.js`
```javascript
const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: {
        main: './app/todo.js'
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
