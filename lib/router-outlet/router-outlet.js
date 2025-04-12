import m from "mithril";

"use strict";

export const RouterOutlet = {
  view: function (vnode) {
    const id = vnode.attrs.id;
    return m("div", { id }, '');
  }
};