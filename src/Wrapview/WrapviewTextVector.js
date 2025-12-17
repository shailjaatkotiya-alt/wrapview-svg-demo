import { WrapviewUtils } from "./WrapviewUtils.js";
import { WrapviewSettings } from "./WrapviewSettings.js";
import { WrapviewParameter } from "./WrapviewParameter.js";
import { WrapviewFont } from "./WrapviewFont.js";
import { WrapviewLayer } from "./WrapviewLayer.js";

/**
 * WrapviewTextVector - Text layer that generates vector paths from fonts
 * Converts Google Fonts to SVG paths using maker.js for manipulation
 * Renders as SVG texture for 3D materials
 */
class WrapviewTextVector extends WrapviewLayer {
    constructor(id, settings) {
        super(id, settings);
        this._text = null;
        this._bounds = null;
        this._svgData = null;
        this._canvas = null;
        this._svgCache = {};
        this._fontCache = {};
        this._effect = 'none';
        this._effectParams = {};
        this._effectProcessor = null; // optional custom processor
    }

    name() {
        return 'TextVector';
    }

    /**
     * Default settings for text vector layer
     */
    defaults() {
        return {
            text: 'Hello',
            font: null,
            fontSize: 100,
            fontFamily: 'Impact',
            fontUrl: null,
            size: {
                width: 0,
                height: 0
            },
            color: {
                fill: '#000000',
                stroke: '#000000',
                strokeWidth: 0
            },
            outline: {
                include: false,
                color: '#000000',
                thickness: 2,
                width: 2
            },
            pivot: {
                x: 0.5,
                y: 0.5
            },
            position: {
                x: 0,
                y: 0
            },
            angle: 0
        };
    }

    /**
     * Set text content
     * @param {string} text - Text to display
     */
    setText(text) {
        this.settings.text = text;
        this._svgData = null; // Invalidate cache
        this.setNeedsUpdate();
    }

    /**
     * Get current text
     * @returns {string}
     */
    getText() {
        return this.settings.text;
    }

