import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import type { ToolCallOutcome, ToolViewCall } from "@semoss/shared";
import {
	Button,
	Form,
	FormCheckbox,
	FormInput,
	FormTextarea,
	Muted,
	Spinner,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ToolApprovalActions } from "../components/tool-approval-actions";
import { ToolOutcomePanel } from "../components/tool-outcome-panel";
import { ToolViewCard } from "../components/tool-view-card";
import {
	classifyConnectorError,
	getConnectorErrorKey,
	runConnectorPixel,
} from "../core/connector-pixel";
import { readArgFlag, readArgList, splitList } from "../core/tool-view-call";
import { useToolDecision } from "../core/use-tool-decision";
import { parseMailReceipt } from "./mail.parsers";
import type { MailApp } from "./mail-apps";
import {
	createMailComposeSchema,
	type MailComposeKind,
	type MailComposeValues,
	mailComposeAlternative,
	toMailComposeArguments,
	toMailComposeValues,
} from "./mail-compose";
import {
	clearMailComposeOutcome,
	stageMailComposeOutcome,
	useMailComposeOutcome,
} from "./mail-compose-outcomes";

/** The heading of each kind of compose call, and of its draft. */
const TITLE_KEYS = {
	send: "toolViews.mail.sendTitle",
	draft: "toolViews.mail.draftTitle",
	reply: "toolViews.mail.replyTitle",
	replyDraft: "toolViews.mail.replyDraftTitle",
	forward: "toolViews.mail.forwardTitle",
	forwardDraft: "toolViews.mail.forwardDraftTitle",
} as const;

/** The approve button of each kind of compose call, and of its draft. */
const APPROVE_KEYS = {
	send: "toolViews.mail.send",
	draft: "toolViews.mail.saveDraft",
	reply: "toolViews.mail.sendReply",
	replyDraft: "toolViews.mail.saveDraft",
	forward: "toolViews.mail.forward",
	forwardDraft: "toolViews.mail.saveDraft",
} as const;

/** Props for {@link MailComposeForm}. */
export interface MailComposeFormProps {
	/** The mailbox the email goes out from. */
	app: MailApp;
	/** What the call does. */
	kind: Exclude<MailComposeKind, "sendDraft">;
	/** The call, waiting for the user. */
	call: ToolViewCall;
	/** Runs the call, with the user's edits. */
	onApprove: (editedArguments?: Record<string, unknown>) => Promise<void>;
	/** Denies the call. */
	onDecline: () => Promise<void>;
	/** Resolves the call with what the user did instead. */
	onRespond: (outcome: ToolCallOutcome) => Promise<void>;
}

/**
 * An email the agent wants to send or save, before it does: every field is
 * filled in from the model and can be changed. Besides running the call, it
 * offers the other operation on the same mailbox, such as saving a draft in
 * place of sending. That runs at once; the agent then hears what was done
 * when the user goes back to it. Until then the call offers only that, even
 * shown again, so the email never runs twice.
 */
