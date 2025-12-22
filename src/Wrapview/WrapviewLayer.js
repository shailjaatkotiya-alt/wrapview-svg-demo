import { WrapviewUtils } from "./WrapviewUtils.js";
import { WrapviewSettings } from "./WrapviewSettings.js";
import { WrapviewParameter } from "./WrapviewParameter.js";
import { WrapviewFont } from "./WrapviewFont.js";
import { WrapviewVectorImage } from "./WrapviewVector.js";
import { getFontTtfUrl, WrapviewVectorEffect } from "./WrapviewVectorEffect.js";
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
        this._bounds = null;
        this._vectorText = null;
        this._effect = null;
        this.SVG_SIZE = 600;
    }

    defaults() {
        return {
            text: "Vector SVG Text",
            vectorText: null,
            fontFamily: null,
            fontVariant: 500,
            size: {
                height: 480,
                width: 480
            },
            outline: {
                include: false,
                color: '#000000',
                thickness: 2
            },
            fontColor: '#ffffff',
            fontSize: 48,
            pivot: {
                x: 0,
                y: 0
            },
            position: {
                x: 0,
                y: 0
            },
            angle: 0,
            effect: 'none',
            effectProperties: {
                intensity: 1,
                characterSpacing: 0
            },
            scale: 1.0
        };
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
                vectorText: this.settings.vectorText,
                fontFamily: this.settings.fontFamily,
                fontVariant: this.settings.fontVariant,
                size: this.settings.size,
                outline: this.settings.outline,
                fontColor: this.settings.fontColor,
                fontSize: this.settings.fontSize,
                pivot: this.settings.pivot,
                position: this.settings.position,
                effect: this.settings.effect,
                effectProperties: this.settings.effectProperties,
                scale: this.settings.scale
            }
        };
    }

    async applySettings(s, m) {
        // Apply all settings individually for consistency
        this.settings.text = s.text !== undefined ? s.text : this.settings.text;
        this.settings.fontFamily = s.fontFamily !== undefined ? s.fontFamily : this.settings.fontFamily;
        this.settings.fontVariant = s.fontVariant !== undefined ? s.fontVariant : this.settings.fontVariant;
        this.settings.fontSize = s.fontSize !== undefined ? s.fontSize : this.settings.fontSize;
        this.settings.fontColor = s.fontColor !== undefined ? s.fontColor : this.settings.fontColor;

        // Apply size settings
        if (s.size) {
            this.settings.size.width = s.size.width !== undefined ? s.size.width : this.settings.size.width;
            this.settings.size.height = s.size.height !== undefined ? s.size.height : this.settings.size.height;
        }

        // Apply position and angle
        if (s.position) {
            this.settings.position.x = s.position.x !== undefined ? s.position.x : this.settings.position.x;
            this.settings.position.y = s.position.y !== undefined ? s.position.y : this.settings.position.y;
        }
        if (s.pivot) {
            this.settings.pivot.x = s.pivot.x !== undefined ? s.pivot.x : this.settings.pivot.x;
            this.settings.pivot.y = s.pivot.y !== undefined ? s.pivot.y : this.settings.pivot.y;
        }
        this.settings.angle = s.angle !== undefined ? s.angle : this.settings.angle;

        // Apply outline settings
        if (s.outline) {
            this.settings.outline.include = s.outline.include !== undefined ? s.outline.include : this.settings.outline.include;
            this.settings.outline.color = s.outline.color !== undefined ? s.outline.color : this.settings.outline.color;
            this.settings.outline.thickness = s.outline.thickness !== undefined ? s.outline.thickness : this.settings.outline.thickness;
        }

        // Apply effect settings
        this.settings.effect = s.effect !== undefined ? s.effect : this.settings.effect;
        if (s.effectProperties) {
            this.settings.effectProperties.intensity = s.effectProperties.intensity !== undefined ? s.effectProperties.intensity : this.settings.effectProperties.intensity;
            this.settings.effectProperties.characterSpacing = s.effectProperties.characterSpacing !== undefined ? s.effectProperties.characterSpacing : this.settings.effectProperties.characterSpacing;
        }
        this.settings.scale = s.scale !== undefined ? s.scale : this.settings.scale;

        // Render vector text with updated settings
        await this._createVectorText();
        this._loaded = true;
    }

    setText(textValue) {
        const oldValue = this.settings.text;
        this.settings.text = textValue;
        if (oldValue !== textValue && this._loaded) {
            this._update({ text: textValue });
        }
    }

    getText() {
        return this.settings.text || '';
    }

    outline() {
        return this.settings.outline;
    }

    setOutline(o) {
        this.settings.outline = o;
    }

    outlineColor() {
        return this.settings.outline?.color || this.defaults().outline.color;
    }

    setOutlineColor(colorValue) {
        if (!this.settings.outline) this.settings.outline = this.defaults().outline;
        const oldValue = this.settings.outline.color;
        this.settings.outline.color = colorValue;
        if (oldValue !== colorValue && this._loaded) {
            this._update({ outline: this.settings.outline });
        }
    }

    setOutlineThickness(t) {
        if (!this.settings.outline) this.settings.outline = this.defaults().outline;
        const oldValue = this.settings.outline.thickness;
        this.settings.outline.thickness = t;
        if (oldValue !== t && this._loaded) {
            this._update({ outline: this.settings.outline });
        }
    }

    addOutline() {
        if (!this.settings.outline) this.settings.outline = this.defaults().outline;
        if (!this.settings.outline.include && this._loaded) {
            this.settings.outline.include = true;
            this._update({ outline: this.settings.outline });
        } else {
            this.settings.outline.include = true;
        }
    }

    removeOutline() {
        if (!this.settings.outline) this.settings.outline = this.defaults().outline;
        if (this.settings.outline.include && this._loaded) {
            this.settings.outline.include = false;
            this._update({ outline: this.settings.outline });
        } else {
            this.settings.outline.include = false;
        }
    }

    setFontSize(s) {
        this.settings.fontSize = s;
    }

    setFontFamily(family) {
        const oldValue = this.settings.fontFamily;
        this.settings.fontFamily = family;
        if (oldValue !== family && this._loaded) {
            this._update({ fontFamily: family });
        }
    }

    setFontVariant(variant) {
        const oldValue = this.settings.fontVariant;
        this.settings.fontVariant = variant;
        if (oldValue !== variant && this._loaded) {
            this._update({ fontVariant: variant });
        }
    }

    setFontColor(colorValue) {
        const oldValue = this.settings.fontColor;
        this.settings.fontColor = colorValue;
        if (oldValue !== colorValue && this._loaded) {
            this._update({ fontColor: colorValue });
        }
    }

    getFontFamily() {
        return this.settings.fontFamily;
    }

    getFontVariant() {
        return this.settings.fontVariant;
    }

    getFontColor() {
        return this.settings.fontColor;
    }

    setPivot(p) {
        if (p.x !== undefined) this.settings.pivot.x = p.x;
        if (p.y !== undefined) this.settings.pivot.y = p.y;
    }

    setSize(o) {
        if (o.width !== undefined) this.settings.size.width = o.width;
        if (o.height !== undefined) this.settings.size.height = o.height;
    }

    setEffect(effect) {
        this.settings.effect = new WrapviewVectorEffect(this.vectorText, effect, this.effectProperties)
    }

    /**
     * Smart update function that handles different change scenarios
     * @param {Object} changes - Object with changed properties
     * @private
     */
    async _update(changes) {
        const textRelatedProps = ['text', 'fontFamily', 'fontVariant', 'fontColor', 'outline'];
        const changedTextProps = Object.keys(changes).filter(key => textRelatedProps.includes(key));
        const effectChanged = changes.hasOwnProperty('effect');

        try {
            if (changedTextProps.length > 0) {
                // Text-related properties changed: rebuild SVG → apply effect → render
                await this._createVectorText();
                if (effectChanged) {
                    this._applyEffect(changes.effect);
                } else {
                    this._applyEffect(this.settings.effect);
                }
                await this._renderSvgToCanvas();
            } else if (effectChanged) {
                // Only effect changed: reuse existing SVG and just update the effect
                if (this._vectorText) {
                    this._applyEffect(changes.effect);
                    await this._renderSvgToCanvas();
                }
            }
        } catch (error) {
            console.error('Failed to update vector text layer:', error);
        }
    }

    /**
     * Apply effect to the current vector text SVG
     * @param {string} effectName - Name of the effect to apply
     * @private
     */
    _applyEffect(effectName) {
        if (!this._vectorText) {
            console.warn('Vector text not created yet, cannot apply effect');
            return;
        }

        this._effect = new WrapviewVectorEffect(
            this._vectorText,
            effectName || 'none',
            this.settings.effectProperties
        );
    }

    /**
     * Set effect and intelligently update rendering
     * @param {string} effect - Effect name to apply
     */
    setEffect(effect) {
        const oldEffect = this.settings.effect;
        this.settings.effect = effect;
        if (oldEffect !== effect && this._loaded) {
            this._update({ effect: effect });
        }
    }

    async _createVectorText() {
        try {
            // Validate required settings
            if (!this.settings.text) {
                console.warn('No text provided for vector SVG text layer');
                return;
            }

            if (!this.settings.fontFamily || !this.settings.fontVariant) {
                console.warn('Font family and variant are required for vector text rendering');
                return;
            }

            // Fetch TTF URL from Google Fonts
            const ttfUrl = await getFontTtfUrl({
                family: this.settings.fontFamily,
                size: this.settings.fontVariant
            });

            // Load font and render vector text SVG
            this._vectorText = await this._renderVectorTextSvg(ttfUrl);

            // Apply effect to the SVG
            if (this._vectorText) {
                this._applyEffect(this.settings.effect || 'none');
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
                    // Create text model using makerjs
                    const textModel = new makerjs.models.Text(
                        font,
                        this.settings.text,
                        this.settings.fontSize,
                        false,
                        false
                    );

                    // Export to SVG with color and outline
                    const svgTextElement = makerjs.exporter.toSVG(textModel, {
                        fill: this.settings.fontColor,
                        stroke: this.settings.outline?.color || this.defaults().outline.color,
                        strokeWidth: this.settings.outline?.include ? this.settings.outline.thickness : 0,
                        fillRule: 'evenodd',
                        scalingStroke: false
                    });

                    resolve(svgTextElement);
                } catch (error) {
                    reject(new Error('Failed to create vector text SVG: ' + error.message));
                }
            });
        });
    }

    load(data, material) {
        return new Promise(async (resolve, reject) => {
            try {
                // Validate required settings before loading
                if (!this.settings.fontFamily || !this.settings.fontVariant) {
                    console.warn('Font family and variant are required for vector text rendering');
                    reject(new Error('Font family and variant required'));
                    return;
                }

                // Merge data with settings if provided
                if (data) {
                    if (data.text) this.settings.text = data.text;
                    if (data.fontFamily) this.settings.fontFamily = data.fontFamily;
                    if (data.fontVariant) this.settings.fontVariant = data.fontVariant;
                    if (data.fontSize) this.settings.fontSize = data.fontSize;
                    if (data.fontColor) this.settings.fontColor = data.fontColor;
                }

                // Create vector text with current settings
                await this._createVectorText();

                this._loaded = true;
                resolve();
            } catch (error) {
                console.error('Failed to load vector SVG text layer:', error);
                reject(error);
            }
        });
    }

    _renderSvgToCanvas() {
        return new Promise((resolve, reject) => {
            if (!this._effect || !this._effect.svgElement) {
                reject(new Error('SVG viewport element not found'));
                return;
            }

            const svgData = new XMLSerializer().serializeToString(this._effect.svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                if (!this._canvas) {
                    this._canvas = document.createElement('canvas');
                }

                this._canvas.width = this.SVG_SIZE;
                this._canvas.height = this.SVG_SIZE;
                const ctx = this._canvas.getContext('2d');

                ctx.clearRect(0, 0, this.SVG_SIZE, this.SVG_SIZE);
                ctx.drawImage(img, 0, 0, this.SVG_SIZE, this.SVG_SIZE);

                URL.revokeObjectURL(url);
                resolve(this._canvas);

                if (this._onUpdate) {
                    this._onUpdate(this._canvas);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to render viewport SVG to canvas'));
            };
            img.src = url;
        });
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
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightBottomBoundCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 50 - (this.settings.size.width * this.settings.pivot.x),
            y: this.settings.size.height + 50 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightBottomOuterCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 100 - (this.settings.size.width * this.settings.pivot.x),
            y: this.settings.size.height + 100 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightTopCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width - (this.settings.size.width * this.settings.pivot.x),
            y: 0 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightTopBoundCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 50 - (this.settings.size.width * this.settings.pivot.x),
            y: -50 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var rightTopOuterCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: this.settings.size.width + 100 - (this.settings.size.width * this.settings.pivot.x),
            y: -100 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftTopCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: 0 - (this.settings.size.width * this.settings.pivot.x),
            y: 0 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftTopBoundCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: -50 - (this.settings.size.width * this.settings.pivot.x),
            y: -50 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftTopOuterCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: -100 - (this.settings.size.width * this.settings.pivot.x),
            y: -100 - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
            x: -pivot.x,
            y: -pivot.y
        });

        var leftBottomCorner = WrapviewUtils.shiftOrigin(WrapviewUtils.rotate({
            x: 0 - (this.settings.size.width * this.settings.pivot.x),
            y: this.settings.size.height - (this.settings.size.height * this.settings.pivot.y)
        }, 2 * Math.PI - (this.settings.angle || 0)), {
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
}

export {
    WrapviewLayer,
    WrapviewTextLayer,
    WrapviewImageLayer,
    WrapviewPatternLayer,
    WrapviewSVGLayer,
    WrapviewVectorSvgTextLayer
}
