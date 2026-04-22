import { AlertTriangle, Info, Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlockJSON } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Separator,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { DesignerMenuItem } from "../blocks-workspace/menus/menu-types";
import { BlockCardContent, blockCardWidth } from "./BlockMenuCardContent";

type MODE = "SYSTEM" | "COMMUNITY";

interface FormMenuProps {
	parentId: string;
	anchorEl: HTMLElement | null;
	systemItems: DesignerMenuItem[];
	onSelect: (blockJson: BlockJSON) => void;
	onClose: () => void;
	title?: string;
}

interface FormMenuCardProps {
	item: DesignerMenuItem;
	isCommunity: boolean;
}

const FormMenuBlockCard: React.FC<FormMenuCardProps> = ({
	item,
	isCommunity,
}) => {
	const [hovered, setHovered] = useState(false);

	const image = isCommunity ? undefined : item.activeImage;

	return (
		<div className="flex h-full flex-col items-center justify-end gap-1">
			<div
				className="select-none text-center font-medium text-muted-foreground text-sm"
				style={{ width: blockCardWidth, overflowWrap: "anywhere" }}
			>
				<div className="flex flex-wrap items-center justify-center gap-1">
					{item.name}
					{item.recentChanges && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span>
										<Info className="size-4 text-blue-500" />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									{item.recentChanges}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{item.isBeta && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span>
										<AlertTriangle className="size-4 text-amber-500" />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									This block is currently in beta
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			</div>

			{/* biome-ignore lint/a11y/noStaticElementInteractions: hover-only container */}
			<div
				className="relative inline-block pt-4 pr-4"
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<div
					className="cursor-pointer rounded-md border transition-colors"
					style={{
						borderColor: hovered
							? "var(--primary)"
							: "var(--border)",
					}}
				>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div>
									<BlockCardContent
										image={image}
										name={item.name}
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{item.helperText ?? item.name}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</div>
	);
};

export const FormMenu: React.FC<FormMenuProps> = ({
	parentId,
	anchorEl,
	systemItems,
	onClose,
	onSelect,
	title = "Add blocks to form",
}) => {
	const [search, setSearch] = useState("");
	const [mode, setMode] = useState<MODE>("SYSTEM");
	const [communityBlocks, setCommunityBlocks] = useState<DesignerMenuItem[]>(
		[],
	);
	const [loadingCommunity, setLoadingCommunity] = useState(false);
	const [hasLoadedCommunity, setHasLoadedCommunity] =
		useState<boolean>(false);

	const loadCommunityBlocks = useCallback(async () => {
		if (hasLoadedCommunity) return;
		try {
			setLoadingCommunity(true);
			const res = await runPixel("GetClientBlocks()");
			const { pixelReturn, errors } = res;

			if (errors?.length) {
				toast.error(
					errors.join("") || "Error loading community blocks",
				);
				setLoadingCommunity(false);
				return;
			}

			const output = pixelReturn?.[0]?.output as
				| DesignerMenuItem[]
				| undefined;

			if (output && Array.isArray(output)) {
				const normalized = output.map((item) => ({
					...item,
					json: JSON.parse(JSON.stringify(item.json)),
				}));
				setCommunityBlocks(normalized);
			}
		} catch (e) {
			console.error(e);
			toast.error("Error loading community blocks");
		} finally {
			setLoadingCommunity(false);
			setHasLoadedCommunity(true);
		}
	}, [hasLoadedCommunity]);

	useEffect(() => {
		if (mode === "COMMUNITY") {
			loadCommunityBlocks();
		}
	}, [mode, loadCommunityBlocks]);

	const isCommunity = mode === "COMMUNITY";

	const activeItems: DesignerMenuItem[] = useMemo(() => {
		const source = isCommunity ? communityBlocks : systemItems;
		const s = search.trim().toLowerCase();
		if (!s) return source;
		return source.filter((item) => item.name.toLowerCase().includes(s));
	}, [isCommunity, communityBlocks, systemItems, search]);

	const anyCommunity = communityBlocks.length > 0;

	const handleCardClick = (block: DesignerMenuItem) => {
		const blockJson = block.json as BlockJSON;
		onSelect(blockJson);
		onClose();
	};

	const rect = anchorEl?.getBoundingClientRect();

	return (
		<DropdownMenu
			open={Boolean(anchorEl)}
			onOpenChange={(open) => !open && onClose()}
		>
			<DropdownMenuTrigger asChild>
				<span
					style={{
						position: "fixed",
						top: rect?.bottom ?? 0,
						left: rect?.left ?? 0,
						width: 0,
						height: 0,
					}}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[360px] max-w-[420px] rounded-xl p-0"
				style={{
					boxShadow: "0px 5px 24px 0px rgba(0, 0, 0, 0.32)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex flex-col gap-2 px-4 py-2">
					<div
						className="mt-1 mb-2 w-fit rounded-full px-4 py-0.5"
						style={{
							backgroundColor: "hsl(var(--primary) / 0.1)",
						}}
					>
						<span
							className="text-[13px] leading-[18px] tracking-[0.16px]"
							style={{ color: "var(--Primary-Dark, #1260DD)" }}
						>
							{title}
						</span>
					</div>

					<Separator />

					<div className="relative flex w-full items-center">
						<Search className="absolute left-3 size-4 text-muted-foreground" />
						<input
							className="h-9 w-full rounded-md border border-input bg-transparent pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
							placeholder={
								isCommunity
									? "Search community blocks"
									: "Search system blocks"
							}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<Tabs
						value={mode}
						onValueChange={(val) => setMode(val as MODE)}
					>
						<TabsList className="w-full">
							<TabsTrigger value="SYSTEM" className="flex-1">
								System Blocks
							</TabsTrigger>
							<TabsTrigger value="COMMUNITY" className="flex-1">
								Community Blocks
							</TabsTrigger>
						</TabsList>
					</Tabs>

					<div className="max-h-[280px] w-full overflow-y-auto">
						{isCommunity && loadingCommunity ? (
							<p className="text-sm">
								Loading community blocks...
							</p>
						) : activeItems.length ? (
							<div className="grid grid-cols-2 gap-3 pl-0.5">
								{activeItems.map((block) => (
									<button
										key={`${parentId}-${block.name}`}
										type="button"
										className="cursor-pointer text-left"
										onClick={(e) => {
											e.stopPropagation();
											handleCardClick(block);
										}}
									>
										<FormMenuBlockCard
											item={block}
											isCommunity={isCommunity}
										/>
									</button>
								))}
							</div>
						) : (
							<p className="text-sm">
								{isCommunity && !anyCommunity
									? "No community blocks found"
									: "No blocks found"}
							</p>
						)}
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
