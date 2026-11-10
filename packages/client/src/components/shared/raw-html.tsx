interface RawHtmlProps {
	/** Server-controlled HTML to render as is, such as the platform's terms */
	html: string;
}

/**
 * Renders HTML the server's theme supplies, with its links styled as links.
 * Never pass it user input.
 */
export const RawHtml = ({ html }: RawHtmlProps) => {
	return (
		<div
			className="[&_a:hover]:opacity-80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: server-controlled terms content
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
