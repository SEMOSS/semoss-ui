# Workshop Automation Extension - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐        ┌──────────────┐                   │
│  │   Popup UI   │        │   Settings   │                   │
│  │              │◄──────►│    Page      │                   │
│  │ - Command    │        │              │                   │
│  │ - History    │        │ - Endpoint   │                   │
│  │ - Status     │        │ - App ID     │                   │
│  └──────┬───────┘        └──────────────┘                   │
│         │                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │
          │ Chrome Messages
          │
┌─────────▼─────────────────────────────────────────────────────┐
│                   BACKGROUND SERVICE WORKER                    │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │            Message Router & Orchestrator             │     │
│  │  - Receives commands from UI                        │     │
│  │  - Coordinates between components                   │     │
│  │  - Manages Chrome debugger                          │     │
│  └──────────┬───────────────────────────────┬──────────┘     │
│             │                                 │                │
│  ┌──────────▼──────────┐         ┌──────────▼──────────┐    │
│  │  Action Executor    │         │  Workshop Client    │    │
│  │                     │         │  (Phase 3)          │    │
│  │  - click()         │         │                     │    │
│  │  - setValue()      │         │  - SEMOSS SDK       │    │
│  │  - wait()          │         │  - LLM calls        │    │
│  │  - Debugger API    │         │  - Response parse   │    │
│  └─────────────────────┘         └─────────────────────┘    │
│                                                                │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ Chrome Messages
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                      CONTENT SCRIPT                            │
│                   (Runs in webpage context)                    │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              DOM Extraction System                   │     │
│  │                                                      │     │
│  │  1. Traverse entire DOM tree                        │     │
│  │  2. Identify interactive elements:                  │     │
│  │     - Buttons                                       │     │
│  │     - Input fields                                  │     │
│  │     - Links                                         │     │
│  │     - Clickable elements                            │     │
│  │  3. Check visibility                                │     │
│  │  4. Annotate with IDs                               │     │
│  │  5. Extract coordinates                             │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │            DOM Simplification (Phase 2)              │     │
│  │                                                      │     │
│  │  - Filter non-interactive elements                  │     │
│  │  - Remove hidden elements                           │     │
│  │  - Optimize for LLM tokens                          │     │
│  │  - Template generation                              │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ Accesses
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                    ACTUAL WEB PAGE DOM                         │
│                                                                │
│     <html>                                                     │
│       <button id="123">Click Me</button>                      │
│       <input id="124" type="text" />                          │
│       ...                                                      │
│     </html>                                                    │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow (Current - Phase 1)

```
1. User enters command in Popup UI
   ↓
2. Popup sends message to Content Script
   ↓
3. Content Script extracts & annotates DOM
   ↓
4. Returns annotated HTML to Popup
   ↓
5. Popup displays "DOM extracted" in history
```

---

## 🔄 Data Flow (Future - Phase 3+)

```
1. User enters command: "Search for automation tools"
   ↓
2. Content Script extracts simplified DOM
   ↓
3. Background Worker sends to Workshop LLM:
   - Command: "Search for automation tools"
   - Simplified DOM with element IDs
   ↓
4. Workshop LLM responds:
   <Thought>I should click the search box</Thought>
   <Action>click(42)</Action>
   ↓
5. Background Worker parses action
   ↓
6. Background executes via Chrome Debugger:
   - Finds element #42
   - Gets coordinates
   - Dispatches click event
   ↓
7. Page updates, content script extracts new DOM
   ↓
8. Repeat until LLM returns <Action>done()</Action>
```

---

## 📦 Component Details

### 1. Popup UI (`src/popup/`)
**Purpose:** User interaction interface
**Tech:** React, TypeScript, CSS
**Features:**
- Command input textarea
- Run button with loading state
- Action history display
- Settings access button

**Messages Sent:**
- `GET_ANNOTATED_DOM` → Content Script

**Messages Received:**
- None (receives responses directly)

---

### 2. Content Script (`src/content/index.ts`)
**Purpose:** DOM extraction and manipulation
**Tech:** TypeScript, DOM API
**Runs:** In webpage context
**Features:**
- Traverses entire DOM tree
- Identifies interactive elements
- Checks visibility using getComputedStyle
- Assigns unique IDs to elements
- Provides element coordinates
- Can highlight elements

**Messages Received:**
- `GET_ANNOTATED_DOM` → Returns full annotated HTML
- `GET_ELEMENT_COORDINATES` → Returns {x, y}
- `HIGHLIGHT_ELEMENT` → Visual feedback

**Key Functions:**
```typescript
getAnnotatedDOM() → string (HTML with data attributes)
isInteractive(element) → boolean
isVisible(element) → boolean
getElementCoordinates(id) → {x, y}
```

---

### 3. Background Service Worker (`src/background/index.ts`)
**Purpose:** Action execution and coordination
**Tech:** TypeScript, Chrome APIs
**Runs:** In extension context
**Features:**
- Manages Chrome debugger
- Executes actions on pages
- Routes messages between components
- Handles async operations

**Messages Received:**
- `GET_CURRENT_TAB` → Returns active tab ID
- `ATTACH_DEBUGGER` → Attaches to tab
- `DETACH_DEBUGGER` → Detaches from tab
- `EXECUTE_ACTION` → Performs click/setValue/wait

