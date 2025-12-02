<template>
    <div class="w-screen h-screen flex justify-between items-center  bg-gray-100">
        <div class="w-12 h-full relative">
            <div class="w-full h-full bg-gradient-to-r from-stone-800 to-stone-900 shadow-lg transition-all duration-300 absolute top-0 left-0 flex flex-col flex-1 justify-between"
                :class="{'-left-12': !showing.sidemenu}"
            >
                <ul v-if="!loading.editor || showing.svg" class="p-0 m-0 list-none w-full">
                    <li @click="showModal('template-properties-modal')"

                        class="text-white group hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <template-icon  size="20" class=""></template-icon>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">Edit Template Info</p>
                        </div>
                        <div v-if="hint === 'template_info'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>
                    <li class="text-white group hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <stack3-icon @click="togglePopup('panels-menu')"  size="20" class=""></stack3-icon>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">Select A Panel</p>
                        </div>
                        <sidebar-popup-menu ref="panels-menu">
                            <div class="border-b border-yellow-900 w-48 px-4 py-2">
                                <p class="font-sans text-xs text-slate-300">Select A Panel
                                </p>
                            </div>
                            <div>
                                <template  v-for="material in materials()?.all()">
                                <div @click="selectPanel(material)" v-if="material.is('listed')" class="cursor-pointer bg-stone-900 px-4 py-2 hover:bg-stone-800 flex justify-start items-center">
                                    <div>
                                        <p class="text-xs font-sans text-slate-300">{{ material.id }}</p>
                                    </div>
                                </div>
                                </template>
                            </div>
                        </sidebar-popup-menu>
                        <div v-if="hint === 'panels_menu'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>
                    <li @click="showModal('asset-management-modal')" class="group text-white hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <photo-icon  size="20" class=""></photo-icon>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">Add An Image</p>
                        </div>
                        <div v-if="hint === 'add_image'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>
                    <li @click="addText" class="group text-white hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <cursor-text-icon  size="20" class=""></cursor-text-icon>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">Add Text</p>
                        </div>
                        <div v-if="hint === 'add_text'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>
                    <li @click="showModal('variables-modal')" class="group text-white hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <variable-icon  size="20" class=""></variable-icon>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">Manage Variables</p>
                        </div>
                        <div v-if="hint === 'add_variables'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>

                    <li @click="hideEditor" class="text-white group hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <svg class="w-6 h-6" viewBox="0 0 362 321" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <g id="Home" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g id="Artboard" transform="translate(-190.000000, -146.000000)" class="fill-white group-hover:fill-yellow-400">
                                    <g id="3d-rotate-icon" transform="translate(190.000000, 146.000000)">
                                        <path d="M335.505199,209.836396 C333.362915,201.187043 327.833985,193.243759 319.144657,187.47517 C318.389559,186.971909 318.06286,186.027783 318.34572,185.166323 C318.593178,184.43201 318.798215,183.669455 318.953761,182.878657 C319.109306,182.137284 319.22243,181.360607 319.278992,180.562749 L319.356764,179.143549 L319.187079,176.728791 C319.148193,176.382108 319.201858,176.031323 319.342624,175.71205 C319.780979,174.688249 320.96878,174.215183 321.993965,174.652946 C337.159635,181.155847 348.479094,190.850183 355.132192,201.907234 C360.342961,210.556587 362.697352,220.060284 361.820642,229.535739 L361.813571,229.592224 C360.915651,239.0818 356.786629,248.529012 349.044713,257.051273 C338.524192,268.623754 321.294011,278.536972 296.399687,284.559746 L295.197745,284.849234 C281.177454,288.245429 265.59464,292.015841 248.965429,294.063443 L248.633127,294.091686 C247.516358,294.091686 246.611038,293.187588 246.611038,292.072327 L246.611038,274.519436 C246.614535,273.495769 247.381971,272.635463 248.399809,272.514198 C255.759932,271.659854 262.844315,270.523081 269.617608,269.223913 C276.419181,267.924745 282.902593,266.45612 289.046634,264.938071 C309.055421,260.002644 322.481812,250.463643 329.806583,239.448957 C332.959911,234.711229 334.982001,229.698135 335.915273,224.68504 C336.841474,219.679007 336.692999,214.64473 335.505199,209.836396 L335.505199,209.836396 Z M70.3640299,36.4045105 L178.899324,0.310230493 C180.200249,-0.127532684 181.550665,-0.0851685054 182.752607,0.331412582 L182.752607,0.310230493 L292.730231,37.9296209 C295.384544,38.8211069 297.080396,41.4140083 296.830971,44.1995193 C296.845112,44.3336725 296.845112,44.4819471 296.845112,44.6372825 L296.845112,177.088886 L296.830971,177.088886 C296.830971,179.298884 295.607819,181.431214 293.493817,182.49738 L184.30099,237.909725 C183.351477,238.481864 182.263697,238.784567 181.154732,238.785251 C179.93158,238.785251 178.807411,238.425156 177.852929,237.810875 L68.412643,180.802812 C66.4104186,179.756137 65.1549903,177.686525 65.1532611,175.429622 L65.1320504,175.429622 L65.1320504,42.4272845 C65.1320504,39.3558816 67.4015983,36.8281522 70.3640299,36.4045105 Z M205.186487,186.493734 L207.929741,109.849874 L239.356969,99.6048039 C251.454154,95.6578746 259.457669,95.8202706 263.586691,99.9719601 C267.666221,104.088346 269.433781,112.610607 268.903513,125.545802 C268.387385,138.459816 265.877449,148.493066 261.352494,155.702037 C256.785117,162.974554 248.576566,169.011449 236.521802,173.869209 L205.186487,186.493734 L205.186487,186.493734 Z M238.953965,118.591016 L229.861633,121.733026 L228.490006,158.286252 L237.568198,154.812389 C240.523559,153.675617 242.672913,152.496481 244.016259,151.239677 C245.366675,149.996994 246.08784,148.041181 246.193894,145.372238 L247.105955,121.937787 C247.204938,119.261783 246.625179,117.779036 245.324254,117.496609 C244.03747,117.200059 241.909327,117.560155 238.953965,118.591016 L238.953965,118.591016 Z M132.829624,127.466312 L133.345751,120.25028 C131.083274,118.633381 127.420888,116.444565 122.358594,113.676772 C117.352862,110.944282 111.116908,108.338885 103.700224,105.85352 L101.982155,88.2865076 C111.088627,90.2776239 119.940571,93.5255443 128.537986,98.0655721 C136.032443,102.033683 141.4836,105.387514 144.856106,108.105882 C148.242752,110.845433 150.717337,113.288433 152.279861,115.456067 C155.715999,120.34913 157.20782,125.785866 156.762395,131.745094 C156.196775,139.292978 152.506109,142.893933 145.725746,142.526777 L145.683325,143.091633 C153.255554,150.533607 156.762395,158.349798 156.147284,166.469599 C155.850333,170.444771 154.938272,173.452627 153.41817,175.500229 C151.905138,177.526649 150.102226,178.741089 148.030645,179.101185 C145.966134,179.475401 143.307723,179.15767 140.062482,178.155051 C135.261787,176.62288 128.686461,173.353778 120.378926,168.40423 C112.184515,163.518228 104.15979,157.770821 96.2906096,151.162009 L100.532755,135.240139 C107.306048,140.867514 113.167279,145.125114 118.045746,147.942331 C122.980776,150.808974 127.258272,153.047215 130.857026,154.664114 L131.366083,147.603418 L112.170375,134.710586 L113.280403,118.922869 L132.829624,127.466312 L132.829624,127.466312 Z M175.067253,222.708046 L175.067253,95.8132099 L77.3070082,51.5497042 L77.3070082,171.779242 L175.067253,222.708046 L175.067253,222.708046 Z M284.663084,52.997147 L187.242211,95.8696955 L187.242211,222.821017 L284.663084,173.37496 L284.663084,52.997147 Z M180.751728,12.4475676 L88.287095,43.2039611 L181.190083,85.2786509 L274.093071,44.3901581 L180.751728,12.4475676 L180.751728,12.4475676 Z M2.71594851,202.147298 C7.62269689,192.530629 19.5643367,183.408209 40.6195192,175.415501 C40.8952587,175.30253 41.1992791,175.246044 41.51744,175.267226 C42.6274681,175.344894 43.468827,176.305149 43.3981246,177.413678 C43.3769138,177.787895 43.4264055,178.515147 43.468827,178.903485 C43.5678104,180.223835 43.8152689,181.530064 44.1829215,182.779807 C44.5364336,184.008369 45.0242804,185.215748 45.6323212,186.380763 L45.7595856,186.606705 C46.2827836,187.57402 45.9363417,188.78846 44.9747887,189.332134 C36.7167453,193.992193 31.9231208,198.673435 29.9575933,203.298191 C27.4264465,209.250358 29.7384158,215.343739 35.3663289,221.33827 C41.3901757,227.742322 51.0905485,233.969856 62.8059406,239.752567 C101.331693,258.795265 161.00454,272.846051 184.244428,273.481513 L184.244428,253.909263 C184.251498,253.436196 184.414114,252.96313 184.753485,252.581852 C185.487313,251.748802 186.756935,251.663644 187.595723,252.391213 C199.74947,263.052865 213.013245,273.686273 224.403406,285.061055 C224.777234,285.442721 224.983607,285.957262 224.976974,286.491111 C224.970342,287.024961 224.75125,287.53423 224.368055,287.906516 C212.723365,299.154205 199.848453,309.738189 187.659355,320.442205 C187.298773,320.788179 186.803856,321 186.266517,321 C185.149419,321 184.244428,320.08917 184.244428,318.97358 L184.244428,300.799348 C142.742104,301.63957 74.9950389,281.622496 34.4613379,255.773287 C21.7207607,247.653486 11.5961732,238.905283 5.73494211,230.008806 C-0.37374752,220.738111 -1.95748187,211.290899 2.71594851,202.147298 Z" id="Shape"></path>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">Preview 3D</p>
                        </div>
                        <div v-if="hint === 'preview'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>
                </ul>
                <ul v-if="!loading.editor" class="p-0 m-0 list-none w-full">
                    <li v-if="false" class="text-white hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <printer-icon @click="togglePopup('sizes-menu')"  size="20" class=""></printer-icon>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">View Size</p>
                        </div>
                        <sidebar-popup-menu ref="sizes-menu">
                            <div class="border-b border-yellow-900 w-48 px-4 py-2">
                                <p class="font-sans text-xs text-slate-300">Select A Size
                                </p>
                            </div>
                            <div>
                                <template  v-for="size in panel(selections.panel)?.panel().child('sizes')?.all()">
                                    <div @click="selectSize(size)" class="cursor-pointer bg-stone-900 px-4 py-2 hover:bg-stone-800 flex justify-start items-center">
                                        <div>
                                            <p class="text-xs font-sans text-slate-300">{{size.value('name')}}</p>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </sidebar-popup-menu>
                        <div v-if="hint === 'panels_menu'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>
                    <li @click="showModal('editor-settings-modal')" class="text-white hover:text-yellow-400 m-2 w-8 h-8 cursor-pointer rounded-sm flex justify-center items-center relative">
                        <settings-icon  size="20" class=""></settings-icon>
                        <div class="group-hover:visible invisible absolute top-0 left-full h-full z-50 bg-stone-900 text-yellow-400 px-4 py-2 flex justify-center items-center">
                            <p class="font-sans font-light whitespace-nowrap text-xs">Editor Settings</p>
                        </div>
                        <div v-if="hint === 'settings'" class="animate-pulse absolute w-3 h-3 border-2 border-white drop-shadow-xl bg-yellow-400 rounded-full top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-50">

                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div  class="w-full h-full relative flex flex-1 flex-col justify-between">
            <div  v-if="!loading.editor" class="w-full h-8 relative">
                <div class="absolute top-0 left-0 transition-all duration-300 w-full h-full bg-stone-900 flex justify-between items-center"
                     :class="{'-top-8': !showing.topmenu}"
                >
                    <div v-if="materials()?.has(selections.panel)" class="ml-2 flex justify-start items-center">
                        <template-icon size="24" class="text-slate-200"></template-icon>
                        <p class="ml-2 text-sm text-slate-200 font-light">{{template.value('name')}}</p>
                    </div>
                    <div class="flex justify-start items-center">
                        <button @click="save"
                                :disabled="loading.save"
                                class="m-1 rounded-sm h-6 disabled:bg-yellow-200 px-4 flex items-center
                justify-center focus:outline-none
                focus:ring-0 text-slate-800 bg-yellow-400 hover:bg-yellow-500 text-xs font-light">
                            {{loading.save?'SAVING...':'SAVE'}}
                        </button>
                        <button @click="showModal('publish-modal')"
                                :disabled="loading.publish"
                                class="m-1 rounded-sm h-6 disabled:bg-blue-200 px-4 flex items-center
                justify-center focus:outline-none
                focus:ring-0 text-white bg-blue-400 hover:bg-blue-500 text-xs font-light ml-2">
                            {{loading.publish?'PUBLISHING...':'PUBLISH'}}
                        </button>
                    </div>
                </div>
            </div>


            <div v-show="showing.canvas" class="w-full h-full bg-stone-600 relative p-4 select-none">
                <div class="w-full h-4 pl-4 absolute top-0 left-0 border-b border-gray-500">
                    <div class="bg-stone-600 w-full h-full"></div>
                </div>
                <div class="w-4 h-full absolute pt-4 top-0 left-0  border-r border-gray-500">
                    <div class="bg-stone-600 w-full h-full"></div>
                </div>

                <div class="select-none w-full h-full bg-stone-600 flex justify-center items-center relative" id="drawing-board">
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
                </div>
            </div>
            <div v-show="showing.svg" class="w-full h-full bg-stone-600 relative p-4 select-none">
                <div class="w-full h-4 pl-4 absolute top-0 left-0 border-b border-gray-500">
                    <div class="bg-stone-600 w-full h-full"></div>
                </div>
                <div class="w-4 h-full absolute pt-4 top-0 left-0  border-r border-gray-500">
                    <div class="bg-stone-600 w-full h-full"></div>
                </div>

                <div class="select-none w-full h-full bg-stone-600 flex justify-center items-center relative" id="drawing-board">
                    <div tabindex="0" class="relative bg-stone-700 focus:outline-none" id="svg-container"
                         :style="'width:'+settings.canvas.size.width+'px;'+
                                'height:'+settings.canvas.size.height+'px;'
                               "
                    >

                    </div>
                </div>
            </div>
        </div>
        <div   class="w-96 h-full relative">
            <div class="absolute top-0 right-0 transition-all duration-300 w-96 h-full bg-gradient-to-r from-stone-900 to-stone-800 shadow-lg flex-col flex-1 justify-between"
                 :class="{'-right-96': !showing.properties}"
            >
                <template v-if="!showing.svg">

                    <div id="textureProperties" v-if="!loading.editor && materials()?.has(selections.panel) && panel(selections.panel).settings.hasOwnProperty('diffuseTexture') && !panel(selections.panel)?.settings.diffuseTexture?.isEditingLayer()"
                     class="w-full relative overflow-auto overscroll-contain transition-all duration-300 ease-in h-2/3 bg-stone-800"

                    >
                        <div class="p-2 bg-stone-900 w-full h-8 border-b border-yellow-900 flex justify-start items-center">
                            <p class="ml-2 text-xs font-bold text-slate-200"> {{panel(selections.panel)?.id}} ({{panel(selections.panel)?.name()}})</p>
                        </div>
                        <div class="w-full h-auto absolute p-2 border-b border-yellow-900">
                            <wrapview-input-control
                                label="NAME"
                                type="text"
                                :value="panel(selections.panel).name()"
                                @onChange="setPanelName"
                            ></wrapview-input-control>
                            <wrapview-color-control
                                label="COLOR"
                                :current_panel="selections.panel"
                                :color="panel(selections.panel)?.texture()?.baseLayer().color()"
                                :materials="materials()"
                                :variables="variables()"
                                @onChange="setBaseColor"
                            ></wrapview-color-control>
                        </div>
                    </div>
                    <div id="layerProperties" v-if="!loading.editor && materials()?.has(selections.panel) && isImageLayer(editingLayer())"
                     class="w-full relative overflow-auto overscroll-contain transition-all duration-300 ease-in h-2/3 bg-stone-800"

                    >
                        <div class="p-2 bg-stone-900 w-full h-8 border-b border-yellow-900 flex justify-between items-center">
                            <div class="flex justify-start items-center">
                                <p class="ml-2 text-xs font-bold text-slate-200">{{ layerHeading() }}</p>
                            </div>
                            <button @click="deleteLayer" class="bg-transparent border-none focus:outline-none focus:ring-0 text-red-500 hover:text-red-600">
                                <trash-icon size="20" class=""></trash-icon>
                            </button>
                        </div>
                        <div v-if="editingLayer() !== null" class=" w-full h-auto p-2 border-b border-yellow-900">
                            <wrapview-position-control
                                :position="editingLayer().settings.position"
                                :angle="editingLayer().settings.angle"
                                @onChangeAngle="changeLayerAngle"
                                @onChange="changeLayerPosition"
                            ></wrapview-position-control>
                            <wrapview-size-control
                                :size="editingLayer().settings.size"
                                :ratio="editingLayer().settings.ratio"
                                :locked="true"
                                @onChange="changeLayerSize"
                            ></wrapview-size-control>
                            <wrapview-pivot-control
                                :pivot="editingLayer().settings.pivot"
                                @onChange="changeLayerPivot"
                            ></wrapview-pivot-control>
                        </div>
                    </div>

                    <div id="textProperties" v-if="!loading.editor && materials()?.has(selections.panel) && isTextLayer(editingLayer())"
                     class="w-full relative overflow-auto overscroll-contain transition-all duration-300 ease-in h-2/3 bg-stone-800"

                >
                    <div class="p-2 bg-stone-900 w-full h-8 border-b border-yellow-900 flex justify-between items-center" @click="accordion.properties = !accordion.properties">
                        <div class="flex justify-start items-center">
                            <chevron-right-icon class="text-slate-200 transition-all duration-300 ease-in"
                                                :class="{'transform rotate-90': accordion.properties}"
                                                size="16"></chevron-right-icon>
                            <p class="ml-2 text-xs font-bold text-slate-200">{{ layerHeading() }}</p>
                        </div>
                        <button @click="deleteLayer" class="bg-transparent border-none focus:outline-none focus:ring-0 text-red-500 hover:text-red-600">
                            <trash-icon size="20" class=""></trash-icon>
                        </button>
                    </div>
                    <div v-if="editingLayer() !== null" class=" w-full h-auto p-2 border-b border-yellow-900">
                        <wrapview-position-control
                            :position="editingLayer().settings.position"
                            :angle="editingLayer().settings.angle"
                            @onChangeAngle="changeLayerAngle"
                            @onChange="changeLayerPosition"
                        ></wrapview-position-control>

                        <wrapview-font-control
                            label="FONT"
                            :fonts="fonts()"
                            :value="editingLayer().settings.font"
                            @onChange="setLayerFont"
                        ></wrapview-font-control>

                        <wrapview-number-control
                            label="FONT SIZE"
                            :value="editingLayer().settings.fontSize"
                            @onChange="setLayerFontSize"
                        ></wrapview-number-control>

                        <wrapview-text-control
                            :text="editingLayer().text()"
                            :materials="materials()"
                            :variables="variables()"
                            :allow="{inherit: false}"
                            @onChange="setLayerText"
                        ></wrapview-text-control>

                        <wrapview-color-control
                            ref="colorControl"
                            key="color_control"
                            label="COLOR"
                            :color="editingLayer().color()"
                            :materials="materials()"
                            :variables="variables()"
                            :allow="{inherit: false}"
                            @onChange="setLayerColor"
                        ></wrapview-color-control>

                        <wrapview-outline-control
                            :outline="editingLayer().outline()"
                            :materials="materials()"
                            :variables="variables()"
                            @onChange="setLayerOutline"
                        ></wrapview-outline-control>



                        <wrapview-pivot-control
                            :pivot="editingLayer().settings.pivot"
                            @onChange="changeLayerPivot"
                        ></wrapview-pivot-control>

                    </div>
                </div>
                    <div  v-if="!loading.editor && materials()?.has(selections.panel) && panel(selections.panel).is('viewable')"
                      class="w-full relative overflow-auto overscroll-contain transition-all duration-300 ease-in h-1/3 bg-stone-800"

                >
                    <div class="p-2 bg-stone-900 w-full h-8 border-b border-yellow-900 flex justify-start items-center">
                        <p class="ml-2 text-xs font-bold text-slate-200">LAYERS</p>
                    </div>

                    <div class="w-full h-auto border-b border-yellow-900">
                        <ul class="list-none p-0">
                            <template :key="layer.id" v-for="layer in layers">
                                <li class="py-2 border-b border-yellow-900 text-white flex justify-between items-center">
                                    <div class="flex justify-start items-center cursor-pointer" @click="selectLayer(layer)">
                                        <div class="w-2 h-2 ml-2 mr-2"
                                             :class="{'bg-blue-500':editingLayer() !== null && layer.id === editingLayer().id}"
                                        >

                                        </div>
                                        <div v-if="isImageLayer(layer)" class="w-8 h-8 border border-yellow-900 mr-2 bg-cover bg-center"
                                             :style="'background-image:url('+layer._path+');'"
                                        >

                                        </div>
                                        <div v-if="isTextLayer(layer)" class="w-8 h-8 mr-2 bg-cover bg-center text-white flex justify-center items-center">
                                            <typography-icon size="20"></typography-icon>
                                        </div>
                                        <p class="text-xs font-light uppercase">
                                            {{ layer.name() }}
                                        </p>
                                    </div>

                                </li>
                            </template>
                        </ul>

                    </div>

                </div>
                </template>
                <template v-if="showing.svg">
                    <div v-if="!loading.editor && materials()?.has(selections.panel) && panel(selections.panel).settings.hasOwnProperty('diffuseTexture') && !panel(selections.panel)?.settings.diffuseTexture?.isEditingLayer()"
                         class="w-full relative overflow-auto overscroll-contain transition-all duration-300 ease-in h-2/3 bg-stone-800"

                    >
                        <div class="p-2 bg-stone-900 w-full h-8 border-b border-yellow-900 flex justify-between items-center">
                            <div class="flex justify-start items-center">
                                <p class="ml-2 text-xs font-bold text-slate-200"> {{panel(selections.panel)?.id}} ({{panel(selections.panel)?.name()}})</p>
                            </div>
                        </div>
                        <div class="w-full h-auto p-2 border-b border-yellow-900">
                            <div class="w-full flex justify-center items-center px-4">
                                <a target="_blank" v-if="showing.download" :id="downloadLinkId" class="bg-stone-900 border border-yellow-900 rounded-md px-4 py-2 text-white text-xs font-sans font-light uppercase hover:text-yellow-400 cursor-pointer">
                                    DOWNLOAD
                                </a>
                            </div>
                        </div>
                        <div class="w-full h-auto p-2 border-b border-yellow-900">
                            <div class="w-full flex justify-center items-center px-4">
                                <button @click="exitVectorMode" class="bg-stone-900 border border-yellow-900 rounded-md px-4 py-2 text-white text-xs font-sans font-light uppercase hover:text-yellow-400 cursor-pointer">
                                    EXIT
                                </button>
                            </div>
                        </div>
                    </div>

                </template>

            </div>
        </div>
        <div v-show="showing.viewer" class="w-screen h-screen top-0 left-0 fixed z-0">
            <wrapview ref="wrapview" :template="template" @onLoad="onWrapviewLoad" @progress="setProgress"
                      @imageCaptured="imageCaptured"></wrapview>
        </div>
        <div @click="showEditor" class="hover:text-yellow-500 cursor-pointer transition-all duration-300 left-1/2 transform -translate-x-1/2 text-slate-400 font-light text-sm px-6 fixed z-900 rounded-full shadow-lg bg-slate-900 h-12 w-32 flex items-center justify-between"
            :class="{'-bottom-32': !showing.exitButton, 'bottom-10': showing.exitButton}"
        >
            <p>EXIT</p>
            <plus-icon size="20" class="transform rotate-45"></plus-icon>
        </div>
        <div @click="setCaptureMode" class="hover:text-yellow-500 cursor-pointer transition-all duration-300 left-10 text-slate-400 font-light text-sm fixed z-900 rounded-full shadow-lg bg-slate-900 h-12 w-12 flex items-center justify-center"
             :class="{'-bottom-32': !showing.exitButton, 'bottom-10': showing.exitButton}"
        >
            <live-photo-icon size="20" class=""></live-photo-icon>
        </div>
        <standard-modal ref="preLoading">
            <div class="bg-white rounded-lg shadow-lg w-full h-full">
                <div class="w-full h-3/4">

                </div>
                <div class="w-full h-1/4 px-4 py-3">
                    <p class="font-bold text-2xl text-stone-800">Creator Studio</p>
                    <p class="font-light text-sm text-stone-8000">Welcome to the TAWK Creator Studio!</p>
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

