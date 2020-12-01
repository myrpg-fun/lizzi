# Template Engine

```javascript
let {View, Loader} = require('lizzi/DOM');
```

## Class: View
```javascript
    let {Collection, Data} = require('lizzi');
    let {Loader} = require('lizzi/DOM');
    
    //prepare data
    let data = new Data({
        //...
    });
    
    //read template from file
    let T = Loader('<template id="template"> ... </template>');

    //Clone HTML DOM from template and add reactive logic.
    let fView = T.createView("#template")
        /* add event listener, and remove it when Field removed */
        .on(object, 'event-name', function(...eventArgs){
            //event listener, this = thisField
        })
        .on(object, 'event-name', function(...eventArgs){
            //event listener, this = thisField
        }, [...run_listener_with_this_arguments_when_Field_init])
        
        /* append ViewComponent to element */
        .view('.element', view)
        .view('.list', data, 'createFieldMethod')
        
        /* append zzArray to element */
        .array('.list', zzReactiveArray, 'createFieldMethod')
        
        /* Add text reference to element. */
        .text('span', zzReactiveString)
        .text('span', 'text string')
        .text('span', ['joins strings ', and, variables, "."])
        
        /* Add html reference to element. */
        .html('div', data.ref("html_variable"))
        .html('div', '<span></span>')
        .html('div', ['<div>', data.ref("tag"), '</div>'])
        
        /* link reference to input/textarea element. */
        .input('.textarea', data.ref("any"))
        .input('.int', data.ref("onlyInteger"), (value) => (value) => {
            let val = parseInt(value);
            //if undefined then do not set variable
            return isNaN(val)?undefined:val;
        })
        .inputInteger('.int', data.ref("onlyInteger"))
        .inputFloat('.float', data.ref("onlyFloat"))
        
        /* set text height to textarea */
        .autoResizeTextarea('.textarea')
        
        /* Add switcher to element */
        .switch('.switch', data.ref("checkbox"))
        .switch('.switch', data.ref("checkbox"), [
            {value: false, class: 'off'},
            {value: true, class: 'on'}
        ])
        .switch('.switch', data.ref("value"), [
            {value: 0, class: 'off'},
            {value: 1, class: 'ask'},
            {value: 2, class: 'res'},
            {value: 3, class: 'ok'},
            //...
        ])
        
        /* add attribute reference to element */
        .attr('.element', {
            'href': data.ref("href"),
            'alt': [data.ref("alt"), ', but ', data.ref("altnot")]
        })
        
        /* add css style reference to element */
        .style('.element', {
            'height': [height, ' px'],
            'width': width
        })
        
        /* set class reference to element */
        .class('.element', classes)
        .class('.element', {
            'on': ifTrue
        })
        
        /* set click function to element */
        .click('.element', function(thisField){
            //...
        }, this)
        
        /* set route function by element href, and set elements href attribute */
        .route('a', ['path', 'to', data.ref('id')])
        .route('a', 'path/to/route'])
        .route('a')
        
        /* set className to element if value equal attribute */
        .select('a', data.ref('value'), 'className', 'attrName')
        .select('a', Router.ref('path'), 'active', 'href')
        
        /* add to every element logic depends on data.values */
        .elements('a', function(el, view){ /* initialize */ }, function(el, view){ /* destroy */ })
        .elements('a', function(el){ 
            el.classList.remove('active');
            if (Router.path === el.getAttribute('href'))
                el.classList.add('active');
        })

        /*  */
        .elements('a', new ViewElements(...))

        /* set init and remove function */
        .init(function(thisField){
            //on add field to DOM
        }, function(thisField){
            //on remove field from DOM
        });
```

### Examples

```html
<!-- Editor HTML template -->
<div id="template-editor">
    <h1 class="header">Header</h1>
    <p class="text">Paragraph</p>
    <input class="input-header" type="text" />
    <textarea class="input-description"></textarea>
    <button class="submit">Submit</button>
</div>
```

```javascript
class ExampleEdit extends Data{
    createFieldEditor(){
        //clone DOM tree from template. And then bind links from Data object
        return new Field("#template-editor", this)
            .input('.input-header', this.ref("header"))
            .input('.input-description', this.ref("description"))
            .text('.header', this.ref("header"))
            .text('.text', this.ref("description"))
            .click('.button', function(){
                console.log("submit:", this.name, this.description);
            });
    }
    
    constructor(){
        super();
        
        this.set({
            header: 'Example',
            description: 'This is Field example'
        })
    }
}

const editor = new ExampleEdit();
//create DOM field
const field1 = editor.createFieldEditor();
field1.appendTo('body');

//create second DOM field synced with editor object
const field2 = editor.createFieldEditor();
field2.appendTo('body');
```

```html
<!-- add new HTML template -->
<div id="template-viewer">
    <div class="view">
        <h1 class="header">Header</h1>
        <p class="text">Paragraph</p>
    </div>
</div>
```

