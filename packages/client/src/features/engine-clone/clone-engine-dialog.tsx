import { cloneEngine } from "@semoss/sdk";
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
	FormInput,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useSession } from "@/hooks/use-session";

/** Added to the engine's name for the name the clone starts with */
const DEFAULT_NAME_SUFFIX = " Copy";

const schema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(255, "Use 255 characters or fewer")
		// the name is part of the clone's folder on the server
		.refine(
			(name) => !name.includes("/") && !name.includes("\\"),
			"Names cannot contain / or \\",
		),
});

type CloneEngineValues = z.infer<typeof schema>;

export interface CloneEngineDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The engine to clone */
	engineId: string;
	/** The engine's name, which the clone's name starts from */
	engineName: string;
	/** What the catalog calls this kind of engine, such as "Database" */
	engineLabel: string;
	/** Called when the dialog closes: with the clone's id after a clone, or nothing */
	onSubmit: (cloneId?: string) => void;
}

/**
 * Names and clones an engine into a new private engine the signed in user
 * owns, with a copy of all its files, settings, metadata and image. Mount it
 * with a new key each time it opens so the name starts from the engine's.
 */
export const CloneEngineDialog = ({
	open,
	engineId,
	engineName,
	engineLabel,
	onSubmit,
}: CloneEngineDialogProps) => {
	const insightID = useSession((state) => state.insightID);
	const form = useForm<CloneEngineValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: `${engineName}${DEFAULT_NAME_SUFFIX}` },
	});
	const { errors, isSubmitting } = form.formState;
	const label = engineLabel.toLowerCase();

	const handleSubmit = async (values: CloneEngineValues): Promise<void> => {
		let cloneId: string;
		let cloneName: string;
		try {
			const clone = await cloneEngine(
				{ engineId, name: values.name },
				insightID,
			);
			cloneId = clone.engineId;
			cloneName = clone.name || values.name;
		} catch (e: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(e, `Could not clone the ${label}`),
			});
			return;
		}
		toast.success(`Cloned ${engineName} as ${cloneName}`);
		onSubmit(cloneId);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) {
					onSubmit();
				}
			}}
		>
			<DialogContent
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
					noValidate
					aria-busy={isSubmitting}
					className="flex flex-col gap-6"
				>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Clone {engineLabel}
						</DialogTitle>
						<DialogDescription>
							Makes a private copy of{" "}
							<span className="font-medium text-foreground">
								{engineName}
							</span>{" "}
							that you own, with its files, settings, description,
							tags and image. Its access is not copied. A {label}{" "}
							that connects to an outside system keeps the same
							connection, so the copy works with the same data
							there.
						</DialogDescription>
					</DialogHeader>
					<FormInput
						name="name"
						label="Name"
						required
						autoComplete="off"
						disabled={isSubmitting}
						data-testid="cloneEngineDialog-name-input"
					/>
					{errors.root?.server?.message ? (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onSubmit()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							data-testid="cloneEngineDialog-clone-btn"
						>
							{isSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							{isSubmitting
								? "Cloning..."
								: `Clone ${engineLabel}`}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
