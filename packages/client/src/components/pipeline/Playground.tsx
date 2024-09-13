import {
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    styled,
} from '@semoss/ui';

import { Mic, Send } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useConductor } from '@/hooks';
import { useState } from 'react';

const AgentMessage = styled('div')(({ theme }) => ({
    backgroundColor: '#e0e0e0', // Grey
    color: 'black',
    padding: '10px 15px',
    borderRadius: '20px',
    maxWidth: '80%',
    margin: '10px 0',
    alignSelf: 'flex-end',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    fontSize: '16px',
}));

const UserMessage = styled('div')(({ theme }) => ({
    backgroundColor: '#2196F3', // Material Blue
    color: 'white',
    padding: '10px 15px',
    borderRadius: '20px',
    maxWidth: '80%',
    margin: '10px 0',
    alignSelf: 'flex-start',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    fontSize: '16px',
}));

export const Playground = observer(() => {
    const { conductor } = useConductor();
    const [chatInput, setChatInput] = useState('');

    return (
        <Stack direction={'column'} sx={{ height: '100%' }}>
            <Grid container sx={{ height: '100%' }}>
                <Grid item xs={2.5}>
                    User Input interactive panel, pull this from our context
                    (will be important to fill this into app nodes)
                </Grid>
                <Grid item xs={9.5}>
                    <Stack
                        direction={'column'}
                        gap={1}
                        sx={{ width: '100%', height: '90%' }}
                    >
                        <UserMessage>{conductor.chat_input}</UserMessage>
                        {conductor.chat_input && (
                            <AgentMessage>
                                {
                                    'Pass user entry from above through our pipeline, we will show what gets generated from our pipeline'
                                }
                            </AgentMessage>
                        )}
                    </Stack>
                    <Stack
                        direction={'row'}
                        sx={{ width: '100%', height: '10%' }}
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <TextField
                            label={'Question'}
                            sx={{ width: '95%' }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="start">
                                        <Mic />
                                    </InputAdornment>
                                ),
                            }}
                            value={chatInput}
                            onChange={(e) => {
                                setChatInput(e.target.value);
                            }}
                        />
                        <IconButton
                            onClick={() => {
                                conductor.setChatInput(chatInput);
                            }}
                        >
                            <Send />
                        </IconButton>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    );
});
