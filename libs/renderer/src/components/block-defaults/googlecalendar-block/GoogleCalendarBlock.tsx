import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  MenuItem,
  Select,
  FormControl,
  DateTimePicker,
  DatePicker,
} from "@semoss/ui";
import { useBlock, useTypeWriter } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import { Controller, useForm } from "react-hook-form";
import { oauth, getUserDetails, runPixel } from "@semoss/sdk/react";
import {
  Button,
  TextField,
  Modal,
  Stack,
  useNotification,
  styled,
  Typography,
  Tabs,
  Tab,
} from "@semoss/ui";
import { PathValue } from "../../../types";

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: `${theme.spacing(1)}!important`,
}));

type showCalendarCreateForm = {
  GOOGLECALENDAR_SUMMARY: string;
  GOOGLECALENDAR_LOCATION: string;
  GOOGLECALENDAR_DESCRIPTION: string;
  GOOGLECALENDAR_STARTDATE: string;
  GOOGLECALENDAR_ENDDATE: string;
  GOOGLECALENDAR_EMAIL: string;
  GOOGLECALENDAR_VIDEO: boolean;
  GOOGLECALENDAR_FREQUENCY?: string;
  GOOGLECALENDAR_UNTIL?: string;
};

type showCalendarUpdateForm = {
  GOOGLECALENDAR_SUMMARY: string;
  GOOGLECALENDAR_LOCATION: string;
  GOOGLECALENDAR_DESCRIPTION: string;
  GOOGLECALENDAR_STARTDATE: string;
  GOOGLECALENDAR_ENDDATE: string;
  GOOGLECALENDAR_VIDEO: boolean;
  GOOGLECALENDAR_EMAIL: string;
  GOOGLECALENDAR_ID: string;
  GOOGLECALENDAR_FREQUENCY?: string;
  GOOGLECALENDAR_UNTIL?: string;
};

export interface GoogleCalendarBlockDef extends BlockDef<"googlecalendartext"> {
  widget: "googlecalendartext";
  data: {
    style: CSSProperties;
    text: string;
    variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
    isStreaming: boolean;
    show: string;
    showCalendarCreateForm: boolean;
    showCreateForm: boolean;
    showCalendarUpdateForm: boolean;
    showUpdateForm: boolean;
    showReadForm: boolean;
    showDeleteForm: boolean;
  };
  slots: never;
  listeners: never;
}

