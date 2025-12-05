# WrapviewSvgEditor.js Updates

## Summary of Changes

The `WrapviewSvgEditor.js` file has been updated with the following enhancements:

### 1. **New Configuration System**
- Replaced `_index3Config` with `_config` for cleaner property names
- Updated configuration to support dynamic font size and intensity controls
- Added color palette support (35 predefined colors)

### 2. **Enhanced Helper Methods**
Added new helper methods for cleaner code organization:
- `_isOutlineEnabled()` - Check if outline is enabled
- `_getStrokeWidth()` - Get current outline width
- `_getFontSize()` - Get current font size
- `_getCharSpacing()` - Calculate character spacing based on outline
- `_getFillColor()` - Get current text fill color
- `_getBaseTextOptions()` - Get base text styling options

### 3. **New Text Effects**
Added the "Pinch" effect in addition to existing effects:
- **Pinch** - Opposite of Bulge; center text is smaller, edges are larger

### 4. **Improved Font Size Control**
- Changed from increment/decrement buttons to direct input field
- Users can now type any font size between 8 and 200
- Real-time updates reflect in the rendered text

### 5. **Enhanced Outline Control**
- Replaced checkboxes with a toggle button (`outlineToggle`)
- Better visual feedback with active/inactive states
- Cleaner UI interaction

### 6. **Hidden Canvas View**
- The Fabric.js canvas is now hidden with `display:none`
- Text updates directly reflect on the mesh in main.js via the `_onChange` callback
- No visual canvas displayed to the user

### 7. **Improved UI Components**
Updated HTML markup with:
- New font size input field (numeric)
- Redesigned outline toggle button
- Intensity slider remains for effect intensity control
- 9 effect buttons (including new Pinch effect)
- Better spacing and organization

### 8. **Better Event Handling**
- Simplified event listener setup
- Updated to work with new HTML structure
- Proper null-checking for optional DOM elements
- Optimized render function calls

## Key Features

✅ **Direct Mesh Texture Update** - Text changes immediately reflect on the 3D mesh  
✅ **9 Text Effects** - None, Arch, Bridge, Valley, Bulge, Flag, Distort, Circle, Pinch  
✅ **Font Size Range** - 8px to 200px with direct input  
✅ **Outline Styling** - Customizable width, color, and toggle control  
✅ **Intensity Control** - Slider for effect intensity (0.2 to 2.5)  
✅ **Font Selection** - 5 font families available  
✅ **Color Support** - 35 predefined colors plus custom color picker  
✅ **Hidden Canvas** - Fabric.js canvas not displayed to user  

## Integration with main.js

The editor works seamlessly with `main.js`:
- The `setOnChange()` callback notifies main.js of any text changes
- `getDataURL()` returns the canvas as a PNG data URL
- Text updates trigger immediate mesh texture updates on the 3D object
- No visual canvas wrapper is shown to the user

## Usage Example

```javascript
const svgEditor = wrapviewInstance.svgEditor();
svgEditor.setOnChange((dataUrl) => {
    // dataUrl contains the rendered text as PNG
    // Update 3D mesh texture with this data
});
```

## Browser Compatibility

- Requires Fabric.js 5.3.0 (loaded from CDN)
- Modern browsers with Canvas support
- Works with ES6 modules
