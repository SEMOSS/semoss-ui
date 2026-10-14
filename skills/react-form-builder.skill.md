---
description: "Use when creating, editing, or reviewing React forms, fields, validation, submission, edit/reset behavior, and modal forms in SEMOSS. Uses the public @semoss/ui/next form APIs and SDK read patterns."
name: "react-form-builder"
---
# React Form Builder

Use for form fields, validation, submission, record initialization, and modal form behavior.
Follow the [React standard](./react-standard.skill.md), [DESIGN.md](../DESIGN.md), and
[accessibility skill](./accessibility.skill.md); apply the
[mobile skill](./mobile-development.skill.md) when layout or touch behavior changes.
Lint and formatting settings belong to [biome.json](../biome.json), not this document.

## Workflow and Contracts

1. Read the owning form, its caller, and the existing API helper. Preserve established public
    callbacks and record identity; do not rename consumers as an incidental migration.
2. Import `useForm`, `zodResolver`, `z`, and UI/form components from `@semoss/ui/next`, not
    directly from RHF, Zod, resolver packages, bare `@semoss/ui`, or internal paths. The
    [shared implementation](../libs/ui/src/next/form.tsx) is the component API authority.
3. Define a Zod schema and derive types. For equal input/output shapes use
    `useForm<FormValues>` with `FormValues = z.infer<typeof schema>`. For coercions/transforms,
    distinguish `z.input` from `z.output` and use the installed resolver's compatible
    `useForm<InputValues, unknown, OutputValues>` contract. Do not cast away resolver errors.
	If the public Zod export and resolver resolve incompatible schema versions, report a
	dependency/typecheck blocker. Do not bypass the public imports or claim the example
	compiles until that mismatch is resolved within an authorized dependency change.
