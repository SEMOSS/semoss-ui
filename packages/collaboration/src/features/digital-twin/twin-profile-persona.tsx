import { ArrowRight } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import { Button, FormSwitch, H2, P } from "@semoss/ui/next";
import { twinPersonaPath } from "@/lib/workspace-paths";
import { PERSONA_SECTIONS, type TwinPersona } from "./persona/api/persona";
import { interviewLink } from "./persona/interview-link";
import "./persona/persona-card.css";

interface TwinProfilePersonaProps {
	/** The owner's persona. A failed read is passed as null. */
	persona?: TwinPersona | null;
	/** Whether a persona exists when only its availability is supplied. */
	hasPersona: boolean;
}

/** A preview of the owner's persona and its draft setting for this twin. */
export function TwinProfilePersona({
	persona,
	hasPersona,
}: TwinProfilePersonaProps) {
	const titleId = useId();
	const isAvailable = persona?.exists ?? (persona !== null && hasPersona);
	const opening = persona?.exists
		? PERSONA_SECTIONS.map(({ key }) => persona.sections[key].trim()).find(
				Boolean,
			)
		: undefined;
	const interview =
		persona && !persona.exists ? interviewLink(persona) : null;

	return (
		<section
			aria-labelledby={titleId}
			className="flex min-w-0 flex-col gap-4 self-start rounded-xl border border-assistant/20 bg-assistant/5 p-5"
		>
			<div className="flex items-center gap-3">
				<span
					aria-hidden="true"
					className="persona-print-field grid size-12 shrink-0 place-items-center rounded-lg bg-assistant/10 text-assistant/15"
				>
					<span className="persona-fingerprint -rotate-9 h-10 w-8 bg-foreground/75" />
				</span>
				<H2
					id={titleId}
					className="font-semibold text-lg leading-tight"
				>
					Your persona
				</H2>
			</div>
			{opening ? (
				<P
					dir="auto"
					className="wrap-anywhere line-clamp-4 whitespace-pre-line font-display text-xl leading-snug"
				>
					{opening}
				</P>
			) : (
				<P className="text-muted-foreground text-sm leading-relaxed">
					{persona === null
						? "Your persona couldn’t be loaded. Open it to try again."
						: "Your persona describes your voice and perspective."}
				</P>
			)}
			{isAvailable && (
				<FormSwitch
					name="usePersona"
					label="Use my persona"
					className="flex-row-reverse border-assistant/15 border-t pt-3 [&>[role=switch]]:self-center [&_label]:pointer-coarse:min-h-11"
				/>
			)}
			<Button
				asChild
				variant="link"
				size="sm"
				className="h-auto pointer-coarse:min-h-11 self-start p-0 text-foreground"
			>
				<Link to={interview?.to ?? twinPersonaPath()}>
					{interview?.label ??
						(isAvailable || persona === null
							? "Open your persona"
							: "Create your persona")}
					<ArrowRight aria-hidden="true" className="rtl:rotate-180" />
				</Link>
			</Button>
		</section>
	);
}
