<template>
    <div class="w-full h-full">
        <div v-if="showing.variables">
            <div  class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-start items-center">
                <div @click="hidePicker" class="w-4 h-4 mr-2 flex justify-center items-center">
                    <chevron-right-icon size="18" class="transform rotate-180"></chevron-right-icon>
                </div>
                <div>
                    <p class="text-sm font-bold">Select A Variable</p>
                </div>
            </div>
            <template  v-for="variable in variables?.all()">
                <div @click="selectVariable(variable)" v-if="variable.type === 'color'" class="cursor-pointer bg-white px-4 py-2 hover:bg-slate-200 flex justify-start items-center">
                    <div>
                        <p class="text-xs font-sans text-gray-900">{{ variable.field }}</p>
                    </div>
                </div>
            </template>
        </div>
        <div v-else class="w-full h-full flex flex-col flex-1">
            <div v-if="outline !== null"
                 class="cursor-pointer w-full bg-slate-100 border-b border-slate-200 px-4 py-2
                 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center">Show Outline</p>
                </div>
                <div>
                    <Toggle v-model="toggleValue" @change="toggleValueOutline"/>
                </div>
            </div>
            <div v-if="outline !== null && toggleValue"
                 class="cursor-pointer w-full bg-slate-100 border-b border-slate-200 px-4 py-2
                 flex justify-between items-center flex-no-wrap">
                <div class="w-fit text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center">Size: ({{thickness}}px)</p>
                </div>
                <div class="w-full">
                    <Slider
                        :min="1"
                        :max="20"
                        :step="1"
                        :lazy="false"
                        v-model="thickness"
                        :tooltips="false"
                        @update="toggleOutline"
                    />
                </div>
            </div>
            <div v-if="outline !== null && outline.color.value() !== null" class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div>
                    <p class="text-sm font-bold">Current Color:</p>
                    <div v-if="outline.color._type === 'variable'" class="w-full text-xs font-bold text-slate-500 mt-2">
                        <p class="flex justify-start w-full items-center"> <variable-icon size="18"></variable-icon> Applied from variable &nbsp;<span class="text-slate-600">{{variables.get(outline.color._key).field}}</span> &nbsp;</p>
                    </div>
                </div>
                <div class="pointer border-gray-500 peer rounded-full w-6 h-6 border flex justify-center items-center relative">
                    <div class="rounded-full w-4 h-4 border"
                         :style="bgColorRaw(outline.color.value())"
                    >

                    </div>
                </div>
            </div>



            <div @click="unlockColor" v-if="outline !== null && outline.color.value() !== null && outline.color._type === 'variable'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center"> <variable-off-icon size="18" :stroke-width="1" class="mr-2"></variable-off-icon> Unlock Color</p>
                </div>
            </div>

            <div @click="showVariablePicker" v-if="outline.color._type === 'fixed'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500 flex justify-between items-center">
                    <p class="flex justify-start w-full items-center"> <variable-icon size="18" :stroke-width="1" class="mr-2"></variable-icon> Select From A Variable</p>
                    <div class="w-4 h-4 flex justify-center items-center">
                        <chevron-right-icon size="18"></chevron-right-icon>
                    </div>
                </div>

            </div>
            <div v-if="outline.color._type === 'fixed' && toggleValue" class="px-4 py-2">
                <input type="text"
                       v-model="search"
                       class="w-full h-8 px-2 py-2 text-xs text-gray-900 bg-transparent
                    border-b border-slate-200
                    font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       placeholder="Search By Color Name or Pantone Number"
                >
            </div>
            <div v-if="outline.color._type === 'fixed' && toggleValue" class="w-full h-full overflow-auto grid grid-cols-6 gap-1 px-4 py-4">
                <template v-for="(pantone, number) in colors">
                    <div class="" v-if="shouldShow(pantone, number)">
                        <div @click="onPick('#'+pantone.hex)"
                             class="pointer peer rounded-full w-6 h-6 border m-auto flex justify-center items-center relative"
                             :class="{
                            'border-pink-500': pantone.hex === outline.color.value()?.toLowerCase(),
                            'border-gray-500': pantone.hex !== outline.color.value()?.toLowerCase()
                         }"
                        >
                            <div class="rounded-full w-4 h-4 border"
                                 :style="bgColorRaw('#'+pantone.hex)"
                            >

                            </div>
                        </div>
                    </div>
                </template>

            </div>
        </div>
    </div>

</template>

<script>
import {LockIcon, LockOpenIcon, VariableIcon, VariableOffIcon, DeviceFloppyIcon, ChevronRightIcon} from 'vue-tabler-icons';
import {WrapviewVariable} from "../../../Wrapview/WrapviewVariable";
import {Variable} from "../../../Manager/Manager";
import Toggle from '@vueform/toggle'
import Slider from '@vueform/slider';
export default {
    props:['template','current_panel','label','outline','materials','variables','allow'],
    name: "WrapviewWizardColorPicker",
    components: {
        Slider, Toggle,
        LockIcon, LockOpenIcon,VariableIcon, VariableOffIcon,DeviceFloppyIcon, ChevronRightIcon
    },
    data(){
        return {
            toggleValue: false,
            thickness: 1,
            settings: {
                variables: {
                    styles: {},
                    show: {
                        labels: true,
                        buttons: true
                    },
                }
            },
            search: '',
            colors: _colors,
            showing: {
                variables: false
            },
            allowed: {
                variable: true,
                inherit: true
            }
        }
    },
    mounted() {
        this.init();
    },
    methods:{
        toggleOutline(){
            this.$emit("onChange",{
                include: this.toggleValue,
                thickness: this.thickness,
                color: this.outline.color
            });
        },
        shouldShow(p, n){
            if(this.search === '') return true;
            var search = this.search.toLowerCase();
            if(n.indexOf(search) !== -1) {
                return true;
            }
            if(p.name.indexOf(search) !== -1 ) {
                return true;
            }
            return false;
        },
        bgColorRaw(color){
            return 'background-color: '+color+'; ';
        },
        init(){
            if(typeof this.allow === 'undefined') return;
            this.allowed = _.assign(this.allowed,this.allow);
            this.toggleValue = this.outline.include;
            this.thickness = this.outline.thickness
        },
        hidePicker() {
            this.showing.variables = false;
        },
        onPick(color){
            this.outline.color.setValue(color);
            this.$emit("onChange",{
                include: this.toggleValue,
                thickness: this.thickness,
                color: this.outline.color
            });
        },
        unlockColor(){
            this.outline.color.unlock();
            this.$emit("onChange",{
                include: this.toggleValue,
                thickness: this.thickness,
                color: this.outline.color
            });
        },
        showVariablePicker(){
            this.showing.variables = true;
        },
        selectVariable(variable){
            this.hidePicker();
            this.outline.color.attachToVariable(variable.guid);
            this.$emit("onChange",{
                include: this.toggleValue,
                thickness: this.thickness,
                color: this.outline.color
            });
        }
    }
}
</script>
<style src="@vueform/slider/themes/default.css"></style>

<style scoped>

</style>
