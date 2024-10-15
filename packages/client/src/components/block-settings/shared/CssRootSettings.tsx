import { useState, useMemo, useEffect } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    IconButton,
    Modal,
    styled,
    Stack,
    Typography,
    Divider,
    Button,
} from '@semoss/ui';
import { OpenInNew, Close } from '@mui/icons-material';
import { getValueByPath } from '@/utility';
import { Paths } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef, ActionMessages } from '@/stores';
import { Editor } from '@monaco-editor/react';
import { InputSettings } from './InputSettings';
import { BaseSettingSection } from '../BaseSettingSection';

const StyledModalHeader = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

interface CssRootSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    label: string;
}

export const CssRootSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
    }: CssRootSettingsProps<D>) => {
        const { data } = useBlockSettings<D>(id);

        const [isStyleValid, setIsStyleValid] = useState(true);
        const [styleError, setStyleError] = useState('');
        const { state } = useBlocks();
        const [styleText, setStyleText] = useState(state.getRootStyle());

        // track the value
        const [value, setValue] = useState('{}');
        // track the modal
        const [open, setOpen] = useState(false);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);

                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();

        // update the value if the computed one is diffecent from the current one
        useEffect(() => {
            if (computedValue?.length && computedValue !== value) {
                setValue(computedValue);
            }
        }, [computedValue, data]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            setStyleText(value);
        };

        /**
         * Validate the editor and update the style
         */
        const handleUpdateStyle = () => {
            state.dispatch({
                message: ActionMessages.ADD_ROOT_STYLE,
                payload: {
                    style: styleText,
                },
            });
            setOpen(false);
        };

        /**
         * Handle editor validation
         * @param markers
         */
        function handleEditorValidation(markers) {
            // model markers
            if (markers?.length) {
                setIsStyleValid(false);
                markers.forEach((marker) => setStyleError(marker.message));
            } else {
                setIsStyleValid(true);
                setStyleError('');
            }
        }

        return (
            <>
                <InputSettings id={id} label={label} path={path} />
                <BaseSettingSection label={'Edit root css'}>
                    <IconButton size="small" onClick={() => setOpen(true)}>
                        <OpenInNew />
                    </IconButton>
                </BaseSettingSection>
                <Modal open={open} fullWidth maxWidth={'lg'}>
                    <StyledModalHeader>
                        <Typography variant="h5">{`Edit root css`}</Typography>
                        <IconButton onClick={() => setOpen(false)}>
                            <Close />
                        </IconButton>
                    </StyledModalHeader>
                    <Divider />
                    <Modal.Content>
                        <Editor
                            key={id}
                            width={'100%'}
                            height={'40vh'}
                            value={styleText}
                            language="css"
                            options={{
                                lineNumbers: 'on',
                                readOnly: false,
                                minimap: { enabled: false },
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                lineHeight: 19,
                                overviewRulerBorder: false,
                            }}
                            onChange={onChange}
                            onValidate={handleEditorValidation}
                        />
                        {!!styleError.length && (
                            <Typography variant="caption" color="error">
                                {styleError}
                            </Typography>
                        )}
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="flex-end"
                            spacing={2}
                        >
                            <Button
                                onClick={handleUpdateStyle}
                                variant="contained"
                                disabled={!isStyleValid}
                            >
                                Save
                            </Button>
                        </Stack>
                    </Modal.Content>
                </Modal>
            </>
        );
    },
);