export const MailComposeForm = ({
	app,
	kind,
	call,
	onApprove,
	onDecline,
	onRespond,
}: MailComposeFormProps) => {
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const decision = useToolDecision();
	const done = useMailComposeOutcome(call.id);
	const [isRunningAlternative, setIsRunningAlternative] = useState(false);
	const schema = useMemo(
		() =>
			createMailComposeSchema(kind, {
				addresses: t("toolViews.mail.addressesInvalid"),
				recipient: t("toolViews.mail.recipientRequired"),
				forwardTo: t("toolViews.mail.forwardToRequired"),
				replyBody: t("toolViews.mail.replyBodyRequired"),
			}),
		[kind, t],
	);
	const form = useForm<MailComposeValues>({
		resolver: zodResolver(schema),
		defaultValues: toMailComposeValues(call.arguments),
	});
	const { errors, isSubmitting } = form.formState;
	const isBusy = isSubmitting || decision.pending !== null;

	const args = call.arguments;
	const isDraft = readArgFlag(args, "asDraft");
	const variant =
		(kind === "reply" || kind === "forward") && isDraft
			? (`${kind}Draft` as const)
			: kind;
	const isHtml = readArgFlag(args, "html");
	const attachments = readArgList(args, "attachments");
	const hasRecipients = kind === "send" || kind === "draft";
	const hasReplyRecipients =
		kind === "reply" && readArgFlag(args, "overrideRecipients");
	const offered = mailComposeAlternative(kind, app, args);
	const appName = t(app.appNameKey);

	const handleSubmit = async (values: MailComposeValues): Promise<void> => {
		try {
			await onApprove(toMailComposeArguments(kind, values, args));
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(error),
			});
		}
	};

	const handleAlternative = async (
		values: MailComposeValues,
	): Promise<void> => {
		const alternative = mailComposeAlternative(
			kind,
			app,
			toMailComposeArguments(kind, values, args),
		);
		if (!alternative) {
			return;
		}
		// a draft has no recipient it needs, but sending it does
		if (
			alternative.action === "sendNow" &&
			kind === "draft" &&
			[values.to, values.cc, values.bcc].every(
				(value) => splitList(value).length === 0,
			)
		) {
			form.setError("to", {
				type: "required",
				message: t("toolViews.mail.recipientRequired"),
			});
			return;
		}
		if (!insightId) {
			form.setError("root.server", {
				type: "server",
				message: t("errors.noInsight"),
			});
			return;
		}
		setIsRunningAlternative(true);
		try {
			const result = await runConnectorPixel(
				alternative.pixel,
				insightId,
			);
			stageMailComposeOutcome(call.id, {
				alternative: alternative,
				result: result,
			});
		} catch (error: unknown) {
			const info = classifyConnectorError(error);
			form.setError("root.server", {
				type: "server",
				message: t(getConnectorErrorKey(info), {
					message: info.message,
				}),
			});
		} finally {
			setIsRunningAlternative(false);
		}
	};

	if (done) {
		const { alternative, result } = done;
		return (
			<ToolViewCard brand={app.brand} title={t(TITLE_KEYS[variant])}>
				<ToolOutcomePanel
					message={t(
						alternative.action === "sendNow"
							? "toolViews.mail.sentInstead"
							: "toolViews.mail.savedAsDraftInstead",
						{ app: appName },
					)}
					webUrl={parseMailReceipt(result)?.webLink}
					appName={appName}
					isReturning={decision.pending === "respond"}
					error={decision.error}
					onReturn={() =>
						decision.decide("respond", async () => {
							await onRespond({
								userAction: alternative.userAction,
								summary: alternative.summary,
								result: result,
							});
							clearMailComposeOutcome(call.id);
						})
					}
				/>
			</ToolViewCard>
		);
	}

	return (
		<ToolViewCard
			brand={app.brand}
			title={t(TITLE_KEYS[variant])}
			description={t("toolViews.reviewNote")}
		>
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isBusy}
				className="flex flex-col gap-3"
			>
				{hasRecipients || kind === "forward" || hasReplyRecipients ? (
					<FormInput
						name="to"
						label={
							kind === "forward"
								? t("toolViews.required", {
										label: t("mail.to"),
									})
								: t("mail.to")
						}
						description={t("toolViews.mail.addressesHint")}
						required={kind === "forward"}
						autoComplete="off"
						disabled={isBusy}
					/>
				) : null}
				{hasRecipients || hasReplyRecipients ? (
					<FormInput
						name="cc"
						label={t("mail.cc")}
						autoComplete="off"
						disabled={isBusy}
					/>
				) : null}
				{hasRecipients ? (
					<>
						<FormInput
							name="bcc"
							label={t("toolViews.mail.bcc")}
							autoComplete="off"
							disabled={isBusy}
						/>
						<FormInput
							name="subject"
							label={t("toolViews.mail.subject")}
							disabled={isBusy}
						/>
					</>
				) : null}
				{kind === "reply" ? (
					<FormCheckbox
						name="replyAll"
						label={t("toolViews.mail.replyAll")}
						disabled={isBusy}
					/>
				) : null}
				<FormTextarea
					name="body"
					label={
						kind === "reply"
							? t("toolViews.required", {
									label: t(
										isHtml
											? "toolViews.mail.bodyHtml"
											: "toolViews.mail.body",
									),
								})
							: t(
									isHtml
										? "toolViews.mail.bodyHtml"
										: "toolViews.mail.body",
								)
					}
					required={kind === "reply"}
					rows={8}
					disabled={isBusy}
				/>
				{attachments.length > 0 ? (
					<Muted className="wrap-anywhere text-xs">
						{t("toolViews.mail.attaching", {
							names: attachments.join(", "),
						})}
					</Muted>
				) : null}
				<ToolApprovalActions
					approveLabel={t(APPROVE_KEYS[variant])}
					isBusy={isBusy}
					isApproving={isSubmitting && !isRunningAlternative}
					error={errors.root?.server?.message ?? decision.error}
					onDeny={() => decision.decide("deny", onDecline)}
				>
					{offered ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isBusy}
							onClick={form.handleSubmit(handleAlternative)}
						>
							{isRunningAlternative ? (
								<Spinner className="size-4" />
							) : null}
							{t(
								offered.action === "sendNow"
									? "toolViews.mail.sendNow"
									: "toolViews.mail.saveAsDraft",
							)}
						</Button>
					) : null}
				</ToolApprovalActions>
			</Form>
		</ToolViewCard>
	);
};
