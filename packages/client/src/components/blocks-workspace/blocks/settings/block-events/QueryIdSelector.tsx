import { type Control, Controller } from "react-hook-form";
import type { ListenerActions, QueryState } from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface QueryIdSelectorProps {
	control: Control<ListenerActions>;
	queries: QueryState[];
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
					value={field.value || ""}
					onValueChange={field.onChange}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={label} />
					</SelectTrigger>
					<SelectContent>
						{queries.map((query) => (
							<SelectItem key={query.id} value={query.id}>
								{query.id}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		/>
	);
};
