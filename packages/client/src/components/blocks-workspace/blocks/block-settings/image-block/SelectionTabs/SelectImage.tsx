import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { BaseSettingSection } from "../../../settings";

const SelectImage = ({ data, imageFiles, setData }) => {
	const onImageChange = (selectedName: string) => {
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
				value={(data.src?.fileName ?? "") as string}
				onValueChange={onImageChange}
			>
				<SelectTrigger className="w-full" data-testid="select-image">
					<SelectValue placeholder="Select Image" />
				</SelectTrigger>
				<SelectContent>
					{imageFiles?.map((file) => (
						<SelectItem key={file.name} value={file.name}>
							{file.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</BaseSettingSection>
	);
};

export default SelectImage;
