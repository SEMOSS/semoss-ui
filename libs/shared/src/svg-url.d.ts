// An SVG imported with Vite's ?url suffix is the URL it is served from, such
// as the connector logos `ConnectorBrandIcon` shows.
declare module "*.svg?url" {
	const url: string;
	// biome-ignore lint/style/noDefaultExport: a ?url import is a default export
	export default url;
}
