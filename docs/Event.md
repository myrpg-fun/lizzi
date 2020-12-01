## Events Engine
```javascript
let {Event, EventStack} = require('lizzi/event');
```

Much of the lizzi.js API is built around an idiomatic asynchronous event-driven architecture.

> For instance: a [Data](./Lizzi.md#class-data) object emits an event each time when data value is changed; a [Collections](./Lizzi.md#class-collection) emits an event when data added to collection; removed from etc.

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
        console.log(a, b, this, this instanceof OtherClass);
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
`Event.on(name, listener[, self]);` adds the _listener_ function to the end of the listeners for the event named _name_:
* `name` is string name of event
* `listener` is function callback
* `self` is this parameter to the callback function
* Returns: [EventListener](#class-eventlistener)

`Event.once(name, listener[, self]);`  adds **one-time** _listener_ function for the event named _name_. The next time eventName is triggered, this listener is removed and then invoked.

`Event.prependListener(name, listener[, self]);` adds the _listener_ function to the **begining** of the listeners for the event named by _name_.

`Event.prependOnceListener(name, listener[, self]);` adds **one-time** _listener_ function to the **begining** of the listeners for the event named by _name_.

#### Removing events
`Event.off(name[, listener][, self]);` find and remove all `name` event listeners from class filtered by `function` and/or by `self`.

`Event.off(listener[, self]);` find and remove all specified event listeners from class by `listener` function and by `self`.

`Event.off(self);` find and remove all specified event listeners from class by `self`.

#### Emitting event
`Event.emit(name[, ...arguments]);` synchronously calls each of the listeners registered for the event named `name`, in the order they were registered, passing the supplied `arguments` to each.

### Class: EventListener
`EventListener.off();` removes current _eventListener_ from class.

`EventListener.call(...args);` run current _eventListener_ with arguments.

`EventListener.run([...args]);` run current _eventListener_ with argument array.

```javascript
    // Run listener after it initialize
    emitter.on('set:name', () => this.className = name, this).run();
```
### Class: EventStack
`EventStack.add(eventListener);` add current _eventListener_ to group stack. And run it then with `run` array params.

`EventStack.add(object, eventName, listener[, ...args]);` init _listener_ to _object_ 

EventStack will call `object.on` or `object.addListener` or `object.addEventListener` method and add to group stack.

`EventStack.off();` clear all added event listeners in stack, and clear stack.

```javascript
    let ev = new EventStack();

    //add EventListener to stack
    ev.add( object.on('event', function(){/*...*/}, this) );
    
    //add Event to stack
    ev.add( object, 'event', function(){/*...*/}, this);

    //init window.addEventListener('resize', function(){...}, false) and add to stack
    ev.add( window, 'resize', function(){/*...*/}, false);

    //remove all listeners
    ev.off();
```

### Function Event.Defer
`Event.Defer(listener[, time])` emit once _listener_ after many emits by timeout.

```javascript
    //run once listener after all 'change' events emit
    data.on('change', Event.Defer(function(){/*...*/}), this) );

    //run once listener after all 'change' events emit, waited 1 second
    data.on('change', Event.Defer(function(){/*...*/}, 1000), this) );
```

### Function Event.avoid
`EventAvoid.avoid(listener, ...runners)` call _listener_ in event, but avoid call _listener_ if runners is running already.

```javascript
    let onReceive = Event.AvoidRunner();
    
    //If new data received from server, avoid send data changes back
    data.on('change', Event.avoid(() => {
        socket.emit('data-change', data.values());
    }, onReceive), this);

    //On receive new data from server, change data values
    socket.on('data-change', Event.avoid(values => {
        data.update(values);
    }, onReceive), this);
```
