import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import {
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Field,
  FieldContent,
  FieldLabel,
} from "@semoss/ui/next";
import { Autocomplete, TextField, createFilterOptions } from "@semoss/ui";

import type { JobBuilder } from "./job.types";
import { JobTypeOptions } from "./job.constants";

export const JobDetailsModel = (props: {
  builder: JobBuilder;
  setBuilderField: (field: string, value: string | string[]) => void;
  setPixelOpen: (open: boolean) => void;
}) => {
  const { builder, setBuilderField, setPixelOpen } = props;
  const filter = createFilterOptions<string>();

  return (
    <div className="flex flex-col gap-6">

      <div className="flex gap-5">

        <Field className="w-full">
          <FieldLabel>Name</FieldLabel>
          <FieldContent>
            <Input
              placeholder="Enter the Name"
              value={builder.name}
              onChange={(e) => setBuilderField("name", e.target.value)}
            />
          </FieldContent>
        </Field>

        <Field className="w-full">
          <FieldLabel>Type</FieldLabel>
          <FieldContent>
            <Select
              value={builder.jobType}
              onValueChange={(value) =>
                setBuilderField("jobType", value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Job Type" />
              </SelectTrigger>
              <SelectContent>
                {JobTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

      </div>

      <Field>
        <FieldLabel>Pixel</FieldLabel>
        <FieldContent>
          <div
            className="relative w-full cursor-pointer"
            onClick={() => setPixelOpen(true)}
          >
            <Textarea
              placeholder="Enter Pixel"
              value={builder.pixel}
              onChange={(e) =>
                setBuilderField("pixel", e.target.value)
              }
              rows={3}
            />
            <OpenInFullIcon className="absolute right-2 bottom-2 text-gray-400 opacity-70" />
          </div>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>Tags</FieldLabel>
        <FieldContent>
        <Autocomplete
                    value={(builder.tags as string[]) ?? []}
                    fullWidth
                    multiple
                    size="small"
                    onChange={(_, newValue) => {
                        setBuilderField("tags", newValue.flat());
                    }}
                    filterOptions={(options: string[], params) => {
                        const filtered = filter(options, params);

                        const { inputValue } = params;
                        const isExisting = options.some(
                            (option) => inputValue === option,
                        );
                        if (inputValue !== "" && !isExisting) {
                            filtered.push(inputValue);
                        }

                        return filtered;
                    }}
                    options={[]}
                    renderOption={(props, option) => <li {...props}>{option}</li>}
                    freeSolo
                    renderInput={(params) => <TextField {...params} placeholder="Enter tags" />}
                />
        </FieldContent>
      </Field>

    </div>
  );
};