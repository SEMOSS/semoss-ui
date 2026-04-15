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
const PDFDocument = require('pdfkit');

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

  const delimiter = ':::COMMIT_SEPARATOR:::';
  const cmd = `log ${branch} --since="${since}" --until="${until}" --pretty=format:"%H|%an|%ae|%ad|%s|%b${delimiter}" --date=iso`;
  const output = execGit(cmd);

  if (!output) {
    console.log('No commits found');
    return [];
  }

  const commits = [];
  const commitStrings = output.split(delimiter).filter(s => s.trim());

  for (const commitStr of commitStrings) {
    const lines = commitStr.trim().split('\n');
    if (lines.length > 0) {
      const headerLine = lines[0];
      const parts = headerLine.split('|');
      if (parts.length >= 5) {
        const body = lines.slice(1).join('\n').trim();
        commits.push({
          hash: parts[0].substring(0, 7),
          fullHash: parts[0],
          author: parts[1],
          email: parts[2],
          date: parts[3],
          message: parts[4],
          body: body || '',
        });
      }
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
 * Extract actual code diff for a commit
 */
function getCommitDiff(commitHash) {
  try {
    const cmd = `show ${commitHash} --no-patch --format="%H"`;
    const cmd2 = `show ${commitHash}`;
    const output = execGit(cmd2);
    return output;
  } catch (e) {
    return '';
  }
}

/**
 * Extract specific code changes from diff - STRICT MODE (Only real functions)
 */
function analyzeCodeChanges(commitHash, files) {
  const diff = getCommitDiff(commitHash);
  const changes = {
    functionsAdded: [],
    functionsModified: [],
    functionsRemoved: [],
    importsChanged: false,
    typesChanged: false,
    stateManagementChanged: false,
    codeSnippets: [],
  };

  // STRICT: Only match actual function declarations
  // Patterns: function name() {} or const name = () => {} or const name = async () => {}
  const strictFunctionPattern = /^\+\s*(?:async\s+)?function\s+(\w+)\s*\(|^\+\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/gm;
  let match;
  
  // Extract ADDED functions - only real function declarations
  while ((match = strictFunctionPattern.exec(diff)) !== null) {
    const funcName = match[1] || match[2];
    if (!changes.functionsAdded.includes(funcName)) {
      changes.functionsAdded.push(funcName);
    }
  }

  // Extract REMOVED functions - only real function declarations
  const strictRemovePattern = /^-\s*(?:async\s+)?function\s+(\w+)\s*\(|^-\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/gm;
  while ((match = strictRemovePattern.exec(diff)) !== null) {
    const funcName = match[1] || match[2];
    if (!changes.functionsRemoved.includes(funcName)) {
      changes.functionsRemoved.push(funcName);
    }
  }

  // STRICT: Check for ADDED/REMOVED import statements only
  if (/^[+-]\s*import\s+.*from|^[+-]\s*export\s+(default\s+|{|function|const|class|interface|type)/m.test(diff)) {
    changes.importsChanged = true;
  }

  // STRICT: Check for ADDED/REMOVED type definitions only
  const strictTypePattern = /^[+-]\s*(interface\s+\w+\s*{|type\s+\w+\s*=\s*{|type\s+\w+\s*=\s*\w+<)/gm;
  if (strictTypePattern.test(diff)) {
    changes.typesChanged = true;
  }

  // STRICT: Check for ADDED/REMOVED state management calls only
  const strictStatePattern = /^[+-]\s*(?:const|let|var)\s+\[?\w+[,\s]*\w*\]?\s*=\s*useState\(|^[+-]\s*(?:const|let|var)\s+\w+\s*=\s*useReducer\(/gm;
  if (strictStatePattern.test(diff)) {
    changes.stateManagementChanged = true;
  }

  // Extract code snippets (first few lines of changes)
  const diffLines = diff.split('\n');
  let inCodeSection = false;
  let snippetLines = [];

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];
    
    if (line.startsWith('@@')) {
      if (snippetLines.length > 0) {
        changes.codeSnippets.push(snippetLines.join('\n'));
      }
      snippetLines = [];
      inCodeSection = true;
    } else if (inCodeSection && (line.startsWith('+') || line.startsWith('-'))) {
      snippetLines.push(line);
      if (snippetLines.length > 8) {
        changes.codeSnippets.push(snippetLines.slice(0, 8).join('\n'));
        snippetLines = [];
        inCodeSection = false;
      }
    }
  }

  return changes;
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
  const codeAnalysis = analyzeCodeChanges(commit.fullHash, files);

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
    codeAnalysis: codeAnalysis,
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
 * Generate intelligent summary points explaining ONLY ACTUAL changes made
 */
function generateSummaryPoints(commit, context, files) {
  const points = [];
  const message = commit.message.toLowerCase();
  const commitType = message.split('(')[0].trim();
  const scope = message.includes('(') ? message.split('(')[1].split(')')[0] : '';
  const codeAnalysis = context.codeAnalysis || { functionsAdded: [], functionsRemoved: [], functionsModified: [], importsChanged: false, stateManagementChanged: false, typesChanged: false };
  
  const added = files.filter(f => f.status === 'A');
  const modified = files.filter(f => f.status === 'M');
  const deleted = files.filter(f => f.status === 'D');

  const functionsAdded = codeAnalysis.functionsAdded || [];
  const functionsRemoved = codeAnalysis.functionsRemoved || [];
  const importsChanged = codeAnalysis.importsChanged || false;
  const stateChanged = codeAnalysis.stateManagementChanged || false;
  const typesChanged = codeAnalysis.typesChanged || false;

  // ONLY add summary if code analysis actually found something
  if (functionsAdded.length > 0) {
    if (functionsAdded.length === 1) {
      points.push(`Added ${functionsAdded[0]} function`);
    } else {
      const funcList = functionsAdded.slice(0, 2).join(', ');
      points.push(`Added ${funcList}${functionsAdded.length > 2 ? ` and ${functionsAdded.length - 2} more` : ''} function(s)`);
    }
  }

  if (functionsRemoved.length > 0) {
    if (functionsRemoved.length === 1) {
      points.push(`Removed ${functionsRemoved[0]} function`);
    } else {
      const funcList = functionsRemoved.slice(0, 2).join(', ');
      points.push(`Removed ${funcList}${functionsRemoved.length > 2 ? ` and ${functionsRemoved.length - 2} more` : ''} function(s)`);
    }
  }

  if (stateChanged && functionsAdded.length === 0 && functionsRemoved.length === 0) {
    points.push('Modified state management, hooks, or configuration');
  }

  if (importsChanged && functionsAdded.length === 0 && functionsRemoved.length === 0) {
    points.push('Updated imports and module dependencies');
  }

  if (typesChanged && functionsAdded.length === 0 && functionsRemoved.length === 0) {
    points.push('Updated TypeScript type definitions');
  }

  // Only for larger changes with no specific detected changes
  if (points.length === 0) {
    if (modified.length > 0 && added.length === 0 && deleted.length === 0) {
      points.push(`Modified ${modified.length} file(s)`);
    } else if (added.length > 0) {
      points.push(`Added ${added.length} new file(s)`);
    } else if (deleted.length > 0) {
      points.push(`Removed ${deleted.length} file(s)`);
    } else if (modified.length > 0 || added.length > 0 || deleted.length > 0) {
      points.push('Updated project files');
    }
  }

  // Remove duplicates and limit to 3 most relevant points
  const uniquePoints = [...new Set(points)];
  return uniquePoints.slice(0, 3);
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

  // Add code changes analysis
  const analysis = context.codeAnalysis || {};
  if (analysis.functionsAdded?.length > 0 || analysis.functionsRemoved?.length > 0 || analysis.importsChanged || analysis.stateManagementChanged) {
    summary += `**Code Changes:**\n`;
    
    if (analysis.functionsAdded?.length > 0) {
      summary += `- **Added Functions/Hooks:** ${analysis.functionsAdded.slice(0, 5).join(', ')}`;
      if (analysis.functionsAdded.length > 5) {
        summary += ` ... and ${analysis.functionsAdded.length - 5} more`;
      }
      summary += '\n';
    }
    
    if (analysis.functionsRemoved?.length > 0) {
      summary += `- **Removed Functions:** ${analysis.functionsRemoved.slice(0, 3).join(', ')}`;
      if (analysis.functionsRemoved.length > 3) {
        summary += ` ... and ${analysis.functionsRemoved.length - 3} more`;
      }
      summary += '\n';
    }
    
    if (analysis.stateManagementChanged) {
      summary += `- **State Management Updated:** Modified hooks, state, or config files\n`;
    }
    
    if (analysis.importsChanged) {
      summary += `- **Imports Updated:** Import/export statements changed\n`;
    }
    
    summary += '\n';
  }

  // Calculate file statistics
  const added = [];
  const modified = [];
  const deleted = [];
  
  Object.values(context.categories).forEach(categoryFiles => {
    categoryFiles.forEach(f => {
      if (f.status === 'A') added.push(f.file);
      else if (f.status === 'M') modified.push(f.file);
      else if (f.status === 'D') deleted.push(f.file);
    });
  });

  summary += '\n**File Breakdown by Category:**\n';

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
    const summaryPoints = generateSummaryPoints(commit, context, files);

    md += `## ${commit.message}\n\n`;
    
    if (summaryPoints.length > 0) {
      md += `**Summary:**\n`;
      summaryPoints.forEach(point => {
        md += `✓ ${point}\n`;
      });
      md += '\n';
    }
    
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
            position: relative;
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
        
        .summary-points {
            background: linear-gradient(135deg, #e8f5e9 0%, #f1f5e9 100%);
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid #4caf50;
        }
        
        .point {
            color: #2e7d32;
            font-size: 0.95em;
            line-height: 1.6;
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.5);
        }
        
        .point:last-child {
            margin-bottom: 0;
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
        
        .dropdown-menu {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        .dropdown-btn {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.5);
            padding: 11px 22px;
            font-size: 0.95em;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(10px);
        }
        
        .dropdown-btn:hover {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%);
            border-color: rgba(255, 255, 255, 0.8);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
        }
        
        .dropdown-btn:active {
            transform: translateY(0);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
        
        .dropdown-content {
            display: none;
            position: absolute;
            right: 0;
            background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
            min-width: 210px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 
                        0 0 1px rgba(0, 0, 0, 0.1);
            padding: 8px 0;
            z-index: 1;
            border-radius: 10px;
            margin-top: 8px;
            animation: slideDown 0.3s ease-out;
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .dropdown-content.show {
            display: block;
        }
        
        .dropdown-content button {
            color: #2d3748;
            padding: 14px 20px;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            cursor: pointer;
            font-size: 0.95em;
            font-weight: 500;
            transition: all 0.25s ease;
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;
            letter-spacing: 0.3px;
        }
        
        .dropdown-content button::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
            transform: scaleY(0);
            transition: transform 0.25s ease;
            border-radius: 0 3px 3px 0;
        }
        
        .dropdown-content button:hover {
            background-color: rgba(102, 126, 234, 0.08);
            transform: translateX(4px);
        }
        
        .dropdown-content button:hover::before {
            transform: scaleY(1);
        }
        
        .dropdown-content button:active {
            background-color: rgba(102, 126, 234, 0.12);
        }
        
        .dropdown-content button:first-child {
            border-radius: 8px 8px 0 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        }
        
        .dropdown-content button:last-child {
            border-radius: 0 0 8px 8px;
        }
        
        .dropdown-content button svg {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
        }
        
        .code-changes {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin-bottom: 15px;
        }
        
        .code-change-item {
            margin-bottom: 12px;
            padding: 10px;
            background: white;
            border-radius: 4px;
            border-left: 3px solid #667eea;
        }
        
        .code-change-label {
            font-weight: 600;
            color: #333;
            font-size: 0.9em;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .code-change-label.added::before {
            content: "+ ";
            color: #28a745;
            font-weight: 700;
        }
        
        .code-change-label.removed::before {
            content: "- ";
            color: #dc3545;
            font-weight: 700;
        }
        
        .code-change-label.modified::before {
            content: "~ ";
            color: #ffc107;
            font-weight: 700;
        }
        
        .code-snippet {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            line-height: 1.4;
            overflow-x: auto;
            margin-top: 8px;
            border: 1px solid #444;
        }
        
        .code-snippet .added-line {
            background: rgba(40, 167, 69, 0.2);
            color: #a6e22e;
        }
        
        .code-snippet .removed-line {
            background: rgba(220, 53, 69, 0.2);
            color: #f92672;
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
            .dropdown-menu {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="dropdown-menu">
                <button class="dropdown-btn" onclick="toggleDropdown()">
                    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 14V20H6v-6M6 9l4-7 4 7M2 18h16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Download
                </button>
                <div class="dropdown-content" id="dropdownContent">
                    <button onclick="downloadAsMarkdown()">
                        <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.829.793-.793zM12.207 5.391A2 2 0 1015.828 9l-.6-.6a.75.75 0 01.53-1.28h3a.75.75 0 010 1.5h-2.25l1.316 1.316a2 2 0 11-2.828 2.828l-1.414-1.414a.75.75 0 01.53-1.28h3a.75.75 0 010 1.5H13.5l1.086 1.086zM3.75 3.75A.75.75 0 013 4.5v15a.75.75 0 001.5 0V4.5a.75.75 0 00-.75-.75z"/>
                        </svg>
                        Download as Markdown
                    </button>
                    <button onclick="downloadAsPDF()">
                        <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H7zm0 2h10v10H7V5zm2 3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1V8zm1 1v2h2V9h-2zm3-5a1 1 0 00-1 1v2h2V5a1 1 0 00-1-1zm-4 8a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1h3zm0 1H5v2h3v-2z"/>
                        </svg>
                        Download as PDF
                    </button>
                </div>
            </div>
            <h1>Context Documentation Report</h1>
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
    const summaryPoints = generateSummaryPoints(commit, context, files);
    
    const added = files.filter(f => f.status === 'A').length;
    const modified = files.filter(f => f.status === 'M').length;
    const deleted = files.filter(f => f.status === 'D').length;

    html += `
        <div class="commit">
            <h2>${commit.message}</h2>
            
            <div class="commit-header">
                <div class="commit-detail"><strong>Commit:</strong> ${commit.hash}</div>
                <div class="commit-detail"><strong>Author:</strong> ${commit.author}</div>
                <div class="commit-detail"><strong>Date:</strong> ${commit.date}</div>
                <div class="commit-detail"><strong>Files:</strong> ${files.length}</div>
            </div>
            
            ${summaryPoints.length > 0 ? `<div class="section">
                <div class="section-title">Summary</div>
                <div class="summary-points">
                    ${summaryPoints.map(point => `<div class="point">✓ ${point}</div>`).join('')}
                </div>
            </div>` : ''}
            
            <div class="section">
                <div class="section-title">Affected Areas</div>
                <div class="area-tags">
                    ${context.affectedAreas.map(area => `<span class="tag ${area.toLowerCase()}">${area}</span>`).join('')}
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Change Statistics</div>
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
                <div class="section-title">Code Changes</div>
                <div class="code-changes">
${(() => {
    const analysis = context.codeAnalysis || {};
    let html = '';
    
    if (analysis.functionsAdded && analysis.functionsAdded.length > 0) {
        html += '<div class="code-change-item"><div class="code-change-label added">Added Functions/Hooks</div>';
        html += analysis.functionsAdded.slice(0, 5).map(f => `<div style="margin-top: 6px; color: #28a745;">${f}</div>`).join('');
        if (analysis.functionsAdded.length > 5) html += `<div style="color: #666; font-size: 0.9em;">... and ${analysis.functionsAdded.length - 5} more</div>`;
        html += '</div>';
    }
    
    if (analysis.functionsRemoved && analysis.functionsRemoved.length > 0) {
        html += '<div class="code-change-item"><div class="code-change-label removed">Removed Functions</div>';
        html += analysis.functionsRemoved.slice(0, 3).map(f => `<div style="margin-top: 6px; color: #dc3545;">${f}</div>`).join('');
        if (analysis.functionsRemoved.length > 3) html += `<div style="color: #666; font-size: 0.9em;">... and ${analysis.functionsRemoved.length - 3} more</div>`;
        html += '</div>';
    }
    
    if (analysis.stateManagementChanged) {
        html += '<div class="code-change-item"><div class="code-change-label modified">State Management Updated</div><div style="margin-top: 6px; color: #666;">Modified hooks, state, or config files</div></div>';
    }
    
    if (analysis.importsChanged) {
        html += '<div class="code-change-item"><div class="code-change-label modified">Imports Updated</div><div style="margin-top: 6px; color: #666;">Import/export statements changed</div></div>';
    }
    
    if (analysis.typesChanged) {
        html += '<div class="code-change-item"><div class="code-change-label modified">Type Definitions Updated</div><div style="margin-top: 6px; color: #666;">TypeScript interfaces or types modified</div></div>';
    }
    
    if (!html) {
        html = '<div style="color: #999; font-size: 0.9em;">No significant code structure changes detected</div>';
    }
    
    return html;
})()}
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Files Changed</div>
                <div class="file-list">
`;

    // Organize files by category
    if (context.categories.frontend.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">Frontend (${context.categories.frontend.length})</div>`;
        context.categories.frontend.forEach(f => {
            html += `<div class="file-item"><span>${f.file}</span><span class="badge ${f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified'}">${f.status}</span></div>`;
        });
        html += `</div>`;
    }

    if (context.categories.backend.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">Backend (${context.categories.backend.length})</div>`;
        context.categories.backend.forEach(f => {
            html += `<div class="file-item"><span>${f.file}</span><span class="badge ${f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified'}">${f.status}</span></div>`;
        });
        html += `</div>`;
    }

    if (context.categories.ui.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">UI Components (${context.categories.ui.length})</div>`;
        context.categories.ui.forEach(f => {
            html += `<div class="file-item"><span>${f.file}</span><span class="badge ${f.status === 'A' ? 'added' : f.status === 'D' ? 'deleted' : 'modified'}">${f.status}</span></div>`;
        });
        html += `</div>`;
    }

    if (context.categories.tests.length > 0) {
        html += `<div class="file-category">
            <div class="file-category-title">Tests (${context.categories.tests.length})</div>`;
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
    
    <script src="https://cdn.jsdelivr.net/npm/turndown@7.1.1/dist/turndown.umd.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
    
    <script>
        function toggleDropdown() {
            const dropdown = document.getElementById('dropdownContent');
            dropdown.classList.toggle('show');
        }
        
        window.onclick = function(event) {
            if (!event.target.matches('.dropdown-btn')) {
                const dropdown = document.getElementById('dropdownContent');
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
        }
        
        function downloadAsMarkdown() {
            try {
                // Get the header info
                const headerText = document.querySelector('header h1').textContent;
                const branch = document.querySelector('header p').textContent;
                const metaItems = document.querySelectorAll('.meta-value');
                const generated = metaItems[0] ? metaItems[0].textContent : 'N/A';
                const period = metaItems[2] ? metaItems[2].textContent : 'N/A';
                const totalCommits = metaItems[3] ? metaItems[3].textContent : '0';
                
                // Build markdown header
                let markdown = '# ' + headerText + '\\n\\n';
                markdown += branch + '\\n\\n';
                markdown += '**Generated:** ' + generated + '\\n';
                markdown += '**Period:** ' + period + '\\n';
                markdown += '**Total Commits:** ' + totalCommits + '\\n\\n';
                markdown += '---\\n\\n';
                
                // Extract commit sections
                const commits = document.querySelectorAll('.commit');
                
                commits.forEach((commit, index) => {
                    const message = commit.querySelector('h2')?.textContent || 'N/A';
                    const details = commit.querySelectorAll('.commit-detail');
                    const stats = commit.querySelectorAll('.stat-value');
                    
                    markdown += '## ' + message + '\\n\\n';
                    
                    // Add commit details
                    details.forEach(detail => {
                        const text = detail.textContent.trim();
                        if (text) {
                            const parts = text.split(':');
                            markdown += '**' + parts[0] + ':** ' + (parts[1] ? parts[1].trim() : '') + '\\n';
                        }
                    });
                    
                    markdown += '\\n';
                    
                    // Add statistics
                    if (stats.length > 0) {
                        markdown += '**Statistics:**\\n';
                        markdown += '- Added: ' + (stats[0]?.textContent || '0') + '\\n';
                        markdown += '- Modified: ' + (stats[1]?.textContent || '0') + '\\n';
                        markdown += '- Deleted: ' + (stats[2]?.textContent || '0') + '\\n';
                        markdown += '- Total: ' + (stats[3]?.textContent || '0') + '\\n\\n';
                    }
                    
                    // Add tags
                    const tags = commit.querySelectorAll('.tag');
                    if (tags.length > 0) {
                        const tagsList = Array.from(tags).map(t => t.textContent).join(', ');
                        markdown += '**Affected Areas:** ' + tagsList + '\\n\\n';
                    }
                    
                    // Add files
                    const fileCategories = commit.querySelectorAll('.file-category');
                    if (fileCategories.length > 0) {
                        markdown += '**Files Changed:**\\n';
                        fileCategories.forEach(cat => {
                            const catTitle = cat.querySelector('.file-category-title')?.textContent || '';
                            markdown += '\\n**' + catTitle + '**\\n';
                            const files = cat.querySelectorAll('.file-item');
                            files.forEach(file => {
                                const fileText = file.textContent.trim();
                                markdown += '- ' + fileText + '\\n';
                            });
                        });
                    }
                    
                    markdown += '\\n---\\n\\n';
                });
                
                // Trigger download
                const element = document.createElement('a');
                element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown));
                element.setAttribute('download', 'context-report.md');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            } catch (error) {
                console.error('Markdown download error:', error);
                alert('Error downloading markdown: ' + error.message);
            }
        }
        
        function downloadAsPDF() {
            // Clone container without dropdown
            const containerClone = document.querySelector('.container').cloneNode(true);
            const dropdownMenu = containerClone.querySelector('.dropdown-menu');
            if (dropdownMenu) dropdownMenu.remove();
            
            const opt = {
                margin: 10,
                filename: 'context-report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };
            html2pdf().set(opt).from(containerClone).save();
        }
    <\/script>
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
 * Generate PDF using pdfkit
 */
function generatePDF(commits, filename) {
  try {
    if (!fs.existsSync(CONFIG.contextDir)) {
      fs.mkdirSync(CONFIG.contextDir, { recursive: true });
    }

    const pdfPath = path.join(CONFIG.contextDir, filename.replace('.md', '.pdf'));
    const doc = new PDFDocument({ bufferPages: true, size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Context Documentation Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Branch: ${CONFIG.mainBranch}`, { align: 'center' });
    doc.moveDown(1);

    // Metadata
    doc.fontSize(10).font('Helvetica-Bold').text('Report Details:', { underline: true });
    doc.fontSize(9).font('Helvetica');
    doc.text(`Generated: ${new Date().toISOString()}`);
    doc.text(`Branch: ${CONFIG.mainBranch}`);
    doc.text(`Period: ${CONFIG.since}`);
    doc.text(`Total Commits: ${commits.length}`);
    doc.moveDown(1);

    // Commits
    const lines = [];
    for (const commit of commits) {
      const files = getFilesChanged(commit.fullHash);
      const context = buildCommitContext(commit, files);
      const summaryPoints = generateSummaryPoints(commit, context, files);
      
      // Commit header
      doc.fontSize(12).font('Helvetica-Bold').text(`${commit.message}`, { lineBreak: true });
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`Commit: ${commit.hash}`);
      doc.text(`Author: ${commit.author}`);
      doc.text(`Date: ${commit.date}`);
      doc.text(`Files Changed: ${files.length}`);
      doc.moveDown(0.5);
      
      // Summary points
      if (summaryPoints.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').text('Summary:');
        doc.fontSize(9).font('Helvetica');
        summaryPoints.forEach(point => {
          doc.text('✓ ' + point);
        });
        doc.moveDown(0.5);
      }

      // Affected areas
      if (context.affectedAreas.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').text('Affected Areas:');
        doc.fontSize(9).font('Helvetica').text(context.affectedAreas.join(', '));
        doc.moveDown(0.5);
      }

      // File stats
      const added = files.filter(f => f.status === 'A').length;
      const modified = files.filter(f => f.status === 'M').length;
      const deleted = files.filter(f => f.status === 'D').length;
      
      doc.fontSize(10).font('Helvetica-Bold').text('Change Statistics:');
      doc.fontSize(9).font('Helvetica');
      doc.text(`  Added: ${added}, Modified: ${modified}, Deleted: ${deleted}`);
      doc.moveDown(0.5);

      // Code changes analysis
      const analysis = context.codeAnalysis || {};
      if (analysis.functionsAdded?.length > 0 || analysis.functionsRemoved?.length > 0 || analysis.importsChanged || analysis.stateManagementChanged) {
        doc.fontSize(10).font('Helvetica-Bold').text('Code Changes:');
        
        if (analysis.functionsAdded?.length > 0) {
          doc.fontSize(9).font('Helvetica-Bold').text('Added Functions/Hooks:');
          analysis.functionsAdded.slice(0, 4).forEach(f => {
            doc.fontSize(8).font('Helvetica').text(`  + ${f}`);
          });
          if (analysis.functionsAdded.length > 4) {
            doc.fontSize(8).font('Helvetica').text(`  ... and ${analysis.functionsAdded.length - 4} more`);
          }
        }
        
        if (analysis.functionsRemoved?.length > 0) {
          doc.fontSize(9).font('Helvetica-Bold').text('Removed Functions:');
          analysis.functionsRemoved.slice(0, 3).forEach(f => {
            doc.fontSize(8).font('Helvetica').text(`  - ${f}`);
          });
          if (analysis.functionsRemoved.length > 3) {
            doc.fontSize(8).font('Helvetica').text(`  ... and ${analysis.functionsRemoved.length - 3} more`);
          }
        }
        
        if (analysis.stateManagementChanged) {
          doc.fontSize(8).font('Helvetica').text('  Modified state management or hooks');
        }
        
        if (analysis.importsChanged) {
          doc.fontSize(8).font('Helvetica').text('  Updated imports/exports');
        }
        
        doc.moveDown(0.5);
      }

      // Files by category
      if (context.categories.frontend.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Frontend Files:');
        context.categories.frontend.slice(0, 5).forEach(f => {
          doc.fontSize(8).font('Helvetica').text(`  • ${f.file} [${f.status}]`);
        });
        doc.moveDown(0.3);
      }

      if (context.categories.backend.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Backend Files:');
        context.categories.backend.slice(0, 5).forEach(f => {
          doc.fontSize(8).font('Helvetica').text(`  • ${f.file} [${f.status}]`);
        });
        doc.moveDown(0.3);
      }

      if (context.categories.ui.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('UI Components:');
        context.categories.ui.slice(0, 5).forEach(f => {
          doc.fontSize(8).font('Helvetica').text(`  • ${f.file} [${f.status}]`);
        });
        doc.moveDown(0.3);
      }

      doc.moveDown(1);
    }

    // Footer
    doc.fontSize(8).font('Helvetica').text(`Generated on ${new Date()} | Branch: ${CONFIG.mainBranch}`, { align: 'center' });

    doc.end();

    return new Promise((resolve) => {
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', () => resolve(null));
    });
  } catch (error) {
    console.error('PDF generation error:', error.message);
    return Promise.resolve(null);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`🔍 Analyzing commits to ${CONFIG.mainBranch} branch...\n`);

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

  // Save markdown and HTML
  const mdPath = saveMarkdown(markdown, `${filename}.md`);
  const htmlPath = saveHTML(html, `${filename}.html`);
  
  console.log(`✓ Markdown saved to: ${mdPath}`);
  console.log(`✓ HTML saved to: ${htmlPath}`);
  
  // Generate PDF
  console.log('Generating PDF...');
  const pdfPath = await generatePDF(commits, `${filename}.md`);
  
  if (pdfPath) {
    const pdfSize = (fs.statSync(pdfPath).size / 1024).toFixed(2);
    console.log(`✓ PDF saved to: ${pdfPath} (${pdfSize} KB)`);
  }
  
  // Display summary
  console.log('\n=== Files Generated ===');
  console.log(`📄 Markdown: ${filename}.md`);
  console.log(`🌐 HTML: ${filename}.html`);
  console.log(`📕 PDF: ${filename}.pdf`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
