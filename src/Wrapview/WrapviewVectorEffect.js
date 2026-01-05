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
        this.BASELINE_OFFSET = 100;
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
            case 'buldge':
                this._applyBuldgeEffect();
                break;
            case 'pinch':
                this._applyPinchEffect();
                break;
            case 'valley':
                this._applyValleyEffect();
                break;
            case 'bridge':
                this._applyBridgeEffect();
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
        const pathD = `M0,${this.FONT_SIZE} C${this.FONT_SIZE / 2},40 ${this.SVG_SIZE},40 ${this.SVG_SIZE},${this.FONT_SIZE}`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'arch');
    }

    _applyFlagEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,0 Q${this.SVG_SIZE / 4},-25 ${this.SVG_SIZE / 2},0 T${this.SVG_SIZE}, 0`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'flag');
    }

    _applyBuldgeEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,0 Q${this.SVG_SIZE / 4},-25 ${this.SVG_SIZE / 2},0`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'buldge');

    }

    _applyPinchEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,0 Q${this.SVG_SIZE / 4},-25 ${this.SVG_SIZE / 2},0 T${this.SVG_SIZE}, 0`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'pinch');

    }

    _applyValleyEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,${this.FONT_SIZE} Q${this.SVG_SIZE / 2},${this.FONT_SIZE + 50} ${this.SVG_SIZE},${this.FONT_SIZE}`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'valley');
    }

    _applyBridgeEffect() {
        const { group, groupHeight, groupWidth } = this._getTextGroup();
        const pathD = `M0,${this.FONT_SIZE} Q${this.SVG_SIZE / 2},${this.FONT_SIZE - 50} ${this.SVG_SIZE},${this.FONT_SIZE}`;
        this._warpText(pathD, group, groupHeight, groupWidth, 'bridge');
    }

    _warpText(pathD, group, groupHeight, groupWidth, effectType) {
        try {
            if (effectType !== 'none') {
                this._path = this.root.path(pathD).attr({ id: 'warpPath', fill: 'none', stroke: '#00ff00' });
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
        const normalizedY = (y - (h / 2)) / (h / 2);
        // Formula: (y - h) / h where values range from 0-1

        switch (effectType) {
            case 'buldge':
                return y + (normalizedY * baseWarp);
            case 'pinch':
                return y - (normalizedY * baseWarp);
            case 'arch':
                return y + this._path.pointAt(x).y - (this.BASELINE_OFFSET);
            case 'flag':
                return y + this._path.pointAt(x).y - (this.BASELINE_OFFSET);
            case 'valley':
                return y + ((y - h) / h) * baseWarp;
            case 'bridge':
                return y - ((y - h) / h) * baseWarp;
            default:
                return y;
        }
    }
}

export { WrapviewVectorEffect };
