import {
	Building2,
	Check,
	Download,
	Lock,
	Mail,
	ShieldCheck,
	Sparkles,
	Tags,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn, P } from "@semoss/ui/next";
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
	{ label: "Your mailbox", caption: "A first look", icon: Mail },
	{
		label: "Keep out",
		caption: "Before anything is read",
		icon: ShieldCheck,
	},
	{ label: "Import", caption: "Recent conversations", icon: Download },
	{ label: "People", caption: "Who matters most", icon: Users },
	{ label: "Outside", caption: "Clients and partners", icon: Building2 },
	{ label: "Sort", caption: "Automated mail set aside", icon: Sparkles },
	{ label: "Topics", caption: "What your work is about", icon: Tags },
	{ label: "Work", caption: "Filed for you", icon: Check },
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
			<div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-8">
				<header className="space-y-6">
					<div className="space-y-1">
						<P className="font-bold text-xl tracking-tight">
							collaboration<span className="text-primary">.</span>
						</P>
						<P className="text-muted-foreground text-sm">
							Set up your people, topics, and Work.
						</P>
					</div>
					<ol
						aria-label="Setup steps"
						className="grid grid-cols-4 gap-2 sm:grid-cols-8"
					>
						{STEPS.map(({ label, icon: Icon }, index) => {
							const isDone = index < step;
							const isActive = index === step;
							return (
								<li
									key={label}
									aria-current={isActive ? "step" : undefined}
									className={cn(
										"flex min-w-0 flex-col items-center gap-2 rounded-lg p-2 text-center",
										isActive && "bg-primary/10",
									)}
								>
									<span
										className={cn(
											"flex size-8 items-center justify-center rounded-full ring-1 transition-colors motion-reduce:transition-none",
											isDone
												? "bg-primary text-primary-foreground ring-primary"
												: isActive
													? "bg-card text-primary ring-2 ring-primary"
													: "bg-card text-muted-foreground ring-border",
										)}
									>
										{isDone ? (
											<Check
												className="size-4"
												aria-hidden="true"
											/>
										) : (
											<Icon
												className="size-4"
												aria-hidden="true"
											/>
										)}
									</span>
									<span
										className={cn(
											"break-words font-medium text-xs",
											!isActive &&
												!isDone &&
												"text-muted-foreground",
										)}
									>
										{label}
									</span>
								</li>
							);
						})}
					</ol>
				</header>
				<main
					key={step}
					className="fade-in-0 flex min-w-0 animate-in flex-col gap-8 rounded-xl border bg-card p-4 duration-200 motion-reduce:animate-none sm:p-8"
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
				<P className="flex items-center gap-2 text-muted-foreground text-sm">
					<Lock className="size-4 shrink-0" aria-hidden="true" /> Your
					keep-out preferences apply throughout setup.
				</P>
			</div>
		</div>
	);
}
