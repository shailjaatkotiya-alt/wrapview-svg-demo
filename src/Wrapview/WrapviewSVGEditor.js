
class WrapviewSVGEditor {
    constructor(instance) {
        this._instance = instance;
        this._onChange = null;
        this._root = null;
        this._canvasEl = null;
        this._canvas = null;
        this._index3Config = null;
        this._currentEffect = null;
        this._chgT = null;
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

    // --- Core methods ---
    _initFabric() {
        this._canvas = new fabric.Canvas(this._canvasEl, { backgroundColor: null });
        this._canvas.setWidth(360);
        this._canvas.setHeight(360);

        this._index3Config = { fontSize: 60, radius: 150, spacing: 0, intensity: 1 };
        this._currentEffect = 'none';

        const getBaseTextOptions = () => {
            const fillVal = document.getElementById('textColor').value;
            const transparentChecked = document.getElementById('textTransparent')?.checked;
            const strokeColor = document.getElementById('outlineColor')?.value || '#000000';
            const strokeWidth = Number(document.getElementById('outlineWidth')?.value || 0);
            const outlineEnabled = document.getElementById('outlineEnabled')?.checked;
            return {
                fontSize: this._index3Config.fontSize,
                fontFamily: document.getElementById('fontFamily').value,
                fill: transparentChecked ? 'rgba(0,0,0,0)' : fillVal,
                originX: 'center',
                originY: 'center',
                stroke: outlineEnabled ? strokeColor : undefined,
                strokeWidth: outlineEnabled ? strokeWidth : 0,
                paintFirst: 'stroke'
            };
        };

        const effects = {
            none: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                if (spacing > 0) {
                    const chars = text.split('').map(c => new fabric.Text(c, options));
                    let totalWidth = chars.reduce((acc, c) => acc + c.width, 0) + (chars.length - 1) * spacing;
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
                } else {
                    return new fabric.Text(text, {
                        ...options,
                        left: this._canvas.width / 2,
                        top: this._canvas.height / 2
                    });
                }
            },
            arch: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const radius = this._index3Config.radius;
                const len = text.length;
                const intensity = this._index3Config.intensity;
                const baseAngleStep = 0.2 * intensity;
                const angleStep = baseAngleStep + (spacing / radius);
                for (let i = 0; i < len; i++) {
                    const char = text[i];
                    const charAngle = -Math.PI / 2 + (i - (len - 1) / 2) * angleStep;
                    const c = new fabric.Text(char, {
                        ...options,
                        left: Math.cos(charAngle) * radius,
                        top: Math.sin(charAngle) * radius,
                        angle: (charAngle * 180 / Math.PI) + 90
                    });
                    group.addWithUpdate(c);
                }
                return group;
            },
            bridge: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const totalWidth = chars.reduce((acc, c) => acc + c.width, 0) + (chars.length - 1) * spacing;
                let currentX = -totalWidth / 2;
                const len = text.length;
                const mid = (len - 1) / 2;
                const intensity = this._index3Config.intensity;
                chars.forEach((ch, i) => {
                    const normX = (i - mid) / (mid || 1);
                    const y = 50 * (normX * normX) * intensity;
                    ch.set({ left: currentX + ch.width / 2, top: y, originX: 'center', originY: 'center' });
                    currentX += ch.width + spacing;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            bulge: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const mid = (chars.length - 1) / 2;
                const intensity = this._index3Config.intensity;
                chars.forEach((ch, i) => {
                    const dist = Math.abs(i - mid);
                    const maxDist = mid || 1;
                    const scale = 1 + 0.8 * (1 - dist / maxDist) * intensity;
                    ch.set({ fontSize: options.fontSize * scale });
                });
                let currentX = -chars.reduce((acc, c) => acc + c.getScaledWidth(), 0) / 2 - (chars.length - 1) * spacing / 2;
                chars.forEach(ch => {
                    ch.set({ left: currentX + ch.getScaledWidth() / 2, top: 0, originX: 'center', originY: 'center' });
                    currentX += ch.getScaledWidth() + spacing;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            flag: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                let currentX = -chars.reduce((acc, c) => acc + c.width, 0) / 2 - (chars.length - 1) * spacing / 2;
                const intensity = this._index3Config.intensity;
                chars.forEach((ch, i) => {
                    const y = Math.sin(i * 0.5) * 20 * intensity;
                    ch.set({ left: currentX + ch.width / 2, top: y, originX: 'center', originY: 'center' });
                    currentX += ch.width + spacing;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            valley: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const totalWidth = chars.reduce((acc, c) => acc + c.width, 0) + (chars.length - 1) * spacing;
                let currentX = -totalWidth / 2;
                const mid = (chars.length - 1) / 2;
                const intensity = this._index3Config.intensity;
                chars.forEach((ch, i) => {
                    const normX = (i - mid) / (mid || 1);
                    const y = (-50 * (normX * normX) + 25) * intensity;
                    ch.set({ left: currentX + ch.width / 2, top: y, originX: 'center', originY: 'center' });
                    currentX += ch.width + spacing;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            distort: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                let currentX = -chars.reduce((acc, c) => acc + c.width, 0) / 2 - (chars.length - 1) * spacing / 2;
                const intensity = this._index3Config.intensity;
                chars.forEach((ch, i) => {
                    const skew = (i % 2 === 0) ? -20 * intensity : 20 * intensity;
                    ch.set({ left: currentX + ch.width / 2, top: 0, skewY: skew, originX: 'center', originY: 'center' });
                    currentX += ch.width + spacing;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            circle: (text) => {
                const options = getBaseTextOptions();
                let spacing = 0;
                if (options.stroke && options.strokeWidth > 0) {
                    spacing = options.strokeWidth * 0.7;
                }
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const radius = 120 * this._index3Config.intensity;
                const len = text.length;
                const baseAngleStep = (2 * Math.PI) / len;
                const angleStep = baseAngleStep + (spacing / radius);
                for (let i = 0; i < len; i++) {
                    const char = text[i];
                    const angle = i * angleStep - Math.PI / 2;
                    const ch = new fabric.Text(char, {
                        ...options,
                        left: Math.cos(angle) * radius,
                        top: Math.sin(angle) * radius,
                        angle: (angle * 180 / Math.PI) + 90,
                        originX: 'center',
                        originY: 'center'
                    });
                    group.addWithUpdate(ch);
                }
                return group;
            }
        };

        const render = () => {
            this._canvas.clear();
            const text = document.getElementById('textInput').value;
            if (effects[this._currentEffect]) {
                const obj = effects[this._currentEffect](text);
                this._canvas.add(obj);
                this._canvas.centerObject(obj);
                obj.setCoords();
            }
            const sizeLabel = document.getElementById('fontSizeLabel');
            if (sizeLabel) sizeLabel.textContent = this._index3Config.fontSize;
            this._notifyChangeSoon();
        };

        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this._currentEffect = e.target.dataset.effect;
                render();
            });
        });

        ['textInput', 'fontFamily', 'textColor', 'outlineEnabled', 'outlineColor', 'outlineWidth', 'textTransparent'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', render);
            if (id === 'outlineEnabled' || id === 'textTransparent') {
                el.addEventListener('change', render);
            }
        });

        const intensitySlider = document.getElementById('intensitySlider');
        const intensityValue = document.getElementById('intensityValue');
        if (intensitySlider && intensityValue) {
            intensitySlider.addEventListener('input', () => {
                this._index3Config.intensity = Number(intensitySlider.value);
                intensityValue.textContent = Number(intensitySlider.value).toFixed(2);
                render();
            });
        }

        const fontInc = document.getElementById('fontInc');
        const fontDec = document.getElementById('fontDec');
        if (fontInc) {
            fontInc.addEventListener('click', () => {
                this._index3Config.fontSize = Math.min(200, this._index3Config.fontSize + 2);
                render();
            });
        }
        if (fontDec) {
            fontDec.addEventListener('click', () => {
                this._index3Config.fontSize = Math.max(8, this._index3Config.fontSize - 2);
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
                    <div style="display:flex; gap:8px; margin-top:6px; align-items:center;">
                        <button id="fontDec" type="button" style="padding:8px 12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">-</button>
                        <span style="font-weight:600;color:#555;">Size: <span id="fontSizeLabel">60</span></span>
                        <button id="fontInc" type="button" style="padding:8px 12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">+</button>
                    </div>
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
                    <label for="textColor" style="font-weight:600;color:#555;">Color</label>
                    <input type="color" id="textColor" value="#000000" style="padding:10px;border:1px solid #ddd;border-radius:6px;font-size:16px;" />
                    <label style="font-weight:600;color:#555; display:flex; gap:6px; align-items:center; margin-top:6px;">
                        <input type="checkbox" id="textTransparent" /> Transparent
                    </label>
                </div>
                <div class="input-group" style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:200px;">
                    <label style="font-weight:600;color:#555;">Outline</label>
                    <label style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                        <input type="checkbox" id="outlineEnabled" /> Enable Outline
                    </label>
                    <label for="outlineColor" style="font-weight:600;color:#555;font-size:14px;">Outline Color</label>
                    <input type="color" id="outlineColor" value="#000000" style="padding:6px;border:1px solid #ddd;border-radius:6px;" />
                    <label for="outlineWidth" style="font-weight:600;color:#555;font-size:14px;">Outline Width</label>
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
                <button class="effect-btn" data-effect="bridge" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Bridge</button>
                <button class="effect-btn" data-effect="bulge" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Bulge</button>
                <button class="effect-btn" data-effect="flag" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Flag</button>
                <button class="effect-btn" data-effect="valley" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Valley</button>
                <button class="effect-btn" data-effect="distort" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Distort</button>
                <button class="effect-btn" data-effect="circle" style="padding:12px;border:none;background-color:#e4e6eb;color:#050505;border-radius:6px;cursor:pointer;font-weight:600;">Circle</button>
            </div>
            <div id="canvas-wrapper" style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background-image:linear-gradient(45deg,#f0f0f0 25%,transparent 25%),linear-gradient(-45deg,#f0f0f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0f0f0 75%),linear-gradient(-45deg,transparent 75%,#f0f0f0 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0px;display:flex;justify-content:center;">
                <canvas id="c" width="2560" height="2560" style="display:block;width:360px;height:360px;"></canvas>
            </div>
        </div>`;
    }
}

export { WrapviewSVGEditor };