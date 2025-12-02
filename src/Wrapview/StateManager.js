class StateManager {
    constructor(editor) {
        this.editor = editor;
    }

    getState() {
        const items = [];
        for (const [, obj] of this.editor.getObjects()) {
            items.push(this._captureObject(obj));
        }
        return {
            v: 1,
            canvas: { width: this.editor.getCanvas() ? this.editor.getCanvas().getWidth() : 360, height: this.editor.getCanvas() ? this.editor.getCanvas().getHeight() : 360 },
            items
        };
    }

    getJSON() {
        return JSON.stringify(this.getState());
    }

    setState(state) {
        if (!state || !Array.isArray(state.items)) return;
        this._removeAll();
        const items = state.items || [];
        items.forEach(spec => {
            const obj = this._createFromSpec(spec);
            if (obj) this.editor._addObject(obj);
        });
        this.editor.getCanvas().discardActiveObject();
        this.editor.selected = null;
        this.editor._selectionManager.updateSelectedPanel();
        this.editor._commitRender();
    }

    loadJSON(json) {
        try {
            const state = JSON.parse(json);
            this.setState(state);
        } catch (e) {
            console.warn('Invalid state JSON', e);
        }
    }

    _removeAll() {
        if (!this.editor.getCanvas()) return;
        this.editor.getCanvas().getObjects().forEach(o => this.editor.getCanvas().remove(o));
        this.editor.getObjects().clear();
    }

    _captureObject(obj) {
        const meta = obj._wve || {};
        const type = meta.type;
        if (type === 'text') {
            const anchor = this.editor._getObjectAnchor(obj);
            if (meta.isCurved) {
                return {
                    id: meta.id,
                    type: 'text',
                    curved: true,
                    left: anchor.left,
                    top: anchor.top,
                    text: meta.text || '',
                    fontSize: meta.fontSize || 24,
                    fontFamily: meta.fontFamily || 'Arial, sans-serif',
                    fontWeight: meta.fontWeight || 'normal',
                    fontStyle: meta.fontStyle || 'normal',
                    fill: meta.fill || '#000000',
                    stroke: meta.stroke,
                    strokeWidth: meta.strokeWidth,
                    tMode: meta.tMode || null,
                    tIntensity: meta.tIntensity || 0
                };
            } else {
                return {
                    id: meta.id,
                    type: 'text',
                    curved: false,
                    left: anchor.left,
                    top: anchor.top,
                    text: obj.text || meta.text || '',
                    fontSize: obj.fontSize || meta.fontSize || 24,
                    fontFamily: obj.fontFamily || meta.fontFamily || 'Arial, sans-serif',
                    fontWeight: obj.fontWeight || meta.fontWeight || 'normal',
                    fontStyle: obj.fontStyle || meta.fontStyle || 'normal',
                    fill: obj.fill || meta.fill || '#000000',
                    stroke: obj.stroke || meta.stroke,
                    strokeWidth: obj.strokeWidth || meta.strokeWidth,
                    tMode: meta.tMode || null,
                    tIntensity: meta.tIntensity || 0
                };
            }
        }
        return null;
    }

    _createFromSpec(spec) {
        if (!spec || !spec.type) return null;
        if (spec.type === 'text') {
            return this.editor._objectBuilder.createText({
                id: spec.id || `text-${Date.now()}`,
                left: this.editor._safeNumber(spec.left, 50),
                top: this.editor._safeNumber(spec.top, 50),
                text: spec.text ?? '',
                fontSize: this.editor._safeNumber(spec.fontSize, 24),
                fontFamily: spec.fontFamily ?? 'Arial, sans-serif',
                fontWeight: spec.fontWeight ?? 'normal',
                fontStyle: spec.fontStyle ?? 'normal',
                fill: spec.fill ?? '#000000',
                stroke: spec.stroke,
                strokeWidth: this.editor._safeNumber(spec.strokeWidth, 0),
                tMode: spec.tMode ?? (spec.curved ? 'arch' : null),
                tIntensity: this.editor._safeNumber(spec.tIntensity, 0)
            });
        }
        return null;
    }
}

export { StateManager };