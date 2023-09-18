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
    const [readOnly, setReadOnly] = useState(true);

    const smssDetails = usePixel<string>(`GetEngineSMSS(engine=['${id}'])`);

    useEffect(() => {
        if (smssDetails.status !== 'SUCCESS') {
            return;
        }

        setInitialValue(smssDetails.data);
        setValue(smssDetails.data);
    }, [smssDetails.status, smssDetails.data]);

    /**
     * @name updateSMSSProperties
     * @desc hit endpoint to update smss file
     */
    const updateSMSSProperties = () => {
        monolithStore.updateDatabaseSmssProperties(id, value).then((resp) => {
            const { data } = resp;
            if (data.success) {
                setReadOnly(true);
                setInitialValue(value);
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
                {readOnly ? (
                    <Button
                        variant="contained"
                        size={'small'}
                        onClick={() => setReadOnly(false)}
                    >
                        Edit SMSS
                    </Button>
                ) : (
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
                )}
            </StyledTopDiv>
            <StyledPaper elevation={1}>
                <Editor
                    defaultValue={''}
                    options={{ readOnly: readOnly }}
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
