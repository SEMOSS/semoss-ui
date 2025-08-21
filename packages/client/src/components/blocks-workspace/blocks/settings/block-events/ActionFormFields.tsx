import { ActionMessages } from "@semoss/renderer";
import { BlockEventNameSelector } from "./BlockEventNameSelector";
import { CellIdSelector } from "./CellIdSelector";
import { QueryIdSelector } from "./QueryIdSelector";
import { RedirectDestinationSelector } from "./RedirectDestinationSelector";
import { ModifyVariableSelector } from "./ModifyVariableSelector";

interface ActionFormFieldsProps {
	message: ActionMessages;
	control: any;
	setValue: any;
	queries: any[];
	cells: any[];
	queryId: string;
	destinationType: string;
	pages: any[];
	id: string;
}

export const ActionFormFields = ({
	message,
	control,
	setValue,
	queries,
	cells,
	queryId,
	destinationType,
	pages,
	id
}: ActionFormFieldsProps) => {
	const renderFields = () => {
		switch (message) {
			case ActionMessages.RUN_QUERY:
				return <QueryIdSelector control={control} queries={queries} />;

			case ActionMessages.RUN_CELL:
				return (
					<>
						<QueryIdSelector
							control={control}
							queries={queries}
							label="Notebook"
						/>
						<CellIdSelector
							control={control}
							cells={cells}
							queryId={queryId}
						/>
					</>
				);

			case ActionMessages.DISPATCH_EVENT:
				return <BlockEventNameSelector control={control} />;

			case ActionMessages.DISPATCH_OPEN_EVENT:
				return (
					<RedirectDestinationSelector
						control={control}
						setValue={setValue}
						destinationType={destinationType}
						pages={pages}
					/>
				);

			case ActionMessages.MODIFY_VARIABLE:
				return (
					<ModifyVariableSelector
						id={id}
						control={control}
						setValue={setValue}
					 />
				)

			case ActionMessages.DISPATCH_OUTPUTS_EVENT:
				return null;

			default:
				return null;
		}
	};

	return <>{renderFields()}</>;
};
