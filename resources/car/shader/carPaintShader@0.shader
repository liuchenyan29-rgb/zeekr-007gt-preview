Shader3D Start
{"type":"Shader3D","name":"carPaintShader","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"PigmentColor":{"type":"Color","default":[1,1,1,1],"alias":"PigmentColor","index":1},"EdgeColor":{"type":"Color","default":[0,0,0,1],"alias":"EdgeColor","index":2},"EdgeFalloffFactor":{"type":"Float","default":0.3,"alias":"EdgeFalloffFactor","index":0},"FlakeReflection":{"type":"Float","alias":"FlakeReflection","index":11},"FlakeMap":{"type":"Texture2D","alias":"FlakeMap","index":10},"FlakeDensity":{"type":"Float","default":1,"alias":"FlakeDensity","index":8},"FlakeFalloffFactor":{"type":"Float","default":0.1,"alias":"FlakeFalloffFactor","index":9},"SpecularColor":{"type":"Color","default":[0,0,0,1],"alias":"SpecularColor","index":6},"FacingSpecular":{"type":"Float","default":0.1,"alias":"FacingSpecular","index":4},"PerpendicularSpecular":{"type":"Float","default":0.3,"alias":"PerpendicularSpecular","index":5},"Smoothness":{"type":"Float","default":0.1,"alias":"Smoothness","index":7},"OcclusionMap":{"type":"Texture2D","alias":"OcclusionMap","index":12},"Occlusion":{"type":"Float","alias":"Occlusion","index":13}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}]}
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
float oneMinus(float a){
            return 1.0 - a;
        }
vec4 c_525(vec4 a,float b){
return vec4(a.x * b, a.y * b, a.z * b, a.w * b);
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
float fre_804 = bpFresnel(normalWS,viewDirection,EdgeFalloffFactor);
vec4 mix_24 = mix(PigmentColor,EdgeColor,vec4(fre_804));
 inputs.baseColor = mix_24.xyz;
 inputs.metallic = 0.0;
vec2 til_64 = tilingOffset(uv0,vec2(FlakeDensity),vec2(0.0,0.0));
vec4 sam_80 = texture2D(FlakeMap,til_64);

            #ifdef Gamma_FlakeMap
            sam_80 = gammaToLinear(sam_80);
            #endif
            
float mul_83 = FlakeReflection*sam_80.x;
float fre_810 = bpFresnel(normalWS,viewDirection,FlakeFalloffFactor);
float one_73 = oneMinus(fre_810);
float mul_90 = mul_83*one_73;
vec4 mix_518 = mix(FacingSpecular,PerpendicularSpecular,0.0);
vec4 cus_525 = c_525(SpecularColor,mix_518.y);
vec4 add_885 = vec4(mul_90)+cus_525;
 inputs.specular = add_885.x;
 inputs.specularColor = vec3(1.0,1.0,1.0);
float add_56 = Smoothness+mul_90;
 inputs.smoothness = add_56;
vec4 sam_99 = texture2D(OcclusionMap,uv1);

            #ifdef Gamma_OcclusionMap
            sam_99 = gammaToLinear(sam_99);
            #endif
            
vec4 mix_101 = mix(vec4(1.0),sam_99,vec4(Occlusion));
 inputs.occlusion = mix_101.x;
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
