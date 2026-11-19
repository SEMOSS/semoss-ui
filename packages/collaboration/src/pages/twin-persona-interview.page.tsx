import { useSearchParams } from "react-router";
import { PersonaInterview } from "@/features/digital-twin/persona/persona-interview";

/** The interview that writes the signed-in person's persona for their Digital Twins. */
export function TwinPersonaInterviewPage() {
	const [params] = useSearchParams();
	// going on with one that was wrapped up is its own visit: what was on screen is from before
	return <PersonaInterview key={params.get("go") ?? "open"} />;
}
