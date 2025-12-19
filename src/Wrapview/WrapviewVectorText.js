let makerjs = require('makerjs');

class WrapviewVectorText {
    constructor(id, settings) {
        this.FONT_URL = 'https://fonts.gstatic.com/s/abeezee/v23/esDR31xSG-6AGleN6tKukbcHCpE.ttf';
        this.TEXT_VALUE = 'Hello World';
        this.SVG_SIZE = 600;
        this.BASELINE_OFFSET = 80;

        this.id = id;
        this._text_defaults = {
            fontFamily: 'ABeeZee',
            fontSize: 16,
            fontColor: '#ffffff',
            outlineEnabled: false,
            outlineColor: '#000000',
            outlineThickness: 2
        };
        this.settings = Object.assign({}, this._text_defaults, settings || {});
        this._svgContainer = null;
        this._canvas = null;
        this._onUpdate = null;
        this._root = null;
        this._path = '';
        this.svgElement = null;

        // Ensure SVG container exists
        this._ensureSvgContainer();

        // Load Google Font
        this._loadGoogleFont(this._text_defaults.fontFamily);

        // Initialize SVG with text
        this._initializeViewportSvg();
    }

    _ensureSvgContainer() {
        this._svgContainer = document.getElementById('SVGContainer');
        if (!this._svgContainer) {
            this._svgContainer = document.createElement('div');
            this._svgContainer.id = 'SVGContainer';
            this._svgContainer.style.display = 'none';
            document.body.appendChild(this._svgContainer);
        } else {
            this._svgContainer.style.display = 'none';
        }
    }

