# Building Windows .exe Installer for GhostMoney

This guide explains how to build a Windows installer (.exe) for the GhostMoney application.

## Prerequisites

1. **Node.js and npm** - Already installed (you're using them)
2. **Windows Build Tools** (if building on Windows):
   - Visual Studio Build Tools or Visual Studio Community
   - Windows SDK
   
   **Note:** If you're building on macOS/Linux, you can still create Windows installers using electron-builder, but you'll need Wine installed for NSIS.

3. **Icon File** (Optional but recommended):
   - Create or obtain an `icon.ico` file
   - Place it in the `build/` directory
   - See `build/README.md` for icon creation instructions

## Quick Start

### Building the Windows Installer

Run this command to build the Windows installer:

```bash
npm run build:win
```

This command will:
1. Build the Vite React application (`npm run build`)
2. Package it with Electron using electron-builder
3. Create a Windows NSIS installer in `dist-electron/`

### Output Location

After building, you'll find:
- **Installer**: `dist-electron/GhostMoney Setup 1.0.0.exe`
- **Unpacked app**: `dist-electron/win-unpacked/` (for testing)

## Build Configuration Details

### What Was Configured

1. **Build Script** (`build:win`):
   - First builds the Vite app to `dist/`
   - Then runs electron-builder with Windows x64 target

2. **Electron Builder Config** (in `package.json`):
   - **App ID**: `com.ghostmoney.app`
   - **Product Name**: `GhostMoney`
   - **Output Directory**: `dist-electron`
   - **Windows Target**: NSIS installer (x64 architecture)

3. **NSIS Installer Options**:
   - **Two-step installer** (not one-click) - allows users to choose installation directory
   - **Desktop shortcut** - creates shortcut on desktop
   - **Start menu shortcut** - adds to Windows Start menu
   - **Customizable installation** - users can change install location
   - **Data preservation** - user data is NOT deleted on uninstall

## Building on Different Platforms

### On Windows:
```bash
npm run build:win
```

### On macOS/Linux (Cross-compilation):
You need Wine installed for NSIS:
```bash
# macOS
brew install wine-stable

# Linux (Ubuntu/Debian)
sudo apt-get install wine

# Then build
npm run build:win
```

**Note:** Cross-compilation may have limitations. For best results, build on Windows.

## Customization

### Changing Installer Options

Edit the `build.nsis` section in `package.json`:

```json
"nsis": {
  "oneClick": false,  // Set to true for one-click installer
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "GhostMoney",
  "deleteAppDataOnUninstall": false  // Set to true to delete data on uninstall
}
```

### Adding an Icon

1. Create or obtain an `icon.ico` file
2. Place it in `build/icon.ico`
3. The icon will automatically be used for:
   - Application icon
   - Installer icon
   - Desktop shortcut
   - Start menu entry

### Building for Other Architectures

To build for 32-bit Windows or ARM, modify the `build:win` script:

```json
"build:win32": "npm run build && electron-builder --win --ia32",
"build:win-arm": "npm run build && electron-builder --win --arm64"
```

## Troubleshooting

### Error: "better-sqlite3 native module build failure"

This is the most common issue when building Windows installers from macOS/Linux. See `TROUBLESHOOTING.md` for detailed solutions.

**Quick fixes:**
1. **Best solution**: Build on a Windows machine
2. **Network issue**: Retry the build, check internet connection
3. **Version mismatch**: Try `npm install better-sqlite3@9.2.2 --save-exact`

### Error: "icon.ico not found"
- Create an `icon.ico` file in the `build/` directory
- Or remove the icon references from `package.json` (electron-builder will use default)

### Error: "NSIS not found" (on macOS/Linux)
- Install Wine: `brew install wine-stable` (macOS) or `sudo apt-get install wine` (Linux)
- Or build on a Windows machine

### Build Fails with Native Module Errors
- See `TROUBLESHOOTING.md` for detailed solutions
- Most reliable: Build on Windows
- Cross-compilation from macOS/Linux can be problematic

### Large Installer Size
- This is normal for Electron apps (includes Chromium)
- Consider using electron-builder's compression options
- Typical size: 100-200MB

## Testing the Installer

1. Build the installer: `npm run build:win`
2. Navigate to `dist-electron/`
3. Run `GhostMoney Setup 1.0.0.exe`
4. Follow the installation wizard
5. Test the installed application

## Distribution

The generated installer (`GhostMoney Setup 1.0.0.exe`) can be:
- Distributed directly to users
- Uploaded to your website
- Shared via file sharing services
- Included in software distribution platforms

## Additional Resources

- [electron-builder Documentation](https://www.electron.build/)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- Icon creation: See `build/README.md`

