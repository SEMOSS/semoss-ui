import { FileDropzone } from '@semoss/ui';

export const UploadData = (props) => {
    const { selectedValues, setSelectedValues } = props;

    return (
        <FileDropzone
            value={selectedValues}
            onChange={(newValues) => {
                setSelectedValues(newValues);
            }}
        />
    );
};
