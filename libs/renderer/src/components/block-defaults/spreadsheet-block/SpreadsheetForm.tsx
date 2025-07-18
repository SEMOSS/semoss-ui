import {
    Button,
    TextField,
    Stack,
    TextArea,
    styled,
    Autocomplete,
} from '@semoss/ui';
import { Controller} from 'react-hook-form';
import React from 'react';
import  EditableTable  from './EditableTable';

const StyledButton = styled(Button)(() => ({
    marginTop: '20px !important',
}));

type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "autocomplete";
  required?: boolean;
  options?: string[]; 
  getOptionLabel?: (option: any) => string; 
  isOptionEqualToValue?: (option: any, value: any) => boolean; 
  multiple?: boolean; 
};

interface SpreadsheetFormProps {
  control: any;
  fields: FieldConfig[];
  onSubmit: (data: any) => void;
  handleSubmit: any;
  cancel: () => void;
  formType: "create" | "update" | "delete" | "read";
  tableData: string[][] | null; 
  setTableData: React.Dispatch<React.SetStateAction<string[][]>> | null; 
}


export function SpreadsheetForm({ control, fields, onSubmit, handleSubmit, cancel, formType,tableData,setTableData }: SpreadsheetFormProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" spacing={2} style={{ paddingTop: '10px' }}>
        {fields.map((field) => (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            rules={{ required: field.required }}
            render={({ field: controllerField }) => (
              <TextField
                    label={field.label}
                    value={controllerField.value || ''}
                    onChange={controllerField.onChange}
                    fullWidth
               />
            )}
          />
        ))}
      </Stack>
      {formType === "create" && (
        <EditableTable data={tableData} setData={setTableData} tableType={formType} />
      )}
      {formType === "update" && tableData && tableData.length > 0 && (
        <EditableTable data={tableData} setData={setTableData} tableType={formType}/>
      )}

      <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
        <StyledButton type="button" onClick={cancel}>Cancel</StyledButton>
        <StyledButton type="submit" variant="contained">Submit</StyledButton>
      </Stack>
    </form>
  );
}