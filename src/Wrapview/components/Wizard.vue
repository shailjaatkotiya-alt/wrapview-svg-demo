<template>
    <div class="w-screen h-screen top-0 left-0 fixed z-0 bg-gray-100 flex justify-center items-center">
        <div class="sm:w-1/2 w-full bg-gray-100 h-full flex flex-col flex-1 justify-start relative">
            <div class="w-full h-full">
                <wrapview ref="wrapview" :fit="true" :template="template" @onLoad="onWrapviewLoad" @progress="setProgress"
                          @onViewportLoaded="onViewportLoaded"
                          @imageCaptured="imageCaptured"></wrapview>
            </div>
            <div class="w-full h-16">
                <div class="h-16">

                </div>
            </div>
        </div>
        <div class="sm:w-1/2 w-full absolute sm:relative top-0 left-0 h-full bg-stone-700 flex flex-col flex-1 justify-start">
            <div class="w-full h-full">
                <div class="select-none w-full h-full bg-stone-700 flex justify-center items-center relative" id="drawing-board">
                    <div class="relative bg-stone-700 focus:outline-none" id="canvas-container"
                         :style="'width:'+settings.canvas.size.width+'px;'+
                                    'height:'+settings.canvas.size.height+'px;'
                                   "
                    >

                    </div>
                    <div class="absolute top-0 left-0 w-full h-full flex justify-center items-center"
                         v-if="materials()?.has(selections.panel) && !panel(selections.panel).is('viewable')"
                    >
                        <p class="text-slate-500 font-light text-center text-sm">No Preview Available</p>
                    </div>

                    <div v-if="materials()?.has(selections.panel) && (isImageLayer(editingLayer()) || isTextLayer(editingLayer()) )" class="fixed top-1 right-1 flex justify-start items-center">
                        <div class="h-12 px-2 flex justify-center items-center text-white">
                            <div>
                                <p class="whitespace-nowrap overflow-hidden text-ellipsis text-xs font-bold">x: <span class="font-light px-1">{{parseFloat(editingLayer().settings.position.x).toFixed(2)}}px</span></p>
                                <p class="whitespace-nowrap overflow-hidden text-ellipsis text-xs font-bold">y: <span class="font-light px-1">{{parseFloat(editingLayer().settings.position.y).toFixed(2)}}px</span></p>
                            </div>
                        </div>
                        <div v-if="isImageLayer(editingLayer())" class="h-12 px-2 flex justify-center items-center text-white border-l border-stone-600">
                            <div>
                                <p class="whitespace-nowrap overflow-hidden text-ellipsis text-xs font-bold">w: <span class="font-light px-1">{{parseFloat(editingLayer().settings.size.width).toFixed(2)}}px</span></p>
                                <p class="whitespace-nowrap overflow-hidden text-ellipsis text-xs font-bold">h: <span class="font-light px-1">{{parseFloat(editingLayer().settings.size.height).toFixed(2)}}px</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="w-full h-16">
                <div class="h-16">

                </div>
            </div>
        </div>
        <div class="fixed inset-0 bg-white opacity-20 z-30"
            v-if="showing.popup"
             @click="hidePopup()"
        >

        </div>
        <div v-if="shouldShowTooltip()" class="z-50 fixed top-1 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white rounded-lg">
            <p class="text-sm font-light" v-html="getTooltipText()"></p>
        </div>
        <div class="w-full z-50 fixed h-12 left-0 bottom-5 px-4 transform transition-all duration-300 translate-y-16"
             :class="{
                'translate-y-0': showing.bottom
            }"
        >
            <div class="w-full h-12 bg-white drop-shadow-2xl rounded-md flex justify-start items-center"
                :class="{'border border-sky-500':materials()?.has(selections.panel)
                    && panel(selections.panel).settings.hasOwnProperty('diffuseTexture')
                    && panel(selections.panel)?.settings.diffuseTexture?.isEditingLayer()}"
            >
                <div v-if="materials()?.has(selections.panel)
                    && panel(selections.panel).settings.hasOwnProperty('diffuseTexture')
                    && !panel(selections.panel)?.settings.diffuseTexture?.isEditingLayer()"
                     class="w-fit flex justify-start center">
                    <div class="h-12 flex justify-start items-center">
                        <div class="flex justify-center items-center w-8 h-8 bg-cover bg-center text-gray-900 flex justify-center items-center"

                        >
                            <dots-vertical-icon size="20"></dots-vertical-icon>
                        </div>
                    </div>
                    <div class="pl-2 pr-4 flex justify-start items-center">
                        <p class="whitespace-nowrap overflow-hidden text-ellipsis text-sm font-sans font-light uppercase mb-0">{{panel(selections.panel)?.id}}</p>
                    </div>
                    <div class="w-48 h-12 flex justify-start items-center">
                        <div class="w-12 h-12 flex justify-center items-center border-r border-gray-200 relative">
                            <div @click="togglePopup('panel.color')" class="peer rounded-full w-6 h-6 border border-gray-600 m-auto flex justify-center items-center relative">
                                <div class="rounded-full w-4 h-4 border"
                                    :style="bgColor(panel(selections.panel)?.texture()?.baseLayer().color())"
                                >

                                </div>
                                <droplet-filled-icon size="10" class="text-gray-900 absolute -right-2 -bottom-2"></droplet-filled-icon>
                            </div>
                            <div class="invisible opacity-0 transform -translate-y-24 peer-hover:opacity-100 peer-hover:visible peer-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Change Panel Color</p>
                                <p class="text-sm font-light text-gray-900">Use this option to select the background color of the panel.
                                    </p>
                            </div>
                            <Transition  name="slide-top" mode="out-in">
                            <div v-if="showing.popup && popup.panel === 'panel.color'"
                                 class="absolute bottom-14 -left-1/2 w-96 h-96 bg-white rounded-md drop-shadow-2xl">
                                    <wrapview-wizard-color-picker
                                        :template="template"
                                        :current_panel="selections.panel"
                                        :color="panel(selections.panel)?.texture()?.baseLayer().color()"
                                        :materials="materials()"
                                        :variables="variables()"
                                        @onChange="setBaseColor"
                                    ></wrapview-wizard-color-picker>


                            </div>
                            </Transition>
                        </div>
                        <div @click="showModal('wizard-asset-management-modal')" class="group w-12 h-12 flex justify-center text-gray-900 items-center border-r border-gray-200 relative">
                            <photo-icon size="24"></photo-icon>
                            <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Add An Image</p>
                                <p class="text-sm font-light text-gray-900">Select one of your saved images or upload one from your computer / device.</p>
                            </div>
                        </div>
                        <div @click="addText" class="group w-12 h-12 flex justify-center text-gray-900 items-center border-r border-gray-200 relative">
                            <typography-icon size="24"></typography-icon>
                            <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Add Text</p>
                                <p class="text-sm font-light text-gray-900">Add custom text, select font, colors and outlines.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="materials()?.has(selections.panel)
                     && isTextLayer(editingLayer())"
                     class="w-fit flex justify-start center">

                    <div class="h-12 flex justify-start items-center">
                        <div class="flex justify-center items-center w-8 h-8 bg-cover bg-center text-gray-900 flex justify-center items-center"

                        >
                            <typography-icon size="20"></typography-icon>
                        </div>
                    </div>
                    <div class="pl-2 pr-4 flex justify-start items-center">
                        <p class="whitespace-nowrap overflow-hidden text-ellipsis text-sm font-sans font-light uppercase mb-0">Text Layer</p>
                    </div>
                    <div class="h-12 pr-4 flex justify-start items-center">
                        <div class="w-12 h-12 flex justify-center items-center border-r border-gray-200 relative">
                            <div @click="togglePopup('text.color')" class="peer rounded-full w-6 h-6 border border-gray-600 m-auto flex justify-center items-center relative">
                                <div class="rounded-full w-4 h-4 border"
                                     :style="bgColor(editingLayer().color())"
                                >

                                </div>
                                <droplet-filled-icon size="10" class="text-gray-900 absolute -right-2 -bottom-2"></droplet-filled-icon>

                            </div>
                            <div class="invisible opacity-0 transform -translate-y-24 peer-hover:opacity-100 peer-hover:visible peer-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Change Text Color</p>
                                <p class="text-sm font-light text-gray-900">Select a text color.
                                </p>
                            </div>
                            <Transition  name="slide-top" mode="out-in">
                                <div v-if="showing.popup && popup.panel === 'text.color'"
                                     class="absolute bottom-14 -left-1/2 w-96 h-96 bg-white rounded-md drop-shadow-2xl">
                                    <wrapview-wizard-color-picker
                                        :template="template"
                                        :current_panel="selections.panel"
                                        :color="editingLayer().color()"
                                        :materials="materials()"
                                        :variables="variables()"
                                        :allow="{inherit: false}"
                                        @onChange="setLayerColor"
                                    ></wrapview-wizard-color-picker>


                                </div>
                            </Transition>
                        </div>
                        <div class="w-12 h-12 flex justify-center items-center border-r border-gray-200 relative">
                            <div  @click="togglePopup('outline.color')" class="peer rounded-full w-6 h-6 border border-gray-600 m-auto flex justify-center items-center relative">
                                <div class="rounded-full w-4 h-4 border"
                                     :style="bgColor(editingLayer().outline().color)"
                                >

                                </div>
                                <pencil-icon size="10" class="text-gray-900 absolute -right-2 -bottom-2"></pencil-icon>
                            </div>
                            <div class="invisible opacity-0 transform -translate-y-24 peer-hover:opacity-100 peer-hover:visible peer-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Change Outline Color</p>
                                <p class="text-sm font-light text-gray-900">Use this option to select the outline color.
                                </p>
                            </div>
                            <Transition  name="slide-top" mode="out-in">
                                <div v-if="showing.popup && popup.panel === 'outline.color'"
                                     class="absolute bottom-14 -left-1/2 w-96 h-96 bg-white rounded-md drop-shadow-2xl">
                                    <wrapview-wizard-outline-picker
                                        :template="template"
                                        :current_panel="selections.panel"
                                        :outline="editingLayer().outline()"
                                        :materials="materials()"
                                        :variables="variables()"
                                        :allow="{inherit: false}"
                                        @onChange="setLayerOutline"
                                    ></wrapview-wizard-outline-picker>


                                </div>
                            </Transition>
                        </div>
                        <div @click="showPopup('text.content')" class="relative group w-12 h-12 flex justify-center text-gray-900 items-center border-r border-gray-200">
                            <cursor-text-icon size="24"></cursor-text-icon>
                            <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Set Text Content</p>
                                <p class="text-sm font-light text-gray-900">Click to edit the font and content of your text.</p>
                            </div>
                            <Transition  name="slide-top" mode="out-in">
                                <div v-if="showing.popup && popup.panel === 'text.content'"
                                     class="absolute bottom-14 -left-1/2 w-96 h-96 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                    <wrapview-wizard-text-editor
                                        :template="template"
                                        :current_panel="selections.panel"
                                        :materials="materials()"
                                        :variables="variables()"
                                        :fonts="fonts()"
                                        :text="editingLayer().text()"
                                        :fontSize="editingLayer().settings.fontSize"
                                        :font="editingLayer().settings.font"
                                        @onChange="setLayerText"
                                    ></wrapview-wizard-text-editor>
                                </div>
                            </Transition>
                        </div>
                        <div @click="showPopup('text.dimensions')" class="relative group w-12 h-12 flex justify-center text-gray-900 items-center border-r border-gray-200">
                            <dimensions-icon size="24"></dimensions-icon>
                            <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Set Precise Position</p>
                                <p class="text-sm font-light text-gray-900">Click to edit the precise x and y co-ordinates of your text.</p>
                            </div>
                            <Transition  name="slide-top" mode="out-in">
                                <div v-if="showing.popup && popup.panel === 'text.dimensions'"
                                     class="absolute bottom-14 -left-1/2 w-96 h-96 bg-white rounded-md overflow-auto drop-shadow-2xl">

                                </div>
                            </Transition>
                        </div>
                        <div @click="deleteLayer" class="w-12 h-12 flex justify-center text-pink-500 items-center relative group">
                            <trash-icon size="24"></trash-icon>
                            <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Remove Text</p>
                                <p class="text-sm font-light text-gray-900">Remove the text layer permanently.</p>
                            </div>
                        </div>

                    </div>
                </div>
                <div v-if="materials()?.has(selections.panel)
                     && isImageLayer(editingLayer())"
                     class="w-fit flex justify-start center">

                    <div class="h-12 flex justify-start items-center">
                        <div class="flex justify-center items-center w-8 h-8 bg-cover bg-center text-gray-900 flex justify-center items-center"

                        >
                            <photo-icon size="20"></photo-icon>
                        </div>
                    </div>
                    <div class="pl-2 pr-4 flex justify-start items-center">
                        <p class="whitespace-nowrap overflow-hidden text-ellipsis text-sm font-sans font-light uppercase mb-0">Image Layer</p>
                    </div>
                    <div class="h-12 flex justify-start items-center pr-4">
                        <div  @click="showPopup('image.dimensions')" class="relative group w-12 h-12 flex justify-center text-sky-500 items-center border-r border-gray-200">
                            <dimensions-icon size="24"></dimensions-icon>
                            <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Set Precise Dimensions</p>
                                <p class="text-sm font-light text-gray-900">Click to edit the precise dimensions & co-ordinates of your image.</p>
                            </div>
                            <Transition  name="slide-top" mode="out-in">
                                <div v-if="showing.popup && popup.panel === 'image.dimensions'"
                                     class="absolute bottom-14 -left-1/2 w-96 h-96 bg-white rounded-md overflow-auto drop-shadow-2xl">

                                </div>
                            </Transition>
                        </div>
                        <div @click="deleteLayer" class="relative group w-12 h-12 flex justify-center text-pink-500 items-center">
                            <trash-icon size="24"></trash-icon>
                            <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                <p class="font-bold text-lg text-gray-900">Remove Image</p>
                                <p class="text-sm font-light text-gray-900">Remove the image layer permanently.</p>
                            </div>
                        </div>

                    </div>
                </div>
                <div  v-if="materials()?.has(selections.panel)" class="bg-slate-100 w-full h-12 border-l border-slate-300 px-0.5 flex justify-start items-center"
                      :class="{'border border-sky-500':materials()?.has(selections.panel)
                    && panel(selections.panel).settings.hasOwnProperty('diffuseTexture')
                    && panel(selections.panel)?.settings.diffuseTexture?.isEditingLayer()}"
                >
                    <div @click="stopEditingLayer" class="group relative w-12 h-12 flex justify-center text-gray-900 items-center border-l border-slate-300">
                        <stack3-icon size="24"></stack3-icon>
                        <chevron-right-icon size="8"></chevron-right-icon>
                        <div class="invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                            <p class="font-bold text-lg text-gray-900">All Layers</p>
                            <p class="text-sm font-light text-gray-900">
                                <template v-if="layers.length === 0">
                                    Click the <b>Add Image</b> or <b>Add Text</b> buttons to add layers to this panel.
                                </template>
                                <template v-if="layers.length > 0 && editingLayer() === null">
                                    Click a layer icon to select it.
                                </template>
                                <template v-else>
                                    Click to de-select the current layer.
                                </template>

                            </p>
                        </div>
                    </div>
                    <template :key="layer.id" v-for="layer in layers">
                        <div class="w-12 h-12 flex justify-center text-gray-900 items-center border-r border-slate-300 relative">
                            <div class="group flex justify-start items-center cursor-pointer" @click="selectLayer(layer)">
                                <div class="w-2 h-2 rounded-full absolute top-1/2 left-1/2 transform -translate-x-4 -translate-y-4"
                                     :class="{'bg-blue-500':editingLayer() !== null && layer.id === editingLayer().id}"
                                >

                                </div>
                                <div v-if="isImageLayer(layer)" class="flex justify-center items-center w-8 h-8 bg-cover bg-center text-gray-900 flex justify-center items-center"

                                >
                                    <photo-icon size="20"></photo-icon>
                                    <div class="bg-center bg-contain bg-no-repeat invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-56 h-32 px-4 py-2 bg-white rounded-md overflow-hidden drop-shadow-2xl"
                                         :style="'background-image:url('+layer._path+');'"
                                    >
                                    </div>
                                </div>
                                <div v-if="isTextLayer(layer)" class="flex justify-center items-center w-8 h-8 bg-cover bg-center text-gray-900 flex justify-center items-center">
                                    <typography-icon size="20"></typography-icon>
                                    <div class="bg-center bg-contain bg-no-repeat invisible opacity-0 transform -translate-y-24 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-100 absolute bottom-14 -left-1/2 w-96 h-auto px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                                        <p class="font-bold text-lg text-gray-900">Text Layer</p>
                                        <p class="text-xs">{{layer.text()?.value()}}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </template>

                </div>
                <div
                    v-if="materials()?.has(selections.panel)
                    && panel(selections.panel).settings.hasOwnProperty('diffuseTexture')
                    && !panel(selections.panel)?.settings.diffuseTexture?.isEditingLayer()"
                    class="w-32 flex justify-start items-center  border-l border-gray-200">
                    <button @click="prevPanel()" :disabled="panels.length === 0 || panels.indexOf(selections.panel) <= 0" class="disabled:text-gray-300 text-gray-900 bg-transparent focus:outline-none focus:ring-0 w-12 h-12 flex justify-center items-center">
                        <chevron-left-icon size="24"></chevron-left-icon>
                    </button>
                    <button :disabled="panels.length === 0" @click="nextPanel()" class="disabled:text-gray-300 text-gray-900 bg-transparent focus:outline-none focus:ring-0 w-12 h-12 flex justify-center items-center">
                        <chevron-right-icon size="24"></chevron-right-icon>
                    </button>
                </div>
                <div
                    v-else
                    class="w-12 flex justify-start items-center bg-sky-500 border-l border-gray-200 relative rounded-r-md"
                >
                    <button @click="stopEditingLayer()" class="peer disabled:text-gray-300 text-white bg-transparent focus:outline-none focus:ring-0 w-12 h-12 flex justify-center items-center">
                        <check-icon size="24"></check-icon>
                    </button>
                    <div class="invisible opacity-0 transform -translate-y-24 peer-hover:opacity-100 peer-hover:visible peer-hover:translate-y-0 transition-all duration-100 absolute bottom-14 right-0 w-56 px-4 py-2 bg-white rounded-md overflow-auto drop-shadow-2xl">
                        <p class="font-bold text-lg text-gray-900">Finish Editing Layer</p>
                        <p class="text-sm font-light text-gray-900">Click to return to the main panel toolbar.</p>
                    </div>
                </div>
            </div>
        </div>

        <standard-modal ref="preLoading">
            <div class="bg-white rounded-lg shadow-lg w-full h-full">
                <div class="w-full h-3/4">

                </div>
                <div class="w-full h-1/4 px-4 py-3">
                    <p class="font-bold text-2xl text-stone-800">TAWK Garment Wizard</p>
                    <p class="font-light text-sm text-stone-8000">Welcome to the TAWK Garment Wizard!</p>
                    <div class="w-full h-1 relative my-3">
                        <div class="w-full h-1 bg-black transition-width duration-300 ease-in" :style="'width:'+progress.editor+'%'">

                        </div>
                    </div>
                </div>
            </div>
        </standard-modal>
        <standard-modal ref="editorModal"
            onMenuHidden="onHideModal"
        >
            <component
                v-if="modal.component !== null"
                :is="modal.component"
                :template="template"
                :materials="materials()"
                :variables="variables()"
                @close="hideModal()"
            ></component>
        </standard-modal>
    </div>
