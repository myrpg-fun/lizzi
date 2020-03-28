# lizzi
Node and Javascript lizzi (reactive) library.

## Reactive

### Class: Data
_This class inherits from the [Event](#class-event) class._

`Data.set({ ... });` register reactive variable and set values.

Events `set`, `set:name` emit on change any registered variable.
* `name` is name of variable
* `value` is current value
* `last` is old value
* `target` is Data instance

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

Event `set-values` emit one time after script ends.
* `values` is changed values
* `target` is Data instance

```javascript
class userSettings extends Data{
    saveToDB(db){
        this.on('set-values', function(ev){
            console.log('lazy save values one time', this.values());
            console.log('changed only', ev.values);
            db.update(this.values());
        })
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

`Data.unset(name);` unregister and remove variable. Emit `remove-value`:
* `name` is name of variable
* `value` is last value of variable
* `target` is Data instance

`Data.ref(name);` get [zzDataRef](#class-zzdataref) by `name`.

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

### Class: Collection
_This class inherits from the [Event](#class-event) class._

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

### Class: CollectionFilter
CollectionFilter used for sort and filter elements in [Collections](#class-collection).
#### Set in and out collections
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

data.count = 10;

console.log(viewElements.collection);
//Prints:
//[{count: 0}, {count: 10}, {count: 5}]
```

## Events
Much of the lizzi.js API is built around an idiomatic asynchronous event-driven architecture.

> For instance: a [Data](class-data) object emits an event each time when data value is changed; a [Collections](#class-collection) emits an event when data added to collection; removed from etc.

All objects that emit events are instances of the [Event](#class-event) class.

When the Event object emits an event, all of the functions attached to that specific event are called synchronously.

### Passing arguments and this to listeners
The Event.emit() method allows an arbitrary set of arguments to be passed to the listener functions. Keep in mind that when an ordinary listener function is called, the standard this keyword is intentionally set to reference the EventEmitter instance to which the listener is attached.

```javascript
class MyEmitter extends Event{}

const myEmitter = new MyEmitter();

myEmitter.on('event', function(a, b) {
    console.log(a, b, this, this === myEmitter);
});

myEmitter.emit('event', 'a', 'b');
// Prints: 
// a b myEmitter { ... } true

class OtherClass{
    whenEvent(a, b){
        console.log(a, b, this, this === OtherClass);
    }

    constructor(Emitter){
        Emitter.on('event', this.whenEvent, this);
    }
}

new OtherClass(myEmitter);

myEmitter.emit('event', 'x', 'y');
// Prints: 
// a b myEmitter { ... } true
// x y OtherClass { ... } true
```

### Class: Event
#### Adding events
`Event.on(name or [...array of names], listener[, self]);` adds the _listener_ function to the end of the listeners for the event named _name_:
* `name` is string name of event
* `listener` is function callback
* `self` is this parameter to the callback function
* Returns: [EventListener](#class-eventlistener)

`Event.once(name or ...array, listener[, self]);`  adds **one-time** _listener_ function for the event named _name_. The next time eventName is triggered, this listener is removed and then invoked.

`Event.prependListener(name or ...array, listener[, self]);` adds the _listener_ function to the **begining** of the listeners for the event named by _name_.

`Event.prependOnceListener(name or ...array, listener[, self]);` adds **one-time** _listener_ function to the **begining** of the listeners for the event named by _name_.

#### Removing events
`Event.off(eventListener);` removes current _eventListener_ from class.

`Event.off(name or ...array[, listener][, self]);` find and remove all `name` event listeners from class filtered by `function` or by `self`.

`Event.off([listener][, self]);` find and remove all specified event listeners from class by `function` or by `self`.

#### Emitting event
`Event.emit(name[, ...arguments]);` synchronously calls each of the listeners registered for the event named `name`, in the order they were registered, passing the supplied `arguments` to each.

#### Enabling and disabling event
`Event.enable(name[, ...arguments]);` synchronously calls each of the listeners registered for the event named `name`. After event enabled, new events listeners will called instantly after add, passing the supplied `arguments` to each.

`Event.disable(name[, ...arguments]);` disables event.

`Event.isEnabled(name);` returns true, if event enabled.

```javascript
class ServerConnection extends Event{
    startConnection(){
        ...
        socket.on('open', function(){
            this.enable('connected', socket);
        }.bing(this));
        
        socket.on('close', function(){
            this.disable('connected');
        }.bing(this));
        ...
    }
}

const connection = new ServerConnection();

connection.on('connected', function(socket) {
    console.log('Connection is ready');
});
//connected will emit only when connection is opened (on connection after or if connected before)
```

### Class: EventListener
#### Remove listener
`EventListener.off();` removes current _eventListener_ from class.

### Class: EventStack
#### Add listeners to group
`EventStack.add([eventListener, ...]);` add current _eventListener_ to group stack.

#### Clear all listeners in group
`EventStack.removeAll();` off all _eventListeners_ in group stack.
