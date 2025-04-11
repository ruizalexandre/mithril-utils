import m from "mithril";

export function loadComponent<T = m.Component | m.ClassComponent>(
  componentPromise: Promise<T>,
  loadingComponent?: m.Component | m.ClassComponent,
): m.RouteResolver;
