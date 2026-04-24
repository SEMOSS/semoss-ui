import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { BaseSettingSection, InputSettings } from "../../../settings";
import SelectedItem from "./SelectedItem";

const ExternalTab = ({ id, data, setData }) => (
	<>
		{data.src instanceof Object ? (
			<SelectedItem file={data.src} setData={setData} />
		) : (
			<>
				<BaseSettingSection label={"Image URL"}>
					<Input
						value={data.src ?? ""}
						onChange={(e) => {
							setData("src", e.target.value);
						}}
						type={"text"}
						autoComplete="off"
						data-testid="image-url"
					/>
				</BaseSettingSection>
				<InputSettings
					id={id}
					label="Description"
					path="title"
					data-testid="image-description"
				/>
				<BaseSettingSection label="If Image is Unavailable">
					<Select
						value={data.unavailable ?? ""}
						onValueChange={(value) => {
							setData("unavailable", value);
						}}
					>
						<SelectTrigger
							className="w-full"
							data-testid="image-unavailable"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="placeholder">
								Add placeholder text
							</SelectItem>
							<SelectItem value="default">
								Use system default image
							</SelectItem>
						</SelectContent>
					</Select>
				</BaseSettingSection>
			</>
		)}
		{data.unavailable === "placeholder" && (
			<InputSettings
				id={id}
				label="Enter Placeholder Text"
				path="placeholderText"
				data-testid="image-placeholder-text"
			/>
		)}
	</>
);

export default ExternalTab;