    _loadGoogleFont(fontFamily) {
        const fontParam = fontFamily.replace(/\s+/g, '+');
        const googleFontURL = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;

        if (!document.querySelector(`link[href="${googleFontURL}"]`)) {
            const link = document.createElement('link');
            link.href = googleFontURL;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }

    _initializeViewportSvg() {
        if (this._root) return;
        this._ensureSvgContainer();
        this._root = SVG().size(this.SVG_SIZE, this.SVG_SIZE).id('viewportSvg');
        this._svgContainer.innerHTML = '';
        this._root.addTo(this._svgContainer);
        this.svgElement = this._root.node;
    }

    getY(x, y, h, w, effectType) {
        if (!this._path || !Number.isFinite(x) || !Number.isFinite(y)) return y;
        const pathPoint = this._path.pointAt(x);
        if (!pathPoint || !Number.isFinite(pathPoint.y)) return y;

        if (effectType === 'bulge' || effectType === 'pinch') {
            const normalizedY = (y - (h / 2)) / (h / 2);
            // console.log(normalizedY);
            if (effectType === 'bulge') {
                return (y + normalizedY * pathPoint.y) - h;
            } else {
                // pinch
                return (y - normalizedY * pathPoint.y) - h;
            }
        }

        return y + pathPoint.y - this.BASELINE_OFFSET;
    }

    _renderEffect(effectType, pathCreator) {
        this._initializeViewportSvg();

        opentype.load(this.FONT_URL, (err, font) => {
            if (err) {
                console.error('Font load failed', err);
                return;
            }

            const textModel = new makerjs.models.Text(font, this.getText(), this.fontSize, false, false);
            const textSvg = makerjs.exporter.toSVG(textModel, {
                fill: this._text_defaults.fontColor,
                stroke: this._text_defaults.outlineColor,
                strokeWidth: this._text_defaults.outlineEnabled ? this._text_defaults.outlineThickness : 0,
                fillRule: 'evenodd',
                scalingStroke: false
            });

            const draw = SVG(textSvg).addClass('Main');
            draw.size(this.SVG_SIZE, this.SVG_SIZE);
            draw.id('viewportSvg');

            const group = draw.children()[0];
            if (group) {
                group.id('svgGroup');
            }

            const groupHeight = group ? group.bbox().height : 0;
            const groupWidth = group ? group.bbox().width : 0;
            // console.log('Group dimensions', groupWidth, groupHeight);

            this._root = draw;
            this.svgElement = draw.node;
            this._path = '';

            if (effectType !== 'none' && pathCreator) {
                const path = pathCreator(draw);
                this._path = path;
                const warp = new Warp(group ? group.node : draw.node);
                warp.interpolate(20);
                warp.transform(([x, y]) => [x, this.getY(x, y, groupHeight, groupWidth, effectType)]);
                // console.log('Guide path length', path.length());
            }
        });
    }

    addNoneEffect() {
        this._renderEffect('none', null);
    }

    addArchEffect() {
        this._renderEffect('arch', (draw) => {
            return draw.path('M0,' + this.getFontSize() + ' C50,20 ' + (this.SVG_SIZE) + ',20 ' + (this.SVG_SIZE) + ',' + this.getFontSize() + '').attr({ stroke: 'none', fill: 'none' });
        });
    }

    addFlagEffect() {
        this._renderEffect('flag', (draw) => {
            return draw.path('M0,0 Q' + (this.SVG_SIZE / 4) + ',-50 ' + (this.SVG_SIZE / 2) + ',0 T' + this.SVG_SIZE + ', 0').attr({ stroke: 'none', fill: 'none' });
        });
    }

    addBulgeEffect() {
        this._renderEffect('bulge', (draw) => {
            return draw.path('M0,0 Q' + (this.SVG_SIZE / 4) + ',-50 ' + (this.SVG_SIZE / 2) + ',0').attr({ stroke: 'none', fill: 'none' });
        });
    }

    addPinchEffect() {
        this._renderEffect('pinch', (draw) => {
            return draw.path('M0,0 Q' + (this.SVG_SIZE / 4) + ',-25 ' + (this.SVG_SIZE / 2) + ',0 T' + this.SVG_SIZE + ', 0').attr({ stroke: 'none', fill: 'none' });
        });
    }

    renderSvgViewportToCanvas() {
        return new Promise((resolve, reject) => {
            const svgElement = this._root ? this._root.node : document.getElementById('viewportSvg');
            if (!svgElement) {
                reject(new Error('SVG viewport element not found'));
                return;
            }

            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                if (!this._canvas) {
                    this._canvas = document.createElement('canvas');
                }

                this._canvas.width = this.SVG_SIZE;
                this._canvas.height = this.SVG_SIZE;
                const ctx = this._canvas.getContext('2d');

                ctx.clearRect(0, 0, this.SVG_SIZE, this.SVG_SIZE);
                ctx.drawImage(img, 0, 0, this.SVG_SIZE, this.SVG_SIZE);

                URL.revokeObjectURL(url);
                resolve(this._canvas);

                if (this._onUpdate) {
                    this._onUpdate(this._canvas);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to render viewport SVG to canvas'));
            };
            img.src = url;
        });
    }

    setText(text) {
        this.TEXT_VALUE = text;
        // Update the text div with new content
        if (this._textDiv) {
            this._textDiv.textContent = text;
        }
    }

    getText() {
        return this.TEXT_VALUE;
    }

    getFontFamily() {
        return this.settings.fontFamily || this._text_defaults.fontFamily;
    }

    setFontFamily(fontFamily) {
        if (!fontFamily) return;
        this._text_defaults.fontFamily = fontFamily;
        this.settings.fontFamily = fontFamily;
        this._loadGoogleFont(fontFamily);
    }

    getFontSize() {
        return this.settings.fontSize ?? this._text_defaults.fontSize;
    }

    setFontSize(size) {
        if (size == null) return;
        this._text_defaults.fontSize = size;
        this.settings.fontSize = size;
    }

    getFontColor() {
        return this.settings.fontColor ?? this._text_defaults.fontColor;
    }

    setFontColor(color) {
        if (!color) return;
        this._text_defaults.fontColor = color;
        this.settings.fontColor = color;
    }

    getOutlineEnabled() {
        return this.settings.outlineEnabled ?? this._text_defaults.outlineEnabled;
    }

    setOutlineEnabled(enabled) {
        this._text_defaults.outlineEnabled = !!enabled;
        this.settings.outlineEnabled = !!enabled;
    }

    getOutlineColor() {
        return this.settings.outlineColor ?? this._text_defaults.outlineColor;
    }

    setOutlineColor(color) {
        if (!color) return;
        this._text_defaults.outlineColor = color;
        this.settings.outlineColor = color;
    }

    getOutlineThickness() {
        return this.settings.outlineThickness ?? this._text_defaults.outlineThickness;
    }

    setOutlineThickness(thickness) {
        if (thickness == null) return;
        this._text_defaults.outlineThickness = thickness;
        this.settings.outlineThickness = thickness;
    }
}

export { WrapviewVectorText };