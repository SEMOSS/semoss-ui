import type { HyperlinkRequest } from "docx-react-viewer";
import { useId } from "react";
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
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const schema = z.object({ href: z.string().trim(), text: z.string() });
interface WordLinkDialogProps {
	request: HyperlinkRequest;
	readOnly: boolean;
	onClose: () => void;
	onReturnFocus?: () => void;
}

/** A host-owned link dialog; normal input keys never reach the document canvas. */
export const WordLinkDialog = ({
	request,
	readOnly,
	onClose,
	onReturnFocus,
}: WordLinkDialogProps) => {
	const errorId = useId();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { href: request.href ?? "", text: request.text },
	});
	const handleSubmit = ({ href, text }: z.infer<typeof schema>): void => {
		const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(href);
		const target = href.startsWith("//")
			? `https:${href}`
			: hasScheme || /^(#|\/|\.\/|\.\.\/)/.test(href)
				? href
				: `https://${href}`;
		if (!href || (hasScheme && !/^(https?:|mailto:|tel:)/i.test(href))) {
			form.setError("root.server", {
				message:
					"Enter a web address, email link, phone link or document bookmark.",
			});
			return;
		}
		if (readOnly || !request.apply(target, text || href)) {
			form.setError("root.server", {
				message:
					"The link could not be applied. Check the document selection and editing permission.",
			});
			return;
		}
		onClose();
	};
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				onCloseAutoFocus={(event) => {
					if (onReturnFocus) {
						event.preventDefault();
						onReturnFocus();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>Insert link</DialogTitle>
					<DialogDescription>
						Web addresses without a protocol use HTTPS.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					className="flex flex-col gap-4"
				>
					<FormInput
						name="text"
						label="Display text"
						disabled={readOnly}
					/>
					<FormInput
						name="href"
						label="Link address"
						aria-describedby={
							form.formState.errors.root?.server
								? errorId
								: undefined
						}
						disabled={readOnly}
					/>
					{form.formState.errors.root?.server?.message && (
						<Alert id={errorId} variant="destructive">
							<AlertDescription>
								{form.formState.errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						{request.href && (
							<Button
								type="button"
								variant="outline"
								disabled={readOnly}
								onClick={() => {
									if (request.remove()) onClose();
									else
										form.setError("root.server", {
											message:
												"The link could not be removed.",
										});
								}}
							>
								Remove link
							</Button>
						)}
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={readOnly}>
							Apply link
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
