import React, { createElement, useEffect, useState, useMemo } from 'react';
import {
    styled,
    Button,
    Divider,
    Icon,
    Modal,
    Stack,
    TextField,
    Select,
    Typography,
} from '@semoss/ui';
import { useBlocks, usePixel } from '@/hooks';
import { ActionMessages, SerializedState } from '@/stores';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { DefaultBlocks, getIconForBlock } from '../block-defaults';
import { BLOCK_TYPE_INPUT } from '../block-defaults/block-defaults.constants';
import { BlocksRenderer } from '../blocks-workspace';
import { dependencies } from 'webpack';

const StyledPlaceholder = styled('div')(({ theme }) => ({
    height: '10vh',
    width: '100%',
}));

interface AddTokenModalProps {
    /**
     * modal open
     */
    open: boolean;

    /**
     * closes modal
     */
    onClose: () => void;

    /**
     * Do we want to create token on the designer screen
     */
    tokenReference?: string;
}
export const AddTokenModal = observer((props: AddTokenModalProps) => {
    const { open, tokenReference, onClose } = props;
    const { state } = useBlocks();

    const getEngines = usePixel<
        { app_id: string; app_name: string; app_type: string }[]
    >(`
    MyEngines();
    `);

    const [tokenAlias, setTokenAlias] = useState('');
    const [tokenRef, setTokenRef] = useState('');
    const [previewState, setPreviewState] = useState<SerializedState>({
        dependencies: {},
        tokens: {},
        blocks: {},
        queries: {},
    });

    const [engines, setEngines] = useState({
        models: [],
        databases: [],
        storages: [],
    });

    // get the input type blocks as an array
    const inputBlocks = computed(() => {
        return Object.values(state.blocks)
            .filter(
                (block) =>
                    DefaultBlocks[block.widget].type === BLOCK_TYPE_INPUT,
            )
            .sort((a, b) => {
                const aId = a.id.toLowerCase(),
                    bId = b.id.toLowerCase();

                if (aId < bId) {
                    return -1;
                }
                if (aId > bId) {
                    return 1;
                }
                return 0;
            });
    }).get();

    const cells = useMemo(() => {
        const cells = [];
        Object.values(state.queries).forEach((query) => {
            Object.values(query.cells).forEach((cell) => {
                cells.push(cell);
            });
        });

        return cells;
    }, [state.queries]);

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }
        const cleanedEngines = getEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
            app_type: d.app_type,
        }));

        const newEngines = {
            models: cleanedEngines.filter((e) => e.app_type === 'MODEL'),
            databases: cleanedEngines.filter((e) => e.app_type === 'DATABASE'),
            storages: cleanedEngines.filter((e) => e.app_type === 'STORAGE'),
        };
        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);

    /**
     * For Block Preview
     * go through state, keep our queries
     * just isolate the block we need
     */
    useEffect(() => {
        if (tokenRef) {
            const block = state.getBlock(tokenRef);
            const s: SerializedState = {
                dependencies: {},
                tokens: {},
                queries: {},
                blocks: {
                    'page-1': {
                        id: 'page-1',
                        widget: 'page',
                        parent: null,
                        data: {
                            style: {
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            },
                        },
                        listeners: {
                            onPageLoad: [],
                        },
                        slots: {
                            content: {
                                name: 'content',
                                children: [tokenRef],
                            },
                        },
                    },
                    [tokenRef]: {
                        id: block.id,
                        widget: block.widget,
                        data: block.data,
                        parent: null,
                        listeners: block.listeners,
                        slots: block.slots,
                    },
                },
            };

            setPreviewState(s);
        }
    }, [tokenRef]);

    return (
        <Modal open={open} onClose={onClose}>
            <Modal.Title>Add Token</Modal.Title>
            <Modal.Content sx={{ width: '600px' }}>
                <Stack direction="column">
                    <TextField
                        label={'Alias'}
                        value={tokenAlias}
                        onChange={(e) => {
                            setTokenAlias(e.target.value);
                        }}
                    />
                    <Select
                        label={'Reference'}
                        disabled={tokenReference ? true : false}
                        value={tokenRef}
                        onChange={(e) => {
                            setTokenRef(e.target.value);
                        }}
                    >
                        <Stack ml={2}>
                            <Typography variant="h6" color="secondary">
                                Blocks
                            </Typography>
                        </Stack>
                        {inputBlocks.map((block) => {
                            return (
                                <Select.Item key={block.id} value={block.id}>
                                    <Icon color="primary">
                                        {createElement(
                                            getIconForBlock(block.widget),
                                        )}
                                    </Icon>
                                    <Typography variant="caption">
                                        {block.id}
                                    </Typography>
                                </Select.Item>
                            );
                        })}
                        <Stack ml={2}>
                            <Typography variant="h6" color="secondary">
                                Cells
                            </Typography>
                        </Stack>
                        {cells.map((cell) => {
                            return (
                                <Select.Item key={cell.id} value={cell.id}>
                                    <Typography variant="caption">
                                        {cell.id}
                                    </Typography>
                                </Select.Item>
                            );
                        })}
                        <Stack ml={2}>
                            <Typography variant="h6" color="secondary">
                                Models
                            </Typography>
                        </Stack>
                        {engines.models.map((model) => {
                            return (
                                <Select.Item
                                    key={model.app_id}
                                    value={model.app_id}
                                >
                                    <Typography variant="caption">
                                        {model.app_name}
                                    </Typography>
                                </Select.Item>
                            );
                        })}
                        <Stack ml={2}>
                            <Typography variant="h6" color="secondary">
                                Databases
                            </Typography>
                        </Stack>
                        {engines.databases.map((model) => {
                            return (
                                <Select.Item
                                    key={model.app_id}
                                    value={model.app_id}
                                >
                                    <Typography variant="caption">
                                        {model.app_name}
                                    </Typography>
                                </Select.Item>
                            );
                        })}
                        <Stack ml={2}>
                            <Typography variant="h6" color="secondary">
                                Storages
                            </Typography>
                        </Stack>
                        {engines.storages.map((storage) => {
                            return (
                                <Select.Item
                                    key={storage.app_id}
                                    value={storage}
                                >
                                    <Typography variant="caption">
                                        {storage.app_name}
                                    </Typography>
                                </Select.Item>
                            );
                        })}
                    </Select>

                    <Typography variant={'h6'}>Preview</Typography>
                    {/* If we preview block */}
                    {!Object.keys(previewState.queries).length &&
                    !Object.keys(previewState.blocks).length ? (
                        <StyledPlaceholder />
                    ) : (
                        <BlocksRenderer state={previewState} />
                    )}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    variant={'contained'}
                    color={'secondary'}
                    onClick={() => {
                        onClose();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant={'contained'}
                    onClick={() => {
                        state.dispatch({
                            message: ActionMessages.ADD_TOKEN,
                            payload: {
                                alias: tokenAlias,
                                to: tokenRef,
                                type: 'block',
                            },
                        });

                        onClose();
                    }}
                >
                    Add
                </Button>
            </Modal.Actions>
        </Modal>
    );
});
