import m from 'mithril';

/** Result returned by a validator: `error` is `null` when the value is valid. */
export interface ValidationResult {
  error: string | null;
  /** Extra CSS class applied to the control (and error wrapper) when invalid. */
  class?: string;
}

/** A validator receives the field value and every current value of the form. */
export type Validator = (value: any, values: Record<string, any>) => ValidationResult;

/** A single control. Unknown keys are passed through as sanitized DOM attributes. */
export interface FieldSchema {
  type:
    | 'text'
    | 'password'
    | 'email'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'date'
    | 'datetime-local'
    | 'month'
    | 'week'
    | 'time'
    | 'color'
    | 'range'
    | 'hidden'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'submit';
  /** Key under which the value is stored; falls back to `id`, then an index. */
  name?: string;
  id?: string;
  label?: string;
  class?: string;
  placeholder?: string;
  defaultValue?: any;
  /** Options for `select` and `radio` fields. */
  options?: Array<string | { value: string | number; label?: string }>;
  validation?: Validator[];
  [attribute: string]: any;
}

/** A labelled set of fields, rendered as a `<fieldset><legend>`. */
export interface GroupSchema {
  group: FieldSchema[];
  label?: string;
  class?: string;
  id?: string;
}

export type FormSchema = Array<FieldSchema | GroupSchema>;

/** Attributes accepted when the form is rendered with `m(form, attrs)`. */
export interface FormBuilderAttrs {
  class?: string;
  onSubmit?: (values: Record<string, any>) => void;
}

/**
 * Builds a Mithril form component from a declarative schema.
 *
 * The instance is itself a Mithril component — render it with
 * `m(myForm, { onSubmit })`.
 */
export declare class FormBuilder implements m.Component<FormBuilderAttrs> {
  constructor(schema: FormSchema);

  values: Record<string, any>;
  errors: Record<string, { message: string; class?: string } | null>;

  /** Shallow copy of the current values, keyed by field name. */
  getValues(): Record<string, any>;
  getValue(name: string): any;
  setValues(values: Record<string, any>): void;
  /** Runs every validator, stores the errors, and returns whether the form is valid. */
  validate(): boolean;
  /** Non-mutating validity check. */
  isValid(): boolean;
  /** Restores every field to its default value and clears errors. */
  reset(): void;

  view(vnode: m.Vnode<FormBuilderAttrs>): m.Children;
}

export default FormBuilder;
