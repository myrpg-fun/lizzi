const path = require('path');

class Route{
    run(routes){
        let params = {};
        for (let k in this.routes){
            let r = this.routes[k];
            if (r){
                params[r.name] = routes[k].substring(r.index);
            }
        }
        
        this.fn.call(this.self, params);
    }
    
    __remapRoutes(name){
        let i = name.indexOf(':');
        if (i !== -1 && name.length > i+1){
            return {
                index: i,
                name: name.substring(i+1)
            };
        }
        
        return null;
    }
    
    constructor(routes, fn, self){
        this.routes = routes.map(this.__remapRoutes);
        this.fn = fn;
        this.self = self;
    }
}

class Router{
    trimPath(path){
        return path.trim().replace(/[\/\\]+/g, '/').replace(/^\/+|\/+$/g, '');
    }

    __zzFindRoute(routes){
        let cr = this.routes;
        for (let name of routes){
            if (cr.routes[name]){
                cr = cr.routes[name];
            }else{
                //check :id
                let find = false;
                for (let i in cr.routes){
                    let route = cr.routes[i];
                    
                    if (route.param && name.substring(0, route.name.length) === route.name){
                        cr = cr.routes[name];
                        find = true;
                        break;
                    }
                }
                
                if (!find){
                    return this.wc;
                }
            }
        }
        
        return cr;
    }

    __zzCreateRoute(routes){
        let cr = this.routes;
        for (let name of routes){
            name = name.trim();
            
            let param = false;
            let i = name.indexOf(/[:?*]/);
            if (i !== -1){
                name = name.substring(0, i);
                param = true;
            }
            
            if (cr.routes[name] === undefined){
                cr.routes[name] = {
                    name: name,
                    param: param,
                    routes: {},
                    listeners: []
                };
            }
            
            cr = cr.routes[name];
        }
        
        return cr;
    }

    __zzAddToRoute(route, routes, fn, self){
        let r = new Route(routes, fn, self);
        route.listeners.push(r);
        
        let routeArr = this.toRoute( window.location.pathname );
        if (route === this.__zzFindRoute( routeArr )){
            this.current = route;
            
            r.run( routeArr ); 
        }
    }

    on(routes, fn, self){
        routes = this.toRoute(routes);
        
        this.__zzAddToRoute( this.__zzCreateRoute(routes), routes, fn, self );
        
        return this;
    }

    wildcard(fn, self){
        this.__zzAddToRoute( this.wc, [], fn, self );
        
        return this;
    }

    __zzOnRoute(event){
        let routeArr = this.toRoute( window.location.pathname );
        let route = this.__zzFindRoute( routeArr );
        
        this.current = route;

        for (let ev of route.listeners){
            ev.run( routeArr );
        }
    }

    toRoute(url){
        if (typeof url === 'string'){
            url = this.trimPath(url).split('/');
        }
        
        if (Array.isArray(url)){
            return url.map(u => u.trim()).filter(u => typeof u === 'string' && u !== '');
        }
        
        return [];
    }

    toUrl(route){
        if (Array.isArray(route)){
            route = route.join('/');
        }
        
        if (typeof route === 'string'){
            return route;
        }
        
        return '';
    }

    go(url){
        window.history.pushState({url: url}, '', this.toUrl(url));
    }

    constructor(){        
        this.routes = {
            name: '',
            param: false,
            routes: {},
            listeners: []
        };
        
        this.wc = {
            name: '**',
            param: false,
            routes: {},
            listeners: []
        };
        
        this.current = null;
        
        window.addEventListener('popstate', this.__zzOnRoute.bind(this));
        let url = this.toUrl(window.location.pathname);
        window.history.replaceState({url: window.location.href}, '', window.location.href);
        this.__zzOnRoute();
    }
};

module.exports = {Router: new Router};