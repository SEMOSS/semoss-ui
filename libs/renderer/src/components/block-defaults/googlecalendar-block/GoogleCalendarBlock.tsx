import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { MenuItem, Select, FormControl } from "@semoss/ui";
import "react-quill/dist/quill.snow.css";
import { useBlock, useTypeWriter, useBlocks } from "../../../hooks";
import {
    BlockDef,
    BlockComponent,
    ListenerActions,
    ActionMessages,
    Block,
} from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { Env, runPixel } from "@semoss/sdk/react";
import {
    Button,
    TextField,
    Modal,
    LinearProgress,
    Stack,
    useNotification,
    TextArea,
    styled,
    Autocomplete,
    Typography,
} from "@semoss/ui";
import { useRootStore } from "@semoss/ui/hooks";
import { Add } from "@mui/icons-material";
import { Paths, PathValue } from "../../../types";
import { useCallback } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    paddingTop: `${theme.spacing(1)}!important`,
}));

const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: "20px !important",
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

type showCalendarReadForm = {
    GOOGLECALENDAR_ID: string;
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
};

type showCalendarDeleteForm = {
    GOOGLECALENDAR_ID: string;
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
        showCalendarReadForm: boolean;
        showReadForm: boolean;
        showCalendarDeleteForm: boolean;
        showDeleteForm: boolean;
        listAllCalendar: boolean;
        listedCalendar: boolean;
        googlecalendarConnectionValue: string;
        googlecalendarActionValue: string;
        calendarSummaryValue: string;
    };
    slots: never;
    listeners: never;
}

interface useBlockSettingsReturn<D extends BlockDef = BlockDef> {
    /** Data for the block  */
    data: Block<D>["data"];

    /** Data for the block  */
    listeners: Block<D>["listeners"];

    /**
     * Dispatch a message to set data
     * @param path - path of the data to set
     * @param value - value of the data to set
     */
    setData: <P extends Paths<Block<D>["data"], 4>>(
        path: P,
        value: PathValue<D["data"], P>,
    ) => void;

    /**
     * Dispatch a message to delete data
     * @param path - path of the data to delete
     */
    deleteData: <P extends Paths<Block<D>["data"], 4>>(path: P) => void;

    /**
     * Dispatch a message to set the listeners
     * @param listeners - listeners to attach to the block
     */
    setListener: (
        listener: keyof Block<D>["listeners"],
        actions: ListenerActions[],
        type?: "sync" | "async",
    ) => void;
}

const useBlockSettings = <D extends BlockDef = BlockDef>(
    id: string,
): useBlockSettingsReturn<D> => {
    // get the store
    const { state } = useBlocks();

    // get the block
    const block = state.getBlock(id);

    // get block
    if (!block) {
        throw Error(`Cannot find block ${id}`);
    }

    /**
     * Dispatch a message to set data
     * @param path - path of the data to set
     * @param value - value of the data to set
     */
    const setData = useCallback(
        <P extends Paths<Block<D>["data"], 4>>(
            path: P | null,
            value: PathValue<Block<D>["data"], P>,
        ): void => {
            state.dispatch({
                message: ActionMessages.SET_BLOCK_DATA,
                payload: {
                    id: id,
                    path: path,
                    value: value,
                },
            });
        },
        [id],
    );

    /**
     * Dispatch a message to delete data
     * @param path - path of the data to delete
     */
    const deleteData = useCallback(
        <P extends Paths<Block<D>["data"], 4>>(path: P | null): void => {
            state.dispatch({
                message: ActionMessages.DELETE_BLOCK_DATA,
                payload: {
                    id: id,
                    path: path,
                },
            });
        },
        [],
    );

    /**
     * Dispatch a message to set the listeners
     * @param listener - listener to add to the block
     * @param actions - actions to add to the block
     *
     */
    const setListener = useCallback(
        (
            listener: keyof Block<D>["listeners"],
            actions: ListenerActions[],
            type: "sync" | "async",
        ): void => {
            state.dispatch({
                message: ActionMessages.SET_LISTENER,
                payload: {
                    id: id,
                    listener: listener as string,
                    actions: actions,
                    type: type,
                },
            });
        },
        [],
    );

    return {
        data: block.data || {},
        listeners: block.listeners || {},
        setData: setData,
        deleteData: deleteData,
        setListener: setListener,
    };
};

