import * as VectorShapes from "./WrapviewVector";
class WrapviewVectorPanel extends VectorShapes.WrapviewVectorObject {
    constructor(settings) {
        super(settings);
    }

    _createWrapper(){
        if(this._wrapper !== null) {
            this._wrapper.remove();
        }
        this._wrapper = document.createElementNS('http://www.w3.org/2000/svg','svg');
        this._wrapper.setAttribute('id',this._id+'_wrapper');
    }

    init(){
        this._createWrapper();
        this._props = _.cloneDeep(this.settings.data.size.value('pivot').properties);
        this.settings.size = this._props.outline.size;
        this.outline = new VectorShapes[this._props.outline.type](this._props.outline);
        this.inline = new VectorShapes[this._props.inline.type](this._props.inline);
        this.anchor = new VectorShapes.WrapviewVectorCircle({
            data:{
                radius: 10,
            },
            size: {
                width: 20,
                height: 20
            },
            position: this._props.anchor
        });
        this.anchor.setFill('#FF0000');
        this.outline.setStroke('#FF0000');
        this.outline.setFill('none');
        this.inline.setFill('#FFFFFF');
        this.inline.setStroke('#FF0000');

        this._wrapper.setAttribute('viewBox','0 0 '+this.settings.size.width+' '+this.settings.size.height);
        this._wrapper.style.overflow = 'visible';

        this.outline.draw(this._wrapper);
        this.inline.draw(this._wrapper);
        this.anchor.draw(this._wrapper);

    }

    setBaseColor(c) {
        this.inline.setFill(c);
    }

}


class WrapviewVectorPrintFile {
    constructor(settings) {
        this.id = guid();
        this.settings = {};
        this._wrapper = null;
        this._container = null;
        _.assign(this.settings, this.defaults(), settings);
        this.init();
    }

    defaults(){
        return {
            mode: 'single',
            canvas: {
                size: {
                    width: 1,
                    height: 1
                }
            },
            size: {
                width: 0,
                height: 0
            }
        }
    }

    makeDownloadLink(linkId){
        // Get svg source
        var serializer = new XMLSerializer()
        var source = serializer.serializeToString(this._wrapper)

        // Add name spaces
        if (!source.match(/^<svg[^>]*?\sxmlns=(['"`])https?\:\/\/www\.w3\.org\/2000\/svg\1/)) {
            source = source.replace(/^<svg/, '<svg xml:space="preserve" xmlns="http://www.w3.org/2000/svg"')
        }
        if (!source.match(/^<svg[^>]*?\sxmlns:xlink=(['"`])http\:\/\/www\.w3\.org\/1999\/xlink\1/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
        }

        // Add xml declaration
        source = '<?xml version="1.0" ?>\r\n' + source

        // Convert SVG source to URI data scheme
        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source)

        // Set url value to a element's href attribute
        document.getElementById(linkId).href = url
    }

    _createWrapper() {
        if(this._wrapper !== null) {
            this._wrapper.remove();
        }
        this._wrapper = document.createElementNS('http://www.w3.org/2000/svg','svg');
        this._wrapper.setAttribute('id','svg_'+'_'+this.id);

        this._wrapper.setAttribute('width',this.settings.canvas.size.width);
        this._wrapper.setAttribute('height',this.settings.canvas.size.height);

    }

    setContainer(c) {
        this._container = c;
        this.setCanvasSize({
            width: c.clientWidth,
            height: c.clientHeight
        });
        this._container.appendChild(this._wrapper);
    }

    setCanvasSize(s) {
        this.settings.canvas.size = s;
        this._wrapper.setAttribute('width',this.settings.canvas.size.width);
        this._wrapper.setAttribute('height',this.settings.canvas.size.height);
    }

    setMaterials(m){
        this.materials = m;
    }

    init(){
        this._createWrapper();
    }

    drawAll(size_shortcode) {
        this._wrapper.setAttribute('viewBox','0 0 '+this.settings.size.width+' '+this.settings.size.height);

        var panels = Object.keys(this.materials.all());
        panels.forEach((p)=>{
            this.draw(p, size_shortcode);
        });
    }

    draw(p, size_shortcode){
        var panel = this.materials.get(p);
        var sizes = panel.panel()?.child('sizes')?.fetch('shortcode',size_shortcode);
        if(!sizes || sizes.length <= 0) {
            return;
        }
        var size = sizes[0];
        var props = size.value('pivot').properties;
        var vectorPanel;
        if(this.settings.mode === 'single') {
            vectorPanel = new WrapviewVectorPanel({
                pivot: {
                    x: 0,
                    y: 0
                },
                position: {
                    x: 0,
                    y: 0
                },
                size: props.size,
                data: {
                    size: size
                }
            });
            this._wrapper.setAttribute('viewBox','0 0 '+this.settings.size.width+' '+this.settings.size.height);

        } else {
            vectorPanel = new WrapviewVectorPanel({
                size: props.size,
                position: props.position,
                pivot: {
                    x: 0,
                    y: 0
                },
                transform: {
                    rotate: props.transform.rotate
                },
                data: {
                    size: size
                }
            });
        }

        vectorPanel.setSize(size);
        vectorPanel.init();
        vectorPanel.draw(this._wrapper);
        panel.settings.diffuseTexture.renderPrint(vectorPanel);
    }

    setBaseColor(c) {
        this.inline.setFill(c);
    }
}

export {
    WrapviewVectorPrintFile
}