    /**
     * Set font family
     * @param {string} family - Font family name
     */
    setFontFamily(family) {
        this.settings.fontFamily = family;
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Set font URL for Google Fonts
     * @param {string} url - URL to the font file
     */
    setFontUrl(url) {
        this.settings.fontUrl = url;
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Load a Google Font from URL using opentype.js
     * @param {string} fontUrl - URL to the font file
     * @returns {Promise}
     */
    loadGoogleFont(fontUrl) {
        return new Promise((resolve, reject) => {
            if (!fontUrl) {
                reject(new Error('No font URL provided'));
                return;
            }

            // Check cache first
            if (this._fontCache[fontUrl]) {
                resolve(this._fontCache[fontUrl]);
                return;
            }

            if (typeof opentype === 'undefined') {
                reject(new Error('opentype.js library not loaded'));
                return;
            }

            opentype.load(fontUrl, (err, font) => {
                if (err) {
                    reject(err);
                } else {
                    this._fontCache[fontUrl] = font;
                    resolve(font);
                }
            });
        });
    }

    /**
     * Set font size
     * @param {number} size - Font size in pixels
     */
    setFontSize(size) {
        this.settings.fontSize = size;
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Set fill color
     * @param {string} color - Hex color string
     */
    setFillColor(color) {
        this.settings.color.fill = color;
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Get fill color
     * @returns {string}
     */
    getFillColor() {
        return this.settings.color.fill;
    }

    /**
     * Set outline properties
     * @param {Object} outline - { enabled: boolean, color: string, width: number }
     */
    setOutline(outline) {
        if (outline.enabled !== undefined) {
            this.settings.outline.include = outline.enabled;
        }
        if (outline.color !== undefined) {
            this.settings.outline.color = outline.color;
        }
        if (outline.width !== undefined) {
            this.settings.outline.thickness = outline.width;
            this.settings.outline.width = outline.width;
        }
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Get outline settings
     * @returns {Object}
     */
    getOutline() {
        return this.settings.outline;
    }

    /**
     * Generate SVG path from text using maker.js
     * @returns {Promise<string>}
     */
    async generateSVGPath() {
        if (this._svgData) {
            return this._svgData;
        }

        try {
            let svgStr;

            // Prefer maker.js vector generation if available
            if (typeof makerjs !== 'undefined') {
                const fontRef = this.settings.fontUrl || this.settings.fontFamily;
                let fontForMaker = null;

                // If opentype font is loaded, pass the font object to maker.js
                if (this.settings.fontUrl && typeof opentype !== 'undefined') {
                    try {
                        fontForMaker = await new Promise((resolve, reject) => {
                            opentype.load(this.settings.fontUrl, (err, font) => {
                                if (err) reject(err); else resolve(font);
                            });
                        });
                    } catch (e) {
                        console.warn('Falling back to system font family for maker.js');
                    }
                }

                // Build maker.js text model
                const textModel = new makerjs.models.Text(
                    fontForMaker || fontRef,
                    this.settings.text || '',
                    this.settings.fontSize || 100,
                    false,
                    false
                );

                // Export to SVG using current color/outline settings
                const svgOptions = {
                    fill: this.settings.color?.fill || '#000000',
                    stroke: this.settings.outline?.include ? (this.settings.outline.color || '#000000') : 'none',
                    strokeWidth: this.settings.outline?.include ? (this.settings.outline.thickness || 1) : 0,
                    fillRule: 'evenodd',
                    scalingStroke: false
                };

                svgStr = makerjs.exporter.toSVG(textModel, svgOptions);

                // Apply effect via custom processor if provided
                if (this._effect && this._effect !== 'none') {
                    if (typeof this._effectProcessor === 'function') {
                        try {
                            svgStr = this._effectProcessor(svgStr, this._effect, this._effectParams) || svgStr;
                        } catch (e) {
                            console.warn('Effect processor failed; using original SVG.', e);
                        }
                    } // else: placeholder for built-in effects
                }

                // Estimate size by simple heuristics; consumers render to canvas anyway
                const padding = 20;
                const widthEstimate = Math.max(300, (this.settings.fontSize || 100) * (this.settings.text?.length || 1) * 0.6);
                const heightEstimate = (this.settings.fontSize || 100) + padding * 2;
                this.settings.size = { width: widthEstimate, height: heightEstimate };
            } else {
                // Fallback to canvas-based SVG wrapper
                svgStr = this._createSVGFromCanvas();
            }

            this._svgData = svgStr;
            return svgStr;
        } catch (error) {
            console.error('Error generating SVG path:', error);
            throw error;
        }
    }

    /**
     * Create SVG from canvas text rendering
     * This is a placeholder for the full font-to-SVG path conversion
     * @private
     * @returns {string}
     */
    _createSVGFromCanvas() {
        const padding = 50;
        const width = Math.max(500, this.settings.fontSize * this.settings.text.length * 0.6);
        const height = this.settings.fontSize + padding * 2;

        this.settings.size.width = width;
        this.settings.size.height = height;

        // Create temporary canvas for measurement
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');

        // Setup font
        const fontStyle = `${this.settings.fontSize}px ${this.settings.fontFamily}`;
        ctx.font = fontStyle;
        ctx.fillStyle = this.settings.color.fill;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text
        ctx.fillText(this.settings.text, width / 2, height / 2);

        // Draw outline if enabled
        if (this.settings.outline.include) {
            ctx.strokeStyle = this.settings.outline.color;
            ctx.lineWidth = this.settings.outline.thickness;
            ctx.strokeText(this.settings.text, width / 2, height / 2);
        }

        // Convert canvas to data URL
        const dataUrl = tempCanvas.toDataURL('image/png');

        // Create SVG wrapper with the canvas-rendered image
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
            </svg>
        `;

        return svg;
    }

    /**
     * Escape XML special characters
     * @private
     */
    _escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Convert SVG to canvas
     * @param {string} svgString - SVG content
     * @returns {Promise<HTMLCanvasElement>}
     */
    async svgToCanvas(svgString) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const width = this.settings.size.width;
            const height = this.settings.size.height;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };

            img.onerror = (err) => {
                reject(new Error('Failed to render SVG to canvas'));
            };

            // Convert SVG string to data URL
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
        });
    }

    /**
     * Get canvas texture
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this._canvas;
    }

    /**
     * Get SVG data
     * @returns {string}
     */
    getSVGData() {
        return this._svgData;
    }

    /**
     * Set current effect type (e.g., 'none', 'pinch', 'arch', etc.)
     */
    setEffect(effect) {
        this._effect = effect || 'none';
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Optional: set effect parameters (intensity, path, etc.)
     */
    setEffectParams(params) {
        this._effectParams = { ...this._effectParams, ...params };
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Optional: register a custom SVG effect processor
     * The function receives (svgString, effectName, effectParams) and returns a processed svgString
     */
    setEffectProcessor(fn) {
        this._effectProcessor = fn;
        this._svgData = null;
        this.setNeedsUpdate();
    }

    /**
     * Generate and render texture
     * @returns {Promise}
     */
    async generateTexture() {
        try {
            const svg = await this.generateSVGPath();
            this._canvas = await this.svgToCanvas(svg);
            this._loaded = true;
            return this._canvas;
        } catch (error) {
            console.error('Error generating texture:', error);
            throw error;
        }
    }

    /**
     * Get texture as data URL
     * @returns {string}
     */
    getDataURL() {
        if (this._canvas) {
            return this._canvas.toDataURL('image/png');
        }
        return null;
    }

    /**
     * Load layer data
     * @param {Object} data - Layer data
     * @returns {Promise}
     */
    load(data) {
        return new Promise((resolve, reject) => {
            if (data.text) this.settings.text = data.text;
            if (data.fontFamily) this.settings.fontFamily = data.fontFamily;
            if (data.fontSize) this.settings.fontSize = data.fontSize;
            if (data.color) this.settings.color = { ...this.settings.color, ...data.color };
            if (data.outline) this.settings.outline = { ...this.settings.outline, ...data.outline };
            if (data.position) this.settings.position = data.position;
            if (data.pivot) this.settings.pivot = data.pivot;
            if (data.angle) this.settings.angle = data.angle;

            this.generateTexture()
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * Get layer data for serialization
     * @returns {Object}
     */
    getData() {
        return {
            type: 'WrapviewTextVector',
            data: {
                text: this.settings.text,
                fontFamily: this.settings.fontFamily,
                fontSize: this.settings.fontSize
            },
            settings: {
                color: this.settings.color,
                outline: this.settings.outline,
                position: this.settings.position,
                pivot: this.settings.pivot,
                angle: this.settings.angle,
                size: this.settings.size
            }
        };
    }

    /**
     * Apply loaded settings
     * @param {Object} settings - Settings to apply
     */
    applySettings(settings) {
        if (settings.text) this.settings.text = settings.text;
        if (settings.fontFamily) this.settings.fontFamily = settings.fontFamily;
        if (settings.fontSize) this.settings.fontSize = settings.fontSize;
        if (settings.color) {
            this.settings.color = { ...this.settings.color, ...settings.color };
        }
        if (settings.outline) {
            this.settings.outline = { ...this.settings.outline, ...settings.outline };
        }
        if (settings.position) this.settings.position = settings.position;
        if (settings.pivot) this.settings.pivot = settings.pivot;
        if (settings.angle) this.settings.angle = settings.angle;
    }

    /**
     * Calculate bounds (for editor handles)
     * @private
     */
    _calculateBounds() {
        // Simplified bounds calculation
        const padding = 20;
        this._bounds = {
            left: this.settings.position.x - (this.settings.size.width * this.settings.pivot.x) - padding,
            right: this.settings.position.x + (this.settings.size.width * (1 - this.settings.pivot.x)) + padding,
            top: this.settings.position.y - (this.settings.size.height * this.settings.pivot.y) - padding,
            bottom: this.settings.position.y + (this.settings.size.height * (1 - this.settings.pivot.y)) + padding
        };
    }

    /**
     * Check if point is in scale bounds
     */
    isScale(point) {
        if (!this._bounds) this._calculateBounds();
        const scaleSize = 50;
        return point.x > this._bounds.right - scaleSize &&
               point.y > this._bounds.bottom - scaleSize &&
               point.x < this._bounds.right &&
               point.y < this._bounds.bottom;
    }

    /**
     * Check if point is in rotation bounds
     */
    isRotation(point) {
        if (!this._bounds) this._calculateBounds();
        const rotateSize = 50;
        return point.x > this._bounds.right - rotateSize &&
               point.y > this._bounds.top &&
               point.x < this._bounds.right &&
               point.y < this._bounds.top + rotateSize;
    }

    /**
     * Check if point is in delete bounds
     */
    isDelete(point) {
        if (!this._bounds) this._calculateBounds();
        const deleteSize = 50;
        return point.x > this._bounds.left &&
               point.y > this._bounds.top &&
               point.x < this._bounds.left + deleteSize &&
               point.y < this._bounds.top + deleteSize;
    }

    /**
     * Check if point is within layer bounds
     */
    isInBounds(point) {
        if (!this._bounds) this._calculateBounds();
        return point.x > this._bounds.left &&
               point.y > this._bounds.top &&
               point.x < this._bounds.right &&
               point.y < this._bounds.bottom;
    }

    /**
     * Draw layer on canvas
     * @param {CanvasRenderingContext2D} context - Canvas context
     */
    draw(context) {
        if (!this._loaded || !this._canvas) return;

        this._calculateBounds();
        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);

        context.drawImage(
            this._canvas,
            -this.settings.size.width * this.settings.pivot.x,
            -this.settings.size.height * this.settings.pivot.y,
            this.settings.size.width,
            this.settings.size.height
        );

        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();
    }

    /**
     * Draw handles for layer manipulation
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {Object} editor - Editor object
     */
    drawHandles(context, editor) {
        if (!this._loaded) return;

        this._calculateBounds();

        // Draw bounding box
        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);

        context.setLineDash([6]);
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.strokeRect(
            -this.settings.size.width * this.settings.pivot.x,
            -this.settings.size.height * this.settings.pivot.y,
            this.settings.size.width,
            this.settings.size.height
        );

        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();
    }

    /**
     * Set character spacing (placeholder for future implementation)
     * @param {number} spacing
     */
    setCharSpacing(spacing) {
        // Future: implement char spacing using maker.js path manipulation
        console.log('Character spacing:', spacing);
    }

    /**
     * Set shape intensity (placeholder for future implementation)
     * @param {number} intensity - 0-100
     */
    setShapeIntensity(intensity) {
        // Future: implement shape distortion using maker.js
        console.log('Shape intensity:', intensity);
    }
}

export { WrapviewTextVector };
