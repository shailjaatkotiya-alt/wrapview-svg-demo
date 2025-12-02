import { WrapviewUtils } from "./WrapviewUtils.js";
import { WrapviewSettings } from "./WrapviewSettings.js";
import { WrapviewParameter } from "./WrapviewParameter.js";
import { WrapviewVectorImage } from "./WrapviewVector.js";

class WrapviewSvgLayer {
    constructor(id, settings) {
        this.id = id;
        this._loaded = false;
        this.settings = {};
        this.isLocked = false;
        this._texture = null;
        this._svgData = null;
        this._canvas = null;
        this._context = null;
        this._bounds = null;
        this._vectorShape = null;

        _.assign(this.settings, this.defaults(), settings);
        this._initCanvas();
    }

    _initCanvas() {
        this._canvas = document.createElement('canvas');
        this._context = this._canvas.getContext('2d');
        this._canvas.setAttribute('id', this.id + '-svg-canvas');
    }

    defaults() {
        return {
            size: null,
            pivot: {
                x: 0.5,
                y: 0.5
            },
            position: {
                x: 0,
                y: 0
            },
            angle: 0,
            ratio: 1,
            color: null,
            scaleUsing: 'width'
        }
    }

    name() {
        return 'SVG';
    }

    lock() {
        this.isLocked = true;
    }

    unlock() {
        this.isLocked = false;
    }

    setPosition(pos) {
        var x = parseFloat(parseFloat(pos.x).toFixed(2));
        var y = parseFloat(parseFloat(pos.y).toFixed(2));
        _.assign(this.settings.position, {}, {
            x: x,
            y: y
        });
        this.setNeedsUpdate();
    }

    setAngle(a) {
        this.settings.angle = a;
        this.setNeedsUpdate();
    }

    setTexture(t) {
        this._texture = t;
    }

    setNeedsUpdate() {
        if (this._texture === null) return;
        this._texture.render();
    }

    getData() {
        var d = {
            type: 'WrapviewSvgLayer',
            data: {
                svgData: this._svgData,
            },
            settings: {
                size: this.settings.size,
                pivot: this.settings.pivot,
                position: this.settings.position,
                angle: this.settings.angle,
                color: this.settings.color?.getData(),
                scaleUsing: this.settings.scaleUsing
            }
        };
        return d;
    }

    applySettings(s, m) {
        this.settings.size = s.size;
        this.settings.pivot = s.pivot;
        this.settings.position = s.position;
        this.settings.angle = s.angle;
        this.settings.scaleUsing = s.scaleUsing ? s.scaleUsing : 'width';
        if (!s.hasOwnProperty('color') || s.color === null) {
            this.settings.color = null;
        } else {
            var c = new WrapviewParameter(m, 'color');
            c.set(s.color);
            this.settings.color = c;
        }
    }

    color() {
        return this.settings.color;
    }

    setColorParameter(color) {
        this.settings.color = color;
        this.setNeedsUpdate();
    }

    setColor(colorValue, descriptor) {
        this.settings.color.setValue(colorValue);
        this.settings.color.setDescriptor(descriptor);
        this.setNeedsUpdate();
    }

    setPivot(p) {
        _.assign(this.settings.pivot, {}, p);
        this.setNeedsUpdate();
    }

    setSize(o) {
        var width = o.width || -1;
        var height = o.height || -1;

        if (width === -1 && height !== -1) {
            width = height * this.settings.ratio;
        } else if (width !== -1 && height === -1) {
            height = width / this.settings.ratio;
        } else {
            width = this.settings.size.width;
            height = this.settings.size.height;
        }

        this.settings.size = {
            width: parseFloat(parseFloat(width).toFixed(2)),
            height: parseFloat(parseFloat(height).toFixed(2))
        };
        this.setNeedsUpdate();
    }

    load(data) {
        this._svgData = data.svgData;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this._loaded = true;
                this.settings.ratio = (img.width / img.height);
                if (this.settings.size === null) {
                    this.settings.size = {
                        width: img.width,
                        height: img.height
                    }
                }

                // Set canvas size
                this._canvas.width = this.settings.size.width;
                this._canvas.height = this.settings.size.height;

                // Draw SVG to canvas
                this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
                this._context.drawImage(img, 0, 0, this._canvas.width, this._canvas.height);

                resolve(this._canvas);
            };
            img.onerror = (error) => {
                console.error('Failed to load SVG:', error);
                reject(error);
            };

