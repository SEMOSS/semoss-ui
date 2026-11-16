import { MoreHorizontal, Pencil, X } from "lucide-react";
import { useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Form,
	FormInput,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const schema = z.object({
	name: z.string().trim().min(1, "Name is required."),
});

type RenameValues = z.infer<typeof schema>;

interface ChatRoomMenuProps {
	/** The chat's name as its row shows it; the rename field starts from it. */
	title: string;
	/** Saves the new name, rejecting with a message the dialog shows. */
	onRename: (name: string) => Promise<void>;
	/** Runs once the menu has closed. Closes the chat and moves focus off its row; false when it stayed in the list. */
	onClose: () => boolean;
	disabled?: boolean;
	className?: string;
}

/** A chat's "..." menu in the chat list: rename it, or close it. */
export function ChatRoomMenu({
	title,
	onRename,
	onClose,
	disabled,
	className,
}: ChatRoomMenuProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const shouldClose = useRef(false);
	const [isRenaming, setIsRenaming] = useState(false);
	const form = useForm<RenameValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: title },
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async ({ name }: RenameValues): Promise<void> => {
		try {
			await onRename(name);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "The chat could not be renamed. Try again.",
			});
			return;
		}
		setIsRenaming(false);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						ref={triggerRef}
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={`More actions for ${title}`}
						disabled={disabled}
						className={cn(
							"pointer-coarse:size-11 shrink-0 text-muted-foreground",
							className,
						)}
					>
						<MoreHorizontal aria-hidden="true" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					onCloseAutoFocus={(event) => {
						if (!shouldClose.current) return;
						shouldClose.current = false;
						// a closed chat's row leaves the list, so the list moves focus instead of the menu
						if (onClose()) event.preventDefault();
					}}
				>
					<DropdownMenuItem
						onSelect={() => {
							form.reset({ name: title });
							setIsRenaming(true);
						}}
					>
						<Pencil aria-hidden="true" />
						Rename…
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => {
							shouldClose.current = true;
						}}
					>
						<X aria-hidden="true" />
						Close chat
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog
				open={isRenaming}
				onOpenChange={(open) => {
					if (!isSubmitting) setIsRenaming(open);
				}}
			>
				<DialogContent
					showCloseButton={!isSubmitting}
					onCloseAutoFocus={(event) => {
						// opened from the menu, so there is no dialog trigger to return to
						event.preventDefault();
						triggerRef.current?.focus();
					}}
				>
					<DialogHeader>
						<DialogTitle>Rename chat</DialogTitle>
						<DialogDescription>
							The name shows in your chat list and at the top of
							the chat.
						</DialogDescription>
					</DialogHeader>
					<Form
						form={form}
						onSubmit={handleSubmit}
						noValidate
						aria-busy={isSubmitting}
						className="flex flex-col gap-6"
					>
						{/* the server column, ROOM.ROOM_NAME, is VARCHAR(255) */}
						<FormInput
							name="name"
							label="Name (required)"
							required
							maxLength={255}
							disabled={isSubmitting}
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
								onClick={() => setIsRenaming(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Spinner
										aria-hidden="true"
										data-icon="inline-start"
									/>
								)}
								{isSubmitting ? "Saving…" : "Save"}
							</Button>
						</DialogFooter>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
}
