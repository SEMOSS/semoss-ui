import { useState, useEffect, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    DeleteOutline,
    ReportRounded,
    InfoOutlined,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';

import {
    ActionMessages,
    INPUT_BLOCK_TYPES,
    QueryStateConfig,
    useBlocks,
    Variable,
    VariableWithId,
} from '@semoss/renderer';
import {
    styled,
    Card,
    Tooltip,
    Stack,
    Typography,
    useNotification,
    Icon,
    Button,
    IconButton,
    Box,
} from '@semoss/ui';

import { useDesigner, useRootStore } from '@/hooks';
import { BlockCardContent, blockCardWidth } from './BlockMenuCardContent';
import {
    BlockLocalStorageData,
    DesignerMenuItem,
} from '../blocks-workspace/menus/menu-types';

const StyledCard = styled(Card)({
    cursor: 'grab',
    border: `1px solid rgba(0, 0, 0, 0.12)`,
    //TODO: styled needs to be updated to match the theme
    borderRadius: '6px',
    justifyContent: 'center',
});

const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
    width: blockCardWidth,
    userSelect: 'none',
}));

export interface AddBlocksMenuItemProps {
    /** Item that can be dragged onto the block */
    item: DesignerMenuItem;

    /** Determined for snapshot code */
    isCommunity: boolean;

    /** Handle the trash click */
    handleOnTrashClick: (blockId: string, blockName: string) => void;
}

/**
 * Individaul block that can be dragged onto the UI
 */
