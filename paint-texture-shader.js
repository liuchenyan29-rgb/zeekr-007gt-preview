/* Generated from bundled Laya PBR by tools/build-paint-texture-shader.py. */
function registerPaintTextureShader() {
  if (Laya.Shader3D.find("PaintTexturePBR")) return;
  const PBRStandardVS = "#define SHADER_NAME PBRStandardVS\n\n#include \"Math.glsl\";\n\n#include \"Scene.glsl\";\n#include \"SceneFogInput.glsl\";\n\n#include \"Camera.glsl\";\n#include \"Sprite3DVertex.glsl\";\n\n#include \"VertexCommon.glsl\";\n\n#include \"PBRVertex.glsl\";\n\n#if defined(DETAILTEXTURE) || defined(DETAILNORMAL)\nvarying vec2 v_DetailUV;\n#endif\n\nvoid main()\n{\n    Vertex vertex;\n    getVertexParams(vertex);\n\n    PixelParams pixel;\n    initPixelParams(pixel, vertex);\n\n#if defined(DETAILTEXTURE) || defined(DETAILNORMAL)\n    #ifdef UV\n    v_DetailUV = transformUV(vertex.texCoord0, u_DetailTillingOffset);\n    #else // UV\n    v_DetailUV = vec2(0.0);\n    #endif\n#endif\n\n    gl_Position = getPositionCS(pixel.positionWS);\n\n    gl_Position = remapPositionZ(gl_Position);\n\n#ifdef FOG\n    FogHandle(gl_Position.z);\n#endif\n}";
  const PBRStandardFS = "#define SHADER_NAME PBRStandardFS\n\n#include \"Color.glsl\";\n\n#include \"Scene.glsl\";\n#include \"SceneFog.glsl\";\n\n#include \"Camera.glsl\";\n#include \"Sprite3DFrag.glsl\";\n\n#include \"PBRMetallicFrag.glsl\";\n\n#if defined(DETAILTEXTURE) || defined(DETAILNORMAL)\nvarying vec2 v_DetailUV;\n    #define ColorSpaceDouble vec3(4.59479380, 4.59479380, 4.59479380);\nvec3 BlendNormals(vec3 n1, vec3 n2)\n{\n    return normalize(vec3(n1.xy + n2.xy, n1.z * n2.z));\n}\n#endif // DETAILTEXTURE || DETAILNORMAL\n\nvoid initSurfaceInputs(inout SurfaceInputs inputs, const in PixelParams pixel)\n{\n#ifdef UV\n    vec2 uv = transformUV(pixel.uv0, u_TilingOffset);\n#else // UV\n    vec2 uv = vec2(0.0);\n#endif // UV\n\n    inputs.diffuseColor = u_AlbedoColor.rgb;\n    inputs.alpha = u_AlbedoColor.a;\n\n#ifdef COLOR\n    #ifdef ENABLEVERTEXCOLOR\n    inputs.diffuseColor *= pixel.vertexColor.xyz;\n    inputs.alpha *= pixel.vertexColor.a;\n    #endif // ENABLEVERTEXCOLOR\n#endif // COLOR\n\n    inputs.alphaTest = u_AlphaTestValue;\n\n#ifdef ALBEDOTEXTURE\n    vec4 albedoSampler = texture2D(u_AlbedoTexture, uv);\n    #ifdef Gamma_u_AlbedoTexture\n    albedoSampler = gammaToLinear(albedoSampler);\n    #endif // Gamma_u_AlbedoTexture\n    inputs.diffuseColor *= albedoSampler.rgb;\n    inputs.alpha *= albedoSampler.a;\n#endif // ALBEDOTEXTURE\n\n// Detail Albedo\n#ifdef DETAILTEXTURE\n    vec3 detailSampler = texture2D(u_DetailAlbedoTexture, v_DetailUV).rgb;\n    #ifdef Gamma_u_DetailAlbedoTexture\n    detailSampler = gammaToLinear(detailSampler);\n    #endif // Gamma_u_DetailAlbedoTexture\n    detailSampler *= ColorSpaceDouble;\n    inputs.diffuseColor *= detailSampler;\n#endif\n\n    inputs.normalTS = vec3(0.0, 0.0, 1.0);\n#ifdef NORMALTEXTURE\n    vec3 normalSampler = texture2D(u_NormalTexture, uv).rgb;\n    normalSampler = normalize(normalSampler * 2.0 - 1.0);\n    normalSampler.y *= -1.0;\n    inputs.normalTS = normalScale(normalSampler, u_NormalScale);\n#endif\n\n#ifdef DETAILNORMAL\n    vec3 detailnormalSampler = texture2D(u_DetailNormalTexture, v_DetailUV).rgb;\n    detailnormalSampler = normalize(detailnormalSampler * 2.0 - 1.0);\n    detailnormalSampler.y *= -1.0;\n    detailnormalSampler = normalScale(detailnormalSampler, u_DetailNormalScale);\n    inputs.normalTS = BlendNormals(inputs.normalTS, detailnormalSampler);\n#endif\n\n    inputs.metallic = u_Metallic;\n    inputs.smoothness = u_Smoothness;\n\n#ifdef METALLICGLOSSTEXTURE\n\n    vec4 metallicSampler = texture2D(u_MetallicGlossTexture, uv);\n    #ifdef Gamma_u_MetallicGlossTexture\n    metallicSampler = gammaToLinear(metallicSampler);\n    #endif // Gamma_u_MetallicGlossTexture\n\n    inputs.metallic = metallicSampler.x;\n\n    #ifdef SMOOTHNESSSOURCE_ALBEDOTEXTURE_ALPHA\n\t#ifdef ALBEDOTEXTURE\n    inputs.smoothness = (albedoSampler.a * u_Smoothness);\n\t#endif // ALBEDOTEXTURE\n    #else // SMOOTHNESSSOURCE_METALLICTEXTURE_ALPHA\n    inputs.smoothness = (metallicSampler.a * u_Smoothness);\n    #endif // SMOOTHNESSSOURCE_ALBEDOTEXTURE_ALPHA\n\n#endif // METALLICGLOSSTEXTURE\n\n    inputs.occlusion = 1.0;\n#ifdef OCCLUSIONTEXTURE\n    vec4 occlusionSampler = texture2D(u_OcclusionTexture, uv);\n    #ifdef Gamma_u_OcclusionTexture\n    occlusionSampler = gammaToLinear(occlusionSampler);\n    #endif // Gamma_u_OcclusionTexture\n\n    float occlusion = occlusionSampler.g;\n    inputs.occlusion = (1.0 - u_OcclusionStrength) + occlusion * u_OcclusionStrength;\n#endif // OCCLUSIONTEXTURE\n\n    inputs.emissionColor = vec3(0.0);\n#ifdef EMISSION\n    inputs.emissionColor = u_EmissionColor.rgb * u_EmissionIntensity;\n    #ifdef EMISSIONTEXTURE\n    vec4 emissionSampler = texture2D(u_EmissionTexture, uv);\n\t#ifdef Gamma_u_EmissionTexture\n    emissionSampler = gammaToLinear(emissionSampler);\n\t#endif // Gamma_u_EmissionTexture\n    inputs.emissionColor *= emissionSampler.rgb;\n    #endif // EMISSIONTEXTURE\n#endif // EMISSION\n\n#ifdef CLEARCOAT\n    inputs.clearCoat = u_ClearCoatFactor;\n    inputs.clearCoatRoughness = u_ClearCoatRoughness;\n\n    #ifdef CLEARCOATMAP\n    // todo\n    // linear tex no need gamma\n    vec4 clearCoatSampler = texture2D(u_ClearCoatTexture, uv);\n    inputs.clearCoat *= clearCoatSampler.r;\n    #endif // CLEARCOATMAP\n\n    #ifdef CLEARCOAT_ROUGHNESSMAP\n    // todo\n    // linear tex no need gamma\n    vec4 clearcoatSampleRoughness = texture2D(u_ClearCoatRoughnessTexture, uv);\n    inputs.clearCoatRoughness *= clearcoatSampleRoughness.g;\n    #endif // CLEARCOAT_ROUGHNESSMAP\n\n    #ifdef CLEARCOAT_NORMAL\n    vec3 clearCoatNormalSampler = texture2D(u_ClearCoatNormalTexture, uv).rgb;\n    clearCoatNormalSampler = normalize(clearCoatNormalSampler * 2.0 - 1.0);\n    clearCoatNormalSampler.y *= -1.0;\n    inputs.clearCoatNormalTS = clearCoatNormalSampler;\n    #endif // CLEARCOAT_NORMAL\n#endif // CLEARCOAT\n\n#ifdef ANISOTROPIC\n    inputs.anisotropy = u_AnisotropyStrength;\n    vec2 direction = vec2(1.0, 0.0);\n\n    #ifdef ANISOTROPYMAP\n    vec3 anisotropySampler = texture2D(u_AnisotropyTexture, uv).rgb;\n\n    inputs.anisotropy *= anisotropySampler.b;\n    direction = anisotropySampler.xy * 2.0 - 1.0;\n    #endif // ANISOTROPYMAP\n\n    vec2 anisotropyRotation = vec2(cos(u_AnisotropyRotation), sin(u_AnisotropyRotation));\n    mat2 rotationMatrix = mat2(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x);\n    inputs.anisotropyDirection = rotationMatrix * direction;\n\n#endif // ANISOTROPIC\n}\n\n\n#ifdef PAINT_TEXTURE\nvec4 samplePaintPattern(vec2 uv) {\n    float c = cos(u_PaintTransform.y), s = sin(u_PaintTransform.y);\n    uv = mat2(c, -s, s, c) * uv / u_PaintTransform.x;\n    uv += u_PaintTransform.zw;\n    uv.x /= u_PaintAspect;\n    vec4 pattern = texture2D(u_PaintMap, uv);\n    #ifdef Gamma_u_PaintMap\n    pattern.rgb = gammaToLinear(pattern.rgb);\n    #endif\n    // Blend premultiplied RGB to avoid dark fringes on transparent PNGs.\n    pattern.rgb *= pattern.a;\n    return pattern;\n}\nvoid applyPaintPattern(inout SurfaceInputs inputs, in PixelParams pixel) {\n    vec3 p = pixel.positionWS - u_PaintOrigin;\n    vec3 w = pow(abs(normalize(pixel.normalWS)), vec3(8.0));\n    w /= max(w.x + w.y + w.z, 0.00001);\n    vec4 pattern = samplePaintPattern(vec2(-p.z, p.y)) * w.x\n        + samplePaintPattern(vec2(p.x, -p.z)) * w.y\n        + samplePaintPattern(vec2(p.x, p.y)) * w.z;\n    // Image alpha masks the graphic, never the car geometry or its shadows.\n    inputs.diffuseColor = inputs.diffuseColor * (1.0 - pattern.a * u_PaintOpacity)\n        + pattern.rgb * u_PaintOpacity;\n}\n#endif\n\nvoid main()\n{\n    PixelParams pixel;\n    getPixelParams(pixel);\n\n    SurfaceInputs inputs;\n    initSurfaceInputs(inputs, pixel);\n\n#ifdef PAINT_TEXTURE\n    applyPaintPattern(inputs, pixel);\n#endif\n    vec4 surfaceColor = PBR_Metallic_Flow(inputs, pixel);\n\n#ifdef FOG\n    surfaceColor.rgb = sceneLitFog(surfaceColor.rgb);\n#endif // FOG\n\n    gl_FragColor = surfaceColor;\n\n    gl_FragColor = outputTransform(gl_FragColor);\n}";
  const PBRDepthVS = "#define SHADER_NAME DepthVS\n\n#include \"DepthVertex.glsl\";\n\nvoid main()\n{\n    Vertex vertex;\n    getVertexParams(vertex);\n\n    mat4 worldMat = getWorldMatrix();\n    vec4 pos = (worldMat * vec4(vertex.positionOS, 1.0));\n    vec3 positionWS = pos.xyz / pos.w;\n\n    mat4 normalMat = transpose(inverse(worldMat));\n    vec3 normalWS = normalize((normalMat * vec4(vertex.normalOS, 0.0)).xyz);\n\n    vec4 positionCS = DepthPositionCS(positionWS, normalWS);\n    gl_Position = remapPositionZ(positionCS);\n}";
  const PBRDepthFS = "#define SHADER_NAME DepthFS\n\n#include \"DepthFrag.glsl\";\n\nvoid main()\n{\n    gl_FragColor = getDepthColor();\n}";
  const DepthNormalVS = "#define SHADER_NAME PBRStandardDepthNormalVS\n\n#include \"Math.glsl\";\n\n#include \"Camera.glsl\";\n\n#include \"Sprite3DVertex.glsl\";\n\n#include \"VertexCommon.glsl\";\n\n#include \"PBRVertex.glsl\";\n\nvarying vec4 v_PositionCS;\n\nvoid main()\n{\n    Vertex vertex;\n    getVertexParams(vertex);\n\n    PixelParams pixel;\n    initPixelParams(pixel, vertex);\n\n    sharePixelParams(pixel);\n\n    vec4 positionCS = getPositionCS(pixel.positionWS);\n    v_PositionCS = positionCS;\n    gl_Position = positionCS;\n    gl_Position = remapPositionZ(gl_Position);\n}";
  const DepthNormalFS = "#define SHADER_NAME PBRStandardDepthNormalFS\n\n#include \"Color.glsl\";\n\n#include \"Scene.glsl\";\n\n#include \"Camera.glsl\";\n#include \"Sprite3DFrag.glsl\";\n\n#include \"ShadingFrag.glsl\";\n\n#include \"DepthNormalFrag.glsl\";\n\nvarying vec4 v_PositionCS;\n\nvoid main()\n{\n    PixelParams pixel;\n    getPixelParams(pixel);\n\n    vec3 normalWS = pixel.normalWS;\n\n#ifdef NORMALTEXTURE\n    #ifdef UV\n\n    vec2 uv = transformUV(pixel.uv0, u_TilingOffset);\n    vec3 normalSampler = texture2D(u_NormalTexture, uv).rgb;\n    normalSampler = normalize(normalSampler * 2.0 - 1.0);\n    normalSampler.y *= -1.0;\n    vec3 normalTS = normalScale(normalSampler, u_NormalScale);\n    normalWS = normalize(pixel.TBN * normalTS);\n\n    #endif // UV\n#endif // NORMALTEXTURE\n\n    vec4 positionCS = v_PositionCS;\n\n    vec4 dephtNormal = encodeDepthNormal(positionCS, normalWS);\n\n    gl_FragColor = dephtNormal;\n}";

            let uniformMap = {
                "u_AlbedoColor": Laya.ShaderDataType.Color,
                "u_TilingOffset": Laya.ShaderDataType.Vector4,
                "u_NormalScale": Laya.ShaderDataType.Float,
                "u_Metallic": Laya.ShaderDataType.Float,
                "u_Smoothness": Laya.ShaderDataType.Float,
                "u_OcclusionStrength": Laya.ShaderDataType.Float,
                "u_AlphaTestValue": Laya.ShaderDataType.Float,
                "u_EmissionColor": Laya.ShaderDataType.Color,
                "u_EmissionIntensity": Laya.ShaderDataType.Float,
                "u_AlbedoTexture": Laya.ShaderDataType.Texture2D,
                "u_NormalTexture": Laya.ShaderDataType.Texture2D,
                "u_OcclusionTexture": Laya.ShaderDataType.Texture2D,
                "u_EmissionTexture": Laya.ShaderDataType.Texture2D,
                "u_MetallicGlossTexture": Laya.ShaderDataType.Texture2D,
                "u_AnisotropyStrength": Laya.ShaderDataType.Float,
                "u_AnisotropyTexture": Laya.ShaderDataType.Texture2D,
                "u_AnisotropyRotation": Laya.ShaderDataType.Float,
                "u_ClearCoatFactor": Laya.ShaderDataType.Float,
                "u_ClearCoatTexture": Laya.ShaderDataType.Texture2D,
                "u_ClearCoatRoughness": Laya.ShaderDataType.Float,
                "u_ClearCoatRoughnessTexture": Laya.ShaderDataType.Texture2D,
                "u_ClearCoatNormalTexture": Laya.ShaderDataType.Texture2D,
                "u_DetailAlbedoTexture": Laya.ShaderDataType.Texture2D,
                "u_DetailNormalTexture": Laya.ShaderDataType.Texture2D,
                "u_DetailNormalScale": Laya.ShaderDataType.Float,
                "u_DetailTillingOffset": Laya.ShaderDataType.Vector4
            };
            Object.assign(uniformMap, {
                u_PaintMap: Laya.ShaderDataType.Texture2D,
                u_PaintTransform: Laya.ShaderDataType.Vector4,
                u_PaintAspect: Laya.ShaderDataType.Float,
                u_PaintOpacity: Laya.ShaderDataType.Float,
                u_PaintOrigin: Laya.ShaderDataType.Vector3
            });
            let defaultValue = {
                "u_AlbedoColor": Laya.Color.WHITE,
                "u_TilingOffset": new Laya.Vector4(1, 1, 0, 0),
                "u_DetailTillingOffset": new Laya.Vector4(1, 1, 0, 0),
                "u_NormalScale": 1,
                "u_DetailNormalScale": 1,
                "u_Metallic": 0,
                "u_Smoothness": 0.5,
                "u_OcclusionStrength": 1,
                "u_EmissionColor": Laya.Color.WHITE,
                "u_EmissionIntensity": 1,
                "u_AlphaTestValue": 0.5,
                "u_AnisotropyStrength": 0,
                "u_AnisotropyRotation": 0,
                "u_ClearCoatFactor": 0,
                "u_ClearCoatRoughness": 0,
            };
            let shader = Laya.Shader3D.add("PaintTexturePBR", true, true);
            shader.shaderType = Laya.ShaderFeatureType.D3;
            shader._surportVolumetricGI = true;
            let subShader = new Laya.SubShader(Laya.SubShader.DefaultAttributeMap, uniformMap, defaultValue);
            shader.addSubShader(subShader);
            subShader.addShaderPass(PBRStandardVS, PBRStandardFS);
            subShader.addShaderPass(PBRDepthVS, PBRDepthFS, "ShadowCaster");
            subShader.addShaderPass(DepthNormalVS, DepthNormalFS, "DepthNormal");
}
