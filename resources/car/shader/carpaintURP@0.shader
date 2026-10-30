Shader3D Start
{"type":"Shader3D","name":"carpaintURP","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"Pigment_Map":{"type":"Texture2D","default":"white","alias":"Pigment_Map","index":2},"Pigment_UV0_UV1":{"type":"Bool","default":"true","alias":"Pigment_UV0_UV1","index":3},"Occlusion_Map":{"type":"Texture2D","default":"white","alias":"Occlusion_Map","index":6},"AO_UV0_UV1":{"type":"Bool","default":"true","alias":"AO_UV0_UV1","index":8},"Occlusion":{"type":"Float","alias":"Occlusion","index":7},"Light_Intensity":{"type":"Float","alias":"Light_Intensity","index":23},"Light_Range":{"type":"Float","alias":"Light_Range","index":22},"Light":{"type":"Bool","default":"false","alias":"Light","index":24},"Light_Color":{"type":"Color","default":[1,1,1,1],"alias":"Light_Color","index":25},"Pigment_Color":{"type":"Color","default":[0.8927648529525876,0.1695561154832434,0.2543071717353821,1],"alias":"Pigment_Color","index":1},"Edge_Color":{"type":"Color","default":[0.18770277171343838,0.15575987020010815,0.8372093023255813,1],"alias":"Edge_Color","index":4},"Edge_Falloff_Factor":{"type":"Float","default":0.5,"alias":"Edge_Falloff_Factor","index":5},"Texture_Color_switch":{"type":"Bool","default":"false","alias":"Texture_Color_switch","index":0},"Specular_Color":{"type":"Color","default":[1,1,1,1],"alias":"Specular_Color","index":10},"TextureCube":{"type":"TextureCube","alias":"TextureCube","index":9},"Rotation":{"type":"Float","alias":"Rotation","index":21},"Smoothness":{"type":"Float","alias":"Smoothness","index":14},"Reflect_Smoothness":{"type":"Float","default":10,"alias":"Reflect_Smoothness","index":27},"Reflect_Light":{"type":"Bool","default":"false","alias":"Reflect_Light","index":26},"Facing_Specular":{"type":"Float","alias":"Facing_Specular","index":11},"Perpendicular_Specular":{"type":"Float","alias":"Perpendicular_Specular","index":12},"Specular_Falloff_Factor":{"type":"Float","alias":"Specular_Falloff_Factor","index":13},"ClearCoat_Color":{"type":"Color","default":[1,1,1,1],"alias":"ClearCoat_Color","index":15},"Reflection_Contrast":{"type":"Float","alias":"Reflection_Contrast","index":16},"Facing_Reflection":{"type":"Float","default":1,"alias":"Facing_Reflection","index":17},"Perpendicular_Reflection":{"type":"Float","alias":"Perpendicular_Reflection","index":18},"Reflection_Falloff_Factor":{"type":"Float","default":0.5,"alias":"Reflection_Falloff_Factor","index":19},"Emissive":{"type":"Color","default":[0,0,0,1],"alias":"Emissive","index":20},"Opacity":{"type":"Float","default":1,"alias":"Opacity","index":28}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}],"defines":{}}
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
        #include "shaderBlueprint/lightmode/BlueprintUnlit.glsl";
vec4 switchFun(vec4 par1,vec4 par2,bool par3){
            if(par3){
                return par1;
            }else{
                return par2;
            }
        }
vec2 switchFun(vec2 par1,vec2 par2,bool par3){
            if(par3){
                return par1;
            }else{
                return par2;
            }
        }
float switchFun(float par1,float par2,bool par3){
            if(par3){
                return par1;
            }else{
                return par2;
            }
        }
float bpFresnel(vec3 normal,vec3 viewDir,float power){
    float num = dot(normal,viewDir);
    num = pow(1.0-num,power);
    return num;
}
vec4 c_988(samplerCube sasa,vec3 coord,float lod2){
return textureCubeLodEXT(sasa, coord, lod2);
}
vec3 c_1467(vec3 In,float Angle){
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
vec3 normalWS = v_NormalWS;
vec3 viewDirection = getViewDirection(pixel.positionWS);
	vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        Surface surface;
 surface.normalTS = vec3(0.0,0.0,1.0);
vec2 swi_1764 = switchFun(uv0,uv1,Pigment_UV0_UV1);
vec4 sam_1762 = texture2D(Pigment_Map,swi_1764);

            #ifdef Gamma_Pigment_Map
            sam_1762 = gammaToLinear(sam_1762);
            #endif
            
float flo_275 = 1.0;
vec2 swi_88 = switchFun(uv0,uv1,AO_UV0_UV1);
vec4 sam_56 = texture2D(Occlusion_Map,swi_88);

            #ifdef Gamma_Occlusion_Map
            sam_56 = gammaToLinear(sam_56);
            #endif
            
float cla_104 = clamp(Occlusion,0.0,1.0);
float mix_262 = mix(flo_275,sam_56.x,cla_104);
float cla_1184 = clamp(mix_262,0.0,1.0);
vec4 mul_1788 = sam_1762*vec4(cla_1184);
vec4 cla_1816 = clamp(mul_1788,vec4(0.0),vec4(1.0));
float cla_1698 = clamp(Light_Intensity,0.0,1.0);
vec3 vec_1660 = vec3(0.0,1.0,0.0);
float dot_1658 = dot(vec_1660,normalWS);
float cla_1665 = clamp(dot_1658,0.0,1.0);
float pow_1676 = pow(cla_1665,Light_Range);
float mul_1696 = cla_1698*pow_1676;
float flo_1704 = 0.0;
float swi_1686 = switchFun(mul_1696,flo_1704,Light);
vec4 mul_1723 = vec4(swi_1686)*Light_Color;
vec4 add_1793 = cla_1816+mul_1723;
vec4 cla_1803 = clamp(add_1793,vec4(0.0),vec4(1.0));
float fre_26 = bpFresnel(normalWS,viewDirection,Edge_Falloff_Factor);
float cla_100 = clamp(fre_26,0.0,1.0);
vec4 mix_40 = mix(Pigment_Color,Edge_Color,vec4(cla_100));
float cla_1267 = clamp(mix_40.x,0.0,1.0);
float cla_1266 = clamp(mix_40.y,0.0,1.0);
vec2 app_1265 = vec2(cla_1267,cla_1266);
float cla_1268 = clamp(mix_40.z,0.0,1.0);
float cla_1269 = clamp(mix_40.w,0.0,1.0);
vec2 app_1270 = vec2(cla_1268,cla_1269);
vec4 app_1264 = vec4(app_1265,app_1270);
vec4 mul_1117 = app_1264*vec4(cla_1184);
vec4 add_1712 = mul_1723+mul_1117;
vec4 swi_1786 = switchFun(cla_1803,add_1712,Texture_Color_switch);
vec3 ref_580 = reflect(viewDirection,normalWS);
vec3 vec_593 = vec3(-1.0,-1.0,1.0);
vec3 mul_588 = ref_580*vec_593;
vec3 cus_1467 = c_1467(mul_588,Rotation);
float cla_1980 = clamp(Smoothness,0.01,10.0);
float min_1246 = 10.0-cla_1980;
vec4 cus_988 = c_988(TextureCube,cus_1467,min_1246);
vec4 mul_1086 = Specular_Color*cus_988;
vec3 vec_1989 = vec3(0.0,1.0,0.0);
vec3 mix_2168 = mix(vec_1989,viewDirection,vec3(0.5));
vec3 add_1994 = mix_2168+viewDirection;
vec3 mul_1998 = add_1994*vec3(0.5);
vec3 nor_2002 = normalize(mul_1998);
float dot_1936 = dot(nor_2002,normalWS);
float max_1942 = max(dot_1936,0.0);
float mul_1973 = cla_1980*Reflect_Smoothness;
float pow_1965 = pow(max_1942,mul_1973);
float cla_2043 = clamp(Smoothness,0.01,1.0);
float mul_1952 = pow_1965*cla_2043;
float cla_2017 = clamp(mul_1952,0.0,1.0);
vec4 mul_2051 = Specular_Color*vec4(cla_2017);
vec4 mul_2056 = mul_2051*vec4(5.0);
vec4 add_2031 = mul_1086+mul_2056;
vec4 swi_2213 = switchFun(add_2031,mul_1086,Reflect_Light);
float add_1359 = Specular_Color.x+Specular_Color.y;
float add_1363 = add_1359+Specular_Color.z;
float div_1366 = add_1363/3.0;
float fre_144 = bpFresnel(normalWS,viewDirection,Specular_Falloff_Factor);
float mix_151 = mix(Facing_Specular,Perpendicular_Specular,fre_144);
float cla_1295 = clamp(mix_151,0.0,1.0);
float mul_1176 = div_1366*cla_1295;
vec4 mix_956 = mix(swi_1786,swi_2213,vec4(mul_1176));
vec4 sam_570 = textureCube(TextureCube,cus_1467);
vec4 mul_693 = sam_570*ClearCoat_Color;
float cla_658 = clamp(Reflection_Contrast,0.0,2.0);
vec3 con_601 = ContrastFloat(mul_693.xyz,cla_658);
float fre_671 = bpFresnel(normalWS,viewDirection,Reflection_Falloff_Factor);
float mix_675 = mix(Facing_Reflection,Perpendicular_Reflection,fre_671);
float cla_1906 = clamp(mix_675,0.0,1.0);
vec3 mul_612 = con_601*vec3(cla_1906);
float cla_1283 = clamp(mul_612.x,0.0,1.0);
float cla_1282 = clamp(mul_612.y,0.0,1.0);
vec2 app_1286 = vec2(cla_1283,cla_1282);
float cla_1284 = clamp(mul_612.z,0.0,1.0);
vec3 app_1288 = vec3(app_1286,cla_1284);
vec4 add_645 = mix_956+vec4(app_1288,0.0);
vec4 add_701 = add_645+Emissive;
float cla_1188 = clamp(add_701.x,0.0,1.0);
float cla_1195 = clamp(add_701.y,0.0,1.0);
vec2 app_1201 = vec2(cla_1188,cla_1195);
float cla_1196 = clamp(add_701.z,0.0,1.0);
vec3 app_1205 = vec3(app_1201,cla_1196);
 surface.color = app_1205;
 surface.alpha = Opacity;

        
                PixelInfo info;
                getPixelInfo(info, pixel, surface);
                vec4 surfaceColor = SurfaceShading(surface, info);
finalColor = surfaceColor;

        	gl_FragColor = finalColor;
        }
#endGLSL


GLSL End
