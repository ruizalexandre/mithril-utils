import m from 'mithril';

// Field types that map to a plain <input>. `type` is whitelisted so an
// unexpected value can never reach the DOM.
const INPUT_TYPES = [
  'text',
  'password',
  'email',
  'number',
  'tel',
  'url',
  'search',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  'color',
  'range',
  'hidden',
];

// Types handled by a dedicated renderer.
const SPECIAL_TYPES = ['textarea', 'select', 'checkbox', 'radio', 'submit'];

const ALLOWED_TYPES = new Set([...INPUT_TYPES, ...SPECIAL_TYPES]);

// Keys consumed by the builder itself: they must not be spread as DOM
// attributes (`id`/`class`/`value` are handled explicitly instead).
const RESERVED_FIELD_KEYS = new Set([
  'type',
  'group',
  'label',
  'validation',
  'options',
  'defaultValue',
  'class',
  'id',
  'value',
]);

function classNames(...parts) {
  const value = parts.filter(Boolean).join(' ');
  return value || undefined;
}

// Only let through primitive, non-handler attributes. This is the core of the
// XSS protection: `on*` keys (which the DOM would turn into inline handlers)
// and functions are dropped, and no arbitrary object reaches an attribute.
function extractProps(entry) {
  const out = {};
  for (const key of Object.keys(entry)) {
    if (RESERVED_FIELD_KEYS.has(key)) continue;
    if (/^on/i.test(key)) continue;
    const value = entry[key];
    if (value === null || value === undefined) continue;
    if (typeof value === 'function') continue;
    if (typeof value === 'object' && key !== 'style') continue;
    out[key] = value;
  }
  return out;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options.map((option) => {
    if (option && typeof option === 'object') {
      const value = String(option.value);
      return { value, label: option.label != null ? String(option.label) : value };
    }
    const value = String(option);
    return { value, label: value };
  });
}

function normalizeType(type) {
  if (type == null) {
    throw new Error('[FormBuilder] a field must declare a "type" (or a "group")');
  }
  if (!ALLOWED_TYPES.has(type)) {
    throw new Error('[FormBuilder] unknown field type "' + type + '"');
  }
  return type;
}

function normalizeFieldEntry(entry, ctx) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('[FormBuilder] each schema entry must be an object');
  }
  const type = normalizeType(entry.type);
  const key = entry.name || entry.id || 'field-' + ctx.n++;
  return {
    kind: type === 'submit' ? 'submit' : 'field',
    type,
    key,
    id: entry.id,
    label: entry.label,
    className: entry['class'],
    options: normalizeOptions(entry.options),
    validation: Array.isArray(entry.validation) ? entry.validation : [],
    defaultValue: entry.defaultValue,
    props: extractProps(entry),
  };
}

function normalizeEntry(entry, ctx) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('[FormBuilder] each schema entry must be an object');
  }
  if (Array.isArray(entry.group)) {
    return {
      kind: 'group',
      id: entry.id,
      label: entry.label,
      className: entry['class'],
      children: entry.group.map((field) => normalizeFieldEntry(field, ctx)),
    };
  }
  return normalizeFieldEntry(entry, ctx);
}

function collectFields(nodes, out) {
  for (const node of nodes) {
    if (node.kind === 'group') {
      collectFields(node.children, out);
    } else if (node.kind === 'field') {
      out.push(node);
    }
  }
}

function isMultiple(node) {
  return node.type === 'select' && !!node.props.multiple;
}

function initialValue(node) {
  const initial = node.defaultValue;
  if (node.type === 'checkbox') {
    return !!initial;
  }
  if (isMultiple(node)) {
    if (Array.isArray(initial)) return initial.map(String);
    return initial != null ? [String(initial)] : [];
  }
  if (node.type === 'number' || node.type === 'range') {
    return initial != null && initial !== '' ? Number(initial) : '';
  }
  return initial != null ? String(initial) : '';
}

/**
 * Builds a Mithril form component from a declarative schema.
 *
 * The instance is itself a Mithril component: render it with
 * `m(myForm, { onSubmit })`. Values, errors and touched state are held on the
 * instance and can be read back with `getValues()` / `validate()`.
 */
export class FormBuilder {
  constructor(schema) {
    if (!Array.isArray(schema)) {
      throw new Error('[FormBuilder] schema must be an array of fields');
    }
    const ctx = { n: 0 };
    this.tree = schema.map((entry) => normalizeEntry(entry, ctx));
    this.fields = [];
    collectFields(this.tree, this.fields);

    this.values = {};
    this.errors = {};
    this.touched = {};
    for (const node of this.fields) {
      this.values[node.key] = initialValue(node);
      this.errors[node.key] = null;
      this.touched[node.key] = false;
    }
  }

  // --- Public API -----------------------------------------------------------

  getValues() {
    return Object.assign({}, this.values);
  }

  getValue(name) {
    return this.values[name];
  }

  setValues(values) {
    if (!values || typeof values !== 'object') return;
    for (const key of Object.keys(values)) {
      if (key in this.values) {
        this.values[key] = values[key];
      }
    }
  }

  validate() {
    let valid = true;
    for (const node of this.fields) {
      this.touched[node.key] = true;
      const error = this.runValidators(node);
      this.errors[node.key] = error;
      if (error) valid = false;
    }
    return valid;
  }

  isValid() {
    return this.fields.every((node) => !this.runValidators(node));
  }

  reset() {
    for (const node of this.fields) {
      this.values[node.key] = initialValue(node);
      this.errors[node.key] = null;
      this.touched[node.key] = false;
    }
  }

  // --- Internal state -------------------------------------------------------