import {PrinterIcon, TemplateIcon, PointerIcon, TypographyIcon, LivePhotoIcon,VariableIcon, TrashIcon, PhotoIcon, PlusIcon, Stack3Icon, Rotate360Icon, ChevronRightIcon, StackIcon, InfoSquareIcon, CursorTextIcon, SettingsIcon, ShirtIcon} from 'vue-tabler-icons'
import {WrapviewImageLayer, WrapviewTextLayer} from "../../Wrapview/WrapviewLayer";
import {Font, Photo, Template} from '../../Manager/Manager';
import {WrapviewFont} from "../../Wrapview/WrapviewFont";
import {WrapviewVectorPrintFile} from "../../Wrapview/WrapviewVectorPanel";
export default {
    props: ['template_id'],
    name: "AdvancedEditor",
    components: {
        PrinterIcon,
        PointerIcon, VariableIcon,TypographyIcon,TemplateIcon,
        PhotoIcon,
        Stack3Icon,
        StackIcon,
        InfoSquareIcon,
        CursorTextIcon,
        SettingsIcon, ShirtIcon,
        ChevronRightIcon, Rotate360Icon, PlusIcon, TrashIcon,LivePhotoIcon
    },
    data() {
        return {
            hint: '',
            vectorCanvas: null,
            template: null,
            selections: {
                panel: 'FRONT'
            },
            progress: {
                editor: 0
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
                sidemenu: true,
                topmenu: true,
                properties: true,
                canvas: true,
                exitButton: false,
                viewer: false,
                tutorial: false,
                svg: false,
                download: false
            },
            downloadLinkId: '',
            accordion: {
                properties: true,
                layers: false

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
        exitVectorMode(){
            this.showing.svg = false;
            this.showing.canvas = true;
        },
        selectSize(size){
            this.togglePopup('sizes-menu');
            this.stopEditingLayer();
            this.showing.svg = true;
            this.showing.canvas = false;
            this.showing.download = true;
            this.downloadLinkId = guid();
            setTimeout(()=>{
                if(this.vectorCanvas === null) {
                    this.vectorCanvas = new WrapviewVectorPrintFile({
                        mode: 'multiple',
                        size: {
                            width: 4032,
                            height: 4032
                        }
                    });
                    this.vectorCanvas.setMaterials(this.materials());
                }

                this.vectorCanvas.init();
                this.vectorCanvas.drawAll(size.value('shortcode'));
                //this.vectorCanvas.draw(this.selections.panel, size.value('shortcode'));
                this.vectorCanvas.setContainer(document.getElementById('svg-container'));
                this.vectorCanvas.makeDownloadLink(this.downloadLinkId);
            },300);

            //this.panel(this.selections.panel)?.sizes;
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
                    this.refreshLayers();
                    this.beginEditing();
                    this.$refs['preLoading'].hideMenu();
                },300);

            },300);

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
            this.togglePopup('panels-menu')
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
        showEditor(){
            this.wrapview().setMode('regular');
            this.show('sidemenu');
            this.show('topmenu');
            this.show('properties');
            this.show('canvas');
            this.hide('exitButton');
            this.hide('viewer');
            //this.wrapview().hideViewer();
        },
        hideEditor(){
            this.hide('sidemenu');
            this.hide('topmenu');
            this.hide('properties');
            this.hide('canvas');
            this.show('exitButton');
            setTimeout(()=>{
                this.show('viewer');
                this.wrapview().showViewer();
            },300);

        },
        hide(m){
            this.showing[m] = false;
        },
        show(m){
            this.showing[m] = true;
        },
        togglePopup(m){
            this.$refs[m].toggleMenu();
        },
        setBaseColor(color){
            this.panel(this.selections.panel)?.settings.diffuseTexture.baseLayer().setColorParameter(color);
            this.panel(this.selections.panel)?.settings.diffuseTexture.baseLayer().setNeedsUpdate();
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
</style>
