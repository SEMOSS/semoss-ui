import type { Terminal as XTerm } from "@xterm/xterm";

const OPTIONS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class TerminalSpinner {
	/** Terminal Instance */
	private terminal: XTerm;

	/** Start it */
	private startTime = 0;

	/** Option idx */
	private idx = 0;

	/** Set the interval */
	private interval: ReturnType<typeof setInterval> | null = null;

	/** Track if spinner is currently visible */
	private isRunning = false;

	constructor(terminal: XTerm) {
		this.terminal = terminal;
	}

	start() {
		// clear the old one
		if (this.interval) {
			clearInterval(this.interval);
		}
		this.interval = null;

		if (!this.isRunning) {
			// create a new line for spinner output
			this.terminal.write("\r\n");
		}
		this.isRunning = true;

		// start a new one
		this.startTime = Date.now();
		this.idx = 0;

		// tick
		this.interval = setInterval(() => this.tick(), 100);
	}

	stop() {
		if (!this.isRunning) {
			return;
		}

		this.destroy();
		this.terminal.write("\r\x1b[2K\r");
		this.isRunning = false;
	}

	private tick() {
		// get the time as MM:SS
		const elapsed = Math.floor((Date.now() - this.startTime) / 1000); // seconds
		const minutes = Math.floor(elapsed / 60);
		const seconds = elapsed - minutes * 60;
		const display = `${minutes.toString().padStart(2, "0")}:${seconds
			.toString()
			.padStart(2, "0")}`;

		// delete existing
		this.terminal.write("\r\x1b[2K");
		this.terminal.write(
			`\r${OPTIONS[this.idx]} Loading          ${display} `,
		);

		// Move to next options
		this.idx = (this.idx + 1) % OPTIONS.length;
	}

	destroy() {
		if (this.interval) {
			clearInterval(this.interval);
		}

		this.interval = null;
	}
}
