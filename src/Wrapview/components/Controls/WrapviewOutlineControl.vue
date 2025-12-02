<template>
    <div class="w-full py-2">
        <div class="outline-control justify-between items-center flex my-2
                    py-2 border-t border-slate-600">
            <p class="font-bold uppercase text-white text-xs">Include Outline</p>
            <Toggle v-model="switchValue" @change="toggleOutline"/>
        </div>
        <wrapview-color-control
            ref="outlineColorControl"
            key="outline_control"
            label="OUTLINE COLOR"
            v-if="switchValue"
            :color="outline.color"
            :materials="materials"
            :variables="variables"
            :allow="{inherit: false}"
            @onChange="setOutlineColor"
        ></wrapview-color-control>
        <wrapview-number-control
            v-if="switchValue"
            :value="outline.thickness"
            label="THICKNESS"
            @onChange="setOutlineThickness"
        ></wrapview-number-control>
    </div>
</template>

<script>
import Slider from '@vueform/slider';
import {LockIcon, LockOpenIcon, VariableIcon, VariableOffIcon} from 'vue-tabler-icons';
import Toggle from '@vueform/toggle'
export default {
    props:['outline','materials','variables'],
    name: "WrapviewOutlineControl",
    components: {
        LockIcon, LockOpenIcon,VariableIcon, VariableOffIcon, Toggle
    },
    data(){
        return {
            switchValue: false
        }
    },
    mounted() {
        this.init();
    },
    methods:{
        init(){
            this.switchValue = this.outline.include;
        },
        toggleOutline() {
            this.$emit("onChange",{
                include: this.switchValue,
                thickness: this.outline.thickness,
                color: this.outline.color
            });
        },
        setOutlineColor(){
            console.log(this.outline.color);
            this.$emit("onChange",{
                include: this.switchValue,
                thickness: this.outline.thickness,
                color: this.outline.color
            });
        },
        setOutlineThickness(num){

            this.$emit("onChange",{
                include: this.switchValue,
                thickness: num,
                color: this.outline.color
            });
        }

    }
}
</script>
<style src="@vueform/toggle/themes/default.css"></style>
<style scoped>
.outline-control {
    --toggle-width: 2rem;
    --toggle-height: 1rem;
    --toggle-border: 1px;
    --toggle-font-size: 0.25rem;
    --toggle-ring-width: 0px;
    --toggle-border-on: rgb(250 204 21);
    --toggle-border-off: rgb(133 77 14);
    --toggle-ring-color: rgb(250 204 21);
    --toggle-bg-on: rgb(250 204 21);
    --toggle-bg-off: rgb(133 77 14);
    --toggle-handle-enabled: rgb(41 37 36);
    --toggle-handle-disabled: #f3f4f6;
}
</style>
