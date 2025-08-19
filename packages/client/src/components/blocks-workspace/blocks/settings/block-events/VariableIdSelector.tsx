import { Controller } from "react-hook-form";
import { Select } from "@semoss/ui";
import { toJS } from "mobx";

interface VariableIdSelectorProps {
    control: any;
    variables: any[];
    label?: string;
}

export const VariableIdSelector = ({
    control,
    variables,
    label = "Variable",
}: VariableIdSelectorProps) => {
    console.log('VariableIdSelector variables:', variables);
    let variableEntries = [];
    if (Array.isArray(variables)) {
        variableEntries = variables.map((v, idx) => [v.id || v.name || idx, v]);
    } else if (variables && typeof variables === 'object') {
        variableEntries = Object.entries(variables);
    }
    return (
        <Controller
            name="payload.id"
            control={control}
            render={({ field }) => (
                <Select
                    label={label}
                    value={field.value || ""}
                    onChange={field.onChange}
                >
                    {variableEntries.map(([key, variable]) => (
                        <Select.Item key={key} value={key}>
                            {key}
                        </Select.Item>
                    ))}
                </Select>
            )}
        />
    )};