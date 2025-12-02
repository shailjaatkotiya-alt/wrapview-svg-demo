<template>
    <div class="w-full py-2">
        <p class="font-bold uppercase text-white text-xs">
            {{ label }}
        </p>
        <div class="w-full flex justify-center items-center mt-1">
            <div class="w-full flex justify-center items-center">
                <input type="number"
                       max="2048"
                       ref="num"
                       :value="parseInt(value)"
                       class="w-full h-8 px-4 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       @change="onChange"
                />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props:['value','label'],
    name: "WrapviewPositionControl",
    data(){
        return {}
    },
    methods:{
        onChange(event){
            this.$emit("onChange",this.$refs['num'].value );
        }
    }
}
</script>

<style scoped>

</style>
