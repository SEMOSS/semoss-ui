import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, MapIcon, XIcon } from "lucide-react";
import { Button } from "@semoss/ui/next";
import { useTour } from "@/hooks";

interface TourStep {
	target?: string;
	title: string;
	content: string;
	placement?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
	{
		title: "Welcome!",
		content:
			"Let's take a quick tour of the key features. Click Next to get started.",
	},
	{
		target: "tour-input",
		title: "Start a conversation",
		content:
			"Type your question here and press Enter. Your AI assistant will respond with helpful, accurate information.",
		placement: "top",
	},
	{
		target: "tour-input-menu",
		title: "Attach & configure",
		content:
			"Click here to attach files, connect knowledge bases, or enable additional AI tools for your conversation.",
		placement: "top",
	},
	{
		target: "tour-new-chat",
		title: "New chat",
		content:
			"Start a fresh conversation at any time by clicking here. Your previous chats are always saved in the sidebar.",
		placement: "right",
	},
];

const CARD_WIDTH = 320;
const SPOTLIGHT_PAD = 6;

function getTargetRect(target: string | undefined): DOMRect | null {
	if (!target) return null;
	const el = document.querySelector(`[data-tour="${target}"]`);
	return el ? el.getBoundingClientRect() : null;
}

function getCardStyle(
	rect: DOMRect | null,
	placement: TourStep["placement"],
): React.CSSProperties {
	if (!rect) {
		return {
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			width: CARD_WIDTH,
		};
	}

	const PAD = 16;
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const W = CARD_WIDTH;
	const CARD_H = 180;

	const centerLeft = Math.min(
		Math.max(rect.left + rect.width / 2 - W / 2, 8),
		vw - W - 8,
	);
	const centerTop = Math.min(
		Math.max(rect.top + rect.height / 2 - CARD_H / 2, 8),
		vh - CARD_H - 8,
	);

	switch (placement) {
		case "top":
			return {
				position: "fixed",
				top: Math.max(rect.top - CARD_H - PAD, 8),
				left: centerLeft,
				width: W,
			};
		case "bottom":
			return {
				position: "fixed",
				top: Math.min(rect.bottom + PAD, vh - CARD_H - 8),
				left: centerLeft,
				width: W,
			};
		case "left":
			return {
				position: "fixed",
				top: centerTop,
				left: Math.max(rect.left - W - PAD, 8),
				width: W,
			};
		case "right":
		default:
			return {
				position: "fixed",
				top: centerTop,
				left: Math.min(rect.right + PAD, vw - W - 8),
				width: W,
			};
	}
}

export const LandingTour: React.FC = () => {
	const { isOpen, stopTour } = useTour();
	const [step, setStep] = useState(0);
	const [rect, setRect] = useState<DOMRect | null>(null);

	const currentStep = TOUR_STEPS[step];
	const isFirst = step === 0;
	const isLast = step === TOUR_STEPS.length - 1;

	// Reset to step 0 when tour opens
	useEffect(() => {
		if (isOpen) setStep(0);
	}, [isOpen]);

	// Update target rect whenever step or open state changes
	useEffect(() => {
		if (!isOpen) return;

		const update = () => {
			setRect(getTargetRect(currentStep.target));
		};

		// Small delay so navigation/render can complete
		const timeout = setTimeout(update, 80);

		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);

		return () => {
			clearTimeout(timeout);
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, [step, isOpen, currentStep.target]);

	if (!isOpen) return null;

	const cardStyle = getCardStyle(rect, currentStep.placement);

	return createPortal(
		<>
			{/* Clickable backdrop */}
			<div
				aria-hidden="true"
				style={{
					position: "fixed",
					inset: 0,
					zIndex: 9998,
					cursor: "default",
				}}
				onClick={stopTour}
			/>

			{/* Spotlight over target element */}
			{rect ? (
				<div
					aria-hidden="true"
					style={{
						position: "fixed",
						top: rect.top - SPOTLIGHT_PAD,
						left: rect.left - SPOTLIGHT_PAD,
						width: rect.width + SPOTLIGHT_PAD * 2,
						height: rect.height + SPOTLIGHT_PAD * 2,
						borderRadius: 8,
						boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
						zIndex: 9999,
						pointerEvents: "none",
						outline: "2px solid hsl(var(--primary))",
						outlineOffset: "2px",
					}}
				/>
			) : (
				/* Plain overlay for steps with no target */
				<div
					aria-hidden="true"
					style={{
						position: "fixed",
						inset: 0,
						backgroundColor: "rgba(0, 0, 0, 0.55)",
						zIndex: 9999,
						pointerEvents: "none",
					}}
				/>
			)}

			{/* Tour card */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label={currentStep.title}
				style={{ ...cardStyle, zIndex: 10000 }}
				className="rounded-lg border border-border bg-background shadow-2xl"
			>
				<div className="flex flex-col gap-3 p-4">
					{/* Header */}
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2">
							<MapIcon className="size-4 shrink-0 text-primary" />
							<span className="font-semibold text-foreground text-sm leading-tight">
								{currentStep.title}
							</span>
						</div>
						<button
							type="button"
							onClick={stopTour}
							aria-label="Close tour"
							className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
						>
							<XIcon className="size-4" />
						</button>
					</div>

					{/* Content */}
					<p className="text-muted-foreground text-sm leading-relaxed">
						{currentStep.content}
					</p>

					{/* Footer */}
					<div className="flex items-center justify-between pt-1">
						<span className="text-muted-foreground text-xs">
							{step + 1} / {TOUR_STEPS.length}
						</span>
						<div className="flex items-center gap-1.5">
							<Button
								variant="ghost"
								size="sm"
								onClick={stopTour}
								className="text-muted-foreground hover:text-foreground"
							>
								Skip
							</Button>
							{!isFirst && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setStep((s) => s - 1)}
								>
									<ChevronLeftIcon className="size-4" />
									Back
								</Button>
							)}
							{isLast ? (
								<Button size="sm" onClick={stopTour}>
									Done
								</Button>
							) : (
								<Button
									size="sm"
									onClick={() => setStep((s) => s + 1)}
								>
									Next
									<ChevronRightIcon className="size-4" />
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</>,
		document.body,
	);
};
