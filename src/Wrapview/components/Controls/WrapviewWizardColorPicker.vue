<template>
    <div class="w-full h-full">
        <div class="h-full w-full overflow-auto" v-if="showing.panels">
            <div  class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-start items-center">
                <div @click="hidePicker" class="w-4 h-4 mr-2 flex justify-center items-center">
                    <chevron-right-icon size="18" class="transform rotate-180"></chevron-right-icon>
                </div>
                <div>
                    <p class="text-sm font-bold">Select A Panel</p>
                </div>
            </div>
            <template  v-for="material in materials?.all()">
                <div @click="selectPanel(material)" v-if="material.is('listed') && material.id !== current_panel" class="cursor-pointer bg-white px-4 py-2 hover:bg-slate-200 flex justify-start items-center">
                    <div>
                        <p class="text-xs font-sans text-gray-900">{{ material.id }}</p>
                    </div>
                </div>
            </template>
        </div>
        <div class="h-full w-full overflow-auto relative" v-if="showing.edit">
            <div  class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-start items-center">
                <div @click="hidePicker" class="w-4 h-4 mr-2 flex justify-center items-center">
                    <chevron-right-icon size="18" class="transform rotate-180"></chevron-right-icon>
                </div>
                <div>
                    <p class="text-sm font-bold">Edit Variable: {{editing.field}}</p>
                </div>
            </div>
            <div class="px-4 py-2">
                <input type="text"
                       v-model="search"
                       class="w-full h-8 px-2 py-2 text-xs text-gray-900 bg-transparent
                    border-b border-slate-200
                    font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       placeholder="Search By Color Name or Pantone Number"
                >
            </div>
            <div class="w-full h-full overflow-auto grid grid-cols-6 gap-1 px-4 py-4">

                <template v-for="(pantone, number) in colors">
                    <div class="" v-if="shouldShow(pantone, number)">
                        <div @click="onEditVariable('#'+pantone.hex)"
                             class="pointer peer rounded-full w-6 h-6 border m-auto flex justify-center items-center relative"
                        >
                            <div class="rounded-full w-4 h-4 border"
                                 :style="bgColorRaw('#'+pantone.hex)"
                            >

                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <div class="absolute inset-0" v-if="loading.edit">
                <div class="bg-white inset-0 absolute opacity-20">

                </div>
                <div class="w-full h-full flex justify-center items-center">
                    <loader-icon size="18" class="text-gray-500 animate-spin"></loader-icon>
                </div>
            </div>
        </div>
        <div v-else-if="showing.variables">
            <div  class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div @click="hidePicker" class="w-4 h-4 mr-2 flex justify-center items-center">
                    <chevron-right-icon size="18" class="transform rotate-180"></chevron-right-icon>
                </div>
                <div>
                    <p class="text-sm font-bold">Select A Variable</p>
                </div>
            </div>
            <template  v-for="variable in variables?.all()">
                <div  v-if="variable.type === 'color'" class="cursor-pointer bg-white px-4 py-2 hover:bg-slate-200 flex justify-between items-center">
                    <div class="flex justify-start items-center" @click="selectVariable(variable)">
                        <div class="pointer peer rounded-full w-6 h-6 border m-auto flex justify-start items-center relative"
                        >
                            <div class="rounded-full w-4 h-4 border"
                                 :style="bgColorRaw(variable.default_value)"
                            >

                            </div>
                        </div>
                        <p class="ml-2 text-xs font-sans text-gray-900">{{ variable.field }}</p>
                    </div>
                    <div @click="editVariable(variable)" class="cursor-pointer text-gray-900 hover:text-sky-500 flex justify-center items-center">
                        <div class="w-4 h-4">
                            <tool-icon size="18" class=""></tool-icon>
                        </div>
                    </div>
                </div>
            </template>
        </div>
        <div v-else-if="showing.save">
            <div  class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-start items-center">
                <div @click="hidePicker" class="w-4 h-4 mr-2 flex justify-center items-center">
                    <chevron-right-icon size="18" class="transform rotate-180"></chevron-right-icon>
                </div>
                <div>
                    <p class="text-sm font-bold">Save Color As Variable</p>
                </div>
                <div class="ml-4 pointer border-gray-500 peer rounded-full w-6 h-6 border flex justify-center items-center relative">
                    <div class="rounded-full w-4 h-4 border"
                         :style="bgColorRaw(color.value())"
                    >

                    </div>
                </div>
            </div>
            <div class="px-4 py-2">
                <standard-form
                    ref="saveColorForm"
                    :definition="definition.variables"
                    :object="null"
                    :settings="settings.variables"
                    @onSubmit="onSaveVariable"
                ></standard-form>
            </div>
        </div>
        <div v-else class="w-full h-full flex flex-col flex-1">
            <div v-if="color !== null && color.value() !== null" class="w-full rounded-t-lg bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div>
                    <p class="text-sm font-bold">Current Color:</p>
                    <div v-if="color._type === 'inherited'" class="w-full text-xs font-bold text-slate-500 mt-2">
                        <p class="flex justify-start w-full items-center"> <lock-icon size="18"></lock-icon> Inherited from the &nbsp;<span class="text-slate-600">{{color._key}}</span> &nbsp; panel</p>
                    </div>
                    <div v-if="color._type === 'variable'" class="w-full text-xs font-bold text-slate-500 mt-2">
                        <p class="flex justify-start w-full items-center"> <variable-icon size="18"></variable-icon> Applied from variable &nbsp;<span class="text-slate-600">{{variables.get(color._key).field}}</span> &nbsp;</p>
                    </div>
                </div>
                <div class="pointer border-gray-500 peer rounded-full w-6 h-6 border flex justify-center items-center relative">
                    <div class="rounded-full w-4 h-4 border"
                         :style="bgColorRaw(color.value())"
                    >

                    </div>
                </div>
            </div>
            <div @click="showSavePanel" v-if="color !== null && color.value() !== null && color._type !== 'inherited' && color._type !== 'variable'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center"> <device-floppy-icon size="18" :stroke-width="1" class="mr-2"></device-floppy-icon> Save Color To Variable</p>
                </div>
            </div>
            <div @click="editVariable(variables.get(color._key))" v-if="color !== null && color.value() !== null && color._type === 'variable'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center"> <tool-icon size="18" :stroke-width="1" class="mr-2"></tool-icon> Edit Variable</p>
                </div>
            </div>
            <div @click="unlockColor" v-if="color !== null && color.value() !== null && color._type === 'inherited'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center"> <lock-open-icon size="18" :stroke-width="1" class="mr-2"></lock-open-icon> Unlock Color</p>
                </div>
            </div>
            <div @click="unlockColor" v-if="color !== null && color.value() !== null && color._type === 'variable'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500">
                    <p class="flex justify-start w-full items-center"> <variable-off-icon size="18" :stroke-width="1" class="mr-2"></variable-off-icon> Unlock Color</p>
                </div>
            </div>

            <div @click="showInheritPicker" v-if="color._type === 'fixed' && allowed.inherit"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500 flex justify-between items-center">
                    <p class="flex justify-start w-full items-center"> <lock-icon size="18" :stroke-width="1" class="mr-2"></lock-icon> Inherit From Another Panel</p>
                    <div class="w-4 h-4 flex justify-center items-center">
                        <chevron-right-icon size="18"></chevron-right-icon>
                    </div>
                </div>

            </div>
            <div @click="showVariablePicker" v-if="color._type === 'fixed'"
                 class="cursor-pointer hover:bg-slate-200 w-full bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <div class="w-full text-xs font-light text-slate-500 flex justify-between items-center">
                    <p class="flex justify-start w-full items-center"> <variable-icon size="18" :stroke-width="1" class="mr-2"></variable-icon> Select From A Variable</p>
                    <div class="w-4 h-4 flex justify-center items-center">
                        <chevron-right-icon size="18"></chevron-right-icon>
                    </div>
                </div>

            </div>
            <div v-if="color._type === 'fixed'" class="px-4 py-2">
                <input type="text"
                       v-model="search"
                       class="w-full h-8 px-2 py-2 text-xs text-gray-900 bg-transparent
                    border-b border-slate-200
                    font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       placeholder="Search By Color Name or Pantone Number"
                >
            </div>
            <div v-if="color._type === 'fixed'" class="w-full h-full overflow-auto grid grid-cols-6 gap-1 px-4 py-4">
                <template v-for="(pantone, number) in colors">
                    <div class="" v-if="shouldShow(pantone, number)">
                        <div @click="onPick('#'+pantone.hex)"
                             class="pointer peer rounded-full w-6 h-6 border m-auto flex justify-center items-center relative"
                             :class="{
                            'border-pink-500': pantone.hex === color.value()?.toLowerCase(),
                            'border-gray-500': pantone.hex !== color.value()?.toLowerCase()
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
import {LockIcon, LockOpenIcon, VariableIcon, VariableOffIcon, LoaderIcon, DeviceFloppyIcon, ChevronRightIcon, ToolIcon} from 'vue-tabler-icons';
import {WrapviewVariable} from "../../../Wrapview/WrapviewVariable";
import {Variable} from "../../../Manager/Manager";

