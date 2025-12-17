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
            fontColor: '#000000',
            outlineEnabled: false,
            outlineColor: '#000000',
            outlineThickness: 2
        };
        this.settings = Object.assign({}, this._text_defaults, settings || {});
        this._textDiv = null;
        this._svgContainer = null;
        this._canvas = null;
        this._text = '';
        this._onUpdate = null;
        this._fontFamily = this.settings.fontFamily;
        this._root = null;
        this._path = null;
        this.svgElement = null;

        // Ensure SVG container exists
        this._ensureSvgContainer();

        // Load Google Font
        this._loadGoogleFont(this._fontFamily);

        // Create text div with Google font
        this._createTextDiv();

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

    _createTextDiv() {
        // Create text container div
        this._textDiv = document.createElement('div');
        this._textDiv.id = `textDiv-${this.id}`;
        this._textDiv.style.fontFamily = `'${this._fontFamily}', sans-serif`;
        this._textDiv.style.fontSize = `${this.settings.fontSize}px`;
        this._textDiv.style.color = this.settings.fontColor;
        this._textDiv.style.padding = '20px';
        this._textDiv.textContent = this.TEXT_VALUE;
        document.body.appendChild(this._textDiv);
    }

    _initializeViewportSvg() {
        if (this._root) return;
        this._ensureSvgContainer();
        this._root = SVG().size(this.SVG_SIZE, this.SVG_SIZE).id('viewportSvg');
        this._svgContainer.innerHTML = '';
        this._root.addTo(this._svgContainer);
        this._path = this._root.path('M0,100 C50,50 560,50 560,100').attr({ stroke: 'none', fill: 'none' });
        this.svgElement = this._root.node;
    }

    defaults() {
        return {
            fontFamily: 'Arial',
            fontSize: 16,
            fontColor: '#000000',
            outlineEnabled: false,
            outlineColor: '#000000',
            outlineThickness: 2
        }
    }

    getY(x, y) {
        if (!this._path || !Number.isFinite(x) || !Number.isFinite(y)) return y;
        const pathPoint = this._path.pointAt(x);
        if (!pathPoint || !Number.isFinite(pathPoint.y)) return y;

        let normalizedY = (y - (600/2))/(600/2); //height/2

        return y + pathPoint.y - this.BASELINE_OFFSET;
    }

    addNoneEffect(){
        this._initializeViewportSvg();

        opentype.load(this.FONT_URL, (err, font) => {
            if (err) {
                console.error('Font load failed', err);
                return;
            }

            const textModel = new makerjs.models.Text(font, this.getText(), 100, false, false);
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

            draw.addTo(this._svgContainer);
            this._root = draw;
            this.svgElement = draw.node;

            const path = draw.path('M0,100 C50,50 560,50 560,100').attr({ stroke: 'none', fill: 'none' });
            this._path = path;
        });
    }

    addArchEffect() {
        // Initialize SVG viewport when shape effect is needed
        this._initializeViewportSvg();

        opentype.load(this.FONT_URL, (err, font) => {
            if (err) {
                console.error('Font load failed', err);
                return;
            }

            const textModel = new makerjs.models.Text(font, this.getText(), 100, false, false);
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

            draw.addTo(this._svgContainer);
            this._root = draw;
            this.svgElement = draw.node;

            // const path = draw.path('M0,100 C50,50 560,50 560,100').attr({ stroke: 'none', fill: 'none' });
            const path = draw.path('M0,0 Q'+(600/4)+',-25 '+(600/2)+',0 T'+600+', 0').attr({ stroke: '#009dff', fill: 'none' })
            this._path = path;

            const warp = new Warp(group ? group.node : draw.node);
            warp.interpolate(20);
            warp.transform(([x, y]) => [x, this.getY(x, y)]);
            console.log('Guide path length', path.length());
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

    /**
     * Render the SVG in #viewport to canvas
     * @returns {Promise} Resolves with canvas element
     */
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
}

export { WrapviewVectorText };
