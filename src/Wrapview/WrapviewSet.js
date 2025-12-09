import { WrapviewVariable } from "./WrapviewVariable";
import { WrapviewFont } from "./WrapviewFont";

class WrapviewSet {
    constructor(t) {
        this._data = {};
        this._template = t || null;
    }

    first() {
        var first_key = Object.keys(this._data)[0];
        return this._data[first_key];
    }

    setTemplate(t) {
        this._template = t;
    }

    all() {
        return this._data;
    }

    filter(needle, key) {
        const s = needle.toLowerCase().trim();
        if (s === '') {
            return this._data;
        }
        var values = Object.values(this._data);
        return values.filter((a) => {
            return a.hasOwnProperty(key) && a[key].toLowerCase().indexOf(s) !== -1
        });
    }

    keys() {
        return Object.keys(this._data);
    }

    count() {
        return Object.keys(this._data).length;
    }

    has(id) {
        return this._data.hasOwnProperty(id);
    }

    add(key, value) {
        this._data[key] = value;
        if (this._template !== null) {
            this._data[key].setTemplate(this._template);
        }
    }

    remove(key) {
        delete this._data[key];
    }

    set(k, v) {
        this._data[k] = v;
    }
    get(k) {
        if (this._data.hasOwnProperty(k)) {
            return this._data[k];
        }
        return null;
    }

    fetch(f, v) {
        var rows = [];
        Object.keys(this._data).forEach((k) => {
            var row = this._data[k];
            if (row[f] && row[f] === v) {
                rows.push(row);
            }
        });
        return rows;
    }
}

export class WrapviewMaterialSet extends WrapviewSet {
    constructor(t) {
        super(t);
    }

    render() {
        Object.keys(this._data).forEach((k) => {
            var row = this._data[k];
            if (row.texture) {
                row?.texture()?.beginEditing();
                row?.texture()?.endEditing();
            }

        });
    }
}

export class WrapviewVariableSet extends WrapviewSet {
    constructor(t) {
        super(t);
    }

    load__deprecated() {
        var variables = this._template.getVariables();
        if (variables) {
            variables.forEach((v) => {
                var variable = new WrapviewVariable(v.value('id'));
                variable.set({
                    guid: v.value('guid'),
                    field: v.value('field'),
                    label: v.value('label'),
                    caption: v.value('caption'),
                    type: v.value('type')
                });
                variable.setDefault(v.defaultValue());
                variable.setValue(v.currentValue());
                this.add(v.value('guid'), variable);
            });
        }
    }
}

export class WrapviewFontSet extends WrapviewSet {
    constructor(t) {
        super(t);
    }

    load(fonts) {
        if (fonts) {
            fonts.forEach((f) => {
                var font = new WrapviewFont({
                    family: f.value('name'),
                    source: f.value('source')
                });
                this.add(f.value('id'), font);
            });
        }
    }

}