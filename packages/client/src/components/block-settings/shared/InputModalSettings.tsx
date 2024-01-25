import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    Divider,
    IconButton,
    Modal,
    Stack,
    TextField,
    Typography,
    styled,
} from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { Close, OpenInNew } from '@mui/icons-material';

interface InputModalSettingsProps<D extends BlockDef = BlockDef> {
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

const StyledModalHeader = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

export const InputModalSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        placeholder = '',
    }: InputModalSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState('');
        // track the modal
        const [open, setOpen] = useState(false);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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

        console.log(id, path, value);

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
                    <IconButton size="small" onClick={() => setOpen(true)}>
                        <OpenInNew />
                    </IconButton>
                </BaseSettingSection>
                <Modal
                    open={open}
                    fullWidth
                    maxWidth={
                        data.hasOwnProperty('type') && data.type === 'date'
                            ? 'sm'
                            : 'lg'
                    }
                >
                    <StyledModalHeader>
                        <Typography variant="h5">{`Edit ${label}`}</Typography>
                        <IconButton onClick={() => setOpen(false)}>
                            <Close />
                        </IconButton>
                    </StyledModalHeader>
                    <Divider />
                    <Modal.Content>
                        <TextField
                            fullWidth
                            placeholder={placeholder}
                            multiline
                            rows={
                                data.hasOwnProperty('type') &&
                                data.type === 'date'
                                    ? 1
                                    : 15
                            }
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
                    </Modal.Content>
                </Modal>
            </>
        );
    },
);
