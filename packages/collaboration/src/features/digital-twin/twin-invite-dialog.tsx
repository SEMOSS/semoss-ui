import type { RefObject } from "react";
import { useHref } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import type { AddMembersCandidate } from "@semoss/shared";
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
	FormTextarea,
	P,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { twinChatPath } from "@/lib/workspace-paths";
import { sendTwinNote } from "./api/digital-twin";

const schema = z.object({
	note: z
		.string()
		.trim()
		.min(1, "Write a note to send")
		.max(4000, "Keep the note under 4,000 characters"),
});
type InviteValues = z.infer<typeof schema>;

interface TwinInviteDialogProps {
	/** The twin the people were given. */
	twin: { id: string; name: string };
	/** The people just given access. */
	people: readonly AddMembersCandidate[];
	/** The day their access ends, as it is shown, such as "Dec 31, 2026"; left out for no end. */
	accessEnds?: string;
	/** What opened the dialog, which gets the focus back when it closes. */
	returnFocusRef: RefObject<HTMLButtonElement | null>;
	/** The dialog is done: whether the note went out, or it was closed unsent. */
	onClose: (isSent: boolean) => void;
}

/**
 * A note to the people a twin was just shared with, sent from the owner's own
 * Outlook with the link to the chat under it. Mounted while it is open, so
 * each opening starts from the people just added.
 */
export function TwinInviteDialog({
	twin,
	people,
	accessEnds,
	returnFocusRef,
	onClose,
}: TwinInviteDialogProps) {
	const { actions } = useInsight();
	// as this router writes it, made whole against the page's own address
	const link = new URL(useHref(twinChatPath(twin.id)), window.location.href)
		.href;
	const emails = [
		...new Set(
			people.flatMap((person) =>
				person.email?.trim() ? [person.email.trim()] : [],
			),
		),
	];
	const unreached = people
		.filter((person) => !person.email?.trim())
		.map((person) => person.name || person.id);
	const form = useForm<InviteValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			note: [
				`I've shared a Digital Twin of mine, "${twin.name}", with you. It is an AI that answers questions about my work from the copies of emails, chats and files I chose to put into it, so you can ask it things when I'm not around.`,
				"It only knows what I put into it, and it cannot see your mail, calendar or files. Check anything important with me.",
				...(accessEnds
					? [`You can chat with it until ${accessEnds}.`]
					: []),
			].join("\n\n"),
		},
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async ({ note }: InviteValues): Promise<void> => {
		try {
			await sendTwinNote(
				actions,
				emails,
				`I shared a Digital Twin with you: ${twin.name}`,
				`${note}\n\nChat with it here:\n${link}`,
			);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "The note could not be sent.",
			});
			return;
		}
		toast.success("Note sent");
		onClose(true);
	};

	return (
		<Dialog
			open
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) onClose(false);
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
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle className="wrap-anywhere">
						Tell them about {twin.name}
					</DialogTitle>
					<DialogDescription>
						An email from your own Outlook. Nothing is sent until
						you choose Send.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex min-w-0 flex-col gap-4"
				>
					{emails.length > 0 ? (
						<P className="wrap-anywhere text-sm">
							<span className="font-medium">To: </span>
							{emails.join(", ")}
							{emails.length > 1 &&
								". Each gets a blind copy, so none of them sees who else you shared it with."}
						</P>
					) : (
						<P className="text-sm">
							None of them has an email address on file, so there
							is no one to send this to. Copy the link and send it
							yourself.
						</P>
					)}
					{emails.length > 0 && unreached.length > 0 && (
						<P className="wrap-anywhere text-muted-foreground text-sm">
							No email address on file for {unreached.join(", ")},
							so this does not reach them.
						</P>
					)}
					<FormTextarea
						name="note"
						label="Note"
						rows={7}
						disabled={isSubmitting}
						description={
							<>
								The link to the chat goes under your note:{" "}
								<span className="wrap-anywhere">{link}</span>
							</>
						}
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
							onClick={() =>
								void copyTextToClipboard(link, {
									onSuccess: () =>
										toast.success("Link copied"),
									onError: () =>
										toast.error(
											"The link could not be copied. Select it under the note and copy it yourself.",
										),
								})
							}
						>
							Copy link
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onClose(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || emails.length === 0}
						>
							{isSubmitting && <Spinner className="size-4" />}
							{isSubmitting
								? "Sending…"
								: "Send from your Outlook"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
