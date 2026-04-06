#!/usr/bin/env node

/**
 * Analyze commits to main branch and generate context documentation
 * 
 * USAGE:
 *   node analyze-commits.js [--since "2 weeks ago"] [--until "now"] [--output filename]
 *   node analyze-commits.js --branch main --format detailed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  mainBranch: process.argv.includes('--branch') ? process.argv[process.argv.indexOf('--branch') + 1] : (process.env.MAIN_BRANCH || 'main'),
  since: process.argv.includes('--since') ? process.argv[process.argv.indexOf('--since') + 1] : '1 week ago',
  until: process.argv.includes('--until') ? process.argv[process.argv.indexOf('--until') + 1] : 'now',
  output: process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : null,
  format: process.argv.includes('--format') ? process.argv[process.argv.indexOf('--format') + 1] : 'summary',
  contextDir: 'D:\\workspace\\apache-tomcat-9.0.96\\webapps\\documentation\\docusaurus\\docs\\context-logs',
};

/**
 * Execute git command safely
 */
function execGit(command) {
  try {
    return execSync(`git ${command}`, { encoding: 'utf-8', cwd: process.cwd() });
  } catch (error) {
    console.error(`Git command failed: git ${command}`);
    console.error(error.message);
    return '';
  }
}

/**
 * Get commits to main branch
 */
function getCommits() {
  const since = CONFIG.since;
  const until = CONFIG.until;
  const branch = CONFIG.mainBranch;

  const cmd = `log ${branch} --since="${since}" --until="${until}" --pretty=format:"%H|%an|%ae|%ad|%s|%b" --date=iso`;
  const output = execGit(cmd);

  if (!output) {
    console.log('No commits found');
    return [];
  }

  const commits = [];
  const commitStrings = output.split('\n\n');

  for (const commitStr of commitStrings) {
    const parts = commitStr.split('|');
    if (parts.length >= 5) {
      commits.push({
        hash: parts[0].substring(0, 7),
        fullHash: parts[0],
        author: parts[1],
        email: parts[2],
        date: parts[3],
        message: parts[4],
        body: parts[5] || '',
      });
    }
  }

  return commits;
}

/**
 * Get files changed in a commit
 */
function getFilesChanged(commitHash) {
  const cmd = `diff-tree --no-commit-id --name-status -r ${commitHash}`;
  const output = execGit(cmd);

  const files = output
    .trim()
    .split('\n')
    .filter(line => line)
    .map(line => {
      const [status, file] = line.split(/\s+/);
      return { file, status };
    });

  return files;
}

/**
 * Get file diff stats
 */
function getDiffStats(commitHash) {
  const cmd = `diff ${commitHash}^..${commitHash} --stat`;
  const output = execGit(cmd);
  return output;
}

/**
 * Determine change category from file paths and types
 */
function categorizeChanges(files) {
  const categories = {
    backend: [],
    frontend: [],
    ui: [],
    tests: [],
    docs: [],
    config: [],
    other: [],
  };

  for (const file of files) {
    const path = file.file.toLowerCase();

    if (path.includes('test') || path.includes('spec') || path.includes('vitest')) {
      categories.tests.push(file);
    } else if (path.includes('ui/') || path.includes('components/') || path.includes('shared/')) {
      categories.ui.push(file);
    } else if (path.includes('client/') || path.includes('playground/')) {
      categories.frontend.push(file);
    } else if (path.includes('sdk/') || path.includes('api/') || path.includes('server/')) {
      categories.backend.push(file);
    } else if (path.includes('doc') || path.includes('readme') || path.includes('md')) {
      categories.docs.push(file);
    } else if (
      path.includes('config') ||
      path.includes('tsconfig') ||
      path.includes('package.json') ||
      path.includes('biome')
    ) {
      categories.config.push(file);
    } else {
      categories.other.push(file);
    }
  }

  return categories;
}

/**
 * Build context for a commit
 */
