import { useState } from 'react';
import { TextArea, Typography } from '@semoss/ui';
import { styled } from '@semoss/ui';

interface UpdateSMSSProps {
    id: string;
}

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
}));

const StyledDiv = styled('div')(({ theme }) => ({
    width: '100%',
}));

const StyledTextarea = styled(TextArea)(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(1),
}));

export const UpdateSMSS = (props: UpdateSMSSProps) => {
    const [value, setValue] = useState('');
    return (
        <StyledContainer>
            <Typography variant={'h6'}>Update SMSS</Typography>
            <StyledDiv>
                <StyledTextarea
                    value={''}
                    minRows={2}
                    maxRows={6}
                    placeholder=""
                    label="SMSS"
                    onChange={(e) => {
                        setValue(e.target.value);
                    }}
                    id="outlined-textarea"
                />
            </StyledDiv>
        </StyledContainer>
    );
};
