# Build Assets

## Icon Requirements

To create a Windows installer, you need an `icon.ico` file in this directory.

### Creating an icon.ico file:

1. **Option 1: Online Converter**
   - Create or find a PNG image (256x256 or 512x512 recommended)
   - Use an online converter like https://convertio.co/png-ico/ or https://www.icoconverter.com/
   - Save as `icon.ico` in this directory

2. **Option 2: Using ImageMagick** (if installed)
   ```bash
   convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
   ```

3. **Option 3: Using a Design Tool**
   - Use tools like GIMP, Photoshop, or online icon generators
   - Export as .ico format with multiple sizes (16x16, 32x32, 48x48, 256x256)

### Icon Specifications:
- Format: .ico
- Recommended sizes: 16x16, 32x32, 48x48, 256x256
- The icon will be used for:
  - Application icon
  - Installer icon
  - Desktop shortcut icon
  - Start menu icon

**Note:** If you don't have an icon.ico file, electron-builder will use a default icon, but it's recommended to provide your own branded icon.

