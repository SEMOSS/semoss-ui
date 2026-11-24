import { useId, useRef, useState } from "react";
import { savePermissionBatches } from "@semoss/sdk";
import { type Project, ProjectSelect } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Form,
	FormField,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { GrantDialog } from "@/features/grants/grant-dialog";
import { GrantDialogFooter } from "@/features/grants/grant-dialog-footer";
import { GrantLevelSelect } from "@/features/grants/grant-level-select";
import {
	DEFAULT_GRANT_LEVEL,
	describeGrantLevels,
	GRANT_LEVELS,
} from "@/features/grants/grant-levels";
import { GrantLimitField } from "@/features/grants/grant-limit-field";
import { GrantQueue } from "@/features/grants/grant-queue";
import { GrantTypeSelect } from "@/features/grants/grant-type-select";
import {
	ALL_GRANT_TYPES,
	GRANTEE_PROJECT_TYPES,
	toProjectTypeOptions,
} from "@/features/grants/grant-types";
import {
	type GrantModel,
	type GrantTarget,
	toAddGranteesBatch,
} from "@/features/grants/grants";
import {
	type PickedResource,
	toPickedProject,
} from "@/features/grants/picked-resource";
import { useGrantLimit } from "@/features/grants/use-grant-limit";
import { getProjectLabel } from "@/utility/catalog";

const schema = z.object({
	apps: z
		.array(z.custom<PickedResource>())
		.min(1, "Pick at least one app or agent"),
	level: z.enum(GRANT_LEVELS),
});

type AddGrantedAppsValues = z.infer<typeof schema>;

/** The types the Type select offers */
const TYPE_OPTIONS = toProjectTypeOptions(GRANTEE_PROJECT_TYPES);

/** Props for {@link AddGrantedAppsDialog}. */
export interface AddGrantedAppsDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The engine or project that gives the permission */
	target: GrantTarget;
	/** The word for the target in the dialog's text, such as engine, skill or agent */
	targetNoun: string;
	/**
	 * The ids of the apps and agents that already have a permission on the
	 * target, which the list does not take: their permission is changed in the
	 * table
	 */
	grantedAppIds?: readonly string[];
	/**
	 * On a model, what the usage limit needs; the dialog then shows the App
	 * Limit below the permission, starting at No Limit Defined
	 */
	model?: GrantModel;
	/**
	 * Whether to list every app and agent and save in admin mode; outside it an
	 * admin has only their own permissions
	 */
	admin?: boolean;
	/**
	 * Called when the dialog closes: with the ids of the apps and agents given
	 * a permission, or nothing
	 */
	onClose: (appIds?: string[]) => void;
}

/**
 * Lets an owner of an engine or a project give apps and agents a permission on
 * it, so each app's custom reactors and each agent's runs can use it for
 * people who have no access to it themselves, such as an agent given a skill.
 * The owner narrows the picker to Code, Blocks or Agent, or keeps every type,
 * and each one picked, of the ones they can see or any in admin mode, joins a
 * list. Everything on the list gets the same level, Read-Only or Editor, with
 * what each level allows said under the select, and on a model the same usage
 * limit, each its own copy, shared or for each of its users. The list is saved
 * at once as one permission batch, so everything on it is given access or
 * nothing is: a refusal shows in the dialog, which stays open. The target
 * itself, one that already has access, or one already on the list is not
 * added, and the field says why. Authorize Access stays enabled, and pressing
 * it with an empty list, or with a limit that is not complete, shows what is
 * missing. Give it a new key each time it opens so it starts empty.
 */
