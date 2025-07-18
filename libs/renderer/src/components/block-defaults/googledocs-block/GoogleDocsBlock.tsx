import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
    useBlock,
    useTypeWriter,
    useBlocks,
} from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions, ActionMessages, Block } from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";

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
import { useRootStore } from '@semoss/ui/hooks';
import { Add } from '@mui/icons-material';
import { Paths, PathValue } from "../../../types";
import { useCallback } from "react";

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

type showDocsReadForm = {
    GOOGLEDOCS_TITLE: string;
    GOOGLEDOCS_CONTENT: string;
};

type showDocsUpdateForm = {
    GOOGLEDOCS_TITLE: string;
    GOOGLEDOCS_CONTENT: string;
};

type showDocsDeleteForm = {
    GOOGLEDOCS_TITLE: string;
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
        showDocsReadForm: boolean;
        showReadForm: boolean;
        showDocsDeleteForm: boolean;
        showDeleteForm: boolean;
        listAllDocs: boolean;
        listedDocs: boolean;
        title: string;
        content: string;
        googledocsConnectionValue: string;
        googledocsActionValue: string;
        docsTitleValue: string;
    
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
        type?: "sync" | "async"
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
            type: "sync" | "async"
        ): void => {
            state.dispatch({
                message: ActionMessages.SET_LISTENER,
                payload: {
                    id: id,
                    listener: listener as string,
                    actions: actions,
                    type: type
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

export const GoogleDocsBlock: BlockComponent = observer(({ id }) => {
    // const { attrs, data } = useBlock<TextBlockDef>(id);
    const block = useBlock<GoogleDocsBlockDef>(id);
    const state = useBlocks();
    const { data } = block;
    const { setData } = useBlockSettings(id);
    const [isDelete, setIsDelete] = useState(false);
    const [createdDoc, setCreatedDoc] = useState<{ title: string; content: string } | null>(null);
    const [readDoc, setReadDoc] = useState<{ title: string; content: string } | null>(null);
    const [updatedDoc, setUpdatedDoc] = useState<{ title: string; content: string } | null>(null);
    const [deletedDoc, setDeletedDoc] = useState<{ title: string; content: string } | null>(null);
    const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [pendingDeleteValues, setPendingDeleteValues] = useState<showDocsDeleteForm | null>(null);
const [docTitleList,setDocTitleList]=useState([]);
const [readContent, setReadContent] = useState('');
 const { monolithStore,configStore } = useRootStore();
  const [isLoading, setIsLoading] = useState(false);
             const notification = useNotification();
console.log('loggedInUser', configStore.store.config.loginDetails);
            const [loggedInUser,setLoggedInUser]= useState('');


    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");


    useEffect(() => {
    if (data.showDocsUpdateForm) {
        setReadDoc(null);
    }
}, [data.showDocsUpdateForm]);

 useEffect(() => {
        console.log('loggedInUserfirst', configStore.store.config);
        (async () => {
            await configStore.initialize();
        })();
    },[configStore]);

    useEffect(() => {
       
        if(loggedInUser){
            fetchDocsOptions();
        }
    },[loggedInUser]);


useEffect(() => {
    fetchDocsOptions();
}, [data.showDocsUpdateForm, data.showDocsDeleteForm]);

    if (!data.isStreaming) displayTxt = textContent;
    const {
        getValues: getCreateValues,
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
        getValues: getUpdateValues,
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
        getValues: getReadValues,
        handleSubmit: handleReadSubmit,
        control: controlRead,
        reset: resetRead,
    } = useForm<showDocsReadForm>({
        defaultValues: {
            GOOGLEDOCS_TITLE: "",
            GOOGLEDOCS_CONTENT: "",
        },
    });

    const {
        getValues: getDeleteValues,
        handleSubmit: handleDeleteSubmit,
        control: controlDelete,
        reset: resetDelete,
        setValue: setDeleteValue,
    } = useForm<showDocsDeleteForm>({
        defaultValues: {
            GOOGLEDOCS_TITLE: "",
        },
    });

    const fetchDocsOptions = async () => {
    try {
        const response = await runPixel<[string]>(
            `META | GoogleDocsList();`
        );
        const output = response.pixelReturn[0].output;
        const type = response.pixelReturn[0].operationType;
        if (type.indexOf('ERROR') === -1) {
            setDocTitleList(output['DocTitleList'] || []);
        } else {
            throw new Error(output);
        }
    } catch (error) {
        console.error("Error fetching doc titles:", error);
    }
};

    const updateContent = async (newValue) => {
        try {
            const updateValues = getUpdateValues();
                const response = await runPixel<[string]>(
                    `META | GoogleDocsRead(promptTitle="${newValue}");`,
                );
                const outputRead = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf("ERROR") === -1) {
                    setData(
                        "showDocsReadForm",
                        false as PathValue<
                            GoogleDocsBlockDef["data"],
                            "showDocsReadForm"
                        >,
                    );
                    setData(
                        "showReadForm",
                        true as PathValue<
                            GoogleDocsBlockDef["data"],
                            "showReadForm"
                        >,
                    );
                    setReadContent(outputRead || "");
                    resetRead();
                } else {
                    throw new Error(response.errors[0]);
                }
            } catch (error) {
                console.error("Error reading Google Docs:", error);
            } 
    }

    const onCreateSubmit = handleCreateSubmit(
        async (createData: showDocsCreateForm) => {
            const createValues = getCreateValues();
            try {
                const response = await runPixel<[string]>(
                `META | GoogleDocsCreate(promptTitle="${createValues.GOOGLEDOCS_TITLE}", content="${createValues.GOOGLEDOCS_CONTENT}");`,
                );
                const outputCreate = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf("ERROR") === -1) {
                    
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
                    setCreatedDoc({
                        title: createValues.GOOGLEDOCS_TITLE,
                        content: createValues.GOOGLEDOCS_CONTENT,
                    });
                    resetCreate();
                } else {
                    throw new Error(response.errors[0]);
                }
            } catch (error) {
                console.error("Error Creating Doc:", error);
            }
        },
    );

    const onUpdateSubmit = handleUpdateSubmit(
        async (updatedata: showDocsUpdateForm) => {
            console.log("onUpdateSubmit called", updatedata);
            const updateValues = getUpdateValues();
            try {
                const response = await runPixel<[string]>(
                    `META | GoogleDocsUpdate(promptTitle="${updateValues.GOOGLEDOCS_TITLE}",content="${updateValues.GOOGLEDOCS_CONTENT}");`,
                );
                const outputUpdate = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
               if (type.indexOf("ERROR") === -1) {
                let updatedContent = updateValues.GOOGLEDOCS_CONTENT;
if (typeof outputUpdate === "string") {
    const parts = outputUpdate.split(",");
    if (parts.length > 1) {
        updatedContent = parts.slice(1).join(",");
    } else {
        updatedContent = outputUpdate;
    }
} else if (outputUpdate !== undefined && outputUpdate !== null) {
    updatedContent = String(outputUpdate);
}
                setUpdatedDoc({
                    title: updateValues.GOOGLEDOCS_TITLE,
                    content: updatedContent,
                });
                setData(
                    "showDocsUpdateForm",
                    false as PathValue<
                        GoogleDocsBlockDef["data"],
                        "showDocsUpdateForm"
                    >,
                );
                setData(
                    "showUpdateForm",
                    true as PathValue<
                        GoogleDocsBlockDef["data"],
                        "showUpdateForm"
                    >
                );
                setReadContent('');
                resetUpdate();
            } else {
                throw new Error(response.errors[0]);
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
    if (!values.GOOGLEDOCS_TITLE) {
        alert("Google Docs Title is required.");
        return;
    }
    try {
        const response = await runPixel<[string]>(
          `META | GoogleDocsDelete(promptTitle="${values.GOOGLEDOCS_TITLE}");`
        );
        const outputDelete = response.pixelReturn[0].output;
        const type = response.pixelReturn[0].operationType;
        if (type.indexOf('ERROR') === -1) {
            setData("showDocsDeleteForm", false as PathValue<GoogleDocsBlockDef["data"], "showDocsDeleteForm">);
            setData("showDeleteForm", true as PathValue<GoogleDocsBlockDef["data"], "showDeleteForm">);
          
    setDeleteMessage("document deleted successfully");

            setDeletedDoc({
                title: values.GOOGLEDOCS_TITLE,
                content: "",
            });
            resetDelete();
            setIsDelete(false);
        } else {
            throw new Error(response.errors[0]);
        }
    }
    catch (error) {
        console.error("Error deleting Google Docs:", error);
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
                            color: 'success',
                            message: `Successfully logged in`,
                        });
                        await configStore.initialize();
                        setLoggedInUser(configStore.store.config.loginDetails['GOOGLE'].name);
                    })
                    .catch((error) => {
                        setIsLoading(false);
                        notification.add({
                            color: 'error',
                            message: error.message,
                        });
                    });
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
                        <Stack direction="column" spacing={2} style={{ paddingTop: "10px" }}>
                            <Controller
                                name={"GOOGLEDOCS_TITLE"}
                                control={controlCreate}
                                rules={{ required: "Google Docs Title is required" }}
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
                                rules={{ required: "Google Docs Content is required" }}
                                render={({ field, fieldState }) => (
                                    <div>
                                        <label>Google Docs Content</label>
                                        <ReactQuill
                                            theme="snow"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                        />
                                        {fieldState.error && (
                                            <Typography color="error" variant="caption">
                                                {fieldState.error.message}
                                            </Typography>
                                        )}
                                    </div>
                                )}
                            />
                        </Stack>
                          <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
                            <StyledButton
    type="button"
    onClick={() => {
        resetCreate();
        setData("showDocsCreateForm", false as PathValue<GoogleDocsBlockDef["data"], "showDocsCreateForm">);
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
                        <Stack direction="column" spacing={2} style={{ paddingTop: "10px" }}>
                            <Controller
                                name={"GOOGLEDOCS_TITLE"}
                                control={controlUpdate}
                                rules={{ required: "Google Docs Title is required" }}
                                render={({ field, fieldState }) => (
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
                                rules={{ required: "Google Docs Content is required" }}
                                render={({ field, fieldState }) => (
                                    <div>
                                        <label>Google Docs Content</label>
                                        <ReactQuill
                                            theme="snow"
                                            value={readContent || ""}
                                            onChange={(value) => {
                                                setReadContent(value);
                                                field.onChange(value);
                                            }}
                                        />
                                        {fieldState.error && (
                                            <Typography color="error" variant="caption">
                                                {fieldState.error.message}
                                            </Typography>
                                        )}
                                    </div>
                                )}
                            />
                             </Stack>
                        <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
                           <StyledButton
    type="button"
    onClick={() => {
        resetUpdate();
        setData("showDocsUpdateForm", false as PathValue<GoogleDocsBlockDef["data"], "showDocsUpdateForm">);
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
                        <Stack direction="column" spacing={2} style={{ paddingTop: "10px" }}>
                            <Controller
                                name={"GOOGLEDOCS_TITLE"}
                                control={controlDelete}
                                rules={{ required: "Google Docs Title is required" }}
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
                         <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
                          <StyledButton
    type="button"
    onClick={() => {
        resetDelete();
        setData("showDocsDeleteForm", false as PathValue<GoogleDocsBlockDef["data"], "showDocsDeleteForm">);
    }}
>
    Cancel
</StyledButton>
                            <StyledButton type="submit" variant="contained" color="error">
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
                                    onClick={() => { oauth('google'); }}
                                    data-testid={'my-googledocs-profile-new-key-btn'}
                                >
                                    Login google
                                </Button>
                            </div>
                        )}
                         {loggedInUser && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <div>
                                        <span>Logged in as: </span>
                                        <strong>{loggedInUser}</strong>
                                    </div>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => {
                                            setData("showDocsCreateForm", true as PathValue<GoogleDocsBlockDef["data"], "showDocsCreateForm">);
                                            setData("showCreateForm", false as PathValue<GoogleDocsBlockDef["data"], "showCreateForm">);
                                        }}
                                    >
                                        Create
                                        </Button>
                                </div>
                                <div style={{ border: "1px solid #888", borderRadius: 8, marginBottom: 16 }}>
                                    {docTitleList && docTitleList.length > 0 &&
                                        docTitleList.map((title: string) => (
                                            <div key={title} style={{ display: "flex", borderBottom: "1px solid #444", alignItems: "center", padding: 8 }}>
                                                <div style={{ flex: 1 }}>{title}</div>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => {
                                                            setData("showDocsUpdateForm", true);
                                                            setData("showDocsReadForm", false);
                                                            setData("showDocsDeleteForm", false);
                                                            setUpdateValue("GOOGLEDOCS_TITLE", title);
                                                            updateContent(title);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                     <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={() => {
                                                            setData("showDocsDeleteForm", true);
                                                            setData("showDocsUpdateForm", false);
                                                            setData("showDocsReadForm", false);
                                                            setDeleteValue("GOOGLEDOCS_TITLE", title);
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </>
                        )}
                    </>
                )}
                {data.showCreateForm && createdDoc && (
    <Modal open={true} onClose={() => {
        setData("showCreateForm", false as PathValue<GoogleDocsBlockDef["data"], "showCreateForm">);
        setCreatedDoc(null);
        fetchDocsOptions();
    }}>
        <StyledModalContent>
            <Typography variant="h6" align="center">
                Document Created Successfully: {createdDoc.title}
            </Typography>
            <Stack direction="row" justifyContent="center">
                <Button
                    variant="contained"
                    onClick={() => {
                        setData("showCreateForm", false as PathValue<GoogleDocsBlockDef["data"], "showCreateForm">);
                        setCreatedDoc(null);
                        fetchDocsOptions();
                    }}
                >
                    Close
                </Button>
            </Stack>
        </StyledModalContent>
    </Modal>
)}
                {data.showUpdateForm && updatedDoc && (
    <Modal open={true} onClose={() => {
        setData("showUpdateForm", false as PathValue<GoogleDocsBlockDef["data"], "showUpdateForm">);
        setUpdatedDoc(null);
        fetchDocsOptions();
    }}>
        <StyledModalContent>
            <Typography variant="h6" align="center">
                Document Updated Successfully
            </Typography>
            <Stack direction="row" justifyContent="center">
                <Button
                    variant="contained"
                    onClick={() => {
                        setData("showUpdateForm", false as PathValue<GoogleDocsBlockDef["data"], "showUpdateForm">);
                        setUpdatedDoc(null);
                        fetchDocsOptions();
                    }}
                >
                    Close
                </Button>
            </Stack>
        </StyledModalContent>
    </Modal>
)}
               {data.showDeleteForm && deletedDoc && (
    <Modal open={true} onClose={() => {
        setData("showDeleteForm", false as PathValue<GoogleDocsBlockDef["data"], "showDeleteForm">);
        setDeletedDoc(null);
        fetchDocsOptions();
    }}>
        <StyledModalContent>
            <Typography variant="h6" align="center">
                Document Deleted Successfully: {deletedDoc.title}
            </Typography>
            <Stack direction="row" justifyContent="center">
                <Button
                    variant="contained"
                    onClick={() => {
                        setData("showDeleteForm", false as PathValue<GoogleDocsBlockDef["data"], "showDeleteForm">);
                        setDeletedDoc(null);
                        fetchDocsOptions();
                    }}
                >
                    Close
                </Button>
            </Stack>
        </StyledModalContent>
    </Modal>
)}

                {showDeleteConfirm && (
                    <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
                        <StyledModalContent>
                            <Typography variant="body1">
                                This action is irreversible. Are you sure you want to delete the document?
                            </Typography>
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={async () => {
                                        if (pendingDeleteValues) {
                                            await onDeleteSubmit(pendingDeleteValues);
                                        }
                                    }}
                                >
                                    Yes
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowDeleteConfirm(false)}
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