# Visual Rule Builder Guide

## Building JSON Logic from Scratch

The Visual Rule Builder allows you to create JSON Logic rules visually using a flowchart interface.

### Getting Started

1. **Add an IF-THEN-ELSE Block** (purple, highlighted at top of palette)
   - This is the main building block for creating conditional logic
   - It represents the JSON Logic `if` statement

2. **Build Your Condition**
   - Add operator nodes (blue): `==`, `!=`, `>`, `<`, `>=`, `<=`, `AND`, `OR`
   - Add data field nodes (green): Variables from your data (e.g., `field.age`)
   - Connect operators to create comparisons

3. **Connect to IF Block**
   - Drag from your condition to the IF block's **left input** (blue handle)
   - This sets what condition to evaluate

4. **Add Results**
   - Add result nodes (purple) for outputs
   - Connect IF block's **THEN output** (top right, green) to the "true" result
   - Connect IF block's **ELSE output** (bottom right, orange) to the "false" result

### Example: Simple Age Check

**Goal:** Return "adult" if age >= 18, otherwise "minor"

**Steps:**
1. Add IF-THEN-ELSE block
2. Add Condition node (`>=`)
3. Add two Data Field nodes:
   - First: `field.age`
   - Second: `18`
4. Connect data fields to condition's left and right inputs
5. Connect condition to IF block input
6. Add two Result nodes:
   - First: `"adult"`
   - Second: `"minor"`
7. Connect IF's THEN output → "adult" result (green edge)
8. Connect IF's ELSE output → "minor" result (orange edge)

**Result JSON:**
```json
{
  "if": [
    { ">=": [{ "var": "field.age" }, 18] },
    "adult",
    "minor"
  ]
}
```

### Edge Colors

- **Green** = True/Then branch (condition evaluates to true)
- **Orange** = False/Else branch (condition evaluates to false)
- **Gray** = Data connections (no conditional meaning)

### Tips

✅ **DO:**
- Start with IF-THEN-ELSE blocks for clear structure
- Use AND/OR nodes to combine multiple conditions
- Double-click any node to edit its value
- Connect conditions before connecting results

❌ **DON'T:**
- Leave IF blocks without connections (incomplete structure warning)
- Connect multiple conditions to same result without using AND/OR
- Forget to add result nodes for both true and false cases

### JSON Updates

- Click "Show JSON" to see the reconstructed JSON Logic
- JSON updates automatically as you add/edit nodes
- Incomplete structures show helpful error messages
- Save your rule when done to persist changes

### Keyboard Shortcuts

- **Backspace/Delete** = Remove selected nodes
- **Scroll** = Zoom in/out
- **Drag canvas** = Pan around
- **Double-click node** = Edit value

### Complex Rules with AND/OR

For multiple conditions:
1. Add AND or OR logic node
2. Connect multiple conditions to the AND/OR node
3. Connect the AND/OR node to IF block input

**Example:** Age between 18 and 65
```
AND node
├─ age >= 18
└─ age <= 65
```

### Troubleshooting

**Issue:** "Show JSON" shows incomplete message
- **Fix:** Ensure all IF blocks have conditions and results connected

**Issue:** Edges have wrong color
- **Fix:** Edges auto-label based on connection. Reconnect if needed.

**Issue:** JSON doesn't update after editing
- **Fix:** Make sure to press Enter or click away to save edits

**Issue:** Can't connect nodes
- **Fix:** Check handle compatibility (outputs to inputs only)
