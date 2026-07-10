import m from 'mithril';

('use strict');

export const RouterOutlet = {
  elementId: null,
  element: () => document.getElementById(RouterOutlet.elementId),
  oninit: function (vnode) {
    vnode.state.elementId = vnode.attrs.id;
    console.log(this);
  },
  view: function (vnode) {
    const id = vnode.attrs.id;
    return m('div', { id }, '');
  },
};
