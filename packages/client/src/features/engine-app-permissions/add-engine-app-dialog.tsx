import { useEffect, useId, useRef, useState } from "react";
import { type ModelUsageLimit, savePermissionBatches } from "@semoss/sdk";
import {
	findModelUsageLimitProblem,
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
	OWNERS_ONLY_LIMIT_REASON,
	ProjectSelect,
	UsageLimitGuideButton,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldError,
	FieldLabel,
	Form,
	FormField,
	FormSelect,
	FormSelectItem,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import {
	DEFAULT_ENGINE_APP_LEVEL,
	ENGINE_APP_LEVELS,
	ENGINE_APP_PROJECT_TYPES,
	type EngineAppModel,
	toAddAppBatch,
} from "./engine-app-permissions";

const schema = z.object({
	appId: z.string().min(1, "Pick an app"),
	appName: z.string(),
	level: z.enum(ENGINE_APP_LEVELS),
});

type AddEngineAppValues = z.infer<typeof schema>;

/** Props for {@link AddEngineAppDialog}. */
export interface AddEngineAppDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The engine that gives the app a permission */
	engineId: string;
	/**
	 * On a model, what the app's usage limit needs; the dialog then shows the
	 * App Limit below the permission, starting at No Limit Defined
	 */
	model?: EngineAppModel;
	/**
	 * Whether to list every app and save in admin mode; outside it an admin
	 * has only their own permissions
	 */
	admin?: boolean;
	/**
	 * Called when the dialog closes: with the app's id after it was given a
	 * permission, or nothing
	 */
	onClose: (appId?: string) => void;
}

/**
 * Lets an owner of an engine give an app a permission on it, so the app's
 * custom reactors can use the engine for people who have no access to it
 * themselves. The owner picks one of the apps they can see, or any app in
 * admin mode, and Read-Only or Editor, and on a model can give the app a usage
 * limit, shared by the app or for each of its users. It saves at once: a refusal, such as an app that
 * already has access, shows in the dialog, which stays open. Authorize Access
 * stays enabled, and pressing it without an app, or with a limit that is not
 * complete, shows what is missing. Give it a new key each time it opens so it
 * starts empty.
 */
