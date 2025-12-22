
export async function getFontTtfUrl({ key, family, size }) {
    console.log('Fetching font:', family, size);
    if (!key) throw new Error('Missing GOOGLE_FONTS_API_KEY');
    if (!family) throw new Error('family is required');
    const res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?family=${family}&key=${encodeURIComponent(key)}&sort=alpha`);

    if (!res.ok) throw new Error(`Webfonts API error: ${res.status} ${res.statusText}`);
    const data = await res.json();

    const url = data.items[0].files[size] ? data.items[0].files[size] : data.items[0].files["regular"];
    if (!url) throw new Error(`No URL for variant ${size}`);
    return url;
}

class WrapviewVectorEffect {
    constructor(textSvg, effectName, effectParameters = {}) {
        this.textSvg = textSvg;
        this.effectName = effectName || 'none';
        this.effectParameters = effectParameters
        this._path = null;
        this.svgElement = null;
        this.root = null;
        this.SVG_SIZE = 600;
        this.FONT_SIZE = 100
        this.BASELINE_OFFSET = 80;
        this._applyEffect();
    }

    _applyEffect() {
        switch (this.effectName) {
            case 'none':
                this._applyNoneEffect();
                break;
            case 'arch':
                this._applyArchEffect();
                break;
            case 'flag':
                this._applyFlagEffect();
                break;
            case 'bulge':
                this._applyBulgeEffect();
                break;
            case 'pinch':
                this._applyPinchEffect();
                break;
            default:
                console.warn(`Unknown effect: ${this.effectName}, using 'none'`);
                this._applyNoneEffect();
        }
    }

    _getTextGroup() {
        if (!this.textSvg) return null;
        const draw = SVG(this.textSvg).addClass('Main');
        draw.size(this.SVG_SIZE, this.SVG_SIZE);
        draw.id('viewportSvg');

        this.svgElement = draw.node;
        this.root = draw;

        const group = draw.children()[0];
        if (group) {
            group.id('svgGroup');
            const bbox = group.getBBox ? group.getBBox() : group.bbox();
            const groupHeight = bbox.height || 0;
            const groupWidth = bbox.width || 0;
            return { group, groupHeight, groupWidth };
        }
    }

    _applyNoneEffect() {
        const draw = SVG(this.textSvg).addClass('Main');
        draw.size(this.SVG_SIZE, this.SVG_SIZE);
        draw.id('viewportSvg');
        this.svgElement = draw.node;
        this.root = draw;
        return this.textSvg;
    }

    _applyArchEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,${this.FONT_SIZE} C${this.FONT_SIZE / 2},20 ${this.SVG_SIZE},20 ${this.SVG_SIZE},${this.FONT_SIZE}`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'arch');
    }

    _applyFlagEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,0 Q${this.SVG_SIZE / 4},-25 ${this.SVG_SIZE / 2},0 T${this.SVG_SIZE}, 0`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'flag');
    }

    _applyBulgeEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,0 Q${this.SVG_SIZE / 4},-25 ${this.SVG_SIZE / 2},0`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'bulge');

    }

    _applyPinchEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,0 Q${this.SVG_SIZE / 4},-25 ${this.SVG_SIZE / 2},0 T${this.SVG_SIZE}, 0`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'pinch');

    }

    _warpText(pathD, group, groupHeight, groupWidth, effectType) {
        try {
            if (effectType !== 'none') {
                this._path = this.root.path(pathD).attr({ id: 'warpPath', fill: 'none', stroke: 'none' });
                const warp = new Warp(group ? group.node : this.root.node);
                warp.interpolate(20);
                warp.transform(([x, y]) => [x, this._getWarpedY(x, y, groupHeight, groupWidth, effectType)]);
            }
        } catch (error) {
            console.warn(`Failed to apply warp for ${effectType} effect:`, error);
        }
    }

    _getWarpedY(x, y, h, w, effectType, intensity = 1) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return y;
        const normalizedX = x / w;
        const baseWarp = Math.sin(normalizedX * Math.PI) * (h / 4) * intensity;
        console.log('baseWarp:', baseWarp, this._path.pointAt(x));
        const normalizedY = (y - (h / 2)) / (h / 2);
        switch (effectType) {
            case 'bulge':
                return y + (normalizedY * baseWarp);
            case 'pinch':
                return y - (normalizedY * baseWarp);
            case 'arch':
                return y + this._path.pointAt(x).y - this.BASELINE_OFFSET;
            case 'flag':
                return y + this._path.pointAt(x).y - this.BASELINE_OFFSET;
            default:
                return y;
        }
    }
}

export { WrapviewVectorEffect };