**Key Functions:**
```typescript
attachDebugger(tabId) → void
sendDebuggerCommand(method, params) → any
clickElement(elementId) → void
setElementValue(elementId, value) → void
```

---

### 4. Settings Page (`src/options/index.html`)
**Purpose:** Configuration management
**Tech:** HTML, JavaScript, Chrome Storage
**Features:**
- Workshop endpoint input
- App ID input
- User ID input
- Python file name
- Save/load from chrome.storage.local
- Connection test (placeholder)

**Storage Keys:**
- `workshop_endpoint`
- `workshop_module`
- `workshop_app_id`
- `workshop_user_id`
- `python_file_name`

---

## 🔌 Chrome APIs Used

### Storage API
```typescript
chrome.storage.local.get([keys])
chrome.storage.local.set({data})
```
**Purpose:** Persist settings

### Tabs API
```typescript
chrome.tabs.query({active: true})
chrome.tabs.sendMessage(tabId, message)
```
**Purpose:** Get active tab, send messages to content scripts

### Debugger API
```typescript
chrome.debugger.attach({tabId}, version)
chrome.debugger.sendCommand({tabId}, method, params)
chrome.debugger.detach({tabId})
```
**Purpose:** Execute actions on page (click, type, etc.)

### Runtime API
```typescript
chrome.runtime.onMessage.addListener()
chrome.runtime.openOptionsPage()
```
**Purpose:** Message passing, open settings

---

## 🗂️ File Organization

```
src/
├── background/
│   └── index.ts              ← Service worker entry
├── content/
│   └── index.ts              ← Content script entry
├── popup/
│   ├── index.tsx             ← Popup entry
│   ├── PopupApp.tsx          ← Main UI component
│   ├── index.html            ← HTML template
│   └── popup.css             ← Styles
├── panel/
│   ├── index.tsx             ← DevTools panel (same as popup)
│   └── index.html            ← Panel template
├── devtools/
│   └── index.html            ← DevTools integration
├── options/
│   └── index.html            ← Settings page (vanilla JS)
├── assets/
│   └── *.png                 ← Icons (to be added)
├── constants.ts              ← Shared constants
├── types.ts                  ← TypeScript interfaces
├── globals.d.ts              ← Global type declarations
└── manifest.json             ← Extension configuration
```

---

## 🔐 Security Model

### Permissions Explained

| Permission | Why Needed |
|------------|-----------|
| `tabs` | Access tab information, query active tab |
| `activeTab` | Send messages to content scripts |
| `storage` | Save settings persistently |
| `debugger` | Execute actions on page via Chrome Debugger API |
| `scripting` | Inject content scripts (future) |

### Host Permissions
- `<all_urls>` - Content script needs to run on all websites

### Security Features
- Settings stored in Chrome's secure storage
- No external requests (except Workshop API in Phase 3)
- User must approve debugger attachment per tab
- All processing happens locally

---

## 🎯 State Management

### Current Approach
- **Chrome Storage:** Settings persistence
- **React State:** UI state (popup)
- **Content Script State:** Annotated elements array

### Future (Phase 6)
- **Zustand or Redux:** Global state management
- **Action History:** Track all actions
- **Task Queue:** Manage multiple tasks
- **Error State:** Handle failures gracefully

---

## 🔧 Build Process

```
Source Files (TypeScript/React)
         ↓
   Webpack + Babel
         ↓
  Transpile & Bundle
         ↓
    Build folder
         ↓
  ├── popup.bundle.js
  ├── content.bundle.js
  ├── background.bundle.js
  ├── panel.bundle.js
  ├── manifest.json
  ├── *.html files
  └── assets/
```

---

## 📊 Performance Considerations

### DOM Extraction
- **Current:** Clones entire DOM (~large)
- **Phase 2:** Will filter to interactive elements only
- **Goal:** Reduce token count for LLM

### Action Execution
- **Delay:** 1000ms between actions
- **Reason:** Give page time to update
- **Future:** Configurable delays

### Message Passing
- **Async:** All Chrome API calls are async
- **Promise-based:** Clean error handling
- **Timeout:** None yet (add in Phase 4)

---

## 🧪 Testing Strategy (Future)

### Unit Tests
- DOM extraction logic
- Action parsers
- Message handlers

### Integration Tests
- Full automation flow
- Workshop API integration
- Error scenarios

### Manual Testing
- Load extension
- Test on various websites
- Verify action execution

---

## 🚀 Deployment Path

### Phase 1 (COMPLETE) ✅
- Project structure
- Basic functionality
- DOM extraction

### Phase 2 (NEXT)
- DOM simplification
- Token optimization
- Template generation

### Phase 3
- Workshop integration
- SEMOSS SDK setup
- Python backend
- LLM calls

### Phase 4
- Enhanced actions
- Error handling
- Navigation support

### Phase 5
- UI improvements
- Better feedback
- History management

### Phase 6
- Complete automation loop
- Multi-step tasks
- Task scheduling (maybe)

---

## 📈 Success Metrics

### Phase 1
✅ Extension loads without errors
✅ DOM extraction works
✅ Settings can be saved
✅ UI is responsive

### Phase 3 (Goal)
- Successfully parse LLM responses
- Execute actions accurately
- Complete simple tasks end-to-end

### Final Goal
- Automate complex multi-step tasks
- Handle errors gracefully
- Work across different websites
- User-friendly experience

---

This architecture is designed to be modular and extensible, allowing easy addition of new features in subsequent phases!
