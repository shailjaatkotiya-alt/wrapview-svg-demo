<template>
    <div class="w-full py-2">
        <p class="font-bold uppercase text-white text-xs">
            SIZE
        </p>
        <div class="w-full flex justify-center items-center mt-1">
            <div class="w-1/2 flex justify-center items-center">
                <p class="font-light text-white text-xs mr-2">
                    w:
                </p>
                <input type="number"
                       max="2048"
                       ref="x"
                       :value="parseFloat(size.width).toFixed(2)"
                       class="w-full h-8 px-2 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       @change="onChange"
                />
                <p class="font-light text-white text-xs ml-2">
                    <small>px</small>
                </p>
            </div>
            <div class="w-1/2 ml-2 flex justify-center items-center">
                <p class="font-light text-white text-xs mr-2">
                    h:
                </p>
                <input type="number"
                       max="2048"
                       ref="y"
                       :value="parseFloat(size.height).toFixed(2)"
                       class="w-full h-8 px-2 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       @change="onChange"
                />
                <p class="font-light text-white text-xs ml-2">
                    <small>px</small>
                </p>
            </div>

        </div>
    </div>
</template>

<script>


export default {
    props:['size', 'ratio','locked'],
    name: "WrapviewPositionControl",
    data(){
        return {}
    },
    methods:{

        onChange(event){

            var width = 0;
            var height = 0;
            var value = event.target.value;
            if(this.$refs['x'].value === value) {
                width = parseFloat(value);
                this.$emit('onChange', {
                    width: width
                });
            } else {
                height = parseFloat(value);
                this.$emit('onChange', {
                    height: height
                });
            }
        }
    }
}
</script>

<style scoped>

</style>
