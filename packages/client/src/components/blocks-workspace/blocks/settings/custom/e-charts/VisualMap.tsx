import { X as CloseOutlinedIcon, Search } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import type { BlockDef } from "@semoss/renderer";
import { VisualMapConstant } from "./VisualMapConstant";

export const VisualMap = observer(
	<_D extends BlockDef = BlockDef>({ selectedItem, handleClose }) => {
		const [search, setSearch] = useState("");
		const [filteredData, setFilteredData] = useState(VisualMapConstant);
		const searchInputRef = useRef<HTMLInputElement | null>(null);

		// biome-ignore lint/correctness/useExhaustiveDependencies: searchInputRef is a stable ref
		useEffect(() => {
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 0);
		}, [search]);

		const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
			setSearch(e.target.value);
			const searchValue = e.target.value;
			if (searchValue === "") {
				setFilteredData(VisualMapConstant);
				return;
			}
			const filtered = Object.entries(VisualMapConstant).reduce(
				(acc, [key, value]) => {
					const filteredItems = Array.isArray(value)
						? value.filter((item) =>
								item.name
									.toLowerCase()
									.includes(searchValue.toLowerCase()),
							)
						: [];
					if (filteredItems.length > 0) {
						acc[key] = filteredItems;
					}
					return acc;
				},
				{} as typeof VisualMapConstant,
			);
			setFilteredData(filtered);
		};

		// biome-ignore lint/suspicious/noExplicitAny: echart visual map item type
		function handleSelectItem(item: any) {
			selectedItem(item);
		}

		return (
			<div className="mt-px h-full w-full">
				<div className="relative top-[1%] left-[8%] max-h-[530px] w-[95%] overflow-y-auto">
					<span className="block text-[#0471F0]">Select Visual</span>
					<CloseOutlinedIcon
						className="absolute top-0 z-10 ml-[84%] cursor-pointer text-[#808080]"
						onClick={handleClose}
					/>
					<span className="relative mt-1 block whitespace-normal break-words text-[#808080] text-sm">
						Select a chart type for your data visualization
					</span>
				</div>
				<hr className="mt-5 border border-[#E0E0E0]" />
				<div className="relative top-[1%] left-[8%] max-h-[530px] w-[95%] overflow-y-auto">
					<div className="w-[85%] pt-2">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />
							<input
								ref={searchInputRef}
								className="w-full rounded border py-1 pr-2 pl-8 text-sm"
								placeholder="Search"
								value={search}
								onChange={handleSearch}
							/>
						</div>
					</div>
					{Object.entries(filteredData).map(([key, value]) => (
						<div key={key} className="w-[85%] pt-2">
							<span className="relative mt-1 block whitespace-normal break-words text-[#808080] text-sm">
								{key}
							</span>
							{value?.map((item) => (
								// biome-ignore lint/a11y/noStaticElementInteractions: visual map item
								// biome-ignore lint/a11y/useKeyWithClickEvents: visual map item
								<div
									key={item.name}
									className={`mt-4 flex items-center ${item?.option ? "cursor-pointer" : "cursor-default"}`}
									onClick={() => {
										if (item?.option)
											handleSelectItem(item);
									}}
								>
									<div className="flex items-center">
										{item.icon}
									</div>
									<span
										className="ml-10 flex items-center"
										style={{
											marginLeft:
												item.icon?.type === "img"
													? "30px"
													: "38px",
											color: item?.option
												? "#000000"
												: "#808080",
										}}
									>
										{item.label}
									</span>
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		);
	},
);
