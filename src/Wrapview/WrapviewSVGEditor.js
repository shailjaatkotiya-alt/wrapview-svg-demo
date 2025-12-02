
import { UIBuilder } from './UIBuilder.js';
import { FabricObjectBuilder } from './FabricObjectBuilder.js';
import { SelectionManager } from './SelectionManager.js';
import { StateManager } from './StateManager.js';

class WrapviewSVGEditor {
    constructor(instance) {
        this._instance = instance;

        // state
        this.mode = 'fabric';
        this.selected = null;
        this._onChange = null;

        // dom
        this._root = null;
        this._wrapper = null;
        this._canvasEl = null;
        this._selContainer = null;

        // fabric
        this._canvas = null;
        this._objects = new Map();

        // helpers
        this._uiBuilder = new UIBuilder(this);
        this._objectBuilder = new FabricObjectBuilder(this);
        this._selectionManager = new SelectionManager(this);
        this._stateManager = new StateManager(this);
    }

    // --- public API ---
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
            // Inject Index3-style UI into the container
            this._root.innerHTML = this._buildIndex3Markup();
            // Set references
            this._canvasEl = document.getElementById('c');
            this._wrapper = this._root.querySelector('.container');
            // Initialize Fabric and effects
            this._initIndex3Fabric();
            this._notifyChangeSoon();
        }).catch(err => console.error(err));
    }

    setOnChange(cb) { this._onChange = typeof cb === 'function' ? cb : null; }

    getDataURL() {
        if (!this._canvas) return null;
        return this._canvas.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: false });
    }

    // --- Core methods ---
    _initIndex3Fabric() {
        this._canvas = new fabric.Canvas(this._canvasEl, { backgroundColor: null });
        // Ensure internal canvas size is square to avoid texture stretching
        this._canvas.setWidth(360);
        this._canvas.setHeight(360);
        this._objects.clear();

        // Config mirrors Index3.html
        this._index3Config = { fontSize: 60, radius: 150, spacing: 0 };
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
                strokeWidth: outlineEnabled ? strokeWidth : 0
            };
        };

        // Effects
        const effects = {
            none: (text) => {
                const options = getBaseTextOptions();
                return new fabric.Text(text, {
                    ...options,
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2
                });
            },
            arch: (text) => {
                const options = getBaseTextOptions();
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const radius = this._index3Config.radius;
                const len = text.length;
                for (let i = 0; i < len; i++) {
                    const char = text[i];
                    const charAngle = -Math.PI / 2 + (i - (len - 1) / 2) * 0.2;
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
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const totalWidth = chars.reduce((acc, c) => acc + c.width, 0);
                let currentX = -totalWidth / 2;
                const len = text.length;
                const mid = (len - 1) / 2;
                chars.forEach((ch, i) => {
                    const normX = (i - mid) / (mid || 1);
                    const y = 50 * (normX * normX);
                    ch.set({ left: currentX + ch.width / 2, top: y, originX: 'center', originY: 'center' });
                    currentX += ch.width;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            valley: (text) => {
                const options = getBaseTextOptions();
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const totalWidth = chars.reduce((acc, c) => acc + c.width, 0);
                let currentX = -totalWidth / 2;
                const mid = (chars.length - 1) / 2;
                chars.forEach((ch, i) => {
                    const normX = (i - mid) / (mid || 1);
                    const y = -50 * (normX * normX) + 25;
                    ch.set({ left: currentX + ch.width / 2, top: y, originX: 'center', originY: 'center' });
                    currentX += ch.width;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            bulge: (text) => {
                const options = getBaseTextOptions();
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                const mid = (chars.length - 1) / 2;
                chars.forEach((ch, i) => {
                    const dist = Math.abs(i - mid);
                    const maxDist = mid || 1;
                    const scale = 1 + 0.8 * (1 - dist / maxDist);
                    ch.set({ fontSize: options.fontSize * scale });
                });
                let currentX = -chars.reduce((acc, c) => acc + c.getScaledWidth(), 0) / 2;
                chars.forEach(ch => {
                    ch.set({ left: currentX + ch.getScaledWidth() / 2, top: 0, originX: 'center', originY: 'center' });
                    currentX += ch.getScaledWidth();
                    group.addWithUpdate(ch);
                });
                return group;
            },
            flag: (text) => {
                const options = getBaseTextOptions();
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                let currentX = -chars.reduce((acc, c) => acc + c.width, 0) / 2;
                chars.forEach((ch, i) => {
                    const y = Math.sin(i * 0.5) * 20;
                    ch.set({ left: currentX + ch.width / 2, top: y, originX: 'center', originY: 'center' });
                    currentX += ch.width;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            distort: (text) => {
                const options = getBaseTextOptions();
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const chars = text.split('').map(c => new fabric.Text(c, options));
                let currentX = -chars.reduce((acc, c) => acc + c.width, 0) / 2;
                chars.forEach((ch, i) => {
                    const skew = (i % 2 === 0) ? -20 : 20;
                    ch.set({ left: currentX + ch.width / 2, top: 0, skewY: skew, originX: 'center', originY: 'center' });
                    currentX += ch.width;
                    group.addWithUpdate(ch);
                });
                return group;
            },
            circle: (text) => {
                const options = getBaseTextOptions();
                const group = new fabric.Group([], {
                    left: this._canvas.width / 2,
                    top: this._canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const radius = 120;
                const len = text.length;
                const angleStep = (2 * Math.PI) / len;
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
            // Update font size label
            const sizeLabel = document.getElementById('fontSizeLabel');
            if (sizeLabel) sizeLabel.textContent = this._index3Config.fontSize;
            this._notifyChangeSoon();
        };

        // Wire UI events
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
        
        // Font size increment/decrement
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

        // Initial render
        render();
    }

    _notifyChangeSoon() {
        if (!this._onChange) return;
        clearTimeout(this._chgT);
        this._chgT = setTimeout(() => {
            try { this._onChange(this.getDataURL()); } catch (e) { console.warn(e); }
        }, 60);
    }

    _commitRender() {
        if (!this._canvas) return;
        this._canvas.requestRenderAll();
        this._notifyChangeSoon();
    }

    _setProps(obj, props) {
        obj.set(props);
        this._commitRender();
    }

    _addObject(obj) {
        this._canvas.add(obj);
        this._objects.set(obj._wve.id, obj);
        this._canvas.setActiveObject(obj);
        this.selected = obj._wve.id;
    }

    _replaceObject(oldObj, newObj) {
        this._canvas.remove(oldObj);
        this._canvas.add(newObj);
        this._objects.set(newObj._wve.id, newObj);
        this._canvas.setActiveObject(newObj);
        this._commitRender();
        this.selected = newObj._wve.id;
        this._selectionManager.updateSelectedPanel();
    }

    _clearAll() {
        this._canvas.getObjects().forEach(o => this._canvas.remove(o));
        this._objects.clear();
        this._commitRender();
    }

    _getObjectAnchor(obj) {
        if (obj.type === 'group') {
            const pt = obj.getPointByOrigin('center', 'center');
            return { left: pt.x, top: pt.y };
        } else {
            return { left: obj.left, top: obj.top };
        }
    }

    _safeNumber(v, def = 0) {
        const n = Number(v);
        return Number.isFinite(n) ? n : def;
    }

    // --- Public creators ---
    addText(opts = {}) {
        const id = `text-${Date.now()}`;
        const o = this._objectBuilder.createText({
            id,
            left: (opts.x ?? opts.left) ?? 50,
            top: (opts.y ?? opts.top) ?? 50,
            text: opts.text ?? 'Your Text',
            fontSize: opts.fontSize ?? 24,
            fontFamily: opts.fontFamily ?? 'Arial, sans-serif',
            fill: opts.fill ?? '#000000',
            tMode: opts.tMode ?? null,
            tIntensity: opts.tIntensity ?? 0
        });
        this._addObject(o);
        this._selectionManager.updateSelectedPanel();
        this._notifyChangeSoon();
    }

    addOutlineToSelectedText() {
        const active = this._canvas.getActiveObject();
        if (!active) {
            alert('Please select a text object first');
            return;
        }

        const meta = active._wve || {};
        if (meta.type !== 'text') {
            alert('Please select a text object');
            return;
        }

        if (meta.isCurved) {
            this._objectBuilder.rebuildTextObject(active, {
                stroke: '#000000',
                strokeWidth: 2
            });
        } else {
            this._setProps(active, {
                stroke: '#000000',
                strokeWidth: 2
            });
            if (active._wve) {
                active._wve.stroke = '#000000';
                active._wve.strokeWidth = 2;
            }
        }

        this._selectionManager.updateSelectedPanel();
        this._notifyChangeSoon();
    }

    // --- State management delegation ---
    getState() { return this._stateManager.getState(); }
    getJSON() { return this._stateManager.getJSON(); }
    setState(state) { return this._stateManager.setState(state); }
    loadJSON(json) { return this._stateManager.loadJSON(json); }

    // --- Getters for sub-components ---
    getCanvas() { return this._canvas; }
    getObjects() { return this._objects; }
    getSelectionContainer() { return this._selContainer; }
    getWrapper() { return this._wrapper; }
    getCanvasElement() { return this._canvasEl; }
    getRoot() { return this._root; }

    // --- Setters for sub-components ---
    setCanvasElement(el) { this._canvasEl = el; }
    setSelectionContainer(el) { this._selContainer = el; }
    setWrapper(el) { this._wrapper = el; }

    // Build Index3-style markup inside main-area
    _buildIndex3Markup() {
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
                <canvas id="c" width="360" height="360" style="display:block"></canvas>
            </div>
        </div>`;
    }
}

export { WrapviewSVGEditor };