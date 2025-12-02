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
                <div @click="selectVariable(variable)" v-if="variable.type === 'text'" class="cursor-pointer bg-white px-4 py-2 hover:bg-slate-200 flex justify-start items-center">
                    <div>
                        <p class="text-xs font-sans text-gray-900">{{ variable.field }}</p>
                    </div>
                </div>
            </template>
        </div>
        <div v-if="showing.fonts">
            <div  class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-start items-center">
                <div @click="hidePicker" class="w-4 h-4 mr-2 flex justify-center items-center">
                    <chevron-right-icon size="18" class="transform rotate-180"></chevron-right-icon>
                </div>
                <div>
                    <p class="text-sm font-bold">Select A Font</p>
                </div>
            </div>
            <template  v-for="font in fonts?.all()">
                <div @click="selectFont(font)" class="cursor-pointer bg-white px-4 py-2 hover:bg-slate-200 flex justify-start items-center">
                    <div>
                        <p class="text-xs font-sans text-gray-900">{{ font.family }}</p>
                    </div>
                </div>
            </template>
        </div>
        <div v-else class="w-full h-full flex flex-col flex-1">
            <div class="h-full w-full overflow-auto relative">
                <div  class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-start items-center">
                    <div @click="hidePicker" class="w-4 h-4 mr-2 flex justify-center items-center">
                        <chevron-right-icon size="18" class="transform rotate-180"></chevron-right-icon>
                    </div>
                    <div>
                        <p class="text-sm font-bold">Edit Text</p>
                    </div>
                </div>
                <div class="px-4 py-2">
                    <input type="text"
                           ref="textField"
                           :value="text.value()"
                           class="w-full h-8 px-2 py-2 text-xs text-gray-900 bg-transparent
                    border-b border-slate-200
                    font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                           placeholder="Enter Text"
                           @change="onChangeText"
                    >
                </div>
            </div>
            <div @click="showFontsPicker"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500 flex justify-between items-center">
                    <p class="flex justify-start w-full items-center"> <letter-case-icon size="18" :stroke-width="1" class="mr-2"></letter-case-icon>
                        {{ this.font.family }}</p>
                    <div class="w-4 h-4 flex justify-center items-center">
                        <chevron-right-icon size="18"></chevron-right-icon>
                    </div>
                </div>

            </div>
            <div
                 class="cursor-pointer w-full bg-slate-100 border-b border-slate-200 px-4 py-2
                 flex justify-between items-center flex-no-wrap">
                <div class="w-fit text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center">Font Size: ({{fontSize}}px)</p>
                </div>
                <div class="w-full">
                    <Slider
                        :min="1"
                        :max="300"
                        :step="1"
                        :lazy="false"
                        v-model="thickness"
                        :tooltips="false"
                        @update="setFontSize"
                    />
                </div>
            </div>
            <div @click="showVariablePicker" v-if="text._type === 'fixed'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500 flex justify-between items-center">
                    <p class="flex justify-start w-full items-center"> <variable-icon size="18" :stroke-width="1" class="mr-2"></variable-icon> Select From A Variable</p>
                    <div class="w-4 h-4 flex justify-center items-center">
                        <chevron-right-icon size="18"></chevron-right-icon>
                    </div>
                </div>

            </div>
            <div @click="unlockText" v-if="text !== null && text.value() !== null && text._type === 'variable'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center"> <variable-off-icon size="18" :stroke-width="1" class="mr-2"></variable-off-icon> Unlock Text</p>
                </div>
            </div>
        </div>
    </div>

</template>

<script>
import {LetterCaseIcon, LockIcon, LockOpenIcon, VariableIcon, VariableOffIcon, DeviceFloppyIcon, ChevronRightIcon} from 'vue-tabler-icons';
import {WrapviewVariable} from "../../../Wrapview/WrapviewVariable";
import {Variable} from "../../../Manager/Manager";
import Toggle from '@vueform/toggle'
import Slider from '@vueform/slider';
export default {
    props:['template','current_panel','fonts','font','fontSize','text','materials','variables'],
    name: "WrapviewWizardColorPicker",
    components: {
        Slider, Toggle,LetterCaseIcon,
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
                variables: false,
                fonts: false
            },
            allowed: {
                variable: true
            }
        }
    },
    mounted() {
        this.init();
    },
    methods:{
        onChangeText(){
            this.text.setValue(this.$refs['textField'].value);
            this.$emit("onChange",{
                text: this.text,
                font: f,
                fontSize: this.thickness
            });
        },
        selectFont(f){
            this.hidePicker();
            this.$emit("onChange",{
                text: this.text,
                font: f,
                fontSize: this.thickness
            });
        },
        init(){
            this.thickness = this.fontSize
        },
        hidePicker() {
            this.showing.variables = false;
            this.showing.fonts = false;
        },
        showVariablePicker(){
            this.showing.variables = true;
        },
        showFontsPicker(){
            this.showing.fonts = true;
        },
        unlockText(){
            this.text.unlock();
            this.$emit("onChange",{
                text: this.text,
                font: this.font,
                fontSize: this.thickness
            });
        },
        selectVariable(variable){
            this.hidePicker();
            this.text.attachToVariable(variable.guid);
            this.$emit("onChange",{
                text: this.text,
                font: this.font,
                fontSize: this.thickness
            });
        },
        setFontSize(){
            this.$emit("onChange",{
                text: this.text,
                font: this.font,
                fontSize: this.thickness
            });
        }
    }
}
</script>
<style src="@vueform/slider/themes/default.css"></style>

<style scoped>

</style>
