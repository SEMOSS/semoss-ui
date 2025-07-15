import {
    Button,
    TextField,
    Stack,
    TextArea,
    styled,
    Autocomplete,
    Modal,
    Typography
} from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';
const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: '20px !important',
}));


type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "autocomplete";
  required?: boolean;
  options?: string[]; // for autocomplete
  getOptionLabel?: (option: any) => string; // for autocomplete
  isOptionEqualToValue?: (option: any, value: any) => boolean; // for autocomplete
  multiple?: boolean; // for autocomplete
};

interface SpreadsheetFormProps {
  control: any;
  fields: FieldConfig[];
  onSubmit: (data: any) => void;
  handleSubmit: any;
  reset: () => void;
  onSheetNameChange?: (newValue: any) => void; // Optional callback for sheet name change
}


export function SpreadsheetForm({ control, fields, onSubmit, handleSubmit, reset,onSheetNameChange }: SpreadsheetFormProps) {
  console.log('update form rendered',control);
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" spacing={2} style={{ paddingTop: '10px' }}>
        {fields.map((field) => (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            rules={{ required: field.required }}
            render={({ field: controllerField }) => {
              if (field.type === "textarea") {
                return (
                  <TextArea
                    label={field.label}
                    variant="outlined"
                    value={controllerField.value || ''}
                    onChange={controllerField.onChange}
                    rows={3}
                  />
                );
              } else if (field.type === "autocomplete") {
                // Only call onSheetNameChange for the 'SHEET_NAME' field
                return (
                  <Autocomplete
                    options={field.options || []}
                    multiple={field.multiple}
                    getOptionLabel={field.getOptionLabel || ((option) => option)}
                    isOptionEqualToValue={field.isOptionEqualToValue || ((option, value) => option === value)}
                    value={controllerField.value || (field.multiple ? [] : null)}
                    onChange={(_event, newValue) => {
                      controllerField.onChange(newValue);
                      if (field.name === 'SHEET_NAME' && typeof onSheetNameChange === 'function') {
                        onSheetNameChange(newValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={field.label}
                        fullWidth
                      />
                    )}
                  />
                );
              } else {
                return (
                  <TextField
                    label={field.label}
                    value={controllerField.value || ''}
                    onChange={controllerField.onChange}
                    fullWidth
                  />
                );
              }
            }}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
        <StyledButton type="button" onClick={reset}>Reset</StyledButton>
        <StyledButton type="submit" variant="contained">Submit</StyledButton>
      </Stack>
    </form>
  );
}