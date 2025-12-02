<template>
    <div class="w-full py-2 border-t border-slate-600">
        <p class="font-bold uppercase text-white text-xs">
            PIVOT <small class="font-light"> ({{pivot.x + ',' + pivot.y}})</small>
        </p>
        <div class="w-full justify-start items-center flex mt-1">
            <div class="relative">
                <div class="w-12 h-4 flex justify-between items-center">
                    <div @click="setPivot('top-left')" class="w-4 h-4 flex justify-center items-center"
                    >
                        <div class="w-2 h-2 border border-gray-100"
                             :class="{'bg-gray-100':isActive('top-left')}"
                        ></div>
                    </div>
                    <div @click="setPivot('top-right')" class="w-4 h-4 flex justify-center items-center">
                        <div class="w-2 h-2 border border-gray-100"
                             :class="{'bg-gray-100':isActive('top-right')}"
                        ></div>
                    </div>
                </div>
                <div  @click="setPivot('center')" class="w-12 h-4 flex justify-center items-center">
                    <div class="w-4 h-4 flex justify-center items-center">
                        <div class="w-2 h-2 border border-gray-100"
                             :class="{'bg-gray-100':isActive('center')}"
                        ></div>
                    </div>
                </div>
                <div class="w-12 h-4 flex justify-between items-center">
                    <div  @click="setPivot('bottom-left')" class="w-4 h-4 flex justify-center items-center">
                        <div class="w-2 h-2 border border-gray-100"
                             :class="{'bg-gray-100':isActive('bottom-left')}"
                        ></div>
                    </div>
                    <div @click="setPivot('bottom-right')" class="w-4 h-4 flex justify-center items-center">
                        <div class="w-2 h-2 border border-gray-100"
                             :class="{'bg-gray-100':isActive('bottom-right')}"
                        ></div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script>
export default {
    props:['pivot'],
    name: "WrapviewPositionControl",
    data(){
        return {}
    },
    methods:{
        isActive(p) {
            switch(p) {
                case 'top-left':
                    return this.pivot.x === 0 && this.pivot.y === 0
                    break;
                case 'top-right':
                    return this.pivot.x === 1 && this.pivot.y === 0
                    break;
                case 'center':
                    return this.pivot.x === 0.5 && this.pivot.y === 0.5
                    break;
                case 'bottom-left':
                    return this.pivot.x === 0 && this.pivot.y === 1
                    break;
                case 'bottom-right':
                    return this.pivot.x === 1 && this.pivot.y === 1
                    break;
            }
        },
        setPivot(p){
            var pivot = {}
            switch(p) {
                case 'top-left':
                    pivot.x = 0;
                    pivot.y = 0;
                    break;
                case 'top-right':
                    pivot.x = 1;
                    pivot.y = 0;
                    break;
                case 'center':
                    pivot.x = 0.5;
                    pivot.y = 0.5;
                    break;
                case 'bottom-left':
                    pivot.x = 0;
                    pivot.y = 1;
                    break;
                case 'bottom-right':
                    pivot.x = 1;
                    pivot.y = 1;
                    break;
            }
            this.$emit("onChange",pivot);
        }
    }
}
</script>

<style scoped>

</style>
