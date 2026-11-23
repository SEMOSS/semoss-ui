import type { RefObject } from "react";
import { getCatalogImageValidationError } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
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
import { personPhotoUrl } from "@/features/collaboration/api/person-photo";
import { mapMainTwin } from "@/features/collaboration/live/live-state";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { saveMainTwin } from "./api/main-twin";
import { TwinImageField } from "./twin-image-field";
import { useMainTwin } from "./use-main-twin";

const NAME_MAX_LENGTH = 80;
const schema = z.object({
	// empty goes back to the default name
	name: z
		.string()
		.trim()
		.max(
			NAME_MAX_LENGTH,
			`Keep the name to ${NAME_MAX_LENGTH} characters or fewer.`,
		),
	image: z
		.instanceof(File)
		.nullable()
		.superRefine((file, context) => {
			const message = file && getCatalogImageValidationError(file);
			if (message) context.addIssue({ code: "custom", message });
		}),
	// drop the saved picture, so the person's Microsoft photo stands in again
	usePhoto: z.boolean(),
});
type MainTwinValues = z.infer<typeof schema>;

interface MainTwinEditProps {
	/** What opened the dialog, which gets the focus back when it closes. */
	returnFocusRef: RefObject<HTMLButtonElement | null>;
	/** The dialog is done: saved, or closed with nothing saved. */
	onClose: () => void;
}

/**
 * The name and picture of the signed-in person's own Digital Twin. Mounted
 * while it is open, so each opening starts from what is saved. A save sends
 * only what was changed, and every open surface then shows it.
 */
export function MainTwinEdit({ returnFocusRef, onClose }: MainTwinEditProps) {
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const twin = useMainTwin();
	const email = state.liveProfile?.email;
	const photo = email ? personPhotoUrl(email) : undefined;
	const form = useForm<MainTwinValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: twin.name, image: null, usePhoto: false },
	});
	const { errors, isSubmitting } = form.formState;
	const usePhoto = form.watch("usePhoto");
	const hasNewImage = form.watch("image") !== null;

	const handleSubmit = async (values: MainTwinValues): Promise<void> => {
		const changes = {
			name: values.name === twin.name ? undefined : values.name,
			// a picture chosen after going back to the photo is the one to keep
			image:
				values.image ?? (values.usePhoto ? ("" as const) : undefined),
		};
		if (changes.name === undefined && changes.image === undefined) {
			onClose();
			return;
		}
		let saved: Awaited<ReturnType<typeof saveMainTwin>>;
		try {
			saved = await saveMainTwin(actions, changes);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "Your Digital Twin could not be saved.",
			});
			return;
		}
		const mainTwin = mapMainTwin(saved, twin.agentId);
		if (mainTwin) dispatch({ type: "main-twin.server", mainTwin });
		toast.success("Digital Twin saved");
		onClose();
	};

	return (
		<Dialog
			open
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) onClose();
			}}
		>
			<DialogContent
				showCloseButton={!isSubmitting}
				// opened without a trigger, so the dialog knows of nothing to go back to
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				// a stray click would throw away a chosen file and the options made for it
				onInteractOutside={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Name and Picture</DialogTitle>
					<DialogDescription>
						What your Digital Twin is called and how it looks. Only
						you see them.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="@container/profile flex min-w-0 flex-col gap-4"
				>
					<fieldset disabled={isSubmitting} className="contents">
						<FormInput
							name="name"
							label="Name"
							autoComplete="off"
							description="Leave it empty to go back to the name it started with."
						/>
						<TwinImageField
							imageUrl={usePhoto ? photo : twin.avatar}
						/>
						{twin.isSaved && (
							<div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11"
									onClick={() => {
										form.setValue("image", null, {
											shouldValidate: true,
										});
										form.setValue("usePhoto", true);
									}}
								>
									Use My Microsoft Photo
								</Button>
								{/* always there, so a screen reader hears the change */}
								<output className="min-w-0 text-muted-foreground text-sm">
									{usePhoto && !hasNewImage
										? "Your Microsoft photo is used once you save."
										: ""}
								</output>
							</div>
						)}
					</fieldset>
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Spinner className="size-4" />}
							{isSubmitting ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
