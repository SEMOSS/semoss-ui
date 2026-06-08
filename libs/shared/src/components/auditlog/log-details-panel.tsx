import {
	Check,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Copy,
	Expand,
	ListCollapse,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";
import { type AuditLog, latencyColor, parseArg } from "./types/audit";

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

	return (
		<div style={{ marginLeft: isChild ? 3 : 0 }}>
			<div className="flex items-center">
				{isChild && (
					<button
						type="button"
						className="mr-1 inline-flex cursor-pointer items-center border-none bg-transparent px-1 [&>svg]:h-4 [&>svg]:w-4"
						onClick={toggleExpand}
					>
						{isExpanded ? (
							<span style={{ color: "#0471F0" }}>
								<ChevronDown size={13} />
							</span>
						) : (
							<span style={{ color: "#0471F0" }}>
								<ChevronRight size={13} />
							</span>
						)}
					</button>
				)}
				{isChild && (
					<>
						{isArray ? (
							""
						) : (
							<span style={{ color: "#0471F0" }}>"</span>
						)}
						<span
							style={{
								color: "#0471F0",
							}}
						>
							{isArray ? "[" : "{"}
						</span>
					</>
				)}
			</div>
			{isExpanded && (
				<div style={isChild ? { padding: "0px" } : { padding: "20px" }}>
					{Object.entries(data).map(([key, value]) => (
						<div key={key} style={{ marginLeft: isChild ? 16 : 0 }}>
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
			{isExpanded && isChild && (
				<div style={{ marginLeft: isChild ? 0 : 16 }}>
					<span
						style={{
							color: "#0471F0",
						}}
					>
						{isArray ? "]" : "}"}
					</span>
				</div>
			)}
		</div>
	);
};

interface LogDetailPanelProps {
	log: AuditLog | null;
}

const CopyButton = ({ text }: { text: string }) => {
	const [copied, setCopied] = useState(false);

	return (
		<Button
			onClick={(e) => {
				e.stopPropagation();
				navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			variant="link"
			className="flex h-5 items-center text-muted-foreground hover:rounded-none hover:border-none hover:bg-none hover:text-primary"
		>
			{copied ? <Check size={5} /> : <Copy size={5} />}
		</Button>
	);
};

const formatJson = (value: string) => {
	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return value;
	}
};

const DetailContent = ({
	log,
	isExpanded,
}: {
	log: AuditLog;
	isExpanded?: boolean;
}) => {
	const [jsonExpanded, setJsonExpanded] = useState(false);

	const rows: [string, string, boolean][] = [
		["Span ID", log.spanId, true],
		["Session ID", log.sessionId, true],
		["User ID", log.userId, true],
		["Engine", `${log.engineName} · ${log.engineType}`, false],
		["Method", log.methodName, true],
		["Request", log.request, true],
		["Timestamps", `${log.startTime} → ${log.endTime}`, false],
		["Latency", `${log.latency} ms`, false],
		["Tokens", String(log.tokens), false],
		["Status", log.status ? "Completed" : "Failed", false],
	];

	const parseJsonSafely = (value: string) => {
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	};

	return (
		<div className="grid grid-cols-2 gap-x-4 gap-y-0">
			{rows.map(([label, value, mono]) => (
				<div key={label} className="border-border/30 border-b py-1.5">
					<p className="mb-0.5 text-[8px] text-muted-foreground uppercase tracking-widest">
						{label}
					</p>

					<div className="flex items-start">
						{label === "Request" ? (
							<div className="relative w-full">
								<div
									className={`w-full overflow-auto whitespace-pre rounded bg-muted/40 p-2 pr-14 font-mono text-[10px] leading-tight ${
										isExpanded ? "max-h-130" : "max-h-60"
									}`}
								>
									{(() => {
										const jsonData = parseJsonSafely(value);
										if (jsonData) {
											return (
												<JSONTreeView
													data={jsonData}
													expandAll={jsonExpanded}
												/>
											);
										}
										return <code>{formatJson(value)}</code>;
									})()}
								</div>

								<div className="absolute top-1 right-3 flex items-center gap-1 bg-transparent">
									<Button
										onClick={(e) => {
											e.stopPropagation();
											setJsonExpanded((prev) => !prev);
										}}
										variant="link"
										className="flex h-5 items-center text-muted-foreground hover:rounded-none hover:border-none hover:bg-none hover:text-primary"
										title={
											jsonExpanded
												? "Collapse all"
												: "Expand all"
										}
									>
										{jsonExpanded ? (
											<ListCollapse size={5} />
										) : (
											<Expand size={5} />
										)}
									</Button>
									<CopyButton text={value} />
								</div>
							</div>
						) : (
							<>
								<span
									className={`break-all text-[10px] leading-tight ${
										mono ? "font-mono" : ""
									} ${
										label === "Status"
											? value === "Completed"
												? "text-success"
												: "text-destructive"
											: "text-foreground"
									}`}
								>
									{value || "empty"}
								</span>

								{value &&
									mono &&
									(label === "Span ID" ||
										label === "Session ID") && (
										<div className="ml-4">
											<CopyButton text={value} />
										</div>
									)}
							</>
						)}
					</div>
				</div>
			))}
		</div>
	);
};

const LogDetailPanel = ({ log }: LogDetailPanelProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	if (!log) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground text-xs">
				Click a log entry to view details
			</div>
		);
	}

	return (
		<>
			<div className="flex h-full flex-col">
				<div className="flex flex-shrink-0 items-center justify-between gap-2 border-border border-b px-3 py-2">
					<div className="flex min-w-0 items-center gap-2">
						{log.status ? (
							<CheckCircle
								size={12}
								className="flex-shrink-0 text-success"
							/>
						) : (
							<XCircle
								size={12}
								className="flex-shrink-0 text-destructive"
							/>
						)}

						<span className="font-mono text-primary text-xs">
							{log.methodName}
						</span>

						{parseArg(log.request) && (
							<span
								className="max-w-[800px] truncate rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary"
								title={parseArg(log.request)}
							>
								{parseArg(log.request)}
							</span>
						)}
					</div>

					<div className="flex flex-shrink-0 items-center gap-2">
						<span
							className={`ml-auto font-medium font-mono text-[10px] ${latencyColor(
								log.latency,
							)}`}
						>
							{log.latency}ms
						</span>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setIsExpanded(true)}
							className="h-6 w-6 p-1 text-muted-foreground transition-colors hover:text-foreground"
							title="Expand to fullscreen"
						>
							<Expand size={14} />
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-3 py-1 [scrollbar-width:thin]">
					<DetailContent log={log} isExpanded={false} />
				</div>
			</div>

			{isExpanded && (
				<div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
					<div className="flex flex-shrink-0 items-center justify-between gap-2 border-border border-b bg-card px-4 py-3">
						<div className="flex min-w-0 items-center gap-2">
							{log.status ? (
								<CheckCircle
									size={16}
									className="flex-shrink-0 text-success"
								/>
							) : (
								<XCircle
									size={16}
									className="flex-shrink-0 text-destructive"
								/>
							)}

							<span className="font-mono text-primary text-sm">
								{log.methodName}
							</span>
							{parseArg(log.request) && (
								<span
									className="max-w-[900px] truncate rounded border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary"
									title={parseArg(log.request)}
								>
									{parseArg(log.request)}
								</span>
							)}
						</div>

						<div className="flex flex-shrink-0 items-center gap-2">
							<span
								className={`font-medium font-mono text-sm ${latencyColor(
									log.latency,
								)}`}
							>
								{log.latency}ms
							</span>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setIsExpanded(false)}
								className="h-8 w-8 p-1 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
								title="Close fullscreen"
							>
								<X size={18} />
							</Button>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]">
						<div className="max-w-[90vw]">
							<DetailContent log={log} isExpanded={true} />
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default LogDetailPanel;
