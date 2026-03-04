import { Select } from "@semoss/ui";
import { BaseSettingSection } from "../../../settings";

const SelectImage = ({ data, imageFiles, setData }) => {
	const onImageChange = (e) => {
		const selectedName = e.target.value;
		const selectedFile = imageFiles.find((f) => f.name === selectedName);
		if (selectedFile) {
			setData("src", {
				fileLocation: selectedFile.path,
				fileName: selectedFile.name,
			});
			setData("title", "");
		}
	};

	return (
		<BaseSettingSection label="">
			<Select
				label="Select Image"
				size="small"
				fullWidth
				value={(data.src?.fileName ?? "") as string}
				onChange={onImageChange}
				data-testid="select-image"
			>
				{imageFiles?.map((file) => (
					<Select.Item key={file.name} value={file.name}>
						{file.name}
					</Select.Item>
				))}
			</Select>
		</BaseSettingSection>
	);
};

export default SelectImage;
