Shader3D Start
{"type":"Shader3D","name":"mount","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"Texture2D":{"type":"Texture2D","default":"white","alias":"Texture2D","index":0},"tilling2d":{"type":"Vector2","default":[0,0],"alias":"tilling2d","index":2}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}]}
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
vec2 mul_15 = uv0*tilling2d;
vec4 sam_12 = texture2D(Texture2D,mul_15);

            #ifdef Gamma_Texture2D
            sam_12 = gammaToLinear(sam_12);
            #endif
            
 surface.color = sam_12.xyz;
 surface.alpha = sam_12.w;

        
                PixelInfo info;
                getPixelInfo(info, pixel, surface);
                vec4 surfaceColor = SurfaceShading(surface, info);
finalColor = surfaceColor;

        	gl_FragColor = finalColor;
        }
#endGLSL


GLSL End
