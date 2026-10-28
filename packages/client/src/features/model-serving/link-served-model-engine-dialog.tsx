import { type ReactElement, useId } from "react";
import { Link as RouterLink } from "react-router";
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
	Form,
	FormRadioGroup,
	InlineCode,
	Label,
	Muted,
	P,
	RadioGroupItem,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { ServedModel, ServedModelEngineLink } from "@/api/model-serving";
import type { ServedModelEngineGroup } from "./use-served-model-engines";

const schema = z.object({
	engineId: z.string().min(1, "Choose the engine to link."),
});

type LinkValues = z.infer<typeof schema>;

export interface LinkServedModelEngineDialogProps {
	open: boolean;
	/** The served model; it stays while the dialog closes */
	model: ServedModel | null;
	/** Its engines: the unlinked ones are offered */
	group: ServedModelEngineGroup;
	/** Links the engine, rejecting with the reason it was refused */
	onLink: (engine: ServedModelEngineLink) => Promise<void>;
	/** Receives the linked engine, or nothing when cancelled */
	onSubmit: (engine?: ServedModelEngineLink) => void;
}

/**
 * Links an engine made by hand to a served model, so it says when the model is
 * stopped. It offers the engines that call the model without the link; when
 * there are none, it says how an engine has to be set up to call it. Mount it
 * again (a new key) for each opening.
 */
export function LinkServedModelEngineDialog({
	open,
	model,
	group,
	onLink,
	onSubmit,
}: LinkServedModelEngineDialogProps): ReactElement {
	const id = useId();
	const form = useForm<LinkValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			engineId:
				group.unlinked.length === 1 ? group.unlinked[0].engineId : "",
		},
	});
	const { errors, isSubmitting } = form.formState;
	const servedModel = model?.servedModel ?? "";
	const hasChoices = group.unlinked.length > 0;

	const handleOpenChange = (isOpen: boolean): void => {
		if (!isOpen && !isSubmitting) {
			onSubmit();
		}
	};

	const handleSubmit = async (values: LinkValues): Promise<void> => {
		const engine = group.unlinked.find(
			(candidate) => candidate.engineId === values.engineId,
		);
		if (!engine) {
			form.setError("engineId", {
				message: "Choose the engine to link.",
			});
			return;
		}
		try {
			await onLink(engine);
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(
					cause,
					"The engine could not be linked.",
				),
			});
			return;
		}
		onSubmit(engine);
	};

	return (
		<Dialog open={open && model !== null} onOpenChange={handleOpenChange}>
			<DialogContent
				className="sm:max-w-lg"
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
						Link an Engine to {servedModel}
					</DialogTitle>
					<DialogDescription>
						A linked engine says when {servedModel} is stopped,
						instead of failing to connect, and shows with the model
						here. It keeps calling the same endpoint; nothing
						restarts.
					</DialogDescription>
				</DialogHeader>
				{group.linked.length > 0 ? (
					<Muted className="text-sm">
						Already linked:{" "}
						{group.linked
							.map((engine) => engine.engineName)
							.join(", ")}
					</Muted>
				) : null}
				{hasChoices ? (
					<Form
						form={form}
						onSubmit={handleSubmit}
						noValidate
						aria-busy={isSubmitting}
						className="flex flex-col gap-6"
					>
						<FormRadioGroup
							name="engineId"
							label="Engines that call it without the link"
							className="gap-3"
							disabled={isSubmitting}
						>
							<div className="grid gap-3">
								{group.unlinked.map((engine) => {
									const optionId = `${id}-${engine.engineId}`;
									return (
										<Label
											key={engine.engineId}
											htmlFor={optionId}
											className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
										>
											<RadioGroupItem
												id={optionId}
												value={engine.engineId}
												className="mt-0.5"
											/>
											<span className="flex min-w-0 flex-col gap-1">
												<span className="font-medium text-sm">
													{engine.engineName}
												</span>
												<span className="break-all font-normal text-muted-foreground text-xs">
													{[
														engine.model
															? `Model ${engine.model}`
															: null,
														engine.endpoint,
													]
														.filter(Boolean)
														.join(" at ")}
												</span>
											</span>
										</Label>
									);
								})}
							</div>
						</FormRadioGroup>
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
								{isSubmitting ? "Linking..." : "Link Engine"}
							</Button>
						</DialogFooter>
					</Form>
				) : (
					<>
						<div className="flex flex-col gap-2">
							<P className="text-sm">
								No engine calls {servedModel} without the link.
								An engine calls it when its{" "}
								<InlineCode>MODEL</InlineCode> is{" "}
								<InlineCode>{servedModel}</InlineCode>
								{model?.endpoint ? (
									<>
										{" "}
										or its <InlineCode>ENDPOINT</InlineCode>{" "}
										is{" "}
										<InlineCode className="break-all">
											{model.endpoint}
										</InlineCode>
									</>
								) : null}
								. Set them in the engine's settings (its SMSS),
								then link it here.
							</P>
							<Button
								asChild
								variant="link"
								className="h-auto self-start p-0"
							>
								<RouterLink to="/settings/model">
									Open Model Settings
								</RouterLink>
							</Button>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onSubmit()}
							>
								Close
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
