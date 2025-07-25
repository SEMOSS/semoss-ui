import React, { CSSProperties, useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useBlock, useTypeWriter, useBlocks } from "../../../hooks";
import {
    BlockDef,
    BlockComponent,
    ActionMessages,
    Block,
} from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";
import { Controller, useForm } from "react-hook-form";
import { oauth, runPixel } from "@semoss/sdk/react";
import {
    Button,
    TextField,
    Modal,
    Stack,
    useNotification,
    styled,
    Typography,
} from "@semoss/ui";
import { Paths, PathValue } from "../../../types";

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    paddingTop: `${theme.spacing(1)}!important`,
}));

const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: "20px !important",
}));

type showDocsCreateForm = {
    GOOGLEDOCS_TITLE: string;
    GOOGLEDOCS_CONTENT: string;
};

type showDocsUpdateForm = {
    GOOGLEDOCS_TITLE: string;
    GOOGLEDOCS_CONTENT: string;
};

type showDocsDeleteForm = {
    GOOGLEDOCS_TITLE: string;
    GOOGLEDOCS_ID?: string;
};

export interface GoogleDocsBlockDef extends BlockDef<"googledocstext"> {
    widget: "googledocstext";
    data: {
        style: CSSProperties;
        text: string;
        variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
        isStreaming: boolean;
        show: string;
        showDocsCreateForm: boolean;
        showCreateForm: boolean;
        showDocsUpdateForm: boolean;
        showUpdateForm: boolean;
        showDocsDeleteForm: boolean;
        showDeleteForm: boolean;
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

    return {
        data: block.data || {},
        listeners: block.listeners || {},
        setData: setData,
    };
};

export const GoogleDocsBlock: BlockComponent = observer(({ id }) => {
    const block = useBlock<GoogleDocsBlockDef>(id);
    const state = useBlocks();
    const { data } = block;
    const { setData } = useBlockSettings(id);
    const [createdDoc, setCreatedDoc] = useState<{
        title: string;
        content: string;
        docid?: string;
    } | null>(null);
    const [updatedDoc, setUpdatedDoc] = useState<{
        title: string;
        content: string;
    } | null>(null);
    const [deletedDoc, setDeletedDoc] = useState<{
        title: string;
        content: string;
    } | null>(null);
    const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteValues, setPendingDeleteValues] =
        useState<showDocsDeleteForm | null>(null);
    const [docTitleList, setDocTitleList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const notification = useNotification();
    const [loggedInUser, setLoggedInUser] = useState("");
    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

    useEffect(() => {
        // Check if user is already logged in
        (async () => {
            try {
                const response = await oauth("google");
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
            } catch (error) {
                notification.add({
                    color: "error",
                    message: "Failed to fetch Google user info",
                });
            }
        })();
    }, []);

    useEffect(() => {
        if (loggedInUser) {
            getGoogleDocs();
        }
    }, [loggedInUser]);

    useEffect(() => {
        getGoogleDocs();
    }, [data.showDocsUpdateForm, data.showDocsDeleteForm]);

    if (!data.isStreaming) displayTxt = textContent;
    const {
        handleSubmit: handleCreateSubmit,
        control: controlCreate,
        reset: resetCreate,
    } = useForm<showDocsCreateForm>({
        defaultValues: {
            GOOGLEDOCS_TITLE: "",
            GOOGLEDOCS_CONTENT: "",
        },
    });

    const {
        handleSubmit: handleUpdateSubmit,
        control: controlUpdate,
        reset: resetUpdate,
        setValue: setUpdateValue,
    } = useForm<showDocsUpdateForm>({
        defaultValues: {
            GOOGLEDOCS_TITLE: "",
            GOOGLEDOCS_CONTENT: "",
        },
    });

    const {
        getValues: getDeleteValues,
        control: controlDelete,
        reset: resetDelete,
        setValue: setDeleteValue,
    } = useForm<showDocsDeleteForm>({
        defaultValues: {
            GOOGLEDOCS_TITLE: "",
        },
    });

    const getGoogleDocs = async () => {
        try {
            const response = await runPixel<[string]>(
                `META | GoogleDocsList();`,
            );
            let output: any = response.pixelReturn[0].output;
            if (typeof output === "string") {
                try {
                    output = JSON.parse(output);
                } catch {
                    output = null;
                }
            }
            if (
                output &&
                typeof output === "object" &&
                Array.isArray(output.DocIdList)
            ) {
                setDocTitleList(
                    output.DocIdList.map(([title, id]: [string, string]) => ({
                        title,
                        id,
                    })),
                );
            } else {
                setDocTitleList([]);
            }
        } catch (error) {
            console.error("Error fetching doc titles:", error);
            setDocTitleList([]);
        }
    };

    const updateContent = async (docId: string, docTitle: string) => {
        try {
            const response = await runPixel<[string]>(
                `META | GoogleDocsRead(id="${docId}");`,
            );
            let outputRead: any = response.pixelReturn[0].output;
            if (typeof outputRead === "string") {
                try {
                    outputRead = JSON.parse(outputRead);
                } catch {
                    outputRead = null;
                }
            }
            if (
                outputRead &&
                typeof outputRead === "object" &&
                "content" in outputRead
            ) {
                setUpdateValue(
                    "GOOGLEDOCS_TITLE",
                    outputRead.title || docTitle,
                );
                setUpdateValue("GOOGLEDOCS_CONTENT", outputRead.content || "");
            } else {
                throw new Error("Read failed");
            }
        } catch (error) {
            console.error("Error reading Google Docs:", error);
        }
    };

    const onCreateSubmit = handleCreateSubmit(
        async (createData: showDocsCreateForm) => {
            try {
                const response = await runPixel<[string]>(
                    `META | GoogleDocsCreate(promptTitle="${createData.GOOGLEDOCS_TITLE}", content="${createData.GOOGLEDOCS_CONTENT}");`,
                );
                let output: any = response.pixelReturn[0].output;
                if (typeof output === "string") {
                    try {
                        output = JSON.parse(output);
                    } catch {
                        output = null;
                    }
                }
                if (
                    output &&
                    typeof output === "object" &&
                    output.success === true
                ) {
                    setData(
                        "showDocsCreateForm",
                        false as PathValue<
                            GoogleDocsBlockDef["data"],
                            "showDocsCreateForm"
                        >,
                    );
                    setData(
                        "showCreateForm",
                        true as PathValue<
                            GoogleDocsBlockDef["data"],
                            "showCreateForm"
                        >,
                    );
                    resetCreate();
                    getGoogleDocs();
                } else {
                    const errorMsg =
                        output &&
                            typeof output === "object" &&
                            "message" in output
                            ? output.message
                            : "Create failed";
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error("Error Creating Doc:", error);
            }
        },
    );

    const onUpdateSubmit = handleUpdateSubmit(
        async (updatedata: showDocsUpdateForm) => {
            try {
                const docId = docTitleList.find(
                    (doc: { title: string; id: string }) =>
                        doc.title === updatedata.GOOGLEDOCS_TITLE,
                )?.id;
                if (!docId) {
                    alert("Document ID not found.");
                    return;
                }
                const response = await runPixel<[string]>(
                    `META | GoogleDocsUpdate(id="${docId}", content="${updatedata.GOOGLEDOCS_CONTENT}");`,
                );
                let output: any = response.pixelReturn[0].output;
                if (typeof output === "string") {
                    try {
                        output = JSON.parse(output);
                    } catch {
                        output = null;
                    }
                }
                if (
                    output &&
                    typeof output === "object" &&
                    output.status === true
                ) {
                    setData("showDocsUpdateForm", false);
                    setData("showUpdateForm", true);
                    resetUpdate();
                    getGoogleDocs();
                } else {
                    throw new Error("Update failed");
                }
            } catch (error) {
                console.error("Error updating Google Docs:", error);
            }
        },
    );

    const handleDeleteFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const values = getDeleteValues();
        if (!values.GOOGLEDOCS_TITLE) {
            alert("Google Docs Title is required.");
            return;
        }
        setPendingDeleteValues(values);
        setShowDeleteConfirm(true);
    };

    const onDeleteSubmit = async (deleteValues?: showDocsDeleteForm) => {
        const values = deleteValues || getDeleteValues();
        if (!values.GOOGLEDOCS_ID) {
            alert("Google Docs ID is required.");
            return;
        }
        try {
            const response = await runPixel<[string]>(
                `META | GoogleDocsDelete(id="${values.GOOGLEDOCS_ID}");`,
            );
            let output: any = response.pixelReturn[0].output;
            if (typeof output === "string") {
                try {
                    output = JSON.parse(output);
                } catch {
                    output = null;
                }
            }
            if (
                output &&
                typeof output === "object" &&
                output.status === true
            ) {
                setData(
                    "showDocsDeleteForm",
                    false as PathValue<
                        GoogleDocsBlockDef["data"],
                        "showDocsDeleteForm"
                    >,
                );
                setData(
                    "showDeleteForm",
                    true as PathValue<
                        GoogleDocsBlockDef["data"],
                        "showDeleteForm"
                    >,
                );
                setDeleteMessage("document deleted successfully");
                resetDelete();
                getGoogleDocs();
            } else {
                setDeleteMessage("Delete failed!");
                throw new Error("Delete failed!");
            }
        } catch (error) {
            console.error("Error deleting Google Docs:", error);
            setDeleteMessage("Delete failed!");
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

    return (
        <div data-block={id} style={{ position: "relative", ...data.style }}>
            {showBlock(block, state) ? (
                <div
                    style={{
                        ...data.style,
                        marginBlockStart: "0px",
                        marginBlockEnd: "0px",
                    }}
                >
                    {displayTxt}

                    {data.showDocsCreateForm ? (
                        <form onSubmit={onCreateSubmit}>
                            <Stack
                                direction="column"
                                spacing={2}
                                style={{ paddingTop: "10px" }}
                            >
                                <Controller
                                    name={"GOOGLEDOCS_TITLE"}
                                    control={controlCreate}
                                    rules={{
                                        required:
                                            "Google Docs Title is required",
                                    }}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            label="Google Docs Title"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            error={!!fieldState.error}
                                            fullWidth
                                        />
                                    )}
                                />
                                <Controller
                                    name={"GOOGLEDOCS_CONTENT"}
                                    control={controlCreate}
                                    rules={{
                                        required:
                                            "Google Docs Content is required",
                                    }}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            label="Google Docs Content"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            error={!!fieldState.error}
                                            helperText={
                                                fieldState.error?.message
                                            }
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
                                        resetCreate();
                                        setData(
                                            "showDocsCreateForm",
                                            false as PathValue<
                                                GoogleDocsBlockDef["data"],
                                                "showDocsCreateForm"
                                            >,
                                        );
                                    }}
                                >
                                    Cancel
                                </StyledButton>
                                <StyledButton type="submit" variant="contained">
                                    Submit
                                </StyledButton>
                            </Stack>
                        </form>
                    ) : data.showDocsUpdateForm ? (
                        <form onSubmit={onUpdateSubmit}>
                            <Stack
                                direction="column"
                                spacing={2}
                                style={{ paddingTop: "10px" }}
                            >
                                <Controller
                                    name={"GOOGLEDOCS_TITLE"}
                                    control={controlUpdate}
                                    rules={{
                                        required:
                                            "Google Docs Title is required",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            label="Google Docs Title"
                                            value={field.value || ""}
                                            disabled
                                            fullWidth
                                        />
                                    )}
                                />
                                <Controller
                                    name={"GOOGLEDOCS_CONTENT"}
                                    control={controlUpdate}
                                    rules={{
                                        required:
                                            "Google Docs Content is required",
                                    }}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            label="Google Docs Content"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            error={!!fieldState.error}
                                            helperText={
                                                fieldState.error?.message
                                            }
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
                                        resetUpdate();
                                        setData("showDocsUpdateForm", false);
                                    }}
                                >
                                    Cancel
                                </StyledButton>
                                <StyledButton type="submit" variant="contained">
                                    Submit
                                </StyledButton>
                            </Stack>
                        </form>
                    ) : data.showDocsDeleteForm ? (
                        <form onSubmit={handleDeleteFormSubmit}>
                            <Stack
                                direction="column"
                                spacing={2}
                                style={{ paddingTop: "10px" }}
                            >
                                <Controller
                                    name={"GOOGLEDOCS_TITLE"}
                                    control={controlDelete}
                                    rules={{
                                        required:
                                            "Google Docs Title is required",
                                    }}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            label="Google Docs Title"
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
                                            "showDocsDeleteForm",
                                            false as PathValue<
                                                GoogleDocsBlockDef["data"],
                                                "showDocsDeleteForm"
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
                                        onClick={handleGoogleLogin}
                                    >
                                        Login with Google
                                    </Button>
                                </div>
                            )}
                            {loggedInUser && (
                                <>
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
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => {
                                                setData(
                                                    "showDocsCreateForm",
                                                    true as PathValue<
                                                        GoogleDocsBlockDef["data"],
                                                        "showDocsCreateForm"
                                                    >,
                                                );
                                                setData(
                                                    "showCreateForm",
                                                    false as PathValue<
                                                        GoogleDocsBlockDef["data"],
                                                        "showCreateForm"
                                                    >,
                                                );
                                            }}
                                        >
                                            Create
                                        </Button>
                                    </div>
                                    <div
                                        style={{
                                            border: "1px solid #888",
                                            borderRadius: 8,
                                            marginBottom: 16,
                                        }}
                                    >
                                        {docTitleList &&
                                            docTitleList.length > 0 &&
                                            docTitleList.map(
                                                (doc: {
                                                    title: string;
                                                    id: string;
                                                }) => (
                                                    <div
                                                        key={doc.id}
                                                        style={{
                                                            display: "flex",
                                                            borderBottom:
                                                                "1px solid #444",
                                                            alignItems:
                                                                "center",
                                                            padding: 8,
                                                        }}
                                                    >
                                                        <div
                                                            style={{ flex: 1 }}
                                                        >
                                                            {doc.title}
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => {
                                                                    setData(
                                                                        "showDocsUpdateForm",
                                                                        true,
                                                                    );
                                                                    setData(
                                                                        "showDocsReadForm",
                                                                        false,
                                                                    );
                                                                    setData(
                                                                        "showDocsDeleteForm",
                                                                        false,
                                                                    );
                                                                    updateContent(
                                                                        doc.id,
                                                                        doc.title,
                                                                    );
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
                                                                        "showDocsDeleteForm",
                                                                        true,
                                                                    );
                                                                    setData(
                                                                        "showDocsUpdateForm",
                                                                        false,
                                                                    );
                                                                    setData(
                                                                        "showDocsReadForm",
                                                                        false,
                                                                    );
                                                                    setDeleteValue(
                                                                        "GOOGLEDOCS_TITLE",
                                                                        doc.title,
                                                                    );
                                                                    setDeleteValue(
                                                                        "GOOGLEDOCS_ID",
                                                                        doc.id,
                                                                    );
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    {data.showCreateForm && createdDoc && (
                        <Modal
                            open={true}
                            onClose={() => {
                                setData(
                                    "showCreateForm",
                                    false as PathValue<
                                        GoogleDocsBlockDef["data"],
                                        "showCreateForm"
                                    >,
                                );
                                setCreatedDoc(null);
                                getGoogleDocs();
                            }}
                        >
                            <StyledModalContent>
                                <Typography variant="h6" align="center">
                                    Document Created Successfully:{" "}
                                    {createdDoc.title}
                                </Typography>
                                <Stack direction="row" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setData(
                                                "showCreateForm",
                                                false as PathValue<
                                                    GoogleDocsBlockDef["data"],
                                                    "showCreateForm"
                                                >,
                                            );
                                            setCreatedDoc(null);
                                            getGoogleDocs();
                                        }}
                                    >
                                        Close
                                    </Button>
                                </Stack>
                            </StyledModalContent>
                        </Modal>
                    )}
                    {data.showUpdateForm && updatedDoc && (
                        <Modal
                            open={true}
                            onClose={() => {
                                setData("showUpdateForm", false);
                                setUpdatedDoc(null);
                                getGoogleDocs();
                            }}
                        >
                            <StyledModalContent>
                                <Typography variant="h6" align="center">
                                    Document Updated Successfully!
                                </Typography>
                                <Stack direction="row" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setData("showUpdateForm", false);
                                            setUpdatedDoc(null);
                                            getGoogleDocs();
                                        }}
                                    >
                                        Close
                                    </Button>
                                </Stack>
                            </StyledModalContent>
                        </Modal>
                    )}
                    {data.showDeleteForm && deletedDoc && (
                        <Modal
                            open={true}
                            onClose={() => {
                                setData(
                                    "showDeleteForm",
                                    false as PathValue<
                                        GoogleDocsBlockDef["data"],
                                        "showDeleteForm"
                                    >,
                                );
                                setDeletedDoc(null);
                                getGoogleDocs();
                            }}
                        >
                            <StyledModalContent>
                                <Typography variant="h6" align="center">
                                    Document Deleted Successfully:{" "}
                                    {deletedDoc.title}
                                </Typography>
                                <Stack direction="row" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setData(
                                                "showDeleteForm",
                                                false as PathValue<
                                                    GoogleDocsBlockDef["data"],
                                                    "showDeleteForm"
                                                >,
                                            );
                                            setDeletedDoc(null);
                                            getGoogleDocs();
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
                                    This action is irreversible. Are you sure
                                    you want to delete the document?
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
                    Google Docs Block
                </p>
            )}
        </div>
    );
});
