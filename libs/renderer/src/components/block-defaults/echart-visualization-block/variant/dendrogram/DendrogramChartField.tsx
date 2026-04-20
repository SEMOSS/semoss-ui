import { ChevronLeft, ChevronRight } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { getValueByPath } from "@/utility";
import { useBlock } from "../../../../../hooks";
import type { BlockDef } from "../../../../../store";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";

export const DendrogramChartField = observer(
	<_D extends BlockDef = BlockDef>({ id, facetListData }) => {
		const { data, setData } = useBlock<EchartVisualizationBlockDef>(id);

		const [dropDownValue, setDropDownValue] = useState("");
		const [facetList, setFacetList] = useState<string[]>([]);
		const [navigationDetails, setNavigationDetails] = useState({
			prev: "",
			next: "",
		});
		const [dendrogramFacetUpdated, setDendrogramFacetUpdated] =
			useState(false);
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, "facet.facetSelected");
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, "facet.facetSelected"]).get();
		useEffect(() => {
			setFacetList((_prevList: string[]) =>
				facetListData.map((item) =>
					Array.isArray(item) ? item[0] : item,
				),
			);
			setDendrogramFacetUpdated(false);
		}, [facetListData]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
		useEffect(() => {
			if (dendrogramFacetUpdated) return;
			try {
				const facetSelected = JSON.parse(computedValue);
				if (facetSelected.length > 0) {
					if (
						facetSelected[0] !== undefined &&
						facetSelected[0]?.value !== undefined &&
						facetSelected[0]?.value !== dropDownValue
					) {
						findAndUpdateNavigationDetails(facetSelected[0].value);
						setDropDownValue(facetSelected[0].value);
					}
				} else {
					setDropDownValue("");
					setNavigationDetails({ prev: null, next: null });
				}
			} catch (e) {
				console.log(e);
			}
		}, [computedValue, facetListData]);

		function findAndUpdateNavigationDetails(value) {
			const index = facetList.findIndex((item) =>
				Number.isNaN(parseInt(value, 10))
					? item === value
					: parseInt(item, 10) === parseInt(value, 10),
			);
			if (index !== -1) {
				const prev = index - 1 >= 0 ? facetList[index - 1] : null;
				const next =
					index + 1 < facetList.length ? facetList[index + 1] : null;
				setNavigationDetails({ prev: prev, next: next });
			} else {
				setNavigationDetails({ prev: null, next: null });
			}
		}

		function updateFieldByValue(newvalue: string) {
			setDendrogramFacetUpdated(true);
			if (newvalue === "" || newvalue == null) return;
			const prevValue = dropDownValue;
			try {
				let facetData = JSON.parse(computedValue);
				facetData = [
					{
						...facetData[0],
						value: newvalue,
					},
				];
				setData("facet.facetSelected", facetData);
				setDropDownValue(newvalue);
				findAndUpdateNavigationDetails(newvalue);
			} catch (e) {
				setDropDownValue(prevValue);
				console.log(e);
			}
		}
		console.log(facetList, "facetList");
		return (
			<div className="flex w-full flex-row items-center bg-background">
				<div className="flex w-full justify-start">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() =>
							updateFieldByValue(navigationDetails.prev)
						}
					>
						<ChevronLeft className="size-4" />
						{navigationDetails.prev}
					</Button>
				</div>
				<div className="flex w-full justify-center">
					<Select
						value={dropDownValue}
						onValueChange={(value) => updateFieldByValue(value)}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select Field" />
						</SelectTrigger>
						<SelectContent>
							{facetList.length > 0 &&
								facetList.map((item, index) => (
									<SelectItem
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										key={index}
										value={item.toString()}
									>
										{item}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-full justify-end">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() =>
							updateFieldByValue(navigationDetails.next)
						}
					>
						{navigationDetails.next}
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		);
	},
);
