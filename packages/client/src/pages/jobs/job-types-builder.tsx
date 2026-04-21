import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	JobTypeCustomJob,
	JobTypeOptions,
	JobTypeSendEmail,
} from "./job.constants";
import type { JobBuilder } from "./job.types";
import { JobTypesCustomJobBuilder } from "./job-types-custom-job-builder";
import { JobTypesSendEmailBuilder } from "./job-types-send-email-builder";

export const JobTypesBuilder = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { builder, setBuilderField } = props;
	return (
		<div className="flex w-full flex-col gap-4">
			<Select
				value={builder.jobType}
				onValueChange={(val) => setBuilderField("jobType", val)}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Job Type" />
				</SelectTrigger>
				<SelectContent>
					{JobTypeOptions.map((opt) => (
						<SelectItem key={opt} value={opt}>
							{opt}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
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
		</div>
	);
};