```javascript
//create another DOM field synced with editor object
const fieldView = new Field("#template-viewer", editor)
    .text('.header', editor.ref("header"))
    .text('.text', editor.ref("description"));

fieldView.appendTo('body');
```

#### Collection example

```html
<!-- HTML templates -->
<div id="template-newpost">
    <input class="input-header" type="text" />
    <textarea class="input-description"></textarea>
    <button class="submit">Submit</button>
</div>
<div id="template-post">
    <input class="input-header" type="text" />
    <textarea class="input-description"></textarea>
    <button class="submit">Submit</button>
</div>
<div id="template-collection">
    <div class="collection"></div>
</div>
```

```javascript
class Post extends Data{
    createField(){
        return new Field("#template-post", this)
            .text('.header', this.ref("header"))
            .text('.text', this.ref("description"))
            .click('.button', function(){
                console.log("submit:", this.name, this.description);
            });
    }
    
    constructor(post){
        super();
        
        this.set({
            header: post.header || '',
            description: post.description || ''
        })
    }
}

class PostCollection extends Collection{
    createEditorField(){
        const newPost = new Data({
            header: '',
            description: ''
        });
    
        return new Field("#template-newpost", this)
            .input('.input-header', newPost.ref("header"))
            .input('.input-description', newPost.ref("description"))
            .click('.button', function(){
                console.log("submit:", newPost.name, newPost.description);
                this.add( new Post( newPost.values() ) );
            });
    }
    
    createCollectionField(){
        return new Field("#template-collection", this)
            .collection('.collection', this, 'createField');
    }
    
    createField(){
        // Here we using #template-collection second time, 
        // but now we link with div.container permanent collection with 2 DOM fields
        return new Field("#template-collection", this)
            .collection('.collection', new Collection([
                this.createEditorField(),
                this.createCollectionField(),
            ]));
    }
}

//create data collections and add it to view
const posts = new PostCollection;
posts.createField().appendTo('body');
```
#### Search filter example
```html
<!-- add search input HTML template -->
<div id="template-search">
    <div>
        Search: <input class="input-search" type="text" />
    </div>
</div>
```

```javascript
class FilteredPostCollection extends Collection{
    this.createSearchField(){
        return new Field("#template-newpost", this)
            .input('.input-search', this.search.ref("find"));
    }
    
    createCollectionField(){
        return new Field("#template-collection", this)
            .collection('.collection', this, 'createField');
    }
    
    createField(){
        return new Field("#template-collection", this)
            .collection('.collection', new Collection([
                //search field
                this.createSearchField(),
                //add editor from posts
                this.posts.createEditorField(),
                //but out posts from filtered collection
                this.createCollectionField(),
            ]));
    }
    
    // filter used in FilterCollection class
    filter(posts){
        //first filter empty posts
        posts = posts.filter(p => p.name !== '' && p.description !== '');
        
        //second filter by search
        if (this.search.find !== ''){
            posts = posts.filter(p => 
                p.name.indexOf(this.search.find) !== -1 ||
                p.description.indexOf(this.search.find) !== -1
            );
        }
        
        return posts;
    }
    
    constructor(posts){
        super();
        
        this.posts = posts;
        this.search = new Data({
            find: ''
        })
        
        //create filter proxy
        const filter = new CollectionFilter(posts)
            .setFilterFn(this.filter.bind(this)
            .to(this);
            
        //refreshing filtered data on any changes search filter variable
        this.search.on('set:find', () => filter.refresh());
    }
}

const filteredPosts = new FilteredPostCollection(posts);
filteredPosts.createField().appendTo('body');
```
#### Check Collection is Empty
```html
<!-- add empty labels HTML templates -->
<div id="template-on-empty">No posts</div>
<div id="template-on-empty-search">Find no results</div>
```
```javascript
class FilteredEmptyPostCollection extends FilteredPostCollection{
    isEmpty(){
        //show empty field, if results is empty
        const isEmpty = new Data({
            emptyField: null
        });
        
        const check = function (){
            if (this.length === 0){
                //if we have 0 results, check posts count
                if (this.posts.length === 0){
                    //if 0, then no posts
                    isEmpty.emptyField = new Field("#template-on-empty", this);
                }else{
                    //if >0, then search results is empty
                    isEmpty.emptyField = new Field("#template-on-empty-search", this);
                }
            }else{
                //remove field if not empty
                isEmpty.emptyField = null;
            }
        }.bind(this);
        
        this.on('change-values', check, this);
        
        //init current value
        check();
        
        return isEmpty;
    }
    
    createCollectionField(){
        const isEmpty = this.isEmpty();
    
        return new Field("#template-collection", this)
            .collection('.collection', this, 'createField')
            .field('.collection', isEmpty.ref('emptyField'));
    }
}

const filteredPosts = new FilteredEmptyPostCollection(posts);
filteredPosts.createField().appendTo('body');
```

### Class: zzTemplate
