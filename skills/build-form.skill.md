---
name: build-form
description: "Use when creating or changing a React form or dialog form: fields, Zod validation, submission, server errors, edit and reset behavior, or modal dismissal."
---
# Build Form

## When to Use

- Adding a new form, a dialog form, or a field to an existing form.
- Changing validation, submission, error display, record loading or reset behavior.
- Reviewing a form change.

## Read First

- [docs/standards/react.md#forms](../docs/standards/react.md#forms): contracts, canonical pattern, edit
  resets, dialog composition, wrapper table and accessibility limits.
- [ui.md: Forms and Status Messages](../docs/standards/ui.md#forms-and-status-messages)
- [ui.md: Responsive and Touch](../docs/standards/ui.md#responsive-and-touch) when layout or touch
  behavior changes.
- [docs/standards/ui.md#ui-text](../docs/standards/ui.md#ui-text) for labels and messages.
- The owning package's `AGENTS.md`.

## Steps

1. Read the owning form, its caller, and the existing API helper. Note the public callbacks and
   record identity you must preserve; do not rename consumers as an incidental migration.
2. Write or extend the Zod schema and derive the value types (`z.infer`, or `z.input` and
   `z.output` when the schema transforms values).
3. Create the form with `useForm` and `zodResolver` from `@semoss/ui/next`, with a complete,
   non-undefined default for every field.
4. Pick the initialization policy for edit flows (create, edit, same-record refresh, record
   switch, success or cancel) before wiring any backend data. Read data with `usePixel` and
   map it to the form shape.
5. Render `<Form form={form} onSubmit={handleSubmit}>` and add one `Form*` wrapper per field.
   Use `FormField` only for a control without a wrapper, with `useId` at the component top level.
6. Write `handleSubmit`: await the write, call `form.setError` for a known field or
   `root.server` on failure and return, then run completion (`toast.success`, `onSubmit(id)`)
   outside the catch block.
7. Render the `root.server` error inline with `Alert`. Use `FormActions` for a standalone form,
   or the dialog footer composition inside `Form` for a dialog.
8. For a dialog, choose the pending-dismissal policy and block Escape, outside clicks and the
   close button while a non-cancellable write is pending.
9. Decide number conversions (empty, invalid, zero, optional) and collection size limits.
10. Write tests for the cases in the checklist, then run Verify.

## Checklist

- [ ] All imports come from `@semoss/ui/next`; no direct RHF, Zod or resolver imports.
- [ ] No parallel `useState` per field or for submission state.
- [ ] Existing public callbacks preserved; new completion forms use `onSubmit(id?: string)`.
- [ ] Wrapper `name` values match schema paths.
- [ ] Mutating controls disabled and repeat submission blocked while pending.
- [ ] A rejected write keeps the values, shows an inline error, and allows retry.
- [ ] Reset happens only at the completion boundary, never in `finally` or after a failure.
- [ ] Delayed record arrival, dirty refresh, and record switch or reopen behave as decided.
- [ ] Dialog dismissal follows the policy on every close path; focus returns to a logical target.
- [ ] Labels, error associations and pending announcements checked; any wrapper association
      gap reported as a failed check, not hidden.
- [ ] Tests cover invalid input, successful write, rejected write, retry, duplicate submit,
      number conversions, collection limits (exact limit and one over), and modal dismissal.
- [ ] Interaction tests await focus after `setFocus` instead of asserting synchronously.
- [ ] Labels in Title Case, messages in sentence case, strings through i18n.

## Verify

```bash
pnpm check
pnpm --filter <package> test
pnpm --filter <package> type-check   # or check-types: use the name in its package.json
```

Inspect the package's scripts before choosing commands; a documentation-only edit needs no
whole-repository gate. Report the exact checks run, their limits, and any shared API gaps.