export const GoogleCalendarBlock: BlockComponent = observer(({ id }) => {
  const { data, setData } = useBlock<GoogleCalendarBlockDef>(id);
  const [createdCalendar, setCreatedCalendar] = useState<{
    summary: string;
    location: string;
    description: string;
    startDate: string;
    endDate: string;
    email: string;
    video: boolean;
    id?: string;
    Link?: string;
    frequency?: string;
    until?: string;
  } | null>(null);
  const [updatedCalendar, setUpdatedCalendar] = useState<{
    id: string;
    summary: string;
    location: string;
    description: string;
    startDate: string;
    endDate: string;
    email: string;
    video: boolean;
    frequency?: string;
    until?: string;
  } | null>(null);
  const [deletedCalendar, setDeletedCalendar] = useState<{
    id: string;
    summary: string;
    location: string;
    description: string;
    startDate: string;
    endDate: string;
    email: string;
    video: boolean;
    frequency?: string;
    until?: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalDeleteConfirm, setShowFinalDeleteConfirm] = useState(false);
  const [finalDeleteAction, setFinalDeleteAction] = useState<{
    type: "single" | "series";
    eventId: string;
    eventName: string;
  } | null>(null);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    dayjs().subtract(3, "month")
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    dayjs().add(3, "month")
  );
  const [calendarSummaryList, setCalendarSummaryList] = useState<
    {
      summary: string;
      id: string;
      recurringId?: string;
      date: string;
      displayText: string;
    }[]
  >([]);
  const [updateFrequency, setUpdateFrequency] = useState<string>("NONE");
  const [showRecurringFields, setShowRecurringFields] = useState(false);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<{
    id: string;
    recurringId?: string;
    summary: string;
    isRecurring: boolean;
  } | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedEventDetails, setExpandedEventDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const notification = useNotification();
  const [loggedInUser, setLoggedInUser] = useState("");
  const [activeTab, setActiveTab] = useState<"calendar" | "list">("list");
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);

  const textContent =
    typeof data.text == "string" ? data.text : JSON.stringify(data.text);
  let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

  useEffect(() => {
    // Check if user is already logged in
    (async () => {
      try {
        const response = await getUserDetails("google");
        if (response.name) {
          setLoggedInUser(response.name);
          notification.add({
            color: "success",
            message: "Successfully logged into Google",
          });
        }
      } catch (error) {
        notification.add({
          color: "error",
          message: "Failed to fetch Google user info",
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (loggedInUser && startDate && endDate) {
      getCalendarList(startDate, endDate);
    }
  }, [loggedInUser, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      getCalendarList(startDate, endDate);
    }
  }, [data.showCalendarUpdateForm]);

  if (!data.isStreaming) displayTxt = textContent;
  const {
    handleSubmit: handleCreateSubmit,
    control: controlCreate,
    reset: resetCreate,
  } = useForm<showCalendarCreateForm>({
    defaultValues: {
      GOOGLECALENDAR_SUMMARY: "",
      GOOGLECALENDAR_LOCATION: "",
      GOOGLECALENDAR_DESCRIPTION: "",
      GOOGLECALENDAR_STARTDATE: "",
      GOOGLECALENDAR_ENDDATE: "",
      GOOGLECALENDAR_EMAIL: "",
      GOOGLECALENDAR_VIDEO: false,
      GOOGLECALENDAR_FREQUENCY: "",
      GOOGLECALENDAR_UNTIL: "",
    },
  });

  const {
    getValues: getUpdateValues,
    handleSubmit: handleUpdateSubmit,
    control: controlUpdate,
    reset: resetUpdate,
    setValue: setUpdateValue,
  } = useForm<showCalendarUpdateForm>({
    defaultValues: {
      GOOGLECALENDAR_SUMMARY: "",
      GOOGLECALENDAR_LOCATION: "",
      GOOGLECALENDAR_DESCRIPTION: "",
      GOOGLECALENDAR_STARTDATE: "",
      GOOGLECALENDAR_ENDDATE: "",
      GOOGLECALENDAR_VIDEO: false,
      GOOGLECALENDAR_EMAIL: "",
      GOOGLECALENDAR_ID: "",
      GOOGLECALENDAR_FREQUENCY: "",
      GOOGLECALENDAR_UNTIL: "",
    },
  });

  const getCalendarList = async (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    if (!start || !end) {
      console.warn("getCalendarList: start or end date is null");
      return;
    }

    try {
      const startDate = start.format("YYYY-MM-DDTHH:mm:ssZ");
      const endDate = end.format("YYYY-MM-DDTHH:mm:ssZ");
      const response = await runPixel<[string]>(
        `META | GoogleCalendarList(startDate="${startDate}",endDate="${endDate}");`
      );
      let output: any = response.pixelReturn[0].output;
      const type = response.pixelReturn[0].operationType;
      if (type.indexOf("ERROR") === -1) {
        // Parse output if it's a string
        if (typeof output === "string") {
          try {
            output = JSON.parse(output);
          } catch (e) {
            console.warn("Failed to parse calendar output as JSON:", e);
            output = [];
          }
        }

        // Transform the new format to flat array for display
        const events: {
          summary: string;
          id: string;
          recurringId?: string;
          date: string;
          displayText: string;
        }[] = [];

        if (Array.isArray(output)) {
          output.forEach((dayData: any) => {
            const date = dayData.date;
            if (dayData.events && Array.isArray(dayData.events)) {
              dayData.events.forEach((event: string[]) => {
                const summary = event[0];
                const eventId = event[1];
                const recurringId = event.length > 2 ? event[2] : undefined;

                events.push({
                  summary,
                  id: eventId,
                  recurringId,
                  date,
                  displayText: `${date} - ${summary}`, // For UI display
                });
              });
            }
          });
        }

        // Sort events by date to ensure proper grouping in the UI
        events.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setCalendarSummaryList(events);
      } else {
        throw new Error(output);
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setCalendarSummaryList([]);
    }
  };

  // Enhanced read method that can handle both form data and direct event ID
  const readEventDetails = async (
    eventId: string,
    options?: {
      setExpandedDetails?: boolean;
      setFormData?: boolean;
      expandedEventId?: string;
    }
  ) => {
    try {
      const response = await runPixel<[string]>(
        `META | GoogleCalendarReadEvent(id="${eventId}")`
      );
      let outputRead: any = response.pixelReturn[0].output;
      const type = response.pixelReturn[0].operationType;

      if (typeof outputRead === "string") {
        try {
          outputRead = JSON.parse(outputRead);
        } catch (e) {
          outputRead = {};
        }
      }

      if (type.indexOf("ERROR") === -1) {
        // Check if this is a recurring event by looking for recurrence data in the API response
        const isRecurringEvent =
          outputRead?.recurrence || outputRead?.frequency || outputRead?.until;

        // Format until date to show only date (not time) for recurring events
        let formattedUntil = "";
        if (isRecurringEvent && outputRead?.until) {
          try {
            let parsedUntilDate;

            // Check if it's Google Calendar format (20250805T093000Z)
            if (
              typeof outputRead.until === "string" &&
              /^\d{8}T\d{6}Z$/.test(outputRead.until)
            ) {
              // Parse Google Calendar format: 20250805T093000Z
              const year = outputRead.until.substring(0, 4);
              const month = outputRead.until.substring(4, 6);
              const day = outputRead.until.substring(6, 8);
              const hour = outputRead.until.substring(9, 11);
              const minute = outputRead.until.substring(11, 13);
              const second = outputRead.until.substring(13, 15);

              const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
              parsedUntilDate = dayjs(isoString);
            } else {
              // Parse the until date normally
              parsedUntilDate = dayjs(outputRead.until);
            }

            if (parsedUntilDate.isValid()) {
              formattedUntil = parsedUntilDate.format("YYYY-MM-DD");
            } else {
              formattedUntil = outputRead.until;
            }
          } catch (e) {
            formattedUntil = outputRead.until;
          }
        }

        // Get start and end dates with proper field mapping
        const startDate =
          outputRead?.starttime ||
          outputRead?.startTime ||
          outputRead?.start ||
          "";
        const endDate =
          outputRead?.endtime || outputRead?.endTime || outputRead?.end || "";

        const eventDetails = {
          id: eventId,
          summary: outputRead?.summary || "",
          location: outputRead?.location || "",
          description: outputRead?.description || "",
          startDate: startDate,
          endDate: endDate,
          email: Array.isArray(outputRead?.attendees)
            ? outputRead.attendees.map((a) => a.email).join(", ")
            : "",
          video: outputRead?.video || false,
          // Only include frequency and until for recurring events
          ...(isRecurringEvent && {
            frequency: outputRead?.frequency || "",
            until: formattedUntil,
          }),
        };

        // Handle different use cases
        if (options?.setFormData) {
          // For form-based reading (navigation bar)
          setData(
            "showReadForm",
            true as PathValue<GoogleCalendarBlockDef["data"], "showReadForm">
          );
        }

        if (options?.setExpandedDetails && options?.expandedEventId) {
          // For inline event detail expansion
          if (typeof outputRead.video === "boolean") {
            outputRead.audio = outputRead.video;
          }
          setExpandedEventDetails(outputRead);
        }

        return outputRead;
      } else {
        throw new Error(response.errors[0]);
      }
    } catch (error) {
      console.error("Error reading calendar event:", error);

      if (options?.setExpandedDetails) {
        setExpandedEventDetails({
          error: "Failed to fetch event details.",
        });
      }

      throw error;
    }
  };

  const onCreateSubmit = handleCreateSubmit(
    async (createData: showCalendarCreateForm) => {
      const freq = createData.GOOGLECALENDAR_FREQUENCY;
      const until = createData.GOOGLECALENDAR_UNTIL;

      if (showRecurringFields && (!freq || !until || !dayjs(until).isValid())) {
        notification.add({
          color: "error",
          message:
            "Both Frequency and Recurring Final Date are required and must be valid for a recurring event.",
        });
        return;
      }
      try {
        const startDateFormatted = dayjs(
          createData.GOOGLECALENDAR_STARTDATE
        ).format("YYYY-MM-DDTHH:mm:ssZ");
        const endDateFormatted = dayjs(
          createData.GOOGLECALENDAR_ENDDATE
        ).format("YYYY-MM-DDTHH:mm:ssZ");
        const freq = createData.GOOGLECALENDAR_FREQUENCY;
        const until = createData.GOOGLECALENDAR_UNTIL;

        let pixelQuery = "";
        if (
          showRecurringFields &&
          (freq === "DAILY" || freq === "WEEKLY") &&
          until &&
          dayjs(until).isValid()
        ) {
          // Recurring event
          const untilFormatted = dayjs(until)
            .utc()
            .format("YYYYMMDDTHHmmss[Z]");
          pixelQuery = `META | GoogleCalendarRecurringEvent(summary="${
            createData.GOOGLECALENDAR_SUMMARY
          }", location="${createData.GOOGLECALENDAR_LOCATION}", description="${
            createData.GOOGLECALENDAR_DESCRIPTION
          }", startDate="${startDateFormatted}", endDate="${endDateFormatted}", email="${
            createData.GOOGLECALENDAR_EMAIL
          }", frequency="${freq}", until="${untilFormatted}", video="${
            createData.GOOGLECALENDAR_VIDEO ? "true" : "false"
          }");`;
        } else {
          // Single event
          pixelQuery = `META | GoogleCalendarCreateEvent(summary="${
            createData.GOOGLECALENDAR_SUMMARY
          }", location="${createData.GOOGLECALENDAR_LOCATION}", description="${
            createData.GOOGLECALENDAR_DESCRIPTION
          }", startDate="${startDateFormatted}", endDate="${endDateFormatted}", email="${
            createData.GOOGLECALENDAR_EMAIL
          }", video="${createData.GOOGLECALENDAR_VIDEO ? "true" : "false"}");`;
        }
        const response = await runPixel<[string]>(pixelQuery);
        let outputCreate: any = response.pixelReturn[0].output;
        const type = response.pixelReturn[0].operationType;
        if (typeof outputCreate === "string") {
          try {
            outputCreate = JSON.parse(outputCreate);
          } catch (e) {
            outputCreate = {};
          }
        }
        if (type.indexOf("ERROR") === -1) {
          setData(
            "showCalendarCreateForm",
            false as PathValue<
              GoogleCalendarBlockDef["data"],
              "showCalendarCreateForm"
            >
          );
          setData(
            "showCreateForm",
            true as PathValue<GoogleCalendarBlockDef["data"], "showCreateForm">
          );
          setCreatedCalendar({
            summary: createData.GOOGLECALENDAR_SUMMARY,
            location: createData.GOOGLECALENDAR_LOCATION,
            description: createData.GOOGLECALENDAR_DESCRIPTION,
            startDate: createData.GOOGLECALENDAR_STARTDATE,
            endDate: createData.GOOGLECALENDAR_ENDDATE,
            email: createData.GOOGLECALENDAR_EMAIL,
            video: createData.GOOGLECALENDAR_VIDEO,
            id: outputCreate?.id,
            Link: createData.GOOGLECALENDAR_VIDEO
              ? outputCreate?.link
              : undefined,
            frequency: createData.GOOGLECALENDAR_FREQUENCY,
            until: createData.GOOGLECALENDAR_UNTIL,
          });
          resetCreate();
        } else {
          throw new Error(response.errors[0]);
        }
      } catch (error) {
        console.error("Error Creating Calendar Event:", error);
      }
    }
  );

  const onUpdateSubmit = handleUpdateSubmit(
    async (updateData: showCalendarUpdateForm) => {
      try {
        const startDateFormatted = dayjs(
          updateData.GOOGLECALENDAR_STARTDATE
        ).format("YYYY-MM-DDTHH:mm:ssZ");
        const endDateFormatted = dayjs(
          updateData.GOOGLECALENDAR_ENDDATE
        ).format("YYYY-MM-DDTHH:mm:ssZ");

        // Determine if this should be a recurring or single event
        const isRecurringUpdate =
          updateData.GOOGLECALENDAR_FREQUENCY &&
          updateData.GOOGLECALENDAR_FREQUENCY !== "NONE" &&
          updateData.GOOGLECALENDAR_UNTIL;

        let pixelQuery = "";

        if (isRecurringUpdate) {
          // Update as recurring event (includes frequency and until parameters)
          const untilFormatted = dayjs(updateData.GOOGLECALENDAR_UNTIL)
            .utc()
            .format("YYYYMMDDTHHmmss[Z]");

          pixelQuery = `META | GoogleCalendarUpdateEvent(summary="${
            updateData.GOOGLECALENDAR_SUMMARY
          }", location="${updateData.GOOGLECALENDAR_LOCATION}", description="${
            updateData.GOOGLECALENDAR_DESCRIPTION
          }", startDate="${startDateFormatted}", endDate="${endDateFormatted}", video="${
            updateData.GOOGLECALENDAR_VIDEO ? "true" : "false"
          }", email="${updateData.GOOGLECALENDAR_EMAIL}", id="${
            updateData.GOOGLECALENDAR_ID
          }", frequency="${
            updateData.GOOGLECALENDAR_FREQUENCY
          }", until="${untilFormatted}");`;
        } else {
          // Update as single event (no frequency/until parameters)
          pixelQuery = `META | GoogleCalendarUpdateEvent(summary="${
            updateData.GOOGLECALENDAR_SUMMARY
          }", location="${updateData.GOOGLECALENDAR_LOCATION}", description="${
            updateData.GOOGLECALENDAR_DESCRIPTION
          }", startDate="${startDateFormatted}", endDate="${endDateFormatted}", video="${
            updateData.GOOGLECALENDAR_VIDEO ? "true" : "false"
          }", email="${updateData.GOOGLECALENDAR_EMAIL}", id="${
            updateData.GOOGLECALENDAR_ID
          }");`;
        }

        const response = await runPixel<[string]>(pixelQuery);
        const outputUpdate = response.pixelReturn[0].output;
        const type = response.pixelReturn[0].operationType;

        if (type.indexOf("ERROR") === -1) {
          setUpdatedCalendar({
            id: updateData.GOOGLECALENDAR_ID,
            summary: updateData.GOOGLECALENDAR_SUMMARY,
            location: updateData.GOOGLECALENDAR_LOCATION,
            description: updateData.GOOGLECALENDAR_DESCRIPTION,
            startDate: updateData.GOOGLECALENDAR_STARTDATE,
            endDate: updateData.GOOGLECALENDAR_ENDDATE,
            email: updateData.GOOGLECALENDAR_EMAIL,
            video: updateData.GOOGLECALENDAR_VIDEO,
            frequency: updateData.GOOGLECALENDAR_FREQUENCY,
            until: updateData.GOOGLECALENDAR_UNTIL,
          });

          setData(
            "showCalendarUpdateForm",
            false as PathValue<
              GoogleCalendarBlockDef["data"],
              "showCalendarUpdateForm"
            >
          );
          setData(
            "showUpdateForm",
            true as PathValue<GoogleCalendarBlockDef["data"], "showUpdateForm">
          );
          resetUpdate();

          // Refresh the calendar list
          if (startDate && endDate) {
            getCalendarList(startDate, endDate);
          }

          // Show success message based on operation
          if (isRecurringUpdate) {
            notification.add({
              color: "success",
              message: "Successfully updated as recurring event.",
            });
          } else {
            notification.add({
              color: "success",
              message: "Successfully updated as single event.",
            });
          }
        } else {
          throw new Error(response.errors[0]);
        }
      } catch (error) {
        console.error("Error updating calendar event:", error);
        notification.add({
          color: "error",
          message: "Failed to update calendar event. Please try again.",
        });
      }
    }
  );

  const onDeleteSubmit = async (deleteValues?: {
    id: string;
    summary: string;
    type?: "single" | "series";
  }) => {
    let eventId: string;
    let eventSummary: string;
    let deleteType: "single" | "series" | null = null;

    // Handle direct event delete (from inline buttons)
    if (deleteValues && "id" in deleteValues) {
      eventId = deleteValues.id;
      eventSummary = deleteValues.summary;
      deleteType = deleteValues.type || null;
    } else {
      alert("No event specified for deletion.");
      return;
    }

    try {
      const response = await runPixel<[string]>(
        `META | GoogleCalendarDeleteEvent(id="${eventId}");`
      );
      const outputDelete = response.pixelReturn[0].output;
      const type = response.pixelReturn[0].operationType;

      if (type.indexOf("ERROR") === -1) {
        // Direct event delete only
        const message =
          deleteType === "single"
            ? "This occurrence of the recurring event was deleted successfully"
            : deleteType === "series"
            ? "The entire recurring event series was deleted successfully"
            : "Event deleted successfully";

        setDeletedCalendar({
          id: eventId,
          summary: eventSummary,
          location: "",
          description: "",
          startDate: "",
          endDate: "",
          email: "",
          video: false,
        });

        // Update UI state
        setData(
          "showDeleteForm",
          true as PathValue<GoogleCalendarBlockDef["data"], "showDeleteForm">
        );
        setData(
          "showCreateForm",
          false as PathValue<GoogleCalendarBlockDef["data"], "showCreateForm">
        );
        setData(
          "showUpdateForm",
          false as PathValue<GoogleCalendarBlockDef["data"], "showUpdateForm">
        );

        // Clean up event-specific state
        setShowFinalDeleteConfirm(false);
        setPendingDeleteEvent({ id: "", summary: "", isRecurring: false });
        setFinalDeleteAction({ eventId: "", eventName: "", type: "single" });
      } else {
        throw new Error(response.errors[0]);
      }
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      notification.add({
        color: "error",
        message: "Failed to delete calendar event. Please try again.",
      });
    }

    // Clean up confirmation states
    setShowDeleteConfirm(false);
    setShowFinalDeleteConfirm(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await oauth("google");
      setIsLoading(false);
      if (response.name) {
        setLoggedInUser(response.name);
        notification.add({
          color: "success",
          message: "Successfully logged into Google",
        });
      } else {
        notification.add({
          color: "error",
          message: "Failed to fetch Google user info",
        });
      }
      // This will trigger the UI to show the doc list page
    } catch (error: any) {
      setIsLoading(false);
      notification.add({
        color: "error",
        message: error.message,
      });
    }
  };

  // Helper function to group events by date
  const getEventsForDate = (date: dayjs.Dayjs) => {
    return calendarSummaryList.filter((event) => {
      // Parse the event date and compare - handle multiple date formats
      try {
        // Try parsing different date formats that might come from the API
        let eventDate;
        if (event.date.includes("/")) {
          // Handle MM/DD/YYYY format
          eventDate = dayjs(event.date, "MM/DD/YYYY");
        } else if (event.date.includes("-")) {
          // Handle YYYY-MM-DD or MM-DD-YYYY format
          eventDate = dayjs(event.date);
        } else {
          // Fallback to default parsing
          eventDate = dayjs(event.date);
        }

        // Ensure the parsed date is valid
        if (!eventDate.isValid()) {
          return false;
        }

        return eventDate.format("YYYY-MM-DD") === date.format("YYYY-MM-DD");
      } catch (error) {
        console.warn("Error parsing event date:", event.date, error);
        return false;
      }
    });
  };

  // Helper function to check if a date has events
  const hasEventsOnDate = (date: dayjs.Dayjs) => {
    return getEventsForDate(date).length > 0;
  };

  // Handle date click in calendar
  const handleDateClick = (date: dayjs.Dayjs) => {
    const events = getEventsForDate(date);
    setSelectedDate(date);
    setSelectedDateEvents(events);
    if (events.length > 0) {
      setShowEventModal(true);
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const startOfMonth = selectedDate.startOf("month");
    const endOfMonth = selectedDate.endOf("month");
    const startOfWeek = startOfMonth.startOf("week");
    const endOfWeek = endOfMonth.endOf("week");

    const days = [];
    let currentDate = startOfWeek;

    while (
      currentDate.isBefore(endOfWeek) ||
      currentDate.isSame(endOfWeek, "day")
    ) {
      days.push(currentDate);
      currentDate = currentDate.add(1, "day");
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div data-block={id} style={{ position: "relative", ...data.style }}>
      <div
        style={{
          ...data.style,
          marginBlockStart: "0px",
          marginBlockEnd: "0px",
        }}
      >
        {displayTxt}

        {data.showCalendarCreateForm ? (
          <form onSubmit={onCreateSubmit}>
            <Stack
              direction="column"
              spacing={2}
              style={{ paddingTop: "10px" }}
            >
              <Controller
                name={"GOOGLECALENDAR_SUMMARY"}
                control={controlCreate}
                rules={{ required: "Summary is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Summary"
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_LOCATION"}
                control={controlCreate}
                rules={{ required: "Location is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Location"
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_DESCRIPTION"}
                control={controlCreate}
                rules={{ required: "Description is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Description"
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_STARTDATE"}
                control={controlCreate}
                rules={{ required: "Start Date is required" }}
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    label="Start Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(dateString) => field.onChange(dateString || "")}
                    format="MM-DD-YYYY hh:mm A"
                    slotProps={{
                      textField: {
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                        fullWidth: true,
                      },
                    }}
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_ENDDATE"}
                control={controlCreate}
                rules={{ required: "End Date is required" }}
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    label="End Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(dateString) => field.onChange(dateString || "")}
                    format="MM-DD-YYYY hh:mm A"
                    slotProps={{
                      textField: {
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                        fullWidth: true,
                      },
                    }}
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_EMAIL"}
                control={controlCreate}
                rules={{ required: "Email is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Attendee Email(s) (comma separated)"
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_VIDEO"}
                control={controlCreate}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <Select
                      label="Enable Video"
                      value={
                        field.value === true
                          ? "true"
                          : field.value === false
                          ? "false"
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(e.target.value === "true")
                      }
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                    {fieldState.error && (
                      <Typography color="error" variant="caption">
                        {fieldState.error.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
              <Button
                variant={showRecurringFields ? "contained" : "outlined"}
                onClick={() => setShowRecurringFields((prev) => !prev)}
                sx={{
                  marginBottom: 1,
                  color: showRecurringFields
                    ? "var(--variant-containedColor)"
                    : "var(--variant-textColor)",
                  backgroundColor: showRecurringFields
                    ? "var(--variant-containedBg)"
                    : "transparent",
                  borderColor: "var(--variant-outlinedBorder)",
                  "&:hover": {
                    backgroundColor: showRecurringFields
                      ? "rgba(4, 113, 240, 0.8)"
                      : "rgba(4, 113, 240, 0.1)",
                    borderColor: "var(--variant-outlinedColor)",
                  },
                }}
              >
                Recurring event
              </Button>
              {showRecurringFields && (
                <>
                  <Controller
                    name={"GOOGLECALENDAR_FREQUENCY"}
                    control={controlCreate}
                    rules={{
                      required: "Frequency is required for recurring event",
                    }}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <Select
                          label="Recurring Frequency"
                          value={field.value || ""}
                          onChange={field.onChange}
                        >
                          <MenuItem value="DAILY">Daily</MenuItem>
                          <MenuItem value="WEEKLY">Weekly</MenuItem>
                        </Select>
                        {fieldState.error && (
                          <Typography color="error" variant="caption">
                            {fieldState.error.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                  <Controller
                    name={"GOOGLECALENDAR_UNTIL"}
                    control={controlCreate}
                    rules={{
                      required:
                        "Recurring Final Date is required for recurring event",
                    }}
                    render={({ field, fieldState }) => (
                      <DateTimePicker
                        label="Recurring Final Date"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(dateString) =>
                          field.onChange(dateString || "")
                        }
                        format="MM-DD-YYYY hh:mm A"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!fieldState.error,
                            helperText: fieldState.error?.message,
                          },
                        }}
                      />
                    )}
                  />
                </>
              )}
            </Stack>
            <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
              <Button
                type="button"
                onClick={() => {
                  resetCreate();
                  setData(
                    "showCalendarCreateForm",
                    false as PathValue<
                      GoogleCalendarBlockDef["data"],
                      "showCalendarCreateForm"
                    >
                  );
                  setData(
                    "showCreateForm",
                    false as PathValue<
                      GoogleCalendarBlockDef["data"],
                      "showCreateForm"
                    >
                  );
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
          </form>
        ) : data.showCalendarUpdateForm ? (
          <form onSubmit={onUpdateSubmit}>
            <Stack
              direction="column"
              spacing={2}
              style={{ paddingTop: "10px" }}
            >
              <Controller
                name={"GOOGLECALENDAR_ID"}
                control={controlUpdate}
                rules={{ required: "id" }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="id"
                    value={field.value || ""}
                    disabled
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_SUMMARY"}
                control={controlUpdate}
                rules={{
                  required: "Summary is required",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Summary"
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_LOCATION"}
                control={controlUpdate}
                render={({ field }) => (
                  <TextField
                    label="Location"
                    value={field.value || ""}
                    onChange={field.onChange}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_DESCRIPTION"}
                control={controlUpdate}
                render={({ field }) => (
                  <TextField
                    label="Description"
                    value={field.value || ""}
                    onChange={field.onChange}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_STARTDATE"}
                control={controlUpdate}
                rules={{
                  required: "Start Date is required",
                }}
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    label="Start Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(dateString) => field.onChange(dateString || "")}
                    format="MM-DD-YYYY hh:mm A"
                    slotProps={{
                      textField: {
                        error: !!fieldState.error,
                        fullWidth: true,
                      },
                    }}
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_ENDDATE"}
                control={controlUpdate}
                rules={{
                  required: "End Date is required",
                }}
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    label="End Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(dateString) => field.onChange(dateString || "")}
                    format="MM-DD-YYYY hh:mm A"
                    slotProps={{
                      textField: {
                        error: !!fieldState.error,
                        fullWidth: true,
                      },
                    }}
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_EMAIL"}
                control={controlUpdate}
                render={({ field }) => (
                  <TextField
                    label="Attendee Email(s) (comma separated)"
                    value={field.value || ""}
                    onChange={field.onChange}
                    fullWidth
                  />
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_FREQUENCY"}
                control={controlUpdate}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <Select
                      label="Recurring Frequency"
                      value={field.value || "NONE"}
                      onChange={(e) => {
                        const newFrequency = e.target.value;
                        field.onChange(newFrequency);
                        setUpdateFrequency(newFrequency);

                        // Clear until field if frequency is set to NONE
                        if (newFrequency === "NONE") {
                          setUpdateValue("GOOGLECALENDAR_UNTIL", "");
                        }
                      }}
                    >
                      <MenuItem value="NONE">None </MenuItem>
                      <MenuItem value="DAILY">Daily</MenuItem>
                      <MenuItem value="WEEKLY">Weekly</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name={"GOOGLECALENDAR_UNTIL"}
                control={controlUpdate}
                rules={{
                  validate: (value) => {
                    const frequency =
                      updateFrequency ||
                      getUpdateValues().GOOGLECALENDAR_FREQUENCY;
                    const isRecurringSelected =
                      frequency === "DAILY" || frequency === "WEEKLY";

                    if (
                      isRecurringSelected &&
                      (!value || !dayjs(value).isValid())
                    ) {
                      return "Recurring Final Date is required and must be valid for recurring events";
                    }
                    return true;
                  },
                }}
                render={({ field, fieldState }) => {
                  // Use local state for more reliable reactivity
                  const frequencyValue =
                    updateFrequency ||
                    getUpdateValues().GOOGLECALENDAR_FREQUENCY;
                  const isDisabled =
                    frequencyValue === "NONE" || !frequencyValue;
                  const isRecurringSelected =
                    frequencyValue === "DAILY" || frequencyValue === "WEEKLY";

                  return (
                    <DateTimePicker
                      label="Recurring Final Date"
                      value={
                        field.value && !isDisabled ? dayjs(field.value) : null
                      }
                      onChange={(dateString) => {
                        if (!isDisabled) {
                          const dateValue = dateString || "";
                          field.onChange(dateValue);
                        }
                      }}
                      format="MM-DD-YYYY hh:mm A"
                      disabled={isDisabled}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText:
                            fieldState.error?.message ||
                            (isDisabled
                              ? "Set frequency to DAILY or WEEKLY to enable recurring final date"
                              : isRecurringSelected
                              ? "Required for recurring events"
                              : "Select DAILY or WEEKLY frequency"),
                        },
                      }}
                    />
                  );
                }}
              />
              <Controller
                name={"GOOGLECALENDAR_VIDEO"}
                control={controlUpdate}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <Select
                      label="Enable Video"
                      value={field.value ? "true" : "false"}
                      onChange={(e) =>
                        field.onChange(e.target.value === "true")
                      }
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
            <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
              <Button
                type="button"
                onClick={() => {
                  resetUpdate();
                  setData(
                    "showCalendarUpdateForm",
                    false as PathValue<
                      GoogleCalendarBlockDef["data"],
                      "showCalendarUpdateForm"
                    >
                  );
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
          </form>
        ) : (
          <>
            {!loggedInUser && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    marginBottom: "16px",
                    color: "#333",
                  }}
                >
                  Connect to Google Calendar
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  sx={{
                    textTransform: "none",
                    color: "var(--variant-containedColor)",
                    backgroundColor: "var(--variant-containedBg)",
                    "&:hover": {
                      backgroundColor: "rgba(4, 113, 240, 0.8)",
                    },
                  }}
                >
                  {isLoading ? "Connecting..." : "Login Google"}
                </Button>
              </div>
            )}
            {loggedInUser && (
              <>
                {/* Header with user info and create button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    padding: "16px 0",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "1.1rem", color: "#666" }}>
                      Logged in as:{" "}
                    </span>
                    <strong style={{ fontSize: "1.1rem", color: "#1976d2" }}>
                      {loggedInUser}
                    </strong>
                  </div>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      padding: "12px 28px",
                      borderRadius: "8px",
                      textTransform: "none",
                      color: "var(--variant-containedColor)",
                      backgroundColor: "var(--variant-containedBg)",
                      "&:hover": {
                        backgroundColor: "rgba(4, 113, 240, 0.8)",
                      },
                    }}
                    onClick={() => {
                      setData(
                        "showCalendarCreateForm",
                        true as PathValue<
                          GoogleCalendarBlockDef["data"],
                          "showCalendarCreateForm"
                        >
                      );
                      setData(
                        "showCreateForm",
                        false as PathValue<
                          GoogleCalendarBlockDef["data"],
                          "showCreateForm"
                        >
                      );
                    }}
                  >
                    + Create Event
                  </Button>
                </div>

                {/* Navigation Tabs */}
                <div
                  style={{
                    marginBottom: 24,
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#1976d2",
                        height: 3,
                      },
                      "& .MuiTabs-root": {
                        minHeight: "48px",
                      },
                    }}
                  >
                    <Tab
                      value="list"
                      label="📋 List View"
                      sx={{
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: activeTab === "list" ? "600" : "400",
                        color: activeTab === "list" ? "#1976d2" : "#666",
                        minHeight: "48px",
                        "&:hover": {
                          color: "#1976d2",
                          backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                      }}
                    />
                    <Tab
                      value="calendar"
                      label="📅 Calendar View"
                      sx={{
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: activeTab === "calendar" ? "600" : "400",
                        color: activeTab === "calendar" ? "#1976d2" : "#666",
                        minHeight: "48px",
                        "&:hover": {
                          color: "#1976d2",
                          backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                      }}
                    />
                  </Tabs>
                </div>

                {/* Content based on active tab */}
                {activeTab === "list" && (
                  <>
                    {/* Date range selectors */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 24,
                        justifyContent: "center",
                        marginBottom: 32,
                        padding: "20px",
                        background: "#f8f9fa",
                        borderRadius: "12px",
                        border: "1px solid #e3f2fd",
                      }}
                    >
                      <DateTimePicker
                        label="Start date & time"
                        value={startDate}
                        onChange={(dateString) =>
                          setStartDate(dateString ? dayjs(dateString) : null)
                        }
                        format="YYYY-MM-DD HH:mm"
                        slotProps={{
                          textField: {
                            size: "medium",
                            style: {
                              minWidth: 220,
                              background: "#ffffff",
                              borderRadius: "8px",
                            },
                            InputLabelProps: {
                              style: {
                                color: "#1976d2",
                                fontWeight: "600",
                              },
                              shrink: true,
                            },
                          },
                        }}
                      />
                      <DateTimePicker
                        label="End date & time"
                        value={endDate}
                        onChange={(dateString) =>
                          setEndDate(dateString ? dayjs(dateString) : null)
                        }
                        format="YYYY-MM-DD HH:mm"
                        slotProps={{
                          textField: {
                            size: "medium",
                            style: {
                              minWidth: 220,
                              background: "#ffffff",
                              borderRadius: "8px",
                            },
                            InputLabelProps: {
                              style: {
                                color: "#1976d2",
                                fontWeight: "600",
                              },
                              shrink: true,
                            },
                          },
                        }}
                      />
                    </div>
                    {/* Calendar Events List */}
                    <div
                      style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "12px",
                        marginBottom: 16,
                        background: "#ffffff",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {calendarSummaryList && calendarSummaryList.length > 0 ? (
                        <>
                          <div
                            style={{
                              padding: "16px 20px",
                              borderBottom: "1px solid #e0e0e0",
                              background: "#f8f9fa",
                              borderRadius: "12px 12px 0 0",
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: "600",
                                color: "#333",
                                margin: 0,
                              }}
                            >
                              Calendar Events ({calendarSummaryList.length})
                            </Typography>
                          </div>
                          {calendarSummaryList.map(
                            (
                              event: {
                                summary: string;
                                id: string;
                                recurringId?: string;
                                date: string;
                                displayText: string;
                              },
                              index
                            ) => {
                              // Check if this is the first event of a new date
                              const isFirstEventOfDate =
                                index === 0 ||
                                calendarSummaryList[index - 1].date !==
                                  event.date;

                              return (
                                <React.Fragment key={event.id}>
                                  {/* Date header */}
                                  {isFirstEventOfDate && (
                                    <div
                                      style={{
                                        padding: "12px 20px",
                                        backgroundColor: "#e3f2fd",
                                        borderBottom: "1px solid #e0e0e0",
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 10,
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        sx={{
                                          fontWeight: "700",
                                          color: "#1976d2",
                                          margin: 0,
                                          fontSize: "1rem",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}
                                      >
                                        📅 {event.date}
                                      </Typography>
                                    </div>
                                  )}

                                  {/* Event item */}
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      borderBottom:
                                        index <
                                          calendarSummaryList.length - 1 &&
                                        calendarSummaryList[index + 1].date ===
                                          event.date
                                          ? "1px solid #f0f0f0"
                                          : "none",
                                      padding: "16px 20px",
                                      transition: "background-color 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#f8f9fa";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <div
                                        style={{
                                          flex: 1,
                                          display: "flex",
                                          flexDirection: "column",
                                        }}
                                      >
                                        {/* Event summary */}
                                        <span
                                          style={{
                                            color: "#1976d2",
                                            textDecoration: "none",
                                            cursor: "pointer",
                                            fontWeight: "500",
                                            fontSize: "1.1rem",
                                            padding: "4px 0",
                                            borderRadius: "4px",
                                            transition: "all 0.2s ease",
                                          }}
                                          onClick={async () => {
                                            if (expandedEventId === event.id) {
                                              setExpandedEventId(null);
                                              setExpandedEventDetails(null);
                                              return;
                                            }
                                            setExpandedEventId(event.id);
                                            // Fetch event details
                                            try {
                                              // Determine which ID to use for reading
                                              let readEventId: string;
                                              if (event.recurringId) {
                                                // For recurring events, use the masterId (recurringId)
                                                readEventId = event.recurringId;
                                              } else {
                                                // For single events, use the regular event ID
                                                readEventId = event.id;
                                              }

                                              await readEventDetails(
                                                readEventId,
                                                {
                                                  setExpandedDetails: true,
                                                  expandedEventId: event.id,
                                                }
                                              );
                                            } catch (error) {
                                              console.error(
                                                "Error fetching event details:",
                                                error
                                              );
                                            }
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.textDecoration =
                                              "underline";
                                            e.currentTarget.style.color =
                                              "#1565c0";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.textDecoration =
                                              "none";
                                            e.currentTarget.style.color =
                                              "#1976d2";
                                          }}
                                        >
                                          {event.summary}
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 12,
                                        }}
                                      >
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          sx={{
                                            textTransform: "none",
                                            fontWeight: "500",
                                            borderRadius: "6px",
                                            padding: "6px 16px",
                                            color:
                                              "var(--variant-outlinedColor)",
                                            borderColor:
                                              "var(--variant-outlinedBorder)",
                                            "&:hover": {
                                              borderColor:
                                                "var(--variant-outlinedColor)",
                                              backgroundColor:
                                                "rgba(4, 113, 240, 0.1)",
                                            },
                                          }}
                                          onClick={async () => {
                                            setData(
                                              "showCalendarUpdateForm",
                                              true
                                            );

                                            // Reset the local frequency state
                                            setUpdateFrequency("NONE");

                                            // Fetch event details by ID
                                            try {
                                              // Determine which ID to use for reading based on event type
                                              let readEventId: string;
                                              let updateEventId: string;

                                              if (event.recurringId) {
                                                // For recurring events, use the masterId (recurringId) to get master event details
                                                readEventId = event.recurringId;
                                                // For updating recurring events, also use the masterId so changes apply to entire series
                                                updateEventId =
                                                  event.recurringId;
                                              } else {
                                                // For single events, use the regular event ID
                                                readEventId = event.id;
                                                updateEventId = event.id;
                                              }

                                              const response = await runPixel<
                                                [string]
                                              >(
                                                `META | GoogleCalendarReadEvent(id="${readEventId}")`
                                              );
                                              let outputRead: any =
                                                response.pixelReturn[0].output;

                                              if (
                                                typeof outputRead === "string"
                                              ) {
                                                try {
                                                  outputRead =
                                                    JSON.parse(outputRead);
                                                } catch (e) {
                                                  outputRead = {};
                                                }
                                              }

                                              // Check if this is a recurring event
                                              const isRecurringEvent =
                                                event.recurringId ||
                                                outputRead?.recurrence ||
                                                outputRead?.frequency ||
                                                outputRead?.until;

                                              // Set the ID field - use masterId for recurring events so changes apply to entire series
                                              setUpdateValue(
                                                "GOOGLECALENDAR_ID",
                                                updateEventId
                                              );

                                              // Set basic event details with enhanced field mapping
                                              setUpdateValue(
                                                "GOOGLECALENDAR_SUMMARY",
                                                outputRead?.summary || ""
                                              );

                                              // Enhanced location field mapping - check multiple possible field names
                                              const location =
                                                outputRead?.location ||
                                                outputRead?.where ||
                                                outputRead?.place ||
                                                "";
                                              setUpdateValue(
                                                "GOOGLECALENDAR_LOCATION",
                                                location
                                              );

                                              setUpdateValue(
                                                "GOOGLECALENDAR_DESCRIPTION",
                                                outputRead?.description || ""
                                              );

                                              // Enhanced date field mapping - check multiple possible field names
                                              const startDate =
                                                outputRead?.starttime ||
                                                outputRead?.startTime ||
                                                outputRead?.start?.dateTime ||
                                                outputRead?.start ||
                                                "";
                                              const endDate =
                                                outputRead?.endtime ||
                                                outputRead?.endTime ||
                                                outputRead?.end?.dateTime ||
                                                outputRead?.end ||
                                                "";

                                              // Format dates properly for DateTimePicker
                                              if (startDate) {
                                                try {
                                                  const formattedStartDate =
                                                    dayjs(startDate).isValid()
                                                      ? dayjs(
                                                          startDate
                                                        ).toISOString()
                                                      : "";
                                                  setUpdateValue(
                                                    "GOOGLECALENDAR_STARTDATE",
                                                    formattedStartDate
                                                  );
                                                } catch (e) {
                                                  setUpdateValue(
                                                    "GOOGLECALENDAR_STARTDATE",
                                                    ""
                                                  );
                                                }
                                              } else {
                                                setUpdateValue(
                                                  "GOOGLECALENDAR_STARTDATE",
                                                  ""
                                                );
                                              }

                                              if (endDate) {
                                                try {
                                                  const formattedEndDate =
                                                    dayjs(endDate).isValid()
                                                      ? dayjs(
                                                          endDate
                                                        ).toISOString()
                                                      : "";
                                                  setUpdateValue(
                                                    "GOOGLECALENDAR_ENDDATE",
                                                    formattedEndDate
                                                  );
                                                } catch (e) {
                                                  setUpdateValue(
                                                    "GOOGLECALENDAR_ENDDATE",
                                                    ""
                                                  );
                                                }
                                              } else {
                                                setUpdateValue(
                                                  "GOOGLECALENDAR_ENDDATE",
                                                  ""
                                                );
                                              }

                                              // Enhanced email field mapping
                                              const attendees =
                                                outputRead?.attendees ||
                                                outputRead?.guests ||
                                                [];
                                              const emails = Array.isArray(
                                                attendees
                                              )
                                                ? attendees
                                                    .map((a) => a.email || a)
                                                    .filter(Boolean)
                                                    .join(", ")
                                                : "";
                                              setUpdateValue(
                                                "GOOGLECALENDAR_EMAIL",
                                                emails
                                              );

                                              setUpdateValue(
                                                "GOOGLECALENDAR_VIDEO",
                                                !!outputRead?.video ||
                                                  !!outputRead?.hangoutLink
                                              );

                                              // Enhanced until date mapping
                                              const untilDate =
                                                outputRead?.until ||
                                                outputRead?.recurringUntil ||
                                                outputRead?.recurrence?.until ||
                                                outputRead?.endRecurrence ||
                                                outputRead?.recurringEnd ||
                                                "";

                                              // Handle frequency and until based on event type
                                              if (isRecurringEvent) {
                                                // For recurring events, populate frequency and until
                                                const frequency =
                                                  outputRead?.frequency ||
                                                  outputRead?.recurrence
                                                    ?.freq ||
                                                  "DAILY";
                                                setUpdateValue(
                                                  "GOOGLECALENDAR_FREQUENCY",
                                                  frequency
                                                );
                                                setUpdateFrequency(frequency); // Update local state

                                                if (untilDate) {
                                                  try {
                                                    // Try different date parsing approaches
                                                    let parsedDate;

                                                    // Check if it's Google Calendar format (20250805T093000Z)
                                                    if (
                                                      typeof untilDate ===
                                                        "string" &&
                                                      /^\d{8}T\d{6}Z$/.test(
                                                        untilDate
                                                      )
                                                    ) {
                                                      // Parse Google Calendar format: 20250805T093000Z
                                                      const year =
                                                        untilDate.substring(
                                                          0,
                                                          4
                                                        );
                                                      const month =
                                                        untilDate.substring(
                                                          4,
                                                          6
                                                        );
                                                      const day =
                                                        untilDate.substring(
                                                          6,
                                                          8
                                                        );
                                                      const hour =
                                                        untilDate.substring(
                                                          9,
                                                          11
                                                        );
                                                      const minute =
                                                        untilDate.substring(
                                                          11,
                                                          13
                                                        );
                                                      const second =
                                                        untilDate.substring(
                                                          13,
                                                          15
                                                        );

                                                      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                                                      parsedDate =
                                                        dayjs(isoString);
                                                    }
                                                    // First try direct parsing
                                                    else if (
                                                      dayjs(untilDate).isValid()
                                                    ) {
                                                      parsedDate =
                                                        dayjs(untilDate);
                                                    }
                                                    // Try parsing as ISO string
                                                    else if (
                                                      typeof untilDate ===
                                                        "string" &&
                                                      untilDate.includes("T")
                                                    ) {
                                                      parsedDate =
                                                        dayjs(untilDate);
                                                    }
                                                    // Try parsing as date only
                                                    else if (
                                                      typeof untilDate ===
                                                      "string"
                                                    ) {
                                                      parsedDate =
                                                        dayjs(untilDate);
                                                    }

                                                    if (
                                                      parsedDate &&
                                                      parsedDate.isValid()
                                                    ) {
                                                      const formattedUntil =
                                                        parsedDate.toISOString();
                                                      setUpdateValue(
                                                        "GOOGLECALENDAR_UNTIL",
                                                        formattedUntil
                                                      );
                                                    } else {
                                                      setUpdateValue(
                                                        "GOOGLECALENDAR_UNTIL",
                                                        ""
                                                      );
                                                    }
                                                  } catch (e) {
                                                    setUpdateValue(
                                                      "GOOGLECALENDAR_UNTIL",
                                                      ""
                                                    );
                                                  }
                                                } else {
                                                  setUpdateValue(
                                                    "GOOGLECALENDAR_UNTIL",
                                                    ""
                                                  );
                                                }
                                              } else {
                                                // For single events, set frequency to NONE and clear until
                                                setUpdateValue(
                                                  "GOOGLECALENDAR_FREQUENCY",
                                                  "NONE"
                                                );
                                                setUpdateFrequency("NONE"); // Update local state
                                                setUpdateValue(
                                                  "GOOGLECALENDAR_UNTIL",
                                                  ""
                                                );
                                              }
                                            } catch (error) {
                                              // Fallback values in case of error
                                              setUpdateValue(
                                                "GOOGLECALENDAR_ID",
                                                event.recurringId || event.id
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_SUMMARY",
                                                event.summary
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_LOCATION",
                                                ""
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_DESCRIPTION",
                                                ""
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_STARTDATE",
                                                ""
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_ENDDATE",
                                                ""
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_EMAIL",
                                                ""
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_VIDEO",
                                                false
                                              );
                                              setUpdateValue(
                                                "GOOGLECALENDAR_FREQUENCY",
                                                "NONE"
                                              );
                                              setUpdateFrequency("NONE"); // Update local state
                                              setUpdateValue(
                                                "GOOGLECALENDAR_UNTIL",
                                                ""
                                              );
                                            }
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          sx={{
                                            textTransform: "none",
                                            fontWeight: "500",
                                            borderRadius: "6px",
                                            padding: "6px 16px",
                                            color: "error.main",
                                            borderColor: "#d32f2f",
                                            "&:hover": {
                                              borderColor: "#d32f2f",
                                              backgroundColor:
                                                "rgba(211, 47, 47, 0.1)",
                                            },
                                          }}
                                          onClick={() => {
                                            // Store the event details for the delete confirmation
                                            setPendingDeleteEvent({
                                              id: event.id,
                                              recurringId: event.recurringId,
                                              summary: event.summary,
                                              isRecurring: !!event.recurringId,
                                            });

                                            // Show the delete confirmation modal
                                            setShowDeleteConfirm(true);
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                    {expandedEventId === event.id &&
                                      expandedEventDetails && (
                                        <div
                                          style={{
                                            background: "#f5f5f5",
                                            borderRadius: 4,
                                            padding: 12,
                                            marginTop: 8,
                                            width: "100%",
                                          }}
                                        >
                                          {Object.entries(expandedEventDetails)
                                            .filter(
                                              ([_, value]) =>
                                                value !== undefined &&
                                                value !== null &&
                                                value !== ""
                                            )
                                            .map(([key, value]) => (
                                              <div
                                                key={key}
                                                style={{
                                                  marginBottom: 4,
                                                }}
                                              >
                                                <strong>{key}:</strong>{" "}
                                                {Array.isArray(value) ? (
                                                  value.map((v, i) => (
                                                    <div
                                                      key={i}
                                                      style={{
                                                        marginLeft: 12,
                                                      }}
                                                    >
                                                      {typeof v === "object"
                                                        ? Object.entries(v)
                                                            .filter(
                                                              ([k, val]) =>
                                                                k !==
                                                                  "ResponseStatus" &&
                                                                val
                                                            )
                                                            .map(([k, val]) =>
                                                              k ===
                                                                "hangoutLink" ||
                                                              k ===
                                                                "htmlLink" ? (
                                                                <span key={k}>
                                                                  <strong>
                                                                    {k}:
                                                                  </strong>{" "}
                                                                  <a
                                                                    href={String(
                                                                      val
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                  >
                                                                    {String(
                                                                      val
                                                                    )}
                                                                  </a>{" "}
                                                                </span>
                                                              ) : (
                                                                <span key={k}>
                                                                  <strong>
                                                                    {k}:
                                                                  </strong>{" "}
                                                                  {String(val)}{" "}
                                                                </span>
                                                              )
                                                            )
                                                        : String(v)}
                                                    </div>
                                                  ))
                                                ) : key === "hangoutLink" ||
                                                  key === "htmlLink" ? (
                                                  <a
                                                    href={String(value)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    {String(value)}
                                                  </a>
                                                ) : (
                                                  String(value)
                                                )}
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                  </div>
                                </React.Fragment>
                              );
                            }
                          )}
                        </>
                      ) : (
                        <div
                          style={{
                            padding: "40px 20px",
                            textAlign: "center",
                            color: "#666",
                          }}
                        >
                          <Typography variant="h6" sx={{ marginBottom: "8px" }}>
                            No events found
                          </Typography>
                          <Typography variant="body2">
                            Try adjusting your date range or create a new event.
                          </Typography>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeTab === "calendar" && (
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e0e0e0",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Calendar Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "20px",
                        borderBottom: "1px solid #e0e0e0",
                        background: "#f8f9fa",
                      }}
                    >
                      <Button
                        onClick={() =>
                          setSelectedDate(selectedDate.subtract(1, "month"))
                        }
                        sx={{
                          minWidth: "40px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          color: "#666",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        ‹
                      </Button>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: "600",
                            color: "#333",
                            fontSize: "1.75rem",
                          }}
                        >
                          {selectedDate.format("MMMM YYYY")}
                        </Typography>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <DatePicker
                            value={selectedDate.format("YYYY-MM-DD")}
                            onChange={(dateString: string) => {
                              if (dateString) {
                                const parsedDate = dayjs(dateString);
                                if (parsedDate.isValid()) {
                                  setSelectedDate(parsedDate);
                                }
                              }
                            }}
                            sx={{
                              minWidth: 180,
                              backgroundColor: "#ffffff",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              height: "36px",
                              "& .MuiInputBase-root": {
                                height: "36px",
                              },
                              "& .MuiInputLabel-root": {
                                color: "#1976d2",
                                fontWeight: "500",
                              },
                            }}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          setSelectedDate(selectedDate.add(1, "month"))
                        }
                        sx={{
                          minWidth: "40px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          color: "#666",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        ›
                      </Button>
                    </div>

                    {/* Day Labels */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        borderBottom: "1px solid #e0e0e0",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontWeight: "600",
                              color: "#666",
                              fontSize: "0.875rem",
                              borderRight: "1px solid #e0e0e0",
                            }}
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    {/* Calendar Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "1px",
                        backgroundColor: "#e0e0e0",
                      }}
                    >
                      {calendarDays.map((date, index) => {
                        const isCurrentMonth =
                          date.month() === selectedDate.month();
                        const isToday = date.isSame(dayjs(), "day");
                        const hasEvents = hasEventsOnDate(date);

                        return (
                          <div
                            key={index}
                            onClick={() => handleDateClick(date)}
                            style={{
                              backgroundColor: "#ffffff",
                              minHeight: "80px",
                              padding: "8px",
                              cursor: "pointer",
                              position: "relative",
                              opacity: isCurrentMonth ? 1 : 0.3,
                              transition: "background-color 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#ffffff";
                            }}
                          >
                            {/* Blue dot for events - positioned at top right */}
                            {hasEvents && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  backgroundColor: "#1976d2",
                                  border: "2px solid #ffffff",
                                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                                  cursor: "pointer",
                                  zIndex: 1,
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform =
                                    "scale(1.1)";
                                  e.currentTarget.style.backgroundColor =
                                    "#1565c0";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.backgroundColor =
                                    "#1976d2";
                                }}
                              />
                            )}

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                height: "100%",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.875rem",
                                  fontWeight: isToday ? "600" : "400",
                                  color: isToday
                                    ? "#ffffff"
                                    : isCurrentMonth
                                    ? "#333"
                                    : "#999",
                                  backgroundColor: isToday
                                    ? "#1976d2"
                                    : "transparent",
                                }}
                              >
                                {date.date()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Event Modal for Selected Date */}
                {showEventModal && (
                  <Modal
                    open={showEventModal}
                    onClose={() => setShowEventModal(false)}
                  >
                    <Modal.Content
                      sx={{
                        maxWidth: "700px",
                        width: "95%",
                        maxHeight: "80vh",
                        overflow: "auto",
                      }}
                    >
                      <div
                        style={{
                          padding: "24px",
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            marginBottom: "16px",
                            color: "#333",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          📅 Events for {selectedDate.format("MMMM D, YYYY")}
                        </Typography>

                        {selectedDateEvents.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px",
                            }}
                          >
                            {selectedDateEvents.map((event, index) => (
                              <div
                                key={event.id}
                                style={{
                                  border: "1px solid #e0e0e0",
                                  borderRadius: "8px",
                                  padding: "16px",
                                  backgroundColor: "#f8f9fa",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#1976d2",
                                      textDecoration: "none",
                                      cursor: "pointer",
                                      fontWeight: "600",
                                      fontSize: "1.25rem",
                                      padding: "4px 0",
                                      borderRadius: "4px",
                                      transition: "all 0.2s ease",
                                      flex: 1,
                                    }}
                                    onClick={async () => {
                                      if (expandedEventId === event.id) {
                                        setExpandedEventId(null);
                                        setExpandedEventDetails(null);
                                        return;
                                      }
                                      setExpandedEventId(event.id);
                                      // Fetch event details
                                      try {
                                        // Determine which ID to use for reading
                                        let readEventId: string;
                                        if (event.recurringId) {
                                          // For recurring events, use the masterId (recurringId)
                                          readEventId = event.recurringId;
                                        } else {
                                          // For single events, use the regular event ID
                                          readEventId = event.id;
                                        }

                                        await readEventDetails(readEventId, {
                                          setExpandedDetails: true,
                                          expandedEventId: event.id,
                                        });
                                      } catch (error) {
                                        console.error(
                                          "Error fetching event details:",
                                          error
                                        );
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.textDecoration =
                                        "underline";
                                      e.currentTarget.style.color = "#1565c0";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.textDecoration =
                                        "none";
                                      e.currentTarget.style.color = "#1976d2";
                                    }}
                                  >
                                    {event.summary}
                                  </span>
                                </div>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#666",
                                    marginBottom: "12px",
                                  }}
                                >
                                  📅 {event.date}
                                </Typography>

                                {/* Display expanded event details if this event is selected */}
                                {expandedEventId === event.id &&
                                  expandedEventDetails && (
                                    <div
                                      style={{
                                        background: "#f5f5f5",
                                        borderRadius: 4,
                                        padding: 12,
                                        marginTop: 8,
                                        width: "100%",
                                      }}
                                    >
                                      {Object.entries(expandedEventDetails)
                                        .filter(
                                          ([_, value]) =>
                                            value !== undefined &&
                                            value !== null &&
                                            value !== ""
                                        )
                                        .map(([key, value]) => (
                                          <div
                                            key={key}
                                            style={{
                                              marginBottom: 4,
                                            }}
                                          >
                                            <strong>{key}:</strong>{" "}
                                            {Array.isArray(value) ? (
                                              value.map((v, i) => (
                                                <div
                                                  key={i}
                                                  style={{
                                                    marginLeft: 12,
                                                  }}
                                                >
                                                  {typeof v === "object"
                                                    ? Object.entries(v)
                                                        .filter(
                                                          ([k, val]) =>
                                                            k !==
                                                              "ResponseStatus" &&
                                                            val
                                                        )
                                                        .map(([k, val]) =>
                                                          k === "hangoutLink" ||
                                                          k === "htmlLink" ? (
                                                            <span key={k}>
                                                              <strong>
                                                                {k}:
                                                              </strong>{" "}
                                                              <a
                                                                href={String(
                                                                  val
                                                                )}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                              >
                                                                {String(val)}
                                                              </a>{" "}
                                                            </span>
                                                          ) : (
                                                            <span key={k}>
                                                              <strong>
                                                                {k}:
                                                              </strong>{" "}
                                                              {String(val)}{" "}
                                                            </span>
                                                          )
                                                        )
                                                    : String(v)}
                                                </div>
                                              ))
                                            ) : key === "hangoutLink" ||
                                              key === "htmlLink" ? (
                                              <a
                                                href={String(value)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                {String(value)}
                                              </a>
                                            ) : (
                                              String(value)
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  )}

                                {/* Action buttons for each event */}
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "12px",
                                    marginTop: "12px",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={async () => {
                                      setShowEventModal(false);
                                      setData("showCalendarUpdateForm", true);

                                      // Reset the local frequency state
                                      setUpdateFrequency("NONE");

                                      // Fetch event details by ID - same logic as in list view
                                      try {
                                        let readEventId: string;
                                        let updateEventId: string;

                                        if (event.recurringId) {
                                          readEventId = event.recurringId;
                                          updateEventId = event.recurringId;
                                        } else {
                                          readEventId = event.id;
                                          updateEventId = event.id;
                                        }

                                        const response = await runPixel<
                                          [string]
                                        >(
                                          `META | GoogleCalendarReadEvent(id="${readEventId}")`
                                        );
                                        let outputRead: any =
                                          response.pixelReturn[0].output;

                                        if (typeof outputRead === "string") {
                                          try {
                                            outputRead = JSON.parse(outputRead);
                                          } catch (e) {
                                            outputRead = {};
                                          }
                                        }

                                        const isRecurringEvent =
                                          event.recurringId ||
                                          outputRead?.recurrence ||
                                          outputRead?.frequency ||
                                          outputRead?.until;

                                        setUpdateValue(
                                          "GOOGLECALENDAR_ID",
                                          updateEventId
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_SUMMARY",
                                          outputRead?.summary || ""
                                        );

                                        const location =
                                          outputRead?.location ||
                                          outputRead?.where ||
                                          outputRead?.place ||
                                          "";
                                        setUpdateValue(
                                          "GOOGLECALENDAR_LOCATION",
                                          location
                                        );

                                        setUpdateValue(
                                          "GOOGLECALENDAR_DESCRIPTION",
                                          outputRead?.description || ""
                                        );

                                        const startDate =
                                          outputRead?.starttime ||
                                          outputRead?.startTime ||
                                          outputRead?.start?.dateTime ||
                                          outputRead?.start ||
                                          "";
                                        const endDate =
                                          outputRead?.endtime ||
                                          outputRead?.endTime ||
                                          outputRead?.end?.dateTime ||
                                          outputRead?.end ||
                                          "";

                                        if (startDate) {
                                          try {
                                            const formattedStartDate = dayjs(
                                              startDate
                                            ).isValid()
                                              ? dayjs(startDate).toISOString()
                                              : "";
                                            setUpdateValue(
                                              "GOOGLECALENDAR_STARTDATE",
                                              formattedStartDate
                                            );
                                          } catch (e) {
                                            setUpdateValue(
                                              "GOOGLECALENDAR_STARTDATE",
                                              ""
                                            );
                                          }
                                        } else {
                                          setUpdateValue(
                                            "GOOGLECALENDAR_STARTDATE",
                                            ""
                                          );
                                        }

                                        if (endDate) {
                                          try {
                                            const formattedEndDate = dayjs(
                                              endDate
                                            ).isValid()
                                              ? dayjs(endDate).toISOString()
                                              : "";
                                            setUpdateValue(
                                              "GOOGLECALENDAR_ENDDATE",
                                              formattedEndDate
                                            );
                                          } catch (e) {
                                            setUpdateValue(
                                              "GOOGLECALENDAR_ENDDATE",
                                              ""
                                            );
                                          }
                                        } else {
                                          setUpdateValue(
                                            "GOOGLECALENDAR_ENDDATE",
                                            ""
                                          );
                                        }

                                        const attendees =
                                          outputRead?.attendees ||
                                          outputRead?.guests ||
                                          [];
                                        const emails = Array.isArray(attendees)
                                          ? attendees
                                              .map((a) => a.email || a)
                                              .filter(Boolean)
                                              .join(", ")
                                          : "";
                                        setUpdateValue(
                                          "GOOGLECALENDAR_EMAIL",
                                          emails
                                        );

                                        setUpdateValue(
                                          "GOOGLECALENDAR_VIDEO",
                                          !!outputRead?.video ||
                                            !!outputRead?.hangoutLink
                                        );

                                        const untilDate =
                                          outputRead?.until ||
                                          outputRead?.recurringUntil ||
                                          outputRead?.recurrence?.until ||
                                          outputRead?.endRecurrence ||
                                          outputRead?.recurringEnd ||
                                          "";

                                        if (isRecurringEvent) {
                                          const frequency =
                                            outputRead?.frequency ||
                                            outputRead?.recurrence?.freq ||
                                            "DAILY";
                                          setUpdateValue(
                                            "GOOGLECALENDAR_FREQUENCY",
                                            frequency
                                          );
                                          setUpdateFrequency(frequency);

                                          if (untilDate) {
                                            try {
                                              let parsedDate;

                                              if (
                                                typeof untilDate === "string" &&
                                                /^\d{8}T\d{6}Z$/.test(untilDate)
                                              ) {
                                                const year =
                                                  untilDate.substring(0, 4);
                                                const month =
                                                  untilDate.substring(4, 6);
                                                const day = untilDate.substring(
                                                  6,
                                                  8
                                                );
                                                const hour =
                                                  untilDate.substring(9, 11);
                                                const minute =
                                                  untilDate.substring(11, 13);
                                                const second =
                                                  untilDate.substring(13, 15);

                                                const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                                                parsedDate = dayjs(isoString);
                                              } else if (
                                                dayjs(untilDate).isValid()
                                              ) {
                                                parsedDate = dayjs(untilDate);
                                              }

                                              if (
                                                parsedDate &&
                                                parsedDate.isValid()
                                              ) {
                                                const formattedUntil =
                                                  parsedDate.toISOString();
                                                setUpdateValue(
                                                  "GOOGLECALENDAR_UNTIL",
                                                  formattedUntil
                                                );
                                              } else {
                                                setUpdateValue(
                                                  "GOOGLECALENDAR_UNTIL",
                                                  ""
                                                );
                                              }
                                            } catch (e) {
                                              setUpdateValue(
                                                "GOOGLECALENDAR_UNTIL",
                                                ""
                                              );
                                            }
                                          } else {
                                            setUpdateValue(
                                              "GOOGLECALENDAR_UNTIL",
                                              ""
                                            );
                                          }
                                        } else {
                                          setUpdateValue(
                                            "GOOGLECALENDAR_FREQUENCY",
                                            "NONE"
                                          );
                                          setUpdateFrequency("NONE");
                                          setUpdateValue(
                                            "GOOGLECALENDAR_UNTIL",
                                            ""
                                          );
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Error fetching event for edit:",
                                          error
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_ID",
                                          event.recurringId || event.id
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_SUMMARY",
                                          event.summary
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_LOCATION",
                                          ""
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_DESCRIPTION",
                                          ""
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_STARTDATE",
                                          ""
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_ENDDATE",
                                          ""
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_EMAIL",
                                          ""
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_VIDEO",
                                          false
                                        );
                                        setUpdateValue(
                                          "GOOGLECALENDAR_FREQUENCY",
                                          "NONE"
                                        );
                                        setUpdateFrequency("NONE");
                                        setUpdateValue(
                                          "GOOGLECALENDAR_UNTIL",
                                          ""
                                        );
                                      }
                                    }}
                                    sx={{
                                      textTransform: "none",
                                      borderRadius: "6px",
                                      color: "#1976d2",
                                      borderColor: "#1976d2",
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(25, 118, 210, 0.08)",
                                      },
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      setShowEventModal(false);
                                      // Use the same delete confirmation flow as list view
                                      setPendingDeleteEvent({
                                        id: event.id,
                                        recurringId: event.recurringId,
                                        summary: event.summary,
                                        isRecurring: !!event.recurringId,
                                      });
                                      setShowDeleteConfirm(true);
                                    }}
                                    sx={{
                                      textTransform: "none",
                                      borderRadius: "6px",
                                      color: "error.main",
                                      borderColor: "#d32f2f",
                                      "&:hover": {
                                        borderColor: "#d32f2f",
                                        backgroundColor:
                                          "rgba(211, 47, 47, 0.1)",
                                      },
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "40px 20px",
                              color: "#666",
                            }}
                          >
                            <Typography variant="body1">
                              No events scheduled for this date.
                            </Typography>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "24px",
                            gap: "12px",
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => setShowEventModal(false)}
                            sx={{
                              textTransform: "none",
                              color: "#666",
                              borderColor: "#e0e0e0",
                              "&:hover": {
                                borderColor: "#666",
                              },
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </Modal.Content>
                  </Modal>
                )}
              </>
            )}
          </>
        )}
        {data.showCreateForm && createdCalendar && (
          <Modal
            open={true}
            onClose={() => {
              setData(
                "showCreateForm",
                false as PathValue<
                  GoogleCalendarBlockDef["data"],
                  "showCreateForm"
                >
              );
              setCreatedCalendar(null);
              getCalendarList(startDate, endDate);
            }}
          >
            <StyledModalContent>
              <Typography variant="h6" align="center">
                Successfully created event
              </Typography>
              <Typography variant="body1">
                <strong>Event ID:</strong> {createdCalendar.id || "N/A"}
              </Typography>
              {createdCalendar.video && createdCalendar.Link && (
                <Typography variant="body1">
                  <strong>Google Meet Link:</strong>{" "}
                  <a
                    href={createdCalendar.Link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {createdCalendar.Link}
                  </a>
                </Typography>
              )}
              <Stack direction="row" justifyContent="center">
                <Button
                  variant="contained"
                  onClick={() => {
                    setData(
                      "showCreateForm",
                      false as PathValue<
                        GoogleCalendarBlockDef["data"],
                        "showCreateForm"
                      >
                    );
                    setCreatedCalendar(null);
                    getCalendarList(startDate, endDate);
                  }}
                  sx={{
                    color: "var(--variant-containedColor)",
                    backgroundColor: "var(--variant-containedBg)",
                    "&:hover": {
                      backgroundColor: "rgba(4, 113, 240, 0.8)",
                    },
                  }}
                >
                  Close
                </Button>
              </Stack>
            </StyledModalContent>
          </Modal>
        )}
        {data.showUpdateForm && updatedCalendar && (
          <Modal
            open={true}
            onClose={() => {
              setData(
                "showUpdateForm",
                false as PathValue<
                  GoogleCalendarBlockDef["data"],
                  "showUpdateForm"
                >
              );
              setUpdatedCalendar(null);
              getCalendarList(startDate, endDate);
            }}
          >
            <StyledModalContent>
              <Typography variant="h6" align="center">
                Event Updated Successfully
              </Typography>
              <Stack direction="row" justifyContent="center">
                <Button
                  variant="contained"
                  onClick={() => {
                    setData(
                      "showUpdateForm",
                      false as PathValue<
                        GoogleCalendarBlockDef["data"],
                        "showUpdateForm"
                      >
                    );
                    setUpdatedCalendar(null);
                    getCalendarList(startDate, endDate);
                  }}
                  sx={{
                    color: "var(--variant-containedColor)",
                    backgroundColor: "var(--variant-containedBg)",
                    "&:hover": {
                      backgroundColor: "rgba(4, 113, 240, 0.8)",
                    },
                  }}
                >
                  Close
                </Button>
              </Stack>
            </StyledModalContent>
          </Modal>
        )}
        {data.showDeleteForm && deletedCalendar && (
          <Modal
            open={true}
            onClose={() => {
              setData(
                "showDeleteForm",
                false as PathValue<
                  GoogleCalendarBlockDef["data"],
                  "showDeleteForm"
                >
              );
              setDeletedCalendar(null);
              getCalendarList(startDate, endDate);
            }}
          >
            <StyledModalContent>
              <Typography variant="h6" align="center">
                Event Deleted Successfully: {deletedCalendar.summary}
              </Typography>
              <Stack direction="row" justifyContent="center">
                <Button
                  variant="contained"
                  onClick={() => {
                    setData(
                      "showDeleteForm",
                      false as PathValue<
                        GoogleCalendarBlockDef["data"],
                        "showDeleteForm"
                      >
                    );
                    setDeletedCalendar(null);
                    getCalendarList(startDate, endDate);
                  }}
                  sx={{
                    color: "var(--variant-containedColor)",
                    backgroundColor: "var(--variant-containedBg)",
                    "&:hover": {
                      backgroundColor: "rgba(4, 113, 240, 0.8)",
                    },
                  }}
                >
                  Close
                </Button>
              </Stack>
            </StyledModalContent>
          </Modal>
        )}

        {showDeleteConfirm && pendingDeleteEvent && (
          <Modal
            open={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setPendingDeleteEvent(null);
            }}
          >
            <StyledModalContent>
              {pendingDeleteEvent.isRecurring ? (
                // Recurring event - show two options first
                <>
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{ marginBottom: 2 }}
                  >
                    Delete Recurring Event
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ marginBottom: 3, textAlign: "center" }}
                  >
                    "{pendingDeleteEvent.summary}" is a recurring event.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ marginBottom: 3, color: "#666" }}
                  >
                    How would you like to delete this event?
                  </Typography>

                  <Stack direction="column" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        // Close this modal and show final confirmation for single delete
                        setShowDeleteConfirm(false);
                        setFinalDeleteAction({
                          type: "single",
                          eventId: pendingDeleteEvent.id,
                          eventName: pendingDeleteEvent.summary,
                        });
                        setShowFinalDeleteConfirm(true);
                      }}
                      sx={{
                        padding: "12px 16px",
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: "500",
                        color: "var(--variant-outlinedColor)",
                        borderColor: "var(--variant-outlinedBorder)",
                        "&:hover": {
                          borderColor: "var(--variant-outlinedColor)",
                          backgroundColor: "rgba(4, 113, 240, 0.1)",
                        },
                      }}
                    >
                      Delete This Event Only
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#666",
                          fontWeight: "normal",
                          display: "block",
                        }}
                      >
                        Only this occurrence will be deleted
                      </Typography>
                    </Button>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        // Close this modal and show final confirmation for series delete
                        setShowDeleteConfirm(false);
                        const masterIdToDelete =
                          pendingDeleteEvent.recurringId ||
                          pendingDeleteEvent.id;
                        setFinalDeleteAction({
                          type: "series",
                          eventId: masterIdToDelete,
                          eventName: pendingDeleteEvent.summary,
                        });
                        setShowFinalDeleteConfirm(true);
                      }}
                      sx={{
                        padding: "12px 16px",
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: "500",
                        color: "error.main",
                        backgroundColor: "var(--variant-containedColor)",
                        border: "1px solid #d32f2f",
                        "&:hover": {
                          backgroundColor: "rgba(211, 47, 47, 0.1)",
                        },
                      }}
                    >
                      Delete All Events in Series
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#666",
                          fontWeight: "normal",
                          display: "block",
                        }}
                      >
                        All occurrences will be permanently deleted
                      </Typography>
                    </Button>
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="center"
                    sx={{ marginTop: 2 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setPendingDeleteEvent(null);
                      }}
                      sx={{
                        color: "var(--variant-outlinedColor)",
                        borderColor: "var(--variant-outlinedBorder)",
                        "&:hover": {
                          borderColor: "var(--variant-outlinedColor)",
                          backgroundColor: "rgba(4, 113, 240, 0.1)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </>
              ) : (
                // Single event - show immediate confirmation
                <>
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{ marginBottom: 2 }}
                  >
                    Delete Event
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ marginBottom: 3, textAlign: "center" }}
                  >
                    This action is irreversible. Are you sure you want to
                    delete?
                  </Typography>

                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      onClick={async () => {
                        await onDeleteSubmit({
                          id: pendingDeleteEvent.id,
                          summary: pendingDeleteEvent.summary,
                          type: "single",
                        });

                        // Refresh calendar list
                        if (startDate && endDate) {
                          getCalendarList(startDate, endDate);
                        }

                        notification.add({
                          color: "success",
                          message: "Event deleted successfully",
                        });
                      }}
                      sx={{
                        color: "error.main",
                        backgroundColor: "var(--variant-containedColor)",
                        border: "1px solid #d32f2f",
                        "&:hover": {
                          backgroundColor: "rgba(211, 47, 47, 0.1)",
                        },
                      }}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setPendingDeleteEvent(null);
                      }}
                      sx={{
                        color: "var(--variant-outlinedColor)",
                        borderColor: "var(--variant-outlinedBorder)",
                        "&:hover": {
                          borderColor: "var(--variant-outlinedColor)",
                          backgroundColor: "rgba(4, 113, 240, 0.1)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </>
              )}
            </StyledModalContent>
          </Modal>
        )}
        {showFinalDeleteConfirm && finalDeleteAction && (
          <Modal
            open={showFinalDeleteConfirm}
            onClose={() => {
              setShowFinalDeleteConfirm(false);
              setFinalDeleteAction(null);
              setPendingDeleteEvent(null);
            }}
          >
            <StyledModalContent>
              <Typography variant="h6" align="center" sx={{ marginBottom: 2 }}>
                Delete Event
              </Typography>
              <Typography
                variant="body1"
                sx={{ marginBottom: 3, textAlign: "center" }}
              >
                This action is irreversible. Are you sure you want to delete "
                {finalDeleteAction.eventName}"?
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="error"
                  onClick={async () => {
                    await onDeleteSubmit({
                      id: finalDeleteAction.eventId,
                      summary: finalDeleteAction.eventName,
                      type: finalDeleteAction.type,
                    });

                    // Refresh calendar list
                    if (startDate && endDate) {
                      getCalendarList(startDate, endDate);
                    }

                    notification.add({
                      color: "success",
                      message:
                        finalDeleteAction.type === "single"
                          ? "This occurrence deleted successfully"
                          : "Entire recurring series deleted successfully",
                    });
                  }}
                  sx={{
                    color: "error.main",
                    backgroundColor: "var(--variant-containedColor)",
                    border: "1px solid #d32f2f",
                    "&:hover": {
                      backgroundColor: "rgba(211, 47, 47, 0.1)",
                    },
                  }}
                >
                  Yes
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowFinalDeleteConfirm(false);
                    setFinalDeleteAction(null);
                    setPendingDeleteEvent(null);
                  }}
                  sx={{
                    color: "var(--variant-outlinedColor)",
                    borderColor: "var(--variant-outlinedBorder)",
                    "&:hover": {
                      borderColor: "var(--variant-outlinedColor)",
                      backgroundColor: "rgba(4, 113, 240, 0.1)",
                    },
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </StyledModalContent>
          </Modal>
        )}
      </div>
    </div>
  );
});
