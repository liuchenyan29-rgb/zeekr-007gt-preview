"""Freeze verified configurator colour names, swatches and material pigment values."""
from pathlib import Path
import concurrent.futures,gzip,hashlib,json,math,urllib.request
ROOT=Path(__file__).resolve().parents[1]
BASE='https://zeekrlife-oss.zeekrlife.com/frontend/zeekrlife-official-pc/3d/prod/51273386118590137460/laya/LayaExport/'
rows=json.loads((ROOT.parent/'zeekr-007gt-assets/official-current-colour-names.json').read_text())
lookup={'河谷绿':('Z010PC090','senyelv'),'冰湖蓝':('Z010PC068','lan2'),'暗夜紫':('Z010PC070','shenmizi'),'冰川银':('Z010PC071','yin'),'晨雾米':('Z010PC072','mi'),'云雾粉':('Z010PC073','fen'),'旷境绿':('Z010PC074','lv'),'魔力红':('Z010PC069','hong'),'极夜黑':('Z010PC075','hei')}
def fetch(url):
 data=urllib.request.urlopen(url,timeout=30).read()
 return gzip.decompress(data) if data[:2]==b'\x1f\x8b' else data
def resolve(row):
 code,suffix=lookup[row['name']];material='car_paint_'+suffix
 material_url=BASE+'resources/car/cc1e/cc1emat/'+material+'.lmat'
 raw=fetch(material_url);props=json.loads(raw)['props'];pigment=props['Pigment_Color'];edge=props['Edge_Color']
 swatch='resources/paints/'+material+'.png';out=ROOT/swatch;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(fetch(row['swatch']))
 color='#'+''.join(f'{math.floor(max(0,min(1,c))*255+.5):02x}' for c in pigment[:3])
 return {'name':row['name'],'code':code,'color':color,'swatch':swatch,'material':material,'pigment':pigment,'edge':edge,'materialSource':material_url,'swatchSource':row['swatch'],'materialSha256':hashlib.sha256(raw).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:colors=list(pool.map(resolve,rows))
result={'sourcePage':'https://www.zeekrlife.com/toReserve?modelInfoId=9&modelYearCode=GMY_007_GT__02','sourceConfig':BASE+'json/config.json','verifiedDate':'2026-10-28','colors':colors}
(ROOT/'resources/official-paints.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps([{'name':c['name'],'color':c['color']} for c in colors],ensure_ascii=False))
