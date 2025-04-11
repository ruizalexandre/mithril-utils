"use strict";

export function loadComponent(componentPromise, loadingComponent) {
  if (typeof componentPromise !== "function") {
    throw new Error(
      "[loadComponent] componentPromise must be a function that returns a Promise",
    );
  }

  if (
    loadingComponent &&
    typeof loadingComponent !== "function" &&
    typeof loadingComponent !== "object"
  ) {
    throw new Error(
      "[loadComponent] loadingComponent must be a function or an object",
    );
  }

  if (loadingComponent) {
    return {
      onmatch: componentPromise,
      render: function (vnode) {
        if (vnode) {
          return vnode;
        }

        return m(loadingComponent);
      },
    };
  }

  return { onmatch: componentPromise };
}

export default loadComponent;