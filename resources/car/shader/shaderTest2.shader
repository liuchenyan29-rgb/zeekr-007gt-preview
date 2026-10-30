Shader3D Start
{
    type:Shader3D
    name:shaderTest2
    enableInstancing:true,
    supportReflectionProbe:true,
    uniformMap:{
        u_AlphaTestValue: { type: Float, default: 0.5, range: [0.0, 1.0] },
        u_TilingOffset: { type: Vector4, default: [1, 1, 0, 0] },

        u_PigmentColor: { type: Color, default: [1, 1, 1, 1] },
        u_PigmentMap: { type: Texture2D, options: { define: "PIGMENTMAP" } },
        u_PigmentOpen: { type: Float, default: 0.0 },
        u_FlakeMap: { type: Texture2D, options: { define: "FLAKEMAP" } },
        u_FlakeDensity: { type: Float, default: 1.0 },
        u_FlakeFactor: { type: Float, default: 0.1, range: [0.01, 1.0] },
        u_FlakeReflection: { type: Float, default: 0.0, range: [0.0, 10.0] },
        u_SpecularFactor: { type: Float, default: 0.3, range: [0.01, 10.0] },
        u_PerpendicularSpecular: { type: Float, default: 0.3, range: [0.0, 1.0] },
        u_FacingSpecular: { type: Float, default: 0.1, range: [0.0, 1.0] },
        u_SpecularColor: { type: Color, default: [0, 0, 0, 0] },
        u_Smoothness: { type: Float, default: 0.1, range: [0.0, 1.0] },
        u_ReflectionFactor: { type: Float, default: 1.0, range: [0.01, 10.0] },
        u_FacingReflection: { type: Float, default: 0.1, range: [0.0, 1.0] },
        u_PerpendicularReflection: { type: Float, default: 1.0, range: [0.0, 1.0] },
        u_ClearCoatColor: { type: Color, default: [0.5, 0.5, 0.5, 1.0] },
        u_ReflectionContrast: { type: Float, default: 1.0, range: [0.01, 2.0]}
        u_OcclusionMap: { type: Texture2D, options: { define: "OCCLUSIONMAP" } },
        u_Occlusion: { type: Float, default: 1.0, range: [0.0, 1.0] },
        u_OcclusionSet: { type: Float, default: 0.0 },
        u_EdgeColor: { type: Color, default: [0, 0, 0, 0] },
        u_EdgeFactor: { type: Float, default: 0.3, range: [0.01, 10.0] },
        u_Metallic: { type: Float, default: 1.0, range: [0.0, 1.0]}
        u_ReflectionStrength: { type: Float, default: 0.0, range: [0.0, 1.0]}
    },
    defines: {
        PIGMENTMAP: { type: bool, default: false },
        OCCLUSIONMAP: { type: bool, default: false },
        FLAKEMAP: { type: bool, default: false },
        EMISSION: { type: bool, default: true }
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
    #define SHADER_NAME shaderTest2

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
    #define SHADER_NAME shaderTest2

    #include "Color.glsl";

    #include "Scene.glsl";
    #include "SceneFog.glsl";

    #include "Camera.glsl";
    #include "Sprite3DFrag.glsl";

    #include "ShadingFrag.glsl";
    #include "PBRFrag.glsl";
    //#include "glTFMetallicRoughness.glsl";

    struct SurfaceInputs2 {
    vec3 diffuseColor;
    float alpha;
    float alphaTest;
    float metallic;
    float roughness;
    float occlusion;
    vec3 emissionColor;
    vec3 normalTS;
    float specular;

    // specular
    float specularFactor;
    vec3 specularColor;

    #ifdef CLEARCOAT
    float clearCoat;
    float clearCoatRoughness;
	#ifdef CLEARCOAT_NORMAL
    vec3 clearCoatNormalTS;
	#endif // CLEARCOAT_NORMAL
    #endif // CLEARCOAT

    #ifdef ANISOTROPIC
    float anisotropy;
    vec2 anisotropyDirection;
    #endif // ANISOTROPIC

    #ifdef IOR
    float ior;
    #endif // IOR

    #ifdef IRIDESCENCE
    float iridescence;
    float iridescenceIor;
    float iridescenceThickness;
    #endif // IRIDESCENCE

    #ifdef SHEEN
    vec3 sheenColor;
    float sheenRoughness;
    #endif // SHEEN

    #ifdef TRANSMISSION
    float transmission;
    #endif // TRANSMISSION

    #ifdef THICKNESS
    float thickness;
    vec3 attenuationColor;
    float attenuationDistance;
    #endif // THICKNESS
};

void initSurface(inout Surface surface, const in SurfaceInputs2 inputs, const in PixelParams pixel)
{
    surface.alpha = inputs.alpha;

    surface.normalTS = inputs.normalTS;

    vec3 baseColor = inputs.diffuseColor;
    float metallic = inputs.metallic;
    float perceptualRoughness = inputs.roughness;

    #ifdef IOR
        float ior = inputs.ior;
        surface.ior = ior;
        vec3 f0 = vec3(dielectricIorToF0(ior));
    #else // IOR
        vec3 f0 = vec3(dielectricSpecularToF0(inputs.specular));
        surface.ior = dielectricF0ToIor(f0.x);
    #endif // IOR

    // KHR_materials_specular
    f0 *= inputs.specularFactor * inputs.specularColor;

    surface.perceptualRoughness = max(perceptualRoughness, MIN_PERCEPTUAL_ROUGHNESS);
    surface.roughness = surface.perceptualRoughness * surface.perceptualRoughness;
    surface.diffuseColor = computeDiffuse(baseColor, metallic);
    surface.f0 = computeF0(f0, baseColor, metallic);
    surface.f90 = computeF90(surface.f0);

    surface.occlusion = inputs.occlusion;

    #ifdef EMISSION
    surface.emissionColor = inputs.emissionColor;
    #endif // EMISSION

    #ifdef IRIDESCENCE
    surface.iridescence = inputs.iridescence;
    surface.iridescenceIor = inputs.iridescenceIor;
    surface.iridescenceThickness = inputs.iridescenceThickness;
    #endif // IRIDESCENCE

    #ifdef SHEEN
    surface.sheenColor = inputs.sheenColor;
    surface.sheenPerceptualRoughness = max(inputs.sheenRoughness, MIN_PERCEPTUAL_ROUGHNESS);
    surface.sheenRoughness = pow2(surface.sheenPerceptualRoughness);
    #endif // SHEEN

    #ifdef CLEARCOAT
    surface.clearCoat = inputs.clearCoat;
    surface.clearCoatPerceptualRoughness = clamp(inputs.clearCoatRoughness, MIN_PERCEPTUAL_ROUGHNESS, 1.0);
    surface.clearCoatRoughness = surface.clearCoatPerceptualRoughness * surface.clearCoatPerceptualRoughness;
	#ifdef CLEARCOAT_NORMAL
    surface.clearCoatNormalTS = inputs.clearCoatNormalTS;
	#endif // CLEARCOAT_NORMAL
    #endif // CLEARCOAT

    #ifdef ANISOTROPIC
    surface.anisotropy = inputs.anisotropy;
    surface.anisotropyDirection = inputs.anisotropyDirection;
    #endif // ANISOTROPIC

    #ifdef TRANSMISSION
    surface.transmission = inputs.transmission;
    #endif // TRANSMISSION

    #ifdef THICKNESS
    surface.thickness = inputs.thickness;
    surface.attenuationColor = inputs.attenuationColor;
    surface.attenuationDistance = inputs.attenuationDistance;
    #endif // THICKNESS
}

vec3 layaContrast(vec3 ini, float contrast)
{
    float midpoint = pow(0.5, 2.2);
    return mix(vec3(midpoint, midpoint, midpoint), ini, contrast);
}

vec4 glTFMetallicRoughness(const in SurfaceInputs2 inputs, in PixelParams pixel)
{
    #ifdef ALPHATEST
    if (inputs.alpha < inputs.alphaTest)
	{
	    discard;
	}
    #endif // ALPHATEST

    Surface surface;
    initSurface(surface, inputs, pixel);

    PixelInfo info;
    getPixelInfo(info, pixel, surface);

    vec3 normalWS = pixel.normalWS;
    vec3 viewDirWS = normalize(u_CameraPos - pixel.positionWS);

    vec3 reflectVec = reflect(-viewDirWS, normalWS);
    float roughness = surface.perceptualRoughness;
        
    vec3 indirectSpecular = specularRadiance(reflectVec, roughness);

    vec3 contrastReflection = layaContrast(indirectSpecular, u_ReflectionContrast);
    #ifdef EMISSION
        surface.emissionColor = contrastReflection;
    #endif // EMISSION

    vec3 surfaceColor = vec3(0.0);
    surfaceColor += PBRLighting(surface, info);

    return vec4(surfaceColor, surface.alpha);
}

    float fresnelEffect(vec3 normal, vec3 viewDir, float power)
    {
        float NdotV = clamp(dot(normalize(normal), normalize(viewDir)), 0.0, 1.0);
        return pow(1.0 - NdotV, power);
    }

    void initSurfaceInputs(inout SurfaceInputs2 inputs, inout PixelParams pixel)
    {
        vec2 uv = vec2(0.0);
    #ifdef UV
        uv = pixel.uv0;
    #endif // UV

        inputs.alphaTest = u_AlphaTestValue;

        vec3 normalWS = pixel.normalWS;

        vec3 viewDirWS = normalize(u_CameraPos - pixel.positionWS);

        float albedoFresnel = fresnelEffect(normalWS, viewDirWS, u_EdgeFactor);
        vec3 pigmentColor = u_PigmentColor.rgb;
        vec3 pigmentMapRgb = texture2D(u_PigmentMap, uv).rgb;
        if (u_PigmentOpen == 1.0)
        {
            pigmentColor = pigmentMapRgb;
        }

        inputs.diffuseColor = mix(pigmentColor, u_EdgeColor.rgb, albedoFresnel);

        float flakeTex = texture2D(u_FlakeMap, uv * u_FlakeDensity).r;
        float flakeFresnel = 1.0 - fresnelEffect(normalWS, viewDirWS, u_FlakeFactor);
        float flake = flakeTex * u_FlakeReflection * flakeFresnel;

        float specularFresnel = fresnelEffect(normalWS, viewDirWS, u_SpecularFactor);
        inputs.specularColor = mix(u_FacingSpecular, u_PerpendicularSpecular, specularFresnel) * u_SpecularColor.rgb + flake;
        inputs.roughness = 1.0 - (u_Smoothness + flake);

        float clearcoatFresnel = fresnelEffect(normalWS, viewDirWS, u_ReflectionFactor);
        inputs.emissionColor = mix(u_FacingReflection, u_PerpendicularReflection, clearcoatFresnel) * u_ClearCoatColor.rgb;

        vec4 aoMap = texture2D(u_OcclusionMap, uv);
        float occ = (u_OcclusionSet == 0.0) ? aoMap.r : (u_OcclusionSet == 1.0) ? aoMap.g : aoMap.b;
        inputs.occlusion = mix(1.0, occ, u_Occlusion);

        inputs.metallic = u_Metallic;
        inputs.normalTS = vec3(0.0, 0.0, 1.0);
        inputs.alpha = 1.0;
    }

    vec3 toneMapping(vec3 color) {
        return color / (color + vec3(1.0));
    }

    void main()
    {
        PixelParams pixel;
        getPixelParams(pixel);
        
        SurfaceInputs2 inputs;
        initSurfaceInputs(inputs, pixel);

        
 
        vec4 surfaceColor = glTFMetallicRoughness(inputs, pixel);
        
    #ifdef FOG
        surfaceColor.rgb = sceneLitFog(surfaceColor.rgb);
    #endif // FOG

        gl_FragColor = surfaceColor;

        gl_FragColor = outputTransform(gl_FragColor);
    }
#endGLSL

GLSL End
