import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { P, Progress } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import type { MailboxOverview } from "./onboarding-api";
import {
	FilingStep,
	ImportStep,
	KeepOutStep,
	MailboxStep,
	OutsideStep,
	PeopleStep,
	TopicsStep,
	WelcomeStep,
	WorkStep,
} from "./onboarding-steps";
import { Failure, LoadingCards } from "./onboarding-ui";
import { useOnboardingProgress } from "./use-onboarding-progress";

const STEPS = [
	{ label: "Your mailbox" },
	{ label: "Keep out" },
	{ label: "Import" },
	{ label: "People" },
	{ label: "Outside" },
	{ label: "Sort" },
	{ label: "Topics" },
	{ label: "Work" },
];

/** First run with real mail: look, keep out, import headers, people, sort, topics from what is left, then file into Work. */
export function Onboarding({
	actions,
	initialStep = 0,
}: {
	actions: InsightActions;
	/** Start on a later step (previews). */
	initialStep?: number;
}) {
	const { step, started, isResuming, error, start, next, back } =
		useOnboardingProgress(actions, initialStep, STEPS.length - 1);
	const [days, setDays] = useState(30);
	const [overview, setOverview] = useState<MailboxOverview | null>(null);
	const [managerId, setManagerId] = useState("");
	const common = {
		actions,
		onNext: next,
		onBack: step > 0 ? back : undefined,
		eyebrow: `Step ${step + 1} of ${STEPS.length}`,
	};
	// each step starts at the top
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs on each step change
	useEffect(() => {
		window.scrollTo({
			top: 0,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
				.matches
				? "instant"
				: "smooth",
		});
	}, [step]);

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-6">
				<header className="flex flex-col gap-2">
					<P className="font-bold text-lg tracking-tight">
						collaboration<span className="text-primary">.</span>
					</P>
					<Progress
						value={started ? ((step + 1) / STEPS.length) * 100 : 0}
						aria-label={`Setup progress: step ${step + 1} of ${STEPS.length}, ${STEPS[step]?.label}`}
						className="h-1"
					/>
					<ol aria-label="Setup steps" className="sr-only">
						{STEPS.map(({ label }, index) => (
							<li
								key={label}
								aria-current={
									index === step ? "step" : undefined
								}
							>
								{label}
								{index < step ? " (done)" : ""}
							</li>
						))}
					</ol>
				</header>
				<main
					key={step}
					className="fade-in-0 flex min-w-0 animate-in flex-col gap-6 rounded-xl border bg-card p-4 duration-200 motion-reduce:animate-none sm:p-6"
				>
					{!started && !isResuming && !error && (
						<WelcomeStep
							onStart={() => {
								void start();
							}}
						/>
					)}
					{isResuming && (
						<LoadingCards label="Checking for a saved setup..." />
					)}
					{error && (
						<Failure
							error={error}
							onRetry={() => {
								void start();
							}}
						/>
					)}
					{started && step === 0 && (
						<MailboxStep
							{...common}
							days={days}
							onDays={setDays}
							onLoaded={setOverview}
						/>
					)}
					{started && step === 1 && (
						<KeepOutStep
							{...common}
							suggestions={overview?.keepOut ?? []}
						/>
					)}
					{started && step === 2 && (
						<ImportStep
							{...common}
							days={days}
							onManager={setManagerId}
						/>
					)}
					{started && step === 3 && (
						<PeopleStep
							{...common}
							selfEmail={overview?.address ?? ""}
							managerId={managerId}
						/>
					)}
					{started && step === 4 && <OutsideStep {...common} />}
					{started && step === 5 && <WorkStep {...common} />}
					{started && step === 6 && <TopicsStep {...common} />}
					{started && step === 7 && <FilingStep {...common} />}
				</main>
				<P className="flex items-center gap-2 text-muted-foreground text-xs">
					<Lock className="size-3.5 shrink-0" aria-hidden="true" />{" "}
					Your keep-out preferences apply throughout setup.
				</P>
			</div>
		</div>
	);
}
