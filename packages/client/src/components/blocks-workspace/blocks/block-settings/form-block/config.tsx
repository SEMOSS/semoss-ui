import { Crosshair } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { usePixel } from "@/hooks";
import { ContainerLayoutSettings } from "../../settings";
import { BaseSettingSection } from "../../settings/BaseSettingSection";
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

	const type = block?.data?.type || "";
	const isManual = type === "manual";
	const selectedDatabase = (block?.data?.database as string) || "";

	const getEngines =
		usePixel<
			{ engine_id: string; engine_name: string; engine_type: string }[]
		>(`MyEngines();`);

	const selectedTable = (block?.data?.table as string) || "";

	const getTables = usePixel<{
		nodes: { conceptualName: string; propSet: string[] }[];
	}>(
		selectedDatabase
			? `GetDatabaseMetamodel(database=["${selectedDatabase}"], options=[]);`
			: "",
	);

	const databases = useMemo(() => {
		if (
			getEngines.status !== "SUCCESS" ||
			!Array.isArray(getEngines.data)
		) {
			return [];
		}
		return getEngines.data
			.filter((e) => e.engine_type === "DATABASE")
			.map((e) => ({
				id: e.engine_id,
				name: e.engine_name.replace(/_/g, " "),
			}));
	}, [getEngines.status, getEngines.data]);

	const tableOptions = useMemo(() => {
		if (getTables.status !== "SUCCESS" || !getTables.data?.nodes) {
			return [];
		}
		return getTables.data.nodes.map((n) => ({
			value: n.conceptualName,
			display: n.conceptualName,
		}));
	}, [getTables.status, getTables.data]);

	const columnOptions = useMemo(() => {
		if (getTables.status !== "SUCCESS" || !getTables.data?.nodes) {
			return [];
		}
		const node = getTables.data.nodes.find(
			(n) => n.conceptualName === selectedTable,
		);
		return (node?.propSet ?? []).map((col) => ({
			value: col,
			display: col,
		}));
	}, [getTables.status, getTables.data, selectedTable]);

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

			{!isManual && (
				<>
					<BaseSettingSection label="Select Database">
						<Select
							value={selectedDatabase || "__none__"}
							onValueChange={(val) => {
								const next = val === "__none__" ? "" : val;
								state.dispatch({
									message: ActionMessages.SET_BLOCK_DATA,
									payload: {
										id,
										path: "database",
										value: next,
									},
								});
								if (!next) {
									state.dispatch({
										message: ActionMessages.SET_BLOCK_DATA,
										payload: {
											id,
											path: "table",
											value: "",
										},
									});
								}
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select database..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{databases.map((db) => (
									<SelectItem key={db.id} value={db.id}>
										<span className="flex flex-col text-left">
											<span>{db.name}</span>
											<span className="text-[11px] text-muted-foreground">
												id: {db.id}
											</span>
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</BaseSettingSection>

					{selectedDatabase && (
						<SelectInputSettings
							id={id}
							path="table"
							label="Select Table"
							options={tableOptions}
							allowUnset
						/>
					)}

					{selectedTable && (
						<SelectInputSettings
							id={id}
							path="column"
							label="Select Column"
							options={columnOptions}
							allowUnset
						/>
					)}
				</>
			)}
		</div>
	);
});

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: Crosshair,
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
