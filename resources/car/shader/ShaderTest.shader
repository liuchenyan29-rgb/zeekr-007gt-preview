Shader3D Start
{
    type:Shader3D
    name:ShaderTest
    enableInstancing:true,
    supportReflectionProbe:true,
    uniformMap:{
        u_AlphaTestValue: { type: Float, default: 0.5, range: [0.0, 1.0] },

        u_TilingOffset: { type: Vector4, default: [1, 1, 0, 0] },

        u_AlbedoColor: { type: Color, default: [1, 1, 1, 1] },
        u_AlbedoTexture: { type: Texture2D, options: { define: "ALBEDOTEXTURE" } },

        u_NormalTexture: { type: Texture2D, options: { define: "NORMALTEXTURE" } },
        u_NormalScale: { type: Float, default: 1.0, range: [0.0, 2.0] },

        u_Metallic: { type: Float, default: 0.0, range: [0.0, 1.0] },
        u_Smoothness: { type: Float, default: 0.0, range: [0.0, 1.0] },
        u_MetallicGlossTexture: { type: Texture2D, options: { define: "METALLICGLOSSTEXTURE" } },

        u_OcclusionTexture: { type: Texture2D, options: { define: "OCCLUSIONTEXTURE" } },
        u_OcclusionStrength: { type: Float, default: 1.0 },

        u_EmissionColor: { type: Color, default: [0, 0, 0, 0] },
        u_EmissionIntensity: { type: Float, default: 1.0 },
        u_EmissionTexture: { type: Texture2D, options: { define: "EMISSIONTEXTURE" } },

        u_ClearCoatFactor: { type: Float, default: 0.0, range: [0.0, 1.0] },
        u_ClearCoatRoughness: { type: Float, default: 0.0, range: [0.0, 1.0]}
    },
    defines: {
        UV: { type: bool, default: true},
        UV1: { type: bool, default: true},
        LIGHTMAP : { type: bool, default: true},
        AOUV2: { type: bool, default: false, private:false },
        EMISSION: { type: bool, default: false },
        ENABLEVERTEXCOLOR: { type: bool, default: false },
        CLEARCOAT: { type: bool, default: false },
    }
    shaderPass:[
        {
            pipeline:Forward,
            VS:LitVS,
            FS:LitFS
        }
    ]
}
Shader3D End

GLSL Start
#defineGLSL LitVS
    #define SHADER_NAME ShaderTest

    #include "Math.glsl";

    #include "Scene.glsl";
    #include "SceneFogInput.glsl"

    #include "Camera.glsl";
    #include "Sprite3DVertex.glsl";

    #include "VertexCommon.glsl";

    #include "PBRVertex.glsl";

    void main()
    {
        Vertex vertex;
        getVertexParams(vertex);

        PixelParams pixel;
        initPixelParams(pixel, vertex);

        gl_Position = getPositionCS(pixel.positionWS);

        gl_Position = remapPositionZ(gl_Position);

    #ifdef FOG
        FogHandle(gl_Position.z);
    #endif // FOG 
    }
#endGLSL

#defineGLSL LitFS
    #define SHADER_NAME ShaderTest

    #include "Color.glsl";

    #include "Scene.glsl";
    #include "SceneFog.glsl";

    #include "Camera.glsl";
    #include "Sprite3DFrag.glsl";

    #include "PBRMetallicFrag.glsl";

    void initSurfaceInputs(inout SurfaceInputs inputs, inout PixelParams pixel)
    {
        inputs.alphaTest = u_AlphaTestValue;

    #ifdef UV
        vec2 uv = transformUV(pixel.uv0, u_TilingOffset);
    #else // UV
        vec2 uv = vec2(0.0);
    #endif // UV
    
    #ifdef UV1
        #ifdef LIGHTMAP
            vec2 uv2 = pixel.uv1;
        #else // LIGHTMAP
            vec2 uv2 = vec2(0.0);
        #endif
    #else // UV1
        vec2 uv2 = vec2(0.0);
    #endif // UV1

        inputs.diffuseColor = u_AlbedoColor.rgb;
        inputs.alpha = u_AlbedoColor.a;

    #ifdef COLOR
        #ifdef ENABLEVERTEXCOLOR
        inputs.diffuseColor *= pixel.vertexColor.xyz;
        inputs.alpha *= pixel.vertexColor.a;
        #endif // ENABLEVERTEXCOLOR
    #endif // COLOR

    #ifdef ALBEDOTEXTURE
        vec4 albedoSampler = texture2D(u_AlbedoTexture, uv);
        #ifdef Gamma_u_AlbedoTexture
        albedoSampler = gammaToLinear(albedoSampler);
        #endif // Gamma_u_AlbedoTexture
        inputs.diffuseColor *= albedoSampler.rgb;
        inputs.alpha *= albedoSampler.a;
    #endif // ALBEDOTEXTURE

        inputs.normalTS = vec3(0.0, 0.0, 1.0);
    #ifdef NORMALTEXTURE
         vec3 normalSampler = texture2D(u_NormalTexture, uv).rgb;
        normalSampler = normalize(normalSampler * 2.0 - 1.0);
        normalSampler.y *= -1.0;
        inputs.normalTS = normalScale(normalSampler, u_NormalScale);
    #endif

        inputs.metallic = u_Metallic;
        inputs.smoothness = u_Smoothness;

    #ifdef METALLICGLOSSTEXTURE
        vec4 metallicSampler = texture2D(u_MetallicGlossTexture, uv);
        inputs.metallic = metallicSampler.x;
        inputs.smoothness = (metallicSampler.a * u_Smoothness);
    #endif // METALLICGLOSSTEXTURE

        inputs.occlusion = 1.0;
    #ifdef OCCLUSIONTEXTURE
        #ifdef AOUV2
            vec4 occlusionSampler = texture2D(u_OcclusionTexture, uv2);
        #else 
            vec4 occlusionSampler = texture2D(u_OcclusionTexture, uv);
        #endif
     //   vec4 occlusionSampler = texture2D(u_OcclusionTexture, uv);
        float occlusion = occlusionSampler.g;
        inputs.occlusion = (1.0 - u_OcclusionStrength) + occlusion * u_OcclusionStrength;
    #endif // OCCLUSIONTEXTURE

        inputs.emissionColor = vec3(0.0);
    #ifdef EMISSION
        inputs.emissionColor = u_EmissionColor.rgb * u_EmissionIntensity;
        #ifdef EMISSIONTEXTURE
        vec4 emissionSampler = texture2D(u_EmissionTexture, uv);
        #ifdef Gamma_u_EmissionTexture
        emissionSampler = gammaToLinear(emissionSampler);
        #endif // Gamma_u_EmissionTexture
        inputs.emissionColor *= emissionSampler.rgb;
        #endif // EMISSIONTEXTURE
    #endif // EMISSION

    #ifdef CLEARCOAT
        inputs.clearCoat = u_ClearCoatFactor;
        inputs.clearCoatRoughness = u_ClearCoatRoughness;
    #endif // CLEARCOAT
    }

    void main()
    {
        PixelParams pixel;
        getPixelParams(pixel);

        SurfaceInputs inputs;
        initSurfaceInputs(inputs, pixel);

        vec4 surfaceColor = PBR_Metallic_Flow(inputs, pixel);
        
    #ifdef FOG
        surfaceColor.rgb = sceneLitFog(surfaceColor.rgb);
    #endif // FOG

        gl_FragColor = surfaceColor;

        gl_FragColor = outputTransform(gl_FragColor);
    }
#endGLSL

GLSL End
