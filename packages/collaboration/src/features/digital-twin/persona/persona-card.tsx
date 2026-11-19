import { ArrowRight } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	H2,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { twinPersonaPath } from "@/lib/workspace-paths";
import { useTwinRead } from "../use-twin-read";
import { getTwinPersona, PERSONA_SECTIONS } from "./api/persona";
import { interviewLink } from "./interview-link";
import "./persona-card.css";

interface PersonaCardProps {
	/** The ids of the twins the signed-in person created, to say how many of them use it. */
	twinIds: string[];
}

/**
 * The signed-in person's persona among their Digital Twins: what it says in
 * short and how many of their twins use it, or what one is for when they have
 * none, with the way to the interview that writes it.
 */
export function PersonaCard({ twinIds }: PersonaCardProps) {
	const persona = useTwinRead(getTwinPersona);
	const titleId = useId();
	const data = persona.data;
	// the first thing it says, in the order its owner reads it
	const opening = PERSONA_SECTIONS.map(
		(section) => data?.sections[section.key] ?? "",
	).find((text) => text.trim());
	const using = twinIds.filter((id) => !data?.offTwins.includes(id)).length;
	const isOnlyTwin = twinIds.length === 1;
	const interview = data && !data.exists ? interviewLink(data) : null;
	const usage =
		twinIds.length === 0
			? "The next Digital Twin you create will use it."
			: using === twinIds.length
				? isOnlyTwin
					? "Your Digital Twin uses it."
					: `Used by all ${twinIds.length} of your twins.`
				: using === 0
					? `It is switched off for ${isOnlyTwin ? "your Digital Twin" : "all of your Digital Twins"}.`
					: `Used by ${using} of your ${twinIds.length} twins.`;

	return (
		<section aria-labelledby={titleId} className="@container min-w-0">
			<div className="@2xl:flex grid grid-cols-[auto_1fr_auto] items-center @2xl:gap-5 gap-x-3 gap-y-2 overflow-hidden rounded-xl border border-assistant/15 bg-assistant/5 @2xl:p-0 p-4 @2xl:pe-5">
				<span
					aria-hidden="true"
					className="persona-print-field grid size-10 @2xl:h-auto @2xl:min-h-28 @2xl:w-28 shrink-0 place-items-center @2xl:self-stretch @2xl:rounded-none rounded-md @2xl:border-assistant/15 @2xl:border-e bg-assistant/10 text-assistant/15"
				>
					<span className="persona-fingerprint -rotate-9 @2xl:h-24 h-8 @2xl:w-20 w-7 bg-foreground/75" />
				</span>
				<div className="@2xl:flex contents @2xl:min-w-0 @2xl:flex-1 @2xl:flex-col @2xl:gap-1 @2xl:py-4">
					<H2
						id={titleId}
						className="col-span-2 font-semibold text-lg leading-tight"
					>
						Your persona
					</H2>
					{data ? (
						<>
							<P
								className={cn(
									"wrap-anywhere col-span-full max-w-prose whitespace-pre-line font-display @2xl:text-xl text-lg leading-tight",
									data.exists && "line-clamp-3",
								)}
							>
								{data.exists
									? opening
									: "Teach your Digital Twins to sound like you and to say how you would see something. A few questions, once, and every twin of yours uses it."}
							</P>
							{data.exists && (
								<P className="col-span-2 text-muted-foreground text-sm">
									{usage}
								</P>
							)}
						</>
					) : persona.error ? (
						<Alert variant="destructive" className="col-span-full">
							<AlertDescription>
								{persona.error}
								<Button
									type="button"
									variant="outline"
									onClick={persona.reload}
								>
									Try again
								</Button>
							</AlertDescription>
						</Alert>
					) : (
						<div className="col-span-full space-y-2">
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-4 w-1/3" />
							<output className="sr-only">
								Loading your persona…
							</output>
						</div>
					)}
				</div>
				{data?.exists ? (
					<Button
						asChild
						variant="outline"
						size="sm"
						className="pointer-coarse:min-h-11 shrink-0 border-assistant/25"
					>
						<Link to={twinPersonaPath()}>
							Open your persona
							<ArrowRight
								aria-hidden="true"
								className="rtl:rotate-180"
							/>
						</Link>
					</Button>
				) : interview ? (
					<div className="col-span-full flex shrink-0 @2xl:flex-col flex-wrap @2xl:items-end items-center gap-2">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="pointer-coarse:min-h-11"
						>
							<Link to={interview.to}>{interview.label}</Link>
						</Button>
						<Button
							asChild
							variant="link"
							size="sm"
							className="h-auto pointer-coarse:min-h-11 p-0"
						>
							<Link to={twinPersonaPath()}>
								Or write it by hand
							</Link>
						</Button>
					</div>
				) : null}
			</div>
		</section>
	);
}
