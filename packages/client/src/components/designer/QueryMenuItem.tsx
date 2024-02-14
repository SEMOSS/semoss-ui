import { useEffect, useState, useCallback } from 'react';
import { Chip, List, Typography, styled } from '@semoss/ui';
import { useBlocks, useWorkspace, useDesigner } from '@/hooks';
import { ActionMessages, QueryState, BlockJSON } from '@/stores';
import { getIconForBlock } from '../block-defaults';

const StyledListItem = styled(List.Item)(() => ({
    padding: '0px 4px',
}));

const StyledListItemText = styled(List.ItemText)(() => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

const StyledSuccessChip = styled(Chip)(({ theme }) => ({
    backgroundColor: '#E7F4E5',
    color: theme.palette.success.main,
}));

const StyledErrorChip = styled(Chip)(({ theme }) => ({
    backgroundColor: '#FBE9E8',
    color: theme.palette.error.main,
}));

interface QueryMenuItemProps {
    query: QueryState;
}

export const QueryMenuItem = (props: QueryMenuItemProps) => {
    const { query } = props;
    const { notebook, state } = useBlocks();
    const { workspace } = useWorkspace();
    const { designer } = useDesigner();

    // We can provide different options for user to display this data,
    // Or we can take a look at the data if it's there and render a better block for it
    const json: BlockJSON = {
        widget: 'text',
        data: {
            text: `{{${query.id}.data}}`,
        },
        slots: {} as BlockJSON['slots'],
        listeners: {},
    };

    // track if it is this one that is dragging
    const [local, setLocal] = useState(false);

    /**
     * Handle the mousedown on the widget.
     */
    const handleMouseDown = () => {
        // set the dragged
        designer.activateDrag(
            'text',
            () => {
                return true;
            },
            'text',
            getIconForBlock('text'),
        );

        // clear the hovered
        designer.setHovered('');

        // clear the selected
        designer.setSelected('');

        // set as inactive
        setLocal(true);
    };

    /**
     * Handle the mouseup event on the document
     */
    const handleDocumentMouseUp = useCallback(() => {
        if (!designer.drag.active) {
            return;
        }

        // apply the action
        const placeholderAction = designer.drag.placeholderAction;

        if (placeholderAction) {
            if (
                placeholderAction.type === 'before' ||
                placeholderAction.type === 'after'
            ) {
                const siblingWidget = state.getBlock(placeholderAction.id);

                if (siblingWidget?.parent) {
                    state.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: json,
                            position: {
                                parent: siblingWidget.parent.id,
                                slot: siblingWidget.parent.slot,
                                sibling: siblingWidget.id,
                                type: placeholderAction.type,
                            },
                        },
                    });
                }
            } else if (placeholderAction.type === 'replace') {
                state.dispatch({
                    message: ActionMessages.ADD_BLOCK,
                    payload: {
                        json: json,
                        position: {
                            parent: placeholderAction.id,
                            slot: placeholderAction.slot,
                        },
                    },
                });
            }
        }

        // clear the drag
        designer.deactivateDrag();

        // clear the hovered
        designer.setHovered('');

        // clear the selected
        designer.setSelected('');

        // set as active
        setLocal(false);
    }, [
        json,
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

    return (
        <StyledListItem onMouseDown={handleMouseDown}>
            <List.ItemButton
                onClick={() => {
                    // switch the view
                    workspace.setView('data');

                    // select the query
                    notebook.selectQuery(query.id);
                }}
            >
                <StyledListItemText
                    disableTypography
                    primary={
                        <Typography variant="subtitle2">{query.id}</Typography>
                    }
                    secondary={
                        <Typography variant="caption" noWrap={true}>
                            {query.isLoading ? (
                                <em>Loading...</em>
                            ) : query.output ? (
                                query.isSuccessful ? (
                                    <StyledSuccessChip
                                        label="Success"
                                        size="small"
                                    />
                                ) : (
                                    <StyledErrorChip
                                        label="Error"
                                        size="small"
                                    />
                                )
                            ) : (
                                <em>Query not yet executed</em>
                            )}
                        </Typography>
                    }
                />
            </List.ItemButton>
        </StyledListItem>
    );
};
