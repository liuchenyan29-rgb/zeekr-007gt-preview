Shader3D Start
{"type":"Shader3D","name":"ShaderBlueprint","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}],"defines":{"LIGHTMAP":{"default":true,"alias":null},"UV1":{"default":true,"alias":null}}}
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
vec2 c_6(out vec2 u11){
Vertex vertex;
    getVertexParams(vertex);

    PixelParams pixel;
    initPixelParams(pixel, vertex);
u11 = pixel.uv1;
return u11;
}
void main()
        {
            PixelParams pixel;
            getPixelParams(pixel);
        vec2 out_6_u11 = vec2(0.0);
	vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        SurfaceInputs inputs;
 inputs.normalTS = vec3(0.0,0.0,1.0);
vec2 cus_6 = c_6(out_6_u11);
 inputs.baseColor = vec3(out_6_u11,0.0);
 inputs.metallic = 0.0;
 inputs.specular = 0.5;
 inputs.specularColor = vec3(1.0,1.0,1.0);
 inputs.smoothness = 0.0;
 inputs.occlusion = 1.0;
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
