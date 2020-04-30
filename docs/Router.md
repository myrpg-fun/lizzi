## Router
`app.js`
```javascript
const {MainApp} = require('lizzi/Field/MainApp');
const {Router} = require('lizzi/Router');

class MyApp extends MainApp{
    constructor(){
        super();
        
        //route /admin
        Router.on(['admin'], () => import('./admin.js').then(app => this.app = app.default.createField()));
        //route /
        Router.on([], () => import('./index.js').then(app => this.app = app.default.createField()));
        //route * -> 404
        Router.wildcard(() => import('./404/index.js').then(app => this.app = app.default.createField()));
    }
};

exports default new MyApp;
```

`admin.js`
```javascript
//...
import AdminUsers from './adminUsers';
//...

class AdminPage extends Data{
    createField(){
        return new Field(T.find('#admin'), this)
            .fieldData('.page', this.ref('page'), 'createField');
    }
    
    constructor(){
        super({ page: null });
        
        //route /admin
        Router.on(['admin'], () => this.page = new AdminSelectPage);
        //route /admin/Goods
        Router.on(['admin', 'goods'], () => this.page = new AdminGoods);
        //route /admin/Colors
        Router.on(['admin', 'colors'], () => this.page = new AdminColors);
        //route /admin/Users
        Router.on(['admin', 'users'], () => this.page = new AdminUsers);
        
    }
};

export default new AdminPage;
```

`adminUsers.js`
```javascript
//...
class AdminUsers extends Collection{
    createField(){
        return new Field(T.find('#admin'), this)
            //...
            .fieldData('.userEditor', this.ref('user'), 'createField');
    }
    
    constructor(){
        super({ userEditor: null });
        
        //route /admin/users/1
        Router.on(['admin', 'users', ':id'], (p) => this.user = this.find(u => u.id === p.id));
    }
};

export default new AdminPage;
```

