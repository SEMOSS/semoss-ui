import { Command } from "@oclif/core";

export default class Interactive extends Command {
	static override description =
		"Launch interactive Terminal UI mode for SEMOSS CLI";

	static override examples = ["<%= config.bin %> <%= command.id %>"];

	public async run(): Promise<void> {
		// Dynamic import to avoid loading ink/react during command discovery
		const { runTUI } = await import("../tui/index.js");
		runTUI();
	}
}
