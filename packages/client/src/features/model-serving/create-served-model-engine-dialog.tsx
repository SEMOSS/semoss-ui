import { TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormInput,
	FormSwitch,
	Muted,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	createServedModelEngine,
	type ServedModel,
	type ServedModelEngine,
} from "@/api/model-serving";
import type { ServedModelEngineGroup } from "./use-served-model-engines";

const schema = z.object({
	engineName: z.string().trim(),
	global: z.boolean(),
});

type EngineValues = z.infer<typeof schema>;

export interface CreateServedModelEngineDialogProps {
	open: boolean;
	/** The model the engine calls; it stays while the dialog closes */
	model: ServedModel | null;
	/** The model's engines, so the dialog can say it has some already */
	group: ServedModelEngineGroup;
	/** Receives the created engine, or nothing when cancelled */
	onSubmit: (engine?: ServedModelEngine) => void;
}

/**
 * Creates a SEMOSS model engine that calls a served model, so apps, agents and
 * the playground can use it. Mount it again (a new key) for each opening.
 */
export function CreateServedModelEngineDialog({
	open,
	model,
	group,
	onSubmit,
}: CreateServedModelEngineDialogProps): ReactElement {
	const hasEngines = group.linked.length > 0;
	const form = useForm<EngineValues>({
		resolver: zodResolver(schema),
		defaultValues: { engineName: "", global: false },
	});
	const { errors, isSubmitting } = form.formState;

	const handleOpenChange = (isOpen: boolean): void => {
		if (!isOpen && !isSubmitting) {
			onSubmit();
		}
	};

	const handleSubmit = async (values: EngineValues): Promise<void> => {
		if (!model) {
			return;
		}
		let engine: ServedModelEngine;
		try {
			engine = await createServedModelEngine(
				model.servedModel,
				values.engineName || undefined,
				values.global,
			);
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(
					cause,
					"The engine could not be created.",
				),
			});
			return;
		}
		onSubmit(engine);
	};

	return (
		<Dialog open={open && model !== null} onOpenChange={handleOpenChange}>
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
					<DialogTitle className="break-words">
						Create an Engine for {model?.servedModel}
					</DialogTitle>
					<DialogDescription>
						The engine sends its calls to the model's endpoint
						{model?.endpoint ? ` (${model.endpoint})` : ""}, and
						says when the model is stopped. Each engine is its own
						catalog entry, with its own access and usage.
					</DialogDescription>
				</DialogHeader>
				{hasEngines ? (
					<Alert className="border-warning/40 bg-warning/10 text-warning">
						<TriangleAlert aria-hidden />
						<AlertTitle>
							{model?.servedModel} already has{" "}
							{group.linked.length === 1
								? "an engine"
								: `${group.linked.length} engines`}
						</AlertTitle>
						<AlertDescription className="text-foreground">
							{group.linked
								.map((engine) => engine.engineName)
								.join(", ")}
							. Another engine is a second catalog entry for the
							same model; create one only if you need it, such as
							for different access.
						</AlertDescription>
					</Alert>
				) : null}
				{group.unlinked.length > 0 ? (
					<Muted className="text-sm">
						{group.unlinked
							.map((engine) => engine.engineName)
							.join(", ")}{" "}
						{group.unlinked.length === 1 ? "calls" : "call"} this
						model without the link. Linking{" "}
						{group.unlinked.length === 1 ? "it" : "one"} (More
						actions, Link an Engine) may be all you need.
					</Muted>
				) : null}
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex flex-col gap-6"
				>
					<FormInput
						name="engineName"
						label="Engine name"
						placeholder={model?.displayName ?? model?.servedModel}
						autoComplete="off"
						disabled={isSubmitting}
						description="Leave it blank for the model's display name."
					/>
					<FormSwitch
						name="global"
						label="Make the engine public"
						description="Everyone on this SEMOSS can use it; otherwise only you, until you share it."
						disabled={isSubmitting}
					/>
					{errors.root?.server?.message ? (
						<Alert variant="destructive">
							<AlertDescription className="break-words">
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					) : null}
					<DialogFooter className="flex-col sm:flex-row">
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onSubmit()}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							{isSubmitting
								? "Creating..."
								: hasEngines
									? "Create Another Engine"
									: "Create Engine"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
