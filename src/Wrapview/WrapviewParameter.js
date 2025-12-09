export class WrapviewParameter {
    constructor(material, id, v) {
        this._material = material;
        if (this._material) {
            this._material.parameters.push(this);
        }
        this.id = id;
        this._type = 'fixed';
        this._value = null;
        this._key = null;
        this._descriptor = null;
        if (typeof v !== "undefined") {
            this.set(v);
        }

    }

    getData() {
        var d = {
            type: this._type,
            value: this._value
        };
        if (this._key !== null) {
            d.key = this._key;
        }
        if (this._descriptor !== null) {
            d.descriptor = this._descriptor;
        }
        return d;
    }

    set(v) {
        this._type = v.type;
        this._key = v.hasOwnProperty('key') ? v.key : null;
        this._descriptor = v.hasOwnProperty('descriptor') ? v.descriptor : null;
        this._value = v.value;
    }

    setValue(v) {
        this._value = v;
    }

    setDescriptor(v) {
        this._descriptor = v;
    }

    attachToVariable(id) {
        this._type = 'variable';
        this._key = id;
    }

    isAttachedTo(id) {
        if (this._type !== 'variable') {
            return false;
        }
        if (this._key === id) {
            return true;
        }
        return false;
    }

    inheritFrom(id) {
        this._type = 'inherited';
        this._key = id;
    }

    unlock() {
        this._type = 'fixed'
        this._key = null;
    }

    value() {
        if (this._type === 'variable') {
            this._value = this._material.getVariableValue(this._key, this);
        } else if (this._type === 'inherited') {
            this._value = this._material.getInheritedValue(this._key, this.id);
        }
        return this._value;
    }

    descriptor() {
        if (this._type === 'variable') {
            this._descriptor = this._material.getVariableDescriptor(this._key, this);
        } else if (this._type === 'inherited') {
            this._descriptor = this._material.getInheritedDescriptor(this._key, this.id);
        }
        return this._descriptor;
    }
}