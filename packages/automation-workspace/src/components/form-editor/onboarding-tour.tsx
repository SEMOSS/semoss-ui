import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface TourStep {
	target: string;
	title: string;
	body: string;
	placement: "top" | "bottom";
}

const STEPS: TourStep[] = [
	{
		target: "trigger-card",
		title: "Name your automation",
		body: "Click this card to expand it, then fill in the Description field. A clear name helps your team understand what this automation does at a glance.",
		placement: "bottom",
	},
	{
		target: "add-step",
		title: "Add your first step",
		body: "Each step is an action your automation takes — query a database, prompt an AI model, search a document store, and more.",
		placement: "top",
	},
	{
		target: "save",
		title: "Save your work",
		body: "Save often. The amber dot on the button means you have unsaved changes that won't be applied until you save.",
		placement: "bottom",
	},
	{
		target: "run",
		title: "Run your automation",
		body: "When your steps are configured, click Run to test the automation end-to-end and see results in real time.",
		placement: "bottom",
	},
];

const TOOLTIP_W = 288;
const GAP = 12;

interface Pos {
	top: number;
	left: number;
	arrowLeft: number;
	placement: TourStep["placement"];
}

function computePos(el: Element, placement: TourStep["placement"]): Pos {
	const rect = el.getBoundingClientRect();
	const centerX = rect.left + rect.width / 2;
	const rawLeft = centerX - TOOLTIP_W / 2;
	const clampedLeft = Math.max(
		12,
		Math.min(rawLeft, window.innerWidth - TOOLTIP_W - 12),
	);
	const arrowLeft = Math.max(
		16,
		Math.min(centerX - clampedLeft, TOOLTIP_W - 16),
	);

	const top = placement === "bottom" ? rect.bottom + GAP : rect.top - GAP; // tooltip uses transform translateY(-100%)

	return { top, left: clampedLeft, arrowLeft, placement };
}

export function OnboardingTour({ appId }: { appId: string }) {
	const DONE_KEY = `automation-tour-done-${appId}`;
	const [done, setDone] = useState(
		() => localStorage.getItem(DONE_KEY) === "true",
	);
	const [step, setStep] = useState(0);
	const [pos, setPos] = useState<Pos | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	// Position + highlight active target
	useLayoutEffect(() => {
		if (done) return;
		cleanupRef.current?.();

		const current = STEPS[step];
		const el = document.querySelector(`[data-tour="${current.target}"]`);
		if (!el) {
			setPos(null);
			return;
		}

		// Highlight the target element
		const htmlEl = el as HTMLElement;
		const prev = {
			outline: htmlEl.style.outline,
			outlineOffset: htmlEl.style.outlineOffset,
			borderRadius: htmlEl.style.borderRadius,
			position: htmlEl.style.position,
			zIndex: htmlEl.style.zIndex,
		};
		htmlEl.style.outline = "2px solid hsl(var(--primary))";
		htmlEl.style.outlineOffset = "3px";
		htmlEl.style.borderRadius = "16px";
		htmlEl.style.position = "relative";
		htmlEl.style.zIndex = "45";

		cleanupRef.current = () => {
			htmlEl.style.outline = prev.outline;
			htmlEl.style.outlineOffset = prev.outlineOffset;
			htmlEl.style.borderRadius = prev.borderRadius;
			htmlEl.style.position = prev.position;
			htmlEl.style.zIndex = prev.zIndex;
		};

		setPos(computePos(el, current.placement));

		// Recompute on resize
		const onResize = () => setPos(computePos(el, current.placement));
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
			cleanupRef.current?.();
			cleanupRef.current = null;
		};
	}, [step, done]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cleanupRef.current?.();
		};
	}, []);

	const dismiss = () => {
		cleanupRef.current?.();
		cleanupRef.current = null;
		localStorage.setItem(DONE_KEY, "true");
		setDone(true);
	};

	const next = () => {
		if (step >= STEPS.length - 1) {
			dismiss();
		} else {
			setStep((s) => s + 1);
		}
	};

	if (done || !pos) return null;

	const current = STEPS[step];
	const isLast = step === STEPS.length - 1;

	// top/left/transform are computed from getBoundingClientRect — cannot express with Tailwind
	return (
		<div
			className="fixed z-50 w-72 rounded-xl border bg-card shadow-2xl"
			style={{
				top: pos.top,
				left: pos.left,
				transform:
					pos.placement === "top" ? "translateY(-100%)" : undefined,
			}}
		>
			{/* Arrow */}
			{/* Arrow left offset is computed — cannot express with Tailwind */}
			{pos.placement === "bottom" && (
				<span
					className="-top-2 absolute h-3.5 w-3.5 rotate-45 rounded-tl-sm border-t border-l bg-card"
					style={{ left: pos.arrowLeft - 6 }}
				/>
			)}
			{pos.placement === "top" && (
				<span
					className="-bottom-2 absolute h-3.5 w-3.5 rotate-45 rounded-br-sm border-r border-b bg-card"
					style={{ left: pos.arrowLeft - 6 }}
				/>
			)}

			<div className="p-4">
				<p className="mb-1.5 font-semibold text-sm leading-snug">
					{current.title}
				</p>
				<p className="text-[12px] text-muted-foreground leading-relaxed">
					{current.body}
				</p>

				<div className="mt-3.5 flex items-center justify-between">
					{/* Dot progress */}
					<div className="flex gap-1">
						{STEPS.map((s, i) => (
							<span
								key={s.target}
								className={`block h-1.5 rounded-full transition-all ${
									i === step
										? "w-4 bg-primary"
										: "w-1.5 bg-muted-foreground/30"
								}`}
							/>
						))}
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={dismiss}
							className="text-[11px] text-muted-foreground hover:text-foreground"
						>
							Skip
						</button>
						<button
							type="button"
							onClick={next}
							className="rounded-md bg-primary px-3 py-1 font-medium text-[12px] text-primary-foreground transition-colors hover:bg-primary/90"
						>
							{isLast ? "Done" : "Next →"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
