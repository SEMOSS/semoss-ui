import type { ListenerActions, NotebookState } from "@semoss/renderer";
import {
	type Control,
	Controller,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface QueryIdSelectorProps {
	control: Control<ListenerActions>;
	notebooks: NotebookState[];
	label?: string;
}

export const QueryIdSelector = ({
	control,
	notebooks,
	label = "Notebook",
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
						{notebooks.map((notebook) => (
							<SelectItem key={notebook.id} value={notebook.id}>
								{notebook.id}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		/>
	);
};
