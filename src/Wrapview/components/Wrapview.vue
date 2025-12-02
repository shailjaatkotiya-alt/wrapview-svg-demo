<template>
    <div class="w-full h-full">
        <div id="fontContainer" class="fixed -top-20 -left-full"></div>
        <wrapview-viewer  v-if="!loading.viewer" v-show="showing.viewer"
                              :viewport_id="viewport_id"
                              ref="wrapviewViewer"
        ></wrapview-viewer>
        <slot></slot>
    </div>
</template>

<script>
import Crux from '@etlok-systems/crux-dashboard';
import {Wrapview} from "../Wrapview.js";
import {WrapviewUtils} from "../WrapviewUtils.js";
export default {
    name: "Wrapview",
    data(){
        return {
            viewport_id: '',
            loading: {
                viewer: false
            },
            showing: {
                viewer: false
            }
        }
    },
    mounted() {
        this.init();
    },
    methods: {
        init(){
            this.viewport_id = WrapviewUtils.guid();
            this.loading.viewer = false;
            setTimeout(()=>{
                this.$emit("onInitalized");
            },100);
        },
        show() {
            this.showing.viewer = true;
        },
        hide() {
            this.showing.viewer = false;
        },
        viewer(){
            return this.$refs['wrapviewViewer'];
        },
        instance(){
            return Wrapview.instance(this.viewport_id);
        },
        unload(){
            return Wrapview.destroyInstance(this.viewport_id);
        }
    }
}
</script>

<style scoped>

</style>
