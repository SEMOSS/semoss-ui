import {
	CircleX as Cancel,
	CircleCheck as CheckCircleIcon,
	Copy as CopyIcon,
	ChevronDown as KeyboardArrowDownIcon,
	ChevronRight as KeyboardArrowRightIcon,
	FoldVertical as UnfoldLessIcon,
	UnfoldVertical as UnfoldMoreIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, toast } from "@semoss/ui/next";
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
		if (value === null) return <span className="text-primary">null</span>;
		if (typeof value === "string")
			return (
				<span className="text-destructive">&quot;{value}&quot;</span>
			);
		if (typeof value === "number")
			return <span className="text-emerald-600">{value}</span>;
		if (typeof value === "boolean")
			return <span className="text-primary">{value.toString()}</span>;
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
				<span className="text-primary">{isArray ? "[" : "{"}</span>
				{!isExpanded && (
					<span className="text-primary">
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
			{isExpanded && (
				<span className="text-primary">{isArray ? "]" : "}"}</span>
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

//Matches the table/timeline: success is truthy and not the string "false".
const isSuccessStatus = (status: unknown) =>
	Boolean(status) && status !== "false";

interface DetailFieldProps {
	label: string;
	value: ReactNode;
	/** Render the value monospace + break-all (for long ids). */
	mono?: boolean;
}

//A single label/value pair in the detail grid.
const DetailField = ({ label, value, mono = false }: DetailFieldProps) => (
	<div className="flex min-w-0 flex-col gap-0.5">
		<span className="text-muted-foreground text-xs leading-[1.66]">
			{label}
		</span>
		<span
			className={`font-medium text-foreground text-sm leading-[1.43] ${
				mono ? "break-all font-mono" : ""
			}`}
		>
			{value === null || value === undefined || value === ""
				? "—"
				: value}
		</span>
	</div>
);

/**
 * A drawer component for displaying audit log details.
 *
 *
 * @param {logDetails} The audit log details object.
 * @returns {JSX.Element} A JSX element which is a side drwawer.
 */
export const AuditLogsDetailDrawer = (props) => {
	const { logDetails } = props;
	const { t } = useTranslation("auditlog");
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
	 * Copy the full audit log record as formatted JSON, so it can be pulled out
	 * and compared (e.g. confirming two similar-looking rows have distinct
	 * span/request ids). Copies every field, not just the visible columns.
	 */
	const handleCopyJson = useCallback(async () => {
		if (!logDetails) return;
		try {
			await navigator.clipboard.writeText(
				JSON.stringify(logDetails, null, 2),
			);
			toast.success(t("detail.copySuccess"));
		} catch (error) {
			toast.error(t("detail.copyFailed", { error: String(error) }));
		}
	}, [logDetails, t]);

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
				{t("detail.noDetails")}
			</span>
		);
	return (
		<div
			ref={drawerRef}
			className="end-0 top-20 flex h-full min-w-[500px] flex-col bg-card"
		>
			<div className="flex items-center justify-between gap-2 border-b bg-muted/60 py-2 ps-3 pe-12">
				<span className="font-normal text-base text-primary leading-normal">
					{t("detail.title")}
				</span>
				<Button
					size="sm"
					variant="outline"
					onClick={handleCopyJson}
					title={t("detail.copyJsonTooltip")}
				>
					<CopyIcon className="h-4 w-4" />
					{t("detail.copyJson")}
				</Button>
			</div>

			{logDetails && (
				<div className="flex-1 overflow-y-auto bg-card">
					{/* Title + status badge */}
					<div className="flex items-start justify-between gap-3 border-b px-4 py-3">
						<div className="flex min-w-0 flex-col">
							<span className="break-all font-semibold text-base text-foreground leading-snug">
								{logDetails.methodName ||
									logDetails.engineName ||
									t("common.event")}
							</span>
							<span className="text-muted-foreground text-sm">
								{logDetails.engineName}
								{logDetails.engineType
									? ` · ${logDetails.engineType}`
									: ""}
							</span>
						</div>
						<span
							className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs ${
								isSuccessStatus(logDetails.status)
									? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
									: "bg-destructive/10 text-destructive"
							}`}
						>
							{isSuccessStatus(logDetails.status) ? (
								<CheckCircleIcon className="h-3.5 w-3.5" />
							) : (
								<Cancel className="h-3.5 w-3.5" />
							)}
							{isSuccessStatus(logDetails.status)
								? t("common.success")
								: t("common.failed")}
						</span>
					</div>

					{/* Metrics, user, timing */}
					<div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b px-4 py-3">
						<DetailField
							label={t("detail.fields.latency")}
							value={`${logDetails.latency}ms`}
						/>
						<DetailField
							label={t("detail.fields.tokens")}
							value={logDetails.tokens}
						/>
						<DetailField
							label={t("detail.fields.user")}
							value={logDetails.userName}
						/>
						<DetailField
							label={t("detail.fields.userId")}
							value={logDetails.userId}
						/>
						<DetailField
							label={t("detail.fields.start")}
							value={`${TimeDateFormatter(logDetails.startTime).date} ${TimeDateFormatter(logDetails.startTime).time}`}
						/>
						<DetailField
							label={t("detail.fields.end")}
							value={`${TimeDateFormatter(logDetails.endTime).date} ${TimeDateFormatter(logDetails.endTime).time}`}
						/>
						<DetailField
							label={t("detail.fields.logTimestamp")}
							value={`${TimeDateFormatter(logDetails.logTimestamp).date} ${TimeDateFormatter(logDetails.logTimestamp).time}`}
						/>
					</div>

					{/* Trace identifiers (full width, monospace for easy comparison) */}
					<div className="flex flex-col gap-3 border-b px-4 py-3">
						<DetailField
							label={t("detail.fields.sessionId")}
							value={logDetails.sessionId}
							mono
						/>
						<DetailField
							label={t("detail.fields.requestId")}
							value={logDetails.requestId}
							mono
						/>
						<DetailField
							label={t("detail.fields.spanId")}
							value={logDetails.spanId}
							mono
						/>
					</div>

					{/* Request / Response payloads */}
					<div className="px-4 py-3">
						<div className="mb-1.5 flex items-center justify-between">
							<span className="font-semibold text-foreground">
								{t("detail.fields.request")}
							</span>
							{showPromptExpandButton && (
								<Button
									size="sm"
									variant="outline"
									onClick={handlePromptToggle}
								>
									{promptExpandAll ? (
										<UnfoldLessIcon />
									) : (
										<UnfoldMoreIcon />
									)}
									{promptExpandAll
										? t("detail.collapseAll")
										: t("detail.expandAll")}
								</Button>
							)}
						</div>
						<div className="mb-4 rounded-md border border-border">
							{promptData ? (
								<div className="overflow-x-auto rounded p-2 font-[inter] text-foreground text-sm leading-[1.4]">
									<JSONTreeView
										data={promptData}
										expandAll={promptExpandAll}
									/>
								</div>
							) : (
								<div className="whitespace-pre-wrap break-words p-2 text-foreground text-sm leading-relaxed">
									{logDetails.request}
								</div>
							)}
						</div>
						<div className="mb-1.5 flex items-center justify-between">
							<span className="font-semibold text-foreground">
								{t("detail.fields.response")}
							</span>
							{showResponseExpandButton && (
								<Button
									size="sm"
									variant="outline"
									onClick={handleResponseToggle}
								>
									{responseExpandAll ? (
										<UnfoldLessIcon />
									) : (
										<UnfoldMoreIcon />
									)}
									{responseExpandAll
										? t("detail.collapseAll")
										: t("detail.expandAll")}
								</Button>
							)}
						</div>
						<div className="rounded-md border border-border bg-muted/30">
							{responseData ? (
								<div className="overflow-x-auto rounded p-2 font-[inter] text-foreground text-sm leading-[1.4]">
									<JSONTreeView
										data={responseData}
										expandAll={responseExpandAll}
									/>
								</div>
							) : (
								<div className="whitespace-pre-wrap break-words p-2 text-foreground text-sm leading-relaxed">
									{logDetails.response}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
