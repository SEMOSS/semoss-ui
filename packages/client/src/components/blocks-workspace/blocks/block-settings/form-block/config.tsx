import { HighlightAlt } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useBlocks } from "@semoss/renderer";
import { ContainerLayoutSettings, SelectSettings } from "../../settings";
import { SelectInputSettings } from "../../settings/shared/SelectInputSettings";
import { SizeSettings } from "../../settings/shared/SizeSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import {
	buildBorderSection,
	buildColorSection,
	buildDimensionsSection,
	buildListener,
	buildShadowSection,
	buildSpacingSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";
import { FieldSettings } from "./fields";

const FormLayoutSettings = observer(({ id }: { id: string }) => {
	const { state } = useBlocks();
	const block = state.getBlock(id);

	// Default to empty so "manual" is NOT selected
	const type = block?.data?.type || "";
	console.log(type, "type");

	const isManual = type === "manual";

	return (
		<div>
			<SelectInputSettings
				id={id}
				path="type"
				label="Select Type"
				options={[
					{ value: "manual", display: "Manual" },
					{ value: "create", display: "Create" },
					{ value: "read", display: "Read" },
					{ value: "update", display: "Update" },
					{ value: "delete", display: "Delete" },
				]}
			/>

			{/* Hide only when user explicitly picks Manual */}
			{!isManual && (
				<>
					<SelectInputSettings
						id={id}
						path="database"
						label="Select Database"
						options={[
							{ value: "manual", display: "Manual" },
							{ value: "create", display: "Create" },
							{ value: "read", display: "Read" },
							{ value: "update", display: "Update" },
							{ value: "delete", display: "Delete" },
						]}
					/>

					<SelectInputSettings
						id={id}
						path="table"
						label="Select Table"
						options={[
							{ value: "manual", display: "Manual" },
							{ value: "create", display: "Create" },
							{ value: "read", display: "Read" },
							{ value: "update", display: "Update" },
							{ value: "delete", display: "Delete" },
						]}
					/>

					<SelectSettings
						id={id}
						path="column"
						label="Select Column"
						options={["GET", "POST", "PUT"]}
						multiple={true}
					/>
				</>
			)}
		</div>
	);
});

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: HighlightAlt,
	contentMenu: [
		// {
		//     name: "Conditional",
		//     children: [...buildShowField()],
		// },
		// {
		//     name: "Loading",
		//     children: [
		//         {
		//             description: "Show Loading",
		//             render: ({ id }) => <ShowLoadingSettings id={id} />,
		//         },
		//     ],
		// },
		{
			name: "Form",
			children: [
				{
					description: "Form Layout",
					render: ({ id }) => <FormLayoutSettings id={id} />,
				},
			],
		},
		{
			name: "Fields",
			children: [
				{
					description: "Show Loading",
					render: ({ id }) => (
						<FieldSettings id={id} path={"fields"} />
					),
				},
			],
		},
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
		{
			name: "On Submit",
			children: [...buildListener("onSubmit")],
		},
	],
	styleMenu: [
		{
			name: "Layout",
			children: [
				{
					description: "Layout",
					render: ({ id }) => <ContainerLayoutSettings id={id} />,
				},
			],
		},
		{
			name: "Position",
			children: [
				{
					description: "Position",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							path="style.position"
							label="Position"
							options={[
								{ value: "static", display: "Static" },
								{ value: "relative", display: "Relative" },
								{ value: "absolute", display: "Absolute" },
								{ value: "fixed", display: "Fixed" },
								{ value: "sticky", display: "Sticky" },
							]}
						/>
					),
				},
				{
					description: "Top",
					render: ({ id }) => (
						<SizeSettings id={id} label="Top" path="style.top" />
					),
				},
				{
					description: "Z-Index",
					render: ({ id }) => (
						<SizeSettings
							id={id}
							label="Z-Index"
							path="style.zIndex"
						/>
					),
				},
				{
					description: "Overflow",
					render: ({ id }) => (
						<SelectInputSettings
							id={id}
							path="style.overflow"
							label="Overflow"
							options={[
								{ value: "visible", display: "Visible" },
								{ value: "hidden", display: "Hidden" },
								{ value: "scroll", display: "Scroll" },
								{
									value: "auto",
									display: "Auto",
									isDefault: true,
								},
							]}
						/>
					),
				},
			],
		},
		buildSpacingSection(),
		buildDimensionsSection(),
		buildColorSection(),
		buildBorderSection(),
		buildShadowSection(),
	],
};
