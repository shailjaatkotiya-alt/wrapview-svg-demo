import {WrapviewUtils} from "./WrapviewUtils.js";

class WrapviewVectorObject {
    constructor(settings) {
        this._id = guid();
        this.settings = {};
        _.assign(this.settings, this.defaults(), settings);
        this._element = null;
        this._wrapper = null;
        this.usage = null;
        this.type = '';
    }

    defaults(){
        return {
            size: {
                width: 0,
                height: 0
            },
            scalingFactor: '',
            position: {
                x: 0,
                y: 0
            },
            pivot: {
                x: 0.5,
                y: 0.5
            },
            transform: {
                rotate: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                translate: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                skew: {
                    x: 0,
                    y :0,
                    z: 0
                },
                scale: {
                    x: 1,
                    y: 1
                }
            },
            data: {}
        }
    }

    _createWrapper(){
        if(this._wrapper !== null) {
            this._wrapper.remove();
        }
        this._wrapper = document.createElementNS('http://www.w3.org/2000/svg','svg');
        this._wrapper.setAttribute('id',this._id+'_wrapper');
        this._element = document.createElementNS('http://www.w3.org/2000/svg', this.type);
        this._element.setAttribute('id',this._id);
    }



    _generateTransform() {
        var str = '';
        if(this.settings.transform.rotate.x !== 0) {
            str += 'rotateX('+this.settings.transform.rotate.x+'deg)';
        }
        if(this.settings.transform.rotate.y !== 0) {
            str += 'rotateY('+this.settings.transform.rotate.y+'deg)';
        }
        if(this.settings.transform.rotate.z !== 0) {
            str += 'rotateZ('+this.settings.transform.rotate.z+'deg)';
        }

        return str;
    }

    _generateTransformOrigin(){
        var str = '';
        if(!this.settings.hasOwnProperty('pivot')) {
            return 'center center';
        } else {
            if(this.settings.pivot.y === 0) {
                str += 'top '
            } else if (this.settings.pivot.y === 0.5) {
                str += 'center ';
            } else {
                str += 'bottom '
            }
            if(this.settings.pivot.x === 0) {
                str += 'left'
            } else if (this.settings.pivot.x === 0.5) {
                str += 'center';
            } else {
                str += 'right'
            }
        }

        return str;
    }

    draw(parent) {
        if(this.usage !== null) {
            //this.usage.remove();
        }
        parent.appendChild(this._wrapper);

        //var usage = document.createElementNS('http://www.w3.org/2000/svg','use');
        //this._wrapper.setAttribute('href','#'+this._id+'_wrapper');
        this._wrapper.setAttribute('x',this.settings.position.x);
        this._wrapper.setAttribute('y',this.settings.position.y);
        this._wrapper.setAttribute('width',this.settings.size.width);
        this._wrapper.setAttribute('height',this.settings.size.height);
        this._wrapper.style['transform-origin'] = this._generateTransformOrigin();
        this._wrapper.style.transform = this._generateTransform();
        this._wrapper.style['overflow'] = 'visible';
        //this.usage = usage;
        //parent.appendChild(usage);
    }

    setPosition(p){
        this.settings.position = p;
    }

    setSize(s) {
        this.settings.size = s;
    }

    setStroke(s){
        this._element.style.stroke = s;
    }
    setFill(f) {
        this._element.style.fill = f;
    }
    setRotation(r, a) {
        var axis = a || 'z';
        var d = WrapviewUtils.toDegrees(r);
        this.settings.transform.rotate[axis] = d;
    }
}



class WrapviewVectorPath extends WrapviewVectorObject {
    constructor(settings) {
        super(settings);
        this.type = 'path';
        this.init();
    }

    init(){
        this._createWrapper();
        this._element.style['stroke-linecap']='round';
        this._element.style['stroke-linejoin']='round';
        this._element.style['stroke-width'] = '1px';
        this._element.setAttribute('d',this.settings.data.path);
        this._wrapper.appendChild(this._element);
        this._wrapper.setAttribute('viewBox','0 0 '+this.settings.size.width + ' '+this.settings.size.height);
    }
}

class WrapviewVectorCircle extends WrapviewVectorObject{

    constructor(settings) {
        super(settings);
        this.type = 'circle';
        this.init();
    }

    init(){
        this._createWrapper();
        this._element.style['stroke-linecap']='round';
        this._element.style['stroke-linejoin']='round';
        this._element.style['stroke-width'] = '1px';
        this._element.setAttribute('cx',0);
        this._element.setAttribute('cy',0);
        this._element.setAttribute('r',this.settings.data.radius);
        this._wrapper.appendChild(this._element);
        this._wrapper.setAttribute('viewBox','0 0 '+this.settings.data.radius * 2 + ' '+this.settings.data.radius * 2);
        this._wrapper.style.overflow = 'visible';
    }
}

class WrapviewVectorImage extends WrapviewVectorObject{

    constructor(settings) {
        super(settings);
        this.type = 'image';
        this.init();
    }

    init(){
        this._createWrapper();
        this._element.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',this.settings.data.path);
        this._element.setAttribute('preserveAspectRatio','xMidYMid meet');
        this._element.style.overflow = 'visible';
        this._element.setAttribute('x',0);
        this._element.setAttribute('y',0);
        this._element.setAttribute('width',this.settings.width);
        this._element.setAttribute('height',this.settings.height);
        this._wrapper.appendChild(this._element);
        this._wrapper.setAttribute('viewBox','0 0 '+this.settings.size.width /this.settings.scalingFactor + ' '+this.settings.size.height / this.settings.scalingFactor);
        this._wrapper.style.overflow = 'visible';
    }
}

export {
    WrapviewVectorPath,
    WrapviewVectorCircle,
    WrapviewVectorImage,
    WrapviewVectorObject
}
