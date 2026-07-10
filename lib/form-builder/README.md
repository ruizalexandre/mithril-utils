# FormBuilder

`FormBuilder` builds a Mithril.js form from a declarative schema. A schema is an array of **fields** and **groups**; the builder handles rendering, value binding, and per-field validation. The instance is itself a Mithril component, so you render it with `m(myForm, ...)`.

Every label, value, and error message is rendered as a Mithril vnode, so it is escaped by Mithril — the builder never uses `m.trust`. Passthrough attributes are sanitized (event-handler keys such as `onclick` and non-primitive values are dropped) and the field `type` is checked against a whitelist, so untrusted schema data cannot inject markup or handlers.

## Basic usage

```javascript
import m from 'mithril';
import { FormBuilder } from '@ruizalexandre/mithril-utils';

const myForm = new FormBuilder([
  {
    class: 'flex-layout',
    label: 'Global information',
    group: [
      { type: 'text', name: 'firstname', placeholder: 'Firstname' },
      { type: 'text', name: 'lastname', placeholder: 'Lastname' },
    ],
  },
  {
    type: 'number',
    name: 'age',
    placeholder: 'Age',
    validation: [
      (value) => {
        if (value >= 18) {
          return { error: null };
        }
        return { error: 'You are not major', class: 'error-input' };
      },
    ],
  },
  { type: 'submit', label: 'Send' },
]);

m.mount(document.querySelector('#app'), {
  view: () => m(myForm, { onSubmit: (values) => console.log(values) }),
});
```

Submitting the form (via the `submit` field or the Enter key) runs every validator; `onSubmit` is called with the collected values only when the form is valid.

## Schema

### Fields

A field is any entry with a `type`. Recognized types: `text`, `password`, `email`, `number`, `tel`, `url`, `search`, `date`, `datetime-local`, `month`, `week`, `time`, `color`, `range`, `hidden`, `textarea`, `select`, `checkbox`, `radio`, `submit`.

| Key            | Description                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------- |
| `type`         | Required. One of the types above.                                                             |
| `name`         | Key under which the value is stored. Falls back to `id`, then to a generated index.           |
| `label`        | Text rendered in a `<label>` (a `<span>` for `radio`).                                         |
| `defaultValue` | Initial value.                                                                                |
| `class`        | Class applied to the control.                                                                 |
| `options`      | For `select` and `radio`: an array of strings or `{ value, label }` objects.                  |
| `validation`   | Array of validators (see below).                                                              |
| _other keys_   | Passed through as DOM attributes (`placeholder`, `required`, `min`, `max`, `pattern`, `id`…). |

### Groups

An entry with a `group` array is rendered as a `<fieldset>` (with a `<legend>` when `label` is set):

```javascript
{
  class: 'flex-layout',
  label: 'Address',
  group: [
    { type: 'text', name: 'street', placeholder: 'Street' },
    { type: 'text', name: 'city', placeholder: 'City' },
  ],
}
```

### Options (`select`, `radio`)

```javascript
{
  type: 'select',
  name: 'country',
  label: 'Country',
  options: ['France', { value: 'be', label: 'Belgium' }],
}
```

## Validation

A validator is `(value, values) => ({ error, class? })`. Return `{ error: null }` when the value is valid, otherwise a message (and optionally a class applied to the control). Validators run on blur, then again on every submit. `values` gives access to the whole form for cross-field rules.

```javascript
{
  type: 'password',
  name: 'confirm',
  validation: [
    (value, values) => (value === values.password ? { error: null } : { error: 'Passwords differ' }),
  ],
}
```

## Reading and driving the form

The instance keeps its own state:

```javascript
myForm.getValues(); // { firstname: '…', age: 20, … }
myForm.getValue('age'); // 20
myForm.setValues({ firstname: 'Toto' });
myForm.validate(); // runs every validator, returns a boolean, shows errors
myForm.isValid(); // non-mutating validity check
myForm.reset(); // back to default values
```

## Styling hooks

The builder emits these classes so you can style without touching markup:

- `.fb-field` — wrapper around a label + control (+ `.fb-field--error` when invalid)
- `.fb-label` — heading of a `radio` group
- `.fb-error` — the error message
- `.fb-group` — a `<fieldset>` group
- `.fb-radio-group` / `.fb-radio` — a radio group and each of its options
