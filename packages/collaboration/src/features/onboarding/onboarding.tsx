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
import { cn } from "@semoss/ui/next";
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

const STEPS = [
	{ label: "Your mailbox", caption: "A first look", icon: Mail },
	{
		label: "Keep out",
		caption: "Before anything is read",
		icon: ShieldCheck,
	},
	{ label: "Import", caption: "Headers only", icon: Download },
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
	const [step, setStep] = useState(initialStep);
	// nothing is read until the owner starts; previews of later steps start at once
	const [started, setStarted] = useState(initialStep > 0);
	const [days, setDays] = useState(30);
	const [overview, setOverview] = useState<MailboxOverview | null>(null);
	const [managerId, setManagerId] = useState("");
	const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
	const back = () => setStep((s) => Math.max(s - 1, 0));
	const common = {
		actions,
		onNext: next,
		onBack: step > 0 ? back : undefined,
		eyebrow: `Step ${step + 1} of ${STEPS.length}`,
	};
	// each step starts at the top
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs on each step change
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [step]);

	return (
		<div className="relative min-h-dvh overflow-hidden bg-muted/40 text-foreground dark:bg-background">
			<div
				aria-hidden="true"
				className="-top-40 -left-32 pointer-events-none absolute size-[34rem] rounded-full bg-primary/15 blur-3xl"
			/>
			<div
				aria-hidden="true"
				className="-right-40 pointer-events-none absolute top-1/3 size-[30rem] rounded-full bg-chart-2/10 blur-3xl"
			/>
			<div className="relative mx-auto grid max-w-6xl gap-6 p-4 md:gap-10 md:p-10 lg:grid-cols-[260px_minmax(0,1fr)]">
				<aside className="space-y-8 lg:sticky lg:top-10 lg:self-start">
					<div className="space-y-1">
						<span className="font-bold text-xl tracking-tight">
							collaboration<span className="text-primary">.</span>
						</span>
						<p className="text-muted-foreground text-sm">
							Set up with your mail in about two minutes.
						</p>
					</div>
					<ol
						aria-label="Setup steps"
						className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible"
					>
						{STEPS.map(({ label, caption, icon: Icon }, index) => {
							const done = index < step;
							const active = index === step;
							return (
								<li
									key={label}
									aria-current={active ? "step" : undefined}
									className="relative flex shrink-0 items-center gap-3 lg:pb-6 lg:last:pb-0"
								>
									{index < STEPS.length - 1 && (
										<span
											aria-hidden="true"
											className={cn(
												"absolute top-9 left-[17px] hidden h-[calc(100%-2.25rem)] w-px lg:block",
												done
													? "bg-primary"
													: "bg-border",
											)}
										/>
									)}
									<span
										className={cn(
											"relative flex size-9 shrink-0 items-center justify-center rounded-full ring-1 transition-all",
											done &&
												"bg-primary text-primary-foreground ring-primary",
											active &&
												"bg-card text-primary shadow-md shadow-primary/20 ring-2 ring-primary",
											!done &&
												!active &&
												"bg-card text-muted-foreground ring-border",
										)}
									>
										{done ? (
											<Check
												className="size-4"
												strokeWidth={3}
											/>
										) : (
											<Icon
												className="size-4"
												aria-hidden="true"
											/>
										)}
									</span>
									<span className="hidden lg:block">
										<span
											className={cn(
												"block font-medium text-sm",
												!active &&
													!done &&
													"text-muted-foreground",
											)}
										>
											{label}
										</span>
										<span className="block text-muted-foreground text-xs">
											{caption}
										</span>
									</span>
									<span className="sr-only lg:hidden">
										{label}
									</span>
								</li>
							);
						})}
					</ol>
					<div className="hidden rounded-2xl bg-card/70 p-4 text-sm ring-1 ring-border/60 backdrop-blur lg:block">
						<div className="flex items-center gap-2 font-medium">
							<Lock
								className="size-4 text-primary"
								aria-hidden="true"
							/>
							Private by default
						</div>
						<p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
							Only who, when, and subject are read until your
							keep-out rules are saved. Kept-out mail is never
							stored or sent to a model.
						</p>
					</div>
				</aside>
				<main
					key={step}
					className="fade-in-0 slide-in-from-bottom-2 flex min-w-0 animate-in flex-col gap-8 self-start rounded-3xl bg-card p-6 shadow-black/5 shadow-xl ring-1 ring-border/60 duration-300 md:p-10"
				>
					{!started && (
						<WelcomeStep onStart={() => setStarted(true)} />
					)}
					{started && step === 0 && (
						<MailboxStep
							{...common}
							days={days}
							onDays={setDays}
							onLoaded={setOverview}
						/>
					)}
					{step === 1 && (
						<KeepOutStep
							{...common}
							suggestions={overview?.keepOut ?? []}
						/>
					)}
					{step === 2 && (
						<ImportStep
							{...common}
							days={days}
							onManager={setManagerId}
						/>
					)}
					{step === 3 && (
						<PeopleStep
							{...common}
							selfEmail={overview?.address ?? ""}
							managerId={managerId}
						/>
					)}
					{step === 4 && <OutsideStep {...common} />}
					{step === 5 && <WorkStep {...common} />}
					{step === 6 && <TopicsStep {...common} />}
					{step === 7 && <FilingStep {...common} />}
				</main>
			</div>
		</div>
	);
}
