import { WrapviewUtils } from "./WrapviewUtils.js";
import { WrapviewSettings } from "./WrapviewSettings.js";
import { WrapviewParameter } from "./WrapviewParameter.js";
import { WrapviewFont } from "./WrapviewFont.js";
import { WrapviewVectorImage } from "./WrapviewVector.js";
import { WrapviewVectorEffect } from "./WrapviewVectorEffect.js";
let makerjs = require('makerjs');

class WrapviewLayer {
    constructor(id, settings) {
        this.id = id;
        this._loaded = false;
        this.settings = {};
        this.isLocked = false;
        this._texture = null;
        _.assign(this.settings, this.defaults(), settings);

    }

    defaults() {
        return {

        }
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
        //this.setNeedsUpdate();
    }
    setAngle(a) {
        this.settings.angle = a;
        //this.setNeedsUpdate();
    }

    setTexture(t) {
        this._texture = t;
    }

    setNeedsUpdate() {
        if (this._texture === null) return;
        this._texture.render();
    }
}

class WrapviewImageLayer extends WrapviewLayer {
    constructor(id, settings) {
        super(id, settings);
        this._image = null;
        this._bounds = null;
        this._vectorShape = null;
    }

    name() {
        return 'Image';
    }

    getData() {
        var d = {
            type: 'WrapviewImageLayer',
            data: {
                path: this._path,
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

    color() {
        return this.settings.color;
    }

    setColorParameter(color) {
        this.settings.color = color;
    }
    setColor(colorValue, descriptor) {
        this.settings.color.setValue(colorValue);
        this.settings.color.setDescriptor(descriptor);
    }
    setPivot(p) {
        _.assign(this.settings.pivot, {}, p);
    }
    setSize(o) {
        var width = o.width || -1;
        var height = o.height || -1;

        if (width === -1 && height !== -1) {
            width = height * this.settings.ratio;
        } else if (width !== -1 && height === -1) {
            height = width / this.settings.ratio;
        } else {
            width = this.settings.width;
            height = this.settings.height;
        }

        this.settings.size = {
            width: parseFloat(parseFloat(width).toFixed(2)),
            height: parseFloat(parseFloat(height).toFixed(2))
        };

    }
    isScale(point) {

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
        var min = this._bounds.ltc;
        min = this._lower('ltb', min);
        var max = this._bounds.ltc;
        max = this._greater('ltb', max);
        if (point.x > min.x && point.y > min.y && point.x < max.x && point.y < max.y) {
            return true;
        }
        return false;
    }
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
    isInBounds(point) {
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

    load(data) {
        this._path = data.path;
        return new Promise((resolve, reject) => {

            WrapviewSettings.agent.loaders.image.load(data.path + '?id=' + WrapviewUtils.guid(), (image) => {
                image.crossOrigin = 'Anonymous';
                this._image = image;
                this.settings.ratio = (this._image.width / this._image.height);
                if (this.settings.size === null) {
                    this.settings.size = {
                        width: image.width,
                        height: image.height
                    }
                }
                this._loaded = true;
                //this.setNeedsUpdate();
                resolve(this._image);
            })
        })
    }

    _calculateVectorSize(v) {
        var vector_size = v.outline.settings.size;
        var panel_props = this._texture.material().panel().value('properties');
        var raw_size = panel_props.raw_size;

        var ratio = {
            x: vector_size.width / raw_size.width,
            y: vector_size.height / raw_size.height
        };

        if (this.settings.scaleUsing === 'width') {
            this._scalingFactor = ratio.x;
        }

        var width = this.settings.size.width * this._scalingFactor;

        var scaled_size = {
            width: width,
            height: width / this.settings.ratio
        }
        return scaled_size;
    }

    _calculateVectorPosition(v) {
        var vector_anchor = v._props.anchor;
        var vector_size = v.outline.settings.size;
        var panel_props = this._texture.material().panel().value('properties');
        var texture_anchor = panel_props.anchor;
        var raw_size = panel_props.raw_size;

        var pivot = {
            x: this.settings.position.x - this.settings.size.width * this.settings.pivot.x,
            y: this.settings.position.y - this.settings.size.height * this.settings.pivot.y
        };

        var ratio = {
            x: vector_size.width / raw_size.width,
            y: vector_size.height / raw_size.height
        };
        var unscaled_position = WrapviewUtils.shiftOrigin(pivot, texture_anchor);
        var scaled_position = {
            x: vector_anchor.x + unscaled_position.x * ratio.x,
            y: vector_anchor.y + unscaled_position.y * ratio.y
        }
        return scaled_position;
    }



    _calculateBounds() {

        var pivot = {
            x: this.settings.position.x,
            y: this.settings.position.y
        };

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

    setVectorBase(vectorPanel) {
        if (!this._loaded) return;
        if (this.settings.color !== null) {
            vectorPanel.setBaseColor(this.settings.color.value());
        }
    }

    drawVector(vectorPanel) {
        var size = this._calculateVectorSize(vectorPanel);
        if (this._vectorShape === null) {
            this._vectorShape = new WrapviewVectorImage({
                data: {
                    path: this._path,
                },
                size: size,
                scalingFactor: this._scalingFactor
            });
        }
        this._vectorShape.setPosition(this._calculateVectorPosition(vectorPanel));
        this._vectorShape.setSize(size);
        this._vectorShape.setRotation(this.settings.angle);
        this._vectorShape.draw(vectorPanel._wrapper);

    }

    fillCanvas(context) {
        if (!this._loaded) return;
        context.save();
        context.fillStyle = '#FFFFFF';
        context.fillRect(0,
            0,
            this._texture.settings.size.width, this._texture.settings.size.height);
        context.restore();
    }

    draw(context) {

        if (!this._loaded) return;
        this._calculateBounds();
        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);
        context.drawImage(this._image,
            -this.settings.size.width * this.settings.pivot.x,
            -this.settings.size.height * this.settings.pivot.y,
            this.settings.size.width, this.settings.size.height);

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

        /*
        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);
        context.lineWidth  = 4;
        context.setLineDash([20]);
        context.strokeStyle = "#000000";
        context.strokeRect(
            -this.settings.size.width * this.settings.pivot.x -10 ,
            -this.settings.size.height * this.settings.pivot.y - 10,
            this.settings.size.width + 20, this.settings.size.height + 20);

        context.setLineDash([20]);
        context.strokeStyle = "#FFFFFF";

        context.strokeRect(
            -this.settings.size.width * this.settings.pivot.x -5 ,
            -this.settings.size.height * this.settings.pivot.y - 5,
            this.settings.size.width + 10, this.settings.size.height + 10);

        context.strokeStyle = "#000000";
        context.setLineDash([]);
        context.fillStyle = "#FFFFFF";

        context.arc(
            0,
            0,
            20, 0, Math.PI * 2);
        context.stroke();
        context.fill();

        if(this.settings.pivot.x !== 1 || this.settings.pivot.y !== 1) {
            context.strokeRect(
                this.settings.size.width * (1- this.settings.pivot.x) - 10,
                this.settings.size.height * (1- this.settings.pivot.y) - 10,
                20, 20);

            context.fillRect(
                this.settings.size.width * (1- this.settings.pivot.x) - 10,
                this.settings.size.height * (1- this.settings.pivot.y) - 10,
                20, 20);
        }



        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();
        */
        this._calculateBounds();

    }

}

class WrapviewTextLayer extends WrapviewLayer {
    constructor(id, settings) {
        super(id, settings);
        this._loaded = true;
        this._text = null;
        this._bounds = null;
    }

    setPivot(p) {
        this.settings.pivot = p;
        //this.setNeedsUpdate();
    }
    name() {
        return 'Text';
    }

    color() {
        return this.settings.color;
    }
    setColorParameter(color) {
        this.settings.color = color;
        //this.setNeedsUpdate();
    }
    setColor(colorValue, descriptor) {
        this.settings.color.setValue(colorValue);
        this.settings.color.setDescriptor(descriptor);
    }

    outline() {
        return this.settings.outline
    }
    setOutline(o) {
        this.settings.outline = o;
        //this.setNeedsUpdate();
    }
    outlineColor() {
        return this.settings.outline.color;
    }
    setOutlineColorParameter(outline) {
        this.settings.outline.color = outline;
        //this.setNeedsUpdate();
    }
    setOutlineColor(colorValue, descriptor) {
        this.settings.outline.color.setValue(colorValue);
        this.settings.outline.color.setDescriptor(descriptor);
    }

    addOutline() {
        this.settings.outline.include = true;
    }

    removeOutline() {
        this.settings.outline.include = false;
    }

    setOutlineThickness(t) {
        this.settings.outline.thickness = t;
    }

    text() {
        return this._text;
    }

    setTextParameter(text) {
        this._text = text;
        //console.log(this._text);
        //this.setNeedsUpdate();
    }
    setText(textValue) {
        this._text.setValue(textValue);
        //this.setNeedsUpdate();
    }
    setFontSize(s) {
        this.settings.fontSize = s;
        //this.setNeedsUpdate();
    }

    setFont(font) {
        return new Promise((resolve) => {
            this.settings.font = font;
            this.settings.font.loaded = false;
            this._loaded = false;
            WrapviewSettings.agent.loaders.font.load({
                family: this.settings.font.family,
                source: this.settings.font.source
            }).then(() => {
                this.settings.font.loaded = true;
                this._loaded = true;
                resolve();
            })
        })


    }

    getData() {
        var d = {
            type: 'WrapviewTextLayer',
            data: {
                text: this._text.getData(),
            },
            settings: {
                font: this.settings.font.getData(),
                fontSize: this.settings.fontSize,
                format: this.settings.format,
                pivot: this.settings.pivot,
                position: this.settings.position,
                angle: this.settings.angle,
                color: this.settings.color.getData(),
                outline: {
                    include: this.settings.outline.include,
                    thickness: this.settings.outline.thickness,
                    color: this.settings.outline.color.getData()
                }
            }
        };
        return d;
    }

    applySettings(s, m) {
        this.settings.fontSize = s.fontSize;
        this.settings.pivot = s.pivot;
        this.settings.position = s.position;
        this.settings.angle = s.angle;
        if (s.color === null) {
            this.settings.color = null;
        } else {
            var c = new WrapviewParameter(m, 'textColor');
            c.set(s.color);
            this.settings.color = c;
        }
        this.settings.outline.include = s.outline.include;
        this.settings.outline.thickness = s.outline.thickness;
        if (s.outline.color === null) {
            this.settings.outline.color = null;
        } else {
            var oc = new WrapviewParameter(m, 'outlineColor');
            oc.set(s.outline.color);
            this.settings.outline.color = oc;
        }
        this.settings.font = new WrapviewFont(s.font);
    }


    defaults() {
        return {
            font: null,
            fontSize: 30,
            size: {
                width: 0,
                height: 0
            },
            format: {
                bold: false,
                italics: false
            },
            outline: {
                include: false,
                color: null,
                thickness: 1
            },
            pivot: {
                x: 0.5,
                y: 0.5
            },
            position: {
                x: 0,
                y: 0
            },
            angle: 0,
            color: null
        }
    }

    load(data, material) {
        return new Promise((resolve, reject) => {
            if (this._text === null) {
                var text = new WrapviewParameter(material, 'text');
                text.set(data.text);
                this._text = text;
            }
            if (this.settings.font.loaded) {
                this._loaded = true;
                resolve();
                return;
            }
            WrapviewSettings.agent.loaders.font.load({
                family: this.settings.font.family,
                source: this.settings.font.source
            }).then(() => {
                this.settings.font.loaded = true;
                this._loaded = true;
                resolve();
            })
        })
    }
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

    _calculateBounds(context, text) {

        var metrics = context.measureText(text);
        let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        let width = metrics.width;
        this.settings.size.width = width;
        this.settings.size.height = height;

        var pivot = {
            x: this.settings.position.x,
            y: this.settings.position.y
        };

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
        if (this._text === null) return;


        var layerFormat = '';
        if (this.settings.format) {
            if (this.settings.format.italics) {
                layerFormat += 'italic ';
            }
            if (this.settings.format.bold) {
                layerFormat += ' bold ';
            }
        }

        context.font = layerFormat + ' ' + this.settings.fontSize + 'px ' + this.settings.font.family;
        if (this.settings.pivot.x === 0.5) {
            context.textAlign = "center";
        } else if (this.settings.pivot.x === 0) {
            context.textAlign = "left";
        } else {
            context.textAlign = "right";
        }

        if (this.settings.pivot.y === 0.5) {
            context.textBaseline = "middle";
        } else if (this.settings.pivot.y === 0) {
            context.textBaseline = "top";
        } else {
            context.textBaseline = "bottom";
        }
        this._calculateBounds(context, this._text.value());
        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);

        if (this.settings.outline.include) {
            context.lineWidth = this.settings.outline.thickness;
            context.miterLimit = 2;
            context.lineJoin = "round";
            context.strokeStyle = this.settings.outline.color.value();
        }

        if (this.settings.color === null) {
            context.fillStyle = '#000000';
        } else {
            context.fillStyle = this.settings.color.value();
        }

        context.fillText(this._text.value(), 0, 0);
        if (this.settings.outline.include) {
            context.strokeText(this._text.value(), 0, 0);
        }

        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();
    }
    drawHandles(context, editor) {
        /*
        if (!this._loaded) return;
        if(this._text === null) return;
        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);

        context.setLineDash([6]);
        context.strokeStyle = "#000000";

        context.strokeRect(
            -this.settings.size.width * this.settings.pivot.x -2 ,
            -this.settings.size.height * this.settings.pivot.y - 2,
            this.settings.size.width + 4, this.settings.size.height + 4);

        context.setLineDash([3]);
        context.strokeStyle = "#FFFFFF";

        context.strokeRect(
            -this.settings.size.width * this.settings.pivot.x -2 ,
            -this.settings.size.height * this.settings.pivot.y - 2,
            this.settings.size.width + 4, this.settings.size.height + 4);

        context.strokeStyle = "#000000";
        context.setLineDash([]);
        context.fillStyle = "#FFFFFF";

        context.arc(
            0,
            0,
            10, 0, Math.PI * 2);
        context.stroke();
        context.fill();

        if(this.settings.pivot.x !== 1 || this.settings.pivot.y !== 1) {
            context.strokeRect(
                this.settings.size.width * (1- this.settings.pivot.x) - 10,
                this.settings.size.height * (1- this.settings.pivot.y) - 10,
                20, 20);

            context.fillRect(
                this.settings.size.width * (1- this.settings.pivot.x) - 10,
                this.settings.size.height * (1- this.settings.pivot.y) - 10,
                20, 20);
        }


        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();

         */
    }
}

class WrapviewPatternLayer extends WrapviewImageLayer {
    constructor(id, settings) {
        super(id, settings);
        this._canvas = null;
        this._conext = null;
        this.init();
    }

    init() {
        this._canvas = document.createElement('canvas');
        this._context = this._canvas.getContext('2d');
        this._canvas.setAttribute('id', this.id);
        var canvasSize = {
            width: this.settings.size.width / this.settings.tile.x,
            height: this.settings.size.height / this.settings.tile.y
        };
        this._canvas.width = canvasSize.width;
        this._canvas.height = canvasSize.height;
    }

    defaults() {
        return {
            tile: {
                x: 0,
                y: 0
            },
            size: {
                width: 0,
                height: 0
            }
        }
    }

    draw(context) {
        if (!this._loaded) return;

        var canvasSize = {
            width: this.settings.size.width / this.settings.tile.x,
            height: this.settings.size.height / this.settings.tile.y
        };
        this._context.clearRect(0, 0, canvasSize.width, canvasSize.height);

        this._context.drawImage(this._image,
            0,
            0,
            canvasSize.width, canvasSize.height);
        //Draw and image here.
        var pattern = context.createPattern(this._canvas, 'repeat');
        context.fillStyle = pattern;
        context.fillRect(0, 0, this.settings.size.width, this.settings.size.height);
    }

    drawHandles(context, editor) {
        return;
    }
}

class WrapviewSVGLayer extends WrapviewLayer {
    constructor(id, settings) {
        super(id, settings);
        this._canvas = null;
        this._image = null;
        this._loaded = false;
        this._dataUrl = null;
    }

    name() {
        return 'SVG';
    }

    defaults() {
        return {
            size: { width: 2560, height: 2560 },
            pivot: { x: 0.5, y: 0.5 },
            position: { x: 1280, y: 1280 },
            angle: 0
        };
    }

    /**
     * Load SVG layer from data URL (PNG image)
     * @param {Object} data - Contains svgData (PNG data URL)
     * @returns {Promise} Resolves when image is loaded
     */
    load(data, material) {
        return new Promise((resolve, reject) => {
            if (!data || !data.svgData) {
                reject(new Error('No svgData provided'));
                return;
            }

            this._dataUrl = data.svgData;
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                if (!this._canvas) {
                    this._canvas = document.createElement('canvas');
                }
                this._canvas.width = this.settings.size.width;
                this._canvas.height = this.settings.size.height;

                const ctx = this._canvas.getContext('2d');
                ctx.clearRect(0, 0, this.settings.size.width, this.settings.size.height);
                ctx.drawImage(img, 0, 0, this.settings.size.width, this.settings.size.height);

                this._image = img;
                this._loaded = true;
                this.setNeedsUpdate();
                resolve(this._canvas);
            };
            img.onerror = () => {
                reject(new Error('Failed to load SVG data URL'));
            };
            img.src = data.svgData;
        });
    }

    /**
     * Get the canvas containing the rendered SVG
     * @returns {HTMLCanvasElement} The internal canvas
     */
    getCanvas() {
        return this._canvas;
    }

    /**
     * Update texture from new data URL
     * @param {string} dataUrl - PNG data URL to apply as texture
     */
    updateFromDataUrl(dataUrl) {
        if (!dataUrl) return Promise.resolve();

        return this.load({ svgData: dataUrl });
    }

    /**
     * Draw SVG layer on canvas
     * @param {CanvasRenderingContext2D} context - Canvas context to draw on
     */
    draw(context) {
        if (!this._loaded || !this._image) return;

        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);
        context.drawImage(
            this._canvas || this._image,
            -this.settings.size.width * this.settings.pivot.x,
            -this.settings.size.height * this.settings.pivot.y,
            this.settings.size.width,
            this.settings.size.height
        );
        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();
    }

    /**
     * Get layer data for serialization
     * @returns {Object} Layer data object
     */
    getData() {
        return {
            type: 'WrapviewSVGLayer',
            data: {
                svgData: this._dataUrl
            },
            settings: {
                size: this.settings.size,
                pivot: this.settings.pivot,
                position: this.settings.position,
                angle: this.settings.angle
            }
        };
    }

    drawHandles(context, editor) {
        // SVG layer handles not implemented
        return;
    }
}

class WrapviewVectorSvgTextLayer extends WrapviewLayer {
    constructor(id, settings) {
        super(id, settings);
        this._loaded = false;
        this._canvas = null;
        this._image = null;
        this._vectorText = null;
        this._vectorEffect = null;
        this._bounds = null;
        this._svg_size = 600;
        this.googleFontAPIKey = ''
        this._text = null
    }

