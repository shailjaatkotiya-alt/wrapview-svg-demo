<template>
    <div class="w-full py-2">
        <p class="font-bold uppercase text-white text-xs">
            POSITION
        </p>
        <div class="w-full flex justify-center items-center mt-1">
            <div class="w-1/3 flex justify-center items-center">
                <p class="font-light text-white text-xs mr-2">
                    x:
                </p>
                <input type="number"
                       max="2048"
                       ref="x"
                       :value="parseFloat(position.x).toFixed(2)"
                       class="w-full h-8 px-2 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       @change="onChange"
                />
                <p class="font-light text-white text-xs ml-2">
                    <small>px</small>
                </p>
            </div>
            <div class="w-1/3 ml-2 flex justify-center items-center">
                <p class="font-light text-white text-xs mr-2">
                    y:
                </p>
                <input type="number"
                       max="2048"
                       ref="y"
                       :value="parseFloat(position.y).toFixed(2)"
                       class="w-full h-8 px-2 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       @change="onChange"
                />
                <p class="font-light text-white text-xs ml-2">
                    <small>px</small>
                </p>
            </div>
            <div class="w-1/3 ml-2 flex justify-center items-center">
                <p class="font-light text-white text-xs mr-2">
                    <angle-icon size="18"></angle-icon>
                </p>
                <input type="number"
                       max="360"
                       ref="angle"
                       :value="makeDegrees(angle)"
                       class="w-full h-8 px-2 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       @change="onChangeAngle"
                />
                <p class="font-light text-white text-xs ml-2">
                    <small>°</small>
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import {AngleIcon} from 'vue-tabler-icons';
import {WrapviewUtils} from "../../../Wrapview/WrapviewUtils.js";
export default {
    props:['position','angle'],
    name: "WrapviewPositionControl",
    components:{
        AngleIcon
    },
    data(){
        return {}
    },
    methods:{
        makeDegrees(a){
            return WrapviewUtils.toDegrees(a).toFixed(2);
        },
        onChange(){
            this.$emit('onChange', {
                x: parseFloat(this.$refs['x'].value),
                y: parseFloat(this.$refs['y'].value)
            });
        },
        onChangeAngle(){
            this.$emit('onChangeAngle', WrapviewUtils.toRadians(this.$refs['angle'].value));
        }
    }
}
</script>

<style scoped>

</style>
