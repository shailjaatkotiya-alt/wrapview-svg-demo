import {Wrapview} from "./Wrapview";
import {OrbitControls} from "./plugins/OrbitControls";
import {DoubleSide, HemisphereLight, LoadingManager, MeshBasicMaterial, TorusKnotGeometry} from "three";
import {OBJLoader} from "./plugins/ObjLoader";

class WrapviewViewer {
    constructor(id) {
        this.id = id;
        this.animate = ()=>{
            requestAnimationFrame( this.animate );
            this.wrapview._controller.update();
            this.wrapview._renderer.render( this.wrapview._scene, this.wrapview._camera );
        }
    }

    init() {
        this.wrapview = new Wrapview('modelTest',{});
        this.wrapview.init();
        var orbitController = new OrbitControls(this.wrapview.camera(), this.wrapview.renderer().domElement);
        this.wrapview.setController(orbitController);
        var manager = new LoadingManager();
        var objLoader = new OBJLoader(manager);
        this.wrapview.setLoader(objLoader);
        this.wrapview.draw(document.getElementById(this.id));
        const hemLight = new HemisphereLight(0xffffff, 0x040404, 1);
        this.wrapview.addLight(hemLight);


        const geometry = new TorusKnotGeometry();
        var cube = new THREE.Mesh( geometry, new MeshLambertMaterial({
            map: texture,
            color: '#FFFFFF'
        }) );
        this.wrapview._scene.add(cube);
        this.animate();
        /*
        this.wrapview.load('https://combibmark.s3.amazonaws.com/v2/models/01MTS_BASIC_LOD0.obj',{
            scale: {
                x: 1,
                y: 1,
                z: 1
            },
            setMaterial(child){
                if(child.name === '99_ShadowPanel') {
                    var material = new MeshBasicMaterial({
                        //map: textures[child.name].map,
                        color: 0xffffff,
                        side: DoubleSide,
                        transparent: false
                    });
                    return material;
                } else {
                    var material = new MeshBasicMaterial({
                        //map: textures[child.name].map,
                        color: 0xffffff,
                        side: DoubleSide,
                        transparent: false
                    });
                    return material;
                }
            }
        }).then(()=>{
            this.animate();
        })
        */

    }

}


export {
    WrapviewViewer
};
