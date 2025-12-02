<template>
    <div class="w-full flex justify-start items-center">
        <div class="w-1/3 flex justify-center items-center">
            <p class="font-bold text-gray-900 text-xs mr-0.5">
                x:
            </p>
            <input type="number"
                   max="2048"
                   ref="x"
                   :value="parseFloat(position.x).toFixed(2)"
                   class="w-full border-none text-xs text-gray-900 bg-transparent font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800 p-0 text-right"
                   @change="onChange"
            />
            <p class="font-light text-gray-900 text-xs pl-0.5">
                <small>px</small>
            </p>
        </div>
        <div class="w-1/3 ml-1 flex justify-center items-center">
            <p class="font-bold text-gray-900 text-xs mr-0.5">
                y:
            </p>
            <input type="number"
                   max="2048"
                   ref="y"
                   :value="parseFloat(position.y).toFixed(2)"
                   class="w-full border-none text-xs text-gray-900 bg-transparent font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800 p-0 text-right"
                   @change="onChange"
            />
            <p class="font-light text-gray-900 text-xs pl-0.5">
                <small>px</small>
            </p>
        </div>
        <div class="w-1/3 ml-1 flex justify-center items-center">
            <p class="font-light text-gray-900 text-xs mr-0.5">
                <angle-icon size="12"></angle-icon>
            </p>
            <input type="number"
                   max="360"
                   ref="angle"
                   :value="makeDegrees(angle)"
                   class="w-full border-none text-xs text-gray-900 bg-transparent font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800 p-0 text-right"
                   @change="onChangeAngle"
            />
            <p class="font-light text-gray-900 text-xs ml-0.5">
                <small>°</small>
            </p>
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
