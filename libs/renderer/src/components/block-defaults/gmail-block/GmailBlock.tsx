import { Tabs, Tab } from "@mui/material";
import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

import { Controller, useForm } from "react-hook-form";
import { runPixel, oauth, getUserDetails } from "@semoss/sdk/react";
import {
    Button,
    TextField,
    Modal,
    LinearProgress,
    Stack,
    useNotification,
    styled,
    Typography,
} from "@semoss/ui";
import { Add } from "@mui/icons-material";
import { PathValue } from "../../../types";

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    paddingTop: `${theme.spacing(1)}!important`,
}));

const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: "20px !important",
}));

type showGmailSendForm = {
    GMAIL_TO: string;
    GMAIL_TITLE: string;
    GMAIL_CONTENT: string;
};

type showGmailReadForm = {
    GMAIL_TITLE: string;
    GMAIL_CONTENT: string;
};

type showGmailDeleteForm = {
    GMAIL_TITLE: string;
    GMAIL_ID: string;
};

export interface GmailBlockDef extends BlockDef<"gmailtext"> {
    widget: "gmailtext";
    data: {
        style: CSSProperties;
        text: string;
        variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
        isStreaming: boolean;
        show: string;
        showGmailSendForm: boolean;
        showSendForm: boolean;
        showGmailReadForm: boolean;
        showReadForm: boolean;
        showGmailDeleteForm: boolean;
        showDeleteForm: boolean;
        listAllGmails: boolean;
        listedGmails: boolean;
        title: string;
        content: string;
        gmailConnectionValue: string;
        gmailActionValue: string;
        gmailTitleValue: string;
    };
    slots: never;
    listeners: never;
}
export const GmailBlock: BlockComponent = observer(({ id }) => {
    const { data, setData } = useBlock<GmailBlockDef>(id);
    const [sentMail, setSentMail] = useState<{
        title: string;
        content: string;
    } | null>(null);
    const [readMail, setReadMail] = useState<{
        id: string;
        title: string;
        from?: string;
        to?: string;
        subject?: string;
        sentDate?: string;
        content?: string;
    } | null>(null);
    const [readLoading, setReadLoading] = useState(false);
    const [deletedMail, setDeletedMail] = useState<{
        title: string;
        content: string;
    } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteValues, setPendingDeleteValues] =
        useState<showGmailDeleteForm | null>(null);
    type SentMail = {
        subject: string;
        id: string;
    };
    const [sentMails, setSentMails] = useState<SentMail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const notification = useNotification();
    const [loggedInUser, setLoggedInUser] = useState("");
    const [summary, setSummary] = useState<string>("");
    const [summarizedMails, setSummarizedMails] = useState<UnreadMail[]>([]);
    type UnreadMail = {
        pre_content: string;
        subject: string;
        from: string;
        id: string;
    };
    const [unreadMails, setUnreadMails] = useState<UnreadMail[]>([]);

    // Forms
    const {
        getValues: getSendValues,
        handleSubmit: handleSendSubmit,
        control: controlSend,
        reset: resetSend,
    } = useForm<showGmailSendForm>({
        defaultValues: {
            GMAIL_TO: "",
            GMAIL_TITLE: "",
            GMAIL_CONTENT: "",
        },
    });

    const {
        getValues: getReadValues,
        handleSubmit: handleReadSubmit,
        control: controlRead,
        reset: resetRead,
    } = useForm<showGmailReadForm>({
        defaultValues: {
            GMAIL_TITLE: "",
            GMAIL_CONTENT: "",
        },
    });

    const {
        getValues: getDeleteValues,
        handleSubmit: handleDeleteSubmit,
        control: controlDelete,
        reset: resetDelete,
        setValue: setDeleteValue,
    } = useForm<showGmailDeleteForm>({
        defaultValues: {
            GMAIL_TITLE: "",
            GMAIL_ID: "",
        },
    });

    const [tab, setTab] = useState<"summarize" | "unread" | "sent">(
        "summarize",
    );

    // Unread mail count state (committed value) and input state (string)
    const [unreadCount, setUnreadCount] = useState(5);
    const [unreadCountInput, setUnreadCountInput] = useState("5");
    // Sent mail count state (committed value) and input state (string)
    const [sentCount, setSentCount] = useState(5);
    const [sentCountInput, setSentCountInput] = useState("5");
    // Summarize mail count state (committed value) and input state (string)
    const [summarizeCount, setSummarizeCount] = useState(5);
    const [summarizeCountInput, setSummarizeCountInput] = useState("5");
    // When tab changes, fetch the appropriate mails
    useEffect(() => {
        if (!loggedInUser) return;
        if (tab === "unread") {
            getUnreadEmails(unreadCount);
            setUnreadCountInput(String(unreadCount));
        } else if (tab === "sent") {
            fetchSentMails(sentCount);
            setSentCountInput(String(sentCount));
        } else if (tab === "summarize") {
            setSummarizeCountInput(String(summarizeCount));
            summarizeTopK(summarizeCount);
        }
    }, [tab, loggedInUser]);

    // Refetch unread mails when unreadCount changes and tab is 'unread'
    useEffect(() => {
        if (tab === "unread") {
            getUnreadEmails(unreadCount);
        }
    }, [unreadCount]);

    // Refetch sent mails when sentCount changes and tab is 'sent'
    useEffect(() => {
        if (tab === "sent") {
            fetchSentMails(sentCount);
        }
    }, [sentCount]);

    // Refetch summarized mails when summarizeCount changes and tab is 'summarize'
    useEffect(() => {
        if (tab === "summarize") {
            summarizeTopK(summarizeCount);
        }
    }, [summarizeCount]);

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

    // Fetch sent mails using Pixel API
    const fetchSentMails = async (count = 5) => {
        try {
            const response = await runPixel(
                `GoogleGmailList(number=\"${count}\")`,
            );
            let mails: SentMail[] = [];
            if (
                response &&
                response.pixelReturn &&
                response.pixelReturn[0] &&
                response.pixelReturn[0].output
            ) {
                const output = response.pixelReturn[0].output;
                if (Array.isArray(output)) {
                    mails = output;
                } else if (
                    typeof output === "string" &&
                    output.trim().startsWith("[")
                ) {
                    try {
                        mails = JSON.parse(output);
                    } catch {
                        // ignore
                    }
                }
            }
            setSentMails(mails);
        } catch (error) {
            notification.add({
                color: "error",
                message: "Failed to fetch sent mails.",
            });
        }
    };

    // Send Mail
    const onSendSubmit = handleSendSubmit(
        async (sendData: showGmailSendForm) => {
            try {
                // Pixel call for sending email with user-provided recipient
                const response = await runPixel(
                    `GoogleSendGmail(toemail="${sendData.GMAIL_TO}", subject="${sendData.GMAIL_TITLE}", body="${sendData.GMAIL_CONTENT}")`,
                );
                let isError = false;
                let errorMsg = "";
                if (
                    response &&
                    response.pixelReturn &&
                    response.pixelReturn[0]
                ) {
                    const pixel = response.pixelReturn[0];
                    const output = pixel.output;
                    const opType = pixel.operationType;
                    if (
                        (Array.isArray(opType) && opType.includes("ERROR")) ||
                        (typeof output === "string" &&
                            (output.includes("Failed to send email") ||
                                output.includes("Invalid To header") ||
                                output.includes("400 Bad Request") ||
                                output.includes("INVALID_ARGUMENT")))
                    ) {
                        isError = true;
                        errorMsg =
                            typeof output === "string"
                                ? output
                                : "Failed to send mail.";
                    }
                }
                if (isError) {
                    notification.add({
                        color: "error",
                        message: errorMsg || "Failed to send mail.",
                    });
                } else {
                    setSentMail({
                        title: sendData.GMAIL_TITLE,
                        content: sendData.GMAIL_CONTENT,
                    });
                    resetSend();
                    setData(
                        "showGmailSendForm",
                        false as PathValue<
                            GmailBlockDef["data"],
                            "showGmailSendForm"
                        >,
                    );
                    setData(
                        "showSendForm",
                        true as PathValue<
                            GmailBlockDef["data"],
                            "showSendForm"
                        >,
                    );
                    notification.add({
                        color: "success",
                        message: "Mail sent successfully!",
                    });
                    // Refresh sent mails after sending
                    fetchSentMails(sentCount);
                    summarizeTopK(summarizeCount);
                }
            } catch (error) {
                notification.add({
                    color: "error",
                    message: "Failed to send mail.",
                });
            }
        },
    );

    // Read Mail
    // Accepts id and subject for unread, subject only for sent
    // Read Mail: always use id for Pixel call
    const onReadMail = (subject: string, id: string) => {
        setReadMail({ id, title: subject });
        setData(
            "showGmailReadForm",
            true as PathValue<GmailBlockDef["data"], "showGmailReadForm">,
        );
        setData(
            "showReadForm",
            false as PathValue<GmailBlockDef["data"], "showReadForm">,
        );
    };

    // Fetch mail details when read modal opens
    useEffect(() => {
        const fetchContent = async () => {
            if (data.showGmailReadForm && readMail && readMail.id) {
                setReadLoading(true);
                try {
                    const response = await runPixel(
                        `GoogleReadGmail(id="${readMail.id}")`,
                    );
                    let from = "";
                    let to = "";
                    let subject = "";
                    let sentDate = "";
                    let content = "";
                    if (
                        response &&
                        response.pixelReturn &&
                        response.pixelReturn[0] &&
                        response.pixelReturn[0].output
                    ) {
                        const output = response.pixelReturn[0].output as any;
                        // Handle both string and array/object for from/to
                        if (output.from) {
                            from = output.from;
                        }
                        if (output.to) {
                            to = output.to;
                        }
                        if (output.subject) {
                            subject = output.subject;
                        }
                        if (output.sentDate) {
                            sentDate = output.sentDate;
                        }
                        if (output.content) {
                            content = output.content;
                        }
                    }
                    setReadMail({
                        id: readMail.id,
                        title: readMail.title,
                        from,
                        to,
                        subject,
                        sentDate,
                        content,
                    });
                } catch (error) {
                    notification.add({
                        color: "error",
                        message: "Failed to read mail.",
                    });
                }
                setReadLoading(false);
            }
        };
        fetchContent();
        // Only run when modal opens or id changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.showGmailReadForm, readMail && readMail.id]);

    //Summarize TopK
    const summarizeTopK = async (k: number) => {
        try {
            const response = await runPixel(
                `GoogleSummarizeTopKEmails(number=\"${k}\")`,
            );
            let summaryText = "";
            let mails: UnreadMail[] = [];
            if (
                response &&
                response.pixelReturn &&
                response.pixelReturn[0] &&
                response.pixelReturn[0].output
            ) {
                const output = response.pixelReturn[0].output;
                if (typeof output === "string") {
                    // If output is a JSON array string, parse it
                    if (output.trim().startsWith("[")) {
                        try {
                            mails = JSON.parse(output);
                        } catch {
                            summaryText = output;
                        }
                    } else {
                        summaryText = output;
                    }
                } else if (Array.isArray(output)) {
                    mails = output;
                } else if (typeof output === "object" && output !== null) {
                    summaryText =
                        (output as any).summary ||
                        (output as any).Summary ||
                        JSON.stringify(output);
                }
            }
            setSummarizedMails(mails);
            setSummary(
                summaryText ||
                    (mails.length === 0 ? `No summary returned.` : ""),
            );
        } catch (error) {
            notification.add({
                color: "error",
                message: "Failed to fetch recieved mails.",
            });
        }
    };

    // Fetch unread mails
    const getUnreadEmails = async (count: number = 5) => {
        try {
            // Pixel call for getting unread emails
            const response = await runPixel(
                `GoogleGetUnreadEmails(number=\"${count}\")`,
            );
            let unreadList: UnreadMail[] = [];
            if (
                response &&
                response.pixelReturn &&
                response.pixelReturn[0] &&
                response.pixelReturn[0].output
            ) {
                // The output is expected to be an array of objects with pre_content, subject, from, id
                const output = response.pixelReturn[0].output;
                // Debug log for development
                console.log("Unread output:", output);
                if (Array.isArray(output)) {
                    unreadList = output;
                } else if (typeof output === "object" && output !== null) {
                    // If output is an object with numeric keys, convert to array
                    const arr = Object.values(output);
                    if (
                        arr.length &&
                        typeof arr[0] === "object" &&
                        arr[0].pre_content
                    ) {
                        unreadList = arr as UnreadMail[];
                    }
                }
            }
            setUnreadMails(unreadList);
        } catch (error) {
            notification.add({
                color: "error",
                message: "Failed to fetch unread emails.",
            });
        }
    };

    // Delete Mail
    const handleDeleteFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const values = getDeleteValues();
        if (!values.GMAIL_ID) {
            notification.add({
                color: "error",
                message: "Mail id is required.",
            });
            return;
        }
        setPendingDeleteValues(values);
        setShowDeleteConfirm(true);
    };

    const onDeleteSubmit = async (deleteValues?: showGmailDeleteForm) => {
        const values = deleteValues || getDeleteValues();
        const mailId = values.GMAIL_ID;
        if (!mailId) {
            notification.add({
                color: "error",
                message: "Mail id not found for deletion.",
            });
            return;
        }
        try {
            const response = await runPixel(
                `GoogleDeleteGmail(id=\"${mailId}\")`,
            );
            let status = false;
            if (
                response &&
                response.pixelReturn &&
                response.pixelReturn[0] &&
                response.pixelReturn[0].output
            ) {
                const output = response.pixelReturn[0].output;
                if (
                    typeof output === "object" &&
                    ((output as any).status || (output as any)["status: "])
                ) {
                    status =
                        (output as any).status === true ||
                        (output as any)["status: "] === true;
                }
            }
            if (status) {
                setDeletedMail({ title: values.GMAIL_TITLE, content: "" });
                setData(
                    "showGmailDeleteForm",
                    false as PathValue<
                        GmailBlockDef["data"],
                        "showGmailDeleteForm"
                    >,
                );
                setData(
                    "showDeleteForm",
                    true as PathValue<GmailBlockDef["data"], "showDeleteForm">,
                );
                resetDelete();
                notification.add({
                    color: "success",
                    message: "Mail deleted successfully!",
                });
                // Refresh the relevant mail list after delete
                if (tab === "unread") {
                    getUnreadEmails(unreadCount);
                } else if (tab === "sent") {
                    fetchSentMails(sentCount);
                } else if (tab === "summarize") {
                    summarizeTopK(summarizeCount);
                }
            } else {
                notification.add({
                    color: "error",
                    message: "Failed to delete mail.",
                });
            }
        } catch (error) {
            notification.add({
                color: "error",
                message: "Failed to delete mail.",
            });
        }
        setShowDeleteConfirm(false);
        setPendingDeleteValues(null);
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
                    message: "Google Login failed",
                });
            }
            // This will trigger the UI to show the doc list page
        } catch (error: any) {
            setIsLoading(false);
            notification.add({
                color: "error",
                message: "Failed to fetch Google user info",
            });
        }
    };

    return (
        <div data-block={id} style={{ position: "relative", ...data.style }}>
            {/* If not logged in, show login button only */}
            <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 20 }}>
                Gmail Block
            </div>
            {!loggedInUser && (
                <div>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? "Logging in..." : "Login with Google"}
                    </Button>
                </div>
            )}
            {loggedInUser && (
                <>
                    {/* You can add a "Logged in as" bar if you want */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            <span>Logged in as: </span>
                            <strong>{loggedInUser}</strong>
                        </div>
                    </div>
                    {/* Navigation Bar with Tabs left, Send Mail right */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                            justifyContent: "space-between",
                        }}
                    >
                        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                            <Tab label="All Mails" value="summarize" />
                            <Tab label="Unread Mails" value="unread" />
                            <Tab label="Sent Mails" value="sent" />
                        </Tabs>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => {
                                setData(
                                    "showGmailSendForm",
                                    true as PathValue<
                                        GmailBlockDef["data"],
                                        "showGmailSendForm"
                                    >,
                                );
                            }}
                            sx={{ marginLeft: 2 }}
                        >
                            Send Mail
                        </Button>
                    </div>
                    {/* Tab Content */}
                    {tab === "unread" && (
                        <div style={{ marginBottom: 16 }}>
                            {unreadMails.length === 0 ? (
                                <Typography variant="body2">
                                    No unread mails found.
                                </Typography>
                            ) : (
                                <ul
                                    style={{
                                        paddingLeft: 0,
                                        listStyle: "none",
                                    }}
                                >
                                    {unreadMails.map((mail) => (
                                        <li
                                            key={mail.id}
                                            style={{
                                                marginBottom: 12,
                                                borderBottom: "1px solid #eee",
                                                paddingBottom: 8,
                                                display: "flex",
                                                alignItems: "flex-start",
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    noWrap
                                                >
                                                    {mail.subject}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="textSecondary"
                                                    noWrap
                                                >
                                                    From: {mail.from}
                                                </Typography>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    marginLeft: 12,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() =>
                                                        onReadMail(
                                                            mail.subject,
                                                            mail.id,
                                                        )
                                                    }
                                                >
                                                    Read
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => {
                                                        setPendingDeleteValues({
                                                            GMAIL_TITLE:
                                                                mail.subject,
                                                            GMAIL_ID: mail.id,
                                                        });
                                                        setShowDeleteConfirm(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {/* Unread mail count input */}
                            <div
                                style={{
                                    marginTop: 8,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <Typography variant="caption">Show</Typography>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={unreadCountInput}
                                    onChange={(e) => {
                                        setUnreadCountInput(e.target.value);
                                    }}
                                    onBlur={() => {
                                        let val = parseInt(
                                            unreadCountInput,
                                            10,
                                        );
                                        if (isNaN(val) || val < 1) val = 1;
                                        setUnreadCount(val);
                                        setUnreadCountInput(String(val));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            let val = parseInt(
                                                unreadCountInput,
                                                10,
                                            );
                                            if (isNaN(val) || val < 1) val = 1;
                                            setUnreadCount(val);
                                            setUnreadCountInput(String(val));
                                        }
                                    }}
                                    style={{ width: 60 }}
                                    inputProps={{ min: 1 }}
                                />
                                <Typography variant="caption">
                                    unread mails
                                </Typography>
                            </div>
                        </div>
                    )}
                    {tab === "sent" && (
                        <div style={{ marginBottom: 16 }}>
                            {sentMails.length === 0 ? (
                                <Typography variant="body2">
                                    No sent mails found.
                                </Typography>
                            ) : (
                                <ul
                                    style={{
                                        paddingLeft: 0,
                                        listStyle: "none",
                                    }}
                                >
                                    {sentMails.map((mail) => (
                                        <li
                                            key={mail.id}
                                            style={{
                                                marginBottom: 12,
                                                borderBottom: "1px solid #eee",
                                                paddingBottom: 8,
                                                display: "flex",
                                                alignItems: "flex-start",
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    noWrap
                                                >
                                                    {mail.subject || (
                                                        <span
                                                            style={{
                                                                color: "#aaa",
                                                            }}
                                                        >
                                                            (No Subject)
                                                        </span>
                                                    )}
                                                </Typography>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    marginLeft: 12,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() =>
                                                        onReadMail(
                                                            mail.subject,
                                                            mail.id,
                                                        )
                                                    }
                                                >
                                                    Read
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => {
                                                        setPendingDeleteValues({
                                                            GMAIL_TITLE:
                                                                mail.subject,
                                                            GMAIL_ID: mail.id,
                                                        });
                                                        setShowDeleteConfirm(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {/* Sent mail count input */}
                            <div
                                style={{
                                    marginTop: 8,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <Typography variant="caption">Show</Typography>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={sentCountInput}
                                    onChange={(e) => {
                                        setSentCountInput(e.target.value);
                                    }}
                                    onBlur={() => {
                                        let val = parseInt(sentCountInput, 10);
                                        if (isNaN(val) || val < 1) val = 1;
                                        setSentCount(val);
                                        setSentCountInput(String(val));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            let val = parseInt(
                                                sentCountInput,
                                                10,
                                            );
                                            if (isNaN(val) || val < 1) val = 1;
                                            setSentCount(val);
                                            setSentCountInput(String(val));
                                        }
                                    }}
                                    style={{ width: 60 }}
                                    inputProps={{ min: 1 }}
                                />
                                <Typography variant="caption">
                                    sent mails
                                </Typography>
                            </div>
                        </div>
                    )}

                    {tab === "summarize" && (
                        <Stack spacing={2} sx={{ mb: 2 }}>
                            {summarizedMails.length > 0 ? (
                                <ul
                                    style={{
                                        paddingLeft: 0,
                                        listStyle: "none",
                                    }}
                                >
                                    {summarizedMails.map((mail) => (
                                        <li
                                            key={mail.id}
                                            style={{
                                                marginBottom: 12,
                                                borderBottom: "1px solid #eee",
                                                paddingBottom: 8,
                                                display: "flex",
                                                alignItems: "flex-start",
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    noWrap
                                                >
                                                    <strong>
                                                        {mail.subject}
                                                    </strong>
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="textSecondary"
                                                    noWrap
                                                >
                                                    From: {mail.from}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        whiteSpace: "normal",
                                                    }}
                                                >
                                                    {mail.pre_content}
                                                </Typography>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    marginLeft: 12,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() =>
                                                        onReadMail(
                                                            mail.subject,
                                                            mail.id,
                                                        )
                                                    }
                                                >
                                                    Read
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => {
                                                        setPendingDeleteValues({
                                                            GMAIL_TITLE:
                                                                mail.subject,
                                                            GMAIL_ID: mail.id,
                                                        });
                                                        setShowDeleteConfirm(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : summary ? (
                                <Typography variant="body1" sx={{ mt: 2 }}>
                                    {summary}
                                </Typography>
                            ) : (
                                <Typography variant="body2">
                                    No mails found.
                                </Typography>
                            )}
                            {/* Summarize K input moved below the list */}
                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                            >
                                <Typography variant="caption">Show</Typography>
                                <TextField
                                    type="number"
                                    size="small"
                                    label="Number of mails (K)"
                                    value={summarizeCountInput}
                                    onChange={(e) =>
                                        setSummarizeCountInput(e.target.value)
                                    }
                                    onBlur={() => {
                                        let val = parseInt(
                                            summarizeCountInput,
                                            10,
                                        );
                                        if (isNaN(val) || val < 1) val = 1;
                                        setSummarizeCount(val);
                                        setSummarizeCountInput(String(val));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            let val = parseInt(
                                                summarizeCountInput,
                                                10,
                                            );
                                            if (isNaN(val) || val < 1) val = 1;
                                            setSummarizeCount(val);
                                            setSummarizeCountInput(String(val));
                                        }
                                    }}
                                    sx={{ width: 80 }}
                                    inputProps={{ min: 1 }}
                                />
                                <Typography variant="caption">
                                    All mails
                                </Typography>
                            </Stack>
                        </Stack>
                    )}
                    {/* Send Mail Modal Overlay */}
                    <Modal
                        open={!!data.showGmailSendForm}
                        onClose={() => {
                            resetSend();
                            setData(
                                "showGmailSendForm",
                                false as PathValue<
                                    GmailBlockDef["data"],
                                    "showGmailSendForm"
                                >,
                            );
                        }}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <StyledModalContent
                            sx={{
                                minWidth: "37rem",
                                maxWidth: "80rem",
                                width: "100%",
                            }}
                        >
                            <form onSubmit={onSendSubmit}>
                                <Stack
                                    direction="column"
                                    spacing={2}
                                    style={{ paddingTop: "10px" }}
                                >
                                    <Controller
                                        name={"GMAIL_TO"}
                                        control={controlSend}
                                        rules={{
                                            required:
                                                "Recipient email is required",
                                        }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="To"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                error={!!fieldState.error}
                                                fullWidth
                                            />
                                        )}
                                    />
                                    <Controller
                                        name={"GMAIL_TITLE"}
                                        control={controlSend}
                                        rules={{
                                            required:
                                                "Mail Subject is required",
                                        }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Subject"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                error={!!fieldState.error}
                                                fullWidth
                                            />
                                        )}
                                    />
                                    <Controller
                                        name={"GMAIL_CONTENT"}
                                        control={controlSend}
                                        rules={{
                                            required:
                                                "Mail Content is required",
                                        }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Content"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                error={!!fieldState.error}
                                                fullWidth
                                                multiline
                                                minRows={4}
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
                                            resetSend();
                                            setData(
                                                "showGmailSendForm",
                                                false as PathValue<
                                                    GmailBlockDef["data"],
                                                    "showGmailSendForm"
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
                                        Send
                                    </StyledButton>
                                </Stack>
                            </form>
                        </StyledModalContent>
                    </Modal>
                    {data.showGmailReadForm && readMail && (
                        <Modal
                            open={true}
                            onClose={() => {
                                setData(
                                    "showGmailReadForm",
                                    false as PathValue<
                                        GmailBlockDef["data"],
                                        "showGmailReadForm"
                                    >,
                                );
                                setReadMail(null);
                            }}
                        >
                            <StyledModalContent>
                                <Typography variant="h6" align="center">
                                    Email Details
                                </Typography>
                                {readLoading ? (
                                    <LinearProgress sx={{ my: 2 }} />
                                ) : (
                                    <>
                                        <Typography variant="subtitle1">
                                            <strong>
                                                Subject:{" "}
                                                {readMail.subject ||
                                                    readMail.title}
                                            </strong>
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                mt: 2,
                                                maxWidth: "40rem",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            <strong>Content :</strong>
                                            <br />
                                            {readMail.content}
                                        </Typography>
                                        <Typography variant="body2">
                                            From: {readMail.from}
                                        </Typography>
                                        <Typography variant="body2">
                                            To: {readMail.to}
                                        </Typography>
                                        <Typography variant="body2">
                                            Sent: {readMail.sentDate}
                                        </Typography>
                                    </>
                                )}
                                <Stack direction="row" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setData(
                                                "showGmailReadForm",
                                                false as PathValue<
                                                    GmailBlockDef["data"],
                                                    "showGmailReadForm"
                                                >,
                                            );
                                            setReadMail(null);
                                        }}
                                    >
                                        Close
                                    </Button>
                                </Stack>
                            </StyledModalContent>
                        </Modal>
                    )}
                    {data.showDeleteForm && deletedMail && (
                        <Modal
                            open={true}
                            onClose={() => {
                                setData(
                                    "showDeleteForm",
                                    false as PathValue<
                                        GmailBlockDef["data"],
                                        "showDeleteForm"
                                    >,
                                );
                                setDeletedMail(null);
                            }}
                        >
                            <StyledModalContent>
                                <Typography variant="h6" align="center">
                                    Mail Deleted Successfully:{" "}
                                    {deletedMail.title}
                                </Typography>
                                <Stack direction="row" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setData(
                                                "showDeleteForm",
                                                false as PathValue<
                                                    GmailBlockDef["data"],
                                                    "showDeleteForm"
                                                >,
                                            );
                                            setDeletedMail(null);
                                        }}
                                    >
                                        Close
                                    </Button>
                                </Stack>
                            </StyledModalContent>
                        </Modal>
                    )}

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <Modal
                            open={showDeleteConfirm}
                            onClose={() => setShowDeleteConfirm(false)}
                        >
                            <StyledModalContent>
                                <Typography variant="body1">
                                    This action is irreversible. Are you sure
                                    you want to delete this mail?
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
                </>
            )}
        </div>
    );
});
