import { styled, Typography, TextField } from '@semoss/ui';

import { ArrowUpward } from '@mui/icons-material';
import { Background } from '@xyflow/react';

const StyledContainerDiv = styled('div')(({ theme }) => ({
    backgroundColor: '#eee',
    borderRadius: '25px',
    padding: '50px',
    marginTop: '25px',
    height: '60vh',
    width: '100%',
    position: 'relative',
}));

export const NewAIConductorPage = () => {
    return (
        <div style={{ margin: '50px' }}>
            <h1>AI Conductor</h1>
            <Typography variant="body1">Description / Instructions</Typography>
            <StyledContainerDiv>
                <TextField
                    focused={false}
                    // label={'Task'}
                    // value={''}
                    variant="outlined"
                    sx={{
                        width: '95%',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        position: 'absolute',
                        bottom: '25px',
                        left: '25px',
                    }}
                    placeholder="Type, Drag, or Speak to get started. Reminder! Use as explicit language as possible and include your audience...*"
                    InputProps={{
                        startAdornment: (
                            <span style={{ marginRight: '15px' }}>
                                <b>Task</b>
                            </span>
                        ),
                        endAdornment: <ArrowUpward />,
                    }}
                />
            </StyledContainerDiv>
        </div>
    );
};
