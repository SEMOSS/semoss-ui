# 🚀 Quick Start Guide - Workshop Automation Extension

## ⚡ Get Started in 5 Minutes

### Step 1: Install Dependencies (2 min)
```powershell
cd "c:\Users\asahukar\Desktop\Taxy AI\my_task"
npm install
```

### Step 2: Build Extension (1 min)
```powershell
npm run build
```

### Step 3: Load in Chrome (1 min)
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `build` folder

### Step 4: Configure (1 min)
1. Click extension icon (or press `Ctrl+Shift+W`)
2. Click ⚙️ Settings
3. Enter your Workshop credentials:
   - **Endpoint:** `https://workshop.cfg.deloitte.com/cfg-ai-demo`
   - **Module:** `/Monolith`
   - **App ID:** Your Workshop app ID
4. Click **Save Settings**

### Step 5: Test! (30 sec)
1. Go to any webpage
2. Click extension icon
3. Type: "test command"
4. Click **Run Command**
5. See DOM extraction in action history! ✅

---

## 🎯 What Works Right Now

✅ Extension loads in Chrome
✅ Settings can be saved
✅ Content script runs on pages
✅ DOM extraction and annotation
✅ Interactive elements detected
✅ Action history display

## 🔜 Coming Soon (Phase 2 & 3)

⏳ DOM simplification & optimization
⏳ Workshop LLM integration
⏳ Actual action execution
⏳ Complete automation loop

---

## 🛠️ Useful Commands

| Command | What it does |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build extension for production |
| `npm run dev` | Build + watch for changes |
| `.\setup.ps1` | Automated setup script |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/manifest.json` | Extension configuration |
| `src/popup/PopupApp.tsx` | Main UI |
| `src/content/index.ts` | DOM extraction |
| `src/background/index.ts` | Action execution |
| `src/options/index.html` | Settings page |
| `SETUP.md` | Detailed setup guide |
| `README.md` | Full documentation |

---

## 🐛 Troubleshooting

### Build fails?
```powershell
rm -r node_modules
npm install
npm run build
```

### Extension won't load?
- Check that `build` folder exists
- Look for errors in `chrome://extensions/`

### Settings not saving?
- Right-click extension icon → "Inspect popup"
- Check Console for errors

---

## 🎓 Next Steps

1. **Test DOM Extraction:**
   - Visit different websites
   - See what elements are detected

2. **Prepare for Phase 2:**
   - Review `PHASE1_SUMMARY.md`
   - Understand DOM simplification needs

3. **Get Ready for Workshop:**
   - Have your Workshop credentials ready
   - Review call center integration patterns

---

## 📞 Need Help?

📖 **Full Setup Guide:** `SETUP.md`
📖 **Complete Docs:** `README.md`
📖 **Phase Summary:** `PHASE1_SUMMARY.md`

---

## ✨ Phase 1 Status: COMPLETE ✅

Your extension foundation is ready!
Next: Phase 2 - DOM Simplification
