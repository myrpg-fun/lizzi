
# Reactive Engine

```javascript
let {Data, Collection, zzDataRef, CollectionFilter} = require('lizzi');
```

## Class: Data
_This class inherits from the [Event](./Event.md#class-event) class._

### Data.set({ name: value, ... }); 
Register reactive variable **name** and set **value**.

Registered variables emit `set`, `set:name` events on any changes.

### Data.unset(name);
Unregister and remove variable. Emit `remove-value`.

### Data.ref(name); 
Get [zzDataRef](#class-zzdataref) by **name**.

### Event: `set` {name, value, last, target} - emit if any variable changed
### Event: `set:name` {name, value, last, target} -  emit if `name` variable changed
* **params.name** is name of variable
* **params.value** is current value
* **params.last** is old value
* **params.target** is Data instance

### Event: `remove-value` {name, value, target} - emit when value removed from reactive stack
* **params.name** is name of variable
* **params.value** is last value of variable
* **params.target** is Data instance

## Examples

```javascript
const data = new Data;

data.on('set', function(ev){
    console.log(ev.name, ':', ev.last, ev.value);
});

data.set({
    status: 'downloading',
    progress: 0
});
// Prints: 
// status: undefined downloading
// progress: undefined 0

data.set({
    progress: 10,
    status: 'uploading'
});
// Prints: 
// progress: 0 10
// status: downloading uploading

data.off('set');
data.on('set:progress', function(ev){
    console.log('progress:', ev.last+'%', '->', ev.value+'%');
});

data.progress = 99;
// Prints: 
// progress: 10% -> 99%
```

```javascript
class userSettings extends Data{
    saveToDB(db){
        /* wait after set all values and then emit listener */
        this.on('set', EventAfterAll(function(ev){
            console.log('lazy save values one time', this.values());
            console.log('changed only', ev.values);
            db.update(this.values());
        }))
    }

    constructor(){
        this.set({
            uploadSpeed: 0,
            downloadSpeed: 0,
            allowDownload: false
        });
        
        this.notReactiveValue = 'some letters';
    }
}

const settings = new userSettings;
settings.saveToDB(db);

this.uploadSpeed = 5;
this.uploadSpeed = 1000;
this.downloadSpeed = 0;
this.downloadSpeed = 9999;
this.downloadSpeed = 10;

// Prints: 
// lazy save values one time {uploadSpeed: 1000, downloadSpeed: 10, allowDownload: false}
// changed only {uploadSpeed: 1000, downloadSpeed: 10}
```

### Class: Collection
_This class inherits from the [Event](./Event.md#class-event) class._

`Collection.add(elements);` add elements to collection and emit `add` and `add-values` event.

`Collection.remove(elements);` remove elements from collection and emit `remove` and `remove-values` event.

`Collection.replace(elements);` replace all elements in collection and emit `replace-values` event.

`add`, `remove` emit on add/remove every element in collection.
* `element` is added/removed element
* `index` is index
* `target` is this instance

```javascript
let elements = new Collection;

elements.on('add', (ev) => console.log('add', ev.element));

mainElements.add([
    {user: 1, name: 'user 1'}, 
    {user: 2, name: 'user 2'}
]);
mainElements.add( {user: 3, name: 'user 3'} );
//Prints:
//add {user: 1, name: 'user 1'}
//add {user: 2, name: 'user 2'}
//add {user: 3, name: 'user 3'}

console.log(elements.collection);
//Prints:
//[{user: 1, name: 'user 1'}, {user: 2, name: 'user 2'}, {user: 3, name: 'user 3'}]
```

`add-values`, `remove-values`, `replace-values` emit after add/replace/remove all variables in collection.
* `values` is added/replaced/removed array of elements
* `target` is this instance

`Collection.collection` get collection elements as **Array**.

`Collection.length` get size of collection.

### Class: zzDataRef
Shortcut reference to variable from [Data](#class-data) object. Used for set variable `set` event listener and get current variable value.

`zzDataRef.onSet(listener[, self])` add event listener on change current variable.

`zzDataRef.value` is current value of variable.

```javascript
    //syncing input.value with user.name value
    const modelRel = user.rel('name');
    const inputEl = document.getElementById('input-name');

    modelRel.onSet( function(event){
        if (inputEl.value !== event.value){
            inputEl.value = event.value;
        }
    });

    inputEl.addEventListener('input', function(){
        if (inputEl.value !== modelRel.value){
            modelRel.value = inputEl.value;
        }
    }, false);

    //set current model value as default
    inputEl.value = modelRel.value;
```

`zzDataRef.off([listener][, self])` is remove event listener on change variable.

### Class: CollectionFilter
CollectionFilter used for sort and filter elements in [Collections](#class-collection).

`new CollectionFilter(collection)` set inner `collection` for filter/sort.

`CollectionFilter.setFilterFn(function)` filter/sort function. Get array of elements from inner `collection` and return new elements for outer array.

`CollectionFilter.to(collection)` add to filter outer `collection` to replace filtered array.

```javascript
let data = new Data;
data.set({count: 0});

let mainElements = new Collection;
let viewElements = new Collection;

let filter = new CollectionFilter(mainElements)
    .setFilterFn((elements) => elements.filter(el => el.count <= data.count))
    .to(viewElements);
    
data.on('set:count', () => filter.refresh());

mainElements.add([
    {count: 0},
    {count: 10},
    {count: 20},
    {count: 30},
    {count: 5},
]);

console.log(viewElements.collection);
//Prints:
//[{count: 0}]

data.count = 10;

console.log(viewElements.collection);
//Prints:
//[{count: 0}, {count: 10}, {count: 5}]
```
