import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewCall } from "@semoss/shared";
import { Form, FormInput, useForm, z, zodResolver } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ToolApprovalActions } from "../components/tool-approval-actions";
import { ToolViewCard } from "../components/tool-view-card";
import { readArgText } from "../core/tool-view-call";
import { useToolDecision } from "../core/use-tool-decision";
import type { MailApp } from "./mail-apps";
import { MailMessageSummary } from "./mail-message-summary";

/** What the user can change before an email is moved. */
interface MailChangeValues {
	/** The folder or label it moves to. */
	folder: string;
}

/** Props for {@link MailChangeApproval}. */
export interface MailChangeApprovalProps {
	/** The mailbox the email is in. */
	app: MailApp;
	/** Whether the call moves the email to a folder or deletes it. */
	intent: "move" | "delete";
	/** The call, waiting for the user. */
	call: ToolViewCall;
	/** Runs the call, with the folder the user chose. */
	onApprove: (editedArguments?: Record<string, unknown>) => Promise<void>;
	/** Denies the call. */
	onDecline: () => Promise<void>;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * Asks before an email is moved or deleted: which email, and for a move the
 * folder, which the user can change.
 */
export const MailChangeApproval = ({
	app,
	intent,
	call,
	onApprove,
	onDecline,
	onSignIn,
}: MailChangeApprovalProps) => {
	const { t } = useTranslation("connectors");
	const denial = useToolDecision();
	const isMove = intent === "move";
	const schema = useMemo(
		() =>
			z.object({
				folder: isMove
					? z
							.string()
							.trim()
							.min(1, {
								message: t("toolViews.mail.folderRequired"),
							})
					: z.string(),
			}),
		[isMove, t],
	);
	const form = useForm<MailChangeValues>({
		resolver: zodResolver(schema),
		defaultValues: { folder: readArgText(call.arguments, "folder") },
	});
	const { errors, isSubmitting } = form.formState;
	const isBusy = isSubmitting || denial.pending !== null;

	const handleSubmit = async (values: MailChangeValues): Promise<void> => {
		try {
			await onApprove(
				isMove
					? { ...call.arguments, folder: values.folder }
					: undefined,
			);
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(error),
			});
		}
	};

	return (
		<ToolViewCard
			brand={app.brand}
			title={t(
				isMove
					? "toolViews.mail.moveTitle"
					: "toolViews.mail.deleteTitle",
			)}
			description={isMove ? t("toolViews.reviewNote") : undefined}
		>
			<MailMessageSummary
				app={app}
				messageId={readArgText(call.arguments, "id")}
				onSignIn={onSignIn}
			/>
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isBusy}
				className="flex flex-col gap-3"
			>
				{isMove ? (
					<FormInput
						name="folder"
						label={t("toolViews.mail.folder")}
						description={t("toolViews.mail.folderHint")}
						required
						disabled={isBusy}
					/>
				) : null}
				<ToolApprovalActions
					approveLabel={t(
						isMove
							? "toolViews.mail.move"
							: "toolViews.mail.delete",
					)}
					isBusy={isBusy}
					isApproving={isSubmitting}
					error={errors.root?.server?.message ?? denial.error}
					onDeny={() => denial.decide("deny", onDecline)}
				/>
			</Form>
		</ToolViewCard>
	);
};
