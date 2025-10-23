import { useState } from "react";
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Autocomplete, Stack, TextField, Typography, createFilterOptions } from "@semoss/ui";
import type { JobBuilder } from "./job.types";
import {
    JobTypeOptions,
} from "./job.constants";

export const JobDetailsModel = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
    const { builder, setBuilderField } = props;
    const filter = createFilterOptions<string>();
    return (
        <Stack>
            <Stack direction="row" gap={5}>
                <Stack width="100%">
                    <Typography variant={"subtitle1"} color="secondary">Name</Typography>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Enter the Name"
                        autoComplete="off"
                        value={builder.name}
                        onChange={(e) =>
                            setBuilderField("name", e.target.value)
                        }
                    />
                </Stack>
                <Stack width="100%">
                    <Typography variant={"subtitle1"} color="secondary">Type</Typography>
                    <Autocomplete
                        size="small"
                        multiple={false}
                        options={JobTypeOptions}
                        value={builder.jobType}
                        renderInput={(params) => (
                            <TextField 
                                {...params}
                                placeholder="Select Job Type"
                                size="small"
                                variant="outlined"
                            />
                        )}
                        fullWidth
                        onChange={(_, value) => setBuilderField("jobType", value)}
                    />
                </Stack>
            </Stack>
            <Stack>
                 <Typography variant={"subtitle1"} color="secondary">Pixel</Typography>
                <TextField
                    placeholder="Enter Pixel"
                    size="small"
                    value={builder.pixel}
                    onChange={(e) => setBuilderField("pixel", e.target.value)}
                    multiline
                    rows={3}
                    variant="outlined"
                    InputProps={{
                        endAdornment: (
                            <OpenInFullIcon style={{ opacity: 0.7, color: "#888" }} />
                        ),
                    }}
                />
            </Stack>
            <Stack>
                 <Typography variant={"subtitle1"} color="secondary">Tags</Typography>
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
            </Stack>
        </Stack>
    );
};