#if !defined(BlueprintPixelFrag_lib)
    #define BlueprintPixelFrag_lib

    #include "shaderBlueprint/lib/BlueprintPixel.glsl";

    #define _InvertNormal (float(gl_FrontFacing) * 2.0 - 1.0);

void getPixelParams(inout PixelParams params)
{
    params.positionWS = v_PositionWS;

    float invertN = _InvertNormal;

    params.normalWS = normalize(v_NormalWS * invertN);
    params.tangentWS = normalize(v_TangentWS * invertN);
    params.biNormalWS = normalize(v_BiNormalWS * invertN);

    params.TBN = mat3(params.tangentWS, params.biNormalWS, params.normalWS);

    #ifdef UV
    params.uv0 = v_Texcoord0;
    #endif // UV

    #ifdef COLOR
    params.vertexColor = v_VertexColor;
    #endif // COLOR

    #ifdef UV1
	#ifdef LIGHTMAP
    params.uv1 = v_Texcoord1;
	#endif // LIGHTMAP
    #endif // UV1
}

#endif // BlueprintPixelFrag_lib