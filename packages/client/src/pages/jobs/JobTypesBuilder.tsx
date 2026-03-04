import { Autocomplete, Stack, TextField } from "@semoss/ui";
import { JobTypesCustomJobBuilder } from "./JobTypesCustomJobBuilder";
import { JobTypesSendEmailBuilder } from "./JobTypesSendEmailBuilder";
import {
	JobTypeCustomJob,
	JobTypeOptions,
	JobTypeSendEmail,
} from "./job.constants";
import type { JobBuilder } from "./job.types";

export const JobTypesBuilder = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { builder, setBuilderField } = props;
	return (
		<Stack spacing={2} width="100%">
			<Autocomplete
				size="small"
				multiple={false}
				options={JobTypeOptions}
				value={builder.jobType}
				renderInput={(params) => {
					return <TextField {...params} label="Job Type" />;
				}}
				fullWidth
				onChange={(_, value) => setBuilderField("jobType", value)}
			/>
			{builder.jobType === JobTypeCustomJob && (
				<JobTypesCustomJobBuilder
					builder={builder}
					setBuilderField={setBuilderField}
				/>
			)}
			{builder.jobType === JobTypeSendEmail && (
				<JobTypesSendEmailBuilder
					builder={builder}
					setBuilderField={setBuilderField}
				/>
			)}
		</Stack>
	);
};
