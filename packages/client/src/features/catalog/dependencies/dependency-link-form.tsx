import { Trash2, Undo2 } from "lucide-react";
import { useEffect } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	FieldGroup,
	Form,
	FormInput,
	FormTextarea,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	type DraftLink,
	NAME_LIMIT,
	NAME_TAKEN,
} from "./catalog-dependency-draft";

/**
 * The link's fields. A repeated name is checked here, against the names the
 * draft's other links have, so the form's own validation as the name is typed
 * agrees with the draft.
 *
 * @param takenNames - The other links' names, trimmed and in lower case.
 * @returns The schema.
 */
const createLinkSchema = (takenNames: readonly string[]) =>
	z.object({
		dependency_name: z
			.string()
			.max(NAME_LIMIT, `Use ${NAME_LIMIT} characters or fewer`)
			.refine((name) => {
				const key = name.trim().toLowerCase();
				return key === "" || !takenNames.includes(key);
			}, NAME_TAKEN),
		dependency_description: z.string(),
	});

type LinkValues = z.infer<ReturnType<typeof createLinkSchema>>;

/** Props for {@link DependencyLinkForm}. */
interface DependencyLinkFormProps {
	/** The link being edited */
	link: DraftLink;
	/** What stops the save on this link, such as a name another link has */
	problem?: string;
	/** The names the draft's other links have, trimmed and in lower case */
	takenNames: readonly string[];
	/** Changes the link's name or description in the draft */
	onChange: (change: Partial<LinkValues>) => void;
	/** Removes the link from the draft */
	onRemove: () => void;
	/** Brings back a link marked for removal */
	onRestore: () => void;
}

/**
 * A manual dependency's name and description, in the drawer while the
 * Ontology's dependencies are edited, as the automation canvas edits a step
 * in its drawer: each change goes into the draft at once, and the edit bar's
 * Save sends them all. The name is the key a Code app reads the target's id
 * by, so it is unique per owner; a repeat shows under it. Remove marks the
 * link to go on save, and Undo brings it back.
 */
export const DependencyLinkForm = ({
	link,
	problem,
	takenNames,
	onChange,
	onRemove,
	onRestore,
}: DependencyLinkFormProps) => {
	// react-hook-form reads its options again on every render, so the
	// resolver always checks against the other links' current names
	const form = useForm<LinkValues>({
		resolver: zodResolver(createLinkSchema(takenNames)),
		mode: "onChange",
		defaultValues: {
			dependency_name: link.dependency_name,
			dependency_description: link.dependency_description,
		},
	});

	// each edit goes into the draft as it is typed
	useEffect(() => {
		const subscription = form.watch((values) =>
			onChange({
				dependency_name: values.dependency_name ?? "",
				dependency_description: values.dependency_description ?? "",
			}),
		);
		return () => subscription.unsubscribe();
	}, [form, onChange]);

	// a problem the link opens with, such as a name repeated before it was
	// opened; the form's own validation agrees with it from then on
	useEffect(() => {
		if (problem) {
			form.setError("dependency_name", {
				type: "draft",
				message: problem,
			});
		} else {
			form.clearErrors("dependency_name");
		}
	}, [form, problem]);

	if (link.isRemoved) {
		return (
			<Alert>
				<Trash2 aria-hidden="true" />
				<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
					This dependency is removed when you save.
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={onRestore}
					>
						<Undo2 aria-hidden="true" />
						Undo
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Form
			form={form}
			onSubmit={() => undefined}
			noValidate
			aria-label="This dependency"
			className="flex flex-col gap-3 rounded-lg border p-3"
		>
			<FieldGroup className="gap-3">
				<FormInput
					name="dependency_name"
					label="Name (optional)"
					description="The key a Code app reads this item's id by."
					autoComplete="off"
				/>
				<FormTextarea
					name="dependency_description"
					label="Description (optional)"
					rows={2}
				/>
			</FieldGroup>
			<div className="flex justify-end">
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={onRemove}
				>
					<Trash2 aria-hidden="true" />
					Remove Dependency
				</Button>
			</div>
		</Form>
	);
};
