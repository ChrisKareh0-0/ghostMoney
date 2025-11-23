# Troubleshooting Windows Build Issues

## Issue: better-sqlite3 Native Module Build Failure

If you encounter errors like:
```
⨯ cannot build native dependency  reason=prebuild-install failed with error
```

This happens when cross-compiling from macOS/Linux to Windows because native modules need to be rebuilt for the target platform.

### Solution 1: Build on Windows (Recommended)

The most reliable way to build Windows installers is to build on a Windows machine:

1. Clone your repository on Windows
2. Install Node.js and npm
3. Run: `npm install`
4. Run: `npm run build:win`

### Solution 2: Use GitHub Actions or CI/CD

Set up automated builds using GitHub Actions or similar CI/CD services that can build on Windows.

### Solution 3: Fix Network/Timeout Issues

If the error is due to network timeout downloading prebuilt binaries:

1. **Check your internet connection**
2. **Retry the build** - Sometimes it's just a temporary network issue
3. **Use a VPN or different network** if GitHub releases are blocked
4. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

### Solution 4: Pin better-sqlite3 Version

If the current version doesn't have prebuilt binaries for Electron 28, try pinning to a compatible version:

1. Check which versions have prebuilt binaries for Electron 28:
   ```bash
   npm view better-sqlite3 versions --json
   ```

2. Try an older version that's known to work:
   ```bash
   npm install better-sqlite3@9.2.2 --save-exact
   ```

3. Then rebuild:
   ```bash
   npm run rebuild:win
   npm run build:win
   ```

### Solution 5: Manual Prebuilt Binary Installation

1. Visit: https://github.com/WiseLibs/better-sqlite3/releases
2. Download the prebuilt binary for your Electron version and Windows x64
3. Extract it to `node_modules/better-sqlite3/build/Release/`
4. Then run: `npm run build:win`

### Solution 6: Use Docker (Advanced)

Create a Docker container with Windows build tools to build on macOS/Linux:

```dockerfile
FROM mcr.microsoft.com/windows/servercore:ltsc2019
# Install Node.js, build tools, etc.
```

### Solution 7: Skip Native Rebuild (Not Recommended)

⚠️ **Warning**: This may cause runtime errors if the native module isn't compatible.

If you absolutely must build without rebuilding native modules, you can modify the build script, but this is **not recommended** and may cause the app to fail at runtime.

## Other Common Issues

### Error: "icon.ico not found"
- Create an `icon.ico` file in the `build/` directory
- Or remove icon references from `package.json` (uses default icon)

### Error: "NSIS not found" (on macOS/Linux)
- Install Wine: `brew install wine-stable` (macOS)
- Or build on Windows

### Build succeeds but app crashes on Windows
- Native modules weren't rebuilt correctly
- Try Solution 1 (build on Windows)
- Or check Windows Event Viewer for detailed error messages

## Getting Help

If none of these solutions work:
1. Check the [electron-builder issues](https://github.com/electron-userland/electron-builder/issues)
2. Check the [better-sqlite3 issues](https://github.com/WiseLibs/better-sqlite3/issues)
3. Provide full error logs when asking for help