function buildCommitContext(commit, files) {
  const categories = categorizeChanges(files);

  const context = {
    hash: commit.hash,
    fullHash: commit.fullHash,
    author: commit.author,
    date: commit.date,
    message: commit.message,
    body: commit.body,
    filesChanged: files.length,
    categories: categories,
    affectedAreas: [],
  };

  // Determine affected areas
  const areas = [];
  if (categories.frontend.length > 0) areas.push('Frontend');
  if (categories.backend.length > 0) areas.push('Backend');
  if (categories.ui.length > 0) areas.push('UI Components');
  if (categories.tests.length > 0) areas.push('Tests');
  if (categories.docs.length > 0) areas.push('Documentation');

  context.affectedAreas = areas;

  return context;
}

/**
 * Summarize context into human-readable format
 */
function summarizeContext(context) {
  let summary = `**Commit:** ${context.hash}\n`;
  summary += `**Author:** ${context.author}\n`;
  summary += `**Date:** ${context.date}\n`;
  summary += `**Files Changed:** ${context.filesChanged}\n\n`;

  summary += `**Message:** ${context.message}\n`;

  if (context.body) {
    summary += `\n**Details:**\n${context.body}\n`;
  }

  summary += `\n**Affected Areas:** ${context.affectedAreas.join(', ')}\n\n`;

  summary += '**File Breakdown:**\n';

  if (context.categories.frontend.length > 0) {
    summary += `- **Frontend** (${context.categories.frontend.length}):\n`;
    context.categories.frontend.forEach(f => {
      summary += `  - \`${f.file}\` [${f.status}]\n`;
    });
  }

  if (context.categories.backend.length > 0) {
    summary += `- **Backend** (${context.categories.backend.length}):\n`;
    context.categories.backend.forEach(f => {
      summary += `  - \`${f.file}\` [${f.status}]\n`;
    });
  }

  if (context.categories.ui.length > 0) {
    summary += `- **UI Components** (${context.categories.ui.length}):\n`;
    context.categories.ui.forEach(f => {
      summary += `  - \`${f.file}\` [${f.status}]\n`;
    });
  }

  if (context.categories.tests.length > 0) {
    summary += `- **Tests** (${context.categories.tests.length}):\n`;
    context.categories.tests.slice(0, 3).forEach(f => {
      summary += `  - \`${f.file}\` [${f.status}]\n`;
    });
    if (context.categories.tests.length > 3) {
      summary += `  - ... and ${context.categories.tests.length - 3} more\n`;
    }
  }

  if (context.categories.docs.length > 0) {
    summary += `- **Documentation** (${context.categories.docs.length}):\n`;
    context.categories.docs.forEach(f => {
      summary += `  - \`${f.file}\` [${f.status}]\n`;
    });
  }

  return summary;
}

/**
 * Generate markdown documentation
 */
function generateMarkdown(commits) {
  const date = new Date();
  const timestamp = date.toISOString();

  let md = `# Main Branch Activity Report\n\n`;
  md += `**Generated:** ${timestamp}\n`;
  md += `**Branch:** ${CONFIG.mainBranch}\n`;
  md += `**Period:** ${CONFIG.since} to ${CONFIG.until}\n`;
  md += `**Total Commits:** ${commits.length}\n\n`;

  md += '---\n\n';

  for (const commit of commits) {
    const files = getFilesChanged(commit.fullHash);
    const context = buildCommitContext(commit, files);
    const summary = summarizeContext(context);

    md += `## ${commit.message}\n\n`;
    md += summary;
    md += '\n---\n\n';
  }

  return md;
}

/**
 * Save markdown to file
 */
function saveMarkdown(content, filename) {
  if (!fs.existsSync(CONFIG.contextDir)) {
    fs.mkdirSync(CONFIG.contextDir, { recursive: true });
  }

  const filepath = path.join(CONFIG.contextDir, filename);
  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`✓ Context documentation saved to: ${filepath}`);
  return filepath;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Analyzing commits to main branch...\n');

  const commits = getCommits();

  if (commits.length === 0) {
    console.log('No commits found in the specified period');
    return;
  }

  console.log(`Found ${commits.length} commits\n`);

  const markdown = generateMarkdown(commits);

  if (CONFIG.output) {
    saveMarkdown(markdown, CONFIG.output);
  } else {
    const filename = `context-${new Date().toISOString().split('T')[0]}.md`;
    saveMarkdown(markdown, filename);
  }

  // Also output to console
  console.log(markdown);
}

main();