    defaults() {
        return {
            font: null,
            fontSize: 48,
            color: null,
            size: {
                width: 480,
                height: 480
            },
            outline: {
                includes: false,
                thickness: 1,
                color: null
            },
            pivot: {
                x: 0,
                y: 0
            },
            position: {
                x: 0,
                y: 0
            },
            angle: 0,
            scale: 1.0,
            effect: {
                effectName: 'none',
                effectProperties: {
                    intensity: 0,
                    characterSpacing: 1
                }
            }
        };
    }

    setApiKey(key) {
        this.googleFontAPIKey = key
    }

    name() {
        return 'VectorSvgText';
    }

    getData() {
        return {
            type: 'WrapviewVectorSvgTextLayer',
            data: {
                text: this.settings.text
            },
            settings: {
                text: this.settings.text,
                fontFamily: this.settings.fontFamily,
                fontVariant: this.settings.fontVariant,
                size: this.settings.size,
                outline: this.settings.outline,
                fontColor: this.settings.fontColor,
                fontSize: this.settings.fontSize,
                pivot: this.settings.pivot,
                position: this.settings.position,
                angle: this.settings.angle,
                effect: this.settings.effect,
                effectProperties: this.settings.effectProperties,
                scale: this.settings.scale,
            }
        };
    }

