import { useId, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewCall } from "@semoss/shared";
import {
	Form,
	FormCheckbox,
	FormRadioGroup,
	FormTextarea,
	Label,
	RadioGroupItem,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ToolApprovalActions } from "../components/tool-approval-actions";
import { ToolViewCard } from "../components/tool-view-card";
import { readArgFlag, readArgText } from "../core/tool-view-call";
import { useToolDecision } from "../core/use-tool-decision";
import type { CalendarApp } from "./calendar-apps";
import { CalendarEventSummary } from "./calendar-event-summary";

/** The answers an invitation takes, as `RespondToEvent` reads them. */
const RESPONSES = ["accept", "tentative", "decline"] as const;

/** The label of each answer. */
const RESPONSE_KEYS = {
	accept: "toolViews.calendar.accept",
	tentative: "toolViews.calendar.tentative",
	decline: "toolViews.calendar.decline",
} as const;

/** The other words for a tentative answer the reactor reads. */
const TENTATIVE_ALIASES = ["tentativelyaccept", "maybe"];

/** What the user can change before an invitation is answered. */
interface CalendarResponseValues {
	/** `accept`, `tentative`, or `decline`; empty until one is chosen. */
	response: string;
	comment: string;
	sendResponse: boolean;
}

/**
 * The answer the model gave, read the way the reactor reads it.
 *
 * @param value - The call's `response`.
 * @return The answer, or empty when it is none the reactor takes, so the
 * user chooses one.
 */
const readResponse = (value: string): string => {
	const normalized = value.trim().toLowerCase();
	if (TENTATIVE_ALIASES.includes(normalized)) {
		return "tentative";
	}
	return RESPONSES.find((response) => response === normalized) ?? "";
};

/** Props for {@link CalendarResponseForm}. */
export interface CalendarResponseFormProps {
	/** The calendar the invitation is on. */
	app: CalendarApp;
	/** The call, waiting for the user. */
	call: ToolViewCall;
	/** Runs the call, with the user's answer. */
	onApprove: (editedArguments?: Record<string, unknown>) => Promise<void>;
	/** Denies the call. */
	onDecline: () => Promise<void>;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * An answer to an invitation the agent wants to send, before it does: the
 * event, the answer, a message to the organizer, and whether the organizer is
 * told, each filled in from the model and changeable.
 */
export const CalendarResponseForm = ({
	app,
	call,
	onApprove,
	onDecline,
	onSignIn,
}: CalendarResponseFormProps) => {
	const { t } = useTranslation("connectors");
	const idPrefix = useId();
	const denial = useToolDecision();
	const schema = useMemo(
		() =>
			z.object({
				response: z
					.string()
					.refine(
						(value) =>
							RESPONSES.some((response) => response === value),
						{ message: t("toolViews.calendar.responseRequired") },
					),
				comment: z.string(),
				sendResponse: z.boolean(),
			}),
		[t],
	);
	const form = useForm<CalendarResponseValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			response: readResponse(readArgText(call.arguments, "response")),
			comment: readArgText(call.arguments, "comment"),
			sendResponse: readArgFlag(call.arguments, "sendResponse", true),
		},
	});
	const { errors, isSubmitting } = form.formState;
	const isBusy = isSubmitting || denial.pending !== null;

	const handleSubmit = async (
		values: CalendarResponseValues,
	): Promise<void> => {
		const edited: Record<string, unknown> = {
			...call.arguments,
			response: values.response,
			sendResponse: values.sendResponse,
		};
		if (values.comment.trim()) {
			edited.comment = values.comment;
		} else {
			delete edited.comment;
		}
		try {
			await onApprove(edited);
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
			title={t("toolViews.calendar.respondTitle")}
			description={t("toolViews.reviewNote")}
		>
			<CalendarEventSummary
				app={app}
				eventId={readArgText(call.arguments, "id")}
				onSignIn={onSignIn}
			/>
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isBusy}
				className="flex flex-col gap-3"
			>
				<FormRadioGroup
					name="response"
					label={t("toolViews.required", {
						label: t("toolViews.calendar.response"),
					})}
					aria-label={t("toolViews.calendar.response")}
					required
					disabled={isBusy}
					className="gap-2"
				>
					{RESPONSES.map((response) => (
						<div key={response} className="flex items-center gap-2">
							<RadioGroupItem
								id={`${idPrefix}-${response}`}
								value={response}
							/>
							<Label
								htmlFor={`${idPrefix}-${response}`}
								className="font-normal"
							>
								{t(RESPONSE_KEYS[response])}
							</Label>
						</div>
					))}
				</FormRadioGroup>
				<FormTextarea
					name="comment"
					label={t("toolViews.calendar.comment")}
					rows={3}
					disabled={isBusy}
				/>
				<FormCheckbox
					name="sendResponse"
					label={t("toolViews.calendar.sendResponse")}
					disabled={isBusy}
				/>
				<ToolApprovalActions
					approveLabel={t("toolViews.calendar.respond")}
					isBusy={isBusy}
					isApproving={isSubmitting}
					error={errors.root?.server?.message ?? denial.error}
					onDeny={() => denial.decide("deny", onDecline)}
				/>
			</Form>
		</ToolViewCard>
	);
};
