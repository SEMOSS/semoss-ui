import {
	ChevronDown,
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
	CircleCheck,
	X,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { TimeDateFormatter } from "@/pages/AuditLogsDashboard";

interface JSONTreeViewProps {
	data: unknown;
	expandAll?: boolean;
	isChild?: boolean;
}

const JSONTreeView = ({
	data,
	isChild = false,
	expandAll,
}: JSONTreeViewProps) => {
	const [isExpanded, setIsExpanded] = useState(!isChild);
	const hasChildren = data !== null && typeof data === "object";

	useEffect(() => {
		if (expandAll !== undefined && hasChildren && isChild) {
			setIsExpanded(expandAll);
		}
	}, [expandAll, hasChildren, isChild]);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const renderValue = (value: unknown) => {
		if (value === null) return <span className="text-blue-500">null</span>;
		if (typeof value === "string")
			return <span className="text-destructive">"{value}"</span>;
		if (typeof value === "number")
			return <span className="text-green-600">{value}</span>;
		if (typeof value === "boolean")
			return <span className="text-blue-500">{value.toString()}</span>;
		return null;
	};

	if (!hasChildren) {
		return <span>{renderValue(data)}</span>;
	}

	const isArray = Array.isArray(data);

	return (
		<div className={isChild ? "ml-3" : "ml-0"}>
			<div className="flex items-center">
				{isChild && (
					// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard navigation not critical for JSON tree
					// biome-ignore lint/a11y/noStaticElementInteractions: JSON tree toggle
					<div
						className="mr-1 inline-flex cursor-pointer items-center px-1 [&>svg]:size-4"
						onClick={toggleExpand}
					>
						{isExpanded ? <ChevronDown /> : <ChevronRight />}
					</div>
				)}
				{isChild && (
					<>
						{isArray ? "" : <span className="text-primary">"</span>}
						<span className="text-primary">
							{isArray ? "[" : "{"}
						</span>
					</>
				)}
			</div>
			{isExpanded && (
				<div>
					{Object.entries(data).map(([key, value]) => (
						<div key={key} className={isChild ? "ml-4" : "ml-0"}>
							{!isArray && (
								<>
									<span className="text-primary">
										"{key}"
									</span>
									:{" "}
								</>
							)}
							<JSONTreeView
								data={value}
								isChild
								expandAll={expandAll}
							/>
						</div>
					))}
				</div>
			)}
			{isExpanded && isChild && (
				<div className={isChild ? "ml-0" : "ml-4"}>
					{isArray ? "]" : "}"}
				</div>
			)}
		</div>
	);
};

const hasExpandableContent = (data: unknown): boolean => {
	if (data === null || typeof data !== "object") {
		return false;
	}

	for (const value of Object.values(data)) {
		if (value !== null && typeof value === "object") {
			return true;
		}
	}

	return false;
};

export const AuditLogsDetailDrawer = (props) => {
	const { logDetails, handleDrawerClose } = props;
	const [width, setWidth] = useState(500);
	const [promptExpandAll, setPromptExpandAll] = useState<boolean | undefined>(
		undefined,
	);
	const [responseExpandAll, setResponseExpandAll] = useState<
		boolean | undefined
	>(undefined);
	const drawerRef = useRef(null);
	const isDragging = useRef(false);
	const startX = useRef(0);
	const startWidth = useRef(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: handleMouseMove and handleMouseUp are stable refs
	const handleMouseDown = useCallback(
		(e) => {
			isDragging.current = true;
			startX.current = e.clientX;
			startWidth.current = width;
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[width],
	);

	const handleMouseMove = useCallback((e) => {
		if (!isDragging.current) return;
		const delta = startX.current - e.clientX;
		const newWidth = Math.max(500, startWidth.current + delta);
		setWidth(newWidth);
	}, []);

	const handleMouseUp = useCallback(() => {
		isDragging.current = false;
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	}, [handleMouseMove]);

	useEffect(() => {
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	const handlePromptToggle = () => {
		setPromptExpandAll((prev) => !prev);
	};

	const handleResponseToggle = () => {
		setResponseExpandAll((prev) => !prev);
	};

	const getPromptData = () => {
		try {
			return JSON.parse(logDetails.request);
		} catch {
			return null;
		}
	};

	const getResponseData = () => {
		try {
			return JSON.parse(logDetails.response);
		} catch {
			return null;
		}
	};

	const promptData = logDetails ? getPromptData() : null;
	const responseData = logDetails ? getResponseData() : null;
	const showPromptExpandButton =
		promptData && hasExpandableContent(promptData);
	const showResponseExpandButton =
		responseData && hasExpandableContent(responseData);

	if (!logDetails) return <p className="text-sm">No details available</p>;
	return (
		<div
			ref={drawerRef}
			style={{ width: `${width}px` }}
			className="relative flex h-full min-w-[500px] flex-col bg-white"
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle is not keyboard-navigable */}
			<div
				className="absolute top-0 bottom-0 left-0 w-1 cursor-ew-resize hover:bg-black/[0.04] active:bg-black/[0.08]"
				onMouseDown={handleMouseDown}
			/>
			<div className="flex items-center justify-between border-b bg-primary/5 px-3 py-2">
				<span className="font-medium text-primary text-sm">
					Audit Details
				</span>
				<button
					type="button"
					className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
					onClick={handleDrawerClose}
				>
					<X className="size-4" />
				</button>
			</div>

			{logDetails && (
				<div className="flex-1 overflow-y-auto bg-white">
					<div className="border-[#e9ecef] border-b px-3 py-3">
						<p className="mb-3 font-semibold text-foreground text-sm">
							Event Summary
						</p>
						<div className="mb-1.5 flex items-center justify-between">
							<p className="flex items-center gap-2 font-semibold text-foreground text-sm">
								Request
							</p>
							{showPromptExpandButton && (
								<Button size="sm" onClick={handlePromptToggle}>
									{promptExpandAll ? (
										<ChevronsDownUp className="size-3.5" />
									) : (
										<ChevronsUpDown className="size-3.5" />
									)}
									{promptExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</div>
						<div className="mb-3 rounded-md border border-border bg-muted/20">
							{promptData ? (
								<div className="overflow-x-auto rounded p-2 font-mono text-[13px] text-foreground leading-[1.4]">
									<JSONTreeView
										data={promptData}
										expandAll={promptExpandAll}
									/>
								</div>
							) : (
								<p className="whitespace-pre-wrap break-words p-2 text-foreground text-sm leading-[1.6]">
									{logDetails.request}
								</p>
							)}
						</div>

						<div className="mb-1.5 flex items-center justify-between">
							<p className="flex items-center gap-2 font-semibold text-foreground text-sm">
								Response
							</p>
							{showResponseExpandButton && (
								<Button
									size="sm"
									onClick={handleResponseToggle}
								>
									{responseExpandAll ? (
										<ChevronsDownUp className="size-3.5" />
									) : (
										<ChevronsUpDown className="size-3.5" />
									)}
									{responseExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</div>
						<div className="rounded-md border border-border bg-muted/20">
							{responseData ? (
								<div className="overflow-x-auto rounded p-2 font-mono text-[13px] text-foreground leading-[1.4]">
									<JSONTreeView
										data={responseData}
										expandAll={responseExpandAll}
									/>
								</div>
							) : (
								<p className="whitespace-pre-wrap break-words p-2 text-foreground text-sm leading-[1.6]">
									{logDetails.response}
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 p-5">
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Engine Type
							</span>
							<span className="font-semibold text-foreground text-sm">
								{logDetails.engineType}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Engine Name
							</span>
							<span className="font-semibold text-foreground text-sm">
								{logDetails.engineName}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Latency
							</span>
							<span className="font-semibold text-foreground text-sm">
								{logDetails.latency}s
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Tokens
							</span>
							<span className="font-semibold text-foreground text-sm">
								{logDetails.tokens}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Timestamp
							</span>
							<span className="font-semibold text-foreground text-sm">
								{`${TimeDateFormatter(logDetails.startTime).time} - ${
									TimeDateFormatter(logDetails.endTime).time
								}`}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Request Status
							</span>
							<span className="flex items-center gap-1 font-semibold text-foreground text-sm">
								{logDetails.status ? (
									<CircleCheck className="size-4 text-green-500" />
								) : (
									<XCircle className="size-4 text-destructive" />
								)}
								<span className="text-sm">
									{logDetails.status}
								</span>
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								User Id
							</span>
							<span className="font-semibold text-foreground text-sm">
								{logDetails.userId}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Session Id
							</span>
							<span className="font-semibold text-foreground text-sm">
								{logDetails.sessionId}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-muted-foreground text-xs">
								Log Timestamp
							</span>
							<span className="font-semibold text-foreground text-sm">
								{
									TimeDateFormatter(logDetails.logTimestamp)
										.time
								}{" "}
								{
									TimeDateFormatter(logDetails.logTimestamp)
										.date
								}
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