    async applySettings(s, m = null) {
        const textRelatedProps = ['text', 'font', 'fontSize', 'color', 'outline'];
        const changedProps = Object.keys(s);
        const hasTextRelatedChanges = changedProps.some(key => textRelatedProps.includes(key));
        const hasEffectChanges = s.hasOwnProperty('effect');

        // Helper function to normalize parameter value to WrapviewParameter format
        const normalizeParamValue = (val) => {
            if (typeof val === 'string' || typeof val === 'number') {
                return { type: 'fixed', value: val };
            }
            return val;
        };

        // Apply text
        if (s.hasOwnProperty('text')) {
            if (s.text) {
                const textValue = normalizeParamValue(s.text);
                if (this._text === null && m) {
                    var text = new WrapviewParameter(m, 'vectorText');
                    text.set(textValue);
                    this._text = text;
                } else if (this._text) {
                    this._text.set(textValue);
                }
            }
        }

        // Apply font
        if (s.hasOwnProperty('font')) {
            if (s.font === null) {
                this.settings.font = null;
            } else if (s.font) {
                this.settings.font = new WrapviewFont({
                    family: s.font.family || s.font.name,
                    source: s.font.source,
                    variant: s.font.variant
                });
            }
        }

        // Apply fontSize
        if (s.hasOwnProperty('fontSize')) {
            this.settings.fontSize = s.fontSize;
        }

        // Apply color
        if (s.hasOwnProperty('color')) {
            if (s.color === null) {
                this.settings.color = null;
            } else if (s.color && m) {
                const colorValue = normalizeParamValue(s.color);
                var c = new WrapviewParameter(m, 'vectorTextColor');
                c.set(colorValue);
                this.settings.color = c;
            }
        }

        // Apply size
        if (s.hasOwnProperty('size') && s.size) {
            this.settings.size = s.size;
        }

        // Apply position
        if (s.hasOwnProperty('position') && s.position) {
            this.settings.position = s.position;
        }

        // Apply pivot
        if (s.hasOwnProperty('pivot') && s.pivot) {
            this.settings.pivot = s.pivot;
        }

        // Apply angle and scale
        if (s.hasOwnProperty('angle')) {
            this.settings.angle = s.angle;
        }
        if (s.hasOwnProperty('scale')) {
            this.settings.scale = s.scale;
        }

        // Apply outline
        if (s.hasOwnProperty('outline') && s.outline) {
            if (s.outline.hasOwnProperty('includes')) {
                this.settings.outline.includes = s.outline.includes;
            }
            if (s.outline.hasOwnProperty('thickness')) {
                this.settings.outline.thickness = s.outline.thickness;
            }
            if (s.outline.hasOwnProperty('color')) {
                if (s.outline.color === null) {
                    this.settings.outline.color = null;
                } else if (s.outline.color && m) {
                    const outlineColorValue = normalizeParamValue(s.outline.color);
                    var oc = new WrapviewParameter(m, 'vectorTextOutlineColor');
                    oc.set(outlineColorValue);
                    this.settings.outline.color = oc;
                }
            }
        }

        // Apply effect
        if (s.hasOwnProperty('effect') && s.effect) {
            if (s.effect.hasOwnProperty('effectName')) {
                this.settings.effect.effectName = s.effect.effectName;
            }
            if (s.effect.effectProperties) {
                if (s.effect.effectProperties.hasOwnProperty('intensity')) {
                    this.settings.effect.effectProperties.intensity = s.effect.effectProperties.intensity;
                }
                if (s.effect.effectProperties.hasOwnProperty('characterSpacing')) {
                    this.settings.effect.effectProperties.characterSpacing = s.effect.effectProperties.characterSpacing;
                }
            }
        }

        // Render based on what changed
        try {
            if (hasTextRelatedChanges) {
                // _createVectorText handles _applyEffect and _renderSvgToCanvas internally
                await this._createVectorText();
            } else if (hasEffectChanges) {
                if (this._vectorText) {
                    this._applyEffect(this.settings.effect.effectName);
                    await this._renderSvgToCanvas();
                }
            }
            this._loaded = true;
        } catch (error) {
            console.error('Failed to apply settings:', error);
        }
    }

