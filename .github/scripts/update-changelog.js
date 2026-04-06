const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const CHANGELOG_PATH = "webapps/documentation/docusaurus/docs/CHANGELOG.md";
const UNRELEASED_SECTION = "## [Unreleased]";

// Get environmental variables
const prTitle = process.env.PR_TITLE || "";
const prNumber = process.env.PR_NUMBER || "";
const prAuthor = process.env.PR_AUTHOR || "";
const prBody = process.env.PR_BODY || "";
const prHeadSha = process.env.PR_HEAD_SHA || "";
const prBaseSha = process.env.PR_BASE_SHA || "";
const repoName = process.env.GITHUB_REPOSITORY || "";

/**
 * Parse conventional commit format: type(scope): message
 * Returns object with type, scope, and message
 */
function parseConventionalCommit(message) {
	const match = message.match(
		/^(feat|fix|docs|style|refactor|test|chore|perf)(\((.+?)\))?:\s*(.+)/,
	);

	if (match) {
		return {
			type: match[1],
			scope: match[3] || "",
			message: match[4],
			isConventional: true,
		};
	}

	return {
		type: "other",
		scope: "",
		message: message,
		isConventional: false,
	};
}

/**
 * Get commits from the PR
 */
function getCommits(baseSha, headSha) {
	try {
		const output = execSync(`git log ${baseSha}..${headSha} --format=%s`, {
			encoding: "utf-8",
		});
		return output
			.trim()
			.split("\n")
			.filter((line) => line.length > 0);
	} catch (error) {
		console.error("Error getting commits:", error.message);
		return [];
	}
}

/**
 * Get files changed in the PR
 */
function getFilesChanged(baseSha, headSha) {
	try {
		const output = execSync(`git diff --name-only ${baseSha}..${headSha}`, {
			encoding: "utf-8",
		});
		return output
			.trim()
			.split("\n")
			.filter((line) => line.length > 0);
	} catch (error) {
		console.error("Error getting files changed:", error.message);
		return [];
	}
}

/**
 * Build changelog entry from PR info
 */
function buildChangelogEntry(commits, filesChanged) {
	const categorized = {
		feat: [],
		fix: [],
		docs: [],
		refactor: [],
		perf: [],
		chore: [],
		other: [],
	};

	// Categorize commits
	commits.forEach((commit) => {
		const parsed = parseConventionalCommit(commit);
		if (categorized[parsed.type]) {
			categorized[parsed.type].push({
				message: parsed.message,
				scope: parsed.scope,
			});
		}
	});

	// Build the entry
	const entry = [];

	// Features
	if (categorized.feat.length > 0) {
		entry.push("\n### Added");
		categorized.feat.forEach((item) => {
			const scope = item.scope ? ` (${item.scope})` : "";
			entry.push(`- ${item.message}${scope}`);
		});
	}

	// Fixes
	if (categorized.fix.length > 0) {
		entry.push("\n### Fixed");
		categorized.fix.forEach((item) => {
			const scope = item.scope ? ` (${item.scope})` : "";
			entry.push(`- ${item.message}${scope}`);
		});
	}

	// Refactors
	if (categorized.refactor.length > 0) {
		entry.push("\n### Changed");
		categorized.refactor.forEach((item) => {
			const scope = item.scope ? ` (${item.scope})` : "";
			entry.push(`- ${item.message}${scope}`);
		});
	}

	// Performance
	if (categorized.perf.length > 0) {
		entry.push("\n### Performance");
		categorized.perf.forEach((item) => {
			const scope = item.scope ? ` (${item.scope})` : "";
			entry.push(`- ${item.message}${scope}`);
		});
	}

	// Documentation
	if (categorized.docs.length > 0) {
		entry.push("\n### Documentation");
		categorized.docs.forEach((item) => {
			entry.push(`- ${item.message}`);
		});
	}

	// Add files changed section if there are changes
	if (filesChanged.length > 0 && filesChanged.length <= 20) {
		entry.push("\n**Files Changed:**");
		filesChanged.slice(0, 10).forEach((file) => {
			entry.push(`- \`${file}\``);
		});
		if (filesChanged.length > 10) {
			entry.push(`- ... and ${filesChanged.length - 10} more files`);
		}
	}

	// Add PR link metadata
	entry.push(
		`\n**PR:** [#${prNumber}](https://github.com/${repoName}/pull/${prNumber})`,
	);
	entry.push(`**Author:** [@${prAuthor}](https://github.com/${prAuthor})`);

	return entry.join("\n");
}

/**
 * Update the changelog file
 */
function updateChangelog(changelogEntry) {
	if (!fs.existsSync(CHANGELOG_PATH)) {
		console.error(`Changelog file not found at ${CHANGELOG_PATH}`);
		process.exit(1);
	}

	const content = fs.readFileSync(CHANGELOG_PATH, "utf-8");

	// Find the Unreleased section
	const unreleasedIndex = content.indexOf(UNRELEASED_SECTION);
	if (unreleasedIndex === -1) {
		console.error("Could not find [Unreleased] section in changelog");
		process.exit(1);
	}

	// Find the next section or end of Unreleased section
	const startIndex = unreleasedIndex + UNRELEASED_SECTION.length;
	const nextVersionMatch = content.slice(startIndex).match(/\n## \[/);
	const endIndex = nextVersionMatch
		? startIndex + nextVersionMatch.index
		: content.length;

	// Insert the new entry
	const before = content.slice(0, endIndex);
	const after = content.slice(endIndex);

	const updatedContent = before + "\n" + changelogEntry + "\n---\n" + after;

	fs.writeFileSync(CHANGELOG_PATH, updatedContent, "utf-8");
	console.log(`✓ Changelog updated for PR #${prNumber}`);
}

/**
 * Main execution
 */
function main() {
	console.log(`Processing PR #${prNumber}: "${prTitle}"`);
	console.log(`Author: ${prAuthor}`);

	const commits = getCommits(prBaseSha, prHeadSha);
	const filesChanged = getFilesChanged(prBaseSha, prHeadSha);

	if (commits.length === 0) {
		console.log("No commits found in PR");
		return;
	}

	console.log(`Found ${commits.length} commits`);
	console.log(`Files changed: ${filesChanged.length}`);

	const entry = buildChangelogEntry(commits, filesChanged);
	updateChangelog(entry);
}

main();
