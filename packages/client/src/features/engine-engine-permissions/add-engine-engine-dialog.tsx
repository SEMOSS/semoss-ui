import { useEffect, useId, useRef, useState } from "react";
import { type ModelUsageLimit, savePermissionBatches } from "@semoss/sdk";
import {
	EngineSelect,
	EngineSubtypeIcon,
	findModelUsageLimitProblem,
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
	OWNERS_ONLY_LIMIT_REASON,
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
	DEFAULT_ENGINE_GRANTEE_LEVEL,
	ENGINE_GRANTEE_ENGINE_TYPES,
	ENGINE_GRANTEE_LEVELS,
	type EngineGranteeModel,
	toAddEngineBatch,
	toEngineGranteeType,
} from "./engine-engine-permissions";

const schema = z.object({
	granteeId: z.string().min(1, "Pick an engine"),
	granteeName: z.string(),
	granteeType: z.string(),
	granteeSubtype: z.string(),
	level: z.enum(ENGINE_GRANTEE_LEVELS),
});

type AddEngineEngineValues = z.infer<typeof schema>;

/** The message for an engine picked to be given a permission on itself */
const ITSELF_PROBLEM = "An engine cannot be given a permission on itself";

/** Props for {@link AddEngineEngineDialog}. */
export interface AddEngineEngineDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The engine that gives the other engine a permission */
	engineId: string;
	/**
	 * On a model, what the engine's usage limit needs; the dialog then shows the
	 * Engine Limit below the permission, starting at No Limit Defined
	 */
	model?: EngineGranteeModel;
	/**
	 * Whether to list every engine and save in admin mode; outside it an admin
	 * has only their own permissions
	 */
	admin?: boolean;
	/**
	 * Called when the dialog closes: with the engine's id after it was given a
	 * permission, or nothing
	 */
	onClose: (granteeId?: string) => void;
}

/**
 * Lets an owner of an engine give another engine a permission on it, so the
 * other engine can call it, even for people with no access to it, such as a
 * vector database calling its embedding model or a guardrail calling its judge
 * model. The owner picks one of the engines
 * they can see, or any engine in admin mode, and Read-Only or Editor, and on a
 * model can give the engine a usage limit, shared by the engine or for each of
 * its users. It saves at once: a refusal, such as an engine that already has
 * access, shows in the dialog, which stays open. Authorize Access stays
 * enabled, and pressing it without an engine, with the engine itself, or with a
 * limit that is not complete, shows what is missing. Give it a new key each
 * time it opens so it starts empty.
 */
export const AddEngineEngineDialog = ({
	open,
	engineId,
	model,
	admin = false,
	onClose,
}: AddEngineEngineDialogProps) => {
	const engineFieldId = useId();
	const engineErrorId = useId();
	const form = useForm<AddEngineEngineValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			granteeId: "",
			granteeName: "",
			granteeType: "",
			granteeSubtype: "",
			level: DEFAULT_ENGINE_GRANTEE_LEVEL,
		},
	});
	const { errors, isSubmitting } = form.formState;
	const granteeName = form.watch("granteeName");
	const granteeType = form.watch("granteeType");
	const granteeSubtype = form.watch("granteeSubtype");
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
				source: "ENGINE",
				isCostAvailable,
			})
		: null;

	/**
	 * Shows the Engine Limit's problems with the missing engine's, so one press
	 * of Authorize Access says everything that stops it.
	 */
	const handleInvalid = () => {
		if (limitProblem) {
			setShouldShowLimitProblems(true);
		}
	};

	/**
	 * Moves focus to the Engine Limit's first problem once the submit that found
	 * it has ended, since the form's fields are disabled while a submit runs.
	 */
	useEffect(() => {
		if (!shouldFocusLimitProblem || isSubmitting) {
			return;
		}
		limitEditorRef.current?.focusFirstProblem();
		setShouldFocusLimitProblem(false);
	}, [shouldFocusLimitProblem, isSubmitting]);

	/**
	 * Gives the engine its permission. The engine itself, or an Engine Limit
	 * that is not complete, stops it: the field or the editor shows the problem,
	 * and the editor gets focus on its first one after the submit ends.
	 */
	const handleSubmit = async (
		values: AddEngineEngineValues,
	): Promise<void> => {
		const type = toEngineGranteeType(values.granteeType);
		if (values.granteeId === engineId || !type) {
			form.setError(
				"granteeId",
				{
					type: "validate",
					message:
						values.granteeId === engineId
							? ITSELF_PROBLEM
							: "Pick an engine",
				},
				{ shouldFocus: true },
			);
			return;
		}
		if (limitProblem) {
			setShouldShowLimitProblems(true);
			setShouldFocusLimitProblem(true);
			return;
		}
		try {
			await savePermissionBatches(
				[
					toAddEngineBatch(
						engineId,
						{ id: values.granteeId, type },
						values.level,
						canGiveLimit ? usageLimit : null,
					),
				],
				admin,
			);
		} catch (e: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(e, "Could not give the engine access"),
			});
			return;
		}
		toast.success(
			`${values.granteeName} has ${getLevelLabel(values.level)} access`,
		);
		onClose(values.granteeId);
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
							Add Engine
						</DialogTitle>
						<DialogDescription>
							The engine can call this one, even for people with
							no access to it.
						</DialogDescription>
					</DialogHeader>

					<FormField
						control={form.control}
						name="granteeId"
						render={({ field, fieldState }) => (
							<Field data-invalid={Boolean(fieldState.error)}>
								<FieldLabel htmlFor={engineFieldId}>
									Engine
								</FieldLabel>
								<EngineSelect
									ref={field.ref}
									id={engineFieldId}
									aria-invalid={Boolean(fieldState.error)}
									aria-describedby={
										fieldState.error
											? engineErrorId
											: undefined
									}
									name={granteeName}
									value={field.value}
									disabled={isSubmitting}
									engineTypes={ENGINE_GRANTEE_ENGINE_TYPES}
									admin={admin}
									showEngineId
									modal
									triggerIcon={
										granteeType ? (
											<EngineSubtypeIcon
												engineType={granteeType}
												engineSubtype={
													granteeSubtype || undefined
												}
												alt=""
												className="size-5 shrink-0 object-contain"
											/>
										) : null
									}
									onChange={(engine) => {
										form.setValue(
											"granteeName",
											engine.engine_display_name ||
												engine.engine_name ||
												engine.engine_id,
										);
										form.setValue(
											"granteeType",
											engine.engine_type,
										);
										form.setValue(
											"granteeSubtype",
											engine.engine_subtype ?? "",
										);
										field.onChange(engine.engine_id);
									}}
								/>
								{fieldState.error?.message ? (
									<FieldError id={engineErrorId}>
										{fieldState.error.message}
									</FieldError>
								) : null}
							</Field>
						)}
					/>

					<FormSelect
						name="level"
						label="Permission"
						description="Read-Only lets the engine's code read from this engine and call it. Editor also lets it write to it and use its connection."
						disabled={isSubmitting}
						triggerClassName="w-full sm:w-56"
					>
						{ENGINE_GRANTEE_LEVELS.map((level) => (
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
							source="ENGINE"
							label="Engine Limit"
							isCostAvailable={isCostAvailable}
							shouldShowProblems={shouldShowLimitProblems}
							disabled={isSubmitting}
						/>
					) : model ? (
						<p className="text-muted-foreground text-xs">
							{OWNERS_ONLY_LIMIT_REASON}. The engine starts with
							No Limit Defined.
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
