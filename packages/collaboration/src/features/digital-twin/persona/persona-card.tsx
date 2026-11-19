import { Fingerprint } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	H2,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { twinPersonaPath } from "@/lib/workspace-paths";
import { useTwinRead } from "../use-twin-read";
import { getTwinPersona, PERSONA_SECTIONS } from "./api/persona";
import { interviewLink } from "./interview-link";

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
	const usage =
		twinIds.length === 0
			? "The next Digital Twin you create will use it."
			: using === twinIds.length
				? isOnlyTwin
					? "Your Digital Twin uses it."
					: `All ${twinIds.length} of your Digital Twins use it.`
				: using === 0
					? `It is switched off for ${isOnlyTwin ? "your Digital Twin" : "all of your Digital Twins"}.`
					: `${using} of your ${twinIds.length} Digital Twins use it.`;

	return (
		<section aria-labelledby={titleId} className="flex flex-col gap-4">
			<H2 id={titleId} className="font-medium text-lg">
				Your persona
			</H2>
			{data ? (
				<div className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center md:max-w-3xl">
					<span
						aria-hidden="true"
						className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
					>
						<Fingerprint className="size-5" />
					</span>
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<P className="wrap-anywhere line-clamp-3 whitespace-pre-line text-sm">
							{data.exists
								? opening
								: "Teach your Digital Twins to sound like you and to say how you would see something. A few questions, once, and every twin of yours uses it."}
						</P>
						{data.exists && (
							<P className="text-muted-foreground text-sm">
								{usage}
							</P>
						)}
					</div>
					{data.exists ? (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="pointer-coarse:min-h-11 shrink-0"
						>
							<Link to={twinPersonaPath()}>
								Open your persona
							</Link>
						</Button>
					) : (
						<div className="flex shrink-0 flex-col gap-2 sm:items-end">
							<Button
								asChild
								variant="outline"
								size="sm"
								className="pointer-coarse:min-h-11"
							>
								<Link to={interviewLink(data).to}>
									{interviewLink(data).label}
								</Link>
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
					)}
				</div>
			) : persona.error ? (
				<Alert variant="destructive" className="md:max-w-3xl">
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
				<>
					<Skeleton className="h-24 w-full md:max-w-3xl" />
					<output className="sr-only">Loading your persona…</output>
				</>
			)}
		</section>
	);
}
