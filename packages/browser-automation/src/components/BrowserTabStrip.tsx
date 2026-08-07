import { X } from "lucide-react";
import {
	Button,
	Muted,
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
		<div className="order-[-1] flex items-end gap-0.5 overflow-x-auto border-border border-b bg-muted px-1 pt-1">
			{tabs.map((tab) => {
				const active = tab.tabId === activeTabId;
				const label = tab.title.trim() || tab.url || tab.tabId;
				const status =
					connectionState === "connected"
						? isRecording
							? {
									label: "Recording",
									dot: "bg-destructive",
								}
							: {
									label: "Live",
									dot: "bg-success",
								}
						: {
								label:
									connectionState === "connecting"
										? "Connecting"
										: "Disconnected",
								dot:
									connectionState === "connecting"
										? "animate-pulse bg-primary"
										: "bg-muted-foreground",
							};
				return (
					<div
						key={tab.tabId}
						className={`mb-[-1px] flex w-[210px] max-w-[80vw] shrink-0 items-center rounded-t-md border ${active ? "border-border border-b-card bg-card" : "border-transparent"}`}
					>
						{active && (
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										aria-hidden
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
									<Muted className="block min-w-0 truncate text-left text-foreground">
										{label}
									</Muted>
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
