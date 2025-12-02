<template>
    <div class="w-full py-2">
        <p class="font-bold uppercase text-white text-xs">
            {{ label }}
        </p>
        <div class="w-full justify-start items-center flex mt-1">
            <input  :type="type"
                    class="w-full h-8 px-2 py-2 text-xs text-white bg-transparent border-slate-600
                    border font-light focus:outline-none focus:ring-0
                    disabled:bg-slate-800
                "
                    ref="textField"
                    :value="value"
                    @change="onChange"
            />
        </div>
    </div>
</template>

<script>
import {LockIcon, LockOpenIcon, VariableIcon, VariableOffIcon} from 'vue-tabler-icons';

export default {
    props:['label','type','value'],
    name: "WrapviewTextControl",
    components: {
        LockIcon, LockOpenIcon,VariableIcon, VariableOffIcon
    },
    data(){
        return {
        }
    },
    mounted() {

    },
    methods:{
        onChange(){
            this.$emit("onChange",this.$refs['textField'].value)
        },
    }
}
</script>

<style scoped>

</style>
