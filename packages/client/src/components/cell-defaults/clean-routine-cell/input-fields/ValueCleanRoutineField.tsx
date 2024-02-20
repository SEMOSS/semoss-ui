import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';

export type ValueCleanRoutineFieldComponent = (props: {
    value: string;
    valueDatabaseType: string;
    label: string;
    onChange: (newValue: string) => void;
}) => JSX.Element;

export const ValueCleanRoutineField: ValueCleanRoutineFieldComponent = observer(
    (props) => {
        const { value, valueDatabaseType, label, onChange } = props;

        const getTextFieldTypeForDatabaseType = (): string => {
            switch (valueDatabaseType) {
                case 'INT':
                case 'DOUBLE':
                case 'DECIMAL':
                    return 'number';
                case 'DATE':
                    return 'date';
                case 'TIME':
                    return 'time';
                default:
                    return 'text';
            }
        };

        return (
            <TextField
                onChange={(e) => onChange(e.target.value)}
                variant="outlined"
                label={label}
                value={value}
                type={getTextFieldTypeForDatabaseType()}
            />
        );
    },
);
