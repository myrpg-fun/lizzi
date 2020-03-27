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
#### Event.on(_string_ name, _function_ listener[, _object_ self]);
#### Event.on(`string` name, `function` listener[, `object` self]);
* __Returns:__ \<EventListener>
  
Adds the _listener_ function to the end of the listeners for the event named by _name_.

#### Event.off(eventListener);
#### Event.off([name][, function][, self]);
* _eventListener_ \<EventListener> listener object
* _name_ \<string> | \<symbol> the name of the event
* _listener_ \<Function> the callback function instance
* _self_ \<object> this parameter to the callback function

Remove all specified event listeners from class by eventListener or name or function or by self.

