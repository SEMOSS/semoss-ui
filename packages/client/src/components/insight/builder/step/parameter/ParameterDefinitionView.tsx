import { useState } from "react";
import type { FilterParameter, SavedQuery } from "../../../insight.types";
import { ParameterEditor } from "./ParameterEditor";
import { ParameterList } from "./ParameterList";

interface ParameterDefinitionViewProps {
	savedParameters: FilterParameter[];
	savedQueries: SavedQuery[];
	parameterToEdit: FilterParameter | null;
	onParameterSave: (param: FilterParameter) => void;
	onEditParameter: (param: FilterParameter | null) => void;
	onDeleteParameter: (id: string) => void;
}

export const ParameterDefinitionView = (
	props: ParameterDefinitionViewProps,
) => {
	const {
		savedParameters,
		savedQueries,
		parameterToEdit,
		onParameterSave,
		onEditParameter,
		onDeleteParameter,
	} = props;

	const [showEditor, setShowEditor] = useState(false);

	const handleAddParameter = () => {
		onEditParameter(null);
		setShowEditor(true);
	};

	const handleEditParameter = (parameter: FilterParameter) => {
		onEditParameter(parameter);
		setShowEditor(true);
	};

	const handleSaveParameter = (parameter: FilterParameter) => {
		onParameterSave(parameter);
		setShowEditor(false);
		onEditParameter(null);
	};

	const handleCancelEdit = () => {
		setShowEditor(false);
		onEditParameter(null);
	};

	return (
		<div className="flex h-full flex-col">
			{showEditor ? (
				<ParameterEditor
					parameter={parameterToEdit}
					savedParameters={savedParameters}
					savedQueries={savedQueries}
					onSave={handleSaveParameter}
					onCancel={handleCancelEdit}
				/>
			) : (
				<ParameterList
					parameters={savedParameters}
					onEdit={handleEditParameter}
					onDelete={onDeleteParameter}
					onAdd={handleAddParameter}
				/>
			)}
		</div>
	);
};