    _ensureOutline() {
        if (!this.settings.outline) {
            this.settings.outline = this.defaults().outline;
        }
    }

    setText(textValue) {
        const oldValue = this._text ? this._text.value() : '';
        if (this._text) {
            this._text.setValue(textValue);
        }
        if (oldValue !== textValue && this._loaded) {
            this.applySettings({ text: textValue });
        }
    }

    getText() {
        return this._text ? this._text.value() : '';
    }

    color() {
        return this.settings.color;
    }

    setColorParameter(color) {
        this.settings.color = color;
    }

    outline() {
        return this.settings.outline;
    }

    setOutline(o) {
        this.settings.outline = o;
        if (this._loaded) {
            this.applySettings({ outline: o });
        }
    }

    outlineColor() {
        return this.settings.outline?.color;
    }

    setOutlineColorParameter(outlineColor) {
        this._ensureOutline();
        this.settings.outline.color = outlineColor;
    }

    setOutlineColor(colorValue, descriptor) {
        this._ensureOutline();
        if (this.settings.outline.color) {
            this.settings.outline.color.setValue(colorValue);
            if (descriptor) {
                this.settings.outline.color.setDescriptor(descriptor);
            }
            if (this._loaded) {
                this.applySettings({ outline: this.settings.outline });
            }
        }
    }

