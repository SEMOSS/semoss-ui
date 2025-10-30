import { useEffect, useState } from "react";
import { FileDropzone } from "./FileDropzone";

export default {
	title: "Components/FileDropzone",
	component: FileDropzone,
	argTypes: {},
};

/* Stories */
const Template = (args) => {
	const { value, onChange, ...otherArgs } = args;
	const [selectedValues, setSelectedValues] = useState(value);

	useEffect(() => {
		setSelectedValues(value);
	}, [value]);

	return (
		<FileDropzone
			value={selectedValues}
			onChange={(newValues) => {
				setSelectedValues(newValues);
				onChange(newValues);
			}}
			{...otherArgs}
		/>
	);
};

// Default
export const Default = Template.bind({});

Default.args = {
	onChange: () => null,
	value: null,
};

export const Disabled = Template.bind({});

Disabled.args = {
	...Default.args,
	disabled: true,
};

export const Multiple = Template.bind({});

Multiple.args = {
	...Default.args,
	multiple: true,
	value: [],
};