export const GoogleCalendarBlock: BlockComponent = observer(({ id }) => {
    const block = useBlock<GoogleCalendarBlockDef>(id);
    const state = useBlocks();
    const { data } = block;
    const { setData } = useBlockSettings(id);
    const [isDelete, setIsDelete] = useState(false);
    const [createdCalendar, setCreatedCalendar] = useState<{
        summary: string;
        location: string;
        description: string;
        startdate: string;
        enddate: string;
        email: string;
        video: boolean;
        id?: string;
        Link?: string;
    } | null>(null);
    const [readCalendar, setReadCalendar] = useState<{
        id: string;
        summary: string;
        location: string;
        description: string;
        startdate: string;
        enddate: string;
        email: string;
        video: boolean;
    } | null>(null);
    const [updatedCalendar, setUpdatedCalendar] = useState<{
        id: string;
        summary: string;
        location: string;
        description: string;
        startdate: string;
        enddate: string;
        email: string;
        video: boolean;
    } | null>(null);
    const [deletedCalendar, setDeletedCalendar] = useState<{
        id: string;
        summary: string;
        location: string;
        description: string;
        startdate: string;
        enddate: string;
        email: string;
        video: boolean;
    } | null>(null);
    const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteValues, setPendingDeleteValues] =
        useState<showCalendarDeleteForm | null>(null);
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
        dayjs().subtract(3, "month"),
    );
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
        dayjs().add(3, "month"),
    );
    const [calendarSummaryList, setCalendarSummaryList] = useState([]);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [expandedEventDetails, setExpandedEventDetails] = useState<any>(null);
    const { monolithStore, configStore } = useRootStore();
    const [isLoading, setIsLoading] = useState(false);
    const notification = useNotification();
    console.log("loggedInUser", configStore.store.config.loginDetails);
    const [loggedInUser, setLoggedInUser] = useState("");

    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

    useEffect(() => {
        if (data.showCalendarUpdateForm) {
            setReadCalendar(null);
        }
    }, [data.showCalendarUpdateForm]);

    useEffect(() => {
        console.log("loggedInUserfirst", configStore.store.config);
        (async () => {
            await configStore.initialize();
        })();
    }, [configStore]);

    useEffect(() => {
        if (loggedInUser) {
            fetchCalendarOptionsCustom(startDate, endDate);
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (loggedInUser && startDate && endDate) {
            fetchCalendarOptionsCustom(startDate, endDate);
        }
    }, [loggedInUser, startDate, endDate]);

    useEffect(() => {
        fetchCalendarOptionsCustom(startDate, endDate);
    }, [data.showCalendarUpdateForm, data.showCalendarDeleteForm]);

    if (!data.isStreaming) displayTxt = textContent;
    const {
        getValues: getCreateValues,
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
        },
    });
    const {
        getValues: getReadValues,
        handleSubmit: handleReadSubmit,
        control: controlRead,
        reset: resetRead,
        setValue: setReadValue,
    } = useForm<showCalendarReadForm>({
        defaultValues: {
            GOOGLECALENDAR_ID: "",
        },
    });

    const {
        getValues: getDeleteValues,
        handleSubmit: handleDeleteSubmit,
        control: controlDelete,
        reset: resetDelete,
        setValue: setDeleteValue,
    } = useForm<showCalendarDeleteForm>({
        defaultValues: {
            GOOGLECALENDAR_ID: "",
        },
    });

    const fetchCalendarOptionsCustom = async (
        start: dayjs.Dayjs,
        end: dayjs.Dayjs,
    ) => {
        try {
            const startdate = start.format("YYYY-MM-DDTHH:mm:ssZ");
            const enddate = end.format("YYYY-MM-DDTHH:mm:ssZ");
            const response = await runPixel<[string]>(
                `META | GoogleCalendarList(startdate="${startdate}",enddate="${enddate}");`,
            );
            const output = response.pixelReturn[0].output;
            console.log("Fetched calendar output:", output);
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf("ERROR") === -1) {
                // Map to array of objects: { summary, id }
                const events = Array.isArray(output)
                    ? output.map((arr) => ({ summary: arr[0], id: arr[1] }))
                    : [];
                setCalendarSummaryList(events);
            } else {
                throw new Error(output);
            }
        } catch (error) {
            console.error("Error fetching calendar events:", error);
        }
    };

    const onReadSubmit = handleReadSubmit(
        async (readData: showCalendarReadForm) => {
            try {
                const response = await runPixel<[string]>(
                    `META | GoogleCalendarReadEvent(id="${readData.GOOGLECALENDAR_ID}")`,
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
                    setReadCalendar({
                        id: readData.GOOGLECALENDAR_ID,
                        summary: outputRead?.summary || "",
                        location: outputRead?.location || "",
                        description: outputRead?.description || "",
                        startdate: outputRead?.starttime || "",
                        enddate: outputRead?.endtime || "",
                        email: Array.isArray(outputRead?.attendees)
                            ? outputRead.attendees
                                  .map((a) => a.email)
                                  .join(", ")
                            : "",
                        video: outputRead?.video || false,
                    });
                    setData(
                        "showCalendarReadForm",
                        false as PathValue<
                            GoogleCalendarBlockDef["data"],
                            "showCalendarReadForm"
                        >,
                    );
                    setData(
                        "showReadForm",
                        true as PathValue<
                            GoogleCalendarBlockDef["data"],
                            "showReadForm"
                        >,
                    );
                    resetRead();
                } else {
                    throw new Error(response.errors[0]);
                }
            } catch (error) {
                console.error("Error reading calendar event:", error);
            }
        },
    );

    const onCreateSubmit = handleCreateSubmit(
        async (createData: showCalendarCreateForm) => {
            try {
                const startDateFormatted = dayjs(
                    createData.GOOGLECALENDAR_STARTDATE,
                ).format("YYYY-MM-DDTHH:mm:ssZ");
                const endDateFormatted = dayjs(
                    createData.GOOGLECALENDAR_ENDDATE,
                ).format("YYYY-MM-DDTHH:mm:ssZ");
                let pixelQuery = `META | GoogleCalendarCreateEvent(summary="${createData.GOOGLECALENDAR_SUMMARY}", location="${createData.GOOGLECALENDAR_LOCATION}", description="${createData.GOOGLECALENDAR_DESCRIPTION}", startdate="${startDateFormatted}", enddate="${endDateFormatted}", email="${createData.GOOGLECALENDAR_EMAIL}", video=${createData.GOOGLECALENDAR_VIDEO}`;

                if (createData.GOOGLECALENDAR_FREQUENCY) {
                    pixelQuery += `, frequency="${createData.GOOGLECALENDAR_FREQUENCY}"`;
                }
                if (createData.GOOGLECALENDAR_UNTIL) {
                    const untilFormatted = dayjs(
                        createData.GOOGLECALENDAR_UNTIL,
                    ).format("YYYY-MM-DDTHH:mm:ssZ");
                    pixelQuery += `, until="${untilFormatted}"`;
                }
                pixelQuery += ")";

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
                    setData("showCalendarCreateForm", false);
                    setData("showCreateForm", true);
                    setCreatedCalendar({
                        summary: createData.GOOGLECALENDAR_SUMMARY,
                        location: createData.GOOGLECALENDAR_LOCATION,
                        description: createData.GOOGLECALENDAR_DESCRIPTION,
                        startdate: createData.GOOGLECALENDAR_STARTDATE,
                        enddate: createData.GOOGLECALENDAR_ENDDATE,
                        email: createData.GOOGLECALENDAR_EMAIL,
                        video: createData.GOOGLECALENDAR_VIDEO,
                        id: outputCreate?.id,
                        Link: createData.GOOGLECALENDAR_VIDEO
                            ? outputCreate?.Link
                            : undefined,
                    });
                    resetCreate();
                } else {
                    throw new Error(response.errors[0]);
                }
            } catch (error) {
                console.error("Error Creating Calendar Event:", error);
            }
        },
    );

    const onUpdateSubmit = handleUpdateSubmit(
        async (updateData: showCalendarUpdateForm) => {
            try {
                const startDateFormatted = dayjs(
                    updateData.GOOGLECALENDAR_STARTDATE,
                ).format("YYYY-MM-DDTHH:mm:ssZ");
                const endDateFormatted = dayjs(
                    updateData.GOOGLECALENDAR_ENDDATE,
                ).format("YYYY-MM-DDTHH:mm:ssZ");
                const response = await runPixel<[string]>(
                    `META | GoogleCalendarUpdateEvent(summary="${updateData.GOOGLECALENDAR_SUMMARY}", location="${updateData.GOOGLECALENDAR_LOCATION}", description="${updateData.GOOGLECALENDAR_DESCRIPTION}", startdate="${startDateFormatted}", enddate="${endDateFormatted}", video="${updateData.GOOGLECALENDAR_VIDEO}", email="${updateData.GOOGLECALENDAR_EMAIL}", id="${updateData.GOOGLECALENDAR_ID}")`,
                );
                const outputUpdate = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf("ERROR") === -1) {
                    setUpdatedCalendar({
                        id: updateData.GOOGLECALENDAR_ID,
                        summary: updateData.GOOGLECALENDAR_SUMMARY,
                        location: updateData.GOOGLECALENDAR_LOCATION,
                        description: updateData.GOOGLECALENDAR_DESCRIPTION,
                        startdate: updateData.GOOGLECALENDAR_STARTDATE,
                        enddate: updateData.GOOGLECALENDAR_ENDDATE,
                        email: updateData.GOOGLECALENDAR_EMAIL,
                        video: updateData.GOOGLECALENDAR_VIDEO,
                    });
                    setData(
                        "showCalendarUpdateForm",
                        false as PathValue<
                            GoogleCalendarBlockDef["data"],
                            "showCalendarUpdateForm"
                        >,
                    );
                    setData(
                        "showUpdateForm",
                        true as PathValue<
                            GoogleCalendarBlockDef["data"],
                            "showUpdateForm"
                        >,
                    );
                    resetUpdate();
                } else {
                    throw new Error(response.errors[0]);
                }
            } catch (error) {
                console.error("Error updating calendar event:", error);
            }
        },
    );

    const handleDeleteFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const values = getDeleteValues();
        if (!values.GOOGLECALENDAR_ID) {
            alert("Calendar Event ID is required.");
            return;
        }
        setPendingDeleteValues(values);
        setShowDeleteConfirm(true);
    };

    const onDeleteSubmit = async (deleteValues?: showCalendarDeleteForm) => {
        const values = deleteValues || getDeleteValues();
        if (!values.GOOGLECALENDAR_ID) {
            alert("Calendar Event Summary is required.");
            return;
        }
        try {
            const response = await runPixel<[string]>(
                `META | GoogleCalendarDeleteEvent(id="${values.GOOGLECALENDAR_ID}");`,
            );
            const outputDelete = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf("ERROR") === -1) {
                setData(
                    "showCalendarDeleteForm",
                    false as PathValue<
                        GoogleCalendarBlockDef["data"],
                        "showCalendarDeleteForm"
                    >,
                );
                setData(
                    "showDeleteForm",
                    true as PathValue<
                        GoogleCalendarBlockDef["data"],
                        "showDeleteForm"
                    >,
                );

                setDeleteMessage("Calendar event deleted successfully");

                setDeletedCalendar({
                    id: values.GOOGLECALENDAR_ID,
                    summary: "",
                    location: "",
                    description: "",
                    startdate: "",
                    enddate: "",
                    email: "",
                    video: false,
                });
                resetDelete();
                setIsDelete(false);
            } else {
                throw new Error(response.errors[0]);
            }
        } catch (error) {
            console.error("Error deleting calendar event:", error);
            setDeleteMessage("Delete failed!");
        }
        setShowDeleteConfirm(false);
        setPendingDeleteValues(null);
    };

    const oauth = async (provider: string) => {
        setIsLoading(true);
        await configStore
            .oauth(provider)
            .then(async () => {
                setIsLoading(false);
                notification.add({
                    color: "success",
                    message: `Successfully logged in`,
                });
                await configStore.initialize();
                setLoggedInUser(
                    configStore.store.config.loginDetails["GOOGLE"].name,
                );
            })
            .catch((error) => {
                setIsLoading(false);
                notification.add({
                    color: "error",
                    message: error.message,
                });
            });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div
                data-block={id}
                style={{ position: "relative", ...data.style }}
            >
                {showBlock(block, state) ? (
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
                                        control={controlCreate}
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
                                        control={controlCreate}
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
                                        control={controlCreate}
                                        rules={{
                                            required: "Start Date is required",
                                        }}
                                        render={({ field, fieldState }) => (
                                            <DateTimePicker
                                                label="Start Date"
                                                value={
                                                    field.value
                                                        ? dayjs(field.value)
                                                        : null
                                                }
                                                onChange={(date) =>
                                                    field.onChange(
                                                        date
                                                            ? date.toISOString()
                                                            : "",
                                                    )
                                                }
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
                                        control={controlCreate}
                                        rules={{
                                            required: "End Date is required",
                                        }}
                                        render={({ field, fieldState }) => (
                                            <DateTimePicker
                                                label="End Date"
                                                value={
                                                    field.value
                                                        ? dayjs(field.value)
                                                        : null
                                                }
                                                onChange={(date) =>
                                                    field.onChange(
                                                        date
                                                            ? date.toISOString()
                                                            : "",
                                                    )
                                                }
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
                                        control={controlCreate}
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
                                        name={"GOOGLECALENDAR_VIDEO"}
                                        control={controlCreate}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <Select
                                                    label="Enable Video"
                                                    value={
                                                        field.value
                                                            ? "true"
                                                            : "false"
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ===
                                                                "true",
                                                        )
                                                    }
                                                >
                                                    <MenuItem value="true">
                                                        Yes
                                                    </MenuItem>
                                                    <MenuItem value="false">
                                                        No
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                    <Controller
                                        name={"GOOGLECALENDAR_FREQUENCY"}
                                        control={controlCreate}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <Select
                                                    label="Recurring Frequency"
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                >
                                                    <MenuItem value="DAILY">
                                                        Daily
                                                    </MenuItem>
                                                    <MenuItem value="WEEKLY">
                                                        Weekly
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                    <Controller
                                        name={"GOOGLECALENDAR_UNTIL"}
                                        control={controlCreate}
                                        render={({ field }) => (
                                            <DateTimePicker
                                                label="Recurring Final Date"
                                                value={
                                                    field.value
                                                        ? dayjs(field.value)
                                                        : null
                                                }
                                                onChange={(date) =>
                                                    field.onChange(
                                                        date
                                                            ? date.toISOString()
                                                            : "",
                                                    )
                                                }
                                                format="MM-DD-YYYY hh:mm A"
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                    },
                                                }}
                                            />
                                        )}
                                    />
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    paddingX={2}
                                    paddingBottom={2}
                                >
                                    <StyledButton
                                        type="button"
                                        onClick={() => {
                                            resetCreate();
                                            setData(
                                                "showCalendarCreateForm",
                                                false as PathValue<
                                                    GoogleCalendarBlockDef["data"],
                                                    "showCalendarCreateForm"
                                                >,
                                            );
                                        }}
                                    >
                                        Cancel
                                    </StyledButton>
                                    <StyledButton
                                        type="submit"
                                        variant="contained"
                                    >
                                        Submit
                                    </StyledButton>
                                </Stack>
                            </form>
                        ) : data.showCalendarReadForm ? (
                            <form onSubmit={onReadSubmit}>
                                <Stack
                                    direction="column"
                                    spacing={2}
                                    style={{ paddingTop: "10px" }}
                                >
                                    <Controller
                                        name={"GOOGLECALENDAR_ID"}
                                        control={controlRead}
                                        rules={{
                                            required:
                                                "Calendar Event Summary is required",
                                        }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Calendar Event Summary"
                                                value={field.value || ""}
                                                disabled
                                                fullWidth
                                            />
                                        )}
                                    />
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    paddingX={2}
                                    paddingBottom={2}
                                >
                                    <StyledButton
                                        type="button"
                                        onClick={() => {
                                            resetRead();
                                            setData(
                                                "showCalendarReadForm",
                                                false as PathValue<
                                                    GoogleCalendarBlockDef["data"],
                                                    "showCalendarReadForm"
                                                >,
                                            );
                                        }}
                                    >
                                        Cancel
                                    </StyledButton>
                                    <StyledButton
                                        type="submit"
                                        variant="contained"
                                    >
                                        Read
                                    </StyledButton>
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
                                                value={
                                                    field.value
                                                        ? dayjs(field.value)
                                                        : null
                                                }
                                                onChange={(date) =>
                                                    field.onChange(
                                                        date
                                                            ? date.toISOString()
                                                            : "",
                                                    )
                                                }
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
                                                value={
                                                    field.value
                                                        ? dayjs(field.value)
                                                        : null
                                                }
                                                onChange={(date) =>
                                                    field.onChange(
                                                        date
                                                            ? date.toISOString()
                                                            : "",
                                                    )
                                                }
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
                                        name={"GOOGLECALENDAR_VIDEO"}
                                        control={controlCreate}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <Select
                                                    label="Enable Video"
                                                    value={
                                                        field.value
                                                            ? "true"
                                                            : "false"
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ===
                                                                "true",
                                                        )
                                                    }
                                                >
                                                    <MenuItem value="true">
                                                        Yes
                                                    </MenuItem>
                                                    <MenuItem value="false">
                                                        No
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    paddingX={2}
                                    paddingBottom={2}
                                >
                                    <StyledButton
                                        type="button"
                                        onClick={() => {
                                            resetUpdate();
                                            setData(
                                                "showCalendarUpdateForm",
                                                false as PathValue<
                                                    GoogleCalendarBlockDef["data"],
                                                    "showCalendarUpdateForm"
                                                >,
                                            );
                                        }}
                                    >
                                        Cancel
                                    </StyledButton>
                                    <StyledButton
                                        type="submit"
                                        variant="contained"
                                    >
                                        Submit
                                    </StyledButton>
                                </Stack>
                            </form>
                        ) : data.showCalendarDeleteForm ? (
                            <form onSubmit={handleDeleteFormSubmit}>
                                <Stack
                                    direction="column"
                                    spacing={2}
                                    style={{ paddingTop: "10px" }}
                                >
                                    <Controller
                                        name={"GOOGLECALENDAR_ID"}
                                        control={controlDelete}
                                        rules={{
                                            required:
                                                "Calendar Event ID is required",
                                        }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Calendar Event ID"
                                                value={field.value || ""}
                                                disabled
                                                fullWidth
                                            />
                                        )}
                                    />
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    paddingX={2}
                                    paddingBottom={2}
                                >
                                    <StyledButton
                                        type="button"
                                        onClick={() => {
                                            resetDelete();
                                            setData(
                                                "showCalendarDeleteForm",
                                                false as PathValue<
                                                    GoogleCalendarBlockDef["data"],
                                                    "showCalendarDeleteForm"
                                                >,
                                            );
                                        }}
                                    >
                                        Cancel
                                    </StyledButton>
                                    <StyledButton
                                        type="submit"
                                        variant="contained"
                                        color="error"
                                    >
                                        Delete
                                    </StyledButton>
                                </Stack>
                            </form>
                        ) : (
                            <>
                                {!loggedInUser && (
                                    <div>
                                        <Button
                                            variant="contained"
                                            startIcon={<Add />}
                                            onClick={() => {
                                                oauth("google");
                                            }}
                                            data-testid={
                                                "my-googlecalendar-profile-new-key-btn"
                                            }
                                        >
                                            Login google
                                        </Button>
                                    </div>
                                )}
                                {loggedInUser && (
                                    <>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: 16,
                                                marginBottom: 24,
                                                width: "100%",
                                            }}
                                        >
                                            <div>
                                                <span>Logged in as: </span>
                                                <strong>{loggedInUser}</strong>
                                            </div>
                                            <div style={{ marginBottom: 16 }}>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    style={{
                                                        fontWeight: "bold",
                                                        fontSize: "1rem",
                                                        padding: "10px 24px",
                                                    }}
                                                    onClick={() => {
                                                        setData(
                                                            "showCalendarCreateForm",
                                                            true as PathValue<
                                                                GoogleCalendarBlockDef["data"],
                                                                "showCalendarCreateForm"
                                                            >,
                                                        );
                                                        setData(
                                                            "showCreateForm",
                                                            false as PathValue<
                                                                GoogleCalendarBlockDef["data"],
                                                                "showCreateForm"
                                                            >,
                                                        );
                                                    }}
                                                >
                                                    Create new event
                                                </Button>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    gap: 24,
                                                    justifyContent: "center",
                                                    marginBottom: 24,
                                                }}
                                            >
                                                <DateTimePicker
                                                    label="Start date & time"
                                                    value={startDate}
                                                    onChange={(date) =>
                                                        setStartDate(date)
                                                    }
                                                    format="YYYY-MM-DD HH:mm"
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            style: {
                                                                minWidth: 200,
                                                                background:
                                                                    "#e3f2fd",
                                                                border: "2px solid #1976d2",
                                                                fontWeight:
                                                                    "bold",
                                                                color: "#1976d2",
                                                            },
                                                            InputLabelProps: {
                                                                style: {
                                                                    color: "#1976d2",
                                                                    fontWeight:
                                                                        "bold",
                                                                    marginBottom: 8,
                                                                },
                                                                shrink: true,
                                                            },
                                                        },
                                                    }}
                                                />
                                                <DateTimePicker
                                                    label="End date & time"
                                                    value={endDate}
                                                    onChange={(date) =>
                                                        setEndDate(date)
                                                    }
                                                    format="YYYY-MM-DD HH:mm"
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            style: {
                                                                minWidth: 200,
                                                                background:
                                                                    "#e3f2fd",
                                                                border: "2px solid #1976d2",
                                                                fontWeight:
                                                                    "bold",
                                                                color: "#1976d2",
                                                            },
                                                            InputLabelProps: {
                                                                style: {
                                                                    color: "#1976d2",
                                                                    fontWeight:
                                                                        "bold",
                                                                },
                                                                shrink: true,
                                                            },
                                                        },
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                border: "1px solid #888",
                                                borderRadius: 8,
                                                marginBottom: 16,
                                            }}
                                        >
                                            {calendarSummaryList &&
                                                calendarSummaryList.length >
                                                    0 &&
                                                calendarSummaryList.map(
                                                    (event: {
                                                        summary: string;
                                                        id: string;
                                                    }) => (
                                                        <div
                                                            key={event.id}
                                                            style={{
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                                borderBottom:
                                                                    "1px solid #444",
                                                                padding: 8,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        flex: 1,
                                                                        color: "#1976d2",
                                                                        textDecoration:
                                                                            "underline",
                                                                        cursor: "pointer",
                                                                        fontWeight:
                                                                            "bold",
                                                                    }}
                                                                    onClick={async () => {
                                                                        if (
                                                                            expandedEventId ===
                                                                            event.id
                                                                        ) {
                                                                            setExpandedEventId(
                                                                                null,
                                                                            );
                                                                            setExpandedEventDetails(
                                                                                null,
                                                                            );
                                                                            return;
                                                                        }
                                                                        setExpandedEventId(
                                                                            event.id,
                                                                        );
                                                                        // Fetch event details
                                                                        try {
                                                                            const response =
                                                                                await runPixel<
                                                                                    [
                                                                                        string,
                                                                                    ]
                                                                                >(
                                                                                    `META | GoogleCalendarReadEvent(id="${event.id}")`,
                                                                                );
                                                                            let outputRead: any =
                                                                                response
                                                                                    .pixelReturn[0]
                                                                                    .output;
                                                                            if (
                                                                                typeof outputRead ===
                                                                                "string"
                                                                            ) {
                                                                                try {
                                                                                    outputRead =
                                                                                        JSON.parse(
                                                                                            outputRead,
                                                                                        );
                                                                                } catch (e) {
                                                                                    outputRead =
                                                                                        {};
                                                                                }
                                                                            }
                                                                            if (
                                                                                typeof outputRead.video ===
                                                                                "boolean"
                                                                            ) {
                                                                                outputRead.audio =
                                                                                    outputRead.video;
                                                                            }
                                                                            setExpandedEventDetails(
                                                                                outputRead,
                                                                            );
                                                                        } catch (error) {
                                                                            setExpandedEventDetails(
                                                                                {
                                                                                    error: "Failed to fetch event details.",
                                                                                },
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {
                                                                        event.summary
                                                                    }
                                                                </span>
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap: 8,
                                                                    }}
                                                                >
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        onClick={async () => {
                                                                            setData(
                                                                                "showCalendarUpdateForm",
                                                                                true,
                                                                            );
                                                                            setData(
                                                                                "showCalendarReadForm",
                                                                                false,
                                                                            );
                                                                            setData(
                                                                                "showCalendarDeleteForm",
                                                                                false,
                                                                            );

                                                                            // Fetch event details by ID
                                                                            try {
                                                                                const response =
                                                                                    await runPixel<
                                                                                        [
                                                                                            string,
                                                                                        ]
                                                                                    >(
                                                                                        `META | GoogleCalendarReadEvent(id="${event.id}")`,
                                                                                    );
                                                                                let outputRead: any =
                                                                                    response
                                                                                        .pixelReturn[0]
                                                                                        .output;
                                                                                console.log(
                                                                                    "Fetched event details:",
                                                                                    outputRead,
                                                                                );
                                                                                if (
                                                                                    typeof outputRead ===
                                                                                    "string"
                                                                                ) {
                                                                                    try {
                                                                                        outputRead =
                                                                                            JSON.parse(
                                                                                                outputRead,
                                                                                            );
                                                                                    } catch (e) {
                                                                                        outputRead =
                                                                                            {};
                                                                                    }
                                                                                }
                                                                                // Set all update form fields with fetched details
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_ID",
                                                                                    event.id,
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_SUMMARY",
                                                                                    outputRead.summary ||
                                                                                        "",
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_LOCATION",
                                                                                    outputRead.location ||
                                                                                        "",
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_DESCRIPTION",
                                                                                    outputRead.description ||
                                                                                        "",
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_STARTDATE",
                                                                                    outputRead.starttime ||
                                                                                        "",
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_ENDDATE",
                                                                                    outputRead.endtime ||
                                                                                        "",
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_EMAIL",
                                                                                    Array.isArray(
                                                                                        outputRead.attendees,
                                                                                    )
                                                                                        ? outputRead.attendees
                                                                                              .map(
                                                                                                  (
                                                                                                      a,
                                                                                                  ) =>
                                                                                                      a.email,
                                                                                              )
                                                                                              .join(
                                                                                                  ", ",
                                                                                              )
                                                                                        : "",
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_VIDEO",
                                                                                    !!outputRead.video,
                                                                                );
                                                                            } catch (error) {
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_ID",
                                                                                    event.id,
                                                                                );
                                                                                setUpdateValue(
                                                                                    "GOOGLECALENDAR_SUMMARY",
                                                                                    event.summary,
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="outlined"
                                                                        color="error"
                                                                        size="small"
                                                                        onClick={() => {
                                                                            setData(
                                                                                "showCalendarDeleteForm",
                                                                                true,
                                                                            );
                                                                            setData(
                                                                                "showCalendarUpdateForm",
                                                                                false,
                                                                            );
                                                                            setData(
                                                                                "showCalendarReadForm",
                                                                                false,
                                                                            );
                                                                            setDeleteValue(
                                                                                "GOOGLECALENDAR_ID",
                                                                                event.id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            {expandedEventId ===
                                                                event.id &&
                                                                expandedEventDetails && (
                                                                    <div
                                                                        style={{
                                                                            background:
                                                                                "#f5f5f5",
                                                                            borderRadius: 4,
                                                                            padding: 12,
                                                                            marginTop: 8,
                                                                            width: "100%",
                                                                        }}
                                                                    >
                                                                        {Object.entries(
                                                                            expandedEventDetails,
                                                                        )
                                                                            .filter(
                                                                                ([
                                                                                    _,
                                                                                    value,
                                                                                ]) =>
                                                                                    value !==
                                                                                        undefined &&
                                                                                    value !==
                                                                                        null &&
                                                                                    value !==
                                                                                        "",
                                                                            )
                                                                            .map(
                                                                                ([
                                                                                    key,
                                                                                    value,
                                                                                ]) => (
                                                                                    <div
                                                                                        key={
                                                                                            key
                                                                                        }
                                                                                        style={{
                                                                                            marginBottom: 4,
                                                                                        }}
                                                                                    >
                                                                                        <strong>
                                                                                            {
                                                                                                key
                                                                                            }

                                                                                            :
                                                                                        </strong>{" "}
                                                                                        {Array.isArray(
                                                                                            value,
                                                                                        ) ? (
                                                                                            value.map(
                                                                                                (
                                                                                                    v,
                                                                                                    i,
                                                                                                ) => (
                                                                                                    <div
                                                                                                        key={
                                                                                                            i
                                                                                                        }
                                                                                                        style={{
                                                                                                            marginLeft: 12,
                                                                                                        }}
                                                                                                    >
                                                                                                        {typeof v ===
                                                                                                        "object"
                                                                                                            ? Object.entries(
                                                                                                                  v,
                                                                                                              )
                                                                                                                  .filter(
                                                                                                                      ([
                                                                                                                          k,
                                                                                                                          val,
                                                                                                                      ]) =>
                                                                                                                          k !==
                                                                                                                              "ResponseStatus" &&
                                                                                                                          val,
                                                                                                                  )
                                                                                                                  .map(
                                                                                                                      ([
                                                                                                                          k,
                                                                                                                          val,
                                                                                                                      ]) =>
                                                                                                                          k ===
                                                                                                                              "hangoutLink" ||
                                                                                                                          k ===
                                                                                                                              "htmlLink" ? (
                                                                                                                              <span
                                                                                                                                  key={
                                                                                                                                      k
                                                                                                                                  }
                                                                                                                              >
                                                                                                                                  <strong>
                                                                                                                                      {
                                                                                                                                          k
                                                                                                                                      }

                                                                                                                                      :
                                                                                                                                  </strong>{" "}
                                                                                                                                  <a
                                                                                                                                      href={String(
                                                                                                                                          val,
                                                                                                                                      )}
                                                                                                                                      target="_blank"
                                                                                                                                      rel="noopener noreferrer"
                                                                                                                                  >
                                                                                                                                      {String(
                                                                                                                                          val,
                                                                                                                                      )}
                                                                                                                                  </a>{" "}
                                                                                                                              </span>
                                                                                                                          ) : (
                                                                                                                              <span
                                                                                                                                  key={
                                                                                                                                      k
                                                                                                                                  }
                                                                                                                              >
                                                                                                                                  <strong>
                                                                                                                                      {
                                                                                                                                          k
                                                                                                                                      }

                                                                                                                                      :
                                                                                                                                  </strong>{" "}
                                                                                                                                  {String(
                                                                                                                                      val,
                                                                                                                                  )}{" "}
                                                                                                                              </span>
                                                                                                                          ),
                                                                                                                  )
                                                                                                            : String(
                                                                                                                  v,
                                                                                                              )}
                                                                                                    </div>
                                                                                                ),
                                                                                            )
                                                                                        ) : key ===
                                                                                              "hangoutLink" ||
                                                                                          key ===
                                                                                              "htmlLink" ? (
                                                                                            <a
                                                                                                href={String(
                                                                                                    value,
                                                                                                )}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                            >
                                                                                                {String(
                                                                                                    value,
                                                                                                )}
                                                                                            </a>
                                                                                        ) : (
                                                                                            String(
                                                                                                value,
                                                                                            )
                                                                                        )}
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    ),
                                                )}
                                        </div>
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
                                        >,
                                    );
                                    setCreatedCalendar(null);
                                    fetchCalendarOptionsCustom(
                                        startDate,
                                        endDate,
                                    );
                                }}
                            >
                                <StyledModalContent>
                                    <Typography variant="h6" align="center">
                                        Successfully created event
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Event ID:</strong>{" "}
                                        {createdCalendar.id || "N/A"}
                                    </Typography>
                                    {createdCalendar.video &&
                                        createdCalendar.Link && (
                                            <Typography variant="body1">
                                                <strong>
                                                    Google Meet Link:
                                                </strong>{" "}
                                                <a
                                                    href={createdCalendar.Link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {createdCalendar.Link}
                                                </a>
                                            </Typography>
                                        )}
                                    <Stack
                                        direction="row"
                                        justifyContent="center"
                                    >
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                setData(
                                                    "showCreateForm",
                                                    false as PathValue<
                                                        GoogleCalendarBlockDef["data"],
                                                        "showCreateForm"
                                                    >,
                                                );
                                                setCreatedCalendar(null);
                                                fetchCalendarOptionsCustom(
                                                    startDate,
                                                    endDate,
                                                );
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
                                        >,
                                    );
                                    setUpdatedCalendar(null);
                                    fetchCalendarOptionsCustom(
                                        startDate,
                                        endDate,
                                    );
                                }}
                            >
                                <StyledModalContent>
                                    <Typography variant="h6" align="center">
                                        Event Updated Successfully
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        justifyContent="center"
                                    >
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                setData(
                                                    "showUpdateForm",
                                                    false as PathValue<
                                                        GoogleCalendarBlockDef["data"],
                                                        "showUpdateForm"
                                                    >,
                                                );
                                                setUpdatedCalendar(null);
                                                fetchCalendarOptionsCustom(
                                                    startDate,
                                                    endDate,
                                                );
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
                                        >,
                                    );
                                    setDeletedCalendar(null);
                                    fetchCalendarOptionsCustom(
                                        startDate,
                                        endDate,
                                    );
                                }}
                            >
                                <StyledModalContent>
                                    <Typography variant="h6" align="center">
                                        Event Deleted Successfully:{" "}
                                        {deletedCalendar.summary}
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        justifyContent="center"
                                    >
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                setData(
                                                    "showDeleteForm",
                                                    false as PathValue<
                                                        GoogleCalendarBlockDef["data"],
                                                        "showDeleteForm"
                                                    >,
                                                );
                                                setDeletedCalendar(null);
                                                fetchCalendarOptionsCustom(
                                                    startDate,
                                                    endDate,
                                                );
                                            }}
                                        >
                                            Close
                                        </Button>
                                    </Stack>
                                </StyledModalContent>
                            </Modal>
                        )}

                        {showDeleteConfirm && (
                            <Modal
                                open={showDeleteConfirm}
                                onClose={() => setShowDeleteConfirm(false)}
                            >
                                <StyledModalContent>
                                    <Typography variant="body1">
                                        This action is irreversible. Are you
                                        sure you want to delete the event?
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        justifyContent="flex-end"
                                    >
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={async () => {
                                                if (pendingDeleteValues) {
                                                    await onDeleteSubmit(
                                                        pendingDeleteValues,
                                                    );
                                                }
                                            }}
                                        >
                                            Yes
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() =>
                                                setShowDeleteConfirm(false)
                                            }
                                        >
                                            Close
                                        </Button>
                                    </Stack>
                                </StyledModalContent>
                            </Modal>
                        )}
                    </div>
                ) : (
                    <p
                        style={{
                            ...data.style,
                            marginBlockStart: "0px",
                            marginBlockEnd: "0px",
                        }}
                    >
                        Google Calendar Block
                    </p>
                )}
            </div>
        </LocalizationProvider>
    );
});