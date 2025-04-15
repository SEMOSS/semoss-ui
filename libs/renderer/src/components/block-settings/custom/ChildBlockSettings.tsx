import React, { useState, useEffect } from "react";
import { Add, Edit } from "@mui/icons-material";

import { Button, IconButton, LoadingScreen, Modal, Stack, Typography } from "@semoss/ui";
import { Env, InsightProvider, runPixel } from "@semoss/sdk";

import { BlockDef, SerializedState, STATE_VERSION, StateStore } from "../../../store";
import { useBlock } from "../../../hooks";
import { DefaultCells } from "../../cell-defaults";
import { DefaultBlocks } from "../../block-defaults";
import { Blocks } from "../../blocks";

interface ChildBlockSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
}

const STATE = {
    blocks: {
        "container-5656": {
            id: 'container-5656',
            widget: "container",
            parent: null,
            data: {
                style: {
                    border: 'solid red'
                },
                show: "true",
            },
            listeners: {},
            slots: {
                children: []
            },
        }
    }, 
    variables: {},
    queries: {},
    executionOrder: [],
    version: STATE_VERSION,
}

export const ChildBlockSettings = (props: ChildBlockSettingsProps) => {
    const { id } = props;
    const { data } = useBlock(id);
    const [openDesignerModal, setOpenDesignerModal] = useState(false);
    const [state, setState] = useState<StateStore>();

    useEffect(() => {
        runPixel<[SerializedState]>(
            `1+1`,
            'new',
        )
            .then(async ({ pixelReturn, errors, insightId }) => {
                // create a new state store
                // const s = new StateStore({
                //     mode: 'static',
                //     insightId: insightId,
                //     state: STATE,
                //     cellRegistry: DefaultCells,
                // });

                // set it
                // setState(s);

            })
    }, [])

    if (!state) {
        return <>Loading...</>
    }

    /**
     * Initialize insight for app building
     */
    Env.update({
        MODULE: process.env.MODULE || '',
    });

    return (
        <Stack>
            <Stack
                direction={"row"}
                alignItems={"center"}
                justifyContent={"space-between"}
            >
                <Typography align={"center"} variant={"body1"}>
                    Design
                </Typography>
                <Stack direction="row">
                    <IconButton>
                        <Add />
                    </IconButton>
                    <IconButton
                        onClick={() => {
                            setOpenDesignerModal(true);
                        }}
                    >
                        <Edit />
                    </IconButton>
                </Stack>
            </Stack>
            <Stack
                sx={{
                    border: "dotted 2px black",
                    padding: "8px",
                    alignItems: "center",
                }}
            >
                Preview of block
            </Stack>
            <Modal fullScreen open={openDesignerModal}>
                <Modal.Title>Edit Child Component</Modal.Title>
                <Modal.Content>
                    <>Show Preview of Block</>
                    {/* <InsightProvider> */}
                        {/* <Blocks
                            state={state}
                            registry={DefaultBlocks}
                        >
                        </Blocks> */}
                        {/* <Blocks>
                            <DesignerContext.Provider>
                                <Workspace />
                            </DesignerContext.Provider>
                        </Blocks> */}
                    {/* </InsightProvider> */}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => {
                            setOpenDesignerModal(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setOpenDesignerModal(false);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
        </Stack>
    );
};
