class WrapviewSVGEditor {
    constructor(instance) {
        this._instance = instance;
        this._onChange = null;
        this._root = null;
        this._canvasEl = null;
        this._canvas = null;
        this._currentEffect = 'none';
        this._chgT = null;
        this._renderFn = null;
        this._canvasId = `wve-canvas-${Math.random().toString(36).slice(2)}`;
        this._state = {
            text: 'HELLO WORLD',
            fontSize: 60,
            fontFamily: 'Impact',
            fillColor: '#000000',
            outlineEnabled: false,
            outlineColor: '#000000',
            outlineWidth: 2,
            effect: 'none',
            charSpacing: 0,
            shapeIntensity: 100 // This will be used to adjust the shape effects
        };
    }

    // --- Public API ---
    attachTo(container) {
        if (typeof container === 'string') container = document.getElementById(container);
        if (!container) throw new Error('Container not found for Wrapview editor');

        const ensureFabric = () => {
            if (window.fabric) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js';
                s.onload = () => resolve();
                s.onerror = (e) => reject(new Error('Failed to load Fabric.js'));
                document.head.appendChild(s);
            });
        };

        ensureFabric().then(() => {
            this._root = container;
            this._root.innerHTML = this._buildMarkup();
            this._canvasEl = document.getElementById(this._canvasId);
            this._initFabric();
            this._notifyChangeSoon();
        }).catch(err => console.error(err));
    }

    setOnChange(cb) {
        this._onChange = typeof cb === 'function' ? cb : null;
    }

    getDataURL() {
        if (!this._canvas) return null;
        return this._canvas.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: false });
    }

    setText(text) {
        if (typeof text !== 'string') return;
        this._setState({ text });
    }

    setFillColor(color) {
        if (typeof color !== 'string') return;
        this._setState({ fillColor: color });
    }

    setOutline(params) {
        const next = { ...this._state };
        if (typeof params?.enabled === 'boolean') next.outlineEnabled = params.enabled;
        if (typeof params?.color === 'string') next.outlineColor = params.color;
        if (Number.isFinite(params?.width)) next.outlineWidth = Math.max(0, params.width);
        this._setState(next);
    }

    setEffect(effect) {
        if (typeof effect !== 'string') return;
        this._setState({ effect });
    }

    setFontSize(size) {
        if (!Number.isFinite(size) || size <= 0) return;
        this._setState({ fontSize: size });
    }

    setFontFamily(font) {
        if (typeof font !== 'string' || !font.trim()) return;
        this._setState({ fontFamily: font });
    }

    setCharSpacing(spacing) {
        if (!Number.isFinite(spacing) || spacing < 0) return;
        this._setState({ charSpacing: spacing });
    }

    setShapeIntensity(intensity) {
        if (!Number.isFinite(intensity) || intensity < 0) return;
        this._setState({ shapeIntensity: intensity });
    }

    // --- Helper methods ---
    _isOutlineEnabled() {
        return !!this._state.outlineEnabled;
    }

    _getStrokeWidth() {
        return this._state.outlineEnabled ? (this._state.outlineWidth || 0) : 0;
    }

    _getFontSize() {
        const val = this._state.fontSize;
        return Number.isFinite(val) && val > 0 ? val : 60;
    }

    _getCharSpacing() {
        return this._state.charSpacing || 0;
    }

    _getShapeIntensity() {
        return this._state.shapeIntensity || 100;
    }

    _getFillColor() {
        return this._state.fillColor || '#000000';
    }

    _getBaseTextOptions() {
        const outlineEnabled = this._isOutlineEnabled();
        const strokeWidth = this._getStrokeWidth();
        return {
            fontSize: this._getFontSize(),
            fontFamily: this._state.fontFamily || 'Arial',
            fill: this._getFillColor(),
            stroke: outlineEnabled ? this._state.outlineColor : undefined,
            strokeWidth: outlineEnabled ? strokeWidth : 0,
            strokeUniform: true,
            originX: 'center',
            originY: 'center'
        };
    }

    // --- Core methods ---
    _initFabric() {
        if (!this._canvasEl) {
            console.warn('WrapviewSVGEditor canvas element not found');
            return;
        }
        this._canvas = new fabric.Canvas(this._canvasEl, { backgroundColor: null });
        this._canvas.setWidth(2560);
        this._canvas.setHeight(2560);

        const getBaseTextOptions = () => this._getBaseTextOptions();

        const effects = {
            none: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const totalWidth = chars.reduce((acc, c) => acc + c.width, 0) + (chars.length - 1) * spacing;
                let currentX = -totalWidth / 2;
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                chars.forEach((ch) => {
                    ch.set({ left: currentX + ch.width / 2, top: 0, originX: 'center', originY: 'center' });
                    currentX += ch.width + spacing;
                    group.addWithUpdate(ch);
                });
                return group;
            },

            arch: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                
                const intensity = this._getShapeIntensity() / 100; // Normalize intensity to a 0-1 range
                const radius = 250 * intensity; // Increased radius for less curvature
                const len = text.length;
                const angleRange = Math.PI * 0.5 * intensity; // Reduced angle range for less curvature (was Math.PI)
                const startAngle = -Math.PI / 2 - angleRange / 2;

                for (let i = 0; i < len; i++) {
                    const char = text[i];
                    const angle = startAngle + (i / (len - 1)) * angleRange;
                    const c = new fabric.Text(char, {
                        ...options,
                        left: Math.cos(angle) * radius,
                        top: Math.sin(angle) * radius,
                        angle: (angle * 180 / Math.PI) + 90
                    });
                    group.addWithUpdate(c);
                }

                // Adjust character spacing
                const totalWidth = (len - 1) * spacing; // Calculate total spacing
                const offset = totalWidth / 2; // Center the spacing offset
                group.left -= offset; // Adjust group position to center

                return group;
            },

            bulge: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const mid = (chars.length - 1) / 2;

                chars.forEach((c, i) => {
                    const dist = Math.abs(i - mid);
                    const maxDist = mid || 1;
                    const scale = 1 + (0.8 * (1 - dist / maxDist) * (this._getShapeIntensity() / 100)); // Adjust scale based on shape intensity
                    c.set({ fontSize: options.fontSize * scale });
                });

                const totalWidth = chars.reduce((acc, c) => acc + c.getScaledWidth(), 0) + spacing * Math.max(chars.length - 1, 0);
                let currentX = -totalWidth / 2;

                chars.forEach(c => {
                    c.set({ left: currentX + c.getScaledWidth() / 2, top: 0, originX: 'center', originY: 'center' });
                    currentX += c.getScaledWidth() + spacing;
                    group.addWithUpdate(c);
                });
                return group;
            },

            flag: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const totalWidth = chars.reduce((acc, c) => acc + c.width, 0) + spacing * Math.max(chars.length - 1, 0);
                let currentX = -totalWidth / 2;

                chars.forEach((c, i) => {
                    const y = Math.sin(i * 0.5) * 20;
                    c.set({ left: currentX + c.width / 2, top: y, originX: 'center', originY: 'center' });
                    currentX += c.width + spacing;
                    group.addWithUpdate(c);
                });
                return group;
            },

            distort: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const len = chars.length;

                chars.forEach((c, i) => {
                    const progress = i / (len - 1 || 1);
                    const scale = 0.5 + 0.5 * progress;
                    c.set({ scaleX: scale, scaleY: scale });
                });

                const totalWidth = chars.reduce((acc, c) => acc + c.getScaledWidth(), 0) + spacing * Math.max(chars.length - 1, 0);
                let currentX = -totalWidth / 2;

                chars.forEach(c => {
                    c.set({ left: currentX + c.getScaledWidth() / 2, top: 0, originX: 'center', originY: 'center' });
                    currentX += c.getScaledWidth() + spacing;
                    group.addWithUpdate(c);
                });
                return group;
            },

            Adistort: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const len = chars.length;

                chars.forEach((c, i) => {
                    const progress = i / (len - 1 || 1);
                    const scale = 1.5 - 0.5 * progress; // Inverted scale for Adistort
                    c.set({ scaleX: scale, scaleY: scale });
                });

                const totalWidth = chars.reduce((acc, c) => acc + c.getScaledWidth(), 0) + spacing * Math.max(chars.length - 1, 0);
                let currentX = -totalWidth / 2;

                chars.forEach(c => {
                    c.set({ left: currentX + c.getScaledWidth() / 2, top: 0, originX: 'center', originY: 'center' });
                    currentX += c.getScaledWidth() + spacing;
                    group.addWithUpdate(c);
                });
                return group;
            },

            circle: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                const radius = 110;
                const len = text.length;
                const angleStep = (2 * Math.PI) / len;

                for (let i = 0; i < len; i++) {
                    const char = text[i];
                    const angle = i * angleStep - Math.PI / 2;
                    const c = new fabric.Text(char, {
                        ...options,
                        left: Math.cos(angle) * radius,
                        top: Math.sin(angle) * radius,
                        angle: (angle * 180 / Math.PI) + 90,
                        originX: 'center',
                        originY: 'center'
                    });
                    group.addWithUpdate(c);
                }
                return group;
            },

            pinch: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const mid = (chars.length - 1) / 2;

                chars.forEach((c, i) => {
                    const dist = Math.abs(i - mid);
                    const maxDist = mid || 1;
                    const scale = 1 - (this._getShapeIntensity() / 100) * (1 - dist / maxDist); // Adjust scale based on shape intensity
                    c.set({ fontSize: options.fontSize * scale });
                });

                const totalWidth = chars.reduce((acc, c) => acc + c.getScaledWidth(), 0) + spacing * Math.max(chars.length - 1, 0);
                let currentX = -totalWidth / 2;

                chars.forEach(c => {
                    c.set({ left: currentX + c.getScaledWidth() / 2, top: 0, originX: 'center', originY: 'center' });
                    currentX += c.getScaledWidth() + spacing;
                    group.addWithUpdate(c);
                });
                return group;
            }
        };

        const render = () => {
            this._canvas.clear();
            const text = this._state.text || '';
            this._currentEffect = this._state.effect || 'none';
            if (effects[this._currentEffect]) {
                const obj = effects[this._currentEffect](text);
                this._canvas.add(obj);
                this._canvas.centerObject(obj);
                obj.setCoords();
            }
            this._notifyChangeSoon();
        };

        this._renderFn = render;

        render();
    }

    _notifyChangeSoon() {
        if (!this._onChange) return;
        clearTimeout(this._chgT);
        this._chgT = setTimeout(() => {
            try { this._onChange(this.getDataURL()); } catch (e) { console.warn(e); }
        }, 60);
    }

    _buildMarkup() {
        return `
        <div class="wve-canvas-shell">
            <canvas id="${this._canvasId}" width="2560" height="2560" class="wve-canvas"></canvas>
        </div>`;
    }

    _setState(partial) {
        this._state = { ...this._state, ...partial };
        if (typeof this._renderFn === 'function') {
            this._renderFn();
        }
    }
}

export { WrapviewSVGEditor };