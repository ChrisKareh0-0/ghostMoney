# Windows Troubleshooting Guide - Blank Screen & Uninstall Issues

## Current Issues

1. **Blank screen on Windows** - App opens but shows nothing
2. **No console output** - Can't see error messages
3. **Uninstall error** - Can't remove the application

## What I've Fixed

### Enhanced Error Logging & Diagnostics

I've completely rewritten `electron/main.js` with:

1. **File-based logging** - Creates `debug.log` that persists even if app crashes
2. **Error dialogs** - Shows popup messages with error details
3. **Try-catch blocks** - Wraps all initialization code to catch errors
4. **Detailed path logging** - Shows exactly where files are being loaded from
5. **File existence checks** - Verifies dist folder and files exist

## Next Steps - Rebuild and Test

### 1. Rebuild the Windows Installer

```bash
npm run build:win
```

### 2. Install on Windows

Install the new build on your Windows machine.

### 3. Find the Debug Log

When you run the app, it will create a log file at:

**Windows location**:
```
C:\Users\<YourUsername>\AppData\Roaming\GhostMoney\debug.log
```

To find it quickly:
1. Press `Win + R`
2. Type: `%APPDATA%\GhostMoney`
3. Press Enter
4. Look for `debug.log`

### 4. Check for Error Dialogs

The app will now show error dialog boxes if something fails:
- "Failed to Create Window"
- "Database Error"
- "Failed to Load App"
- "Fatal Error"

These dialogs will tell you exactly what's wrong and where to find the log file.

### 5. Send Me the Log File

Once you run the app on Windows, send me the contents of `debug.log`. It will contain:
- System information
- File paths
- What succeeded
- What failed
- Error stack traces

## Fixing the Uninstall Error

### Option 1: Manual Uninstall

If the uninstaller is failing, manually remove the app:

1. **Close the app** completely (check Task Manager)

2. **Delete the installation folder**:
   ```
   C:\Program Files\GhostMoney
   ```
   or
   ```
   C:\Users\<YourUsername>\AppData\Local\Programs\GhostMoney
   ```

3. **Delete user data** (optional - keeps your database):
   ```
   C:\Users\<YourUsername>\AppData\Roaming\GhostMoney
   ```

4. **Remove from Programs list**:
   - Open Registry Editor (`Win + R`, type `regedit`)
   - Navigate to: `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`
   - Find and delete the GhostMoney entry
   - Also check: `HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`

### Option 2: Use Windows Troubleshooter

1. Open Settings → Apps → Apps & features
2. Find GhostMoney
3. Click "..." → Advanced options
4. Click "Reset" or "Repair"
5. Try uninstalling again

### Option 3: Force Kill Processes

The uninstaller might fail if the app is still running:

1. Open Task Manager (`Ctrl + Shift + Esc`)
2. Look for:
   - `GhostMoney.exe`
   - `electron.exe`
3. End all related processes
4. Try uninstalling again

### Option 4: Safe Mode Uninstall

1. Restart Windows in Safe Mode
2. Try uninstalling from there
3. Processes won't be running, making it easier

## Common Causes of Blank Screen

Based on the enhanced logging, we'll be able to identify:

### 1. Missing dist Folder
**Log will show**: `Dist exists: false`

**Fix**: The build didn't include the dist folder properly. Check `package.json` files array.

### 2. Missing Dependencies
**Log will show**: `Error: Cannot find module 'better-sqlite3'` (or other module)

**Fix**: Dependencies weren't packaged. Verify `node_modules/**/*` is in the files array.

### 3. Database Initialization Failure
**Log will show**: `Database initialization failed: ...`

**Fix**: better-sqlite3 native module issue. May need to rebuild for Windows.

### 4. Path Resolution Issues
**Log will show**: Wrong paths or `File exists: false`

**Fix**: The path to index.html is incorrect in the packaged app.

### 5. Renderer Process Crash
**Log will show**: `Renderer process crashed!`

**Fix**: JavaScript error in the React app. Check renderer console logs.

## What the New Code Does

### 1. Creates Persistent Log File
```javascript
const logPath = path.join(app.getPath('userData'), 'debug.log');
```
All console output is written to this file.

### 2. Shows Error Dialogs
```javascript
dialog.showErrorBox('Error Title', 'Error details...');
```
You'll see popup messages if something fails.

### 3. Checks File Existence
```javascript
console.log('File exists:', fs.existsSync(indexPath));
console.log('Files in dist:', distFiles.join(', '));
```
Verifies files are actually there.

### 4. Wraps Everything in Try-Catch
```javascript
try {
    // Initialization code
} catch (error) {
    console.error('Error:', error);
    // Show error dialog
}
```
Catches errors that would normally crash silently.

### 5. Catches Unhandled Errors
```javascript
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
```
Logs errors that escape try-catch blocks.

## Testing Checklist

After rebuilding and installing:

- [ ] Does an error dialog appear?
- [ ] Does the debug.log file exist?
- [ ] What does the debug.log contain?
- [ ] Does DevTools open?
- [ ] Are there errors in DevTools console?
- [ ] Can you see the window at all?

## Next Actions

1. **Rebuild**: `npm run build:win`
2. **Uninstall old version** (use manual method if needed)
3. **Install new version**
4. **Run the app**
5. **Check for error dialogs**
6. **Find and read debug.log**
7. **Send me the log contents**

With the log file, I'll be able to tell you exactly what's failing and how to fix it!

## Additional Diagnostic Commands

If you can run the app from command line on Windows:

```cmd
cd "C:\Program Files\GhostMoney"
GhostMoney.exe
```

This might show console output directly in the terminal.

Or check Windows Event Viewer:
1. Open Event Viewer
2. Windows Logs → Application
3. Look for GhostMoney or Electron errors