    setOutlineThickness(t) {
        this._ensureOutline();
        const oldValue = this.settings.outline.thickness;
        this.settings.outline.thickness = t;
        if (oldValue !== t && this._loaded) {
            this.applySettings({ outline: this.settings.outline });
        }
    }

    addOutline() {
        this._ensureOutline();
        const shouldUpdate = !this.settings.outline.includes && this._loaded;
        this.settings.outline.includes = true;
        if (shouldUpdate) {
            this.applySettings({ outline: this.settings.outline });
        }
    }

    removeOutline() {
        this._ensureOutline();
        const shouldUpdate = this.settings.outline.includes && this._loaded;
        this.settings.outline.includes = false;
        if (shouldUpdate) {
            this.applySettings({ outline: this.settings.outline });
        }
    }

    setFontSize(s) {
        const oldValue = this.settings.fontSize;
        this.settings.fontSize = s;
        if (oldValue !== s && this._loaded) {
            this.applySettings({ fontSize: s });
        }
    }

    setFontFamily(family) {
        if (!this.settings.font) return;
        const oldValue = this.settings.font.family;
        this.settings.font.family = family;
        if (oldValue !== family && this._loaded) {
            this.applySettings({ font: this.settings.font });
        }
    }

    setFontVariant(variant) {
        if (!this.settings.font) return;
        const oldValue = this.settings.font.variant;
        this.settings.font.variant = variant;
        if (oldValue !== variant && this._loaded) {
            this.applySettings({ font: this.settings.font });
        }
    }

