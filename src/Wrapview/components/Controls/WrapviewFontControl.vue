<template>
    <div class="w-full py-2">
        <p class="font-bold uppercase text-white text-xs">
            {{ label }}
        </p>
        <div class="w-full flex justify-center items-center mt-1">
            <div class="w-full flex justify-center items-center">
                <select
                       :value="value?.family"
                       class="w-full h-8 px-4 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800"
                       ref="fontSelector"
                       @change="onChange"
                >
                    <option value="">Select Font</option>
                    <option v-for="font in fonts.all()" :value="font.family">{{font.family}}</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props:['value','label','fonts'],
    name: "WrapviewFontControl",
    data(){
        return {}
    },
    methods:{
        onChange(event){
            var family = this.$refs['fontSelector'].value;
            var selectedFonts = this.fonts.fetch('family',family);
            if(selectedFonts.length > 0) {
                this.$emit("onChange", selectedFonts[0]);
            }

        }
    }
}
</script>

<style scoped>

</style>
