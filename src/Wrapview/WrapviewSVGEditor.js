class WrapviewSVGEditor {
    constructor(instance) {
        this._instance = instance;
        this._onChange = null;
        this._root = null;
        this._canvasEl = null;
        this._canvas = null;
        this._currentEffect = 'none';
        this._chgT = null;
        this._textColorPalette = [
            'transparent',
            '#ffffff', '#dcdcdc', '#222222', '#4b4b4b', '#6b6b6b', '#ff008c', '#ff9cb3', '#ff85b6',
            '#b14b8e', '#6a1c2a', '#c3132c', '#e33b3b', '#f56c1d', '#f5a021', '#f1b22a', '#f7c529',
            '#ffe976', '#815520', '#64c9b8', '#9edb2a', '#218e3f', '#0c6b45', '#2e4a34', '#0a6b73',
            '#00a3c6', '#00a8f1', '#8bc4f6', '#126ca3', '#0d43c8', '#123767', '#0e3557', '#9c75c7',
            '#c218a8'
        ];
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
            this._canvasEl = document.getElementById('c');
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

    // --- Helper methods ---
    _isOutlineEnabled() {
        return document.getElementById('outlineToggle')?.dataset.enabled === 'true';
    }

    _getStrokeWidth() {
        return parseFloat(document.getElementById('outlineWidth')?.value) || 0;
    }

    _getFontSize() {
        const val = parseFloat(document.getElementById('textSize')?.value);
        return Number.isFinite(val) && val > 0 ? val : 60;
    }

    _getCharSpacing() {
        const strokeWidth = this._isOutlineEnabled() ? this._getStrokeWidth() : 0;
        return strokeWidth * 0.6;
    }

    _getFillColor() {
        const input = document.getElementById('textColor');
        const explicit = input?.dataset.fill;
        if (explicit === 'transparent') return 'transparent';
        return input?.value || '#000000';
    }

    _getBaseTextOptions() {
        const outlineEnabled = this._isOutlineEnabled();
        const strokeColor = document.getElementById('outlineColor')?.value || '#000000';
        const strokeWidth = this._getStrokeWidth();
        return {
            fontSize: this._getFontSize(),
            fontFamily: document.getElementById('fontFamily')?.value || 'Arial',
            fill: this._getFillColor(),
            stroke: outlineEnabled ? strokeColor : undefined,
            strokeWidth: outlineEnabled ? strokeWidth : 0,
            strokeUniform: true,
            originX: 'center',
            originY: 'center'
        };
    }

    // --- Core methods ---
    _initFabric() {
        this._canvas = new fabric.Canvas(this._canvasEl, { backgroundColor: null });
        this._canvas.setWidth(2560);
        this._canvas.setHeight(2560);

        this._config = { fontSize: 60, radius: 150, spacing: 0, intensity: 1 };
        this._currentEffect = 'none';

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
                const radius = 130;
                const len = text.length;
                const angleRange = Math.PI * 0.8;
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
                return group;
            },

            valley: (text) => {
                const options = getBaseTextOptions();
                const spacing = this._getCharSpacing();
                const group = new fabric.Group([], {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const totalWidth = chars.reduce((acc, c) => acc + c.width, 0) + (chars.length - 1) * spacing;
                let currentX = -totalWidth / 2;
                const mid = (chars.length - 1) / 2;

                chars.forEach((c, i) => {
                    const normX = (i - mid) / (mid || 1);
                    const y = -50 * (normX * normX) + 25;
                    const tiltAngle = normX * -40;
                    c.set({ left: currentX + c.width / 2, top: y, angle: tiltAngle, originX: 'center', originY: 'center' });
                    currentX += c.width + spacing;
                    group.addWithUpdate(c);
                });
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
                    const scale = 1 + 0.8 * (1 - dist / maxDist);
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

                chars.forEach((c, i) => {
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
                    const scale = 1 - 0.5 * (1 - dist / maxDist);
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
            const text = document.getElementById('textInput')?.value || '';
            if (effects[this._currentEffect]) {
                const obj = effects[this._currentEffect](text);
                this._canvas.add(obj);
                this._canvas.centerObject(obj);
                obj.setCoords();
            }
            this._notifyChangeSoon();
        };

        // Event listeners
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this._currentEffect = e.target.dataset.effect;
                render();
            });
        });

        ['textInput', 'fontFamily', 'textColor', 'textSize', 'outlineColor', 'outlineWidth'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                if (id === 'textColor') {
                    el.dataset.fill = '';
                }
                render();
            });
        });

        const outlineToggleBtn = document.getElementById('outlineToggle');
        if (outlineToggleBtn) {
            outlineToggleBtn.addEventListener('click', () => {
                const isEnabled = outlineToggleBtn.dataset.enabled === 'true';
                outlineToggleBtn.dataset.enabled = (!isEnabled).toString();
                render();
            });
        }

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
        <div class="container" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 1000px; display: flex; flex-direction: column; gap: 20px;">
            <h1 style="color:#333;margin-bottom:20px;">Text Decorator</h1>
            
            <div class="controls-area" style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
                <div class="input-group" style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:200px;">
                    <label for="textInput" style="font-weight:600;color:#555;">Text</label>
                    <input type="text" id="textInput" value="HELLO WORLD" placeholder="Enter text" style="padding:10px;border:1px solid #ddd;border-radius:6px;font-size:16px;" />
                    <label for="textSize" style="font-weight:600;color:#555;">Font Size</label>
                    <input type="number" id="textSize" value="60" min="8" max="200" style="padding:10px;border:1px solid #ddd;border-radius:6px;font-size:16px;" />
                </div>
                
                <div class="input-group" style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:200px;">
                    <label for="fontFamily" style="font-weight:600;color:#555;">Font</label>
                    <select id="fontFamily" style="padding:10px;border:1px solid #ddd;border-radius:6px;font-size:16px;">
                        <option value="Arial">Arial</option>
                        <option value="Impact" selected>Impact</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Verdana">Verdana</option>
                    </select>
                </div>
                
                <div class="input-group" style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:200px;">
                    <label for="textColor" style="font-weight:600;color:#555;">Text Color</label>
                    <input type="color" id="textColor" value="#000000" style="padding:10px;border:1px solid #ddd;border-radius:6px;font-size:16px;" />
                </div>
                
                <div class="input-group" style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:200px;">
                    <label style="font-weight:600;color:#555;">Outline</label>
                    <button id="outlineToggle" data-enabled="false" type="button" style="padding:10px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Outline Off</button>
                    <label for="outlineColor" style="font-weight:600;color:#555;font-size:14px;">Outline Color</label>
                    <input type="color" id="outlineColor" value="#000000" style="padding:6px;border:1px solid #ddd;border-radius:6px;" />
                    <label for="outlineWidth" style="font-weight:600;color:#555;font-size:14px;">Width (0-20)</label>
                    <input type="number" id="outlineWidth" value="2" min="0" max="20" style="padding:6px;border:1px solid #ddd;border-radius:6px;" />
                </div>
            </div>
            
            <div style="margin: 12px 0; display: flex; align-items: center; gap: 12px;">
                <label for="intensitySlider" style="font-weight:600;color:#555;">Intensity:</label>
                <input type="range" id="intensitySlider" min="0.2" max="2.5" step="0.01" value="1" style="width:180px;">
                <span id="intensityValue" style="font-weight:600;color:#555;">1.00</span>
            </div>
            
            <div class="effects-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px,1fr)); gap:12px; width:100%;">
                <button class="effect-btn active" data-effect="none" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">None</button>
                <button class="effect-btn" data-effect="arch" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Arch</button>
                <button class="effect-btn" data-effect="bulge" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Bulge</button>
                <button class="effect-btn" data-effect="flag" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Flag</button>
                <button class="effect-btn" data-effect="valley" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Valley</button>
                <button class="effect-btn" data-effect="distort" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Distort</button>
                <button class="effect-btn" data-effect="circle" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Circle</button>
                <button class="effect-btn" data-effect="pinch" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Pinch</button>
            </div>
            
            <div id="canvas-wrapper" style="display:none;border:1px solid #ddd;border-radius:8px;overflow:hidden;background-image:linear-gradient(45deg,#f0f0f0 25%,transparent 25%),linear-gradient(-45deg,#f0f0f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0f0f0 75%),linear-gradient(-45deg,transparent 75%,#f0f0f0 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0px;display:flex;justify-content:center;">
                <canvas id="c" width="2560" height="2560" style="display:block;width:360px;height:360px;"></canvas>
            </div>
        </div>`;
    }
}

export { WrapviewSVGEditor };