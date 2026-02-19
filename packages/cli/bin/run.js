#!/usr/bin/env node

// Node.js version check
(function checkNodeVersion() {
	const min = [24, 0, 0];
	const current = process.versions.node.split(".").map(Number);
	function greaterOrEqual(a, b) {
		for (let i = 0; i < 3; i++)
			if (a[i] > b[i]) return true;
			else if (a[i] < b[i]) return false;
		return true;
	}
	if (!greaterOrEqual(current, min)) {
		// eslint-disable-next-line no-console
		console.error(
			`\n❌ Node.js version ${process.versions.node} is not supported. Required: >=24.0.0.\n`,
		);
		process.exit(1);
	}
})();

async function main() {
	const { execute } = await import("@oclif/core");
	await execute({ dir: import.meta.url });
}

await main();
