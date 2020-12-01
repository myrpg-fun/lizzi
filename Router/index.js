/**
 * Copyright (c) Stanislav Shishankin
 *
 * This source code is licensed under the MIT license.
 */

const {Event} = require('../Event');

class Route{
    static trimPath(path){
        return path.trim().replace(/[\/\\]+/g, '/').replace(/^\/+|\/+$/g, '');
    }
    
    __match(regexp){
        return regexp;
    }
    
    __exact(regexp){
        return '^'+regexp+'$';
    }
    
    getRegexp(route){
        let result = route.matchAll(/::|\\:|[:?](\w+)|\*\*|\*|[.()\\\/+{}^$?]|([^:.()\\\/+{}^$?*]+)/gmu);
        
        let regexp = '';
        let params = [];
        
        for (let r of result){
            if(r[1] !== undefined){
                regexp += '([\\p{L}\\p{N}:+%_-]+)';
                params.push(r[1]);
            }else if(r[2] !== undefined){
                regexp += r[2];
            }else if (r[0] === '*'){
                regexp += '[^./]+';
            }else if (r[0] === '**'){
                regexp += '.*';
            }else{
                regexp += '\\'+r[0];
            }
        }
        
        return { params, 
            regexp: new RegExp(this.__match(regexp), 'mu'), 
            exact: new RegExp(this.__exact(regexp), 'mu') 
        };
    }
    
    async runMatch(route){
        let exact = this.exact.test(route);
        
        let match = route.match(this.regexp);
        
//        console.log(route, this.route, this.regexp, match, exact);
        
        if (match !== null){
/*            if (!this.match){
                //run one time
                this.match = false;*/
                let params = {};
                for (let k in this.params){
                    params[this.params[k]] = match[k*1+1];
                }

                if (typeof this.listener === 'function'){
                    await this.listener.call(this.self, params, this);
                }
//            }
        }/*else{
            this.match = false;
        }*/
        
        return exact;
    }
    
    runWildCard(){}
    
    add(route, listener, self){
        return this.Router.add(this.route+'/'+this.Router.toUrl(route), listener, self);
    }
    
    exactMatch(route, listener, self){
        return this.Router.exactMatch(this.route+'/'+this.Router.toUrl(route), listener, self);
    }
    
    until(route, listener, self){
        return this.Router.until(this.route+'/'+this.Router.toUrl(route), listener, self);
    }
    
    noMatch(listener, self){
        return this.Router.noMatch(listener, self);
    }
    
    addRoutes(routes){
        for (let route of routes){
            switch (route.type){
                case 'exact':
                    this.exactMatch(route.route, route.controller);
                    break;
                case 'until':
                    this.until(route.route, route.controller);
                    break;
                case 'nomatch':
                    this.noMatch(route.controller);
                    break;
                default: 
                    this.add(route.route, route.controller);
                    break;
            }
        }
    }
        
    constructor(router, route, listener, self){
        this.Router = router;
        this.listener = listener;
        this.self = self;
        this.route = Route.trimPath(route);
//        this.match = false;
    }
}

class RouteFromStart extends Route{
    __match(regexp){
        return '^'+regexp;
    }
    
    constructor(router, route, listener, self){
        super(router, route, listener, self);
        
        let p = this.getRegexp(route);

        this.regexp = p.regexp;
        this.exact = p.exact;
        this.params = p.params;
    }
}

class RouteUntilEnd extends Route{
    __match(regexp){
        return regexp+'$';
    }
    
    constructor(router, route, listener, self){
        super(router, route, listener, self);
        
        let p = this.getRegexp(route);

        this.regexp = p.regexp;
        this.exact = p.exact;
        this.params = p.params;
    }
}

class RouteExactMatch extends Route{
    __match(regexp){
        return '^'+regexp+'$';
    }
    
    constructor(router, route, listener, self){
        super(router, route, listener, self);
        
        let p = this.getRegexp(route);

        this.regexp = p.regexp;
        this.exact = p.exact;
        this.params = p.params;
    }
}

