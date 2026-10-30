Shader3D Start
{"type":"Shader3D","name":"cloud","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"Texture2D":{"type":"Texture2D","default":"white","alias":"Texture2D","index":0},"alpha":{"type":"Float","default":1,"alias":"alpha","index":1}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}]}
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
void main()
        {
            PixelParams pixel;
            getPixelParams(pixel);
        vec2 uv0 = vec2(0.0, 0.0);
#ifdef UV
uv0 = pixel.uv0;
#endif // UV
	vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        Surface surface;
 surface.normalTS = vec3(0.0,0.0,1.0);
vec4 sam_14 = texture2D(Texture2D,uv0);

            #ifdef Gamma_Texture2D
            sam_14 = gammaToLinear(sam_14);
            #endif
            
 surface.color = sam_14.xyz;
float mul_19 = sam_14.w*alpha;
 surface.alpha = mul_19;

        
                PixelInfo info;
                getPixelInfo(info, pixel, surface);
                vec4 surfaceColor = SurfaceShading(surface, info);
finalColor = surfaceColor;

        	gl_FragColor = finalColor;
        }
#endGLSL


GLSL End