    setColor(colorValue, descriptor) {
        if (this.settings.color) {
            this.settings.color.setValue(colorValue);
            if (descriptor) {
                this.settings.color.setDescriptor(descriptor);
            }
            if (this._loaded) {
                this.applySettings({ color: this.settings.color });
            }
        }
    }

    setPivot(p) {
        if (p.x !== undefined) this.settings.pivot.x = p.x;
        if (p.y !== undefined) this.settings.pivot.y = p.y;
    }

    setSize(o) {
        if (o.width !== undefined) this.settings.size.width = o.width;
        if (o.height !== undefined) this.settings.size.height = o.height;
    }

    _applyEffect(effectName) {
        if (!this._vectorText) {
            console.warn('Vector text not created yet, cannot apply effect');
            return;
        }

        this._vectorEffect = new WrapviewVectorEffect(
            this._vectorText,
            effectName || 'none',
            this.settings.effect.effectProperties
        );
    }

    setEffect(effect) {
        const oldEffect = this.settings.effect.effectName;
        this.settings.effect.effectName = effect;
        if (oldEffect !== effect && this._loaded) {
            this.applySettings({ effect: this.settings.effect });
        }
    }

    _getEffectSvgString() {
        if (!this._vectorEffect || !this._vectorEffect.svgElement) {
            return null;
        }
        return new XMLSerializer().serializeToString(this._vectorEffect.svgElement);
    }

