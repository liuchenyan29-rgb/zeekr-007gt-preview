"""Extend the bundled Laya PBR shader; retain its lighting/depth/shadow passes."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'libs/laya.d3.js').read_text()
names = ['PBRStandardVS', 'PBRStandardFS', 'PBRDepthVS', 'PBRDepthFS', 'DepthNormalVS', 'DepthNormalFS']
shaders = {}
for name in names:
    match = re.search(r'    var ' + name + r' = ("(?:[^"\\]|\\.)*");', source)
    if not match:
        raise ValueError('Missing bundled shader: ' + name)
    shaders[name] = json.loads(match[1])

# Project in vehicle space rather than the AO atlas: panel UV islands do not
# break up the pattern. Normal weights blend the three planar projections.
overlay = '''
#ifdef PAINT_TEXTURE
vec4 samplePaintPattern(vec2 uv) {
    float c = cos(u_PaintTransform.y), s = sin(u_PaintTransform.y);
    uv = mat2(c, -s, s, c) * uv / u_PaintTransform.x;
    uv += u_PaintTransform.zw;
    uv.x /= u_PaintAspect;
    vec4 pattern = texture2D(u_PaintMap, uv);
    #ifdef Gamma_u_PaintMap
    pattern.rgb = gammaToLinear(pattern.rgb);
    #endif
    // Blend premultiplied RGB to avoid dark fringes on transparent PNGs.
    pattern.rgb *= pattern.a;
    return pattern;
}
void applyPaintPattern(inout SurfaceInputs inputs, in PixelParams pixel) {
    vec3 p = pixel.positionWS - u_PaintOrigin;
    vec3 w = pow(abs(normalize(pixel.normalWS)), vec3(8.0));
    w /= max(w.x + w.y + w.z, 0.00001);
    vec4 pattern = samplePaintPattern(vec2(-p.z, p.y)) * w.x
        + samplePaintPattern(vec2(p.x, -p.z)) * w.y
        + samplePaintPattern(vec2(p.x, p.y)) * w.z;
    // Image alpha masks the graphic, never the car geometry or its shadows.
    inputs.diffuseColor = inputs.diffuseColor * (1.0 - pattern.a * u_PaintOpacity)
        + pattern.rgb * u_PaintOpacity;
}
#endif
'''
fragment = shaders['PBRStandardFS']
assert fragment.count('void main()') == 1
fragment = fragment.replace('void main()', overlay + '\nvoid main()')
needle = '    vec4 surfaceColor = PBR_Metallic_Flow(inputs, pixel);'
assert fragment.count(needle) == 1
shaders['PBRStandardFS'] = fragment.replace(needle, '''#ifdef PAINT_TEXTURE
    applyPaintPattern(inputs, pixel);
#endif
''' + needle)
init = source.split('    class PBRStandardShaderInit {', 1)[1].split('\n    var SkyboxVS', 1)[0]
body = init.split('        static init() {', 1)[1].rsplit('\n        }', 1)[0]
body = body.replace('exports.', 'Laya.').replace('Shader3D.add("PBR",', 'Shader3D.add("PaintTexturePBR",')
body = body.replace('            let defaultValue = {', '''            Object.assign(uniformMap, {
                u_PaintMap: Laya.ShaderDataType.Texture2D,
                u_PaintTransform: Laya.ShaderDataType.Vector4,
                u_PaintAspect: Laya.ShaderDataType.Float,
                u_PaintOpacity: Laya.ShaderDataType.Float,
                u_PaintOrigin: Laya.ShaderDataType.Vector3
            });
            let defaultValue = {''')
output = '/* Generated from bundled Laya PBR by tools/build-paint-texture-shader.py. */\nfunction registerPaintTextureShader() {\n'
output += '  if (Laya.Shader3D.find("PaintTexturePBR")) return;\n'
for name, value in shaders.items():
    output += '  const ' + name + ' = ' + json.dumps(value, ensure_ascii=False) + ';\n'
output += body + '\n}\n'
(ROOT / 'paint-texture-shader.js').write_text(output)
print('Generated paint-texture-shader.js with all three PBR passes')
