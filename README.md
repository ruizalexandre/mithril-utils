# Mithril Utils

`version: 0.0.1`

## Overview

This package provides utility functions and components for Mithril.js applications, including dynamic component loading and a router outlet for rendering current routes.

## Installation

```bash
npm install @ruizalexandre/mithril-utils
```

## Usage

### LoadComponent

The `loadComponent` function is used to dynamically load a component in Mithril.js. It takes a promise that resolves to the component and an optional loading component to display while the component is being loaded.<br />
See the [LoadComponent documentation](lib/load-component/README.md) for more details.

### RouterOutlet

The `RouterOutlet` component is used to render the current route's component in Mithril.js. It listens for route changes and updates the displayed component accordingly.<br />
See the [RouterOutlet documentation](lib/router-outlet/README.md) for more details.
