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
  type?: "text" | "textarea";
  required?: boolean;
};

interface SpreadsheetFormProps {
  control: any;
  fields: FieldConfig[];
  onSubmit: (data: any) => void;
  handleSubmit: any;
  reset: () => void;
}


export function SpreadsheetForm({ control, fields, onSubmit, handleSubmit, reset }: SpreadsheetFormProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" spacing={2} style={{ paddingTop: '10px' }}>
        {fields.map((field) => (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            rules={{ required: field.required }}
            render={({ field: controllerField }) =>
              field.type === "textarea" ? (
                <TextArea
                  label={field.label}
                  variant="outlined"
                  value={controllerField.value || ''}
                  onChange={controllerField.onChange}
                  rows={3}
                />
              ) : (
                <TextField
                  label={field.label}
                  value={controllerField.value || ''}
                  onChange={controllerField.onChange}
                  fullWidth
                />
              )
            }
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