import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { styled, Button, Menu, MenuProps } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import {
    ActionMessages,
    CellStateConfig,
    NewCellAction,
    QueryState,
} from '@/stores';
import { Add } from '@mui/icons-material';
import { DefaultCellTypes } from '../cell-defaults';
import { useState } from 'react';
import { TransformationCell } from '../cell-defaults/clean-routine-cell';
import { CodeCell } from '../cell-defaults/code-cell';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
    },
    '.MuiList-root': {
        padding: 0,
    },
}));

const StyledMenuItem = styled(Menu.Item)(() => ({
    textTransform: 'capitalize',
}));

export const NotebookAddCellButton = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const open = Boolean(anchorEl);
        const { query, previousCellId = '' } = props;
        const { state, notebook } = useBlocks();

        const cellTypeOptions = computed(() => {
            let defaultCellTypes = { ...DefaultCellTypes };
            // transformation cell types can only be added if there exists a query-import cell before it
            if (!previousCellId) {
                delete defaultCellTypes[TransformationCell.widget];
            } else {
                const previousCellIndex = query.list.indexOf(previousCellId);
                let hasFrameVariable = false;
                for (let index = 0; index <= previousCellIndex; index++) {
                    if (
                        query.cells[query.list[index]].cellType.widget ===
                        'query-import'
                    ) {
                        hasFrameVariable = true;
                        break;
                    }
                }
                if (!hasFrameVariable) {
                    delete defaultCellTypes[TransformationCell.widget];
                }
            }

            return Object.keys(defaultCellTypes);
        }).get();

        /**
         * Create a new cell
         */
        const appendCell = (widget: string) => {
            try {
                const newCellId = `${Math.floor(Math.random() * 100000)}`;

                let config: NewCellAction['payload']['config'] = {
                    widget: DefaultCellTypes[widget].widget,
                    parameters: DefaultCellTypes[widget].parameters,
                };

                if (
                    previousCellId &&
                    state.queries[query.id].cells[previousCellId].cellType
                        .widget === widget &&
                    widget === CodeCell.widget
                ) {
                    const previousCellType =
                        state.queries[query.id].cells[previousCellId].parameters
                            ?.type ?? 'pixel';
                    config = {
                        widget: DefaultCellTypes[CodeCell.widget].widget,
                        parameters: {
                            ...DefaultCellTypes[CodeCell.widget].parameters,
                            type: previousCellType,
                        },
                    } as NewCellAction['payload']['config'];
                }

                // copy and add the step to the end
                state.dispatch({
                    message: ActionMessages.NEW_CELL,
                    payload: {
                        queryId: query.id,
                        cellId: newCellId,
                        previousCellId: previousCellId,
                        config: config as Omit<CellStateConfig, 'id'>,
                    },
                });
                notebook.selectCell(query.id, newCellId);
            } catch (e) {
                console.error(e);
            }
        };

        return (
            <>
                <StyledButton
                    title="Add new cell"
                    variant="contained"
                    size="small"
                    disabled={query.isLoading}
                    onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                    }}
                    startIcon={<Add />}
                >
                    Add Cell
                </StyledButton>
                <StyledMenu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => {
                        setAnchorEl(null);
                    }}
                >
                    {Array.from(cellTypeOptions, (widget, index) => {
                        return (
                            <StyledMenuItem
                                key={index}
                                value={widget}
                                onClick={() => {
                                    appendCell(widget);
                                    setAnchorEl(null);
                                }}
                            >
                                {widget.replaceAll('-', ' ')}
                            </StyledMenuItem>
                        );
                    })}
                </StyledMenu>
            </>
        );
    },
);
