# 007 GT 改装预览

在线预览：[打开 007 GT 改装预览](https://zeekr007gtpreview-10q3y3hd.maozi.io/)

本地试验网页，使用官网选配页下载的 LayaAir 007 GT 模型，直接由 LayaAir 渲染，无需先转换为 GLB。

## 启动

macOS 可双击「启动预览.command」，会启动本地服务并打开浏览器。

也可以在本目录运行：

```sh
python3 tools/start-preview.py
```

然后打开 http://127.0.0.1:8765/ 。使用 HTTP 服务启动，不能直接双击 HTML。

## 功能

- 拖动旋转、滚轮缩放，前侧／侧面／后侧视角与自动旋转。
- 官网当前 9 种车色、自定义颜色和十六进制颜色输入。包含河谷绿、冰湖蓝、暗夜紫、冰川银、晨雾米、云雾粉、旷境绿、魔力红、极夜黑；色板图与基础色值来自官网资源，默认显示名称便于识别。
- 亮面与哑光模拟。
- 六种官网轮毂模型切换。
- 使用浏览器 localStorage 保存多套命名搭配，在可展开列表中手动选择；每次进入或刷新均显示默认冰川银，不自动应用已保存方案。
- 桌面侧栏和手机上下布局。
- 明亮的无台座柔光摄影棚：浅白曲面背景与平地、宽幅柔光反射、车轮接触阴影与柔化实时投影，没有圆盘或抬高的平台。
- 物理车漆材质与清漆层，颜色和质感平滑过渡；高光改为更宽、更柔和的白色柔光箱反射。
- 紫白内饰使用官网 `Z010PC027` 对应的 `neishi_zibai.jpg` 原始贴图，同时用于 `neishi` 和 `neishi_jinshu` 两个材质，沿用官网共用几何；来源与文件校验值保存在 `interior-source.json`。前挡玻璃降低深色遮挡并避免投下不透明阴影，方便查看浅色座舱。
- 带阻尼的相机旋转和缩放、松手惯性、平滑视角切换、自动旋转渐入渐出，手机双指缩放。

- 局部改色：开启开关，悬停高亮独立部件，点击后单独设置颜色，以及亮面、哑光、金属、碳纤维或透明材质。
- 041、014、015 设为同一组件组：悬停任意成员会高亮全组，点击任意成员后同步修改三处的颜色与材质，支持整组恢复。分组使用固定网格与材质槽 ID，不受轮毂切换影响；统计按一组计算。
- 原 044 合并饰件拆成 `044-01` 至 `044-13` 共 13 个区域标识、21 个网格岛；左右对应件跟随所在组件组联动。其余原编号保持不变，045 灯组材质保持独立。旧方案中的整块 044 改色会展开到全部新区域，新方案按区域保存。
- 支持恢复一个部件或组件组、清除全部局部改色，以及将局部配置随方案保存和恢复。旧方案如存在组内不同设置，优先采用 041，其次 014、015 的设置统一整组。窄屏预览固定在上方，控件单独滚动。

## 验证与限制

已在浏览器验证模型显示、颜色切换、两种光泽、多个轮毂、视角按钮、方案保存和刷新恢复；检查了桌面及窄屏布局。白棚版本额外验证了浅色和绿色车漆、接触阴影及白光材质；当前浏览器采样约 60 fps，实际帧率取决于设备。局部改色验证了前机盖精确命中、仅前机盖染色、碳纤维与透明材质，以及局部配置保存、刷新恢复。

当前无台座版本核对了实际加载的紫白内饰贴图、材质脚本语法、平地接触阴影、前侧视角、局部配色方案恢复与桌面／窄屏布局。实时阴影每两帧更新一次，避免在相机旋转时每帧重算同一静态模型的阴影。地面直接对齐轮胎最低点，不改变车身或轮毂原点。

车壳导出根节点带有 `1.02` 倍缩放，而内饰和轮毂根节点原本没有；现在从车壳读取同一缩放并应用于内饰及所有轮毂选项，避免轮子偏小、轴心向中间收。已从完整侧面核对前后轮的轮眉位置。

这是视觉搭配试验，色板为自定义示例；显示颜色、漆面光泽及灯光不代表实际车漆或改色膜色卡。中性白光不等于经过校准的色彩管理或光谱渲染。轮毂按钮图案是示意图，实际效果以三维预览为准。局部改色以独立网格和子材质为单位；044 另按几何连通区域拆分，对称部分配对。一个拆分区域内相连的表面会一起更改。没有车辆尺寸适配或改装工程计算。手机支持单指旋转和双指缩放。

代码入口为 `app.js`，部件拾取、悬停与独立材质在 `local-paint.js`，摄影棚背景、灯光、车漆适配与接触阴影在 `studio.js`，样式为 `style.css`。车身车漆适配成 Laya PBR 材质以接收白光和实时阴影；轮毂原材质改用中性环境图，保留模型细节。接触阴影为程序生成的平滑纹理，实时投影由主光源生成。引擎在 `libs/`，模型与材质在 `resources/car/cc1e/`，自定义着色器在 `resources/car/shader/` 及 `internal/shaderBlueprint/`。运行时静态资源均从本机读取。

模型、材质和原引擎文件来自极氪官网公开选配页；版权归原权利人，下载不等于获得再发布许可。本版本供本地试验。

044 分区清单为 `resources/parts/044.json`，可运行 `python3 tools/build-044-parts.py` 从原始 LM 重新生成。脚本核对原始三角面完整性，并以镜像曲面距离小于 4 mm 验证左右配对（最大误差约 2.7 mm）；运行时克隆原顶点缓冲并逐字节核对，只重排三角面与材质槽。浏览器验证了 044-09 的颜色／哑光左右联动，以及 044-01 保持独立。`node tests/local-paint.test.cjs` 检查分区隔离、分组高亮／恢复、保存回读、旧方案迁移、独立设置优先级，以及 041／014／015 分组和 045 的兼容性。

新增组合：`044-08 / 083 / 092 / 044-12` 归为一组（包含两个 044 区域的全部左右对应件，共 6 个材质区域）；`016 / 027 / 017` 归为另一组。合并时移除被替代的旧组，避免保存恢复时出现重叠组覆盖。两组均支持整组悬停、改色、材质、恢复及保存；旧配置依照各组声明顺序统一。

113 按 14 个连通区域拆成 `113-01` 至 `113-10` 共 10 个编辑单元，其中 4 组左右配对、6 个中央区域独立；完整保留 4610 个三角面。分区文件为 `resources/parts/113.json`，可运行 `python3 tools/build-044-parts.py --part 113` 重建。113 与 044 共用经过顶点字节一致性、原始三角面完整性校验的拆分流程。浏览器验证了新合并组的选取与哑光改色，以及 113-02 独立改色和恢复；测试覆盖两组联动与 113 保存迁移。

当前合并组统一使用短编号：

| 编号 | 原组件 |
| --- | --- |
| G01 | 041、014、015 |
| G02 | 044-08、083、092、044-12、071、049，包含左右对应件，共 8 个材质区域 |
| G03 | 017 与 027 的车窗饰件区域（027-02～027-04），已移除后保险杠下部 |
| G04 | 044-06、113-03，包含左右对应件，共 4 个材质区域 |
| G05 | 040、013、118 |
| G06 | 016 与 027-01，后保险杠下方饰件 |

旧部件 ID 保留用于方案恢复，界面名称、悬停提示和方案摘要统一显示短组号。G04/G05 与扩展 G02 的颜色、材质、恢复和保存回读已经通过测试。

官网车色清单在 `resources/official-paints.json`，记录名称、选配码、原始材质、Pigment_Color、色板图及来源 URL/校验值。图片保存在 `resources/paints/`，运行时无需联网；基础色按官网材质值适配到本页 PBR 白光摄影棚。`tools/sync-official-paints.py` 可根据已核实的官网色名映射同步资源。浏览器已核对官网九种颜色名称并验证冰湖蓝按钮、色值和实际车漆切换。

部件材质新增「完全隐藏」：按材质区域裁掉表面及其实时投影，组件组整体联动，隐藏区域不参与拾取与悬停高亮。侧栏的「已隐藏」列表支持重新选中，切换其他材质或恢复部件即可显示；隐藏设置随方案保存和恢复。单元测试覆盖分组隐藏、恢复、保存回读、其他材质槽隔离；浏览器已验证前机盖隐藏、穿透拾取及从列表恢复。

姿态调节位于「04 悬挂与轮距」：悬挂高度 −80 至 +60 mm，车壳和内饰同步升降，轮胎保持原地贴地；轮毂 ET 调整量 −40 至 +40 mm，四轮同步，负值向外、正值向内。数值相对于未修改模型位置，不推定原厂绝对 ET，按模型单位 1 m 换算，仅作姿态视觉预览。位置从初始变换计算并平滑过渡，避免反复调整累积偏差；支持恢复原厂、换轮毂保留设置、保存与刷新恢复。`node tests/fitment.test.cjs` 验证升降隔离、对称 ET、距离、无漂移、恢复、输入范围与六种轮毂层级；浏览器验证了双向极值、样式 05 换装及保存回读。

后保险杠下方已从 G03 独立为 G06。027 原网格含后包围下饰件及三组车窗饰件，现按连通区域拆分，保留全部 2597 个三角面与原顶点属性；016 和 027-01 合并为 G06，其余 027 区域与 017 保持 G03 联动。分区清单 `resources/parts/027.json` 可用 `python3 tools/build-044-parts.py --part 027` 重建。旧 027 整体设置会迁移到新分区，原 G03 完整保存方案仍能恢复两组配色。测试验证独立颜色／隐藏／恢复和保存迁移；浏览器验证后下包围命中 G06 及冰湖蓝仅应用于后下部，车窗饰件保持原样。

环境明度微调：仅降低摄影棚墙面渐变、地面反射底色与远雾／相机背景灰度；三盏白光的强度、环境光、反射环境图和车辆材质保持不变。主光实时投影强度由 0.14 调为 0.32，程序接触阴影增大横纵覆盖范围并提高浓度，轮胎附近保留较集中的软接触阴影。浏览器已在侧视角验证原厂高度及 +60 mm 升高后的车底与地面层次。

搭配库逻辑在 `design-library.js`：新保存始终追加条目，完整记录全车颜色、漆面、轮毂、悬挂、ET 和局部材质；旧 `007gt-design` 自动迁入「之前保存的搭配」，不再覆盖默认启动状态。列表可折叠，可选填名称，也可一键应用默认配色。切换搭配先清除旧局部覆盖，再加载所选方案，防止不同方案互相叠加。`node tests/design-library.test.cjs` 验证迁移幂等、追加保存、独立副本、写入失败保留旧数据以及默认启动；浏览器验证了旧方案与冰湖蓝切换、局部设置清理、列表持久化及刷新显示冰川银。

搭配列表支持手动管理：每行「用当前配置更新」替换该条的完整车辆配置，保留名称与 ID，其他条目保持不变；「删除」将条目标为已删除，从有效列表移除，展开回收站可恢复。回收站与已更新配置在刷新后继续保留，删除全部条目也不会重新导入旧单方案。存储写入失败时不提前修改界面。单元测试覆盖更新隔离、完整配置副本、删除／恢复、失败写入及旧数据防重导入；浏览器验证更新为哑光、删除、刷新后恢复，再还原原来的亮面搭配。

亮面车漆优化：光滑度 0.92、清漆层 0.85、清漆粗糙度 0.07，全车亮面和局部亮面一致，哑光及其他材质保留原参数。修复 Laya `SolidColor` 环境模式忽略 `iblTex` 的问题，启用球谐／IBL，使用常量球谐项保留原来的中性漫反射环境光；三盏灯强度、场景反射强度和摄影棚背景保持原设置。浏览器已验证白银与深蓝亮面、反射显示和无渲染错误。

颜色区新增常用自定义色：先调色，再填写可选名称并点击「添加当前颜色」，常用色保存到独立的 `007gt-common-colors`；点击可应用于全车或当前选中的部件。相同十六进制色值不重复添加，重新填写名称后添加可更新名称；空名称用色值显示。色板不会更改启动时默认冰川银，也不覆盖搭配库。`node tests/custom-palette.test.cjs` 验证存储、去重、命名、无效值与失败写入隔离；浏览器验证自定义输入、命名保存、刷新后保留和点击切换。

Wheel upgrades: Grab3D Alloy Wheel (CC0, 16940 triangles, public OBJ download), plus original generic six-spoke and cross-mesh adaptations using the factory tires. Provenance, license and original assets are retained in resources/wheels/public/ and resources/wheels/source.json. tools/convert-public-wheel.py normalizes the OBJ, preserves normals/UVs and packs metallic/smoothness. These generic adaptations are not branded product replicas.

Rim diameter is adjustable from 18 to 22 inches in 0.5-inch steps. Radial deformation moves the rim/bead and interpolates the sidewall while preserving the tire outer diameter, axle positions, body height and ground. All changes derive from immutable vertex copies. Picking uses refreshed world bounds and mesh geometry caches. Rim size and new wheel codes are saved with designs; fresh loads still use the default appearance. Tests verify 18/22-inch bead radii, fixed tire tread radius, unchanged body height and drift-free roundtrips. Browser QA covers all three additions and restoring a saved 20-inch public wheel design.

Precision wheel replacement: R3Dstudios R50 high-poly wheel, downloaded from https://r3dstudios.itch.io/r3d-multi-spoke-wheel-free-3d-game-asset-glb. The creator describes it as suitable for renders/showcases/modding; no named CC license is asserted. The original ZIP and GLB are retained in resources/wheels/r3d/original; model.json records author/source, SHA-256 and adaptation details. The converted model preserves all 253733 triangles per wheel, partitions indices losslessly into 8 meshes, retains rim detail, straightens the axis and uses a fresh silver or graphite finish. The three previous low-detail additions are hidden from the picker; saved legacy codes remain readable. This is one model in two finishes.

Run python3 tools/convert-r3d-wheel.py to rebuild. The bead radius is calibrated from the tire inner boundary, not the maximum radius of the rim assembly. The existing 18-22 inch fixed-tire-diameter deformation is retained. Vertex working buffers are reused; rim changes apply once per input rather than repeatedly interpolating a large mesh. Wheel switching releases replaced instance meshes. Browser QA checked both finishes, full-car and close views, 22-inch size and rendering errors.


新增 Vossen VFS2（细辐）和 VFS4（内凹），作者 jonver87，CC BY 4.0。使用作者在 Sketchfab 说明中公开提供的 MediaFire 原文件；来源、许可、校验值与适配记录保存在 resources/wheels/vossen/ 各款 model.json。转换脚本 tools/convert-vossen-wheels.py 保留原 OBJ 全部三角面、法线、UV 和材质分区，分别为 199721 / 675089 个三角面。

所有新增轮圈均只替换轮圈，保留官网原车四条轮胎的材质对象、颜色与胎纹；R3D 下载资源自带的轮胎、刹车不再装载到车辆，旧 PUBLIC 轮胎几何也被过滤。轮圈尺寸仍为 18–22 寸，轮胎外径固定，胎壁随尺寸调整；每个轮圈单独记录原始胎口比例。

轮圈匹配修复：原车轮胎实测胎口半径约 0.259027 m，不能直接用 19 寸的名义半径 0.2413 m 当作胎口。新增轮圈逐轮测量原胎网格，保留 19 寸时的原始胎口和外径，改尺寸时按同一胎口基准变化；轮圈外沿比胎口多覆盖 2 mm，消除透空缝隙。轮圈统一做径向缩放，轮胎单独做胎壁插值。VFS2/VFS4 的轴向深度按原胎宽度重新匹配，外沿置于胎肩内 4 mm，轮辐及轮心保留浅内凹；实际原始网格检查轮心／轮辐与原车卡钳至少相隔约 41 mm。法线按非均匀变换重新归一化，原胎颜色、胎纹与材质保持。临时网格在注册后释放。`tests/fitment.test.cjs` 验证 18/19/22 寸贴合及外径不变，`tests/wheel-depth.test.cjs` 用真实两款网格验证径向形状、UV、法线和刹车间距；浏览器核对两款轮圈与18/22寸。