export const AddGrantedAppsDialog = ({
	open,
	target,
	targetNoun,
	grantedAppIds = [],
	model,
	admin = false,
	onClose,
}: AddGrantedAppsDialogProps) => {
	const appFieldId = useId();
	const appHintId = useId();
	const appErrorId = useId();
	const form = useForm<AddGrantedAppsValues>({
		resolver: zodResolver(schema),
		defaultValues: { apps: [], level: DEFAULT_GRANT_LEVEL },
	});
	const { errors, isSubmitting, isSubmitted } = form.formState;
	const apps = form.watch("apps");
	const [typeFilter, setTypeFilter] = useState<string>(ALL_GRANT_TYPES);
	const [pickNote, setPickNote] = useState<string | null>(null);
	const pickerRef = useRef<HTMLButtonElement | null>(null);
	const canGiveLimit = model?.canChangeLimit === true;
	const limit = useGrantLimit({
		isOffered: canGiveLimit,
		source: "APP",
		isCostAvailable: model?.isCostAvailable ?? true,
		isSubmitting,
	});
	const pickedTypes =
		GRANTEE_PROJECT_TYPES.find((type) => type === typeFilter) ?? null;

	/**
	 * Puts a picked app or agent on the list, or takes it off when it is on the
	 * list already, as its check in the picker shows. The target itself, or one
	 * that already has access, stays off, and the field says why.
	 *
	 * @param project - the app or agent picked
	 */
	const handlePick = (project: Project) => {
		const picked = toPickedProject(project);
		if (target.resourceType === "PROJECT" && picked.id === target.id) {
			setPickNote(
				`${picked.name} is this ${targetNoun}, which is never given a permission on itself.`,
			);
			return;
		}
		if (grantedAppIds.includes(picked.id)) {
			setPickNote(
				`${picked.name} already has access. Change its permission in the table.`,
			);
			return;
		}
		const queued = form.getValues("apps");
		setPickNote(null);
		form.setValue(
			"apps",
			queued.some((app) => app.id === picked.id)
				? queued.filter((app) => app.id !== picked.id)
				: [...queued, picked],
			{ shouldValidate: isSubmitted },
		);
	};

	/**
	 * Takes an app or agent off the list and moves focus back to the picker.
	 *
	 * @param app - the app or agent to take off
	 */
	const handleRemove = (app: PickedResource) => {
		setPickNote(null);
		form.setValue(
			"apps",
			form.getValues("apps").filter((other) => other.id !== app.id),
			{ shouldValidate: isSubmitted },
		);
		pickerRef.current?.focus();
	};

	/**
	 * Gives everything on the list its permission, in one permission batch. An
	 * App Limit that is not complete stops it.
	 */
	const handleSubmit = async (
		values: AddGrantedAppsValues,
	): Promise<void> => {
		if (limit.stopsSubmit()) {
			return;
		}
		try {
			await savePermissionBatches(
				[
					toAddGranteesBatch(
						target,
						values.apps,
						values.level,
						canGiveLimit ? limit.usageLimit : null,
					),
				],
				admin,
			);
		} catch (e: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(e, "Could not give the access"),
			});
			return;
		}
		const level = getLevelLabel(values.level);
		toast.success(
			values.apps.length === 1
				? `${values.apps[0].name} has ${level} access`
				: `${values.apps.length} apps and agents have ${level} access`,
		);
		onClose(values.apps.map((app) => app.id));
	};

	return (
		<GrantDialog
			open={open}
			isSubmitting={isSubmitting}
			onClose={() => onClose()}
			className="sm:max-w-2xl"
		>
			<Form
				form={form}
				onSubmit={handleSubmit}
				onError={limit.showProblems}
				noValidate
				aria-busy={isSubmitting}
				className="flex min-w-0 flex-col gap-4"
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Add Apps and Agents
					</DialogTitle>
					<DialogDescription>
						Each app's custom reactors, and each agent's runs, can
						use this {targetNoun}, even for people with no access to
						it. They all get the same permission.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 sm:grid-cols-3">
					<GrantTypeSelect
						label="Type"
						options={TYPE_OPTIONS}
						value={typeFilter}
						disabled={isSubmitting}
						onChange={setTypeFilter}
					/>
					<FormField
						control={form.control}
						name="apps"
						render={({ field, fieldState }) => (
							<Field
								className="sm:col-span-2"
								data-invalid={Boolean(fieldState.error)}
							>
								<FieldLabel htmlFor={appFieldId}>
									App or Agent
								</FieldLabel>
								<ProjectSelect
									ref={(node) => {
										field.ref(node);
										pickerRef.current = node;
									}}
									id={appFieldId}
									aria-invalid={Boolean(fieldState.error)}
									aria-describedby={
										fieldState.error
											? `${appHintId} ${appErrorId}`
											: appHintId
									}
									name={
										apps.length > 0
											? `${apps.length} picked`
											: ""
									}
									value=""
									disabled={isSubmitting}
									projectTypes={
										pickedTypes
											? [pickedTypes]
											: GRANTEE_PROJECT_TYPES
									}
									admin={admin}
									showProjectId
									showProjectImage
									modal
									selectedIds={apps.map((app) => app.id)}
									onChange={handlePick}
								/>
								<FieldDescription id={appHintId}>
									Pick as many as you need: each one joins the
									list below, and picking it again takes it
									off.
								</FieldDescription>
								{pickNote ? (
									<output className="block text-muted-foreground text-xs">
										{pickNote}
									</output>
								) : null}
								{fieldState.error?.message ? (
									<FieldError id={appErrorId}>
										{fieldState.error.message}
									</FieldError>
								) : null}
							</Field>
						)}
					/>
				</div>

				<GrantQueue
					heading="To Authorize"
					emptyText="No apps or agents picked yet"
					items={apps}
					badgeOf={(app) =>
						getProjectLabel(
							GRANTEE_PROJECT_TYPES.find(
								(type) => type === app.subtype,
							),
						)
					}
					disabled={isSubmitting}
					onRemove={handleRemove}
				/>

				<GrantLevelSelect
					description={`Everything on the list gets this permission. ${describeGrantLevels(target.resourceType)}`}
					disabled={isSubmitting}
				/>

				{model ? (
					<GrantLimitField
						canSetLimit={canGiveLimit}
						source="APP"
						label="App Limit"
						isCostAvailable={model.isCostAvailable}
						onChange={limit.setUsageLimit}
						editorRef={limit.editorRef}
						shouldShowProblems={limit.shouldShowProblems}
						copyNote="Everything on the list gets its own copy of this limit."
						disabled={isSubmitting}
						admin={admin}
					/>
				) : null}

				{errors.root?.server?.message ? (
					<Alert variant="destructive">
						<AlertDescription>
							{errors.root.server.message}
						</AlertDescription>
					</Alert>
				) : null}
				{limit.shouldShowProblems && limit.limitProblem ? (
					<p className="text-destructive text-xs">
						{limit.limitProblem}
					</p>
				) : null}

				<GrantDialogFooter
					isSubmitting={isSubmitting}
					onCancel={() => onClose()}
				/>
			</Form>
		</GrantDialog>
	);
};
