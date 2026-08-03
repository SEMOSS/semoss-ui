import {
	ArrowLeft,
	ArrowRight,
	Circle,
	Play,
	RefreshCw,
	Save,
	Send,
	Square,
} from "lucide-react";
import React, { useState } from "react";
import {
	Button,
	Input,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ConnectionState } from "../types/browserEvents";

interface BrowserToolbarProps {
	currentUrl: string;
	connectionState: ConnectionState;
	isCreating: boolean;
	isLoading: boolean;
	onStart: (url: string) => void;
	onStop: () => void;
	onNavigate: (url: string) => void;
	onBack: () => void;
	onForward: () => void;
	onReload: () => void;
	isRecording: boolean;
	isSaving: boolean;
	canSaveRecording: boolean;
	onToggleRecording: () => void;
	onOpenSaveRecording: () => void;
}

function ToolbarTip({
	label,
	children,
}: {
	label: string;
	children: React.ReactElement;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children as never}</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

export const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
	currentUrl,
	connectionState,
	isCreating,
	isLoading,
	onStart,
	onStop,
	onNavigate,
	onBack,
	onForward,
	onReload,
	isRecording,
	isSaving,
	canSaveRecording,
	onToggleRecording,
	onOpenSaveRecording,
}) => {
	const [urlInput, setUrlInput] = useState("https://github.com");
	const isActive =
		connectionState === "connected" || connectionState === "connecting";

	const submit = () => {
		const target = urlInput.trim();
		if (!target) return;
		if (isActive) onNavigate(target);
		else onStart(target);
	};

	React.useEffect(() => {
		if (currentUrl) setUrlInput(currentUrl);
	}, [currentUrl]);

	return (
		<div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 xl:w-auto xl:flex-1 xl:flex-nowrap">
			<div className="flex shrink-0 items-center gap-0.5 rounded-md border border-line bg-surface-raised/70 p-0.5">
				<ToolbarTip label="Back">
					<Button
						size="icon-sm"
						variant="ghost"
						disabled={!isActive || isLoading}
						onClick={onBack}
					>
						<ArrowLeft />
					</Button>
				</ToolbarTip>
				<ToolbarTip label="Forward">
					<Button
						size="icon-sm"
						variant="ghost"
						disabled={!isActive || isLoading}
						onClick={onForward}
					>
						<ArrowRight />
					</Button>
				</ToolbarTip>
				<ToolbarTip label="Reload">
					<Button
						size="icon-sm"
						variant="ghost"
						disabled={!isActive || isLoading}
						onClick={onReload}
					>
						<RefreshCw />
					</Button>
				</ToolbarTip>
			</div>

			<div className="flex h-9 min-w-40 flex-[1_1_16rem] items-center gap-1 rounded-md border border-line bg-canvas px-1 shadow-black/20 shadow-inner focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/15">
				<Input
					value={urlInput}
					onChange={(event) => setUrlInput(event.target.value)}
					onKeyDown={(event) => event.key === "Enter" && submit()}
					placeholder="https://example.com"
					aria-label="Browser URL"
					className="h-7 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
				/>
				<ToolbarTip label={isActive ? "Go" : "Start browser"}>
					<Button
						size="icon-sm"
						disabled={isLoading}
						onClick={submit}
					>
						{isCreating ? (
							<Spinner />
						) : isActive ? (
							<Send />
						) : (
							<Play />
						)}
					</Button>
				</ToolbarTip>
			</div>

			<div className="flex shrink-0 items-center gap-1">
				{isActive && (
					<ToolbarTip label="Stop viewer">
						<Button
							size="icon-sm"
							variant="outline"
							className="text-danger"
							onClick={onStop}
						>
							<Square />
						</Button>
					</ToolbarTip>
				)}
				<span
					className="grid h-8 w-8 place-items-center"
					aria-live="polite"
				>
					{isLoading && <Spinner className="text-accent" />}
				</span>
			</div>

			<div className="flex shrink-0 items-center gap-1.5 border-line border-l pl-2">
				<ToolbarTip
					label={
						isRecording
							? "Stop recording future interactions"
							: "Start recording future interactions"
					}
				>
					<Button
						size="sm"
						variant={isRecording ? "destructive" : "outline"}
						disabled={connectionState !== "connected"}
						onClick={onToggleRecording}
						className={
							isRecording
								? "shadow-[0_0_18px_rgba(240,82,103,0.34)]"
								: ""
						}
					>
						<Circle
							className={
								isRecording ? "fill-current" : "text-danger"
							}
						/>
						<span className="hidden sm:inline">
							{isRecording ? "RECORDING" : "Record"}
						</span>
					</Button>
				</ToolbarTip>
				<ToolbarTip label="Save recording to project recordings folder">
					<Button
						size="sm"
						variant="outline"
						disabled={!canSaveRecording || isSaving}
						onClick={onOpenSaveRecording}
					>
						{isSaving ? <Spinner /> : <Save />}
						<span className="hidden sm:inline">Save</span>
					</Button>
				</ToolbarTip>
			</div>
		</div>
	);
};
