import {
	XCircle as Cancel,
	CheckCircle as CheckCircleIcon,
	X as CloseIcon,
	ChevronDown as KeyboardArrowDownIcon,
	ChevronRight as KeyboardArrowRightIcon,
	ChevronsDownUp as UnfoldLessIcon,
	ChevronsUpDown as UnfoldMoreIcon,
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
		if (value === null)
			return <span className="text-blue-500">null</span>;
		if (typeof value === "string")
			return <span className="text-red-500">"{value}"</span>;
		if (typeof value === "number")
			return <span className="text-green-600">{value}</span>;
		if (typeof value === "boolean")
			return (
				<span className="text-blue-500">{value.toString()}</span>
			);
		return null;
	};

	if (!hasChildren) {
		return <span>{renderValue(data)}</span>;
	}

	const isArray = Array.isArray(data);

	return (
		<div style={{ marginLeft: isChild ? 24 : 0 }}>
			<div className="flex items-center">
				{isChild && (
					<span
						className="inline-flex cursor-pointer items-center px-1 mr-1"
						onClick={toggleExpand}
					>
						{isExpanded ? (
							<KeyboardArrowDownIcon />
						) : (
							<KeyboardArrowRightIcon />
						)}
					</span>
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
						<div key={key} style={{ marginLeft: isChild ? 32 : 0 }}>
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
				<div>{isArray ? "]" : "}"}</div>
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
		setPromptExpandAll((prev) => (prev === true ? false : true));
	};

	const handleResponseToggle = () => {
		setResponseExpandAll((prev) => (prev === true ? false : true));
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

	if (!logDetails)
		return (
			<span className="text-sm">No details available</span>
		);
	return (
		<div
			ref={drawerRef}
			className="relative flex min-w-[500px] flex-col bg-white"
			style={{ width: `${width}px`, height: "100%" }}
		>
			<div
				className="absolute bottom-0 left-0 top-0 w-1 cursor-ew-resize hover:bg-muted active:bg-muted-foreground/20"
				onMouseDown={handleMouseDown}
			/>
			<div className="flex items-center justify-between border-b bg-accent/50 px-3 py-2">
				<span className="text-sm font-medium text-primary">
					Audit Details
				</span>
				<button
					type="button"
					className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50"
					onClick={handleDrawerClose}
				>
					<CloseIcon className="h-4 w-4" />
				</button>
			</div>

			{logDetails && (
				<div className="flex-1 overflow-y-auto bg-white">
					<div className="border-b p-5">
						<h6 className="mb-4 text-sm font-semibold">
							Event Summary
						</h6>
						<div className="mb-2 flex items-center justify-between">
							<span className="flex items-center gap-2 text-sm font-semibold">
								Request
							</span>
							{showPromptExpandButton && (
								<Button
									variant="default"
									size="sm"
									onClick={handlePromptToggle}
								>
									{promptExpandAll ? (
										<UnfoldLessIcon className="mr-2 h-4 w-4" />
									) : (
										<UnfoldMoreIcon className="mr-2 h-4 w-4" />
									)}
									{promptExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</div>
						<div className="mb-4 rounded-md border bg-muted/30 p-1">
							{(() => {
								if (promptData) {
									return (
										<div className="overflow-x-auto rounded p-3 font-mono text-[13px] leading-snug">
											<JSONTreeView
												data={promptData}
												expandAll={promptExpandAll}
											/>
										</div>
									);
								}
								return (
									<p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
										{logDetails.request}
									</p>
								);
							})()}
						</div>

						<div className="mb-2 flex items-center justify-between">
							<span className="flex items-center gap-2 text-sm font-semibold">
								Response
							</span>
							{showResponseExpandButton && (
								<Button
									variant="default"
									size="sm"
									onClick={handleResponseToggle}
								>
									{responseExpandAll ? (
										<UnfoldLessIcon className="mr-2 h-4 w-4" />
									) : (
										<UnfoldMoreIcon className="mr-2 h-4 w-4" />
									)}
									{responseExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</div>
						<div className="mb-4 rounded-md border bg-muted/30 p-1">
							{(() => {
								if (responseData) {
									return (
										<div className="overflow-x-auto rounded p-3 font-mono text-[13px] leading-snug">
											<JSONTreeView
												data={responseData}
												expandAll={responseExpandAll}
											/>
										</div>
									);
								}
								return (
									<p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
										{logDetails.response}
									</p>
								);
							})()}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 p-5">
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Engine Type
							</span>
							<span className="text-sm font-semibold">
								{logDetails.engineType}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Engine Name
							</span>
							<span className="text-sm font-semibold">
								{logDetails.engineName}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Latency
							</span>
							<span className="text-sm font-semibold">
								{logDetails.latency}s
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Tokens
							</span>
							<span className="text-sm font-semibold">
								{logDetails.tokens}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Timestamp
							</span>
							<span className="text-sm font-semibold">
								{`${TimeDateFormatter(logDetails.startTime).time} - ${
									TimeDateFormatter(logDetails.endTime).time
								}`}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Request Status
							</span>
							<span className="text-sm font-semibold">
								<span className="flex items-center gap-1">
									{logDetails.status ? (
										<CheckCircleIcon className="text-green-600" />
									) : (
										<Cancel className="text-red-600" />
									)}
									<span>{logDetails.status}</span>
								</span>
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								User Id
							</span>
							<span className="text-sm font-semibold">
								{logDetails.userId}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Session Id
							</span>
							<span className="text-sm font-semibold">
								{logDetails.sessionId}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted-foreground">
								Log Timestamp
							</span>
							<span className="text-sm font-semibold">
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
