export class WrapviewEditor {
    constructor(id, instance) {
        this.id = id;
        this._instance = instance;
        this._div = null;
        this._agent = {

        };
        this._container = null;
        this._status = -1;
        this._shouldSnap = 0;
        this._snapState = {
            x: false,
            y: false
        }
        this.init();
    }

    setLayer(i) {
        this._currentIndex = i;
    }

    canvas() {
        return this._canvas;
    }

    init() {
        /*
        this._div = document.createElement('div');
        this._div.className = 'absolute inset-0';
        this._canvas = document.createElement('canvas');
        this._canvas.setAttribute('id',this.id);
        this._canvas.setAttribute('tabindex',0);
        this._canvas.className = "focus:outline-none";
        this._canvas.width = 1;
        this._canvas.height = 1;
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0px';
        this._canvas.style.left = '0px';
        this._context = this._canvas.getContext('2d');

         */
    }

    release() {

    }

    instance() {
        return this._instance;
    }

    refresh() {
        if (this._container === null) return;
    }

    setEditorElement(elem, container) {
        this._canvas = elem;
        /*
        this._canvas.addEventListener('mousedown',(e)=>{

            if(this.instance().texture() === null) return;
            console.log(this.instance().texture())
            if(this.instance().texture().isEditingLayer()) {

                this.instance().texture().stopEditingLayer();
            } else {
                if(this.instance().texture().selectLayer({
                    x: e.layerX,
                    y: e.layerY
                })) {
                    this._status = 1;
                    this._canvas.style.cursor = 'grabbing';
                }
            }
        })
        */

        /*
        this._canvas.addEventListener('mousedown',(e)=>{
            if(this.instance().texture() === null) return;
            this._agent.isMouseDown = true;
            this._status = 0;

            if(this.instance().texture().isEditingLayer()) {
                var layer = this.instance().texture().editingLayer();
                if (layer !== null && !layer.isLocked) {
                    if (layer.isScale({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._status = 2;
                    } else if (layer.isRotation({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._status = 3;
                    } else if (layer.isInBounds({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._status = 1;
                        this._canvas.style.cursor = 'grabbing';
                    } else if(this.instance().texture().selectLayer({
                        x: e.layerX,
                        y: e.layerY
                    })) {
                        this._status = 1;
                        this._canvas.style.cursor = 'grabbing';
                    } else {
                        this.instance().texture().stopEditingLayer();
                    }
                }
            } else {
                if(this.instance().texture().selectLayer({
                    x: e.layerX,
                    y: e.layerY
                })) {
                    this._status = 1;
                    this._canvas.style.cursor = 'grabbing';
                }
            }

            this._agent.initial = {
                screenX: e.screenX,
                screenY: e.screenY,
                x: e.clientX,
                y: e.clientY,
                layerX: e.layerX,
                layerY: e.layerY
            };
            this._agent.previous = {
                screenX: e.screenX,
                screenY: e.screenY,
                x: e.clientX,
                y: e.clientY,
                layerX: e.layerX,
                layerY: e.layerY
            };
        });

        this._canvas.addEventListener('mouseup',(e)=>{
            if(this.instance().texture() === null) return;
            if(this._agent.isMouseDown) {
                this._agent.isMouseDown = false;
                this._canvas.style.cursor = 'pointer';
                this._snapState = {
                    x: false,
                    y: false
                }
                this.render();
            }
        });

        this._canvas.addEventListener('mousemove',(e)=>{
            if(this.instance().texture() === null) return;
            if(this._agent.isMouseDown) {

                var dIX = e.screenX - this._agent.initial.screenX;
                var dIY = e.screenY - this._agent.initial.screenY;

                var dX = e.screenX - this._agent.previous.screenX;
                var dY = e.screenY - this._agent.previous.screenY;

                this._snapState = {
                    x: false,
                    y: false
                }

                var layer = this.instance().texture().editingLayer();
                if(layer !== null && !layer.isLocked) {
                    if(this._status === 1) {

                        var point = {
                            x: layer.settings.position.x + dX*this.instance().texture().offsets().ratio.x,
                            y: layer.settings.position.y + dY*this.instance().texture().offsets().ratio.y
                        }

                        if(this._shouldSnap) {
                            var snap = WrapviewUtils.snap(point, this.instance().texture().settings.size);
                            point = snap.point;
                            this._snapState = snap.snapState;
                        }


                        layer.setPosition(point);
                        layer.setNeedsUpdate();
                    } else if (this._status === 2) {
                        var diff = dX*this.instance().texture().offsets().ratio.x + dY*this.instance().texture().offsets().ratio.y;
                        if(this._shouldSnap) {
                            //
                        }
                        if(layer instanceof WrapviewImageLayer) {
                            layer.setSize({
                                width: layer.settings.size.width + diff
                            });
                            layer.setNeedsUpdate();
                        } else if(layer instanceof WrapviewTextLayer) {
                            diff = Math.ceil(diff,0);
                            layer.setFontSize(layer.settings.fontSize + diff);
                            layer.setNeedsUpdate();
                        }

                    } else if (this._status === 3) {
                        var origin = layer.settings.position;
                        var p1 = {
                            x: this._agent.previous.layerX * this.instance().texture().offsets().ratio.x,
                            y: this._agent.previous.layerY * this.instance().texture().offsets().ratio.y
                        };
                        var p2 = {
                            x: e.layerX * this.instance().texture().offsets().ratio.x,
                            y: e.layerY * this.instance().texture().offsets().ratio.y
                        };
                        var v1 = WrapviewUtils.vector(p1,origin);
                        var v2 = WrapviewUtils.vector(p2,origin);
                        var angle = WrapviewUtils.angleBetween(v1,v2);

                        var newAngle = WrapviewUtils.snapAngle(layer.settings.angle + angle);
                        layer.setAngle(layer.settings.angle + angle);
                        layer.setNeedsUpdate();
                    }

                }


                this._agent.previous = {
                    screenX: e.screenX,
                    screenY: e.screenY,
                    x: e.clientX,
                    y: e.clientY,
                    layerX: e.layerX,
                    layerY: e.layerY
                };
            } else {
                var layer = this.instance().texture().editingLayer();
                if(layer !== null && !layer.isLocked && layer._bounds !== null) {
                    if(layer.isScale({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._canvas.style.cursor = 'nwse-resize';
                    } else if (layer.isRotation({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._canvas.style.cursor = 'url("/img/rotate.svg"), alias';
                    } else if(layer.isInBounds({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._canvas.style.cursor = 'grab';
                    } else {
                        this._canvas.style.cursor = 'pointer';
                    }
                } else {
                    this._canvas.style.cursor = 'pointer';
                }
            }
        });
        */
        /*
        this._canvas.addEventListener('keydown',(e)=>{
            if(this.instance().texture() === null) return;
            if(e.key === "Shift") {
               this._shouldSnap = true;
           }
        });

        this._canvas.addEventListener('keyup',(e)=>{
            if(this.instance().texture() === null) return;
            if(e.key === "Shift") {
                this._shouldSnap = false;
            } else {
                var shouldNudge = false;
                var nudge = {
                    x: 0,
                    y: 0
                }
                switch (e.key) {
                    case "ArrowLeft":
                        shouldNudge = true;
                        nudge.x = -1;
                        break;
                    case "ArrowRight":
                        shouldNudge = true;
                        nudge.x = 1;
                        break;
                    case "ArrowUp":
                        shouldNudge = true;
                        nudge.y = -1
                        break;
                    case "ArrowDown":
                        shouldNudge = true;
                        nudge.y = 1;
                        break;
                }
                if(shouldNudge) {

                    var layer = this.instance().texture().editingLayer();
                    if(layer !== null && !layer.isLocked) {
                        if (this._status === 1) {

                            var point = {
                                x: layer.settings.position.x + nudge.x,
                                y: layer.settings.position.y + nudge.y
                            }

                            layer.setPosition(point);
                            layer.setNeedsUpdate();
                        }
                    }
                }
            }
        });
        this._canvas.addEventListener('mouseup',(e)=>{
            if(this.instance().texture() === null) return;
            if(this._agent.isMouseDown) {
                this._agent.isMouseDown = false;
                this._canvas.style.cursor = 'pointer';
                this._snapState = {
                    x: false,
                    y: false
                }
                this.render();
            }
        });
        this._canvas.addEventListener('mouseleave',(e)=>{
            if(this._agent.isMouseDown) {
                this._agent.isMouseDown = false;
                this._canvas.style.cursor = 'auto';
            }
        });

        this._canvas.addEventListener('mousedown',(e)=>{
            if(this.instance().texture() === null) return;
            this._agent.isMouseDown = true;
            this._status = 0;

            if(this.instance().texture().isEditingLayer()) {
                var layer = this.instance().texture().editingLayer();
                if (layer !== null && !layer.isLocked) {
                    if (layer.isScale({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._status = 2;
                    } else if (layer.isRotation({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._status = 3;
                    } else if (layer.isInBounds({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._status = 1;
                        this._canvas.style.cursor = 'grabbing';
                    } else if(this.instance().texture().selectLayer({
                            x: e.layerX,
                            y: e.layerY
                        })) {
                            this._status = 1;
                            this._canvas.style.cursor = 'grabbing';
                    } else {
                        this.instance().texture().stopEditingLayer();
                    }
                }
            } else {
                if(this.instance().texture().selectLayer({
                    x: e.layerX,
                    y: e.layerY
                })) {
                    this._status = 1;
                    this._canvas.style.cursor = 'grabbing';
                }
            }

            this._agent.initial = {
                screenX: e.screenX,
                screenY: e.screenY,
                x: e.clientX,
                y: e.clientY,
                layerX: e.layerX,
                layerY: e.layerY
            };
            this._agent.previous = {
                screenX: e.screenX,
                screenY: e.screenY,
                x: e.clientX,
                y: e.clientY,
                layerX: e.layerX,
                layerY: e.layerY
            };
        });

        this._canvas.addEventListener('mousemove',(e)=>{
            if(this.instance().texture() === null) return;
            if(this._agent.isMouseDown) {

                var dIX = e.screenX - this._agent.initial.screenX;
                var dIY = e.screenY - this._agent.initial.screenY;

                var dX = e.screenX - this._agent.previous.screenX;
                var dY = e.screenY - this._agent.previous.screenY;

                this._snapState = {
                    x: false,
                    y: false
                }

                var layer = this.instance().texture().editingLayer();
                if(layer !== null && !layer.isLocked) {
                    if(this._status === 1) {

                        var point = {
                            x: layer.settings.position.x + dX*this.instance().texture().offsets().ratio.x,
                            y: layer.settings.position.y + dY*this.instance().texture().offsets().ratio.y
                        }

                        if(this._shouldSnap) {
                            var snap = WrapviewUtils.snap(point, this.instance().texture().settings.size);
                            point = snap.point;
                            this._snapState = snap.snapState;
                        }


                        layer.setPosition(point);
                        layer.setNeedsUpdate();
                    } else if (this._status === 2) {
                        var diff = dX*this.instance().texture().offsets().ratio.x + dY*this.instance().texture().offsets().ratio.y;
                        if(this._shouldSnap) {
                            //
                        }
                        if(layer instanceof WrapviewImageLayer) {
                            layer.setSize({
                                width: layer.settings.size.width + diff
                            });
                            layer.setNeedsUpdate();
                        } else if(layer instanceof WrapviewTextLayer) {
                            diff = Math.ceil(diff,0);
                            layer.setFontSize(layer.settings.fontSize + diff);
                            layer.setNeedsUpdate();
                        }

                    } else if (this._status === 3) {
                        var origin = layer.settings.position;
                        var p1 = {
                            x: this._agent.previous.layerX * this.instance().texture().offsets().ratio.x,
                            y: this._agent.previous.layerY * this.instance().texture().offsets().ratio.y
                        };
                        var p2 = {
                            x: e.layerX * this.instance().texture().offsets().ratio.x,
                            y: e.layerY * this.instance().texture().offsets().ratio.y
                        };
                        var v1 = WrapviewUtils.vector(p1,origin);
                        var v2 = WrapviewUtils.vector(p2,origin);
                        var angle = WrapviewUtils.angleBetween(v1,v2);

                        var newAngle = WrapviewUtils.snapAngle(layer.settings.angle + angle);
                        layer.setAngle(layer.settings.angle + angle);
                        layer.setNeedsUpdate();
                    }

                }


                this._agent.previous = {
                    screenX: e.screenX,
                    screenY: e.screenY,
                    x: e.clientX,
                    y: e.clientY,
                    layerX: e.layerX,
                    layerY: e.layerY
                };
            } else {
                var layer = this.instance().texture().editingLayer();
                if(layer !== null && !layer.isLocked && layer._bounds !== null) {
                    if(layer.isScale({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._canvas.style.cursor = 'nwse-resize';
                    } else if (layer.isRotation({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._canvas.style.cursor = 'url("/img/rotate.svg"), alias';
                    } else if(layer.isInBounds({
                        x: e.layerX * this.instance().texture().offsets().ratio.x,
                        y: e.layerY * this.instance().texture().offsets().ratio.y
                    })) {
                        this._canvas.style.cursor = 'grab';
                    } else {
                        this._canvas.style.cursor = 'pointer';
                    }
                } else {
                    this._canvas.style.cursor = 'pointer';
                }
            }
        })
         */
    }
    prep() {
        //this._canvas.width = this.instance().texture().settings.size.width;
        //this._canvas.height = this.instance().texture().settings.size.height;
    }
    render() {
        /*
        console.log("-- Rendering Editor --")

        if(!this.instance().texture().isEditingLayer()) {
            this._context?.clearRect(0,0, this._canvas.width, this._canvas.height);
            return;
        }
        this.prep();
        this._context.clearRect(0,0, this.instance().texture().settings.size.width, this.instance().texture().settings.size.height)
        //console.log(this.instance().texture().settings.size.width);
        //this._context.fillStyle = '#00FF00'
        //this._context.fillRect(0,0, this.instance().texture().settings.size.width, this.instance().texture().settings.size.height);


        //console.log(this._snapState);

        if(this._snapState.x) {
            this._context.beginPath();
            this._context.moveTo(this.instance().texture().settings.size.width / 2, 0);
            this._context.lineTo(this.instance().texture().settings.size.width / 2, this.instance().texture().settings.size.height);
            this._context.lineWidth = 1;
            this._context.strokeStyle = '#ff0000';
            this._context.stroke();
        }
        if(this._snapState.y) {
            this._context.beginPath();
            this._context.moveTo(0, this.instance().texture().settings.size.height / 2);
            this._context.lineTo(this.instance().texture().settings.size.width, this.instance().texture().settings.size.height / 2);
            this._context.lineWidth = 1;
            this._context.strokeStyle = '#ff0000';
            this._context.stroke();
        }

        var layer = this.instance().texture().editingLayer();
        console.log("-- Drawing Handles For --",layer);
        if(layer !== null) {
            layer.drawHandles(this._context, this);
        }

         */
    }

}