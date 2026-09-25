import { useEffect, useRef, useState } from "react";
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
	FormCheckbox,
	P,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { EmailDraftSession } from "../api/email-draft-session";
import {
	parseAddresses,
	saveEmailDraft,
	UncertainDraftError,
} from "../api/microsoft";
import type { EmailDraftInput, SavedEmailDraft } from "../types";
import { ConnectorFormInput } from "./connector-form-input";
import { DraftAttachmentField } from "./draft-attachment-field";

const addresses = z.string().refine((value) => {
	try {
		parseAddresses(value);
		return true;
	} catch {
		return false;
	}
}, "Enter email addresses separated by commas.");
const formSchema = z.object({
	to: addresses,
	cc: addresses,
	bcc: addresses,
	subject: z.string(),
	body: z.string(),
	replyAll: z.boolean(),
	files: z.array(z.object({ id: z.string(), file: z.instanceof(File) })),
});
type DraftValues = z.infer<typeof formSchema>;

export interface EmailDraftDialogProps {
	/** Controlled visibility; closing retains unsaved content while the component remains mounted. */
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	/** Required for a native reply or forward; never guessed from a subject. */
	sourceUid?: string;
	mode: "new" | "reply" | "forward";
	initialBody?: string;
	initialSubject?: string;
	initialTo?: string;
	onSaved?: (draft: SavedEmailDraft) => void;
}

