import { Select, TextField } from "@semoss/ui";
import { BaseSettingSection, InputSettings } from "../../../settings";
import SelectedItem from "./SelectedItem";

const ExternalTab = ({ id, data, setData }) => (
	<>
		{data.src instanceof Object ? (
			<SelectedItem file={data.src} setData={setData} />
		) : (
			<>
				<BaseSettingSection label={"Image URL"}>
					<TextField
						fullWidth
						value={data.src ?? ""}
						onChange={(e) => {
							setData("src", e.target.value);
						}}
						type={"text"}
						size="small"
						variant="outlined"
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
						fullWidth
						value={data.unavailable ?? ""}
						onChange={(e) => {
							const value = e.target.value as string;
							setData("unavailable", value);
						}}
						size="small"
						variant="outlined"
						data-testid="image-unavailable"
					>
						<Select.Item value="placeholder">
							Add placeholder text
						</Select.Item>
						<Select.Item value="default">
							Use system default image
						</Select.Item>
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