    getEffectSvgDataUrl() {
        const svgString = this._getEffectSvgString();
        if (!svgString) {
            console.warn('No SVG string available for data URL');
            return null;
        }
        try {
            // Ensure the SVG has proper namespace and dimensions
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;

            // Check for parsing errors
            if (svgElement.querySelector('parsererror')) {
                console.error('SVG parsing error:', svgElement.querySelector('parsererror').textContent);
                return null;
            }

            // Ensure width and height are set
            if (!svgElement.hasAttribute('width')) {
                svgElement.setAttribute('width', this._svg_size);
            }
            if (!svgElement.hasAttribute('height')) {
                svgElement.setAttribute('height', this._svg_size);
            }
            if (!svgElement.hasAttribute('xmlns')) {
                svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }

            const correctedSvgString = new XMLSerializer().serializeToString(svgElement);
            return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(correctedSvgString)}`;
        } catch (error) {
            console.error('Error creating SVG data URL:', error);
            return null;
        }
    }


    async applyEffectToSvgLayer(svgLayer) {
        if (!svgLayer || typeof svgLayer.updateFromDataUrl !== 'function') return Promise.resolve();

        const dataUrl = this.getEffectSvgDataUrl();
        if (!dataUrl) return Promise.resolve();

        return svgLayer.updateFromDataUrl(dataUrl);
    }

    async _createVectorText() {
        try {
            if (!this._text) {
                console.warn('No text provided for vector SVG text layer');
                return;
            }
            if (!this.settings.font || !this.settings.font.family || !this.settings.font.variant) {
                console.warn('Font family and variant are required for vector text rendering');
                return;
            }
            const ttfUrl = await this.settings.font.getFontUrl(this.googleFontAPIKey);

            this._vectorText = await this._renderVectorTextSvg(ttfUrl);
            if (this._vectorText) {
                this._applyEffect(this.settings.effect.effectName || 'none');
                await this._renderSvgToCanvas();
            }

        } catch (error) {
            console.error('Failed to create vector text:', error);
        }
    }

    _renderVectorTextSvg(ttfUrl) {
        return new Promise((resolve, reject) => {
            if (!ttfUrl) {
                reject(new Error('Font URL not set'));
                return;
            }
            opentype.load(ttfUrl, (err, font) => {
                if (err) {
                    console.error('Font load failed:', err);
                    reject(err);
                    return;
                }
                try {
                    if (this.settings.effect.effectName === 'circle') {
                        const textModel = new makerjs.models.Text(
                            font,
                            this._text.value(),
                            this.settings.fontSize,
                            false,
                            false
                        );
                        let topArc = new makerjs.paths.Arc([0, 0], 600, 90 - 90 / 2, 90 + 90 / 2);
                        makerjs.layout.childrenOnPath(textModel, topArc, 0, true, true, true);

                        const svgTextElement = makerjs.exporter.toSVG(textModel, {
                            fill: this.settings.color ? this.settings.color.value() : '#ffffff',
                            stroke: this.settings.outline?.color ? this.settings.outline.color.value() : '#000000',
                            strokeWidth: this.settings.outline?.includes ? this.settings.outline.thickness : 0,
                            fillRule: 'evenodd',
                            scalingStroke: false
                        });
                        resolve(svgTextElement);

                    } else {
                        const textModel = new makerjs.models.Text(
                            font,
                            this._text.value(),
                            this.settings.fontSize,
                            false,
                            false
                        );
                        const svgTextElement = makerjs.exporter.toSVG(textModel, {
                            fill: this.settings.color ? this.settings.color.value() : '#ffffff',
                            stroke: this.settings.outline?.color ? this.settings.outline.color.value() : '#000000',
                            strokeWidth: this.settings.outline?.includes ? this.settings.outline.thickness : 0,
                            fillRule: 'evenodd',
                            scalingStroke: false
                        });
                        resolve(svgTextElement);
                    }
                } catch (error) {
                    reject(new Error('Failed to create vector text SVG: ' + error.message));
                }
            });
        });
    }

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
        var pivot = {
            x: this.settings.position.x,
            y: this.settings.position.y
        };

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

    _renderSvgToCanvas() {
        return new Promise((resolve, reject) => {
            const dataUrl = this.getEffectSvgDataUrl();
            if (!dataUrl) {
                reject(new Error('SVG viewport element not found'));
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                if (!this._canvas) {
                    this._canvas = document.createElement('canvas');
                }

                this._canvas.width = this._svg_size;
                this._canvas.height = this._svg_size;
                const ctx = this._canvas.getContext('2d');

                ctx.clearRect(0, 0, this._svg_size, this._svg_size);
                ctx.drawImage(img, 0, 0, this._svg_size, this._svg_size);

                this._effectDataUrl = dataUrl;
                this.setNeedsUpdate();
                resolve(this._canvas);

                if (this._onUpdate) {
                    this._onUpdate(this._canvas);
                }
            };
            img.onerror = (e) => {
                console.error('Failed to load SVG data URL. SVG string length:', dataUrl ? dataUrl.length : 0);
                console.error('Data URL preview:', dataUrl ? dataUrl.substring(0, 200) : 'null');
                reject(new Error('Failed to load SVG data URL - check SVG format and content'));
            };
            img.src = dataUrl;
        });
    }

    draw(context) {
        if (!this._loaded || !this._canvas) return;

        this._calculateBounds();
        context.save();
        context.translate(this.settings.position.x, this.settings.position.y);
        context.rotate(this.settings.angle);
        context.drawImage(
            this._canvas,
            -this.settings.size.width * this.settings.pivot.x,
            -this.settings.size.height * this.settings.pivot.y,
            this.settings.size.width,
            this.settings.size.height
        );
        context.rotate(-this.settings.angle);
        context.translate(0, 0);
        context.restore();
    }

    drawHandles(context, editor) {
        // Vector SVG text layer handles not implemented
        return;
    }
}

export {
    WrapviewLayer,
    WrapviewTextLayer,
    WrapviewImageLayer,
    WrapviewPatternLayer,
    WrapviewSVGLayer,
    WrapviewVectorSvgTextLayer
}