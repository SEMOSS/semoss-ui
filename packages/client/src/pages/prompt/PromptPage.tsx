import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
    Button,
    Stack,
    Typography,
    TextField,
    styled,
    Box,
    Table,
    useNotification,
} from '@semoss/ui';
import { Page } from '@/components/ui';
import {
    DataGrid,
    GridColDef,
    GridToolbarContainer,
    GridToolbarFilterButton,
    GridToolbarQuickFilter,
    GridToolbar,
} from '@mui/x-data-grid';
import { useRootStore } from '@/hooks';
import { PromptModal } from './PromptModal';
import { partLayerMixins } from 'vega-lite/build/src/compositemark/common';

const StyledBox = styled(Box)(() => ({
    height: '500',
    width: '100%',
}));

export const PromptPage = observer(() => {
    const { monolithStore } = useRootStore();
    const [allPrompts, setAllPrompts] = useState([]);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptMode, setPromptMode] = useState('');
    const [promptToEdit, setPromptToEdit] = useState({});

    const handlePromptEditClick = (params) => {
        console.log(params);
        setPromptToEdit(params.row);
        setPromptMode('Edit');
        setIsPromptModalOpen(true);
    };
    const columns: GridColDef<[number]>[] = [
        {
            field: 'CONTEXT',
            headerName: 'Context',
            minWidth: 120,
            flex: 1,
        },
        {
            field: 'TITLE',
            headerName: 'Title',
            minWidth: 200,
            flex: 1,
        },
        {
            field: 'INTENT',
            headerName: 'Intent',
            minWidth: 200,
            flex: 1,
        },
        {
            field: 'tags',
            headerName: 'Tags',
            flex: 1,
        },
        {
            field: 'action',
            headerName: 'Action',
            flex: 1,
            renderCell: (params) => {
                return (
                    <div>
                        <Button
                            onClick={() => {
                                handlePromptEditClick(params);
                            }}
                        >
                            Edit
                        </Button>
                        <Button disabled={true}>Delete</Button>
                    </div>
                );
            },
        },
    ];

    //Load all the prompts
    useEffect(() => {
        init();
    }, []);

    const init = () => {
        monolithStore.runQuery('ListPrompt()').then((response) => {
            const { output } = response.pixelReturn[0];
            if (output.length > 0) {
                setAllPrompts(output);
            }
        });
    };

    return (
        <Page
            header={
                <Stack>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        spacing={4}
                    >
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={2}
                        >
                            <Typography
                                data-tour="app-library-title"
                                variant={'h4'}
                            >
                                Prompts
                            </Typography>
                        </Stack>
                        <Button
                            size={'large'}
                            variant={'contained'}
                            onClick={() => {
                                setPromptMode('Add');
                                setIsPromptModalOpen(true);
                            }}
                            aria-label={`Add Prompt`}
                        >
                            Add Prompt
                        </Button>
                    </Stack>
                </Stack>
            }
        >
            <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={allPrompts}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 5,
                            },
                        },
                    }}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                        },
                    }}
                    pageSizeOptions={[5]}
                    disableRowSelectionOnClick
                    getRowId={(row) => {
                        return row.ID
                            ? row.ID
                            : '' + row.TITLE + row.INTENT + row.CONTEXT;
                    }}
                />
            </Box>
            <PromptModal
                isOpen={isPromptModalOpen}
                prompt={promptToEdit}
                onClose={(reload) => {
                    setIsPromptModalOpen(false);
                    if (reload) {
                        init();
                    }
                }}
                mode={promptMode}
            ></PromptModal>
        </Page>
    );
});
