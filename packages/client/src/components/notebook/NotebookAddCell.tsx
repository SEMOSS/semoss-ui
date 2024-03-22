import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { styled, Button, Divider, Menu, MenuProps, Stack } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import {
    ActionMessages,
    CellStateConfig,
    NewCellAction,
    QueryState,
} from '@/stores';
import { AccountTree, Add, Functions } from '@mui/icons-material';
import {
    DefaultCellDefinitions,
    DefaultCells,
    TransformationCells,
} from '@/components/cell-defaults';
import { QueryImportCellConfig } from '../cell-defaults/query-import-cell';
import { CodeCellConfig } from '../cell-defaults/code-cell';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    flexGrow: 1,
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
    icon: React.ReactNode;
    defaultCellType?: DefaultCellDefinitions['widget'];
    options?: {
        display: string;
        defaultCellType: DefaultCellDefinitions['widget'];
    }[];
}

const Transformations = Array.from(Object.values(TransformationCells)).map(
    (item) => ({
        display: item.name,
        defaultCellType: item.widget,
    }),
);

const AddCellOptions: Record<string, AddCellOption> = {
    code: {
        display: 'Cell',
        defaultCellType: 'code',
        icon: <Add />,
    },
    'query-import': {
        display: 'Query Import',
        defaultCellType: 'query-import',
        icon: <AccountTree />,
    },
    transformation: {
        display: 'Transformation',
        icon: <Functions />,
        options: Transformations,
    },
};

export const NotebookAddCell = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const [selectedAddCell, setSelectedAddCell] = useState<string>('');
        const open = Boolean(anchorEl);
        const { query, previousCellId = '' } = props;
        const { state, notebook } = useBlocks();

        // const cellTypeOptions = computed(() => {
        //     const options = { ...AddCellOptions };
        //     // transformation cell types can only be added if there exists a query-import cell before it
        //     if (!previousCellId) {
        //         delete options['transformation'];
        //     } else {
        //         const previousCellIndex = query.list.indexOf(previousCellId);
        //         let hasFrameVariable = false;
        //         for (let index = 0; index <= previousCellIndex; index++) {
        //             if (
        //                 query.cells[query.list[index]].config.widget ===
        //                 'query-import'
        //             ) {
        //                 hasFrameVariable = true;
        //                 break;
        //             }
        //         }
        //         if (!hasFrameVariable) {
        //             delete options['transformation'];
        //         }
        //     }

        //     return Object.values(options);
        // }).get();

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
            <Stack direction={'row'} alignItems={'center'} gap={1}>
                {Object.entries(AddCellOptions).map((add, i) => {
                    const value = add[1];
                    return (
                        <StyledButton
                            key={i}
                            title={`Add ${value.display}`}
                            variant="contained"
                            size="small"
                            disabled={query.isLoading}
                            startIcon={value.icon}
                            onClick={(e) => {
                                if (value.options) {
                                    setAnchorEl(e.currentTarget);
                                    setSelectedAddCell(add[0]);
                                } else {
                                    appendCell(value.defaultCellType);
                                }
                            }}
                        >
                            Add {value.display}
                        </StyledButton>
                    );
                })}
                <StyledDivider />
                <StyledMenu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => {
                        setAnchorEl(null);
                    }}
                >
                    {Array.from(
                        AddCellOptions[selectedAddCell]?.options || [],
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
            </Stack>
        );
    },
);
