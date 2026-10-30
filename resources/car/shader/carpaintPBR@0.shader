Shader3D Start
{"type":"Shader3D","name":"carpaintPBR","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"Pigment_Color":{"type":"Color","default":[1,0,0,1],"alias":"Pigment_Color","index":0},"Edge_Color":{"type":"Color","default":[0.14062494039535522,0,1,1],"alias":"Edge_Color","index":1},"Edge_Falloff_Factor":{"type":"Float","default":0.5,"alias":"Edge_Falloff_Factor","index":2},"Metallic":{"type":"Float","alias":"Metallic","index":6},"Flake_Reflection":{"type":"Float","alias":"Flake_Reflection","index":20},"Flake_Map":{"type":"Texture2D","default":"white","alias":"Flake_Map","index":19},"UV0_UV1":{"type":"Bool","default":"true","alias":"UV0_UV1","index":5},"Flake_Density":{"type":"Float","default":1,"alias":"Flake_Density","index":18},"Flake_Falloff_Factor":{"type":"Float","default":0.5,"alias":"Flake_Falloff_Factor","index":21},"Facing_Specular":{"type":"Float","alias":"Facing_Specular","index":9},"Perpendicular_Specular":{"type":"Float","alias":"Perpendicular_Specular","index":10},"Specular_Falloff_Factor":{"type":"Float","alias":"Specular_Falloff_Factor","index":11},"Specular_Color":{"type":"Color","default":[1,1,1,1],"alias":"Specular_Color","index":8},"Smoothness":{"type":"Float","default":1,"alias":"Smoothness","index":7},"Occlusion_Map":{"type":"Texture2D","default":"white","alias":"Occlusion_Map","index":3},"Occlusion":{"type":"Float","alias":"Occlusion","index":4},"TextureCube":{"type":"TextureCube","default":"TextureCube","alias":"TextureCube","index":24},"Contrast":{"type":"Float","alias":"Contrast","index":25},"Intensity":{"type":"Float","alias":"Intensity","index":26},"Facing_Reflection":{"type":"Float","default":1,"alias":"Facing_Reflection","index":14},"Perpendicular_Reflection":{"type":"Float","alias":"Perpendicular_Reflection","index":15},"Reflection_Falloff_Factor":{"type":"Float","default":0.5,"alias":"Reflection_Falloff_Factor","index":16},"ClearcoatRoughness":{"type":"Float","alias":"ClearcoatRoughness","index":13}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}],"defines":{"EMISSION":{"default":true,"alias":null},"CLEARCOAT":{"default":true,"alias":null}}}
Shader3D End
GLSL Start
#defineGLSL VS0
#include "Color.glsl";
        #include "Scene.glsl";
        #include "Camera.glsl";
        #include "Sprite3DVertex.glsl";
        #include "shaderBlueprint/lib/BlueprintVertex.glsl";
        #include "shaderBlueprint/lib/BlueprintPixelVertex.glsl";
        void main()
        {
            Vertex vertex;
            getVertexParams(vertex);
        	PixelParams pixel;
            initPixelParams(pixel, vertex);
        
            varyingPixelParams(pixel);
            gl_Position = getPositionCS(pixel.positionWS);
            gl_Position = remapPositionZ(gl_Position);
        
        }
            
#endGLSL
#defineGLSL FS0
#include "Color.glsl";
        #include "Scene.glsl";
        #include "Camera.glsl";
        #include "Sprite3DFrag.glsl";
        #include "shaderBlueprint/lib/BlueprintPixelFrag.glsl";
        #include "shaderBlueprint/lightmode/BlueprintPBRMetal.glsl";
float bpFresnel(vec3 normal,vec3 viewDir,float power){
    float num = dot(normal,viewDir);
    num = pow(1.0-num,power);
    return num;
}
vec2 tilingOffset(vec2 uv,vec2 tiling,vec2 offset){
        return uv*tiling+offset;
    }
vec2 switchFun(vec2 par1,vec2 par2,bool par3){
            if(par3){
                return par1;
            }else{
                return par2;
            }
        }
float oneMinus(float a){
            return 1.0 - a;
        }
vec3 ContrastFloat(vec3 In,float Contrast){
        vec3 Out;
        float midpoint = pow(0.5, 2.2);
        Out = (In - midpoint) * Contrast + midpoint;
        return Out;
        }
void main()
        {
            PixelParams pixel;
            getPixelParams(pixel);
        vec3 normalWS = v_NormalWS;
vec2 uv0 = vec2(0.0, 0.0);
#ifdef UV
uv0 = pixel.uv0;
#endif // UV
vec2 uv1 = vec2(0.0, 0.0);
#ifdef UV1
#ifdef LIGHTMAP
uv1 = v_Texcoord1;
#endif
#endif // UV1
vec3 viewDirection = getViewDirection(pixel.positionWS);
	vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        SurfaceInputs inputs;
 inputs.normalTS = vec3(0.0,0.0,1.0);
float fre_26 = bpFresnel(normalWS,viewDirection,Edge_Falloff_Factor);
float cla_100 = clamp(fre_26,0.0,1.0);
vec4 mix_40 = mix(Pigment_Color,Edge_Color,vec4(cla_100));
 inputs.baseColor = mix_40.xyz;
float cla_116 = clamp(Metallic,0.0,1.0);
 inputs.metallic = cla_116;
vec2 swi_88 = switchFun(uv0,uv1,UV0_UV1);
vec2 vec_545 = vec2(1.0,1.0);
vec2 mul_549 = vec_545*vec2(Flake_Density);
vec2 til_497 = tilingOffset(swi_88,mul_549,vec2(0.0,0.0));
vec4 sam_494 = texture2D(Flake_Map,til_497);

            #ifdef Gamma_Flake_Map
            sam_494 = gammaToLinear(sam_494);
            #endif
            
float mul_491 = Flake_Reflection*sam_494.x;
float fre_506 = bpFresnel(normalWS,viewDirection,Flake_Falloff_Factor);
float one_515 = oneMinus(fre_506);
float mul_528 = mul_491*one_515;
float fre_144 = bpFresnel(normalWS,viewDirection,Specular_Falloff_Factor);
float mix_151 = mix(Facing_Specular,Perpendicular_Specular,fre_144);
float add_519 = mul_528+mix_151;
 inputs.specular = add_519;
 inputs.specularColor = Specular_Color.xyz;
float cla_162 = clamp(Smoothness,0.0,1.0);
float add_524 = cla_162+mul_528;
 inputs.smoothness = add_524;
float flo_275 = 1.0;
vec4 sam_56 = texture2D(Occlusion_Map,swi_88);

            #ifdef Gamma_Occlusion_Map
            sam_56 = gammaToLinear(sam_56);
            #endif
            
float cla_104 = clamp(Occlusion,0.0,1.0);
float mix_262 = mix(flo_275,sam_56.x,cla_104);
 inputs.occlusion = mix_262;
vec3 ref_580 = reflect(viewDirection,normalWS);
vec3 vec_593 = vec3(1.0,-1.0,1.0);
vec3 mul_588 = ref_580*vec_593;
vec4 sam_570 = textureCube(TextureCube,mul_588);
vec3 con_601 = ContrastFloat(sam_570.xyz,Contrast);
vec3 mul_612 = con_601*vec3(Intensity);
 inputs.emissionColor = mul_612;
 inputs.alpha = 1.0;
float fre_403 = bpFresnel(normalWS,viewDirection,Reflection_Falloff_Factor);
float mix_417 = mix(Facing_Reflection,Perpendicular_Reflection,fre_403);
 inputs.clearCoat = mix_417;
float cla_129 = clamp(ClearcoatRoughness,0.0,1.0);
 inputs.clearCoatRoughness = cla_129;

        Surface surface;
            initSurface(surface, inputs);
            PixelInfo info;
getPixelInfo(info, pixel, surface);
            vec4 surfaceColor = SurfaceShading(surface, info);
finalColor = surfaceColor;

        	gl_FragColor = finalColor;
        }
#endGLSL




GLSL End
