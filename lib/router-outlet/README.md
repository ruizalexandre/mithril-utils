# RouterOutlet

This component `RouterOutlet` is used to render the current route's component in Mithril.js. It listens for route changes and updates the displayed component accordingly.

```javascript
import m from 'mithril';
import { loadComponent, RouterOutlet } from '@ruizalexandre/mithril-utils';

// Declare your mithril router (here we create an unique ID for the router outlet)
const ROUTER_OUTLET_ID = 'router-outlet-0';

// A basic application with a router outlet
export const App = {
  view: function (vnode) {
    return m('.app', [
      // Add your header or navigation here
      m(RouterOutlet, { id: vnode.attrs.routerId }),
      // Add your footer or other components here
    ]);
  },
};

m.render(document.querySelector('#app'), m(App, { routerId: ROUTER_OUTLET_ID }));

m.route(document.getElementById(ROUTER_OUTLET_ID), '/', {
  '/': loadComponent(() => import('./pages/home/home.page').then(({ HomePage }) => HomePage)),
  '/about': loadComponent(() => import('./pages/about/about.page').then(({ AboutPage }) => AboutPage)),
  '/:default': loadComponent(() =>
    import('./pages/page-not-found/page-not-found.page').then(({ PageNotFound }) => PageNotFound),
  ),
});
```
