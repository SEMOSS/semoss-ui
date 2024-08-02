import {
    Typography,
    styled,
    IconButton,
    Button,
    InputAdornment,
    Stack,
    TextField,
} from '@semoss/ui';
import { AIConductorTasklist } from '@/components/app';
import { usePixel, useRootStore } from '@/hooks';
import { useEffect, useState, useReducer } from 'react';

const StyledOuterContentContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    gap: theme.spacing(1),
    overflowY: 'scroll',
    position: 'relative',
}));

const StyledTitleContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
}));

const StyledMainContentContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
}));

const StyledInputContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '40px',
}));

export const Conductor = () => {
    const { configStore, monolithStore } = useRootStore();
    const [prompt, setPrompt] = useState('');
    const [goal, setGoal] = useState('');

    return (
        <StyledOuterContentContainer>
            <StyledTitleContainer>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent={'flex-start'}
                    spacing={0.5}
                    minHeight="32px"
                >
                    <Typography variant={'h3'}>AI Conductor</Typography>
                </Stack>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent={'flex-start'}
                    spacing={0.5}
                    minHeight="32px"
                >
                    <Typography variant={'subtitle1'}>
                        Description/instruction
                    </Typography>
                </Stack>
            </StyledTitleContainer>

            <StyledMainContentContainer>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    minHeight="32px"
                >
                    <AIConductorTasklist prompt={goal}></AIConductorTasklist>
                </Stack>
            </StyledMainContentContainer>

            <StyledInputContainer>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    minHeight="32px"
                >
                    <TextField
                        focused={false}
                        label={'Chat with the conductor...'}
                        variant={'outlined'}
                        sx={{ width: '100%' }}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        onClick={() => {
                                            setGoal(prompt);
                                        }}
                                    >
                                        Send
                                    </Button>
                                </InputAdornment>
                            ),
                        }}
                    ></TextField>
                </Stack>
            </StyledInputContainer>
        </StyledOuterContentContainer>
    );
};
