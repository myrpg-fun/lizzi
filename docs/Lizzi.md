
# Reactive Engine

```javascript
const {zzReactive, zzAny, zzType, zzNumber, zzInt, zzInteger, zzFloat, zzStr, zzString, zzBool, zzObj, zzObject, zzInstance, zzFunction, zzStringConcat, zzArray, zzArrayFilter, zzModel} = require('lizzi');
```

## Interface: zzReactive
_This class inherits from the [Event](./Event.md#class-event) class._

### Classes: zzAny, zzNumber, zzInt, zzInteger, zzFloat, zzStr, zzString, zzBool, zzObj, zzObject, zzInstance, zzArray, zzArrayInstance
_This classes inherits from the [zzReactive](./Event.md#class-event) class._

```javascript
    //Any type
    let any = new zzAny('test');

    //Number type
    let number = new zzNumber(1);

    //Integer type
    let int = new zzInteger(1);
    let int2 = new zzInt(1); // Alias for zzInteger
    
    //Float type
    let float = new zzFloat(1.0);

    //String type
    let string = new zzString('string');
    let string2 = new zzStr('string'); // Alias for zzString

    //Boolean type
    let bool = new zzBoolean(false);
    let bool2 = new zzBool(false); // Alias for zzBoolean

    //Object type
    let object = new zzObject(null);
    let object2 = new zzObj(null); // Alias for zzObject

    //Instance type
    let object = new zzInstance(null, ClassName);

    //Array type
    let array = new zzArray([]);

    //Array instance type
    let array = new zzArrayInstance([], ClassName);
```
#### Property: value

```javascript
    let number = new zzNumber(1);
    number.value = 10; // set new value
    console.log(number.value); // get value 10

    number.value = 'string'; // throw TypeError
```

#### Event: change
Emit when variable changes

```javascript
    let number = new zzNumber(1);

    number.on('change', () => console.log(number.value));
    //or alias method .change
    number.change(() => console.log(number.value));

    number.value = 10; // log into console 10
    number.value = 30; // log into console 30
```

### Classes: zzArray, zzArrayInstance
_This classes inherits from the [zzReactive](./Event.md#class-event) class._

```javascript
    //Array type
    let array = new zzArray([]);

    //Array instance type
    let array = new zzArrayInstance([], ClassName);
```

#### Method: add
#### Method: remove
#### Method: replace

#### Property: value

```javascript
    let array = new zzArray([]);
    array.value = ['one', 'two']; // replace with new array
    console.log(array.value); // get array ['one', 'two']
```