export const AddBlocksMenuCard = observer((props: AddBlocksMenuItemProps) => {
    const { item, isCommunity, handleOnTrashClick } = props;
    const { state } = useBlocks();
    const { designer } = useDesigner();
    const notification = useNotification();
    const { configStore } = useRootStore();

    const ref = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);

    // track if it is this one that is dragging
    const [local, setLocal] = useState(false);

    // track if this is being hovered
    const [hovered, setHovered] = useState<boolean>(false);

    /**
     * Handle the mousedown on the widget.
     */
    const handleMouseDown = () => {
        // set the dragged
        designer.activateDrag(
            item.json.widget,
            () => {
                return true;
            },
            item.name,
            item.hoverImage,
        );

        // clear the hovered
        designer.setHovered('');

        // clear the selected
        designer.setSelected('');

        // set as inactive
        setLocal(true);
    };
    /**
     * Deep‑clone `input` while replacing every occurrence of `target`
     * with `replacement`, except inside keys listed in `skipKeys`.
     *
     * @param input   the source JSON (any shape)
     * @param target   string to replace (e.g. "form-submit")
     * @param replacement   replacement (e.g. "form-submit--272")
     * @param skipKeys  keys whose entire subtree must stay untouched
     */
    function rewriteQueryIdInBlocksJSON<T>(
        input: T,
        target: string,
        replacement: string,
        skipKeys: Set<string> = new Set(['variables', 'queries']),
    ): T {
        const mustacheRE = new RegExp(
            `{{\\s*(${target})(\\.[^{}\\s]*)?\\s*}}`,
            'g',
        );

        function cloneAndReplace(node: any): any {
            if (node == null) return node;

            /* -------- strings -------- */
            if (typeof node === 'string') {
                if (node === target) return replacement; // exact match
                return node.replace(
                    mustacheRE,
                    (_, __, rest = '') => `{{${replacement}${rest}}}`,
                ); // moustache
            }

            /* -------- arrays --------- */
            if (Array.isArray(node)) {
                return node.map(cloneAndReplace);
            }

            /* -------- objects -------- */
            if (typeof node === 'object') {
                const result: any = {};
                for (const [key, value] of Object.entries(node)) {
                    /* Skip entire subtree if key is in skipKeys */
                    if (skipKeys.has(key)) {
                        result[key] = value; // shallow copy is fine – untouched
                        continue;
                    }

                    if (key === 'queryId' && value === target) {
                        result[key] = replacement;
                    } else {
                        result[key] = cloneAndReplace(value);
                    }
                }
                return result;
            }

            /* -------- primitives (number, boolean, etc.) -------- */
            return node;
        }

        return cloneAndReplace(input);
    }

    /** write a dispatcher function named dispatchDependecyQueries
     * This function will dispatch the queries that are needed for the block
     * if the quryId is alredy present in the state, it will create new copy with new name(queryId) and add it to the state
     * @param queries - queries to be added to the state
     */
    const dispatchDependencyQueries = (
        queries: Record<string, QueryStateConfig>,
    ) => {
        let placeholderJSON = item.json;
        let generatedQueries: string[] = [];
        Object.entries(queries).forEach(([key, value]) => {
            let newQuery = {
                queryId: key,
                config: value as QueryStateConfig,
            };
            // Check if the query already exists in the state
            if (state.queries[key]) {
                // Create a new copy of the query with a new name
                const newQueryId = `${key}_${Math.floor(Math.random() * 1000)}`;
                // Dispatch the new query with the new name
                newQuery = {
                    ...newQuery,
                    queryId: newQueryId,
                };
                // update the new queryId in item.json
                placeholderJSON = rewriteQueryIdInBlocksJSON(
                    placeholderJSON,
                    key,
                    newQueryId,
                    new Set(['queries', 'variables']),
                );
            }
            generatedQueries.push(newQuery.queryId);
            state.dispatch({
                message: ActionMessages.NEW_QUERY,
                payload: newQuery,
            });
        });

        return { placeholderJSON, generatedQueries };
    };

    /**
     * This function takes a query, a target variable name, and a replacement variable name.
     * It iterates over all the cells in the query and updates any occurrences of the target variable name
     * with the replacement variable name.
     * @param query - the query to be updated
     * @param targetVariableName - the variable name to be replaced
     * @param replacementVariableName - the variable name to replace the target variable name with
     */
    function updateQueryWithNewVariableName(
        query: { id: string; cells: any },
        targetVariableName: string,
        replacementVariableName: string,
    ) {
        // Create a regex to match the target variable name in the cells
        const variableNameRegex = new RegExp(
            `{{\\s*${targetVariableName}(\\.[^}]+)?\\s*}}`,
            'g',
        );

        // Get an array of cell entries. If the cells are an array, map them to an array of entries.
        // If the cells are an object, use Object.entries to get an array of entries.
        const cellsEntries: [string, any][] = Array.isArray(query.cells)
            ? query.cells.map((c) => [c.id, c])
            : Object.entries(query.cells);

        // Create a weak set to track the objects we've already visited
        const seen = new WeakSet(); // 👈 track visited objects

        // This function takes a value, a path (an array of strings), and a cellId
        // and recursively traverses the value object, updating any occurrences of the target variable name
        // with the replacement variable name.
        function walk(
            value: unknown,
            pathBits: (string | number)[],
            cellId: string,
        ) {
            // If the value is a string, check if it matches the regex
            if (typeof value === 'string') {
                if (variableNameRegex.test(value)) {
                    // If it does, replace the target variable name with the replacement variable name
                    const updated = value.replace(
                        variableNameRegex,
                        (_, grp) => {
                            return `{{${replacementVariableName}${grp || ''}}}`;
                        },
                    );

                    // Dispatch an update cell action to the state with the updated value
                    state.dispatch({
                        message: ActionMessages.UPDATE_CELL,
                        payload: {
                            queryId: query.id,
                            cellId,
                            path: pathBits.length > 2 ? pathBits.slice(-2).join('.') : pathBits.join('.'),
                            value: updated,
                        },
                    });
                }
                return;
            }

            // If the value is an object, recursively traverse it
            if (value && typeof value === 'object') {
                // If we've already visited this object, don't do anything
                if (seen.has(value)) return;
                // Add the object to the set of visited objects
                seen.add(value);

                // If the value is an array, traverse each element of the array
                if (Array.isArray(value)) {
                    value.forEach((v, i) => walk(v, [...pathBits, i], cellId));
                } else {
                    // If the value is an object, traverse each property of the object
                    Object.entries(value).forEach(([k, v]) =>
                        walk(v, [...pathBits, k], cellId),
                    );
                }
            }
        }

        // Iterate over each cell in the query and call the walk function
        cellsEntries.forEach(([cellId, cellObj]) => {
            walk(cellObj, [], cellId);
        });
    }

    const allowedKeys = [
        'widget',
        'data',
        'listeners',
        'slots',
        'id',
        'referenceId',
    ];

    /**
     * Recursively processes the slots of a block to retain only the allowed keys.
     *
     * @param {any} value - The slots or part of slots to process.
     * @param {Record<string, any>} blocks - The entire blocks object for reference.
     * @returns {any} Processed slots with only allowed keys retained.
     */
    const processSlots = (value: any, blocks: Record<string, any>): any => {
        // Check if the current value is an array
        if (Array.isArray(value)) {
            return value.map(
                (item) =>
                    // If the item is a string and exists in blocks, process it
                    typeof item === 'string' && item in blocks
                        ? Object.fromEntries(
                              allowedKeys
                                  .filter((key) => key in blocks[item]) // Filter allowed keys
                                  .map((key) => [
                                      key,
                                      processSlots(blocks[item][key], blocks),
                                  ]), // Process each key recursively
                          )
                        : processSlots(item, blocks), // Recursively process item if not a string or not in blocks
            );
            // Check if the current value is an object
        } else if (typeof value === 'object' && value !== null) {
            return Object.fromEntries(
                Object.entries(value).map(([key, val]) => [
                    key,
                    processSlots(val, blocks), // Recursively process each entry
                ]),
            );
        } else {
            // Return value if it's neither an array nor an object
            return value;
        }
    };

    /**
     * Finds the new id of a block after it has been modified, such as when a user duplicates a block.
     * @param {string} targetReferenceBlockId - The id of the block to find in the modified block
     * @param {Record<string, any>} modifiedBlock - The modified block object
     * @returns {string} The new id of the block if found, otherwise an empty string
     */
    const findUpdatedBlockId = (
        targetReferenceBlockId: string,
        modifiedBlock: Record<string, any>,
    ): string => {
        const blocksJSON = {
            ...modifiedBlock,
            slots: processSlots(modifiedBlock.slots, state.blocks),
        };
        // write a finder function which scans through the blocksJSON and return the id of the block if id matches the targetReferenceBlockId
        const findBlockId = (block: Record<string, any>): string => {
            // If the block has a referenceId that matches the targetReferenceBlockId, return the block's id
            if (block.referenceId === targetReferenceBlockId) {
                return block.id;
            }

            // If the block has slots, recursively search through them
            if (block.slots) {
                for (const slot in block.slots) {
                    if (block.slots.hasOwnProperty(slot)) {
                        const children = block.slots[slot].children;
                        // If the children property is an array, recursively search through each item in the array
                        if (Array.isArray(children)) {
                            for (const child of children) {
                                const foundId = findBlockId(child);
                                if (foundId) {
                                    return foundId;
                                }
                            }
                        } else if (typeof children === 'object') {
                            // If the children property is an object, recursively search through its properties
                            const foundId = findBlockId(children);
                            if (foundId) {
                                return foundId;
                            }
                        }
                    }
                }
            }

            // If no match found, return an empty string
            return '';
        };

        return findBlockId(blocksJSON);
    };

    /**
     * Dispatches the dependency variables that are needed for the block.
     * If the variable already exists in the state, it will create a new copy with a new name
     * and dispatch the new variable with the new name.
     * If the variable is a block, it will find the new id of the block in the modified block's slots
     * and set the to property of the variable to the new id.
     * If the variable is a query, it will not do anything.
     * @param {Record<string, Variable | VariableWithId>} variables - The dependency variables to dispatch
     * @param {string} com_parent_block_id - The id of the block that contains the dependency variables
     * @param {string[]} targetQueries - The queries that need to be updated with the new variable name
     */
    const dispatchDependencyVariables = (
        variables: Record<string, Variable | VariableWithId>,
        com_parent_block_id: string,
        targetQueries: string[],
    ) => {
        // Iterate over each variable in the dependency variables
        Object.entries(variables).forEach(([key, value]) => {
            // If the variable type is not query, dispatch it
            if (value.type !== 'query') {
                let newVariable = {
                    // Create a new copy of the variable with the same properties
                    ...value,
                    // Set the id of the new variable to the key
                    id: key,
                    // If the variable is a block, find the new id of the block in the modified block's slots
                    to:
                        value.type === 'block'
                            ? findUpdatedBlockId(
                                  value.to,
                                  state.blocks[com_parent_block_id],
                              )
                            : value.to,
                };

                // Check if the variable already exists in the state
                if (state.variables[key]) {
                    // Create a new copy of the variable with a new name
                    const newVariableId = `${key}_${Math.floor(
                        Math.random() * 1000,
                    )}`;
                    // Dispatch the new variable with the new name
                    newVariable = {
                        ...newVariable,
                        id: newVariableId,
                    };
                }

                // If targetQueries is not empty, update the queries with the new variable name
                if (targetQueries && targetQueries.length > 0) {
                    targetQueries.forEach((queryId) => {
                        const query = state.queries[queryId];
                        const updated = updateQueryWithNewVariableName(
                            query,
                            key,
                            newVariable.id,
                        );
                    });
                }

                // Dispatch the new variable
                state.dispatch({
                    message: ActionMessages.ADD_VARIABLE,
                    payload: newVariable,
                });
            }
        });
    };

    /**
     * Handle the mouseup event on the document
     */
    const handleDocumentMouseUp = useCallback(() => {
        if (!designer.drag.active) {
            return;
        }

        // ID of newly added block
        let id = '';

        // put a placeholder action to check if it is valid
        const placeholderAction = designer.drag.placeholderAction;
        if (!placeholderAction || !placeholderAction.id) {
            designer.deactivateDrag();
            designer.setHovered('');
            designer.setSelected('');
            setLocal(false);
            return;
        }

        // Track block in session storage
        localStorage.setItem(
            'blocks--frequently-used',
            (() => {
                const map: Record<string, BlockLocalStorageData> =
                    JSON.parse(
                        localStorage.getItem('blocks--frequently-used'),
                    ) ?? {};
                map[item.json.widget] = {
                    widget: item.json.widget,
                    name: item.name,
                    use_count: (map[item.json.widget]?.use_count ?? 0) + 1,
                    last_used: Date.now(),
                };
                return JSON.stringify(map);
            })(),
        );

        // apply the action
        const sw = state.getBlock(placeholderAction.id);

        // Safely get the block associated with the placeholder action
        if (!sw) {
            designer.deactivateDrag();
            designer.setHovered('');
            designer.setSelected('');
            setLocal(false);
            return;
        }

        // TODO: Add logic to prevent adding block it iter block if one is already present

        if (sw.widget === 'iteration') {
            if (sw.slots.children.children.length) {
                notification.add({
                    color: 'error',
                    message:
                        'Please delete block within iterator before adding another child',
                });
                return;
            }
        }

        if (placeholderAction) {
            if (
                placeholderAction.type === 'before' ||
                placeholderAction.type === 'after'
            ) {
                const siblingWidget = state.getBlock(placeholderAction.id);

                if (siblingWidget?.parent) {
                    if (!sw.parent || !sw.parent.id) {
                        designer.deactivateDrag();
                        setLocal(false);
                        return;
                    }
                    const parent = state.getBlock(sw.parent.id);
                    if (!parent) {
                        designer.deactivateDrag();
                        setLocal(false);
                        return;
                    }
                    if (parent.widget === 'iteration') {
                        if (parent.slots.children.children.length) {
                            notification.add({
                                color: 'error',
                                message:
                                    'Please delete block within iterator before adding another child',
                            });
                            designer.deactivateDrag();
                            return;
                        }
                    }
                    let newJson = item.json;
                    let newQueries: string[] = [];
                    if (item.json['queries']) {
                        const { placeholderJSON, generatedQueries } =
                            dispatchDependencyQueries(item.json['queries']);
                        newJson = placeholderJSON;
                        newQueries = generatedQueries;
                    }
                    id = state.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: newJson,
                            position: {
                                parent: siblingWidget.parent.id,
                                slot: siblingWidget.parent.slot,
                                sibling: siblingWidget.id,
                                type: placeholderAction.type,
                            },
                        },
                    }) as string;
                    if (item.json['variables']) {
                        dispatchDependencyVariables(
                            item.json['variables'],
                            id,
                            newQueries,
                        );
                    }
                }
            } else if (placeholderAction.type === 'replace') {
                let newJson = item.json;
                let newQueries: string[] = [];
                if (item.json['queries']) {
                    const { placeholderJSON, generatedQueries } =
                        dispatchDependencyQueries(item.json['queries']);
                    newJson = placeholderJSON;
                    newQueries = generatedQueries;
                }
                id = state.dispatch({
                    message: ActionMessages.ADD_BLOCK,
                    payload: {
                        json: newJson,
                        position: {
                            parent: placeholderAction.id,
                            slot: placeholderAction.slot,
                        },
                    },
                }) as string;
                if (item.json['variables']) {
                    dispatchDependencyVariables(
                        item.json['variables'],
                        id,
                        newQueries,
                    );
                }

                if (sw.widget === 'iteration') {
                    state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: placeholderAction.id,
                            path: 'child',
                            value: state.getBlock(id),
                        },
                    });
                }
            }
        }

        // TODO: REFACTOR
        // Add variables for all blocks that are inputs from user
        if (INPUT_BLOCK_TYPES.indexOf(item.json.widget) > -1) {
            state.dispatch({
                message: ActionMessages.ADD_VARIABLE,
                payload: {
                    id: id,
                    type: 'block',
                    to: id,
                    isInput: true,
                },
            });
        }

        // clear the drag
        designer.deactivateDrag();

        // clear the hovered
        designer.setHovered('');

        // clear the selected
        designer.setSelected(id ? id : '');

        // clear the selectedBlocks
        designer.addBlockToSelected('clear');

        // set as active
        setLocal(false);
    }, [
        item.name,
        item.json,
        designer.drag.active,
        designer.drag.placeholderAction,
        designer,
        state,
    ]);

    // add the mouse up listener when dragged
    useEffect(() => {
        if (!designer.drag.active || !local) {
            return;
        }

        document.addEventListener('mouseup', handleDocumentMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleDocumentMouseUp);
        };
    }, [designer.drag.active, local, handleDocumentMouseUp]);

    // useEffect(() => {
    //     if (isClient) {
    //         if (ref.current) {
    //             html2canvas(ref.current).then((canvas) => {
    //                 setImageSrc(canvas.toDataURL('image/png'));
    //             });
    //         }
    //     }
    // }, [isClient]);

    // const randomColor = () => {
    //     return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    // };

    return (
        <Stack
            spacing={1}
            alignItems="center"
            height="100%"
            justifyContent="flex-end"
        >
            {/* So we can snapshot picture for client */}
            {/* {isClient && (
                <div
                    ref={ref}
                    style={{ position: 'absolute', left: '-9999px', top: 0 }}
                >
                    <Stack padding={4}>
                        <StyledTypography variant="body2">
                            Show snapshot
                        </StyledTypography>
                        <button
                            style={{
                                backgroundColor: randomColor(),
                                color: '#fff',
                            }}
                        >
                            {item.name}
                        </button>
                    </Stack>
                </div>
            )} */}

            <StyledTypography
                variant="body2"
                fontWeight="medium"
                align="center"
            >
                <Stack
                    direction={'row'}
                    gap={1}
                    alignContent={'center'}
                    justifyContent={'center'}
                >
                    {item.name}
                    {item.recentChanges && (
                        <Tooltip
                            title={item.recentChanges}
                            children={
                                <Icon color={'info'} fontSize="small">
                                    <InfoOutlined />
                                </Icon>
                            }
                        />
                    )}
                    {item.isBeta && (
                        <Tooltip
                            title={'This block is currently in beta'}
                            children={
                                <Icon color={'warning'} fontSize="small">
                                    <ReportRounded />
                                </Icon>
                            }
                        />
                    )}
                </Stack>
            </StyledTypography>
            <StyledCard onMouseDown={handleMouseDown}>
                <Tooltip
                    title={item.helperText ?? item.name}
                    arrow
                    placement="bottom"
                    onOpen={() => setHovered(true)}
                    onClose={() => setHovered(false)}
                >
                    <div style={{ position: 'relative' }}>
                        <BlockCardContent
                            image={
                                isCommunity
                                    ? imageSrc
                                    : hovered
                                    ? item.hoverImage
                                    : item.activeImage
                            }
                            name={item.name}
                        />
                        {hovered &&
                            isCommunity &&
                            configStore.store.user.admin && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        zIndex: 1000,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOnTrashClick(
                                                item['id'],
                                                item.name,
                                            );
                                        }}
                                        color="error"
                                    >
                                        <DeleteOutline />
                                    </IconButton>
                                </Box>
                            )}
                    </div>
                </Tooltip>
            </StyledCard>
        </Stack>
    );
});
