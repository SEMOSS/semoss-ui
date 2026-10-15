import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewCall } from "@semoss/shared";
import {
	Form,
	FormCheckbox,
	FormInput,
	FormTextarea,
	Muted,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ToolApprovalActions } from "../components/tool-approval-actions";
import { ToolViewCard } from "../components/tool-view-card";
import { readArgText } from "../core/tool-view-call";
import { useToolDecision } from "../core/use-tool-decision";
import type { CalendarApp } from "./calendar-apps";
import {
	type CalendarEventIntent,
	type CalendarEventValues,
	createCalendarEventSchema,
	toCalendarEventArguments,
	toCalendarEventValues,
} from "./calendar-event-edit";
import { CalendarEventSummary } from "./calendar-event-summary";

/** Props for {@link CalendarEventForm}. */
export interface CalendarEventFormProps {
	/** The calendar the event is on. */
	app: CalendarApp;
	/** Whether the call creates an event or changes one. */
	intent: CalendarEventIntent;
	/** The call, waiting for the user. */
	call: ToolViewCall;
	/** Runs the call, with the user's edits. */
	onApprove: (editedArguments?: Record<string, unknown>) => Promise<void>;
	/** Denies the call. */
	onDecline: () => Promise<void>;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * An event the agent wants to create or change, before it does: every field
 * is filled in from the model and can be changed. A change names the event
 * it changes, and only what is filled in is changed.
 */
export const CalendarEventForm = ({
	app,
	intent,
	call,
	onApprove,
	onDecline,
	onSignIn,
}: CalendarEventFormProps) => {
	const { t } = useTranslation("connectors");
	const denial = useToolDecision();
	const schema = useMemo(
		() =>
			createCalendarEventSchema(intent, {
				timeRequired: t("toolViews.calendar.timeRequired"),
				timeInvalid: t("toolViews.calendar.timeInvalid"),
				addresses: t("toolViews.mail.addressesInvalid"),
			}),
		[intent, t],
	);
	const form = useForm<CalendarEventValues>({
		resolver: zodResolver(schema),
		defaultValues: toCalendarEventValues(call.arguments),
	});
	const { errors, isSubmitting, dirtyFields } = form.formState;
	const isBusy = isSubmitting || denial.pending !== null;
	const isCreate = intent === "create";
	const timeLabel = (key: string): string =>
		isCreate ? t("toolViews.required", { label: t(key) }) : t(key);

	const handleSubmit = async (values: CalendarEventValues): Promise<void> => {
		try {
			await onApprove(
				toCalendarEventArguments(intent, values, call.arguments, {
					isAllDay: dirtyFields.isAllDay,
					isOnlineMeeting: dirtyFields.isOnlineMeeting,
				}),
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
				isCreate
					? "toolViews.calendar.createTitle"
					: "toolViews.calendar.updateTitle",
			)}
			description={t("toolViews.reviewNote")}
		>
			{isCreate ? null : (
				<CalendarEventSummary
					app={app}
					eventId={readArgText(call.arguments, "id")}
					onSignIn={onSignIn}
				/>
			)}
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isBusy}
				className="flex flex-col gap-3"
			>
				<FormInput
					name="subject"
					label={t("toolViews.calendar.subject")}
					disabled={isBusy}
				/>
				<div className="grid gap-3 sm:grid-cols-2">
					<FormInput
						name="start"
						label={timeLabel("toolViews.calendar.start")}
						required={isCreate}
						autoComplete="off"
						disabled={isBusy}
					/>
					<FormInput
						name="end"
						label={timeLabel("toolViews.calendar.end")}
						required={isCreate}
						autoComplete="off"
						disabled={isBusy}
					/>
				</div>
				<Muted className="-mt-1 text-xs">
					{t("toolViews.calendar.timeHint")}
				</Muted>
				<FormInput
					name="timeZone"
					label={t("toolViews.calendar.timeZone")}
					description={t("toolViews.calendar.timeZoneHint")}
					autoComplete="off"
					disabled={isBusy}
				/>
				<FormCheckbox
					name="isAllDay"
					label={t("calendar.allDay")}
					disabled={isBusy}
				/>
				<FormInput
					name="location"
					label={t("calendar.location")}
					disabled={isBusy}
				/>
				<FormInput
					name="attendees"
					label={t("calendar.attendees")}
					description={t("toolViews.mail.addressesHint")}
					autoComplete="off"
					disabled={isBusy}
				/>
				<FormInput
					name="optionalAttendees"
					label={t("toolViews.calendar.optionalAttendees")}
					autoComplete="off"
					disabled={isBusy}
				/>
				<FormCheckbox
					name="isOnlineMeeting"
					label={t("toolViews.calendar.onlineMeeting")}
					disabled={isBusy}
				/>
				<FormTextarea
					name="body"
					label={t("toolViews.calendar.description")}
					rows={5}
					disabled={isBusy}
				/>
				{isCreate ? null : (
					<Muted className="text-xs">
						{t("toolViews.calendar.updateNote")}
					</Muted>
				)}
				<ToolApprovalActions
					approveLabel={t(
						isCreate
							? "toolViews.calendar.create"
							: "toolViews.calendar.update",
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
