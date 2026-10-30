Shader3D Start
{
    type:Shader3D,
    name:InsPBR,
    enableInstancing:true,
    supportReflectionProbe:true,
    uniformMap:{
        u_AlphaTestValue: { type: Float, default: 0.5 },
        u_TilingOffset: { type: Vector4, default: [1, 1, 0, 0], block: unlit },

        u_AlbedoColor: { type: Color, default: [1, 1, 1, 1], block: unlit },
        u_AlbedoTexture: { type: Texture2D, options: { define: "ALBEDOTEXTURE" } },

        u_AOTexture: { type: Texture2D, options: { define: "AOTEXTURE" } },
        u_AOStrength: { type: Float, default: 1.0 }
    },
    defines: {
        ENABLEVERTEXCOLOR: { type: bool, default: false },
        COLORUV2: { type: bool, default: false },
        UVAO2: { type: bool, default: false },
        AOTEXTURE: { type: bool, default: false },
        LIGHTMAP: { type: bool, default: false }
    }
    shaderPass:[
        {
            pipeline:Forward,
            VS:unlitVS,
            FS:unlitPS
        }
    ]
}
Shader3D End

GLSL Start
#defineGLSL unlitVS

    #define SHADER_NAME InsPBR

    #include "Math.glsl";

    #include "Scene.glsl";
    #include "SceneFogInput.glsl";

    #include "Camera.glsl";
    #include "Sprite3DVertex.glsl";

    #include "VertexCommon.glsl";

    #ifdef UV
    varying vec2 v_Texcoord0;
    #endif // UV

    #ifdef COLOR
    varying vec4 v_VertexColor;
    #endif // COLOR

    varying vec3 v_NormalWS;
    varying vec3 v_PositionWS;
    #ifdef UV1
        varying vec2 v_Texcoord11;
    #endif
    void main()
    {
        Vertex vertex;
        getVertexParams(vertex);
        vec3 positionOS = vertex.positionOS;
        vec3 normalOS = vertex.normalOS;
        mat4 worldMat = getWorldMatrix();
        vec4 posWS = worldMat * vec4(positionOS, 1.0);
        v_PositionWS = posWS.xyz / posWS.w;
        mat3 worldMat3 = mat3(worldMat);
        v_NormalWS = normalize(worldMat3 * normalOS);
        #ifdef UV1
            v_Texcoord11 = vertex.texCoord1;
        #endif

    #ifdef UV
        v_Texcoord0 = transformUV(vertex.texCoord0, u_TilingOffset);
    #endif // UV

    #ifdef COLOR
        v_VertexColor = vertex.vertexColor;
    #endif // COLOR

        vec4 pos = (worldMat * vec4(vertex.positionOS, 1.0));
        vec3 positionWS = pos.xyz / pos.w;

        gl_Position = getPositionCS(positionWS);    

        gl_Position = remapPositionZ(gl_Position);

    #ifdef FOG
        FogHandle(gl_Position.z);
    #endif
    }
#endGLSL

#defineGLSL unlitPS

    #define SHADER_NAME InsPBR

    #include "Color.glsl";

    #include "Scene.glsl";
    #include "SceneFog.glsl";

    #include "Camera.glsl";
    #include "Sprite3DFrag.glsl";

    varying vec4 v_Color;
    varying vec2 v_Texcoord0;
    varying vec3 v_NormalWS;
    varying vec3 v_PositionWS;
#ifdef UV1
    varying vec2 v_Texcoord11;
#endif
    void main()
    {
        vec2 uv = v_Texcoord0;

        vec3 color = u_AlbedoColor.rgb;
        float alpha = u_AlbedoColor.a; 

    #ifdef ALBEDOTEXTURE 
        #ifdef COLORUV2
            vec4 albedoSampler = texture2D(u_AlbedoTexture, v_Texcoord11);
        #else
            vec4 albedoSampler = texture2D(u_AlbedoTexture, uv);
        #endif 
        #ifdef Gamma_u_AlbedoTexture
        albedoSampler = gammaToLinear(albedoSampler);
        #endif // Gamma_u_AlbedoTexture
        color *= albedoSampler.rgb;
        alpha *= albedoSampler.a;
        float invertN = (float(gl_FrontFacing) * 2.0 - 1.0);
        vec3 viewDirection = normalize(u_CameraPos - v_PositionWS);
        float ndotv=dot(normalize(v_NormalWS * invertN), viewDirection);
        color *= ndotv;
    #endif // ALBEDOTEXTURE

    #ifdef AOTEXTURE
        #ifdef UVAO2
            #ifdef UV1
                vec4 occlusionSampler = texture2D(u_AOTexture, v_Texcoord11);
            #else 
                vec4 occlusionSampler = texture2D(u_AOTexture, uv);
            #endif 
        #else
            vec4 occlusionSampler = texture2D(u_AOTexture, uv);
        #endif
        float ao = occlusionSampler.g; 
        color *= mix(1.0, ao, u_AOStrength);     
    #else
        
    #endif

    #ifdef COLOR
        #ifdef ENABLEVERTEXCOLOR
        vec4 vertexColor = v_Color;
        color *= vertexColor.rgb;
        alpha *= vertexColor.a;
        #endif // ENABLEVERTEXCOLOR
    #endif // COLOR

    #ifdef ALPHATEST
        if (alpha < u_AlphaTestValue)
            discard;
    #endif // ALPHATEST

    #ifdef FOG
        color = scenUnlitFog(color);
    #endif // FOG

        gl_FragColor = vec4(color, alpha);

        gl_FragColor = outputTransform(gl_FragColor);
    }
#endGLSL
GLSL End


