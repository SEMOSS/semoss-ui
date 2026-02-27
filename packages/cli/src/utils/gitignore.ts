import * as fs from "node:fs";
import * as path from "node:path";

const GITIGNORE_HEADER = "# SEMOSS CLI Deployment";
const GITIGNORE_ENTRIES = [
	".semoss-backups/",
	".semoss-deployments",
	"smss.json",
];

/**
 * Ensures the .gitignore file in the given directory contains the required SEMOSS CLI entries.
 * If the file does not exist, it will be created.
 * If the entries are missing, they will be appended.
 */
export function ensureSemossGitignore(dir: string) {
	const gitignorePath = path.join(dir, ".gitignore");
	let content = "";
	if (fs.existsSync(gitignorePath)) {
		content = fs.readFileSync(gitignorePath, "utf-8");
	}
	const needsHeader = !content.includes(GITIGNORE_HEADER);
	const missingEntries = GITIGNORE_ENTRIES.filter(
		(e) => !content.includes(e),
	);
	if (needsHeader || missingEntries.length > 0) {
		let toAppend = needsHeader ? `${GITIGNORE_HEADER}\n` : "";
		toAppend += missingEntries.map((e) => `${e}\n`).join("");
		fs.appendFileSync(gitignorePath, toAppend);
	}
}
