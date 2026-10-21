// Directory names arrive as "Last, First"; show "First Last"
export function givenFirst(name: string) {
	const [family, given] = name.split(",", 2);
	return given?.trim() ? `${given.trim()} ${family.trim()}` : name;
}
