import { X } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { BrowserTabInfo, ConnectionState } from "../types/browserEvents";

interface BrowserTabStripProps {
	tabs: BrowserTabInfo[];
	activeTabId: string;
	connectionState: ConnectionState;
	isRecording: boolean;
	onSwitch: (tabId: string) => void;
	onClose: (tabId: string) => void;
}

export function BrowserTabStrip({
	tabs,
	activeTabId,
	connectionState,
	isRecording,
	onSwitch,
	onClose,
}: BrowserTabStripProps) {
	if (tabs.length === 0) return null;
	return (
		<div className="order-[-1] flex items-end gap-0.5 overflow-x-auto border-line border-b bg-surface-hover px-1 pt-1">
			{tabs.map((tab) => {
				const active = tab.tabId === activeTabId;
				const label = tab.title.trim() || tab.url || tab.tabId;
				const status =
					connectionState === "connected"
						? isRecording
							? {
									label: "Recording",
									dot: "bg-danger shadow-[0_0_8px_rgba(240,82,103,0.65)]",
								}
							: {
									label: "Live",
									dot: "bg-success shadow-[0_0_8px_rgba(54,199,176,0.55)]",
								}
						: {
								label:
									connectionState === "connecting"
										? "Connecting"
										: "Disconnected",
								dot:
									connectionState === "connecting"
										? "animate-pulse bg-slate-400"
										: "bg-slate-500",
							};
				return (
					<div
						key={tab.tabId}
						className={`mb-[-1px] flex w-[210px] max-w-[80vw] shrink-0 items-center rounded-t-md border ${active ? "border-line border-b-surface bg-surface" : "border-transparent"}`}
					>
						{active && (
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className={`ml-2 size-2 shrink-0 rounded-full ${status.dot}`}
									/>
								</TooltipTrigger>
								<TooltipContent>{status.label}</TooltipContent>
							</Tooltip>
						)}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onSwitch(tab.tabId)}
									className="min-w-0 flex-1 justify-start overflow-hidden px-2 font-normal"
								>
									<span className="block min-w-0 truncate text-left">
										{label}
									</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>{tab.url || label}</TooltipContent>
						</Tooltip>
						{tabs.length > 1 && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon-sm"
										variant="ghost"
										aria-label={`Close ${label}`}
										disabled={isRecording}
										onClick={() => onClose(tab.tabId)}
										className="mr-1 size-6"
									>
										<X className="size-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{isRecording
										? "Stop recording before closing tabs"
										: "Close tab"}
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				);
			})}
		</div>
	);
}
