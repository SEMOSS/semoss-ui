import { useState, useEffect } from 'react';
import { styled, useNotification, Button, Paper, Typography } from '@semoss/ui';
import Editor from '@monaco-editor/react';
import { useRootStore, usePixel } from '@/hooks';

interface UpdateSMSSProps {
    id: string;
}

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: theme.spacing(3),
}));

const StyledTopDiv = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    height: '360px',
    paddingTop: '1rem',
}));

export const UpdateSMSS = (props: UpdateSMSSProps) => {
    const { id } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [initialValue, setInitialValue] = useState('');
    const [value, setValue] = useState('');

    const smssDetails = usePixel(`GetDatabaseSMSS(database=['${id}'])`);

    useEffect(() => {
        if (smssDetails.status !== 'SUCCESS') {
            return;
        }
        let stringToDisplay = '';

        Object.entries(smssDetails.data).forEach((val) => {
            stringToDisplay += `${val[0]} ${val[1]}\n`;
        });

        setInitialValue(stringToDisplay);
        setValue(stringToDisplay);
    }, [smssDetails.status, smssDetails.data]);

    /**
     * @name updateSMSSProperties
     * @desc hit endpoint to update smss file
     */
    const updateSMSSProperties = () => {
        monolithStore.updateDatabaseSmssProperties(id, value).then((resp) => {
            const { data } = resp;
            if (data.success) {
                notification.add({
                    color: 'success',
                    message: 'Successfully updated SMSS Properties',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: 'Unsuccessfully updated SMSS Properties',
                });
            }
        });
    };

    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>SMSS Properties</Typography>
                <Button
                    variant={'contained'}
                    size={'small'}
                    disabled={initialValue === value}
                    onClick={() => {
                        updateSMSSProperties();
                    }}
                >
                    Update SMSS
                </Button>
            </StyledTopDiv>
            <StyledPaper elevation={1}>
                <Editor
                    defaultValue={''}
                    value={value}
                    language={'plaintext'}
                    onChange={(newValue, e) => {
                        // Handle changes in the editor's content.
                        setValue(newValue);
                    }}
                />
            </StyledPaper>
        </StyledContainer>
    );
};