            // Convert SVG data to blob URL if it's base64 or raw SVG
            if (this._svgData.startsWith('data:')) {
                img.src = this._svgData;
            } else if (this._svgData.startsWith('<svg')) {
                const blob = new Blob([this._svgData], { type: 'image/svg+xml' });
                img.src = URL.createObjectURL(blob);
            } else {
                img.src = this._svgData;
            }
        });
    }

    // Bounds calculation methods
    _lower(s, v) {
        var a = _.cloneDeep(v);
        if (this._bounds[s].x < a.x) {
            a.x = this._bounds[s].x;
        }
        if (this._bounds[s].y < a.y) {
            a.y = this._bounds[s].y;
        }
        return a;
    }

    _greater(s, v) {
        var a = _.cloneDeep(v);
        if (this._bounds[s].x > a.x) {
            a.x = this._bounds[s].x;
        }
        if (this._bounds[s].y > a.y) {
            a.y = this._bounds[s].y;
        }
        return a;
    }

    isScale(point) {
        if (!this._bounds) return false;
        var min = this._bounds.rbc;
        min = this._lower('rbb', min);
        var max = this._bounds.rbc;
        max = this._greater('rbb', max);
        if (point.x > min.x && point.y > min.y && point.x < max.x && point.y < max.y) {
            return true;
        }
        return false;
    }

    isRotation(point) {
        if (!this._bounds) return false;
        var min = this._bounds.rtc;
        min = this._lower('rtb', min);
        var max = this._bounds.rtc;
        max = this._greater('rtb', max);
        if (point.x > min.x && point.y > min.y && point.x < max.x && point.y < max.y) {
            return true;
        }
        return false;
    }

    isDelete(point) {
        if (!this._bounds) return false;
        var min = this._bounds.ltc;
        min = this._lower('ltb', min);
        var max = this._bounds.ltc;
        max = this._greater('ltb', max);
        if (point.x > min.x && point.y > min.y && point.x < max.x && point.y < max.y) {
            return true;
        }
        return false;
    }

    isInBounds(point) {
        if (!this._bounds) return false;
        var min = this._bounds.rb;
        min = this._lower('rt', min);
        min = this._lower('lb', min);
        min = this._lower('lt', min);
        var max = this._bounds.rb;
        max = this._greater('rt', max);
        max = this._greater('lb', max);
        max = this._greater('lt', max);
        if (point.x > min.x && point.y > min.y && point.x < max.x && point.y < max.y) {
            return true;
        }
        return false;
    }

    _calculateBounds() {
        if (!this._loaded) return;

        var pivot = {
            x: this.settings.position.x,
            y: this.settings.position.y
        };

        // Calculate bounds (simplified version)
        var rightBottomCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width - (this.settings.size.width * this.settings.pivot.x),
            y: this.settings.size.height - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightBottomBoundCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 50 - (this.settings.size.width * this.settings.pivot.x),
            y: this.settings.size.height + 50 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightBottomOuterCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 100 - (this.settings.size.width * this.settings.pivot.x),
            y: this.settings.size.height + 100 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightTopCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width - (this.settings.size.width * this.settings.pivot.x),
            y: 0 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightTopBoundCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 50 - (this.settings.size.width * this.settings.pivot.x),
            y: -50 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightTopOuterCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 100 - (this.settings.size.width * this.settings.pivot.x),
            y: -100 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftTopCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: 0 - (this.settings.size.width * this.settings.pivot.x),
            y: 0 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftTopBoundCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: -50 - (this.settings.size.width * this.settings.pivot.x),
            y: -50 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftTopOuterCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: -100 - (this.settings.size.width * this.settings.pivot.x),
            y: -100 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftBottomCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: 0 - (this.settings.size.width * this.settings.pivot.x),
            y: this.settings.size.height - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - this.settings.angle), {
            x: -pivot.x,
            y: -pivot.y
        });

        this._bounds = {
            rb: rightBottomCorner,
            rbb: rightBottomBoundCorner,
            rbc: rightBottomOuterCorner,
            rt: rightTopCorner,
            lb: leftBottomCorner,
            ltb: leftTopBoundCorner,
            ltc: leftTopOuterCorner,
            lt: leftTopCorner,
            rtb: rightTopBoundCorner,
            rtc: rightTopOuterCorner
        };
    }

    draw(context) {
        if (!this._loaded) return;
        this._calculateBounds();

        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);

        // Draw the SVG canvas content
        context.drawImage(this._canvas,
            -this.settings.size.width * this.settings.pivot.x,
            -this.settings.size.height * this.settings.pivot.y,
            this.settings.size.width, this.settings.size.height);

        // Apply color overlay if specified
        if (this.settings.color !== null) {
            context.globalCompositeOperation = 'source-atop';
            context.fillStyle = this.settings.color.value();
            context.fillRect(-this.settings.size.width * this.settings.pivot.x,
                -this.settings.size.height * this.settings.pivot.y,
                this.settings.size.width, this.settings.size.height);
        }

        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();
    }

    drawHandles(context, editor) {
        if (!this._loaded) return;

        editor._div.innerHTML = '';
        var layerDiv = document.createElement('div');
        layerDiv.className = 'absolute border border-dashed border-slate-600 drop-shadow-xl';
        layerDiv.style.left = (this.settings.position.x - this.settings.size.width * this.settings.pivot.x - 50) * 0.23876 + 'px';
        layerDiv.style.top = (this.settings.position.y - this.settings.size.height * this.settings.pivot.y - 50) * 0.23876 + 'px';
        layerDiv.style.width = (this.settings.size.width + 100) * 0.23876 + 'px';
        layerDiv.style.height = (this.settings.size.height + 100) * 0.23876 + 'px';
        editor._div.appendChild(layerDiv);
    }

    // Get the canvas for texture usage
    getCanvas() {
        return this._canvas;
    }

    // Get image data for texture
    getImageData() {
        return this._canvas.toDataURL();
    }
}

export { WrapviewSvgLayer };