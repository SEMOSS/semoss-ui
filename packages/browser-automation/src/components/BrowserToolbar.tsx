import {
	ArrowLeft,
	ArrowRight,
	Circle,
	Play,
	RefreshCw,
	Save,
	Send,
} from "lucide-react";
import React, { useState } from "react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Muted,
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
	const [urlInput, setUrlInput] = useState(currentUrl);
	const isActive =
		connectionState === "connected" || connectionState === "connecting";

	const submit = () => {
		const target = urlInput.trim();
		if (!target) return;
		if (isActive) onNavigate(target);
		else onStart(target);
	};

	React.useEffect(() => {
		setUrlInput(currentUrl);
	}, [currentUrl]);

	return (
		<div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 xl:w-auto xl:flex-1 xl:flex-nowrap">
			<div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-muted p-0.5">
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

			<InputGroup className="min-w-40 flex-[1_1_16rem] bg-background">
				<InputGroupInput
					value={urlInput}
					onChange={(event) => setUrlInput(event.target.value)}
					onKeyDown={(event) => event.key === "Enter" && submit()}
					placeholder="https://example.com"
					aria-label="Browser URL"
				/>
				<InputGroupAddon align="inline-end">
					<ToolbarTip label={isActive ? "Go" : "Start browser"}>
						<InputGroupButton
							size="icon-sm"
							variant="default"
							disabled={isLoading}
							onClick={submit}
						>
							{isCreating || isLoading ? (
								<Spinner />
							) : isActive ? (
								<Send />
							) : (
								<Play />
							)}
						</InputGroupButton>
					</ToolbarTip>
				</InputGroupAddon>
			</InputGroup>

			<div className="flex shrink-0 items-center gap-1.5 border-border border-l pl-2">
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
					>
						<Circle
							className={
								isRecording
									? "fill-current"
									: "text-destructive"
							}
						/>
						<Muted className="hidden text-inherit sm:inline">
							{isRecording ? "RECORDING" : "Record"}
						</Muted>
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
						<Muted className="hidden text-inherit sm:inline">
							Save
						</Muted>
					</Button>
				</ToolbarTip>
			</div>
		</div>
	);
};
