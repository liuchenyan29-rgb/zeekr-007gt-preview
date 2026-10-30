Shader3D Start
{"type":"Shader3D","name":"skydome","enableInstancing":true,"supportReflectionProbe":true,"uniformMap":{"TextureCube":{"type":"TextureCube","default":"TextureCube","alias":"TextureCube","index":0},"position":{"type":"Vector3","default":[0,0,0],"alias":"position","index":1},"rotation":{"type":"Float","alias":"rotation","index":2}},"attributeMap":null,"shaderPass":[{"pipeline":"Forward","VS":"VS0","FS":"FS0"}],"defines":{}}
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
vec3 c_206(vec3 In,float Angle){
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
void main()
        {
            PixelParams pixel;
            getPixelParams(pixel);
        vec3 positionWS = v_PositionWS;
	vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
        Surface surface;
 surface.normalTS = vec3(0.0,0.0,1.0);
vec3 add_183 = positionWS+position;
vec3 cus_206 = c_206(add_183,rotation);
vec4 sam_165 = textureCube(TextureCube,cus_206);
 surface.color = sam_165.xyz;
 surface.alpha = 1.0;

        
                PixelInfo info;
                getPixelInfo(info, pixel, surface);
                vec4 surfaceColor = SurfaceShading(surface, info);
finalColor = surfaceColor;

        	gl_FragColor = finalColor;
        }
#endGLSL


GLSL End
