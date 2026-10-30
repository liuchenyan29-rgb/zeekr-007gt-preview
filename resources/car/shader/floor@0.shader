Shader3D Start
{"type":"Shader3D","name":"floor","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"normal":{"type":"Texture2D","default":"white","alias":"normal","index":12},"normal_tilling":{"type":"Float","default":1,"alias":"normal_tilling","index":14},"normal_strength":{"type":"Float","default":1,"alias":"normal_strength","index":13},"color_texture":{"type":"Texture2D","default":"white","alias":"color_texture","index":2},"color_UVTilling":{"type":"Float","alias":"color_UVTilling","index":1},"Color":{"type":"Color","default":[1,1,1,1],"alias":"Color","index":0},"TextureCube":{"type":"TextureCube","default":"TextureCube","alias":"TextureCube","index":7},"move":{"type":"Vector3","default":[0,0,0],"alias":"move","index":11},"rotation":{"type":"Float","alias":"rotation","index":8},"lod":{"type":"Float","alias":"lod","index":9},"reflection_strength":{"type":"Float","default":1,"alias":"reflection_strength","index":10},"Texture2D":{"type":"Texture2D","default":"white","alias":"Texture2D","index":3},"UVTilling_near":{"type":"Float","default":1,"alias":"UVTilling_near","index":4},"UVTilling_far":{"type":"Float","alias":"UVTilling_far","index":5},"mask":{"type":"Texture2D","default":"white","alias":"mask","index":15},"rough_strength":{"type":"Float","alias":"rough_strength","index":6}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}],"defines":{"EMISSION":{"default":true,"alias":null}}}
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
vec4 c_204(samplerCube sasa,vec3 coord,float lod2){
return textureCubeLodEXT(sasa, coord, lod2);
}
vec3 c_197(vec3 In,float Angle){
// 将角度转换为弧度
float rad = radians(Angle);
float cosA = cos(rad);
float sinA = sin(rad);

// 应用绕Y轴旋转矩阵
vec3 result;
result.x = In.x * cosA + In.z * sinA;
result.y = In.y;
result.z = -In.x * sinA + In.z * cosA;

return result;
}
float oneMinus(float a){
            return 1.0 - a;
        }
void main()
        {
            PixelParams pixel;
            getPixelParams(pixel);
        vec2 uv0 = vec2(0.0, 0.0);
#ifdef UV
uv0 = pixel.uv0;
#endif // UV
vec3 normalWS = v_NormalWS;
vec3 viewDirection = getViewDirection(pixel.positionWS);
	vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        SurfaceInputs inputs;
vec2 mul_130 = uv0*vec2(normal_tilling);
vec3 sam_164 = texture2D(normal,mul_130).rgb;
sam_164 = (sam_164 - 0.5) * 2.0;
sam_164  = normalize(sam_164);
vec3 vec_303 = vec3(0.0,0.0,1.0);
vec3 mix_300 = mix(sam_164,vec_303,vec3(normal_strength));
 inputs.normalTS = mix_300;
vec2 mul_96 = uv0*vec2(color_UVTilling);
vec4 sam_93 = texture2D(color_texture,mul_96);

            #ifdef Gamma_color_texture
            sam_93 = gammaToLinear(sam_93);
            #endif
            
vec4 mul_106 = sam_93*Color;
vec3 ref_202 = reflect(viewDirection,normalWS);
vec3 vec_198 = vec3(-1.0,-1.0,1.0);
vec3 mul_199 = ref_202*vec_198;
vec3 add_257 = mul_199+move;
vec3 cus_197 = c_197(add_257,rotation);
vec4 cus_204 = c_204(TextureCube,cus_197,lod);
vec4 mul_242 = cus_204*vec4(reflection_strength);
vec4 mul_249 = mul_106*mul_242;
 inputs.baseColor = mul_249.xyz;
float flo_33 = 0.0;
 inputs.metallic = flo_33;
float flo_49 = 1.0;
 inputs.specular = flo_49;
 inputs.specularColor = vec3(1.0,1.0,1.0);
vec2 mul_19 = uv0*vec2(UVTilling_near);
vec4 sam_16 = texture2D(Texture2D,mul_19);

            #ifdef Gamma_Texture2D
            sam_16 = gammaToLinear(sam_16);
            #endif
            
vec2 mul_379 = uv0*vec2(UVTilling_far);
vec4 sam_381 = texture2D(Texture2D,mul_379);

            #ifdef Gamma_Texture2D
            sam_381 = gammaToLinear(sam_381);
            #endif
            
vec4 sam_364 = texture2D(mask,vec2(0.0,0.0)+v_Texcoord0);

            #ifdef Gamma_mask
            sam_364 = gammaToLinear(sam_364);
            #endif
            
float mix_356 = mix(sam_16.x,sam_381.x,sam_364.x);
float one_9 = oneMinus(mix_356);
float mul_60 = one_9*rough_strength;
 inputs.smoothness = mul_60;
float flo_36 = 1.0;
 inputs.occlusion = flo_36;
 inputs.emissionColor = mul_242.xyz;
 inputs.alpha = 1.0;

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