</template>

<script>
import {DimensionsIcon, DotsVerticalIcon, PrinterIcon, PencilIcon, CheckIcon, ToolIcon, DropletFilledIcon, ChevronLeftIcon, TemplateIcon, PointerIcon, TypographyIcon, LivePhotoIcon,VariableIcon, TrashIcon, PhotoIcon, PlusIcon, Stack3Icon, Rotate360Icon, ChevronRightIcon, StackIcon, InfoSquareIcon, CursorTextIcon, SettingsIcon, ShirtIcon} from 'vue-tabler-icons'
import {WrapviewImageLayer, WrapviewTextLayer} from "../../Wrapview/WrapviewLayer";
import {Font, Photo, Template} from '../../Manager/Manager';
import {WrapviewVectorPrintFile} from "../../Wrapview/WrapviewVectorPanel";

export default {
    props: ['template_id'],
    name: "Wizard",
    components: {
        PrinterIcon,DotsVerticalIcon, DimensionsIcon,
        PointerIcon, VariableIcon,TypographyIcon,TemplateIcon,
        PhotoIcon,
        Stack3Icon,
        StackIcon,ToolIcon,
        InfoSquareIcon, DropletFilledIcon,
        CursorTextIcon, CheckIcon,
        SettingsIcon, ShirtIcon, PencilIcon,
        ChevronRightIcon, ChevronLeftIcon, Rotate360Icon, PlusIcon, TrashIcon,LivePhotoIcon
    },
    data() {
        return {
            hint: '',
            template: null,
            panels:[],
            selections: {
                panel: 'FRONT'
            },
            progress: {
                editor: 0
            },
            popup:{
                panel: ''
            },
            modal: {
                component: null
            },
            settings: {
                canvas: {
                    container: null,
                    size: {
                        width: 0,
                        height: 0
                    }
                }
            },
            loading: {
                editor: true,
                save: false
            },
            showing: {
                bottom: false,
                viewer: false,
                popup: false
            },
            layers:[]
        }
    },
    mounted() {
        this.$refs['preLoading'].showMenu();
        this.progress.editor = 10;

        Template.with(['panels','panels.sizes','base_unit','variables']).find(this.template_id).then((template)=>{
            this.template = template;
            this.progress.editor = 20;
            setTimeout(()=>{
                this.progress.editor = 60;
                this.$refs['wrapview'].init();
            },300);

        },(error)=>{
            console.log(error);
            this.agent.handler.handleError(error);
        });

        this._events.on("variableValueUpdated",()=>{

            this.materials()?.render();

        });

        this._events.on("addImage",(url)=>{
            this.wrapview().addImageLayer(this.selections.panel,url).then(()=>{
                this.refreshLayers();
            });

        })
    },
    methods: {
        bgColor(color) {
            return 'background-color:'+color.value()+'; ';
        },

        shouldShowTooltip(){
            if(!this.materials()?.has(this.selections.panel)) return false;
            if(this.editingLayer() === null) return false;
            if(!this.isImageLayer(this.editingLayer()) && !this.isTextLayer(this.editingLayer())) return false;
            return true;
        },
        getTooltipText(){
            if(this.isImageLayer(this.editingLayer())) {
                return 'Use your mouse to move, scale or rotate image on the canvas.';
            } else if (this.isTextLayer(this.editingLayer())) {
                return 'Use your mouse to move, scale or rotate the text on the canvas.';
            }
            return '';
        },
        togglePopup(p){
            if(this.popup.panel === p) {
                this.hidePopup();
            } else{
                this.showPopup(p)
            }
        },
        hidePopup(){
            this.showing.popup = false;
            this.popup.panel = '';
        },
        showPopup(p) {
            this.showing.popup = true;
            this.popup.panel = p;
        },
        setCaptureMode(){
            this.wrapview().setMode('capture');
        },
        imageCaptured(imageData){
            if(imageData.mode === 'capturing') {
                this.template.set({
                    'thumbnail': imageData.image.url
                }).save(['thumbnail']).then(()=>{

                });
                this.wrapview().setMode('regular');
            } else {
                Photo.make({
                    url: imageData.image.url,
                    thumbnail: imageData.image.url,
                    parent_id: this.product.value('id'),
                    model: 'products'
                }).then((photo)=>{
                    this.product.child('photos')?.inject(photo);
                });
            }

        },
        deleteLayer(){
            this.panel(this.selections.panel).settings.diffuseTexture.removeCurrentLayer();
            this.refreshLayers();
        },
        hideModal(){
            this.$refs['editorModal'].hideMenu();
        },
        showModal(m){
            this.modal.component = m;
            this.$refs['editorModal'].showMenu();
        },
        onHideModal(){
            this.modal.component = null;
        },
        setProgress(p){
            var x = (1 - (p.left / p.total))*30
            this.progress.editor = 60 + x;

        },
        refreshLayers(){
            this.layers = _.cloneDeep(this.panel(this.selections.panel).settings.diffuseTexture.reverseLayers());
        },
        isImageLayer(layer){
            if(layer === null) return false;
            return layer instanceof WrapviewImageLayer;
        },
        isTextLayer(layer) {
            if(layer === null) return false;
            return layer instanceof WrapviewTextLayer;
        },
        selectLayer(layer){
            this.hidePopup();
            this.panel(this.selections.panel).texture().editLayerById(layer.id);
        },
        setPanelName(name){
            this.panel(this.selections.panel).panel().data.pivot.name = name;
            this.panel(this.selections.panel).save();
        },
        changeLayerPosition(position){
            this.editingLayer().setPosition(position);
            this.editingLayer().setNeedsUpdate();
        },
        changeLayerAngle(angle) {
            this.editingLayer().setAngle(angle);
            this.editingLayer().setNeedsUpdate();
        },
        changeLayerSize(size){
            this.editingLayer().setSize(size);
            this.editingLayer().setNeedsUpdate();
        },
        changeLayerPivot(pivot){
            console.log("-- Changed Layer Pivot --");
            this.editingLayer().setPivot(pivot);
            this.editingLayer().setNeedsUpdate();
        },
        setLayerColor(color){
            this.editingLayer().setNeedsUpdate();
        },
        setLayerText(text){
            this.editingLayer().setFont(text.font);
            this.editingLayer().setFontSize(text.fontSize);
            this.editingLayer().setNeedsUpdate();
        },
        setLayerFont(f){
            this.editingLayer().setFont(f);
            this.editingLayer().setNeedsUpdate();
        },
        setLayerFontSize(num){
            this.editingLayer().setFontSize(num);
            this.editingLayer().setNeedsUpdate();
        },
        setLayerOutline(o){
            this.editingLayer().setOutline(o);
            this.editingLayer().setNeedsUpdate();
        },
        layerHeading(){

            var layer = this.panel(this.selections.panel).texture().editingLayer();
            if(layer !== null) {
                if(layer instanceof WrapviewImageLayer) {
                    return 'IMAGE LAYER';
                } else if (layer instanceof WrapviewTextLayer) {
                    return 'TEXT LAYER';
                }
            }
            return 'LAYER';
        },
        init(){
            var drawingBoard = document.getElementById('drawing-board');
            var dbSize = this.getElementSize(drawingBoard);
            if(dbSize.width > dbSize.height) {
                this.settings.canvas.size.width = dbSize.height;
                this.settings.canvas.size.height = dbSize.height;
            } else {
                this.settings.canvas.size.width = dbSize.width;
                this.settings.canvas.size.height = dbSize.width;
            }
        },
        materials() {
            if(!this.wrapview()){
                return null;
            }
            return this.wrapview().materials;
        },
        variables(){
            if(!this.wrapview()){
                return null;
            }
            return this.wrapview().variables;
        },
        fonts(){
            if(!this.wrapview()){
                return null;
            }
            return this.wrapview().fonts;
        },
        panel(id) {
            return this.materials()?.get(id)
        },
        nextPanel(){
            var index = this.panels.indexOf(this.selections.panel);
            index++;
            if(index >= this.panels.length) {
                return;
            }
            this.selectPanel(this.materials().get(this.panels[index]));
        },
        prevPanel(){
            var index = this.panels.indexOf(this.selections.panel);
            index--;
            if(index < 0) {
                return;
            }
            this.selectPanel(this.materials().get(this.panels[index]));
        },
        editingLayer() {
            var p = this.panel(this.selections.panel);
            if(!p) {
                return null;
            }
            return p.texture().editingLayer();
        },
        wrapview(){
            return this.$refs['wrapview'];
        },
        onWrapviewLoad(){
            this.progress.editor = 90;
            this.clearCanvasContainer();
            if(this.template.value('panels').length > 0) {
                this.selections.panel = this.template.child('panels').first().value('shortcode');
            }
            Font.get().then((fonts)=>{
                this.wrapview().fonts.load(fonts?.all());
            });
            this.loading.editor = false;
            setTimeout(()=>{
                this.init();
                this.progress.editor = 100;
                setTimeout(()=>{
                    this.showing.bottom = true;
                    this.buildPanels();
                    this.refreshLayers();
                    this.beginEditing();
                    this.wrapview().showViewer();

                },300);

            },300);

        },
        onViewportLoaded(){
            setTimeout(()=>{
                this.$refs['preLoading'].hideMenu();
                this.wrapview().resetViewer();
            },100)
        },
        buildPanels(){
            this.panels = [];
            this.materials()?.keys().forEach((m)=>{
                var material = this.materials()?.get(m);
                if(material.is('selectable')) {
                    this.panels.push(material.id);
                }
            })
        },
        isEditing(){
            if(this.materials() === null) return;
            if(!this.materials().has(this.selections.panel)) return false;
            return this.panel(this.selections.panel)?.settings.diffuseTexture?.isEditingLayer();
        },
        beginEditing(){
            if(!this.materials()?.has(this.selections.panel)) return;
            this.refreshLayers();
            this.panel(this.selections.panel).settings.diffuseTexture.beginEditing();
            this.panel(this.selections.panel).settings.diffuseTexture.draw(this.settings.canvas.container, true);
            this.stopEditingLayer();
        },
        endEditing(){
            this.stopEditingLayer();
            if(!this.materials()?.has(this.selections.panel)) return;
            this.layers = [];
            this.panel(this.selections.panel).settings.diffuseTexture.endEditing();
        },
        stopEditingLayer(){
            this.panel(this.selections.panel).settings.diffuseTexture.stopEditingLayer();
        },
        addText() {
            //this.wrapview().addImageLayer(this.selections.panel,'https://combibmark.s3.amazonaws.com/images/609d38fa25b4d.png');
            this.wrapview().addTextLayer(this.selections.panel,{
                text: 'My Text',
                font: this.fonts().first()
            }).then(()=>{
                this.refreshLayers();
            });
            //
        },
        clearCanvasContainer(){
            if(this.settings.canvas.container === null) {
                this.settings.canvas.container = document.getElementById('canvas-container');
            }
            while (this.settings.canvas.container.firstChild) {
                this.settings.canvas.container.removeChild(this.settings.canvas.container.lastChild);
            }
        },
        selectPanel(material){
            if(!material.is('selectable')) return;
            this.endEditing();
            this.selections.panel = material.id;
            this.clearCanvasContainer();
            if(material.is('viewable')) {
                this.beginEditing();
            }
        },
        getElementSize(el){
            var w = 0;
            var h = 0;
            if(typeof(el.innerWidth) === 'number') {
                w = el.innerWidth;
                h = el.innerHeight;
            } else if (el.clientWidth) {
                w = el.clientWidth;
                h = el.clientHeight;
            }
            return {
                width: w,
                height: h
            }
        },
        hide(m){
            this.showing[m] = false;
        },
        show(m){
            this.showing[m] = true;
        },
        toggleMenu(m){
            this.$refs[m].toggleMenu();
        },
        setBaseColor(color){
            this.panel(this.selections.panel)?.settings.diffuseTexture.baseLayer().setColorParameter(color);
            this.panel(this.selections.panel)?.settings.diffuseTexture.baseLayer().setNeedsUpdate();
            this.hidePopup();
        },

        save(){
            this.loading.save = true;
            this.endEditing();
            var materialsToSave = Object.keys(this.materials()?.all());
            this.saveMaterials(materialsToSave,()=>{
                this.loading.save = false;
                this.beginEditing();
            })

            //this.template.save(['properties']);
        },
        saveMaterials(list, cb) {
            if(list.length === 0) {
                cb();
                return;
            }
            var m = list.pop();
            this.panel(m).save().then(()=>{
                this.saveMaterials(list,cb);
            },(error)=>{
                this.agent.handler.handleError(error);
            });
        }
    }
}
</script>

<style scoped>
.cursor-rotate {
    cursor: url('/img/rotate.svg'), auto;
}
.slide-top-enter-active,
.slide-top-leave-active {
    transition: all 0.5s ease;
}

.slide-top-enter-from,
.slide-top-leave-to {
    opacity: 0;
    transform: translateY(50px);
}

</style>
