Shader3D Start
{"type":"Shader3D","name":"neishi","enableInstancing":true,"supportReflectionProbe":false,"uniformMap":{"AO":{"type":"Texture2D","default":"35ef2172-9291-4400-81b9-2130a20d89d2","alias":"AO","index":3},"AO_UV0UV1":{"type":"Bool","default":"false","alias":"AO_UV0UV1","index":5},"AO_Intensity":{"type":"Float","default":1,"alias":"AO_Intensity","index":4},"TintColor":{"type":"Color","default":[1,1,1,1],"alias":"TintColor","index":1},"Texture":{"type":"Texture2D","default":"33432b9b-33fa-4d28-9e0e-074ae48b917a","alias":"Texture","index":0},"toplight":{"type":"Float","alias":"toplight","index":2}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}]}
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
vec2 swi_167 = switchFun(uv0,uv1,AO_UV0UV1);
vec4 sam_153 = texture2D(AO,swi_167);

            #ifdef Gamma_AO
            sam_153 = gammaToLinear(sam_153);
            #endif
            
vec4 vec_254 = vec4(1.0,1.0,1.0,1.0);
float one_268 = oneMinus(AO_Intensity);
float cla_185 = clamp(one_268,0.0,1.0);
vec4 mix_245 = mix(sam_153,vec_254,vec4(cla_185));
vec4 sam_8 = texture2D(Texture,vec2(0.0,0.0)+v_Texcoord0);

            #ifdef Gamma_Texture
            sam_8 = gammaToLinear(sam_8);
            #endif
            
vec4 mul_122 = TintColor*sam_8;
vec4 mul_178 = mix_245*mul_122;
float dot_20 = dot(normalWS,viewDirection);
vec4 mul_53 = mul_178*vec4(dot_20);
vec3 vec_65 = vec3(0.0,1.0,0.0);
float dot_61 = dot(normalWS,vec_65);
float mul_70 = dot_61*0.5;
float add_71 = mul_70+0.5;
vec4 vec_97 = vec4(1.0,1.0,1.0,1.0);
float one_114 = oneMinus(toplight);
float cla_108 = clamp(one_114,0.0,1.0);
vec4 mix_94 = mix(vec4(add_71),vec_97,vec4(cla_108));
vec4 mul_74 = mul_53*mix_94;
 surface.color = mul_74.xyz;
 surface.alpha = 1.0;

        
                PixelInfo info;
                getPixelInfo(info, pixel, surface);
                vec4 surfaceColor = SurfaceShading(surface, info);
finalColor = surfaceColor;

        	gl_FragColor = finalColor;
        }
#endGLSL


GLSL End
