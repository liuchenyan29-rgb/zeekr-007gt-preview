Shader3D Start
{"type":"Shader3D","name":"zheyangpeng","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"zypalpha":{"type":"Float","alias":"zypalpha","index":0}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}]}
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
	vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        SurfaceInputs inputs;
 inputs.normalTS = vec3(0.0,0.0,1.0);
vec4 vec_10 = vec4(0.0,0.0,0.0,0.0);
 inputs.baseColor = vec_10.xyz;
 inputs.metallic = 0.0;
 inputs.specular = 0.5;
 inputs.specularColor = vec3(1.0,1.0,1.0);
 inputs.smoothness = 0.0;
 inputs.occlusion = 1.0;
float one_281 = oneMinus(zypalpha);
float ste_193 = step(one_281,uv0.y);
 inputs.alpha = ste_193;

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
