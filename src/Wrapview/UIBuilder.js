class UIBuilder {
    constructor(editor) {
        this.editor = editor;
    }

    buildShell() {
        const root = this.editor.getRoot();
        root.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'wve-wrapper';
        Object.assign(wrapper.style, { display: 'flex', gap: '12px', flexDirection: 'column', position: 'relative' });
        this.editor.setWrapper(wrapper);

        const box = document.createElement('div');
        box.className = 'wve-canvas-box';
        Object.assign(box.style, { border: '1px solid #ccc', background: '#fff', position: 'relative', width: '360px', height: '360px' });

        const canvas = document.createElement('canvas');
        canvas.id = `${this.editor._instance.id}-fabric`;
        canvas.width = 360;
        canvas.height = 360;
        canvas.style.display = 'block';
        canvas.style.userSelect = 'none';
        box.appendChild(canvas);
        wrapper.appendChild(box);

        const panel = document.createElement('div');
        panel.className = 'wve-panel';
        Object.assign(panel.style, { minWidth: '260px', display: 'flex' });

        const btnRow = document.createElement('div');
        btnRow.className = 'wve-btn-row';
        Object.assign(btnRow.style, { display: 'flex', gap: '8px', marginBottom: '8px', flexDirection: 'column' });

        const selContainer = document.createElement('div');
        selContainer.className = 'wve-sel-container';
        Object.assign(selContainer.style, { marginTop: '8px' });

        [this._createAddOutlineBtn(), this._createAddTextBtn(), this._createClearBtn(), selContainer].forEach(n => btnRow.appendChild(n));
        panel.appendChild(btnRow);
        wrapper.appendChild(panel);
        root.appendChild(wrapper);

        this.editor.setCanvasElement(canvas);
        this.editor.setSelectionContainer(selContainer);
    }

    _createAddOutlineBtn() {
        return this._createButton('wve-add-outline', 'Add Outline', () =>
            this.editor.addOutlineToSelectedText()
        );
    }

    _createAddTextBtn() {
        return this._createButton('wve-add-text', 'Add Text', () =>
            this.editor.addText({ left: 80, top: 160, text: 'Sample', fontSize: 24 })
        );
    }

    _createClearBtn() {
        return this._createButton('wve-clear', 'Clear', () => {
            this.editor._clearAll();
        });
    }

    _createButton(cls, text, onClick) {
        const b = document.createElement('button');
        b.className = `wve-btn ${cls}`;
        b.textContent = text;
        b.addEventListener('click', onClick);
        return b;
    }

    createElement(tag, props = {}, style = {}) {
        const el = document.createElement(tag);
        Object.assign(el, props);
        Object.assign(el.style, style);
        return el;
    }

    createNumberInput({ value, width = 80, onInput }) {
        const input = this.createElement('input', { type: 'number', value: String(Math.round(value)) }, { width: width + 'px' });
        input.addEventListener('input', (e) => onInput(this.editor._safeNumber(e.target.value, value)));
        return input;
    }

    createTextInput({ value, width = 180, onInput }) {
        const input = this.createElement('input', { type: 'text', value: value }, { width: width + 'px' });
        input.addEventListener('input', (e) => onInput(e.target.value));
        return input;
    }

    createButtonElement(label, onClick) {
        const b = this.createElement('button', { className: 'wve-btn', textContent: label });
        b.addEventListener('click', onClick);
        return b;
    }

    createRow(labelText) {
        const row = this.createElement('label');
        if (labelText) row.appendChild(document.createTextNode(labelText + ' '));
        return row;
    }
}

export { UIBuilder };