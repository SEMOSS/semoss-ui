import { Controller } from "react-hook-form";
import { Select } from "@semoss/ui";

interface QueryIdSelectorProps {
	control: any;
	queries: any[];
	label?: string;
}

export const QueryIdSelector = ({
	control,
	queries,
	label = "Query",
}: QueryIdSelectorProps) => {
	return (
		<Controller
			name="payload.queryId"
			control={control}
			render={({ field }) => (
				<Select
					label={label}
					value={field.value || ""}
					onChange={field.onChange}
				>
					{queries.map((query: any) => (
						<Select.Item key={query.id} value={query.id}>
							{query.id}
						</Select.Item>
					))}
				</Select>
			)}
		/>
	);
};
