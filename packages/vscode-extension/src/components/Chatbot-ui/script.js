/**
 * Modern Semoss Chatbot JavaScript
 * Using ES6+ features and modern web standards
 */

class SemossChatbot {
    constructor() {
        this.vscode = acquireVsCodeApi();
        this.state = {
            chatStarted: false,
            currentState: 'start',
            lastCommand: null,
            chatHistory: [],
            isLoading: false,
            // Add viewport state
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth <= 768,
                isLandscape: window.innerWidth > window.innerHeight
            }
        };

        // DOM elements
        this.elements = {
            chat: document.getElementById('chat'),
            startArea: document.getElementById('start-area'),
            startBtn: document.getElementById('start-btn'),
            optionsArea: document.getElementById('options-area'),
            inputArea: document.getElementById('input-area'),
            clearChatBtn: document.getElementById('clear-chat-btn'),
            downloadManualBtn: document.getElementById('download-manual-btn'),
            chatContainer: document.getElementById('chat-container'),
            chatHeader: document.getElementById('chat-header'),
            loader: document.getElementById('loader'),
            toastContainer: document.getElementById('toast-container')
        };

        this.init();
    }

    /**
     * Initialize the chatbot
     */
    init() {
        this.bindEvents();
        this.requestHistoryRestore();
        this.updateChatHeaderVisibility();

        // Initial viewport adjustment
        this.handleViewportChange();

        // Add viewport-aware class to body
        document.body.classList.add(this.state.viewport.isMobile ? 'mobile-device' : 'desktop-device');
        if (this.state.viewport.isLandscape) {
            document.body.classList.add('landscape');
        } else {
            document.body.classList.add('portrait');
        }
    }

    /**
     * Bind event listeners
     */    bindEvents() {
        // Start button
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.showOptions());
        }

        // Clear chat button
        if (this.elements.clearChatBtn) {
            this.elements.clearChatBtn.addEventListener('click', () => this.clearChat());
        }

        // Download user manual button
        if (this.elements.downloadManualBtn) {
            this.elements.downloadManualBtn.addEventListener('click', () => this.downloadUserManual());
        }

        // Window message listener
        window.addEventListener('message', (event) => this.handleMessage(event));

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => this.handleKeyboard(event));

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.requestHistoryRestore();
            }
        });

        // Handle viewport changes for responsive design
        window.addEventListener('resize', () => this.handleViewportChange());
        window.addEventListener('orientationchange', () => this.handleViewportChange());
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(event) {
        // Ctrl/Cmd + K to clear chat
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.clearChat();
        }

        // Escape to close dialogs
        if (event.key === 'Escape') {
            const dialog = document.querySelector('.input-dialog');
            if (dialog) {
                dialog.remove();
            }
        }
    }

    /**
     * Request history restoration from VS Code
     */
    requestHistoryRestore() {
        setTimeout(() => {
            this.vscode.postMessage({ type: 'getHistory' });
            this.updateChatHeaderVisibility();
        }, 100);
    }

    /**
     * Handle messages from VS Code extension
     */
    handleMessage(event) {
        const message = event.data;

        switch (message.type) {
            case 'restoreHistory':
                this.restoreHistory(message.history);
                this.state.currentState = message.state || 'start';
                if (this.state.currentState === 'options' && this.state.chatStarted) {
                    this.showOptions();
                }
                break;

            case 'response':
                this.handleResponse(message);
                break;

            case 'smssFileCheckResult':
                this.handleSmssFileCheck(message);
                break;

            case 'instanceAuthorizedResult':
                this.handleInstanceAuthorized(message);
                break;

            case 'instanceAliases':
                this.handleInstanceAliases(message);
                break;

            case 'instanceAliasesWithUrls':
                this.handleInstanceAliasesWithUrls(message);
                break;

            case 'instanceAliasesForRemoval':
                this.handleInstanceAliasesForRemoval(message);
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    /**
     * Handle response messages
     */
    handleResponse(message) {
        // Hide loading for specific commands
        if (this.shouldHideLoading(message)) {
            this.hideLoading();
        }

        // Handle successful removal
        if (message.status === 'success' && message.text && message.text.includes('removed successfully')) {
            this.elements.optionsArea.innerHTML = '';
            this.showOptions();
        }

        const messageClass = message.status === 'error' ? 'error' : 'bot';
        this.appendMessage(message.text, messageClass);

        // Handle authorization success
        if (message.status === 'success' && this.state.lastCommand === 'semoss.authorize') {
            this.saveState('authorized');
            this.showOptions();
        }
    }

    /**
     * Check if loading should be hidden for this message
     */
    shouldHideLoading(message) {
        return (message.text && (
            message.text.includes('Project zipped as assets.zip successfully!') ||
            message.text.toLowerCase().includes('deployed successfully') ||
            message.text.toLowerCase().includes('zip and deploy')
        )) || message.hideLoading;
    }

    /**
     * Handle SMSS file check result
     */
    handleSmssFileCheck(message) {
        this.elements.optionsArea.innerHTML = '';

        const options = message.hasSmss ? [
            { label: 'Zip and Deploy', command: 'semoss.zipanddeploy', icon: '🚀' },
            { label: 'Zip Only', command: 'semoss.ziponly', icon: '📦' },
            { label: 'Deploy Only', command: 'semoss.deployonly', icon: '🌐' }
        ] : [
            { label: 'Create New App', command: 'semoss.createNewApp', icon: '✨' },
            { label: 'Authorize New Instance', command: 'semoss.authorize', icon: '🔐' },
            { label: 'Select Instance', command: 'semoss.selectInstance', icon: '🔄' },
            { label: 'Remove Instance', command: 'semoss.removeInstance', icon: '🗑️' }
        ];

        this.renderOptions(options);
    }

    /**
     * Handle instance authorized result
     */
    async handleInstanceAuthorized(message) {
        if (message.authorized) {
            const requiredInputs = this.getRequiredInputs('semoss.createNewApp');
            const inputs = await this.showInputDialog(requiredInputs);
            if (!inputs) return;

            this.appendMessage('Create New App with details:', 'user');
            this.displayInputs(inputs, {
                'appName': 'App Name',
                'description': 'Description',
                'githubLink': 'GitHub Link',
                'isPrivateRepo': 'Private Repository',
                'accessToken': 'Access Token'
            });

            this.showLoading();
            this.state.lastCommand = 'semoss.createNewApp';
            this.vscode.postMessage({ type: 'chat', command: 'semoss.createNewApp', inputs });
        } else {
            this.appendMessage('Please authorize an instance first.', 'bot');
        }
    }

    /**
     * Handle instance aliases
     */
    handleInstanceAliases(message) {
        this.hideLoading();
        if (Array.isArray(message.aliases) && message.aliases.length > 0) {
            this.showInstanceSelection(message.aliases);
        } else {
            this.appendMessage('No stored instances found. Please authorize a new instance first.', 'bot');
        }
    }

    /**
     * Handle instance aliases with URLs
     */
    handleInstanceAliasesWithUrls(message) {
        this.hideLoading();
        window.semossInstanceUrls = message.urls;
        window.currentInstance = message.currentInstance;
        this.showInstanceSelection(message.aliases);
    }

    /**
     * Handle instance aliases for removal
     */
    handleInstanceAliasesForRemoval(message) {
        window.semossInstanceUrls = message.urls;
        window.currentInstance = message.currentInstance;

        this.elements.optionsArea.innerHTML = '';
        this.appendMessage('Select an instance to remove:', 'bot');

        // If there are multiple aliases, use grid layout
        if (message.aliases.length > 1) {
            this.elements.optionsArea.classList.add('options-grid');
        } else {
            this.elements.optionsArea.classList.remove('options-grid');
        }

        message.aliases.forEach(alias => {
            // Create label with URL if available
            let label = alias;
            if (window.semossInstanceUrls && window.semossInstanceUrls[alias]) {
                label = `${alias} (${window.semossInstanceUrls[alias]})`;
            }

            const btn = this.createOptionButton(label, () => {
                this.showRemoveInstanceConfirmation(alias);
            });

            if (window.currentInstance === alias) {
                btn.classList.add('selected-instance');
            }

            this.elements.optionsArea.appendChild(btn);
        });

        // Add back button
        const backBtn = this.createBackButton(() => {
            this.appendMessage('Instance removal cancelled. No instances were removed.', 'bot');
            this.showOptions();
        });
        this.elements.optionsArea.appendChild(backBtn);

        // Apply viewport-specific adjustments
        this.adjustOptionsForViewport();
    }

    /**
     * Append a message to the chat with enhanced responsive rendering
     * @param {string} text - The message text
     * @param {string} from - Who sent the message ('user' or 'bot')
     * @param {boolean} saveToHistory - Whether to save to history
     * @param {string} status - Message status for styling ('success', 'error', 'warning')
     */
    appendMessage(text, from, saveToHistory = true, status = null) {
        const { isMobile, isSmallPhone, isLandscape, width } = this.state.viewport;

        // Create message container with accessibility attributes
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${from}${status ? ' ' + status : ''}`;
        msgDiv.setAttribute('role', 'listitem');
        msgDiv.setAttribute('aria-label', `${from === 'user' ? 'You' : 'Bot'}: ${typeof text === 'string' ? text.replace(/<[^>]*>/g, '') : 'Message'}`);

        // Add timestamp as data attribute for potential display
        msgDiv.dataset.timestamp = new Date().toISOString();

        // Create message bubble
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        // Process text content for responsive display
        if (typeof text === 'string') {
            // Create a container for the processed content
            let processedContent = text;

            // Handle code blocks for better mobile display
            const codeBlockRegex = /```([\s\S]*?)```/g;
            processedContent = processedContent.replace(codeBlockRegex, (match, code) => {
                // Apply special formatting for code blocks on mobile
                if (isMobile && isSmallPhone) {
                    return `<pre class="code-block small-device-code"><code>${this.escapeHtml(code.trim())}</code></pre>`;
                } else if (isMobile) {
                    return `<pre class="code-block mobile-code"><code>${this.escapeHtml(code.trim())}</code></pre>`;
                } else {
                    return `<pre class="code-block"><code>${this.escapeHtml(code.trim())}</code></pre>`;
                }
            });

            // Handle inline code for better mobile display
            const inlineCodeRegex = /`([^`]+)`/g;
            processedContent = processedContent.replace(inlineCodeRegex, (match, code) => {
                return `<code class="inline-code">${this.escapeHtml(code)}</code>`;
            });

            // Convert URLs to responsive clickable links/images
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            processedContent = processedContent.replace(urlRegex, (url) => {
                // Check if URL might be an image
                const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url);

                if (isImage) {
                    if (isMobile && isSmallPhone) {
                        // Tiny thumbnail for small phones
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link compact">
                                  <div class="image-thumbnail small">
                                    <span class="thumbnail-icon">🖼️</span>
                                  </div>
                                </a>`;
                    } else if (isMobile) {
                        // Thumbnail with text for regular mobile
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">
                                  <div class="image-thumbnail">
                                    <span class="thumbnail-icon">🖼️</span>
                                    <span class="thumbnail-text">View Image</span>
                                  </div>
                                </a>`;
                    } else {
                        // Actual image for desktop with lazy loading and responsive sizing
                        return `<img src="${url}" alt="Image" class="message-image" loading="lazy" 
                                  onerror="this.onerror=null; this.classList.add('image-error'); this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23d4d4d4%22><path d=%22M10 14L21 3m-6 0h6v6M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6%22/%3E%3C/svg%3E'" />`;
                    }
                } else {
                    // Format links based on device
                    let domain = url.replace(/^https?:\/\//, '').split('/')[0];
                    const displayText = isSmallPhone ? domain.split('.')[0] + '...' : domain;

                    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link ${isSmallPhone ? 'compact' : ''}">
                              ${displayText}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="external-link-icon">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </a>`;
                }
            });

            // Process lists for better mobile display
            const listRegex = /^([\s]*)[-*+] (.*)/gm;
            processedContent = processedContent.replace(listRegex, (match, space, item) => {
                const indentLevel = Math.floor(space.length / 2);
                const indentClass = indentLevel > 0 ? ` indent-${Math.min(indentLevel, 3)}` : '';
                return `<div class="list-item${indentClass}">• ${item}</div>`;
            });

            // Set processed HTML
            bubble.innerHTML = processedContent;

            // Add long-text class for very long messages to improve readability
            if (text.length > 300) {
                bubble.classList.add('long-text');
            }
        } else {
            // Fallback for non-string content
            bubble.textContent = String(text);
        }

        // Add status indicator if provided
        if (status) {
            const statusIndicator = document.createElement('span');
            statusIndicator.className = `status-indicator ${status}`;

            // Use appropriate icon based on status
            let icon = '•';
            if (status === 'success') icon = '✓';
            else if (status === 'error') icon = '✗';
            else if (status === 'warning') icon = '⚠';

            statusIndicator.textContent = icon;
            bubble.appendChild(statusIndicator);
        }

        // Append elements to DOM
        msgDiv.appendChild(bubble);
        this.elements.chat.appendChild(msgDiv);

        // Optimize scrolling based on device
        const scrollBehavior = (isMobile || isLandscape) ? 'auto' : 'smooth';

        // Smooth scroll to bottom with device-appropriate behavior
        this.elements.chat.scrollTo({
            top: this.elements.chat.scrollHeight,
            behavior: scrollBehavior
        });

        // On mobile landscape, ensure we're showing the latest content when keyboard appears
        if (isMobile && isLandscape) {
            // Double scroll to ensure content is visible
            setTimeout(() => {
                this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
            }, 100);
        }

        this.updateChatHeaderVisibility();

        if (saveToHistory) {
            this.vscode.postMessage({
                type: 'saveMessage',
                message: { text, from, timestamp: Date.now() }
            });
        }
    }

    /**
     * Restore chat history
     */
    restoreHistory(history) {
        this.elements.chat.innerHTML = '';

        history.forEach(msg => {
            this.appendMessage(msg.text, msg.from || 'bot', false);
        });

        if (history.length > 0) {
            this.state.chatStarted = true;
            this.elements.startArea.style.display = 'none';
        }

        this.updateChatHeaderVisibility();
    }

    /**
     * Save state to extension
     */
    saveState(state) {
        this.state.currentState = state;
        this.vscode.postMessage({ type: 'saveState', state });
    }

    /**
     * Clear chat history and reset state
     */
    clearChat() {
        // Animate out existing messages
        const messages = this.elements.chat.querySelectorAll('.message');
        messages.forEach((msg, index) => {
            setTimeout(() => {
                msg.style.opacity = '0';
                msg.style.transform = 'translateY(-10px)';
            }, index * 50);
        });

        setTimeout(() => {
            this.elements.chat.innerHTML = '';
            this.state.chatStarted = false;
            this.state.currentState = 'start';

            this.elements.startArea.style.display = 'flex';
            this.elements.optionsArea.style.display = 'none';

            this.vscode.postMessage({ type: 'clearHistory' });
            this.saveState('start');
            this.updateChatHeaderVisibility();

            this.showToast('Chat cleared successfully', 'success');
        }, messages.length * 50 + 200);
    }

    /**
     * Update chat header visibility
     */
    updateChatHeaderVisibility() {
        const shouldShow = this.state.chatStarted || this.elements.chat.children.length > 0;

        if (shouldShow) {
            this.elements.chatHeader.style.display = 'flex';
            this.elements.chatContainer.style.display = 'flex';
            this.elements.chatContainer.classList.add('visible');
        } else {
            this.elements.chatHeader.style.display = 'none';
            this.elements.chatContainer.style.display = 'none';
            this.elements.chatContainer.classList.remove('visible');
        }
    }

    /**
     * Show options area with responsive layout
     */
    showOptions() {
        if (!this.state.chatStarted) {
            this.state.chatStarted = true;
            this.saveState('options');
        }

        this.elements.startArea.style.display = 'none';

        // Reset options area completely
        this.elements.optionsArea.style.display = 'flex';
        this.elements.optionsArea.innerHTML = '';
        this.elements.optionsArea.className = 'options-container';

        // Add responsive classes based on viewport
        if (this.state.viewport.isMobile) {
            this.elements.optionsArea.classList.add('mobile-view');
        }
        if (this.state.viewport.isSmallPhone) {
            this.elements.optionsArea.classList.add('small-device');
        }

        this.updateChatHeaderVisibility();
        this.vscode.postMessage({ type: 'checkSmssFile' });
    }

    /**
     * Render option buttons with responsive layout
     */
    renderOptions(options) {
        // Clear any existing options
        this.elements.optionsArea.innerHTML = '';

        // If there are multiple options, use grid layout for larger screens
        if (options.length > 1) {
            this.elements.optionsArea.classList.add('options-grid');
        } else {
            this.elements.optionsArea.classList.remove('options-grid');
        }

        options.forEach(opt => {
            const btn = this.createOptionButton(opt.label, async () => {
                await this.handleOptionClick(opt);
            });

            // Add icon if provided
            if (opt.icon) {
                if (btn.firstChild && btn.firstChild.className === 'option-content') {
                    // If we have structured content, add icon to the label
                    const labelEl = btn.querySelector('.option-label');
                    labelEl.innerHTML = `<span style="margin-right: 8px;">${opt.icon}</span>${labelEl.textContent}`;
                } else {
                    // Standard text content
                    btn.innerHTML = `<span style="margin-right: 8px;">${opt.icon}</span>${opt.label}`;
                }
            }

            this.elements.optionsArea.appendChild(btn);
        });

        // Apply viewport-specific adjustments to the options
        this.adjustOptionsForViewport();
    }

    /**
     * Adjust options display based on current viewport
     */
    adjustOptionsForViewport() {
        const { isMobile, isSmallPhone, width } = this.state.viewport;
        const options = this.elements.optionsArea;
        const buttons = options.querySelectorAll('.option-btn');

        // For very small screens, apply compact styling
        if (isSmallPhone) {
            buttons.forEach(btn => {
                btn.classList.add('compact');

                // Simplify content if it has URL parts
                const sublabel = btn.querySelector('.option-sublabel');
                if (sublabel && sublabel.textContent.length > 20) {
                    const url = sublabel.textContent;
                    // Truncate URL display to save space
                    sublabel.textContent = url.substring(0, 20) + '...';
                    sublabel.title = url; // Keep full URL as tooltip
                }
            });

            // Force vertical layout on very small screens
            options.classList.remove('options-grid');
        }
        // For mobile but not tiny screens
        else if (isMobile) {
            buttons.forEach(btn => {
                btn.classList.remove('compact');

                // Truncate very long URLs but show more than on tiny screens
                const sublabel = btn.querySelector('.option-sublabel');
                if (sublabel && sublabel.textContent.length > 40) {
                    const url = sublabel.textContent;
                    sublabel.textContent = url.substring(0, 40) + '...';
                    sublabel.title = url;
                }
            });

            // Use grid only if we have 3 or fewer options on mobile
            if (buttons.length > 3) {
                options.classList.remove('options-grid');
            }
        }
        // For tablets and desktops
        else {
            buttons.forEach(btn => btn.classList.remove('compact'));

            // Use grid for multiple options
            if (buttons.length > 1) {
                options.classList.add('options-grid');
            }
        }
    }

    /**
     * Handle option button click
     */
    async handleOptionClick(option) {
        const { command, label } = option;

        // Special handling for specific commands
        switch (command) {
            case 'semoss.createNewApp':
                this.vscode.postMessage({ type: 'checkInstanceAuthorized' });
                return;

            case 'semoss.authorize':
                await this.handleAuthorizeCommand();
                return;

            case 'semoss.selectInstance':
                this.showLoading();
                this.vscode.postMessage({ type: 'getInstanceAliases' });
                return;

            case 'semoss.removeInstance':
                this.vscode.postMessage({ type: 'getInstanceAliasesForRemoval' });
                return;
        }

        // Handle commands that require input
        const requiredInputs = this.getRequiredInputs(command);
        if (requiredInputs.length > 0) {
            const inputs = await this.showInputDialog(requiredInputs);
            if (!inputs) return;

            this.appendMessage(`${label} with details:`, 'user');
            Object.entries(inputs).forEach(([key, value]) => {
                this.appendMessage(`${key}: ${value}`, 'user');
            });

            this.showLoading();
            this.state.lastCommand = command;
            this.vscode.postMessage({ type: 'chat', command, inputs });
        } else {
            this.appendMessage(label, 'user');

            // Don't show spinner for certain commands
            if (!this.shouldSkipLoading(command)) {
                this.showLoading();
            }

            this.state.lastCommand = command;
            this.vscode.postMessage({ type: 'chat', command });
        }
    }

    /**
     * Handle authorize command
     */
    async handleAuthorizeCommand() {
        const requiredInputs = this.getRequiredInputs('semoss.authorize');
        const inputs = await this.showInputDialog(requiredInputs);
        if (!inputs) return;

        this.appendMessage('Authorize New Instance with details:', 'user');
        this.displayInputs(inputs, {
            'alias': 'Instance Alias',
            'url': 'Semoss Instance URL',
            'accessKey': 'Access Key',
            'privateKey': 'Private Key'
        });

        this.showLoading();
        this.state.lastCommand = 'semoss.authorize';
        this.vscode.postMessage({ type: 'chat', command: 'semoss.authorize', inputs });
    }

    /**
     * Display input values in chat
     */
    displayInputs(inputs, fieldLabels) {
        Object.entries(inputs).forEach(([key, value]) => {
            const displayLabel = fieldLabels[key] || key;
            let displayValue = value;

            if (typeof value === 'boolean') {
                displayValue = value ? 'Yes' : 'No';
            }

            if (value !== '' && value !== null && value !== undefined) {
                this.appendMessage(`${displayLabel}: ${displayValue}`, 'user');
            }
        });
    }

    /**
     * Check if loading should be skipped for command
     */
    shouldSkipLoading(command) {
        return ['semoss.ziponly', 'semoss.deployonly', 'semoss.zipanddeploy'].includes(command);
    }

    /**
     * Show instance selection
     */
    showInstanceSelection(aliases) {
        this.elements.optionsArea.innerHTML = '';
        this.appendMessage('Select an instance:', 'bot');

        // If there are multiple aliases, use grid layout
        if (aliases.length > 1) {
            this.elements.optionsArea.classList.add('options-grid');
        } else {
            this.elements.optionsArea.classList.remove('options-grid');
        }

        aliases.forEach(alias => {
            // Create label with URL if available
            let label = alias;
            if (window.semossInstanceUrls && window.semossInstanceUrls[alias]) {
                label = `${alias} (${window.semossInstanceUrls[alias]})`;
            }

            const btn = this.createOptionButton(label, () => {
                this.appendMessage(`Switch to instance: ${alias}`, 'user');
                this.showLoading();
                this.state.lastCommand = 'semoss.selectInstance';
                this.vscode.postMessage({ type: 'chat', command: 'semoss.selectInstance', inputs: { alias } });
            });

            if (window.currentInstance === alias) {
                btn.classList.add('selected-instance');
            }

            this.elements.optionsArea.appendChild(btn);
        });

        // Add back button
        const backBtn = this.createBackButton(() => {
            this.appendMessage('Instance selection cancelled. No changes were made.', 'bot');
            this.showOptions();
        });
        this.elements.optionsArea.appendChild(backBtn);

        // Apply viewport-specific adjustments
        this.adjustOptionsForViewport();
    }

    /**
     * Get required inputs for command
     */
    getRequiredInputs(command) {
        const inputConfigs = {
            'semoss.createNewApp': [
                { name: 'appName', label: 'App Name', placeholder: 'Enter app name', required: true },
                { name: 'description', label: 'Description (optional)', placeholder: 'Enter app description (optional)' },
                { name: 'githubLink', label: 'GitHub Link (optional)', placeholder: 'https://github.com/user/repo' },
                { name: 'isPrivateRepo', label: 'Private Repository', type: 'toggle', defaultValue: false, description: 'Toggle ON for private repositories (requires access token)' },
                { name: 'accessToken', label: 'GitHub Access Token (for private repos) <span class="info-icon" title="Step-by-Step Instructions for Generating a Personal Access Token in GitHub&#10;&#10;Step 1: Log In to GitHub&#10;• Open your browser and go to https://github.com/.&#10;• Enter your username and password to sign in.&#10;Step 2: Access Your Account Settings&#10;• In the upper-right corner, click your profile picture.&#10;• From the dropdown, select Settings.&#10;Step 3: Navigate to Developer Settings&#10;• In the left sidebar, scroll down and click Developer settings.&#10;Step 4: Open Personal Access Tokens&#10;• Under Developer settings, click Personal access tokens.&#10;• Choose Tokens (classic).&#10;Step 5: Generate a New Token&#10;• Click the Generate new token button.&#10;• For classic tokens: Click Generate new token (classic).&#10;Step 6: Configure Token Details&#10;• Enter a Name for your token.&#10;• Set the Expiration date (recommended for security).&#10;• Select the Scopes or permissions you want to grant this token (select repo).&#10;Step 7: Generate and Copy the Token&#10;• Click Generate token at the bottom of the page.&#10;• Copy your new personal access token and save it in a secure place. Note: You will not be able to see the token again after you leave this page.&#10;&#10;">ℹ️</span>', placeholder: 'ghp_...', conditional: 'isPrivateRepo' }
            ],
            'semoss.authorize': [
                { name: 'alias', label: 'Instance Alias', placeholder: 'e.g., Production, Development', required: true },
                { name: 'url', label: 'Semoss Instance URL', placeholder: 'Enter only the part before /semoss', required: true },
                { name: 'accessKey', label: 'Access Key', placeholder: 'Your access key', required: true },
                { name: 'privateKey', label: 'Private Key', placeholder: 'Your private key', required: true }
            ]
        };

        return inputConfigs[command] || [];
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        this.state.isLoading = true;
        this.elements.loader.style.display = 'flex';
        this.elements.optionsArea.style.opacity = '0.5';
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.state.isLoading = false;
        this.elements.loader.style.display = 'none';
        this.elements.optionsArea.style.opacity = '1';
    }

    /**
     * Show input dialog
     */
    async showInputDialog(inputs) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'input-dialog';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');

            let formHTML = `
                <div class="dialog-content">
                    <h3>Required Information</h3>
                    <form id="inputForm">
            `;

            inputs.forEach(input => {
                formHTML += this.generateInputHTML(input);
            });

            formHTML += `
                        <div class="dialog-buttons">
                            <button type="submit" class="submit-btn">Submit</button>
                            <button type="button" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            `;

            dialog.innerHTML = formHTML;
            document.body.appendChild(dialog);

            // Focus first input
            const firstInput = dialog.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }

            const form = dialog.querySelector('#inputForm');
            const cancelBtn = dialog.querySelector('.cancel-btn');

            this.setupFormInteractions(form, inputs);

            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = this.extractFormData(form, inputs);
                dialog.remove();
                resolve(formData);
            };

            cancelBtn.onclick = () => {
                dialog.remove();
                resolve(null);
            };

            // Close on backdrop click
            dialog.onclick = (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                    resolve(null);
                }
            };
        });
    }

    /**
     * Generate HTML for input field
     */
    generateInputHTML(input) {
        let inputHTML = '<div class="input-group';

        if (input.conditional) {
            inputHTML += ' conditional-field" data-depends-on="' + input.conditional + '" style="display: none;';
        }
        inputHTML += '">';

        if (input.type === 'toggle') {
            inputHTML += `
                <label class="toggle-label">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span class="toggle-text">${input.label}</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="${input.name}" ${input.defaultValue ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    ${input.description ? `<div class="toggle-description">${input.description}</div>` : ''}
                </label>
            `;
        } else {
            const inputType = this.getInputType(input.name);
            const required = input.required ? 'required' : '';

            inputHTML += `
                <label for="${input.name}">${input.label}:</label>
                <input type="${inputType}" 
                       id="${input.name}" 
                       placeholder="${input.placeholder}"
                       ${required}
                       autocomplete="${this.getAutocomplete(input.name)}">
            `;
        }

        return inputHTML + '</div>';
    }

    /**
     * Get input type based on field name
     */
    getInputType(name) {
        const sensitiveFields = ['key', 'token', 'password', 'secret'];
        return sensitiveFields.some(field => name.toLowerCase().includes(field)) ? 'password' : 'text';
    }

    /**
     * Get autocomplete attribute
     */
    getAutocomplete(name) {
        const autocompleteMap = {
            'url': 'url',
            'email': 'email',
            'alias': 'username',
            'appName': 'organization-title'
        };
        return autocompleteMap[name] || 'off';
    }

    /**
     * Setup form interactions (toggles, conditional fields)
     */
    setupFormInteractions(form, inputs) {
        inputs.forEach(input => {
            if (input.type === 'toggle') {
                const toggle = form.querySelector(`#${input.name}`);
                const conditionalFields = form.querySelectorAll(`[data-depends-on="${input.name}"]`);

                toggle.addEventListener('change', () => {
                    conditionalFields.forEach(field => {
                        if (toggle.checked) {
                            field.style.display = 'block';
                            const conditionalInput = field.querySelector('input');
                            if (conditionalInput && input.name === 'isPrivateRepo') {
                                conditionalInput.required = true;
                            }
                        } else {
                            field.style.display = 'none';
                            const conditionalInput = field.querySelector('input');
                            if (conditionalInput) {
                                conditionalInput.required = false;
                                conditionalInput.value = '';
                            }
                        }
                    });
                });

                // Trigger initial state
                toggle.dispatchEvent(new Event('change'));
            }
        });
    }

    /**
     * Extract form data
     */
    extractFormData(form, inputs) {
        const formData = {};
        inputs.forEach(input => {
            const element = form.querySelector(`#${input.name}`);
            if (input.type === 'toggle') {
                formData[input.name] = element.checked;
            } else {
                formData[input.name] = element.value;
            }
        });
        return formData;
    }

    /**
     * Show remove instance confirmation
     */
    showRemoveInstanceConfirmation(alias) {
        this.elements.optionsArea.innerHTML = '';
        this.elements.optionsArea.classList.remove('options-grid');
        this.appendMessage(`Are you sure you want to remove "${alias}"?`, 'bot');

        // Create a button row container for better responsiveness
        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';

        const yesBtn = this.createOptionButton('Yes', () => {
            this.showLoading();
            this.vscode.postMessage({ type: 'removeInstanceByAlias', alias });
        });
        yesBtn.style.background = 'linear-gradient(135deg, var(--color-danger), #ff6b6b)';

        const noBtn = this.createOptionButton('No', () => {
            this.appendMessage(`Cancelled removal of instance "${alias}".`, 'bot');
            this.showOptions();
        });

        buttonRow.appendChild(yesBtn);
        buttonRow.appendChild(noBtn);
        this.elements.optionsArea.appendChild(buttonRow);
    }

    /**
     * Create option button with enhanced responsiveness
     */
    createOptionButton(text, onClick, extraClasses = '') {
        const btn = document.createElement('button');
        btn.className = `option-btn ${extraClasses}`.trim();
        btn.onclick = onClick;
        btn.setAttribute('role', 'menuitem');

        // Check if the text contains URL-like content in parentheses
        if (typeof text === 'string' && text.includes('(') && text.includes(')')) {
            // Extract the main label and URL parts
            const parts = text.split('(');
            const mainLabel = parts[0].trim();
            const urlPart = `(${parts.slice(1).join('(')}`;

            // Create structured content with label and sublabel
            const contentDiv = document.createElement('div');
            contentDiv.className = 'option-content';

            const labelSpan = document.createElement('div');
            labelSpan.className = 'option-label';
            labelSpan.textContent = mainLabel;

            const urlSpan = document.createElement('div');
            urlSpan.className = 'option-sublabel';
            urlSpan.textContent = urlPart;

            contentDiv.appendChild(labelSpan);
            contentDiv.appendChild(urlSpan);
            btn.appendChild(contentDiv);
        } else {
            // Standard text content
            btn.textContent = text;
        }

        return btn;
    }

    /**
     * Create back button
     */
    createBackButton(onClick) {
        const btn = this.createOptionButton('Back', onClick);
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.color = 'var(--text-primary)';
        btn.style.border = '1px solid var(--border-secondary)';
        return btn;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');

        this.elements.toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Get state for debugging
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    /**
     * Handle viewport changes (resize, orientation)
     */
    handleViewportChange() {
        // Get the new viewport details
        const width = window.innerWidth;
        const height = window.innerHeight;

        const newViewport = {
            width: width,
            height: height,
            isMobile: width <= 768,
            isTablet: width > 768 && width <= 1023,
            isDesktop: width > 1023,
            isSmallPhone: width <= 375,
            isLandscape: width > height,
            aspectRatio: width / height,
            hasNotch: window.screen && (window.screen.height > 800) && ('ontouchstart' in window)
        };

        // Detect if device has safe-area insets (iPhone X+ or similar devices)
        // This is a basic check, actual values come from CSS env() variables
        if (CSS.supports('padding: env(safe-area-inset-top)')) {
            newViewport.hasSafeAreaInsets = true;
        }

        // Update state
        this.state.viewport = newViewport;

        // Apply all viewport-specific adjustments
        this.applyViewportAdjustments();

        // Specifically adjust options if they're visible
        if (this.elements.optionsArea.style.display !== 'none') {
            this.adjustOptionsForViewport();
        }

        // Update body classes for CSS targeting
        this.updateViewportClasses();

        // Debounced notification to extension about viewport changes
        clearTimeout(this._viewportChangeTimeout);
        this._viewportChangeTimeout = setTimeout(() => {
            this.vscode.postMessage({
                type: 'viewportChanged',
                viewport: newViewport
            });
        }, 200);
    }

    /**
     * Update body classes based on viewport
     */
    updateViewportClasses() {
        const { isMobile, isTablet, isDesktop, isSmallPhone, isLandscape } = this.state.viewport;

        // Clear existing classes
        document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device', 'small-phone', 'landscape', 'portrait');

        // Add device type classes
        if (isSmallPhone) document.body.classList.add('small-phone');
        if (isMobile) document.body.classList.add('mobile-device');
        if (isTablet) document.body.classList.add('tablet-device');
        if (isDesktop) document.body.classList.add('desktop-device');

        // Add orientation classes
        if (isLandscape) {
            document.body.classList.add('landscape');
        } else {
            document.body.classList.add('portrait');
        }
    }

    /**
     * Apply comprehensive viewport-specific UI adjustments
     */
    applyViewportAdjustments() {
        const { isMobile, isTablet, isLandscape, isSmallPhone, height } = this.state.viewport;

        // Adjust option buttons layout for mobile/landscape
        if (this.elements.optionsArea) {
            if (isMobile && isLandscape) {
                this.elements.optionsArea.classList.add('landscape-layout');
            } else {
                this.elements.optionsArea.classList.remove('landscape-layout');
            }
        }

        // Adjust chat container height based on device
        if (this.elements.chat) {
            if (isMobile) {
                const headerHeight = this.elements.chatHeader ? this.elements.chatHeader.offsetHeight : 0;
                let inputAreaHeight = this.elements.inputArea ? this.elements.inputArea.offsetHeight : 0;

                // Default input height if not yet rendered
                if (inputAreaHeight < 10) inputAreaHeight = isSmallPhone ? 60 : 80;

                // Additional padding adjustment
                const paddingAdjustment = isSmallPhone ? 30 : isLandscape ? 40 : 60;

                // Calculate the available height
                const adjustedHeight = height - headerHeight - inputAreaHeight - paddingAdjustment;

                // Apply the calculated height
                this.elements.chat.style.maxHeight = `${Math.max(150, adjustedHeight)}px`;

            } else if (isTablet) {
                // Tablet-specific adjustments
                const adjustedHeight = height - 200; // Less aggressive adjustment for tablets
                this.elements.chat.style.maxHeight = `${Math.max(250, adjustedHeight)}px`;
            } else {
                // Reset to CSS default on larger screens
                this.elements.chat.style.maxHeight = '';
            }
        }
    }

    /**
     * Safely escape HTML content to prevent XSS
     * @param {string} html - The HTML to escape
     * @returns {string} - Escaped HTML
     */
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Download the user manual PDF
     */
    downloadUserManual() {
        // Request the user manual from VS Code extension
        this.vscode.postMessage({
            type: 'downloadUserManual'
        });

        // Show toast notification
        this.showToast('Downloading user manual...', 'info');

        // Let VS Code know we want to download the manual
        this.vscode.postMessage({
            type: 'openExternalResource',
            resource: 'user-manual'
        });
    }
}

// Legacy functions for compatibility with existing VS Code integration
let chatbotInstance;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        chatbotInstance = new SemossChatbot();
    });
} else {
    chatbotInstance = new SemossChatbot();
}

// Export for VS Code integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SemossChatbot,
        // Legacy function exports
        getChatbotHtml: () => {
            // This will be handled by the HTML file now
            return null;
        },
        handleChatbotAction: (action, options, context) => {
            console.log('handleChatbotAction called with:', action, options);
            // Implementation can be added here if needed
        },
        mapMessageToCommand: (msg) => {
            if (!msg || !msg.text) return null;
            const text = msg.text.toLowerCase();
            if (text.includes('authorize')) return 'semoss.authorize';
            if (text.includes('create') && text.includes('app')) return 'semoss.createNewApp';
            if (text.includes('zip') && text.includes('deploy')) return 'semoss.zipanddeploy';
            if (text.includes('zip')) return 'semoss.ziponly';
            if (text.includes('deploy')) return 'semoss.deployonly';
            if (text.includes('remove') && text.includes('instance')) return 'semoss.removeInstance';
            if (text.includes('select') && text.includes('instance')) return 'semoss.selectInstance';
            if (text.includes('chatbot')) return 'semoss.openChatbot';
            return null;
        }
    };
}
