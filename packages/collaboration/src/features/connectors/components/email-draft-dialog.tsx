import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { draftText, plainTextEmail } from "@/features/email/email-html";
import { EmailDraftSession } from "../api/email-draft-session";
import {
	type EmailDraftValues,
	emailDraftSchema,
} from "../api/email-draft-values";
import {
	parseAddresses,
	saveEmailDraft,
	UncertainDraftError,
} from "../api/microsoft";
import type { EmailDraftInput, SavedEmailDraft } from "../types";
import {
	showEmailDraftFailureToast,
	showEmailDraftSavedToast,
} from "./email-draft-feedback";
import { EmailDraftForm } from "./email-draft-form";
import type { EmailReplyContext } from "./email-reply-field";

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
	/** Known source sender for the native reply envelope. */
	replyContext?: EmailReplyContext;
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
	replyContext,
	onSaved,
}: EmailDraftDialogProps) {
	const { actions, insightId } = useInsight();
	const form = useForm<EmailDraftValues>({
		resolver: zodResolver(emailDraftSchema),
		defaultValues: {
			to: initialTo,
			cc: "",
			bcc: "",
			subject: initialSubject,
			body: plainTextEmail(initialBody),
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
	const { isDirty, isSubmitting } = form.formState;
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
			body: plainTextEmail(initialBody),
			replyAll: false,
			files: [],
		});
		setSaved(null);
		setIsUncertain(false);
	}, [form, identity, initialBody, initialSubject, initialTo, isOpen]);

	async function handleSubmit(values: EmailDraftValues): Promise<void> {
		if (isUncertain || writing.current) return;
		if (mode !== "new" && !sourceUid) {
			const message =
				"Select the source email before creating this draft.";
			form.setError("root.server", {
				message,
			});
			showEmailDraftFailureToast(message, { isUncertain: false });
			return;
		}
		if (mode === "reply" && !draftText(values.body, "html")) {
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
						bodyFormat: "html",
					}
				: mode === "reply"
					? {
							mode,
							sourceUid: sourceUid ?? "",
							body: values.body,
							bodyFormat: "html",
							replyAll: values.replyAll,
						}
					: {
							mode,
							sourceUid: sourceUid ?? "",
							to: values.to,
							body: values.body,
							bodyFormat: "html",
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
			const uncertain = cause instanceof UncertainDraftError;
			const message =
				cause instanceof Error
					? cause.message
					: "The draft could not be saved.";
			setIsUncertain(uncertain);
			form.setError("root.server", {
				message,
			});
			showEmailDraftFailureToast(
				message,
				uncertain
					? {
							isUncertain: true,
							onConfirmRetry: () => {
								if (
									!mounted.current ||
									initialized.current !== identity
								)
									return;
								setIsUncertain(false);
								form.clearErrors("root.server");
							},
						}
					: { isUncertain: false },
			);
			return;
		} finally {
			writing.current = false;
		}
		if (!mounted.current || initialized.current !== identity) return;
		setSaved(result);
		form.reset(values);
		showEmailDraftSavedToast(result);
		onSaved?.(result);
	}

	function handleOpenChange(open: boolean): void {
		if (!isSubmitting) onOpenChange(open);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				className="flex max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-h-dvh sm:max-w-3xl"
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
				<DialogHeader className="shrink-0 border-border border-b px-4 py-3 pr-12">
					<DialogTitle className="text-base">
						{mode === "new"
							? "New email draft"
							: mode === "reply"
								? "Reply draft"
								: "Forward draft"}
					</DialogTitle>
					<DialogDescription className="sr-only">
						Review your draft, then save it to Outlook. Nothing is
						sent.
					</DialogDescription>
				</DialogHeader>
				<EmailDraftForm
					form={form}
					mode={mode}
					sourceSubject={initialSubject}
					replyContext={replyContext}
					hasSavedDraft={Boolean(saved)}
					canSave={!saved || isDirty}
					isUncertain={isUncertain}
					onSave={handleSubmit}
				/>
			</DialogContent>
		</Dialog>
	);
}
