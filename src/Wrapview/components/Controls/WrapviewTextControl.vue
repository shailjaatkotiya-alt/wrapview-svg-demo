<template>
    <div class="w-full py-2">
        <p class="font-bold uppercase text-white text-xs">
            TEXT
        </p>
        <div class="w-full justify-start items-center flex mt-1">
            <input  :disabled="text._type !== 'fixed'" type="text"
                    class="w-full h-8 px-2 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800
                "
                    ref="textField"
                    :value="text.value()"
                    @change="onChange"
            />
            <button @click="showInheritPicker" v-if="text._type === 'fixed' && allowed.inherit" class="w-8 h-8 flex justify-center items-center bg-transparent border border-slate-600 text-white">
                <lock-icon size="18"></lock-icon>
            </button>
            <button @click="unlockColor" v-if="text._type === 'inherited'" class="w-8 h-8 flex justify-center items-center bg-transparent border border-slate-600 text-white">
                <lock-open-icon size="18"></lock-open-icon>
            </button>
            <button  v-if="text._type === 'fixed' && allowed.variable" @click="showVariablePicker" class="w-8 h-8 flex justify-center items-center bg-transparent border border-slate-600 text-white">
                <variable-icon size="18"></variable-icon>
            </button>
            <button  v-if="text._type === 'variable'" @click="unlockColor" class="w-8 h-8 flex justify-center items-center bg-transparent border border-slate-600 text-white">
                <variable-off-icon size="18"></variable-off-icon>
            </button>
        </div>
        <div v-if="text._type === 'inherited'" class="w-full text-xs font-bold text-slate-500 mt-2">
            <p class="flex justify-start w-full items-center"> <lock-icon size="18"></lock-icon> Inherited from the &nbsp;<span class="text-yellow-400">{{text._key}}</span> &nbsp; panel</p>
        </div>
        <div v-if="text._type === 'variable'" class="w-full text-xs font-bold text-slate-500 mt-2">
            <p class="flex justify-start w-full items-center"> <variable-icon size="18"></variable-icon> Applied from variable &nbsp;<span class="text-yellow-400">{{variables.get(text._key).name}}</span> &nbsp;</p>
        </div>
        <div v-if="showing.panels || showing.variables" class="fixed z-40 top-0 left-0 w-screen h-screen" @click="hidePicker">

        </div>
        <div v-if="showing.panels" class="fixed z-50 w-auto h-auto -ml-10 -mt-1 bg-gray-900 shadow-lg rounded-lg">
            <div class="border-b border-slate-600 w-48 px-4 py-2">
                <p class="font-sans text-xs text-slate-300">Inherit From
                </p>
            </div>
            <div>
                <template  v-for="material in materials?.all()">
                    <div @click="selectPanel(material)" v-if="material.is('listed')" class="cursor-pointer bg-gray-900 px-4 py-2 hover:bg-gray-800 flex justify-start items-center">
                        <div>
                            <p class="text-xs font-sans text-slate-300">{{ material.id }}</p>
                        </div>
                    </div>
                </template>
            </div>
        </div>
        <div v-if="showing.variables" class="fixed z-50 w-auto h-auto -ml-10 -mt-1 bg-gray-900 shadow-lg rounded-lg">
            <div class="border-b border-slate-600 w-48 px-4 py-2">
                <p class="font-sans text-xs text-slate-300">Connect To Variable
                </p>
            </div>
            <div>
                <template  v-for="variable in variables?.all()">
                    <div @click="selectVariable(variable)" v-if="variable.type === 'text'" class="cursor-pointer bg-gray-900 px-4 py-2 hover:bg-gray-800 flex justify-start items-center">
                        <div>
                            <p class="text-xs font-sans text-slate-300">{{ variable.field }}</p>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import {LockIcon, LockOpenIcon, VariableIcon, VariableOffIcon} from 'vue-tabler-icons';

export default {
    props:['text','materials','variables','allow'],
    name: "WrapviewTextControl",
    components: {
        LockIcon, LockOpenIcon,VariableIcon, VariableOffIcon
    },
    data(){
        return {
            showing: {
                panels: false,
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
        init(){
            if(typeof this.allow === 'undefined') return;
            this.allowed = _.assign(this.allowed,this.allow);
        },
        hidePicker() {
            this.showing.panels = false;
            this.showing.variables = false;
        },
        onChange(){
            this.text.setValue(this.$refs['textField'].value);
            this.$emit("onChange",this.text)
        },
        unlockColor(){
            this.text.unlock();
            this.$emit("onChange",this.text)
        },
        showInheritPicker(){
            this.showing.panels = true;
        },
        showVariablePicker(){
            this.showing.variables = true;
        },
        selectPanel(panel){
            this.hidePicker();
            this.text.inheritFrom(panel.id);
            this.$emit("onChange",this.text)
        },
        selectVariable(variable){
            this.hidePicker();
            this.text.attachToVariable(variable.guid);
            this.$emit("onChange",this.text)
        }
    }
}
</script>

<style scoped>

</style>
