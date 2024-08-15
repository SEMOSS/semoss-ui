import { CSSProperties, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { LinearProgress, TextField, styled } from '@mui/material';
import { debounced } from '@/utility';

const StyledTextField = styled(TextField)({
    '& .MuiFormLabel-root.MuiInputLabel-root': {
        top: 'auto',
        left: 'auto',
    },
});
export interface UploadBlockDef extends BlockDef<'upload'> {
    widget: 'upload';
    data: {
        style: CSSProperties;
        label: string;
        value: string | number;
        required: boolean;
        loading: boolean;
        disabled: boolean;
        hint?: string;
    };
}

export const UploadBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, uploadFile, listeners } =
        useBlock<UploadBlockDef>(id);
    const [changedValue, setChangedValue] = useState(false);

    /**
     * Upload a file to the server
     * @param file - file to upload to the server
     * @returns
     */
    const upload = async (file: File) => {
        if (!file) {
            // clear the value
            setData('value', '');
            return;
        }

        try {
            // start the loading screen
            setData('loading', true);

            // upload the file
            const uploadedFiles = await uploadFile(file);

            // ignore if false is returned
            if (!uploadedFiles) {
                return;
            }

            // get the location.
            const { fileLocation } = uploadedFiles[0];
            if (!fileLocation) {
                throw new Error('Missing File Location');
            }

            // save it as the value
            setData('value', fileLocation);
        } catch (e) {
            console.error(e);
        } finally {
            // stop the loading screen
            setData('loading', false);
        }
    };

    const debouncedCallback = debounced(() => {
        listeners.onChange();
    }, 200);

    return (
        <StyledTextField
            size="small"
            defaultValue={''}
            label={data.label}
            rows={1}
            multiline={false}
            required={data.required}
            disabled={data?.disabled || data.loading}
            helperText={
                data.loading ? <LinearProgress color="primary" /> : data?.hint
            }
            style={{
                ...data.style,
            }}
            InputLabelProps={{
                shrink: true,
            }}
            type={'file'}
            onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                // upload the new file on change
                upload(files[0]);
                debouncedCallback();
            }}
            {...attrs}
        />
    );
});
