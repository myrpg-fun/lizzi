# lizzi
Node and Javascript lizzi (react) framework

## Events
Much of the lizzi.js API is built around an idiomatic asynchronous event-driven architecture.

> For instance: a **Data** object emits an event each time when data value is changed; a **Collection** emits an event when data added to collection; removed from etc.

All objects that emit events are instances of the Event class.

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
`Event.on(_name_ or _[...array of names]_, _listener_[, _self_]);` adds the _listener_ function to the end of the listeners for the event named _name_:
* `name` is string name of event
* `listener` is function callback
* `self` is this parameter to the callback function
* Returns: \<EventListener> is listener instance

`Event.once(_name_ or _[...array of names]_, _listener_[, _self_]);`  adds **one-time** _listener_ function for the event named _name_. The next time eventName is triggered, this listener is removed and then invoked.

`Event.prependListener(_name_ or _[...array of names]_, _listener_[, _self_]);` adds the _listener_ function to the _begining_ of the listeners for the event named by _name_.

`Event.prependOnceListener(_name_ or _[...array of names]_, _listener_[, _self_]);` adds **one-time** _listener_ function to the _begining_ of the listeners for the event named by _name_.

#### Removing events
`Event.off(eventListener);` removes current _eventListener_ from class.

`Event.off(_name_ or _[...array of names]_[, listener][, self]);` find and remove all `name` event listeners from class filtered by `function` or by `self`.

`Event.off([listener][, self]);` find and remove all specified event listeners from class by `function` or by `self`.

#### Emitting event


### Class: EventListener
#### Remove this listener
`EventListener.off();` removes current _eventListener_ from class.
