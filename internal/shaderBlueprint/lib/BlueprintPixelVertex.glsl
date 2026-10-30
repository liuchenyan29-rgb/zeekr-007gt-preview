#if !defined(BlueprintPixelVertex_lib)
    #define BlueprintPixelVertex_lib

    #include "shaderBlueprint/lib/BlueprintPixel.glsl";

void initPixelParams(inout PixelParams params, in Vertex vertex)
{
    mat4 worldMat = getWorldMatrix();
    params.positionWS = (worldMat * vec4(vertex.positionOS, 1.0)).xyz;

    params.normalWS = normalize((worldMat * vec4(vertex.normalOS, 0.0)).xyz);

    #ifdef TANGENT
        vec4 tangentOS = vertex.tangentOS;
        params.tangentWS = normalize((worldMat * vec4(tangentOS.xyz, 0.0)).xyz);
        params.biNormalWS = normalize(cross(params.normalWS, params.tangentWS) * sign(tangentOS.w));
    #else // TANGENT
        #ifdef CUSTOM_TANGENT
            // custom tangent value
            vec4 tangentOS = vertex.tangentOS;
            params.tangentWS = normalize((worldMat * vec4(tangentOS.xyz, 0.0)).xyz);
            params.biNormalWS = normalize(cross(params.normalWS, params.tangentWS) * sign(tangentOS.w));
        #else // CUSTOM_TANGENT
            params.tangentWS = vec3(1.0, 0.0, 0.0);
            params.biNormalWS = normalize(cross(params.normalWS, params.tangentWS));
        #endif // CUSTOM_TANGENT
    #endif // TANGENT

    #ifdef UV
    params.uv0 = vertex.texCoord0;
    #endif // UV

    #ifdef COLOR
    params.vertexColor = vertex.vertexColor;
    #endif // COLOR

    #ifdef UV1
    #ifdef LIGHTMAP
    params.uv1 = tranformLightMapUV(vertex.texCoord1, vertex.lightmapScaleOffset);
    #endif // LIGHTMAP
    #endif // UV1
}

void varyingPixelParams(inout PixelParams params)
{
    v_PositionWS = params.positionWS;

    v_NormalWS = params.normalWS;
    v_TangentWS = params.tangentWS;
    v_BiNormalWS = params.biNormalWS;

    #ifdef UV
    v_Texcoord0 = params.uv0;
    #endif // UV

    #ifdef UV1
	#ifdef LIGHTMAP
    v_Texcoord1 = params.uv1;
	#endif // LIGHTMAP
    #endif // UV1


    #ifdef COLOR
    v_VertexColor = params.vertexColor;
    #endif // COLOR
}

#endif // BlueprintPixelVertex_lib