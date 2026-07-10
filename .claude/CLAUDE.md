# mithril-utils

Librairie d'utilitaires pour enrichir [Mithril.js](https://mithril.js.org/). Publiée sur npm sous `@ruizalexandre/mithril-utils`.

## Objectifs du projet

Trois contraintes structurantes, dans cet ordre :

1. **JavaScript pur.** Pas de TypeScript à la compilation. Le code source est du JS ESM qui est publié tel quel, sans build. Les types sont fournis par des fichiers `.d.ts` écrits à la main, à côté de chaque implémentation.
2. **Tree-shakable.** Un consommateur qui n'importe que `loadComponent` ne doit pas embarquer `RouterOutlet` dans son bundle. Cela impose : uniquement des exports nommés, aucun effet de bord au chargement d'un module, une utilité par dossier.
3. **Mithril reste une peer dependency.** La librairie ne bundle jamais Mithril, elle s'y greffe.

## Structure

```
index.js              # barrel : re-exporte chaque utilitaire
index.d.ts            # miroir de index.js pour les types
lib/
  load-component/
    load-component.js     # implémentation
    load-component.d.ts   # types, écrits à la main
    README.md             # doc utilisateur avec exemples
  router-outlet/
    router-outlet.js
    router-outlet.d.ts
    README.md
README.md             # doc racine, renvoie vers les README de chaque lib
```

Une utilité = un dossier sous `lib/` = trois fichiers (`.js`, `.d.ts`, `README.md`). Le nom du dossier et celui des fichiers sont identiques, en kebab-case.

## Les utilitaires actuels

**`loadComponent(componentPromise, loadingComponent?)`** — construit un `m.RouteResolver` qui charge un composant de façon paresseuse via un `import()` dynamique. Le premier argument est une *fonction* qui retourne une Promise (pas une Promise), utilisée comme `onmatch`. Le second, optionnel, est un composant affiché pendant le chargement ; s'il est fourni, un `render` est ajouté au resolver.

**`RouterOutlet`** — composant Mithril qui rend un `<div>` portant un `id` donné, destiné à servir de cible à `m.route()`. L'application est montée avec `m.render`, puis `m.route` cible le div par son id.

## Ajouter un utilitaire

1. Créer `lib/<nom>/` avec `<nom>.js`, `<nom>.d.ts` et `README.md`.
2. Dans le `.js` : un **export nommé** (`export const X` ou `export function x`). Ne pas exécuter de code au niveau module — pas de `document.getElementById`, pas d'abonnement, pas de mutation globale à l'import. C'est ce qui casse le tree-shaking.
3. Dans le `.d.ts` : les types doivent décrire la **signature réelle du JS**, pas l'intention. Ils ne sont vérifiés par rien, donc ils dérivent silencieusement.
4. Re-exporter depuis `index.js` **et** `index.d.ts` (les deux fichiers sont maintenus en parallèle, à la main).
5. Le `README.md` de la lib contient un exemple d'usage complet et copiable. Ajouter un renvoi dans le `README.md` racine.

Une utilité qui a besoin de Mithril fait `import m from "mithril"`. C'est une peer dependency : elle est résolue chez le consommateur, jamais bundlée.

## Commandes

```bash
npm run format   # prettier --write sur lib/**/*.{ts,js}
npm run lint     # tslint -p tsconfig.json
```

Le versioning passe par `npm version <patch|minor|major>`, qui enchaîne automatiquement `preversion` (lint) → bump → `version` (format + `git add -A lib`) → `postversion` (`git push && git push --tags`). Ne pas bumper la version à la main dans `package.json`.

Il n'y a **pas de suite de tests** ni de script de build. `prepublishOnly` ne lance que le lint.

## Ce qui est publié

`.npmignore` exclut `tsconfig.json`, `tslint.json`, `.prettierrc`, `coverage`, `__tests__` et `node_modules`. Le paquet contient donc `index.js`, `index.d.ts`, tout `lib/` (y compris les `.d.ts` et les `README.md`) et le `README.md` racine.

## Pièges connus

Ces points sont des dettes réelles du dépôt, pas des choix. Les avoir en tête avant de toucher au code.

- **`tsconfig.json` et `tslint.json` sont vestigiaux.** Le `include` de `tsconfig.json` pointe vers `subscribe` et `listen`, deux dossiers qui n'existent pas ; `outDir` vaut `lib`, ce qui écraserait les sources si une compilation était réellement lancée. `npm run lint` ne couvre donc rien. tslint est par ailleurs déprécié depuis 2019.
- **`package.json` ne déclare ni `"type": "module"`, ni `"sideEffects": false`, ni de champ `"exports"`.** Le code est de l'ESM, mais `main` pointe vers `index.js` sans que le paquet soit marqué comme module. Les bundlers (Vite, webpack, Rollup) s'en sortent en détectant la syntaxe ; un `require()` ou un `import` direct depuis Node échoue. Et sans `"sideEffects": false`, les bundlers ne peuvent pas garantir l'élagage — autrement dit, l'objectif « tree-shakable » n'est aujourd'hui tenu qu'à moitié.
- **`load-component.js` appelle `m(loadingComponent)` sans importer `mithril`.** Le chemin avec composant de chargement lève une `ReferenceError` à l'exécution.
- **`load-component.d.ts` annonce `componentPromise: Promise<T>`** alors que l'implémentation exige une fonction retournant une Promise (elle lève sinon). Le type est faux.
- **`router-outlet.js` mélange l'état du vnode et celui du composant** : `oninit` écrit dans `vnode.state.elementId`, mais `element()` lit `RouterOutlet.elementId`, qui reste à `null`. Il reste aussi un `console.log(this)` de debug.
- **Le `README.md` racine annonce `version: 0.0.1`** alors que `package.json` est à `0.0.8`. Ce numéro n'est pas mis à jour par le flux `npm version`.
- **`mithril` et `@types/mithril` sont épinglés** (`2.3.8`, `2.2.7`, sans `^`). Un consommateur sur une autre version mineure de Mithril 2 verra un avertissement de peer dependency.

## Conventions d'écriture

- Prettier : `printWidth: 120`, `singleQuote: true`, `trailingComma: "all"`. Le code existant n'est pas toujours conforme (guillemets doubles dans `lib/`) ; `npm run format` le corrige.
- Les erreurs de validation d'arguments sont levées avec un préfixe entre crochets nommant l'utilitaire : `throw new Error("[loadComponent] ...")`.
- La documentation utilisateur est en anglais. Les messages de commit suivent le format `type: description` (`feat:`, `chore:`).
