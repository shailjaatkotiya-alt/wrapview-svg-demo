class SelectionManager {
    constructor(editor) {
        this.editor = editor;
        this._uiBuilder = editor._uiBuilder;
        this._objectBuilder = editor._objectBuilder;
        this._colorCtx = null;
    }

    onSelection() {
        const active = this.editor.getCanvas().getActiveObject();
        this.editor.selected = active && active._wve ? active._wve.id : null;
        this.updateSelectedPanel();
    }

    updateSelectedPanel() {
        const cont = this.editor.getSelectionContainer();
        cont.innerHTML = '';
        const active = this.editor.selected ? this.editor.getObjects().get(this.editor.selected) : null;

        const title = document.createElement('div');
        title.innerHTML = `<strong>Selected:</strong> ${active ? active._wve.id : 'none'}`;
        cont.appendChild(title);

        if (!active) return;

        const panelInner = document.createElement('div');
        Object.assign(panelInner.style, { marginTop: '8px', display: 'grid', gap: '6px' });

        const type = active._wve.type;

        if (type === 'text') {
            this._buildTextPanel(active, panelInner);
        }

        cont.appendChild(panelInner);
    }

    _buildTextPanel(active, container) {
        const meta = active._wve || {};
        const isCurved = !!meta.isCurved;

        const pos = this._uiBuilder.createRow('X:');
        pos.appendChild(this._uiBuilder.createNumberInput({
            value: this.editor._getObjectAnchor(active).left,
            onInput: left => {
                if (active.type === 'group') {
                    active.setPositionByOrigin(new fabric.Point(left, this.editor._getObjectAnchor(active).top), 'center', 'center');
                    this.editor._commitRender();
                } else {
                    this.editor._setProps(active, { left });
                }
            }
        }));
        pos.appendChild(document.createTextNode(' Y: '));
        pos.appendChild(this._uiBuilder.createNumberInput({
            value: this.editor._getObjectAnchor(active).top,
            onInput: top => {
                if (active.type === 'group') {
                    active.setPositionByOrigin(new fabric.Point(this.editor._getObjectAnchor(active).left, top), 'center', 'center');
                    this.editor._commitRender();
                } else {
                    this.editor._setProps(active, { top });
                }
            }
        }));
        container.appendChild(pos);

        const textRow = this._uiBuilder.createRow('Text:');
        textRow.appendChild(this._uiBuilder.createTextInput({
            value: isCurved ? (meta.text || '') : (active.text || ''),
            onInput: v => {
                if (isCurved) this._objectBuilder.rebuildTextObject(active, { text: v });
                else { active.text = v; active._wve.text = v; this.editor._commitRender(); }
            }
        }));
        container.appendChild(textRow);

        const fontRow = this._uiBuilder.createRow('Size:');
        fontRow.appendChild(this._uiBuilder.createNumberInput({
            value: isCurved ? (meta.fontSize || 24) : (active.fontSize || 24),
            onInput: v => {
                if (isCurved) this._objectBuilder.rebuildTextObject(active, { fontSize: v });
                else { this.editor._setProps(active, { fontSize: v }); active._wve.fontSize = v; }
            }
        }));
        container.appendChild(fontRow);

        const familyRow = this._uiBuilder.createRow('Family:');
        const fontSelect = document.createElement('select');
        const fonts = [
            'Arial, sans-serif',
            'Times New Roman, serif',
            'Courier New, monospace',
            'Georgia, serif',
            'Verdana, sans-serif',
            'Trebuchet MS, sans-serif',
            'Impact, sans-serif',
            'Comic Sans MS, cursive'
        ];
        const currentFont = isCurved ? (meta.fontFamily || 'Arial, sans-serif') : (active.fontFamily || 'Arial, sans-serif');

        fonts.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f.split(',')[0];
            if (f === currentFont) opt.selected = true;
            fontSelect.appendChild(opt);
        });

        fontSelect.addEventListener('change', e => {
            const v = e.target.value;
            if (isCurved) this._objectBuilder.rebuildTextObject(active, { fontFamily: v });
            else { this.editor._setProps(active, { fontFamily: v }); active._wve.fontFamily = v; }
        });
        Object.assign(fontSelect.style, { width: '100%', marginTop: '4px' });
        familyRow.appendChild(fontSelect);
        container.appendChild(familyRow);

        const styleRow = this._uiBuilder.createRow('Style:');
        Object.assign(styleRow.style, { display: 'flex', gap: '12px', alignItems: 'center' });

        // Bold
        const boldLabel = document.createElement('label');
        const boldCheck = document.createElement('input');
        boldCheck.type = 'checkbox';
        const currentWeight = isCurved ? (meta.fontWeight || 'normal') : (active.fontWeight || 'normal');
        boldCheck.checked = currentWeight === 'bold';
        boldCheck.addEventListener('change', e => {
            const v = e.target.checked ? 'bold' : 'normal';
            if (isCurved) this._objectBuilder.rebuildTextObject(active, { fontWeight: v });
            else { this.editor._setProps(active, { fontWeight: v }); active._wve.fontWeight = v; }
        });
        boldLabel.appendChild(boldCheck);
        boldLabel.appendChild(document.createTextNode(' Bold'));
        styleRow.appendChild(boldLabel);

        // Italic
        const italicLabel = document.createElement('label');
        const italicCheck = document.createElement('input');
        italicCheck.type = 'checkbox';
        const currentStyle = isCurved ? (meta.fontStyle || 'normal') : (active.fontStyle || 'normal');
        italicCheck.checked = currentStyle === 'italic';
        italicCheck.addEventListener('change', e => {
            const v = e.target.checked ? 'italic' : 'normal';
            if (isCurved) this._objectBuilder.rebuildTextObject(active, { fontStyle: v });
            else { this.editor._setProps(active, { fontStyle: v }); active._wve.fontStyle = v; }
        });
        italicLabel.appendChild(italicCheck);
        italicLabel.appendChild(document.createTextNode(' Italic'));
        styleRow.appendChild(italicLabel);

        container.appendChild(styleRow);

        this._appendColorPicker(active, 'text', container, meta, isCurved);
        this._appendStrokeControls(active, container, meta, isCurved);
        this._appendTransformationControls(active, container, meta);
    }

    _appendColorPicker(active, type, container, meta = null, isCurved = false) {
        const colorRow = this._uiBuilder.createRow('Color:');
        const cIn = document.createElement('input');
        const currentFill = (() => {
            if (type === 'text') {
                if (isCurved) return meta.fill || '#000000';
                return active.fill || meta.fill || '#000000';
            }
            return active.fill || '#000000';
        })();
        cIn.type = 'color';
        cIn.value = this._asHexColor(currentFill);
        cIn.style.width = '60px';
        cIn.style.padding = 0;
        cIn.style.border = 0;
        cIn.addEventListener('input', e => {
            const v = e.target.value;
            if (type === 'text') {
                if (isCurved) {
                    this._objectBuilder.rebuildTextObject(active, { fill: v });
                } else {
                    this.editor._setProps(active, { fill: v });
                    if (active._wve) active._wve.fill = v;
                }
            } else {
                this.editor._setProps(active, { fill: v });
                if (active._wve) active._wve.fill = v;
            }
        });
        colorRow.appendChild(cIn);
        container.appendChild(colorRow);
    }

    _appendStrokeControls(active, container, meta, isCurved) {
        const strokeRow = this._uiBuilder.createRow('Outline:');
        const strokeColorInput = document.createElement('input');
        strokeColorInput.type = 'color';
        strokeColorInput.value = this._asHexColor(meta.stroke || (active.stroke || '#000000'));
        strokeColorInput.style.width = '60px';
        strokeColorInput.style.padding = '0';
        strokeColorInput.style.border = '0';

        const strokeWidthInput = this._uiBuilder.createNumberInput({
            value: meta.strokeWidth || (active.strokeWidth || 0),
            width: 50,
            onInput: v => {
                if (isCurved) {
                    this._objectBuilder.rebuildTextObject(active, { strokeWidth: v });
                } else {
                    this.editor._setProps(active, { strokeWidth: v });
                    if (active._wve) active._wve.strokeWidth = v;
                }
            }
        });

        strokeColorInput.addEventListener('input', e => {
            const v = e.target.value;
            if (isCurved) {
                this._objectBuilder.rebuildTextObject(active, { stroke: v });
            } else {
                this.editor._setProps(active, { stroke: v });
                if (active._wve) active._wve.stroke = v;
            }
        });

        strokeRow.appendChild(strokeColorInput);
        strokeRow.appendChild(document.createTextNode(' Width: '));
        strokeRow.appendChild(strokeWidthInput);
        container.appendChild(strokeRow);
    }

    _appendTransformationControls(active, container, meta) {
        const tBox = document.createElement('div');
        Object.assign(tBox.style, { padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' });
        const tTitle = document.createElement('div');
        tTitle.innerHTML = '<strong>Transformation</strong>';
        tBox.appendChild(tTitle);

        const modesRow = document.createElement('div');
        Object.assign(modesRow.style, { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' });

        const mkMode = (label, mode) => {
            const b = this._uiBuilder.createButtonElement(label, () => {
                if (mode === null || mode === 'none') this._objectBuilder.rebuildTextObject(active, { tMode: null, tIntensity: 0 });
                else this._objectBuilder.rebuildTextObject(active, { tMode: mode });
            });
            const curr = meta.tMode || null;
            if (curr === mode || (curr === null && mode === 'none')) b.style.background = '#dbeafe';
            Object.assign(b.style, { fontSize: '12px', padding: '4px 8px' });
            return b;
        };

        modesRow.appendChild(mkMode('None', 'none'));
        modesRow.appendChild(mkMode('Arch', 'arch'));
        modesRow.appendChild(mkMode('Bridge', 'bridge'));
        modesRow.appendChild(mkMode('Bulge', 'bulge'));
        modesRow.appendChild(mkMode('Flag', 'flag'));
        modesRow.appendChild(mkMode('Valley', 'valley'));
        modesRow.appendChild(mkMode('Distort', 'distort'));
        modesRow.appendChild(mkMode('Circle', 'circle'));
        tBox.appendChild(modesRow);

        const intensityRow = document.createElement('div');
        Object.assign(intensityRow.style, { display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' });

        const intensityLabel = document.createElement('span');
        intensityLabel.textContent = 'Intensity:';
        intensityRow.appendChild(intensityLabel);

        const applyIntensity = (nextVal) => {
            const clamped = this._objectBuilder._clampIntensity(nextVal, meta.tIntensity || 0);
            const currMode = (active._wve && active._wve.tMode) || null;
            if (!currMode) {
                if (active._wve) active._wve.tIntensity = clamped;
                return;
            }
            this._objectBuilder.rebuildTextObject(active, { tIntensity: clamped, tMode: currMode });
        };

        const changeIntensity = (delta) => {
            const current = active._wve ? this._objectBuilder._clampIntensity(active._wve.tIntensity || 0) : 0;
            applyIntensity(current + delta);
        };

        const decBtn = this._uiBuilder.createButtonElement('-', () => changeIntensity(-5));
        const incBtn = this._uiBuilder.createButtonElement('+', () => changeIntensity(5));

        const intensityInput = this._uiBuilder.createNumberInput({
            value: this._objectBuilder._clampIntensity(meta.tIntensity || 0),
            width: 60,
            onInput: v => applyIntensity(v)
        });
        intensityInput.min = -100;
        intensityInput.max = 100;
        intensityInput.step = 5;

        const hasMode = !!(active._wve && active._wve.tMode);
        [decBtn, incBtn, intensityInput].forEach(el => {
            el.disabled = !hasMode;
            el.style.minWidth = hasMode ? '' : '36px';
        });

        intensityRow.appendChild(decBtn);
        intensityRow.appendChild(intensityInput);
        intensityRow.appendChild(incBtn);
        tBox.appendChild(intensityRow);

        const actRow = document.createElement('div');
        Object.assign(actRow.style, { display: 'flex', gap: '8px', marginTop: '6px' });
        const resetBtn = this._uiBuilder.createButtonElement('Reset', () => {
            this._objectBuilder.rebuildTextObject(active, { tMode: null, tIntensity: 0 });
        });
        actRow.appendChild(resetBtn);
        tBox.appendChild(actRow);

        container.appendChild(tBox);
    }

    _asHexColor(c) {
        if (!c) return '#000000';
        if (c.startsWith('#')) return c;
        if (!this._colorCtx) {
            const cvs = document.createElement('canvas');
            this._colorCtx = cvs.getContext('2d');
        }
        const ctx = this._colorCtx;
        ctx.fillStyle = c;
        return ctx.fillStyle || '#000000';
    }
}

export { SelectionManager };