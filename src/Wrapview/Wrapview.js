import {WrapviewInstance} from "./WrapviewInstance.js";
import {ShaderChunk} from "three";

class Wrapview {
    static instances = {};
    static status = 0;
    static init(){
        if(Wrapview.status === 1) return;
        let mapShader = ShaderChunk.map_fragment;
        mapShader +=
            '\n#ifdef USE_MAP\n'+
            'vec4 cornerPixelColor = texture2D(map, vec2(0.0,0.0));\n'+
            'if(!gl_FrontFacing) {\n'+
            'if(cornerPixelColor.a == 0.0){\n'+
            'diffuseColor = vec4(1,1,1,1);\n'+
            '} else {\n'+
            'diffuseColor = cornerPixelColor;\n'+
            '}\n'+
            '}\n'+
            '#endif\n';

        let colorShader = ShaderChunk.color_fragment;
        colorShader +=
            '\n#ifdef USE_MAP\n'+
            'if(!gl_FrontFacing) {\n'+
            'if(cornerPixelColor.a == 0.0){\n'+
            'diffuseColor.rgb = vec3(1,1,1);\n'+
            '} else {\n'+
            'diffuseColor.rgb = cornerPixelColor.rgb;\n'+
            '}\n'+
            '}\n'+
            '#endif\n';
        ShaderChunk.map_fragment = mapShader;
        ShaderChunk.color_fragment = colorShader;
        Wrapview.status = 1;
    }

    static makeInstance(id, settings){
        Wrapview.init();
        if(Wrapview.instances.hasOwnProperty(id)) {
            return Wrapview.instances[id];
        }
        Wrapview.instances[id] = new WrapviewInstance(id, settings);
        return Wrapview.instances[id];
    }

    static instance(id) {
        return Wrapview.instances[id];
    }

    static destroyInstance(id){
        if(!Wrapview.instances.hasOwnProperty(id)) {
            return false;
        }
        Wrapview.instances[id].unload();
        delete Wrapview.instances[id];
        return true;
    }
}

export {Wrapview}
