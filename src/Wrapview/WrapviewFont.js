export class WrapviewFont {
    constructor(props) {
        this.family = props.family;
        this.source = props.source;
        this.loaded = false;
        this.variant = props.variant || 'regular';
    }

    setTemplate(t) {
        this._template = t;
    }

    getData() {
        return {
            family: this.family,
            source: this.source,
            variant: this.variant
        }
    }

    async getFontUrl(key) {
        if (this.source === "google") {
            console.log('Fetching font:', this.family, this.variant);
            if (!key) throw new Error('Missing GOOGLE_FONTS_API_KEY');
            if (!this.family) throw new Error('family is required');
            const res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?family=${this.family}&key=${encodeURIComponent(key)}&sort=alpha`);

            if (!res.ok) throw new Error(`Webfonts API error: ${res.status} ${res.statusText}`);
            const data = await res.json();

            const url = data.items[0].files[this.variant] ? data.items[0].files[this.variant] : data.items[0].files["regular"];
            if (!url) throw new Error(`No URL for variant ${this.variant}`);
            return url;
        }
    }
}