import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	type PathValue,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

// biome-ignore lint/correctness/noUnusedVariables: used in JSX or callback
interface GanttFrameSectionProps {
	id: string;
}

export const GanttFrameSection = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id); //block data
		const [framesData, setFramesData] = useState({
			task: "",
			startdate: "",
			enddate: "",
			taskgroup: "",
			taskprogress: "",
			milestone: "",
			tooltip: [] as string[],
		}); // frame component data
		const _timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		const getFrames = useBlocksPixel<string[]>("GetFrames();", {
			data: [],
		});
		const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
		const frameHeaders = useFrameHeaders(data.frame?.name);
		const columns = frameHeaders.data.list.map((item) => {
			return {
				name: item.alias,
				selector: item.header,
				width: undefined,
			};
		});
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const optionData = data.option;
			if (
				Object.hasOwn(optionData, "customSettings") &&
				Object.hasOwn(optionData.customSettings, "columnDetails")
			) {
				const columnDetails =
					optionData.customSettings.columnDetails || {};
				const fieldsState = { ...framesData };
				Object.keys(columnDetails).forEach((item) => {
					if (
						typeof columnDetails[item] === "object" &&
						Array.isArray(columnDetails[item])
					) {
						fieldsState[item] = columnDetails[item].map(
							(item) => item.selector,
						);
					} else {
						fieldsState[item] = columnDetails[item].selector;
					}
				});
				setFramesData((prevFramesData) => {
					return {
						...prevFramesData,
						...fieldsState,
					};
				});
			}
		}, []);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (
				framesData.task !== "" &&
				framesData.startdate !== "" &&
				framesData.enddate !== "" &&
				columns.length
			) {
				let columnsToSet = [];
				// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
				const columnsObject: Record<string, any> = {};

				const columnsTask = columns.find(
					(item) => item.selector === framesData.task,
				);
				if (Object.hasOwn(columnsTask, "name")) {
					columnsToSet.push(columnsTask);
					columnsObject.task = columnsTask;
				}
				const columnsStartDate = columns.find(
					(item) => item.selector === framesData.startdate,
				);
				if (Object.hasOwn(columnsStartDate, "name")) {
					columnsToSet.push(columnsStartDate);
					columnsObject.startdate = columnsStartDate;
				}
				const columnsEndDate = columns.find(
					(item) => item.selector === framesData.enddate,
				);
				if (Object.hasOwn(columnsEndDate, "name")) {
					columnsToSet.push(columnsEndDate);
					columnsObject.enddate = columnsEndDate;
				}
				if (framesData?.taskgroup !== "") {
					const columnsTaskGroup = columns.find(
						(item) => item.selector === framesData.taskgroup,
					);
					if (
						columnsTaskGroup !== undefined &&
						Object.hasOwn(columnsTaskGroup, "name")
					) {
						columnsToSet.push(columnsTaskGroup);
						columnsObject.taskgroup = columnsTaskGroup;
					}
				}
				if (framesData?.taskprogress !== "") {
					const columnsTaskProgress = columns.find(
						(item) => item.selector === framesData.taskprogress,
					);
					if (
						columnsTaskProgress !== undefined &&
						Object.hasOwn(columnsTaskProgress, "name")
					) {
						columnsToSet.push(columnsTaskProgress);
						columnsObject.taskprogress = columnsTaskProgress;
					}
				}
				if (framesData.milestone !== "") {
					const columnsMileStone = columns.find(
						(item) => item.selector === framesData.milestone,
					);
					if (
						columnsMileStone !== undefined &&
						Object.hasOwn(columnsMileStone, "name")
					) {
						columnsToSet.push(columnsMileStone);
						columnsObject.milestone = columnsMileStone;
					}
				}
				if (framesData?.tooltip?.length) {
					const columnsToolTip = columns.filter((item) =>
						framesData.tooltip.includes(item.selector),
					);
					if (columnsToolTip.length) {
						columnsToSet = [...columnsToSet, ...columnsToolTip];
						columnsObject.tooltip = columnsToolTip;
					}
				}
				const tempDataSet = new Set(columnsToSet);
				columnsToSet = Array.from(tempDataSet);
				const columnsIndexToSet = getColumnIndexToSetData(
					columnsObject,
					columnsToSet,
				);
				setData("columns", columnsToSet);
				if (
					Object.hasOwn(data.option, "customSettings") &&
					Object.hasOwn(data.option.customSettings, "columnDetails")
				) {
					let option = data.option;
					option = {
						...option,
						customSettings: {
							...option.customSettings,
							columnDetails: {
								...columnsObject,
							},
							columnIndexDetails: {
								...columnsIndexToSet,
							},
						},
					};
					setData(
						"option",
						option as PathValue<D["data"], typeof path>,
					);
				}
			}
		}, [framesData]);
		//get the columns index, to use in selector for fetching the records from backend
		function getColumnIndexToSetData(
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			columnsObject: any,
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			columnsToSet: any[],
		) {
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			const colIndex: Record<string, any> = {};
			Object.keys(columnsObject).forEach((item) => {
				if (
					typeof columnsObject[item] === "object" &&
					Array.isArray(columnsObject[item])
				) {
					colIndex[item] = [];
					columnsObject[item].forEach((colObjItem) => {
						const indexToUpdate = columnsToSet.findIndex(
							(colSetItem) =>
								colSetItem.selector === colObjItem.selector,
						);
						colIndex[item].push(indexToUpdate);
					});
					colIndex[item].sort();
				} else {
					colIndex[item] = columnsToSet.findIndex(
						(colSetItem) =>
							colSetItem.selector ===
							columnsObject[item].selector,
					);
				}
			});
			return colIndex;
		}
		//update the fields when the frame section fields are changed
		function updateField(fieldName: string, value: string) {
			setFramesData((prevFrameData) => ({
				...prevFrameData,
				[fieldName]: value,
			}));
		}
		//update tooltip (multi-select) field
		function _updateTooltipField(e: React.ChangeEvent<HTMLSelectElement>) {
			const selected = Array.from(e.target.selectedOptions).map(
				(opt) => opt.value,
			);
			setFramesData((prevFrameData) => ({
				...prevFrameData,
				tooltip: selected,
			}));
		}

		return (
			<div className="flex flex-col">
				<div className="flex flex-col gap-2 p-3">
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="text-muted-foreground text-sm">
						Frame
					</label>
					<select
						className="w-full rounded border px-2 py-1 text-sm"
						disabled={getFrames.status !== "SUCCESS"}
						value={data.frame?.name ?? ""}
						onChange={(e) => setData("frame.name", e.target.value)}
					>
						<option value="">Select frame</option>
						{options.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</div>
				<div className="flex flex-col gap-2 p-3">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="task-field"
					>
						Task
					</label>
					<Select
						value={framesData.task}
						onValueChange={(val) => updateField("task", val)}
					>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<SelectTrigger className="w-full" id="task-field">
							<SelectValue placeholder="Select X Axis Field" />
						</SelectTrigger>
						<SelectContent>
							{columns?.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={label.selector}>
									{label.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-3">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="start-date-field"
					>
						Start Date
					</label>
					<Select
						value={framesData.startdate}
						onValueChange={(val) => updateField("startdate", val)}
					>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
						<SelectTrigger className="w-full" id="start-date-field">
							<SelectValue placeholder="Select Start Date" />
						</SelectTrigger>
						<SelectContent>
							{columns?.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={label.selector}>
									{label.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-3">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="end-date-field"
					>
						End Date
					</label>
					<Select
						value={framesData.enddate}
						onValueChange={(val) => updateField("enddate", val)}
					>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
						<SelectTrigger className="w-full" id="end-date-field">
							<SelectValue placeholder="Select End Date" />
						</SelectTrigger>
						<SelectContent>
							{columns?.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={label.selector}>
									{label.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-3">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="task-group-field"
					>
						Task Group
					</label>
					<Select
						value={framesData.taskgroup}
						onValueChange={(val) => updateField("taskgroup", val)}
					>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
						<SelectTrigger className="w-full" id="task-group-field">
							<SelectValue placeholder="Select Task Group" />
						</SelectTrigger>
						<SelectContent>
							{columns?.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={label.selector}>
									{label.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-3">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="task-progress-field"
					>
						Task Progress
					</label>
					<Select
						value={framesData.taskprogress}
						onValueChange={(val) =>
							updateField("taskprogress", val)
						}
					>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
						<SelectTrigger
							className="w-full"
							id="task-progress-field"
						>
							<SelectValue placeholder="Select Task Progress" />
						</SelectTrigger>
						<SelectContent>
							{columns?.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={label.selector}>
									{label.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-3">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="milestone-field"
					>
						MileStone
					</label>
					<Select
						value={framesData.milestone}
						onValueChange={(val) => updateField("milestone", val)}
					>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
						<SelectTrigger className="w-full" id="milestone-field">
							<SelectValue placeholder="Select Milestone" />
						</SelectTrigger>
						<SelectContent>
							{columns?.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={label.selector}>
									{label.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-3">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="tooltip-field"
					>
						Tooltip
					</label>
					{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
					<select
						id="tooltip-field"
						multiple
						className="min-h-[80px] w-full rounded border px-2 py-1 text-sm"
						value={framesData.tooltip}
						onChange={_updateTooltipField}
					>
						{columns?.map((label, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
							<option key={index} value={label.selector}>
								{label.name}
							</option>
						))}
					</select>
				</div>
			</div>
		);
	},
);
