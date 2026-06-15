import {
	CircleX as Cancel,
	CircleCheck as CheckCircleIcon,
	ChevronDown as KeyboardArrowDownIcon,
	ChevronRight as KeyboardArrowRightIcon,
	FoldVertical as UnfoldLessIcon,
	UnfoldVertical as UnfoldMoreIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { TimeDateFormatter } from "./common";

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

	/**
	 * Returns a JSX element representing a value in a JSON tree view.
	 * @param {unknown} value - The value to render.
	 * @returns {React.ReactElement | null} - A JSX element representing the value, or null if the value is unknown.
	 */
	const renderValue = (value: unknown) => {
		if (value === null)
			return <span style={{ color: "#0471F0" }}>null</span>;
		if (typeof value === "string")
			return <span style={{ color: "#DA291C" }}>"{value}"</span>;
		if (typeof value === "number")
			return <span style={{ color: "#348700" }}>{value}</span>;
		if (typeof value === "boolean")
			return <span style={{ color: "#0471F0" }}>{value.toString()}</span>;
		return null;
	};

	if (!hasChildren) {
		return <span>{renderValue(data)}</span>;
	}

	const isArray = Array.isArray(data);
	const isEmpty = Object.keys(data as object).length === 0;

	return (
		<div className={isChild ? "ms-[3px]" : "ms-0"}>
			<div className="flex items-center">
				{isChild && (
					// biome-ignore lint/a11y/noStaticElementInteractions: <need events to be handled>
					// biome-ignore lint/a11y/useKeyWithClickEvents: <need onclick event, onkey events may not be appropriate>
					<div
						className="me-1 inline-flex cursor-pointer items-center px-1 [&>svg]:h-4 [&>svg]:w-4"
						onClick={toggleExpand}
					>
						{isExpanded ? (
							<KeyboardArrowDownIcon />
						) : (
							<KeyboardArrowRightIcon />
						)}
					</div>
				)}
				<span style={{ color: "#0471F0" }}>{isArray ? "[" : "{"}</span>
				{!isExpanded && (
					<span style={{ color: "#0471F0" }}>
						{isEmpty
							? isArray
								? "]"
								: "}"
							: isArray
								? "...]"
								: "...}"}
					</span>
				)}
			</div>
			{isExpanded && (
				<div>
					{Object.entries(data).map(([key, value]) => (
						<div key={key} className="ms-4">
							{!isArray && (
								<>
									<span style={{ color: "#0471F0" }}>
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
			{isExpanded && (
				<span style={{ color: "#0471F0" }}>{isArray ? "]" : "}"}</span>
			)}
		</div>
	);
};

/**
 * Returns true if the given data has expandable content.
 * Expandable content is content that is not null and is of type object.
 * This function is used to determine if a JSON tree view should be expanded or not.
 * @param {unknown} data - The data to check for expandable content.
 * @returns {boolean} - True if the data has expandable content, false otherwise.
 */
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

/**
 * A drawer component for displaying audit log details.
 *
 *
 * @param {logDetails} The audit log details object.
 * @returns {JSX.Element} A JSX element which is a side drwawer.
 */
export const AuditLogsDetailDrawer = (props) => {
	const { logDetails } = props;
	const [_width, setWidth] = useState(500);
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

	/**
	 * Toggle the prompt to expand/collapse.
	 */
	const handlePromptToggle = () => {
		setPromptExpandAll((prev) => !prev);
	};

	/**
	 * Toggle the response to expand/collapse.
	 */
	const handleResponseToggle = () => {
		setResponseExpandAll((prev) => !prev);
	};

	/**
	 * Attempts to parse the request of an audit log into a JSON object.
	 *
	 * @returns {unknown|null} The parsed request JSON object, or null if the request is not JSON.
	 */
	const getPromptData = () => {
		try {
			return JSON.parse(logDetails.request);
		} catch {
			return null;
		}
	};

	/**
	 * Attempts to parse the response of an audit log into a JSON object.
	 *
	 * @returns {unknown|null} The parsed response JSON object, or null if the response is not JSON.
	 */
	const getResponseData = () => {
		try {
			return JSON.parse(logDetails.response);
		} catch {
			return null;
		}
	};

	const promptData = logDetails ? getPromptData() : null; // request data in json or null
	const responseData = logDetails ? getResponseData() : null; // response data in json or null
	const showPromptExpandButton =
		promptData && hasExpandableContent(promptData); //show request prompt expand button
	const showResponseExpandButton =
		responseData && hasExpandableContent(responseData); //show request prompt expand button
	//if no logs, then display no details available
	if (!logDetails)
		return (
			<span className="font-normal text-sm leading-[1.43] tracking-normal">
				No details available
			</span>
		);
	return (
		<div
			ref={drawerRef}
			className="end-0 top-20 flex h-full min-w-[500px] flex-col bg-white"
		>
			<div className="flex items-center justify-between border-b bg-[#F5F9FE] px-3 py-2">
				<span className="font-normal text-base text-primary leading-normal">
					Audit Details
				</span>
				{/* <button
					onClick={handleDrawerClose}
					type="button"
					className="inline-flex items-center justify-center rounded-full p-1 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
					aria-label="Close"
				>
					<CloseIcon className="h-4 w-4" />
				</button> */}
			</div>

			{logDetails && (
				<div className="flex-1 overflow-y-auto bg-white p-0">
					<div className="border-gray-200 border-b px-3 py-2">
						<span className="mb-4 font-semibold text-black text-sm leading-[1.57] tracking-normal">
							Event Summary
						</span>
						<div className="mt-3 mb-1.5 flex items-center justify-between">
							<span className="flex items-center gap-2 font-semibold text-gray-900">
								Request
							</span>
							{showPromptExpandButton && (
								<Button size="sm" onClick={handlePromptToggle}>
									{promptExpandAll ? (
										<UnfoldLessIcon />
									) : (
										<UnfoldMoreIcon />
									)}
									{promptExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</div>
						{/*
						//theme.palette.background.paper2
						*/}
						<div className="mb-3 rounded-md border border-gray-300">
							{(() => {
								if (promptData) {
									return (
										<div className="overflow-x-auto rounded p-2 font-[inter] text-gray-900 text-sm leading-[1.4]">
											<JSONTreeView
												data={promptData}
												expandAll={promptExpandAll}
											/>
										</div>
									);
								}
								return (
									<span className="font-normal text-sm leading-[1.43] tracking-normal">
										{logDetails.request}
									</span>
								);
							})()}
						</div>
						<div className="mt-0 mb-1.5 flex items-center justify-between">
							<span className="flex items-center gap-2 font-semibold text-gray-900">
								Response
							</span>
							{showResponseExpandButton && (
								<Button
									size="sm"
									onClick={handleResponseToggle}
								>
									{responseExpandAll ? (
										<UnfoldLessIcon />
									) : (
										<UnfoldMoreIcon />
									)}
									{responseExpandAll
										? "Collapse All"
										: "Expand All"}
								</Button>
							)}
						</div>
						<div className="rounded-md border border-gray-300 bg-[#FAFAFA]">
							{(() => {
								if (responseData) {
									return (
										<div className="overflow-x-auto rounded p-2 font-[inter] text-gray-900 text-sm leading-[1.4]">
											<JSONTreeView
												data={responseData}
												expandAll={responseExpandAll}
											/>
										</div>
									);
								}
								return (
									<span className="whitespace-pre-wrap break-words text-primary leading-relaxed">
										{logDetails.response}
									</span>
								);
							})()}
						</div>
					</div>

					<div
						className="grid gap-3"
						style={{
							gridTemplateColumns: "1fr 1fr",
							padding: "20px",
						}}
					>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Engine Type
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
								{logDetails.engineType}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Engine Name
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
								{logDetails.engineName}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Latency
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
								{logDetails.latency}s
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Tokens
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
								{logDetails.tokens}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Timestamp
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
								{`${TimeDateFormatter(logDetails.startTime).time} - ${
									TimeDateFormatter(logDetails.endTime).time
								}`}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Request Status
							</span>
							<span className="font-normal text-gray-900 text-sm leading-[1.43]">
								<div className="flex items-center gap-2">
									{logDetails.status ? (
										<CheckCircleIcon color="#2e7d32" />
									) : (
										<Cancel color="#da291c" />
									)}
									<span className="font-bold text-gray-900 text-sm leading-[1.43]">
										{logDetails.status}
									</span>
								</div>
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								User Id
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
								{logDetails.userId}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Session Id
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
								{logDetails.sessionId}
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-normal text-gray-500 text-xs leading-[1.66]">
								Log Timestamp
							</span>
							<span className="font-bold text-gray-900 text-sm leading-[1.43]">
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
