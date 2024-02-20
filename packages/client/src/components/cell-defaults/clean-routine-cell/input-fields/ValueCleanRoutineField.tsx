import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { TextField } from '@semoss/ui';

export type ValueCleanRoutineFieldComponent = (props: {
    value: string;
    valueDatabaseType: string;
    label: string;
    disabled?: boolean;
    onChange: (newValue: string) => void;
}) => JSX.Element;

export const ValueCleanRoutineField: ValueCleanRoutineFieldComponent = observer(
    (props) => {
        const {
            value,
            valueDatabaseType,
            label,
            disabled = false,
            onChange,
        } = props;

        const textFieldType: string = computed(() => {
            console.log(valueDatabaseType);
            switch (valueDatabaseType) {
                case 'INT':
                case 'DOUBLE':
                case 'DECIMAL':
                case 'NUMBER':
                    return 'number';
                case 'DATE':
                    return 'date';
                case 'TIME':
                    return 'time';
                default:
                    return 'text';
            }
        }).get();

        return (
            <TextField
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                variant="outlined"
                label={label}
                value={value}
                fullWidth
                size="small"
                InputLabelProps={{
                    shrink: ['text', 'number'].includes(textFieldType)
                        ? !!value
                        : true,
                }}
                type={textFieldType}
            />
        );
    },
);
