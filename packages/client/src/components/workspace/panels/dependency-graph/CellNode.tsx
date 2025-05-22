import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { observer } from 'mobx-react-lite';

import {
    Accordion,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Stack,
    Typography,
    styled,
} from '@semoss/ui';
import { ActionMessages, useBlocks } from '@semoss/renderer';
import { PlayCircle } from '@mui/icons-material';

const StyledRunIconButton = styled(IconButton)(({ theme }) => ({
    padding: 0,
    width: '35px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
    // removes gray hover background made visible by width added to accomodate brackets
    '&:hover': {
        backgroundColor: '#00000000',
    },
}));
interface CellNodeProps {
    selected: boolean;
    data: {
        description: string;
        id: string;
        queryId: string;
    };
}

export const CellNode = observer((props: CellNodeProps) => {
    const { selected, data } = props;
    const { state } = useBlocks();

    const q = state.getQuery(data.queryId);
    const index = q.list.indexOf(data.id);
    const c = q.getCell(data.id);

    return (
        <div
            style={{
                border: selected ? '2px solid #007bff' : '1px solid #bbb',
                borderRadius: 8,
                padding: 16,
                background: '#fff',
                minWidth: 180,
                boxShadow: selected ? '0 0 6px #007bff44' : '0 1px 4px #0001',
                fontFamily: 'Roboto, sans-serif',
            }}
        >
            {/* Top handle for incoming connections */}
            <Handle type="target" position={Position.Top} id="target" />
            {/* Bottom handle for outgoing connections */}
            <Handle type="source" position={Position.Bottom} id="source" />

            <Stack>
                <Stack gap={0}>
                    <Stack direction="row" justifyContent={'space-between'}>
                        <Stack direction={'column'} gap={0}>
                            <Typography
                                variant={'body1'}
                                sx={{
                                    marginBlockStart: '0px',
                                    marginBlockEnd: '0px',
                                }}
                            >
                                {data.queryId}
                            </Typography>
                            <Typography
                                variant={'caption'}
                                sx={{ marginTop: '0px' }}
                            >
                                Cell # {index + 1}
                            </Typography>
                        </Stack>
                        {c.isLoading ? (
                            <CircularProgress size={'20px'} />
                        ) : (
                            <StyledRunIconButton
                                title="Run cell"
                                size="medium"
                                onClick={() => {
                                    console.log('click');
                                    state.dispatch({
                                        message: ActionMessages.RUN_CELL,
                                        payload: {
                                            queryId: data.queryId,
                                            cellId: data.id,
                                        },
                                    });
                                }}
                            >
                                <PlayCircle fontSize="inherit" />
                            </StyledRunIconButton>
                        )}
                    </Stack>
                    <Accordion>
                        <Accordion.Trigger>
                            <Typography variant="body1">Inputs</Typography>
                        </Accordion.Trigger>
                        <Accordion.Content>
                            Show text box and settings
                        </Accordion.Content>
                    </Accordion>
                </Stack>
                <Divider />
                <Stack>
                    <Typography variant="body2">
                        {c.output as string}
                    </Typography>
                </Stack>
            </Stack>
        </div>
    );
});
