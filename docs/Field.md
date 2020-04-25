## Template Engine

### Class: Field
```javascript
    let Field = require('lizzi/Field');
```

Clone HTML DOM from template and add reactive logic.

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
