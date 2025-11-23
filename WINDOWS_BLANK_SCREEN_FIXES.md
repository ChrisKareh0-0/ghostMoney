# Windows Blank Screen Fixes Applied

This document summarizes all the fixes applied to resolve the blank screen issue when running the built Windows installer.

## Problem

When building the app on Windows and running the installer, the application window opens but shows a blank screen with no content.

## Root Causes Identified

1. **Missing Dependencies** - `node_modules` was not included in the packaged installer
2. **No Error Visibility** - DevTools were disabled in production, making debugging impossible
3. **No Error Logging** - Failed loads and errors were not being logged

## Fixes Applied

### 1. Include Production Dependencies ✅

**File**: `package.json`

**Change**: Added `node_modules/**/*` to the `files` array in the electron-builder configuration.

```json
"files": [
  "dist/**/*",
  "electron/**/*",
  "node_modules/**/*",  // ← ADDED THIS
  "package.json",
  "!electron/**/*.map",
  "!**/*.md"
]
```

**Why**: Without this, critical runtime dependencies like `better-sqlite3`, `googleapis`, `exceljs`, `pdfkit`, etc. were not being packaged in the installer. The app would crash silently when trying to load these modules.

**Impact**: All production dependencies from `package.json` will now be included in the installer.

---

### 2. Enable DevTools in Production (Debugging) ✅

**File**: `electron/main.js`

**Change**: Added `mainWindow.webContents.openDevTools()` in the production branch.

```javascript
} else {
    // Production mode
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
    
    // Open DevTools in production for debugging
    mainWindow.webContents.openDevTools();  // ← ADDED THIS
}
```

**Why**: This allows you to see console errors, network issues, and JavaScript errors when running the built app on Windows.

**Note**: Remove this line once the issue is resolved for a cleaner production experience.

---

### 3. Add Comprehensive Error Logging ✅

**File**: `electron/main.js`

**Changes**: Added multiple logging mechanisms:

#### a) Path Logging
```javascript
console.log('Production mode - Loading from:', indexPath);
console.log('__dirname:', __dirname);
console.log('app.isPackaged:', app.isPackaged);
console.log('process.resourcesPath:', process.resourcesPath);
```

**Why**: Helps verify that the app is looking in the correct location for files.

#### b) Load Error Handling
```javascript
mainWindow.loadFile(indexPath).catch(err => {
    console.error('Failed to load file:', err);
    console.error('Attempted path:', indexPath);
});
```

**Why**: Catches and logs any errors when trying to load the HTML file.

#### c) Page Load Failure Detection
```javascript
mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
});
```

**Why**: Detects if the page fails to load and provides error codes.

#### d) Success Confirmation
```javascript
mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
});
```

**Why**: Confirms when the page loads successfully.

#### e) Renderer Console Forwarding
```javascript
mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Renderer console [${level}]:`, message);
});
```

**Why**: Forwards all console messages from the React app to the main process console for debugging.

---

## How to Test the Fixes

1. **Rebuild the Windows installer**:
   ```bash
   npm run build:win
   ```

2. **Install on Windows**:
   - Navigate to `dist-electron/`
   - Run `GhostMoney Setup 1.0.0.exe`
   - Install the application

3. **Run from Command Line** (to see console output):
   ```cmd
   "C:\Program Files\GhostMoney\GhostMoney.exe"
   ```

4. **Check the logs**:
   - Look for path information
   - Check for any error messages
   - Verify "Page loaded successfully" appears

5. **Use DevTools**:
   - DevTools will now open automatically
   - Check the Console tab for errors
   - Check the Network tab for failed resource loads
   - Check the Sources tab to verify files are present

---

## Expected Results

After these fixes:
- ✅ All dependencies will be included in the installer
- ✅ DevTools will open automatically for debugging
- ✅ Console will show detailed path and loading information
- ✅ Any errors will be visible and logged
- ✅ The app should display correctly

---

## If Still Showing Blank Screen

If the app still shows a blank screen after these fixes, check:

1. **DevTools Console** - Look for JavaScript errors
2. **DevTools Network Tab** - Check for 404 errors on resources
3. **Console Output** - Check the terminal/command prompt for error messages
4. **File Paths** - Verify the logged paths point to existing files

Common remaining issues:
- **CORS/CSP errors** - Check browser console
- **Missing dist files** - Verify `npm run build` completed successfully
- **Path resolution issues** - Check logged paths match actual file locations
- **Database initialization errors** - Check if `better-sqlite3` loads correctly

---

## Cleanup After Debugging

Once the issue is resolved, you can remove the debugging code:

1. **Remove DevTools in production**:
   ```javascript
   // Remove this line from electron/main.js
   mainWindow.webContents.openDevTools();
   ```

2. **Optional**: Keep or remove the console logging based on preference

---

## Summary

**Total Fixes Applied**: 3 major changes
1. ✅ Added `node_modules/**/*` to package files
2. ✅ Enabled DevTools in production
3. ✅ Added comprehensive error logging

These changes ensure:
- All dependencies are packaged
- Errors are visible and logged
- Debugging is possible in production builds
