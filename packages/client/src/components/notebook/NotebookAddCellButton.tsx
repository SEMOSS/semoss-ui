import { useState } from 'react';
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
import {
    DefaultCellDefinitions,
    DefaultCells,
} from '@/components/cell-defaults';
import { QueryImportCellConfig } from '../cell-defaults/query-import-cell';
import { CodeCellConfig } from '../cell-defaults/code-cell';

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

interface AddCellOption {
    display: string;
    defaultCellType: DefaultCellDefinitions['widget'];
}
const AddCellOptions: Record<string, AddCellOption> = {
    code: {
        display: 'Code',
        defaultCellType: 'code',
    },
    'query-import': {
        display: 'Query Import',
        defaultCellType: 'query-import',
    },
    transformation: {
        display: 'Transformation',
        defaultCellType: 'uppercase-transformation', // TODO: figure out what the most popular transformation is and use as default
    },
};

export const NotebookAddCellButton = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const open = Boolean(anchorEl);
        const { query, previousCellId = '' } = props;
        const { state, notebook } = useBlocks();

        const cellTypeOptions = computed(() => {
            const options = { ...AddCellOptions };
            // transformation cell types can only be added if there exists a query-import cell before it
            if (!previousCellId) {
                delete options['transformation'];
            } else {
                const previousCellIndex = query.list.indexOf(previousCellId);
                let hasFrameVariable = false;
                for (let index = 0; index <= previousCellIndex; index++) {
                    if (
                        query.cells[query.list[index]].config.widget ===
                        'query-import'
                    ) {
                        hasFrameVariable = true;
                        break;
                    }
                }
                if (!hasFrameVariable) {
                    delete options['transformation'];
                }
            }

            return Object.values(options);
        }).get();

        /**
         * Create a new cell
         */
        const appendCell = (widget: string) => {
            try {
                const newCellId = `${Math.floor(Math.random() * 100000)}`;

                const config: NewCellAction['payload']['config'] = {
                    widget: DefaultCells[widget].widget,
                    parameters: DefaultCells[widget].parameters,
                };

                if (widget === QueryImportCellConfig.widget) {
                    config.parameters = {
                        ...DefaultCells[widget].parameters,
                        frameVariableName: `FRAME_${newCellId}`,
                    };
                }

                if (
                    previousCellId &&
                    state.queries[query.id].cells[previousCellId].widget ===
                        widget &&
                    widget === CodeCellConfig.widget
                ) {
                    const previousCellType =
                        state.queries[query.id].cells[previousCellId].parameters
                            ?.type ?? 'pixel';
                    config.parameters = {
                        ...DefaultCells[widget].parameters,
                        type: previousCellType,
                    };
                }

                // copy and add the step
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
                    {Array.from(
                        cellTypeOptions,
                        ({ display, defaultCellType }, index) => {
                            return (
                                <StyledMenuItem
                                    key={index}
                                    value={display}
                                    onClick={() => {
                                        appendCell(defaultCellType);
                                        setAnchorEl(null);
                                    }}
                                >
                                    {display}
                                </StyledMenuItem>
                            );
                        },
                    )}
                </StyledMenu>
            </>
        );
    },
);
