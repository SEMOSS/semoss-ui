import { useState, useEffect } from 'react';
import {
    styled,
    useNotification,
    Button,
    Paper,
    Typography,
} from '@/component-library';
import Editor from '@monaco-editor/react';

import { useRootStore, usePixel, useSettings } from '@/hooks';
import { SETTINGS_MODE } from './settings.types';

interface UpdateSMSSProps {
    /**
     * Mode of setting
     */
    mode: SETTINGS_MODE;

    /**
     * Id of the setting
     */
    id: string;
}

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: theme.spacing(3),
}));

const StyledTopDiv = styled('div')(() => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledPaper = styled(Paper)(() => ({
    height: '360px',
    paddingTop: '1rem',
}));

export const UpdateSMSS = (props: UpdateSMSSProps) => {
    const { mode, id } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    const [initialValue, setInitialValue] = useState('');
    const [value, setValue] = useState('');
    const [readOnly, setReadOnly] = useState(true);

    const smssDetails = usePixel<string>(
        mode === 'engine'
            ? adminMode
                ? `AdminGetEngineSMSS(engine=['${id}'])`
                : `GetEngineSMSS(engine=['${id}'])`
            : mode === 'app'
            ? adminMode
                ? `AdminGetProjectSMSS(project=['${id}'])`
                : `GetProjectSMSS(project=['${id}'])`
            : '',
    );

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
                    message: `Successfully updated SMSS Properties`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Unable to update SMSS Properties for`,
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
                    onChange={(newValue) => {
                        // Handle changes in the editor's content.
                        setValue(newValue);
                    }}
                />
            </StyledPaper>
        </StyledContainer>
    );
};
