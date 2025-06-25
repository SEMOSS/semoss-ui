// src/components/Chatbot/Chatbot.js
export function getChatbotHtml(cssUri) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Semoss Chatbot</title>
            <link rel="stylesheet" type="text/css" href="${cssUri}">
         

        </head>
        <body>
            <div id="container">
                <div id="chat"></div>
                <div id="start-area">
                    <div style="font-size:22px;font-weight:bold;margin-bottom:12px;">Welcome to Semoss Chatbot</div>
                    <div style="font-size:15px;opacity:0.8;">How can I help you today?</div>
                    <button id="start-btn">Start</button>
                </div>
                <div id="options-area" style="display:none;"></div>
                <div id="input-area"></div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const chat = document.getElementById('chat');
                const startArea = document.getElementById('start-area');
                const startBtn = document.getElementById('start-btn');
                const optionsArea = document.getElementById('options-area');
                const inputArea = document.getElementById('input-area');

                function appendMessage(text, from) {
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'message ' + from;
                    const bubble = document.createElement('div');
                    bubble.className = 'bubble';
                    bubble.textContent = text;
                    msgDiv.appendChild(bubble);
                    chat.appendChild(msgDiv);
                    chat.scrollTop = chat.scrollHeight;
                }

                function showOptions() {
                    startArea.style.display = 'none';
                    optionsArea.style.display = 'flex';
                    optionsArea.innerHTML = '';
                    // Request backend to check for .smss file in the workspace
                    vscode.postMessage({ type: 'checkSmssFile' });
                }

                // Listen for backend response
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'response') {
                        // Always hide spinner for zip only, deploy only, and zip and deploy
                        if (
                            (message.text && (
                                message.text.includes('Project zipped as assets.zip successfully!') ||
                                message.text.toLowerCase().includes('deployed successfully') ||
                                message.text.toLowerCase().includes('zip and deploy')
                            )) || message.hideLoading
                        ) {
                            showLoading(false);
                        }
                        // Hide optionsArea buttons after a successful removal and show main options again
                        if (message.status === 'success' && message.text && message.text.includes('removed successfully')) {
                            optionsArea.innerHTML = '';
                            showOptions();
                        }
                        const messageClass = message.status === 'error' ? 'error' : 'bot';
                        appendMessage(message.text, messageClass);
                        // If authorization was successful, refresh the UI
                        if (message.status === 'success' && command === 'semoss.authorize') {
                            showOptions();
                        }
                        return;
                    } else if (message.type === 'smssFileCheckResult') {
                        optionsArea.innerHTML = '';
                        let options;
                        if (message.hasSmss) {
                            options = [
                                { label: 'Zip and Deploy', command: 'semoss.zipanddeploy' },
                                { label: 'Zip Only', command: 'semoss.ziponly' },
                                { label: 'Deploy Only', command: 'semoss.deployonly' }
                            ];
                        } else {
                            options = [
                                { label: 'Create New App', command: 'semoss.createNewApp' },
                                { label: 'Authorize New Instance', command: 'semoss.authorize' },
                                { label: 'Select Instance', command: 'semoss.selectInstance' },
                                { label: 'Remove Instance', command: 'semoss.removeInstance' }
                            ];
                        }
                        options.forEach(opt => {
                            const btn = document.createElement('button');
                            btn.className = 'option-btn';
                            btn.textContent = opt.label;
                            btn.onclick = async () => {
                                if (opt.command === 'semoss.createNewApp') {
                                    vscode.postMessage({ type: 'checkInstanceAuthorized' });
                                    return;
                                }
                                if (opt.command === 'semoss.authorize') {
                                    // Show input dialog for authorization
                                    const requiredInputs = getRequiredInputs('semoss.authorize');
                                    const inputs = await showInputDialog(requiredInputs);
                                    if (!inputs) return;
                                    appendMessage('Authorize New Instance with details:', 'user');
                                    Object.entries(inputs).forEach(([key, value]) => {
                                        appendMessage(key + ': ' + value, 'user');
                                    });
                                    showLoading(true);
                                    vscode.postMessage({ type: 'chat', command: 'semoss.authorize', inputs: inputs });
                                    return;
                                }
                                if (opt.command === 'semoss.selectInstance') {
                                    showLoading(true);
                                    vscode.postMessage({ type: 'getInstanceAliases' });
                                    return;
                                }
                                if (opt.command === 'semoss.removeInstance') {
                                    vscode.postMessage({ type: 'getInstanceAliasesForRemoval' });
                                    return;
                                }
                                const requiredInputs = getRequiredInputs(opt.command);
                                if (requiredInputs.length > 0) {
                                    const inputs = await showInputDialog(requiredInputs);
                                    if (!inputs) return;
                                    appendMessage(opt.label + ' with details:', 'user');
                                    Object.entries(inputs).forEach(([key, value]) => {
                                        appendMessage(key + ': ' + value, 'user');
                                    });
                                    // Only show spinner for commands that require input
                                    showLoading(true);
                                    vscode.postMessage({ type: 'chat', command: opt.command, inputs: inputs });
                                } else {
                                    appendMessage(opt.label, 'user');
                                    // Do NOT show spinner for zip only, deploy only, zip and deploy
                                    if (
                                        opt.command !== 'semoss.ziponly' &&
                                        opt.command !== 'semoss.deployonly' &&
                                        opt.command !== 'semoss.zipanddeploy'
                                    ) {
                                        showLoading(true);
                                    }
                                    vscode.postMessage({ type: 'chat', command: opt.command });
                                }
                            };
                            optionsArea.appendChild(btn);
                        });
                    } else if (message.type === 'instanceAuthorizedResult') {
                        if (message.authorized) {
                            // Proceed to show create app dialog
                            const requiredInputs = getRequiredInputs('semoss.createNewApp');
                            showInputDialog(requiredInputs).then(inputs => {
                                if (!inputs) return;
                                appendMessage('Create New App with details:', 'user');
                                Object.entries(inputs).forEach(([key, value]) => {
                                    appendMessage(key + ': ' + value, 'user');
                                });
                                showLoading(true);
                                vscode.postMessage({ type: 'chat', command: 'semoss.createNewApp', inputs: inputs });
                            });
                        } else {
                            appendMessage('Please authorize an instance first.', 'bot');
                        }
                    } else if (message.type === 'response') {
                        appendMessage(message.text, 'bot');
                        showLoading(false);
                    } else if (message.type === 'instanceAliases') {
                        showLoading(false);
                        if (Array.isArray(message.aliases) && message.aliases.length > 0) {
                            showInstanceSelection(message.aliases);
                        } else {
                            appendMessage('No stored instances found. Please authorize a new instance first.', 'bot');
                        }                    
                            } else if (message.type === 'instanceAliasesWithUrls') {
                        showLoading(false);
                        window.semossInstanceUrls = message.urls;
                        window.currentInstance = message.currentInstance;
                        showInstanceSelection(message.aliases);                    } else if (message.type === 'instanceAliasesForRemoval') {
                        window.semossInstanceUrls = message.urls;
                        window.currentInstance = message.currentInstance;
                        // Show aliases as buttons for removal
                        optionsArea.innerHTML = '';
                        appendMessage('Select an instance to remove:', 'bot');
                        message.aliases.forEach(alias => {
                            const btn = document.createElement('button');
                            btn.className = 'option-btn';
                            // Highlight current instance
                            if (window.currentInstance && window.currentInstance === alias) {
                                btn.classList.add('selected-instance');
                            }
                            // Show alias and URL if available
                            let label = alias;
                            if (window.semossInstanceUrls && window.semossInstanceUrls[alias]) {
                                label += ' (' + window.semossInstanceUrls[alias] + ')';
                            }
                            btn.textContent = label;
                            btn.onclick = () => {
                                // Show confirmation dialog in chatbot
                                showRemoveInstanceConfirmation(alias);
                            };
                            optionsArea.appendChild(btn);
                        });                        
                        // Add Back button
                        const backBtn = document.createElement('button');
                        backBtn.className = 'option-btn';
                        backBtn.textContent = 'Back';
                        backBtn.style.background = '#333';
                        backBtn.style.color = '#fff';
                        backBtn.onclick = () => {
                            appendMessage('Instance removal cancelled. No instances were removed.', 'bot');
                            showOptions();
                        };
                        optionsArea.appendChild(backBtn);
                    }
                });                
                
                function showInstanceSelection(aliases) {
                    optionsArea.innerHTML = '';
                    appendMessage('Select an instance:', 'bot');
                    aliases.forEach(alias => {
                        const btn = document.createElement('button');
                        btn.className = 'option-btn';
                        // Highlight current instance
                        if (window.currentInstance && window.currentInstance === alias) {
                            btn.classList.add('selected-instance');
                        }
                        // Show alias and URL if available
                        let label = alias;
                        if (window.semossInstanceUrls && window.semossInstanceUrls[alias]) {
                            label += ' (' + window.semossInstanceUrls[alias] + ')';
                        }
                        btn.textContent = label;
                        btn.onclick = () => {
                            appendMessage('Switch to instance: ' + alias, 'user');
                            showLoading(true);
                            vscode.postMessage({ type: 'chat', command: 'semoss.selectInstance', inputs: { alias } });
                        };
                        optionsArea.appendChild(btn);
                    });
                    // Add Back button
                    const backBtn = document.createElement('button');
                    backBtn.className = 'option-btn';
                    backBtn.textContent = 'Back';
                    backBtn.style.background = '#333';
                    backBtn.style.color = '#fff';
                    backBtn.onclick = () => {
                        appendMessage('Instance selection cancelled. No changes were made.', 'bot');
                        showOptions();
                    };
                    optionsArea.appendChild(backBtn);
                }
                function getRequiredInputs(command) {
                    switch (command) {
                        case 'semoss.createNewApp':
                            return [
                                { name: 'appName', label: 'App Name', placeholder: 'Enter app name' },
                                { name: 'description', label: 'Description  (optional)', placeholder: 'Enter app description (optional)' },
                                { name: 'githubLink', label: 'GitHub Link (optional)', placeholder: 'https://github.com/user/repo' }
                            ];
                        case 'semoss.authorize':
                            return [
                                { name: 'alias', label: 'Instance Alias', placeholder: 'e.g., Production, Development' },
                                { name: 'url', label: 'Semoss Instance URL', placeholder: 'Enter only the part before /semoss' },
                                { name: 'accessKey', label: 'Access Key', placeholder: 'Your access key' },
                                { name: 'privateKey', label: 'Private Key', placeholder: 'Your private key' }
                            ];
                        default:
                            return [];
                    }
                }

                function showLoading(show) {
                    const existingLoader = document.getElementById('loader');
                    if (show && !existingLoader) {
                        const loader = document.createElement('div');
                        loader.id = 'loader';
                        loader.innerHTML = '<div class="spinner"></div><div class="loader-text">Processing...</div>';
                        optionsArea.style.opacity = '0.5';
                        document.body.appendChild(loader);
                    } else if (!show && existingLoader) {
                        existingLoader.remove();
                        optionsArea.style.opacity = '1';
                    }
                }                async function showInputDialog(inputs) {
                    const dialog = document.createElement('div');
                    dialog.className = 'input-dialog';
                    dialog.innerHTML = '<div class="dialog-content"><h3>Required Information</h3><form id="inputForm">' +
                        inputs.map(input => '<div class="input-group">' +
                            '<label for="' + input.name + '">' + input.label + ':</label>' +
                            '<input type="' + (input.name.toLowerCase().includes('key') ? 'password' : 'text') + '" ' +
                            'id="' + input.name + '" ' +
                            'placeholder="' + input.placeholder + '"' +
                            (input.name !== 'description' && input.name !== 'githubLink' ? ' required' : '') + '>' +
                            '</div>'
                        ).join('') +
                        '<div class="dialog-buttons">' +
                        '<button type="submit" class="submit-btn">Submit</button>' +
                        '<button type="button" class="cancel-btn">Cancel</button>' +
                        '</div></form></div>';

                    document.body.appendChild(dialog);

                    return new Promise((resolve) => {
                        const form = dialog.querySelector('#inputForm');
                        const cancelBtn = dialog.querySelector('.cancel-btn');

                        form.onsubmit = (e) => {
                            e.preventDefault();
                            const formData = {};
                            inputs.forEach(input => {
                                formData[input.name] = form.querySelector('#' + input.name).value;
                            });
                            dialog.remove();
                            resolve(formData);
                        };

                        cancelBtn.onclick = () => {
                            dialog.remove();
                            resolve(null);
                        };
                    });
                }

                function showRemoveInstanceConfirmation(alias) {
                    optionsArea.innerHTML = '';
                    appendMessage('Are you sure you want to remove "' + alias + '"?', 'bot');
                    const yesBtn = document.createElement('button');
                    yesBtn.className = 'option-btn';
                    yesBtn.textContent = 'Yes';
                    yesBtn.onclick = () => {
                        showLoading(true);
                        vscode.postMessage({ type: 'removeInstanceByAlias', alias });
                    };                    
                    const noBtn = document.createElement('button');
                    noBtn.className = 'option-btn';
                    noBtn.textContent = 'No';                    
                    noBtn.onclick = () => {
                        appendMessage('Cancelled removal of instance "' + alias + '".', 'bot');
                        showOptions();
                    };
                    optionsArea.appendChild(yesBtn);
                    optionsArea.appendChild(noBtn);
                }

                if (startBtn) {
                    startBtn.onclick = showOptions;
                }
            </script>
        </body>
        </html>
    `;
}

export function handleChatbotAction(action, options, context) {
    // Need to implementation
    // You can add your logic here to handle chatbot actions
    // console.log('handleChatbotAction called with:', action, options);
}

/**
 * Maps a chat message to a VS Code command string.
 * @param {object} msg - The chat message object
 * @returns {string|null} The command string or null if not recognized
 */
export function mapMessageToCommand(msg) {
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