export const AddEngineAppDialog = ({
	open,
	engineId,
	model,
	admin = false,
	onClose,
}: AddEngineAppDialogProps) => {
	const appFieldId = useId();
	const appErrorId = useId();
	const form = useForm<AddEngineAppValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			appId: "",
			appName: "",
			level: DEFAULT_ENGINE_APP_LEVEL,
		},
	});
	const { errors, isSubmitting } = form.formState;
	const appName = form.watch("appName");
	const [usageLimit, setUsageLimit] = useState<ModelUsageLimit | null>(null);
	const [shouldShowLimitProblems, setShouldShowLimitProblems] =
		useState(false);
	const [shouldFocusLimitProblem, setShouldFocusLimitProblem] =
		useState(false);
	const limitEditorRef = useRef<ModelUsageLimitEditorHandle>(null);
	const canGiveLimit = model?.canChangeLimit === true;
	const isCostAvailable = model?.isCostAvailable ?? true;
	const limitProblem = canGiveLimit
		? findModelUsageLimitProblem(usageLimit, {
				source: "APP",
				isCostAvailable,
			})
		: null;

	/**
	 * Shows the App Limit's problems with the missing app's, so one press of
	 * Authorize Access says everything that stops it.
	 */
	const handleInvalid = () => {
		if (limitProblem) {
			setShouldShowLimitProblems(true);
		}
	};

	/**
	 * Moves focus to the App Limit's first problem once the submit that found it
	 * has ended, since the form's fields are disabled while a submit runs.
	 */
	useEffect(() => {
		if (!shouldFocusLimitProblem || isSubmitting) {
			return;
		}
		limitEditorRef.current?.focusFirstProblem();
		setShouldFocusLimitProblem(false);
	}, [shouldFocusLimitProblem, isSubmitting]);

	/**
	 * Gives the app its permission. An App Limit that is not complete stops
	 * it: the editor shows its problems, and gets focus on the first one after
	 * the submit ends.
	 */
	const handleSubmit = async (values: AddEngineAppValues): Promise<void> => {
		if (limitProblem) {
			setShouldShowLimitProblems(true);
			setShouldFocusLimitProblem(true);
			return;
		}
		try {
			await savePermissionBatches(
				[
					toAddAppBatch(
						engineId,
						values.appId,
						values.level,
						canGiveLimit ? usageLimit : null,
					),
				],
				admin,
			);
		} catch (e: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(e, "Could not give the app access"),
			});
			return;
		}
		toast.success(
			`${values.appName} has ${getLevelLabel(values.level)} access`,
		);
		onClose(values.appId);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) {
					onClose();
				}
			}}
		>
			<DialogContent
				className="sm:max-w-2xl"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) {
						event.preventDefault();
					}
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) {
						event.preventDefault();
					}
				}}
			>
				<Form
					form={form}
					onSubmit={handleSubmit}
					onError={handleInvalid}
					noValidate
					aria-busy={isSubmitting}
					className="flex min-w-0 flex-col gap-4"
				>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Add App
						</DialogTitle>
						<DialogDescription>
							The app's custom reactors can call this engine, even
							for people with no access to it.
						</DialogDescription>
					</DialogHeader>

					<FormField
						control={form.control}
						name="appId"
						render={({ field, fieldState }) => (
							<Field data-invalid={Boolean(fieldState.error)}>
								<FieldLabel htmlFor={appFieldId}>
									App
								</FieldLabel>
								<ProjectSelect
									ref={field.ref}
									id={appFieldId}
									aria-invalid={Boolean(fieldState.error)}
									aria-describedby={
										fieldState.error
											? appErrorId
											: undefined
									}
									name={appName}
									value={field.value}
									disabled={isSubmitting}
									projectTypes={ENGINE_APP_PROJECT_TYPES}
									admin={admin}
									showProjectId
									showProjectImage
									modal
									onChange={(project) => {
										form.setValue(
											"appName",
											project.project_display_name ||
												project.project_name ||
												project.project_id,
										);
										field.onChange(project.project_id);
									}}
								/>
								{fieldState.error?.message ? (
									<FieldError id={appErrorId}>
										{fieldState.error.message}
									</FieldError>
								) : null}
							</Field>
						)}
					/>

					<FormSelect
						name="level"
						label="Permission"
						description="Read-Only lets the app's reactors read from the engine. Editor also lets them write to it and use its connection."
						disabled={isSubmitting}
						triggerClassName="w-full sm:w-56"
					>
						{ENGINE_APP_LEVELS.map((level) => (
							<FormSelectItem key={level} value={level}>
								{getLevelLabel(level)}
							</FormSelectItem>
						))}
					</FormSelect>

					{canGiveLimit ? (
						<ModelUsageLimitEditor
							ref={limitEditorRef}
							defaultValue={null}
							onChange={setUsageLimit}
							source="APP"
							label="App Limit"
							isCostAvailable={isCostAvailable}
							shouldShowProblems={shouldShowLimitProblems}
							disabled={isSubmitting}
						/>
					) : model ? (
						<p className="text-muted-foreground text-xs">
							{OWNERS_ONLY_LIMIT_REASON}. The app starts with No
							Limit Defined.
						</p>
					) : null}
					{model ? (
						<UsageLimitGuideButton
							className="self-start"
							section="rules"
							viewer={{
								canSetModelLimits: canGiveLimit,
								isAdminMode: admin,
							}}
						/>
					) : null}

					{errors.root?.server?.message ? (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					) : null}
					{shouldShowLimitProblems && limitProblem ? (
						<p className="text-destructive text-xs">
							{limitProblem}
						</p>
					) : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onClose()}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							{isSubmitting
								? "Authorizing..."
								: "Authorize Access"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
