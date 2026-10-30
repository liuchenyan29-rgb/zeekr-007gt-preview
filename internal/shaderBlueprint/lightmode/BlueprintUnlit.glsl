#if !defined(BlueprintUnlit_lib)
    #define BlueprintUnlit_lib

struct Surface {
    vec3 color;
    float alpha;

    vec3 normalTS;
};

struct PixelInfo {
    vec3 positionWS;

    vec3 vertexNormalWS;
    vec3 normalWS;
};

void getPixelInfo(inout PixelInfo info, const in PixelParams pixel, const in Surface surface)
{
    info.positionWS = pixel.positionWS;

    info.vertexNormalWS = pixel.normalWS;

    info.normalWS = pixel.normalWS;
    #ifdef TANGENT
    info.normalWS = normalize(pixel.TBN * surface.normalTS);
    #else // TANGENT
	#ifdef CUSTOM_TANGENT
    info.normalWS = normalize(pixel.TBN * surface.normalTS);
	#else // CUSTOM_TANGENT
    info.normalWS = info.vertexNormalWS;
	#endif // CUSTOM_TANGENT
    #endif // TANGENT
}

vec3 UnlitShading(in Surface surface)
{
    return surface.color;
}

vec4 SurfaceShading(const in Surface surface, const in PixelInfo info)
{

    vec3 color = UnlitShading(surface);
    return vec4(color, surface.alpha);
}

#endif // BlueprintUnlit_lib