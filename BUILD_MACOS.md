# Building macOS .dmg Installer for GhostMoney

This guide explains how to build a macOS .dmg installer for the GhostMoney application.

## Quick Start

### Build the .dmg Installer

Run this command to build the macOS installer:

```bash
npm run build:mac
```

This will create a **universal binary** that works on both:
- **Intel Macs** (x64)
- **Apple Silicon Macs** (arm64/M1/M2/M3)

### Output Location

After building, you'll find:
- **DMG Installer**: `dist-electron/GhostMoney-1.0.0-universal.dmg`
- **Unpacked app**: `dist-electron/mac-universal/GhostMoney.app` (for testing)

## What Was Configured

### 1. Build Script
Added `build:mac` script that:
- Builds the Vite React app
- Packages it with Electron
- Creates a universal .dmg for both Intel and Apple Silicon

### 2. macOS Configuration
```json
"mac": {
  "target": "dmg",
  "arch": ["x64", "arm64"],
  "category": "public.app-category.business",
  "hardenedRuntime": true
}
```

### 3. DMG Configuration
The installer will have:
- Custom title: "GhostMoney 1.0.0"
- Drag-and-drop installation UI
- Application icon on the left
- Applications folder shortcut on the right
- Custom window size (540x380)

### 4. Entitlements
Created `build/entitlements.mac.plist` with necessary permissions for:
- JIT compilation (required for V8/Chromium)
- Native modules (better-sqlite3)
- Unsigned executable memory
- Library validation bypass

## Files Included

The .dmg will contain:
- ✅ Built React app (`dist/`)
- ✅ Electron main process files (`electron/`)
- ✅ All production dependencies (`node_modules/`)
- ✅ better-sqlite3 (unpacked for native module access)

## Installation Process

When users open the .dmg:
1. A window opens showing the GhostMoney app icon
2. User drags the app to the Applications folder
3. App is installed and ready to use

## Testing the Build

### 1. Build the installer
```bash
npm run build:mac
```

### 2. Test the unpacked app first
```bash
open dist-electron/mac-universal/GhostMoney.app
```

### 3. Test the .dmg installer
```bash
open dist-electron/GhostMoney-1.0.0-universal.dmg
```

### 4. Install and run
- Drag to Applications
- Open from Applications folder or Launchpad

## Code Signing (Optional)

For distribution outside the App Store, you should sign your app:

### Prerequisites
- Apple Developer account ($99/year)
- Developer ID certificate installed in Keychain

### Add to package.json
```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

### Build with signing
```bash
npm run build:mac
```

The app will be automatically signed if you have the certificate.

## Notarization (Optional)

For macOS 10.15+ (Catalina and later), apps should be notarized:

### Prerequisites
- Apple Developer account
- App-specific password for notarization

### Environment variables
```bash
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### Build with notarization
```bash
npm run build:mac
```

electron-builder will automatically notarize if credentials are set.

## Customization

### Change App Icon

1. Create an `icon.icns` file (macOS icon format)
2. Place it in `build/icon.icns`
3. The icon will be used for:
   - Application icon
   - DMG icon
   - Dock icon

**Creating .icns from .png:**
```bash
# Create iconset directory
mkdir icon.iconset

# Add various sizes (you'll need to create these)
cp icon_16x16.png icon.iconset/icon_16x16.png
cp icon_32x32.png icon.iconset/icon_16x16@2x.png
cp icon_32x32.png icon.iconset/icon_32x32.png
cp icon_64x64.png icon.iconset/icon_32x32@2x.png
cp icon_128x128.png icon.iconset/icon_128x128.png
cp icon_256x256.png icon.iconset/icon_128x128@2x.png
cp icon_256x256.png icon.iconset/icon_256x256.png
cp icon_512x512.png icon.iconset/icon_256x256@2x.png
cp icon_512x512.png icon.iconset/icon_512x512.png
cp icon_1024x1024.png icon.iconset/icon_512x512@2x.png

# Convert to .icns
iconutil -c icns icon.iconset -o build/icon.icns
```

### Customize DMG Background

1. Create a background image (540x380 recommended)
2. Save as `build/background.png`
3. The DMG will use this as the background

### Change DMG Window Layout

Edit the `dmg.contents` in `package.json`:
```json
"contents": [
  {
    "x": 130,
    "y": 220  // App icon position
  },
  {
    "x": 410,
    "y": 220,  // Applications folder position
    "type": "link",
    "path": "/Applications"
  }
]
```

## Architecture Options

### Universal Binary (Default - Recommended)
```bash
npm run build:mac
```
Creates one .dmg that works on both Intel and Apple Silicon.

### Intel Only
```bash
npm run build && electron-builder --mac --x64
```

### Apple Silicon Only
```bash
npm run build && electron-builder --mac --arm64
```

## Troubleshooting

### Error: "better-sqlite3 native module build failure"
- Make sure you're building on macOS
- Run: `npm install` to ensure native modules are built correctly
- The universal build will compile for both architectures

### Error: "entitlements.mac.plist not found"
- The file should be at `build/entitlements.mac.plist`
- It was created automatically, but verify it exists

### Error: "icon.icns not found"
- This is optional - electron-builder will use a default icon
- To add a custom icon, create `build/icon.icns`

### App won't open: "damaged or incomplete"
- This happens with unsigned apps on newer macOS
- Users can right-click → Open to bypass
- Or sign the app with a Developer ID certificate

### Large installer size
- This is normal for Electron apps (includes Chromium)
- Universal builds are larger (contains both Intel and ARM binaries)
- Typical size: 150-250MB

## Distribution

The generated .dmg can be:
- Distributed directly to users
- Uploaded to your website
- Shared via file sharing services
- Submitted to the Mac App Store (requires additional setup)

## App Store Distribution

For Mac App Store distribution:
1. Use `mas` target instead of `dmg`
2. Add App Store entitlements
3. Use App Store provisioning profile
4. Submit via App Store Connect

See [electron-builder Mac App Store docs](https://www.electron.build/configuration/mas) for details.

## Additional Resources

- [electron-builder macOS Documentation](https://www.electron.build/configuration/mac)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

## Summary

**Quick command**: `npm run build:mac`

**Output**: `dist-electron/GhostMoney-1.0.0-universal.dmg`

**Works on**: Intel Macs + Apple Silicon Macs

**Ready to distribute**: Yes (unsigned - users may need to right-click → Open)