/** Review and save a new, reply, or forward draft through an API that cannot send mail. */
export function EmailDraftDialog({
	isOpen,
	onOpenChange,
	sourceUid,
	mode,
	initialBody = "",
	initialSubject = "",
	initialTo = "",
	onSaved,
}: EmailDraftDialogProps) {
	const { actions, insightId } = useInsight();
	const form = useForm<DraftValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			to: initialTo,
			cc: "",
			bcc: "",
			subject: initialSubject,
			body: initialBody,
			replyAll: false,
			files: [],
		},
	});
	const [saved, setSaved] = useState<SavedEmailDraft | null>(null);
	const [isUncertain, setIsUncertain] = useState(false);
	const initialized = useRef<string | null>(null);
	const returnFocus = useRef<HTMLElement | null>(null);
	const mounted = useRef(true);
	const writing = useRef(false);
	const draftSession = useRef<EmailDraftSession | null>(null);
	const { isSubmitting, errors } = form.formState;
	const identity = JSON.stringify([insightId, mode, sourceUid ?? "new"]);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			draftSession.current?.dispose();
			draftSession.current = null;
		};
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		if (initialized.current === identity) return;
		initialized.current = identity;
		draftSession.current?.dispose();
		draftSession.current = null;
		form.reset({
			to: initialTo,
			cc: "",
			bcc: "",
			subject: initialSubject,
			body: initialBody,
			replyAll: false,
			files: [],
		});
		setSaved(null);
		setIsUncertain(false);
	}, [form, identity, initialBody, initialSubject, initialTo, isOpen]);

	async function handleSubmit(values: DraftValues): Promise<void> {
		if (isUncertain || writing.current) return;
		if (mode !== "new" && !sourceUid) {
			form.setError("root.server", {
				message: "Select the source email before creating this draft.",
			});
			return;
		}
		if (mode === "reply" && !values.body.trim()) {
			form.setError(
				"body",
				{ message: "Enter reply text." },
				{ shouldFocus: true },
			);
			return;
		}
		if (mode === "forward" && parseAddresses(values.to).length === 0) {
			form.setError(
				"to",
				{ message: "Enter at least one recipient." },
				{ shouldFocus: true },
			);
			return;
		}
		const input: EmailDraftInput =
			mode === "new"
				? {
						mode,
						to: values.to,
						cc: values.cc,
						bcc: values.bcc,
						subject: values.subject,
						body: values.body,
					}
				: mode === "reply"
					? {
							mode,
							sourceUid: sourceUid ?? "",
							body: values.body,
							replyAll: values.replyAll,
						}
					: {
							mode,
							sourceUid: sourceUid ?? "",
							to: values.to,
							body: values.body,
						};
		let result: SavedEmailDraft;
		writing.current = true;
		try {
			if (input.mode === "new" && values.files.length > 0) {
				if (!draftSession.current)
					draftSession.current = new EmailDraftSession();
				result = await draftSession.current.save(
					input,
					values.files.map(({ file }) => file),
				);
			} else {
				result = await saveEmailDraft(actions, input);
			}
		} catch (cause: unknown) {
			if (!mounted.current || initialized.current !== identity) return;
			setIsUncertain(cause instanceof UncertainDraftError);
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "The draft could not be saved.",
			});
			return;
		} finally {
			writing.current = false;
		}
		if (!mounted.current || initialized.current !== identity) return;
		setSaved(result);
		form.reset(values);
		onSaved?.(result);
	}

	function handleOpenChange(open: boolean): void {
		if (!isSubmitting) onOpenChange(open);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				className="max-h-dvh overflow-y-auto sm:max-w-2xl"
				showCloseButton={!isSubmitting}
				onOpenAutoFocus={() => {
					returnFocus.current =
						document.activeElement instanceof HTMLElement
							? document.activeElement
							: null;
				}}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					if (returnFocus.current?.isConnected) {
						event.preventDefault();
						returnFocus.current.focus();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{mode === "new"
							? "New email draft"
							: mode === "reply"
								? "Reply draft"
								: "Forward draft"}
					</DialogTitle>
					<DialogDescription>
						Review your draft, then save it to Outlook. Nothing is
						sent.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					className="flex flex-col gap-4"
					aria-busy={isSubmitting}
				>
					{mode !== "reply" && (
						<ConnectorFormInput
							name="to"
							label={mode === "forward" ? "To (required)" : "To"}
							required={mode === "forward"}
							disabled={isSubmitting}
						/>
					)}
					{mode === "new" && (
						<>
							<div className="grid gap-4 sm:grid-cols-2">
								<ConnectorFormInput
									name="cc"
									label="Cc"
									disabled={isSubmitting}
								/>
								<ConnectorFormInput
									name="bcc"
									label="Bcc"
									disabled={isSubmitting}
								/>
							</div>
							<ConnectorFormInput
								name="subject"
								label="Subject"
								disabled={isSubmitting}
							/>
						</>
					)}
					{mode === "reply" && (
						<>
							<P className="text-muted-foreground">
								Outlook keeps the original subject and addresses
								the sender. Review the final recipients in
								Outlook.
							</P>
							<FormCheckbox
								name="replyAll"
								label="Reply to everyone on the original email"
								disabled={isSubmitting}
							/>
							<P className="text-muted-foreground">
								Reply all includes original recipients,
								including people excluded from assistant
								context.
							</P>
						</>
					)}
					{mode === "forward" && (
						<P className="text-muted-foreground">
							Outlook includes the original message and its
							attachments below your note.
						</P>
					)}
					<ConnectorFormInput
						name="body"
						label={
							mode === "reply"
								? "Reply text (required)"
								: mode === "forward"
									? "Note above forwarded message"
									: "Message"
						}
						multiline
						required={mode === "reply"}
						disabled={isSubmitting}
					/>
					{mode === "new" && (
						<DraftAttachmentField disabled={isSubmitting} />
					)}
					{saved && (
						<div className="rounded-md border border-border p-4">
							<output className="block">
								Saved to Outlook drafts. Nothing was sent.
							</output>
							<a
								href={
									saved.webLink ??
									"https://outlook.office.com/mail/drafts"
								}
								target="_blank"
								rel="noreferrer"
								className="text-primary underline"
							>
								{saved.webLink
									? "Open in Outlook"
									: "Open Outlook drafts folder"}
							</a>
							<P className="text-muted-foreground">
								Further changes here create a new copy. Edit the
								saved draft in Outlook to update it.
							</P>
						</div>
					)}
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					{isUncertain && (
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsUncertain(false);
								form.clearErrors("root.server");
							}}
						>
							I checked Outlook — allow another save
						</Button>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => handleOpenChange(false)}
						>
							Close
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || isUncertain}
						>
							{isSubmitting
								? "Saving draft…"
								: saved
									? "Save a new copy"
									: "Save to Outlook drafts"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
