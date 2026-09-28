import { type RefObject, useEffect, useId, useRef } from "react";
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
	Input,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import type { Session } from "@/types/session";

const MAX_ROOM_NAME_LENGTH = 255;

const renameRoomSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Room name is required.")
		.max(MAX_ROOM_NAME_LENGTH, "Room name cannot exceed 255 characters."),
});

type RenameRoomFormValues = z.infer<typeof renameRoomSchema>;

interface RenameRoomDialogProps {
	open: boolean;
	room: Session | null;
	returnFocusRef: RefObject<HTMLButtonElement | null>;
	fallbackFocusRef: RefObject<HTMLButtonElement | null>;
	onOpenChange: (open: boolean) => void;
	onAfterClose: () => void;
	onRename: (roomId: string, name: string) => Promise<void>;
}

/** Rename one room while retaining the draft after a recoverable failure. */
export function RenameRoomDialog({
	open,
	room,
	returnFocusRef,
	fallbackFocusRef,
	onOpenChange,
	onAfterClose,
	onRename,
}: RenameRoomDialogProps) {
	const inputId = useId();
	const errorId = useId();
	const initializedRoomIdRef = useRef<string | null>(null);
	const form = useForm<RenameRoomFormValues>({
		resolver: zodResolver(renameRoomSchema),
		defaultValues: { name: "" },
	});
	const { errors, isSubmitting } = form.formState;

	useEffect(() => {
		if (!open) {
			initializedRoomIdRef.current = null;
			return;
		}
		if (!room || initializedRoomIdRef.current === room.id) return;
		initializedRoomIdRef.current = room.id;
		form.reset({ name: room.title });
	}, [form, open, room]);

	if (!room) return null;

	async function handleSubmit(values: RenameRoomFormValues): Promise<void> {
		try {
			await onRename(room.id, values.name);
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: `The room could not be renamed. ${toError(cause).message}`,
			});
			return;
		}
		toast.success("Room renamed.");
		onOpenChange(false);
	}

	function handleOpenChange(nextOpen: boolean): void {
		if (!nextOpen && isSubmitting) return;
		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					const returnTarget = returnFocusRef.current;
					if (returnTarget?.isConnected) returnTarget.focus();
					else fallbackFocusRef.current?.focus();
					onAfterClose();
				}}
			>
				<DialogHeader>
					<DialogTitle>Rename room</DialogTitle>
					<DialogDescription>
						Choose a concise name for this room.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex flex-col gap-4"
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={inputId}>
									Room name
								</FieldLabel>
								<Input
									{...field}
									id={inputId}
									autoFocus
									disabled={isSubmitting}
									aria-invalid={fieldState.invalid}
									aria-describedby={
										fieldState.error ? errorId : undefined
									}
								/>
								{fieldState.error?.message && (
									<FieldError id={errorId}>
										{fieldState.error.message}
									</FieldError>
								)}
							</Field>
						)}
					/>
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
							onClick={() => handleOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Spinner className="size-4" />}
							{isSubmitting ? "Renaming..." : "Rename"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