4. Provide complete, non-undefined initial field values. RHF owns field state; do not add
    parallel `useState` per field or submission state. Choose the
    [record initialization policy](#fetching-data-and-edit-resets) before wiring edit data.
5. Render `<Form form={form} onSubmit={handleSubmit}>`. It supplies RHF context, renders the
    native form, and calls `form.handleSubmit` internally. Pass the validated-values handler
    directly; do not nest another form, wrap the handler again, or manually prevent submit.
    `Form.onError` handles invalid submissions, not rejected writes. Native attributes such
    as `noValidate`, `aria-busy`, and `className` are supported.
6. Use the matching `Form*` wrappers with schema field names. Use `FormField` only for a
    control without a dedicated wrapper. Check the accessibility limitations below rather
    than duplicating labels/errors around a wrapper.
7. For new completion-style forms use `onSubmit(id?: string): void`: pass the saved ID after
    success and no argument on cancel/close. Keep the validated handler named `handleSubmit`.
    Preserve a different existing public contract unless its migration is in scope.
8. Await the write so RHF tracks `formState.isSubmitting`. Disable mutating controls and
    repeat submission while pending. Use `FormActions` for standalone forms; it accepts
    `isSubmitting`, `onCancel`, `submitLabel` (default `"Save"`), and `className`, disables both
    buttons, and supplies the submit `Spinner`. Use the modal composition below for dialogs.

## Canonical Pattern

This standalone example accepts a typed write callback supplied by the owning feature's API
helper. The helper must reject failed required operations and return a validated ID. Adapt
the schema and callback to the actual operation, without adding a fictional API hook.

```tsx
import {
	Alert,
	AlertDescription,
	Form,
	FormActions,
	FormInput,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const schema = z.object({
	name: z.string().trim().min(1, "Name is required"),
});

export type CreateItemValues = z.infer<typeof schema>;

interface CreateItemFormProps {
	/** Creates an item, rejecting with a user-presentable error on failure. */
	onCreate: (values: CreateItemValues) => Promise<string>;
	/** Receives the saved ID on success, or no argument on cancellation. */
	onSubmit: (id?: string) => void;
}

/** Creates an item while preserving entered values after a failed write. */
export const CreateItemForm = ({ onCreate, onSubmit }: CreateItemFormProps) => {
	const form = useForm<CreateItemValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: "" },
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async (values: CreateItemValues): Promise<void> => {
		let id: string;
		try {
			id = await onCreate(values);
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message:
					error instanceof Error
						? error.message
						: "Unable to create item",
			});
			return;
		}
		toast.success("Item created");
		onSubmit(id);
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSubmitting}
			className="flex w-full max-w-2xl flex-col gap-6"
		>
			<FormInput
				name="name"
				label="Name (required)"
				required
				disabled={isSubmitting}
			/>
			{errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			<FormActions
				isSubmitting={isSubmitting}
				onCancel={() => onSubmit()}
				submitLabel={isSubmitting ? "Creating..." : "Create"}
				className="flex-col sm:flex-row"
			/>
		</Form>
	);
};
```

### Submission and Error State

- Catch write failures and call `form.setError` for a known field or `root.server`; retain
    entered values and keep the form open. The current RHF implementation derives
    `isSubmitSuccessful` from both a resolved handler and an empty error state. Catching and
    only logging/toasting an error can therefore mark a failed write as successful. A root
    error preserves failure state and is cleared on the next submission attempt.
- Keep completion handling outside the write's catch block so a navigation/callback error
    is not mislabeled as a failed write. Do not close/reset from `isSubmitted`, which includes
    failures, or use `isSubmitSuccessful` as the sole proof of backend success.
- Show persistent failures inline. `Alert` and `FieldError` already have `role="alert"`;
    do not announce the same failure again through a toast/live region. Use `toast.success`
    with the host's existing `Toaster` for transient success feedback.
- `FormActions` owns button disabled/spinner behavior, not fields, mutation cancellation,
    dialog dismissal, or all accessibility associations. Its `Spinner` has `role="status"`
    and an accessible Loading label; verify actual pending announcements before adding more.
- `FormInput type="number"` still receives input strings; it does not set `valueAsNumber`.
    Decide how empty, invalid, zero, and optional numbers map to the schema and API. Do not
    silently coerce an empty optional input to zero.

## Fetching Data and Edit Resets

Use `usePixel` from `@semoss/sdk/react` for backend reads (options, records, lookups), not
a new effect with raw fetch. Keep writes imperative through the owning API helper using SDK
primitives. Respect package boundaries and reuse already-owned data rather than fetching it
again. `usePixel` exposes `INITIAL`, `LOADING`, `SUCCESS`, and `ERROR` states; an empty Pixel
defers execution. Distinguish deferred, loading, missing record, empty options, and failure;
do not present failed or missing data as a blank editable record. Validate/map backend data
to the form shape; a TypeScript generic is not runtime validation.

Choose a deliberate initialization policy:

- **Create:** provide `defaultValues` such as `""`, `false`, or an appropriate empty array for
    each field. These are cached initial values, not reactive props. Merely changing the
    `defaultValues` object does not load a later record.
- **Edit:** either mount the form after the validated record is ready, or use the reactive
    `values` option / an explicit `reset(mappedValues)` synchronization policy. Keep hooks
    unconditional; a loading parent may mount a separate form component. Do not pass raw,
    nullable `record.data` straight to `values`.
- **Same-record refresh:** `values` updates reset form state by default and can overwrite
    edits. When the workflow retains edits, use the supported `resetOptions` or `reset`
    options such as `keepDirtyValues`, subscribe to `dirtyFields` as RHF requires, and test
    how untouched fields and defaults update. Do not use fresh object identity as a reason
    to reset on every render. Include real dependencies in any synchronization effect.
- **Record switch/reopen:** decide whether to discard, confirm, or preserve a draft. A key
    based on record identity can intentionally remount a form; never key it by a changing
    field value. Do not carry `keepDirtyValues` from one record into a different record.
- **Success/cancel:** reset only at the deliberate completion boundary. If the form stays
    mounted after saving, `reset(savedValues)` establishes the persisted baseline. Never
    reset in `finally` or after a recoverable failure. Define whether closing/reopening
    resumes or clears a draft and verify stale reads cannot initialize the wrong record.

## Modal / Dialog Forms

Use `Dialog`/`DialogContent`, `DialogHeader`/`DialogTitle`, and an appropriate description.
Keep `DialogFooter` and its submit button inside `Form`. Use `type="button"` for cancel.
Preserve the canonical error display and field state when adapting this composition fragment;
import its components from `@semoss/ui/next`.

Choose an explicit pending-dismissal policy. For a non-cancellable write, this fragment
blocks dismissal only while submitting and keeps close/cancel available otherwise. If the
workflow permits dismissal during a write, use the existing cancellation or stale-result
policy instead; closing a dialog does not abort a request. Verify focus return, including
programmatically opened dialogs without a `DialogTrigger`.

```tsx
const { isSubmitting } = form.formState;
const handleOpenChange = (isNextOpen: boolean): void => {
	if (!isNextOpen && !isSubmitting) {
		onSubmit();
	}
};

return (
	<Dialog open={isOpen} onOpenChange={handleOpenChange}>
		<DialogContent
			showCloseButton={!isSubmitting}
			onEscapeKeyDown={(event) => {
				if (isSubmitting) event.preventDefault();
			}}
			onInteractOutside={(event) => {
				if (isSubmitting) event.preventDefault();
			}}
		>
			<DialogHeader>
				<DialogTitle>Create item</DialogTitle>
				<DialogDescription>
					Name the item to create.
				</DialogDescription>
			</DialogHeader>
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isSubmitting}
				className="flex flex-col gap-6"
			>
				<FormInput
					name="name"
					label="Name (required)"
					required
					disabled={isSubmitting}
				/>
				<DialogFooter className="flex-col">
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() => onSubmit()}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Spinner className="size-4" />}
						{isSubmitting ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</Form>
		</DialogContent>
	</Dialog>
);
```

## Field Composition and Accessibility

| Wrapper | Value and child contract |
| --- | --- |
| `FormInput`, `FormTextarea` | String values; input `type` does not change the RHF value type |
| `FormSelect` | String value; `SelectItem` / `FormSelectItem` children and `placeholder` |
| `FormCheckbox`, `FormSwitch` | Boolean value |
| `FormRadioGroup` | String value; `RadioGroupItem` children with individual labels |
| `FormSlider` | Number or number array; give each thumb an accessible name |
| `FormFileDropzone` | Value/options follow the current `FileDropzone` API |

Use `FieldGroup` for layout and `FieldSet`/`FieldLegend` for semantic groups. For a bespoke
control without a wrapper, use `FormField control={form.control}` and its typed
`field`/`fieldState`. Forward value/change/blur/name/ref to the actual control using its
supported API, including focus support. Generate IDs with `useId` at the top level of the
owning component or custom hook, never inside `FormField.render`. Compose `Field`,
`FieldLabel`, `FieldDescription`, and `FieldError`, linking label, description, and error IDs
to the focusable control and setting invalid/required state as appropriate.

The existing wrappers compose field markup but are not an accessibility certification:

- `FormInput` generates its own input ID, renders the label and `aria-invalid`, and forwards
    remaining input props. An `id` prop does not replace its generated ID. Its `description`
    accepts a React node, so an identified description node plus `aria-describedby` can supply
    a missing hint association without duplicating the field.
- Wrapper descriptions and generated `FieldError` messages are not automatically connected
    via `aria-describedby`; most wrappers lack error-ID/trigger-prop APIs. An alert announces
    an error but does not associate it for later field focus. The canonical example does not
    resolve this shared limitation. Do not claim full accessibility from compilation alone.
- Wrapper `name` is currently a string, not a schema-checked path. Check it against the schema.
    Verify composite control labels and invalid-focus behavior too; not all wrappers forward
    RHF's ref/blur to the focusable element. Fix a shared primitive only within authorized
    scope, or report the blocker instead of forking wrappers or weakening the requirements.

## Verification and Handoff

Run the narrow existing checks for the changed behavior, following the owning package and
[React handoff](./react-standard.skill.md#full-file-review-and-handoff). Cover applicable cases:
invalid input, successful write, rejected write retaining values/error state, retry, duplicate
submit prevention, delayed record arrival, dirty refresh, record switch/reopen, and modal
dismissal/focus return. Test number conversions when present. Verify labels, error associations,
and pending announcements with the accessibility skill. A missing wrapper association is a
failed check: use supported props or fix the shared primitive within scope, otherwise report
the accessibility blocker. Do not mark it passed or bypass an existing wrapper solely to
hide its limitation.

Inspect package scripts before choosing test/typecheck commands; no whole-repository gate
is implied for a documentation-only edit. For skill changes, check local links and compile
standalone examples with available dependencies. Report exact checks, limits, and shared API
gaps; do not present fragments as runnable modules or documentation tests as browser coverage.
