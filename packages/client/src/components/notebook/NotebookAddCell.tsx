import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Button, Divider, MenuProps, Menu, Stack } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import {
    ActionMessages,
    CellStateConfig,
    NewCellAction,
    QueryState,
} from '@/stores';
import {
    ChangeCircleOutlined,
    Code,
    ImportExport,
    KeyboardArrowDown,
    KeyboardArrowUp,
    TextFields,
} from '@mui/icons-material';
import {
    DefaultCellDefinitions,
    DefaultCells,
    TransformationCells,
} from '@/components/cell-defaults';
import { QueryImportCellConfig } from '../cell-defaults/query-import-cell';
import { CodeCellConfig } from '../cell-defaults/code-cell';
import { DataImportFormModal } from './DataImportFormModal';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

const StyledDivider = styled(Divider)(() => ({
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

const StyledBorderDiv = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.secondary.main}`,
    padding: '8px 16px',
    borderRadius: '8px',
}));

interface AddCellOption {
    display: string;
    icon: React.ReactNode;
    defaultCellType?: DefaultCellDefinitions['widget'];
    options?: {
        display: string;
        defaultCellType: DefaultCellDefinitions['widget'];
    }[];
    disabled?: boolean;
}

const Transformations = Array.from(Object.values(TransformationCells)).map(
    (item) => {
        return {
            display: item.name,
            defaultCellType: item.widget,
        };
    },
);

const DataImportDropdownOptions = [
    {
        display: `From Data Catalog`,
        defaultCellType: null,
    },
    {
        display: `From CSV`,
        defaultCellType: null,
    },
];

const AddCellOptions: Record<string, AddCellOption> = {
    code: {
        display: 'Cell',
        defaultCellType: 'code',
        icon: <Code />,
    },
    'query-import': {
        display: 'Query Import',
        defaultCellType: 'query-import',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
            >
                <g clipPath="url(#clip0_2378_103062)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 3C7.58 3 4 4.79 4 7V17C4 19.21 7.59 21 12 21C16.41 21 20 19.21 20 17V7C20 4.79 16.42 3 12 3ZM18 17C18 17.5 15.87 19 12 19C8.13 19 6 17.5 6 17V14.77C7.61 15.55 9.72 16 12 16C14.28 16 16.39 15.55 18 14.77V17ZM18 12.45C16.7 13.4 14.42 14 12 14C9.58 14 7.3 13.4 6 12.45V9.64C7.47 10.47 9.61 11 12 11C14.39 11 16.53 10.47 18 9.64V12.45ZM12 9C8.13 9 6 7.5 6 7C6 6.5 8.13 5 12 5C15.87 5 18 6.5 18 7C18 7.5 15.87 9 12 9Z"
                        fill="#666666"
                    ></path>
                </g>
                <defs>
                    <clipPath id="clip0_2378_103062">
                        <rect width="24" height="24" fill="#666666"></rect>
                    </clipPath>
                </defs>
            </svg>
        ),
    },
    transformation: {
        display: 'Transformation',
        icon: <ChangeCircleOutlined />,
        options: Transformations,
    },
    'import-data': {
        display: 'Import Data',
        icon: <ImportExport />,
        options: DataImportDropdownOptions,
        disabled: false,
    },
    text: {
        display: 'Text',
        icon: <TextFields />,
        disabled: true,
    },
};

export const NotebookAddCell = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const [selectedAddCell, setSelectedAddCell] = useState<string>('');
        const [isDataImportModalOpen, setIsDataImportModalOpen] =
            useState<boolean>(false);
        const open = Boolean(anchorEl);
        const { query, previousCellId = '' } = props;
        const { state, notebook } = useBlocks();

        /** Create a New Cell and Add to Notebook */
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
                {/* Dropdown for All Add Cell Option Sets */}

                <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <StyledDivider />
                    <StyledBorderDiv>
                        {AddCellOptions &&
                            Object.entries(AddCellOptions).map((add, i) => {
                                const value = add[1];
                                return (
                                    <StyledButton
                                        key={i}
                                        title={`${value.display}`}
                                        variant="contained"
                                        size="small"
                                        disabled={
                                            query.isLoading || value.disabled
                                        }
                                        startIcon={value.icon}
                                        onClick={(e) => {
                                            if (value.options) {
                                                setAnchorEl(e.currentTarget);
                                                setSelectedAddCell(add[0]);
                                            } else {
                                                appendCell(
                                                    value.defaultCellType,
                                                );
                                            }
                                        }}
                                        endIcon={
                                            Array.isArray(value.options) &&
                                            (selectedAddCell == add[0] &&
                                            open ? (
                                                <KeyboardArrowDown />
                                            ) : (
                                                <KeyboardArrowUp />
                                            ))
                                        }
                                    >
                                        {value.display}
                                    </StyledButton>
                                );
                            })}
                    </StyledBorderDiv>
                    <StyledDivider />
                    <StyledMenu
                        anchorEl={anchorEl}
                        open={
                            open &&
                            !!AddCellOptions[selectedAddCell]?.options?.length
                        }
                        onClose={() => {
                            setAnchorEl(null);
                        }}
                    >
                        {selectedAddCell === 'transformation' &&
                            Array.from(
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

                        {selectedAddCell === 'import-data' && (
                            <>
                                {Array.from(
                                    AddCellOptions[selectedAddCell]?.options ||
                                        [],
                                    ({ display }, index) => {
                                        return (
                                            <StyledMenuItem
                                                key={index}
                                                value={display}
                                                disabled={display == 'From CSV'} // temporary
                                                onClick={() => {
                                                    setIsDataImportModalOpen(
                                                        true,
                                                    );
                                                    setAnchorEl(null);
                                                }}
                                            >
                                                {display}
                                            </StyledMenuItem>
                                        );
                                    },
                                )}
                            </>
                        )}
                    </StyledMenu>
                </Stack>

                {isDataImportModalOpen && (
                    <DataImportFormModal
                        setIsDataImportModalOpen={setIsDataImportModalOpen}
                        query={query}
                        previousCellId={previousCellId}
                        cell={null}
                        editMode={false}
                    />
                )}
            </>
        );
    },
);
