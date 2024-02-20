import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { operation } from '../clean.types';
import { operations } from '../clean.constants';

export type OperationCleanRoutineFieldComponent = (props: {
    selectedOpration: operation;
    label?: string;
    onChange: (operation: string) => void;
}) => JSX.Element;

export const OperationCleanRoutineField: OperationCleanRoutineFieldComponent =
    observer((props) => {
        const { selectedOpration, label = 'Operation', onChange } = props;

        return (
            <Autocomplete
                size="small"
                value={selectedOpration}
                fullWidth
                onChange={(_, newValue: string) => {
                    onChange(newValue);
                }}
                options={operations}
                renderInput={(params) => (
                    <TextField {...params} variant="outlined" label={label} />
                )}
            />
        );
    });
