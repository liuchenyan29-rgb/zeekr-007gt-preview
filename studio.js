/* Neutral softbox reflections and a bright, seamless photographic cove. All RGB channels
   are identical, so the lighting cannot introduce a coloured environment cast. */
const Studio = {
  environment: null,
  materialCache: new Map(),

  createEnvironment() {
    const size = 256;
    const faces = [];
    const softbox = (yaw, pitch, cy, cp, width, height) => {
      const dy = Math.atan2(Math.sin(yaw - cy), Math.cos(yaw - cy));
      return Math.exp(-Math.pow(dy / width, 4) - Math.pow((pitch - cp) / height, 4));
    };
    for (let face = 0; face < 6; face++) {
      const pixels = new Uint8Array(size * size * 4);
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const u = 2 * (col + .5) / size - 1;
          const v = 2 * (row + .5) / size - 1;
          let x, y, z;
          if (face === 0) [x,y,z] = [1,-v,-u];
          if (face === 1) [x,y,z] = [-1,-v,u];
          if (face === 2) [x,y,z] = [u,1,v];
          if (face === 3) [x,y,z] = [u,-1,-v];
          if (face === 4) [x,y,z] = [u,-v,1];
          if (face === 5) [x,y,z] = [-u,-v,-1];
          const length = Math.hypot(x,y,z);
          const yaw = Math.atan2(z,x), pitch = Math.asin(y/length);
          const base = .25 + .16 * Math.max(0,y/length);
          const key = softbox(yaw,pitch,-.4,.65,.62,.24);
          const fill = softbox(yaw,pitch,2.5,.5,.65,.30);
          const front = softbox(yaw,pitch,-2.0,.38,.55,.24);
          const ceiling = Math.exp(-Math.pow((pitch-1.3)/.39,4));
          const luminance = Math.min(1,base + .68 * Math.max(key,fill*.9,front*.72,ceiling));
          const index = (row * size + col) * 4;
          const value = Math.round(luminance * 255);
          pixels[index] = pixels[index+1] = pixels[index+2] = value;
          pixels[index+3] = 255;
        }
      }
      faces.push(pixels);
    }
    const cube = new Laya.TextureCube(size,Laya.TextureFormat.R8G8B8A8,true,false);
    cube.setPixelsData(faces,false,false);
    cube.filterMode = Laya.FilterMode.Trilinear;
    this.environment = cube;
    return cube;
  },

  setup(scene) {
    // SolidColor mode ignores iblTex in this Laya build. Enable IBL and
    // retain the former uniform diffuse ambient via its constant SH term.
    scene.ambientMode = Laya.AmbientMode.SphericalHarmonics;
    const ambientSH=new Float32Array(27);
    ambientSH.fill(Laya.Color.gammaToLinearSpace(.82),0,3);
    scene.ambientSH=ambientSH;
    scene.ambientColor = new Laya.Color(.82,.82,.82,1);
    scene.ambientIntensity = .6;
    scene.iblTex = this.createEnvironment();
    scene.iblTexRGBD = false;
    scene.reflectionIntensity = 1.0;
    scene.shadowMapFrequency = 2;
    scene.enableFog = true;
    scene.fogColor = new Laya.Color(.93,.93,.93,1);
    scene.fogStart = 26;
    scene.fogEnd = 56;

    const lamps = [
      [-58,-35,0,.8],
      [-35,135,0,.45],
      [-75,20,0,.3]
    ];
    lamps.forEach(([x,y,z,power],index) => {
      const node = scene.addChild(new Laya.Sprite3D('White softbox '+index));
      const light = node.addComponent(Laya.DirectionLightCom);
      light.color = new Laya.Color(1,1,1,1);
      light.intensity = power;
      node.transform.rotationEuler = new Laya.Vector3(x,y,z);
      if (index === 0) {
        light.shadowMode = Laya.ShadowMode.SoftHigh;
        light.shadowResolution = 1024;
        light.shadowDistance = 28;
        light.shadowStrength = .32;
        light.shadowDepthBias = .6;
        light.shadowNormalBias = .35;
        light.shadowNearPlane = .1;
      }
    });

    const floor = scene.addChild(new Laya.MeshSprite3D(Laya.PrimitiveMesh.createPlane(100,100,1,1),'Seamless studio floor'));
    floor.transform.position = new Laya.Vector3(0,-.006,0);
    const material = new Laya.BlinnPhongMaterial();
    material.albedoColor = new Laya.Color(.74,.74,.74,1);
    material.specularColor = new Laya.Color(0,0,0,1);
    floor.meshRenderer.sharedMaterial = material;
    floor.meshRenderer.receiveShadow = true;
    this.floor = floor;
    this.createBackdrop(scene);
    this.createContactShadow(scene);
  },

  createBackdrop(scene) {
    // A curved wall surrounds the scene, so every orbit angle has the same
    // quiet background. Its grayscale gradient is independent of car paint.
    const profile = [];
    for(let i=0;i<=16;i++){
      const angle=i/16*Math.PI/2;
      profile.push([20+3*Math.sin(angle),-.006+3*(1-Math.cos(angle))]);
    }
    profile.push([23,14]);
    const vertices=[],indices=[],slices=128;
    profile.forEach(([radius,y],row)=>{
      for(let col=0;col<=slices;col++){
        const angle=col/slices*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle);
        vertices.push(radius*c,y,radius*s,-c,0,-s,col/slices,(y+.006)/14.006);
        if(row && col){
          const n=row*(slices+1)+col;
          indices.push(n,n-1,n-slices-2,n,n-slices-2,n-slices-1);
        }
      }
    });
    const mesh=Laya.PrimitiveMesh._createMesh(Laya.VertexMesh.getVertexDeclaration('POSITION,NORMAL,UV'),new Float32Array(vertices),new Uint16Array(indices));
    const wall=scene.addChild(new Laya.MeshSprite3D(mesh,'Curved gallery backdrop'));
    const canvas=document.createElement('canvas');canvas.width=4;canvas.height=256;
    const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);
    gradient.addColorStop(0,'#e1e1e1');
    gradient.addColorStop(.08,'#e7e7e7');
    gradient.addColorStop(.22,'#efefef');
    gradient.addColorStop(1,'#f6f6f6');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,4,256);
    const texture=new Laya.Texture2D(4,256,Laya.TextureFormat.R8G8B8A8,true,false,true);
    texture.setImageData(canvas,false,false);
    const material=new Laya.UnlitMaterial();
    material.albedoTexture=texture;
    material.cull=Laya.RenderState.CULL_NONE;
    wall.meshRenderer.sharedMaterial=material;
    this.backdrop=wall;
  },

  createContactShadow(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;canvas.height = 512;
    const context = canvas.getContext('2d');
    const spot = (x,y,rx,ry,opacity) => {
      context.save();context.translate(x,y);context.scale(rx,ry);
      const gradient = context.createRadialGradient(0,0,0,0,0,1);
      gradient.addColorStop(0,`rgba(0,0,0,${opacity})`);
      gradient.addColorStop(.38,`rgba(0,0,0,${opacity*.75})`);
      gradient.addColorStop(1,'rgba(0,0,0,0)');
      context.fillStyle=gradient;context.fillRect(-1,-1,2,2);context.restore();
    };
    spot(128,256,108,230,.38);
    spot(128,256,72,185,.22);
    for (const x of [69,187]) for (const y of [143,369]) spot(x,y,30,41,.40);
    const texture = new Laya.Texture2D(256,512,Laya.TextureFormat.R8G8B8A8,true,false);
    texture.setImageData(canvas,false,false);
    const plane = scene.addChild(new Laya.MeshSprite3D(Laya.PrimitiveMesh.createPlane(3.8,6.7,1,1),'Soft contact shadow'));
    const material = new Laya.UnlitMaterial();
    material.albedoColor = new Laya.Color(1,1,1,1);
    material.albedoTexture = texture;
    material.renderMode = Laya.UnlitMaterial.RENDERMODE_TRANSPARENT;
    plane.meshRenderer.sharedMaterial=material;
    this.contactShadow=plane;
  },

  updateGround(wheels) {
    let lowest=Infinity;
    const visit=node=>{
      const renderer=node.getComponent(Laya.MeshRenderer);
      if(renderer)lowest=Math.min(lowest,renderer.bounds.getMin().y);
      for(let i=0;i<node.numChildren;i++)visit(node.getChildAt(i));
    };
    visit(wheels);
    if(Number.isFinite(lowest)) {
      this.floor.transform.position=new Laya.Vector3(0,lowest-.006,0);
      this.backdrop.transform.position=new Laya.Vector3(0,lowest,0);
      this.contactShadow.transform.position=new Laya.Vector3(0,lowest+.001,0);
      document.documentElement.dataset.studioGround=String(lowest);
    }
  },

  prepareModel(root, paintMaterials) {
    const visit = (node) => {
      const renderer = node.getComponent(Laya.MeshRenderer);
      if (renderer) {
        renderer.castShadow = true;
        renderer.receiveShadow = true;
        const originals = renderer.sharedMaterials;
        renderer.sharedMaterials = originals.map(original => {
          if (!original) return original;
          const albedo = original.getTexture('u_AlbedoTexture');
          if (albedo?.url?.includes('neishi_')) {
            document.documentElement.dataset.interiorTexture = albedo.url;
          }
          if (original.url?.includes('/glass_qian.lmat')) {
            // Keep the windshield reflective while letting the pale cabin read
            // under neutral studio lighting. Glass must not cast an opaque shadow.
            original.setColor('u_AlbedoColor',new Laya.Color(.015,.015,.015,.38));
            renderer.castShadow = false;
          }
          // Replace the old baked ground with a neutral studio shadow.
          if (original.shader?.name === 'Unlit' && original.getTexture('u_AlbedoTexture')?.url?.includes('csY2')) {
            renderer.enabled=false;
            renderer.castShadow = false;
          }
          if (original.shader?.name !== 'carpaintURP') return original;
          const ao = original.getTexture('Occlusion_Map');
          const isPaint = ao?.url?.includes('cc1e_ao2');
          if (!isPaint) {
            original.setTexture('TextureCube',this.environment);
            original.setColor('Light_Color',new Laya.Color(1,1,1,1));
            original.setFloat('Light_Intensity',.08);
            return original;
          }
          let pbr = this.materialCache.get(original);
          if (!pbr) {
            pbr = new Laya.PBRStandardMaterial();
            pbr.name = 'Studio car paint';
            pbr.metallic = .28;
            pbr.smoothness = .92;
            pbr.clearCoatEnable = true;
            pbr.clearCoat = .85;
            pbr.clearCoatRoughness = .07;
            pbr.occlusionTexture = ao;
            pbr.occlusionTextureStrength = .7;
            this.materialCache.set(original,pbr);
            paintMaterials?.push(pbr);
          }
          return pbr;
        });
      }
      for (let index = 0; index < node.numChildren; index++) visit(node.getChildAt(index));
    };
    visit(root);
  }
};
