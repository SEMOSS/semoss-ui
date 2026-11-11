import type { ImagePickerRequest } from "docx-react-viewer";
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
	FormFileDropzone,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const schema = z.object({ image: z.instanceof(File).nullable() });
interface WordPictureDialogProps {
	request: ImagePickerRequest;
	readOnly: boolean;
	onClose: () => void;
	onReturnFocus?: () => void;
}

/** Inserts a chosen picture through the selection-aware public host request. */
export const WordPictureDialog = ({
	request,
	readOnly,
	onClose,
	onReturnFocus,
}: WordPictureDialogProps) => {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { image: null },
	});
	const { isSubmitting, errors } = form.formState;
	const handleSubmit = async ({
		image,
	}: z.infer<typeof schema>): Promise<void> => {
		try {
			if (!image) throw new Error("Choose an image to insert.");
			if (readOnly || !(await request.insert(image)))
				throw new Error(
					"The picture could not be inserted. Check editing permission and the selected image.",
				);
		} catch (error) {
			form.setError("root.server", {
				message: error instanceof Error ? error.message : String(error),
			});
			return;
		}
		onClose();
	};
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !isSubmitting) onClose();
			}}
		>
			<DialogContent
				onCloseAutoFocus={(event) => {
					if (onReturnFocus) {
						event.preventDefault();
						onReturnFocus();
					}
				}}
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Insert picture</DialogTitle>
					<DialogDescription>
						Select an image for the current document selection.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					className="flex flex-col gap-4"
				>
					<FormFileDropzone
						name="image"
						label="Picture"
						extensions={[".png", ".jpg", ".jpeg", ".gif", ".webp"]}
						disabled={readOnly || isSubmitting}
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
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={readOnly || isSubmitting}
						>
							{isSubmitting ? "Inserting…" : "Insert picture"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
