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
 * Generate HTML report
 */
function generateHTML(commits) {
  const timestamp = new Date().toISOString();
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context Report - ${CONFIG.mainBranch}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            padding: 20px 40px;
            background: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-label {
            font-size: 0.85em;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .meta-value {
            font-size: 1.5em;
            color: #667eea;
            font-weight: bold;
            margin-top: 5px;
        }
        
        .content {
            padding: 40px;
        }
        
        .commit {
            margin-bottom: 40px;
            border-left: 4px solid #667eea;
            padding-left: 20px;
            page-break-inside: avoid;
        }
        
        .commit h2 {
            color: #333;
            font-size: 1.5em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .commit-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .commit-detail {
            font-size: 0.9em;
        }
        
        .commit-detail strong {
            color: #667eea;
            font-weight: 600;
        }
        
        .section {
            margin: 20px 0;
        }
        
        .section-title {
            font-size: 1.1em;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .stat-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            border-top: 3px solid #667eea;
        }
        
        .stat-label {
            font-size: 0.85em;
            color: #6c757d;
            font-weight: 600;
        }
        
        .stat-value {
            font-size: 1.8em;
            color: #667eea;
            font-weight: bold;
            margin-top: 5px;
        }
        
        .file-list {
            background: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .file-category {
            margin-bottom: 15px;
        }
        
        .file-category-title {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 8px;
            font-size: 0.95em;
        }
        
        .file-item {
            padding: 8px;
            margin-bottom: 5px;
            background: white;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: 600;
            margin-left: 10px;
        }
        
        .badge.added {
            background: #d4edda;
            color: #155724;
        }
        
        .badge.modified {
            background: #fff3cd;
            color: #856404;
        }
        
        .badge.deleted {
            background: #f8d7da;
            color: #721c24;
        }
        
        .area-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .tag {
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .tag.frontend { background: #0066cc; }
        .tag.backend { background: #cc0000; }
        .tag.ui { background: #00b366; }
        .tag.tests { background: #ff9900; }
        .tag.docs { background: #7700cc; }
        
        footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            font-size: 0.85em;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            .commit {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Context Documentation Report</h1>
            <p>Branch: <strong>${CONFIG.mainBranch}</strong></p>
        </header>
        
        <div class="meta">
            <div class="meta-item">
                <div class="meta-label">Generated</div>
                <div class="meta-value">${timestamp.split('T')[0]}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Branch</div>
                <div class="meta-value">${CONFIG.mainBranch}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Period</div>
                <div class="meta-value">${CONFIG.since}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Total Commits</div>
                <div class="meta-value">${commits.length}</div>
            </div>
        </div>
        
        <div class="content">
`;

  for (const commit of commits) {
    const files = getFilesChanged(commit.fullHash);
    const context = buildCommitContext(commit, files);
    
    const added = files.filter(f => f.status === 'A').length;
    const modified = files.filter(f => f.status === 'M').length;
    const deleted = files.filter(f => f.status === 'D').length;

    html += `
        <div class="commit">
            <h2>✨ ${commit.message}</h2>
            
            <div class="commit-header">
                <div class="commit-detail"><strong>Commit:</strong> ${commit.hash}</div>
                <div class="commit-detail"><strong>Author:</strong> ${commit.author}</div>
                <div class="commit-detail"><strong>Date:</strong> ${commit.date}</div>
                <div class="commit-detail"><strong>Files:</strong> ${files.length}</div>
            </div>
            
            <div class="section">
                <div class="section-title">🎯 Affected Areas</div>
                <div class="area-tags">
                    ${context.affectedAreas.map(area => `<span class="tag ${area.toLowerCase()}">${area}</span>`).join('')}
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📈 Change Statistics</div>
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-label">Added</div>
                        <div class="stat-value">${added}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Modified</div>
                        <div class="stat-value">${modified}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Deleted</div>
                        <div class="stat-value">${deleted}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Total</div>
                        <div class="stat-value">${added + modified + deleted}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📁 Files Changed</div>
                <div class="file-list">
`;

    // Organize files by category
    if (context.categories.frontend.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">🖥️ Frontend (${context.categories.frontend.length})</div>`;
        context.categories.frontend.forEach(f => {
            html += `<div class="file-item"><span>${f.file}</span><span class="badge ${f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified'}">${f.status}</span></div>`;
        });
        html += `</div>`;
    }

    if (context.categories.backend.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">⚙️ Backend (${context.categories.backend.length})</div>`;
        context.categories.backend.forEach(f => {
            html += `<div class="file-item"><span>${f.file}</span><span class="badge ${f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified'}">${f.status}</span></div>`;
        });
        html += `</div>`;
    }

    if (context.categories.ui.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">🎨 UI Components (${context.categories.ui.length})</div>`;
        context.categories.ui.forEach(f => {
            html += `<div class="file-item"><span>${f.file}</span><span class="badge ${f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified'}">${f.status}</span></div>`;
        });
        html += `</div>`;
    }

    if (context.categories.tests.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">✅ Tests (${context.categories.tests.length})</div>`;
        context.categories.tests.slice(0, 5).forEach(f => {
            html += `<div class="file-item"><span>${f.file}</span><span class="badge ${f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified'}">${f.status}</span></div>`;
        });
        if (context.categories.tests.length > 5) {
            html += `<div class="file-item"><em>... and ${context.categories.tests.length - 5} more</em></div>`;
        }
        html += `</div>`;
    }

    html += `
                </div>
            </div>
        </div>
`;
  }

  html += `
        </div>
        <footer>
            <p>Generated on ${timestamp} | Branch: ${CONFIG.mainBranch}</p>
        </footer>
    </div>
</body>
</html>
`;

  return html;
}

/**
 * Save HTML file
 */
function saveHTML(content, filename) {
  if (!fs.existsSync(CONFIG.contextDir)) {
    fs.mkdirSync(CONFIG.contextDir, { recursive: true });
  }

  const filepath = path.join(CONFIG.contextDir, filename.replace('.md', '.html'));
  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
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

  const filename = CONFIG.output || `context-${new Date().toISOString().split('T')[0]}`;
  
  // Generate all formats
  const markdown = generateMarkdown(commits);
  const html = generateHTML(commits);

  // Save all formats
  const mdPath = saveMarkdown(markdown, `${filename}.md`);
  const htmlPath = saveHTML(html, `${filename}.html`);
  
  console.log(`✓ Markdown saved to: ${mdPath}`);
  console.log(`✓ HTML saved to: ${htmlPath}`);
  
  // Display summary
  console.log('\n=== Files Generated ===');
  console.log(`📄 Markdown: ${filename}.md`);
  console.log(`🌐 HTML: ${filename}.html`);
  console.log('\nOpen the HTML file in a browser for the best viewing experience!');
}

main();