  runValidators(node) {
    if (!node.validation.length) return null;
    const value = this.values[node.key];
    const values = this.getValues();
    for (const validator of node.validation) {
      let result;
      try {
        result = validator(value, values);
      } catch (error) {
        return { message: '[FormBuilder] validator threw: ' + error, class: undefined };
      }
      if (result && result.error) {
        return {
          message: String(result.error),
          class: result.class != null ? String(result.class) : undefined,
        };
      }
    }
    return null;
  }

  validateField(node) {
    this.errors[node.key] = this.runValidators(node);
  }

  setFieldValue(node, value) {
    this.values[node.key] = value;
    if (this.touched[node.key]) {
      this.validateField(node);
    }
  }

  onFieldBlur(node) {
    this.touched[node.key] = true;
    this.validateField(node);
  }

  handleSubmit(onSubmit) {
    const valid = this.validate();
    if (valid && typeof onSubmit === 'function') {
      onSubmit(this.getValues());
    }
  }

  // --- Rendering ------------------------------------------------------------

  readValue(node, event) {
    const el = event.target;
    if (node.type === 'checkbox') return el.checked;
    if (node.type === 'number' || node.type === 'range') {
      return el.value === '' ? '' : Number(el.value);
    }
    if (isMultiple(node)) {
      return Array.from(el.selectedOptions, (option) => option.value);
    }
    return el.value;
  }

  activeError(node) {
    return this.touched[node.key] ? this.errors[node.key] : null;
  }

  baseAttrs(node, controlId, error) {
    return Object.assign({}, node.props, {
      id: controlId,
      class: classNames(node.className, error && error.class),
    });
  }

  renderInput(node, controlId, error) {
    return m(
      'input',
      Object.assign(this.baseAttrs(node, controlId, error), {
        type: node.type,
        value: this.values[node.key],
        oninput: (event) => this.setFieldValue(node, this.readValue(node, event)),
        onblur: () => this.onFieldBlur(node),
      }),
    );
  }

  renderTextarea(node, controlId, error) {
    return m(
      'textarea',
      Object.assign(this.baseAttrs(node, controlId, error), {
        value: this.values[node.key],
        oninput: (event) => this.setFieldValue(node, event.target.value),
        onblur: () => this.onFieldBlur(node),
      }),
    );
  }

  renderCheckbox(node, controlId, error) {
    return m(
      'input',
      Object.assign(this.baseAttrs(node, controlId, error), {
        type: 'checkbox',
        checked: !!this.values[node.key],
        onchange: (event) => this.setFieldValue(node, event.target.checked),
        onblur: () => this.onFieldBlur(node),
      }),
    );
  }

  renderSelect(node, controlId, error) {
    const multiple = isMultiple(node);
    const selected = this.values[node.key];
    return m(
      'select',
      Object.assign(this.baseAttrs(node, controlId, error), {
        value: multiple ? undefined : selected,
        onchange: (event) => this.setFieldValue(node, this.readValue(node, event)),
        onblur: () => this.onFieldBlur(node),
      }),
      node.options.map((option) =>
        m(
          'option',
          {
            value: option.value,
            selected: multiple ? selected.indexOf(option.value) !== -1 : undefined,
          },
          option.label,
        ),
      ),
    );
  }

  renderRadio(node, controlId, error) {
    const name = node.props.name || node.key;
    return m(
      'div',
      { class: classNames('fb-radio-group', error && error.class), role: 'radiogroup' },
      node.options.map((option, index) => {
        const optionId = controlId + '-' + index;
        return m('label', { for: optionId, class: 'fb-radio' }, [
          m('input', {
            type: 'radio',
            id: optionId,
            name,
            value: option.value,
            checked: this.values[node.key] === option.value,
            onchange: () => this.setFieldValue(node, option.value),
            onblur: () => this.onFieldBlur(node),
          }),
          option.label,
        ]);
      }),
    );
  }

  renderControl(node, controlId, error) {
    switch (node.type) {
      case 'textarea':
        return this.renderTextarea(node, controlId, error);
      case 'select':
        return this.renderSelect(node, controlId, error);
      case 'checkbox':
        return this.renderCheckbox(node, controlId, error);
      case 'radio':
        return this.renderRadio(node, controlId, error);
      default:
        return this.renderInput(node, controlId, error);
    }
  }

  renderField(node) {
    if (node.kind === 'submit') {
      return m(
        'button',
        Object.assign({}, node.props, { type: 'submit', class: node.className }),
        node.label || 'Submit',
      );
    }

    const controlId = node.id || 'fb-' + node.key;
    const error = this.activeError(node);
    // Radios are a group of controls, so their heading is a plain span rather
    // than a <label for>. Everything else labels its single control.
    const heading = node.label
      ? node.type === 'radio'
        ? m('span', { class: 'fb-label' }, node.label)
        : m('label', { for: controlId }, node.label)
      : null;

    return m('div', { class: classNames('fb-field', error && 'fb-field--error') }, [
      heading,
      this.renderControl(node, controlId, error),
      error ? m('div', { class: 'fb-error' }, error.message) : null,
    ]);
  }

  renderEntry(node) {
    if (node.kind === 'group') {
      return m('fieldset', { class: classNames('fb-group', node.className), id: node.id }, [
        node.label ? m('legend', node.label) : null,
        ...node.children.map((child) => this.renderField(child)),
      ]);
    }
    return this.renderField(node);
  }

  view(vnode) {
    const attrs = vnode.attrs || {};
    return m(
      'form',
      {
        class: attrs.class,
        // Our JS validation is authoritative; disable native bubbles.
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          this.handleSubmit(attrs.onSubmit);
        },
      },
      this.tree.map((node) => this.renderEntry(node)),
    );
  }
}

export default FormBuilder;