export default {
    props:['template','current_panel','label','color','materials','variables','allow'],
    name: "WrapviewWizardColorPicker",
    components: {
        LockIcon, LockOpenIcon,VariableIcon, VariableOffIcon,DeviceFloppyIcon, ChevronRightIcon, ToolIcon, LoaderIcon
    },
    data(){
        return {
            loading: {
                form: false,
                edit: false
            },
            editing: null,
            settings: {
                variables: {
                    styles: {},
                    show: {
                        labels: true,
                        buttons: true
                    },
                }
            },
            definition: {
                variables: {
                    buttons: {
                        "submit": {
                            "label": "<p class='skew-x-12'>Submit</p>",
                            "loadingText": '<div class="skew-x-12"><p class="">Submitting</p>'+
                                '</div>',
                            "style":"disabled:opacity-50 relative text-sm font-sans font-bold uppercase px-4 py-2 rounded-lg -skew-x-12 bg-slate-900 text-white hover:text-yellow-400 text-white transition-all flex justify-start items-center"
                        }
                    },
                    fields: {
                        field: {
                            "field_type": "input",
                            "type": "text",
                            "label": "Name",
                            "placeholder": "Name",
                            "validations": [
                                "required"
                            ]
                        }
                    }
                }
            },
            search: '',
            colors: _colors,
            showing: {
                panels: false,
                variables: false,
                save: false,
                edit: false
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
        editVariable(v){
            this.editing = v;
            this.showing.variables = false;
            this.showing.edit = true;
        },
        onEditVariable(c){
            this.loading.edit = true;
            this.editing.setValue(c);
            this.selectVariable(this.editing);
            this.editing.save().then(()=>{
                this._events.emit("variableValueUpdated",this.editing.id);
                this.loading.edit = false;
                this.hidePicker();
                this.editing = null;
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
        },
        hidePicker() {
            this.showing.panels = false;
            this.showing.variables = false;
            this.showing.save = false;
            this.showing.edit = false;
        },
        onPick(color){
            this.color.setValue(color);
            this.$emit("onChange",this.color)
        },
        unlockColor(){
            this.color.unlock();
            this.$emit("onChange",this.color)
        },
        showInheritPicker(){
            this.showing.panels = true;
        },
        showVariablePicker(){
            this.showing.variables = true;
        },
        showSavePanel(){
            this.showing.save = true;
        },
        selectPanel(panel){
            this.hidePicker();
            if(this.current_panel === panel.id) return;
            this.color.inheritFrom(panel.id);
            this.$emit("onChange",this.color)
        },
        selectVariable(variable){
            this.hidePicker();
            this.color.attachToVariable(variable.guid);
            this.$emit("onChange",this.color)
        },
        onSaveVariable(data){
            Variable.make({
                template_id: this.template.value('id'),
                field: data.field,
                label: data.field,
                caption: 'Select '+data.field,
                type: 'color',
                default_value: this.color.value(),
                guid: guid()
            }).then((variable)=>{
                var wVar = new WrapviewVariable(variable.value('id'));
                wVar.set({
                    field: variable.value('field'),
                    label: variable.value('label'),
                    caption: variable.value('caption'),
                    type: variable.value('type'),
                    guid: variable.value('guid')
                });
                wVar.setDefault(variable.defaultValue());
                wVar.setValue(variable.currentValue());
                this.variables.add(variable.value('guid'), wVar);
                this.selectVariable(wVar);
                this.template.child('variables').inject(variable);
            });
        }
    }
}
</script>

<style scoped>

</style>
