import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { IconButton, TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

interface InputAudioSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to pass into the input
     */
    label: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Placeholder for text field
     */
    placeholder?: string;
}

export const InputAudioSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        placeholder = '',
    }: InputAudioSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState(data.value ?? '');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const [recording, setRecording] = useState(false);
        const [transcript, setTranscript] = useState(data.value + '' ?? '');
        const [interimTranscript, setInterimTranscript] = useState('');
        const recognitionRef = useRef(null);

        useEffect(() => {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setRecording(true);
                setTranscript('');
            };
            recognition.onend = () => {
                setRecording(false);
            };
            recognition.onresult = (event) => {
                let interim = '';
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                setTranscript((prev) => prev + final);
                setInterimTranscript(interim);
            };
            recognitionRef.current = recognition;
        }, []);

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

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        useEffect(() => {
            // setData('value', transcript, true);
            onChange(transcript);
        }, [transcript]);

        const handleRecording = (stopRecording = false) => {
            if (recognitionRef.current) {
                if (recording || stopRecording) {
                    recognitionRef.current.stop();
                } else {
                    recognitionRef.current.start();
                }
            }
        };

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setValue(value);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(path, value as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <>
                <BaseSettingSection label={label}>
                    <TextField
                        fullWidth
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => {
                            // sync the data on change
                            onChange(e.target.value);
                        }}
                        type={
                            data.hasOwnProperty('type') && path === 'value'
                                ? (data.type as string)
                                : undefined
                        }
                        size="small"
                        variant="outlined"
                        autoComplete="off"
                    />
                    <IconButton size="small" onClick={() => handleRecording()}>
                        {recording ? <MicOffIcon /> : <MicIcon />}
                    </IconButton>
                </BaseSettingSection>
            </>
        );
    },
);
