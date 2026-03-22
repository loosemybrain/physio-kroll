# Button Preset Dropdown Investigation

## Summary
I've investigated the button preset dropdown issue in the admin inspector. The code implementation appears to be correct.

## What I Found

### ✅ Code Implementation is Correct
1. **Button Presets Defined**: The `BUTTON_PRESETS` array is properly defined in `src/lib/buttonPresets.ts` with 4 presets:
   - Primary Lift Fade Up
   - Outline Sweep Slide Left
   - Ghost Soft Fade
   - Pill Scale In

2. **Import is Correct**: PageEditor.tsx correctly imports `BUTTON_PRESETS` from `@/lib/buttonPresets`

3. **Rendering Logic is in Place**: The dropdown should appear for blocks of type:
   - `card`
   - `section`
   - `imageText`
   - `cta`

## What I Added

### Debug Console Logging
I've added console.log debugging to the PageEditor component (around line 3565) that will output:
- The current block type
- Whether the button preset section should be visible
- How many presets are available
- The current preset value

## How to Diagnose the Issue

### Step 1: Check the Browser Console
1. Open http://localhost:3001 in your browser
2. Navigate to the admin page
3. Select or create a block of type `card`, `section`, `imageText`, or `cta`
4. Open the browser DevTools console (F12)
5. Look for console messages starting with `[Button Preset Debug]`

### Step 2: What to Look For

The console log will show something like:
```javascript
[Button Preset Debug] {
  blockType: "card",        // Should be card, section, imageText, or cta
  showButtonPreset: true,   // Should be true for those block types
  presetsCount: 4,          // Should be 4
  currentPreset: undefined  // The currently selected preset (if any)
}
```

### Step 3: Possible Issues

**If `showButtonPreset` is `false`:**
- The selected block is not one of the supported types
- You might be selecting the wrong element

**If `presetsCount` is `0` or undefined:**
- There's an import issue with `BUTTON_PRESETS`
- This would indicate a build or module resolution problem

**If the log doesn't appear at all:**
- The inspector panel might not be rendering
- There could be a JavaScript error preventing the component from mounting

## Next Steps

1. **Check the console output** - Share what you see in the browser console
2. **Verify block type** - Make sure you're selecting a card, section, imageText, or cta block
3. **Check for errors** - Look for any red error messages in the console

## Expected Behavior

When working correctly:
- Select a card/section/imageText/cta block
- The inspector panel on the right should show a "Button Preset" dropdown
- The dropdown should have 5 options: "Kein Preset" + 4 preset options
- Selecting a preset should update the block's `buttonPreset` property

## File Changes Made

- `src/components/admin/PageEditor.tsx` - Added debug logging to button preset section

## If Still Not Working

If the console shows `showButtonPreset: true` but the dropdown isn't visible:
- There might be a CSS issue hiding it
- The parent container might have overflow hidden
- Another component might be rendering over it
