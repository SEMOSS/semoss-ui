export async function getMonaco() {
	// Dynamically import monaco-editor only when needed
	const monaco = await import("monaco-editor");
	return monaco;
}
