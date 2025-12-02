class WrapviewVariable {
    constructor(id) {
        this.id = id;
        this.guid = '';
        this.field = '';
        this.type = '';
        this.allow_customization = '';
        this._value = null;
        this._descriptor = null;
        this.default_value = null;
        this._variableSet = null;
        this._template = null;
    }

    getData(){
        return {
            id: this.id,
            guid: this.guid,
            field: this.field,
            type: this.type,
            default_value: this.default_value,
            allow_customization: this.allow_customization
        }
    }

    setSet(r) {
        this._variableSet = r;
    }
    setTemplate(t) {
        this._template = t;
    }

    value() {
        if(this._value === null) {
            return this.default_value;
        }
        return this._value;
    }
    descriptor(){
        return this._descriptor;
    }

    setDefault(v) {
        this.default_value = v;
    }

    setValue(v) {
        this._value = v;
    }

    set(d) {
        this.guid = d.guid;
        this.field = d.field;
        this.type = d.type;
        this.allow_customization = d.allow_customization ?? false
    }

    save(){
        //return Variable.setId(this.id).set(this.getData()).save(Object.keys(this.getData()));
    }
}

export {
    WrapviewVariable
}
