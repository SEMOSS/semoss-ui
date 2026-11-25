import { PersonaPage } from "@/features/digital-twin/persona/persona-page";

/** The signed-in person's persona, opened from Digital Twins. */
export function TwinPersonaPage() {
	return <PersonaPage isFromTwins />;
}
