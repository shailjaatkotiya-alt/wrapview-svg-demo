<template>
    <div :id="viewport_id" class="w-full h-full"></div>
</template>

<script>
import {
    WrapviewSettings
} from "../../Wrapview/WrapviewSettings.js";
import {HemisphereLight} from "three";
import {OrbitControls} from "../../Wrapview/plugins/OrbitControls.js";
import {Wrapview} from "../Wrapview.js";

export default {
    props: ['viewport_id'],
    name: "WrapviewViewer",
    mounted() {

    },
    methods: {
        capture(){
            return new Promise((resolve, reject)=>{
                var imageData = Wrapview.instance(this.viewport_id).renderer().domElement.toDataURL();
                resolve(imageData);
            });
        },
        resetSize(){
            if(!Wrapview.instance(this.viewport_id)) {
                return;
            }
            var viewer = document.getElementById(this.viewport_id);
            Wrapview.instance(this.viewport_id).renderer().setSize(viewer.clientWidth, viewer.clientHeight);
            Wrapview.instance(this.viewport_id).camera().aspect = (viewer.clientWidth/viewer.clientHeight);
            Wrapview.instance(this.viewport_id).camera().updateProjectionMatrix();
        },
        setSize(s){
            Wrapview.instance(this.viewport_id).renderer().setSize(s.w,s.h);
            Wrapview.instance(this.viewport_id).camera().aspect = (s.w/s.h);
            Wrapview.instance(this.viewport_id).camera().updateProjectionMatrix();
        },
        init(settings){
            const instance = Wrapview.makeInstance(this.viewport_id,settings);
            instance.draw(document.getElementById(this.viewport_id));
            instance.animate();

        }
    }
}
</script>

<style scoped>

</style>
