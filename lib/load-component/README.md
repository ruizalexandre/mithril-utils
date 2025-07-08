# LoadComponent

The function `loadComponent` is used to dynamically load a component in Mithril.js. It takes a promise that resolves to the component and an optional loading component to display while the component is being loaded.

```javascript
import m from 'mithril';
import { loadComponent } from '@ruizalexandre/mithril-utils';

/// Declare your mithril router
m.route(document.getElementById(YOUR_ROOT_ID), '/', {
  '/': loadComponent(() => import('./pages/home/home.page').then(({ HomePage }) => HomePage)),
  '/about': loadComponent(() => import('./pages/about/about.page').then(({ AboutPage }) => AboutPage)),
  '/:default': loadComponent(() =>
    import('./pages/page-not-found/page-not-found.page').then(({ PageNotFound }) => PageNotFound),
  ),
});
```

If you need to display a loading component while the component is being loaded, you can pass it as the second argument:

```javascript
import m from 'mithril';
import { loadComponent } from '@ruizalexandre/mithril-utils';

m.route(document.getElementById(YOUR_ROOT_ID), '/', {
  '/': loadComponent(
    () => import('./pages/home/home.page').then(({ HomePage }) => HomePage),
    () => m('div', 'Loading Home Page...'),
  ),
  '/about': loadComponent(
    () => import('./pages/about/about.page').then(({ AboutPage }) => AboutPage),
    () => m('div', 'Loading About Page...'),
  ),
  '/:default': loadComponent(
    () => import('./pages/page-not-found/page-not-found.page').then(({ PageNotFound }) => PageNotFound),
    () => m('div', 'Loading Page Not Found...'),
  ),
});
```
