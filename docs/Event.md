## Events Engine
```javascript
let {Event, EventListener, EventStack, EventAfterAll} = require('lizzi/event');
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

`EventListener.addToStack(eventStack);` add current  _eventListener_ to [EventStack](#class-eventstack).

### Class: EventStack
#### Add listeners to group
`EventStack.add([eventListener, ...]);` add current _eventListener_ to group stack.

#### Clear all listeners in group
`EventStack.removeAll();` off all _eventListeners_ in group stack.
