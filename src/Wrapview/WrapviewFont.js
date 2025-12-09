export class WrapviewFont {
    constructor(props) {
        this.family = props.family;
        this.source = props.source;
        this.loaded = false;
    }

    setTemplate(t) {
        this._template = t;
    }

    getData() {
        return {
            family: this.family,
            source: this.source
        }
    }
}