class RouteNoMatch extends Route{
    async runMatch(route){
        return false;
    }
    
    runWildCard(){
        this.listener.call(this.self, this);
    }
    
    constructor(router, listener, self){
        super(router, '', listener, self);
    }
}

class Router extends Event{
    __zzAddRoute(newRoute){
        this.routes.push(newRoute);

        if (this.routeQueue.length === 0){
            //start from last one
            this.__zzOnRoute(this.routes.length - 1);
        }
        
        return newRoute;
    }

    exactMatch(route, fn, self){
        return this.__zzAddRoute(
            new RouteExactMatch(this, this.toUrl(route), fn, self)
        );
    }

    add(route, fn, self){
        if (typeof route === 'function'){
            return this.__zzAddRoute(
                new RouteNoMatch(this, route, fn)
            );
        }
        
        return this.__zzAddRoute(
            new RouteFromStart(this, this.toUrl(route), fn, self)
        );
    }

    addRoutes(routes){
        for (let route of routes){
            switch (route.type){
                case 'exact':
                    this.exactMatch(route.route, route.controller);
                    break;
                case 'until':
                    this.until(route.route, route.controller);
                    break;
                case 'nomatch':
                    this.noMatch(route.controller);
                    break;
                default: 
                    this.add(route.route, route.controller);
                    break;
            }
        }
    }
        
    until(route, fn, self){
        return this.__zzAddRoute(
            new RouteUntilEnd(this, this.toUrl(route), fn, self)
        );
    }

    noMatch(fn, self){
        return this.__zzAddRoute(
            new RouteNoMatch(this, fn, self)
        );
    }

    change(fn, self){
        return this.on('change', fn, self);
    }

    async __zzRun(route, index){
        for (let i = index; i < this.routes.length; i++){
            this.isExact |= await this.routes[i].runMatch(route);
        }
        
        if (!this.isExact){
            //no exact path, run wildcard ways
            for (let i = index; i < this.routes.length; i++){
                await this.routes[i].runWildCard();
            }
        }
    }

    async __zzOnRoute(index){
        index || (index = 0);
        
        let url = this.toUrl( decodeURI( window.location.pathname ) );
        let idx = this.routeQueue.indexOf(url);
        if (idx === -1){
            this.routeQueue.push( url );
        
            if (this.routeQueue.length === 1){
                do{
                    this.isExact = false;
                    
                    this.path = '/'+this.routeQueue[0];
                    
                    this.emit('change', this.routeQueue[0]);
                    
                    await this.__zzRun( this.routeQueue[0], index );

                    this.emit('after-change', this.routeQueue[0]);
                    //always remove after run
                    this.routeQueue.shift();
                }while(this.routeQueue.length > 0);
            }
        }
    }

    toUrl(route){
        if (Array.isArray(route)){
            route = route.map(function(route){
                if (route instanceof Route){
                    route = route.route;
                }
                
                if (typeof route === 'string' || typeof route === 'number'){
                    return route;
                }

                return '';
            }).join('/');
        }
        
        if (typeof route === 'string'){
            return Route.trimPath( route );
        }
        
        return '';
    }

    go(url){
        this.state = {url: url};
        window.history.pushState(this.state, '', '/'+this.toUrl(url));
        this.__zzOnRoute();
    }

    setState(object){
        for (let name in object){
            this.state[name] = object[name];
        }
        
        window.history.replaceState(this.state, '', window.location.href);
    }

    constructor(){
        super();
        
        this.routes = [];
        this.routeQueue = [];
        this.isExact = false;
        
        window.addEventListener('popstate', (event) => {
            this.state = event.state;
            this.__zzOnRoute();
        });
        this.path = '/'+this.toUrl(window.location.pathname);
        
        this.state = {};
        this.setState({url: window.location.pathname});
    }
};

module.exports = {Router: new Router};