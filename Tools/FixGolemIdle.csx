// Run through Unity CLI eval; asset creation stays inside the live Editor.
if (UnityEditor.EditorApplication.isPlaying) throw new System.Exception("Exit Play mode first.");
var pipeline = UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline;
var actors = UnityEngine.Object.FindObjectsByType<SpriteFrameAnimator>(UnityEngine.FindObjectsInactive.Include, UnityEngine.FindObjectsSortMode.None);
var actor = System.Array.Find(actors, a => a.GetComponent<UnityEngine.SpriteRenderer>().sprite != null && UnityEditor.AssetDatabase.GetAssetPath(a.GetComponent<UnityEngine.SpriteRenderer>().sprite).EndsWith("Golem1_3.png"));
if (actor == null || actor.transform.childCount != 0) throw new System.Exception("Expected the original golem with no children; aborting.");
var original = actor.GetComponent<UnityEngine.SpriteRenderer>();
string folder = "Assets/@Resources/GolemIdle";
if (!UnityEditor.AssetDatabase.IsValidFolder(folder)) UnityEditor.AssetDatabase.CreateFolder("Assets/@Resources", "GolemIdle");
string path = folder + "/T_GolemParts.png";
if (UnityEditor.AssetDatabase.LoadMainAssetAtPath(path) != null) throw new System.Exception("Output already exists; do not overwrite.");
UnityEditor.AssetDatabase.CopyAsset("Assets/@Assets/Character/Golem1_3.png", path);
var importer = (UnityEditor.TextureImporter)UnityEditor.AssetImporter.GetAtPath(path);
importer.textureType = UnityEditor.TextureImporterType.Sprite;
importer.spriteImportMode = UnityEditor.SpriteImportMode.Multiple;
importer.filterMode = UnityEngine.FilterMode.Point;
importer.textureCompression = UnityEditor.TextureImporterCompression.Uncompressed;
importer.mipmapEnabled = false;
importer.spritePixelsPerUnit = 100;
importer.SaveAndReimport();
var factory = new UnityEditor.U2D.Sprites.SpriteDataProviderFactories();
factory.Init();
var provider = factory.GetSpriteEditorDataProviderFromObject(importer);
provider.InitSpriteEditorDataProvider();
var capability = provider.GetDataProvider<UnityEditor.U2D.Sprites.ISpriteFrameEditCapability>();
if (capability == null || !capability.GetEditCapability().HasCapability(UnityEditor.U2D.Sprites.EEditCapability.CreateAndDeleteSprite)) throw new System.Exception("Sprite creation capability unavailable.");
// Rectangles are measured in the original first frame, from its top-left.
var boxes = new UnityEngine.Rect[] { new UnityEngine.Rect(112,202,164,191), new UnityEngine.Rect(55,12,276,190), new UnityEngine.Rect(55,202,57,191), new UnityEngine.Rect(276,202,55,191), new UnityEngine.Rect(162,130,1,1) };
var names = new string[] { "BodyFeet", "Head", "LeftArm", "RightArm", "LidPixel" };
var rects = new UnityEditor.SpriteRect[boxes.Length];
var pairs = new System.Collections.Generic.List<UnityEditor.SpriteNameFileIdPair>();
for (int i=0;i<boxes.Length;i++) {
    var b=boxes[i]; var id=UnityEditor.GUID.Generate();
    rects[i]=new UnityEditor.SpriteRect { name=names[i], spriteID=id, rect=new UnityEngine.Rect(b.x,793-b.y-b.height,b.width,b.height), alignment=UnityEngine.SpriteAlignment.Center, pivot=new UnityEngine.Vector2(.5f,.5f) };
    pairs.Add(new UnityEditor.SpriteNameFileIdPair(names[i],id));
}
provider.SetSpriteRects(rects);
provider.GetDataProvider<UnityEditor.U2D.Sprites.ISpriteNameFileIdDataProvider>().SetNameFileIdPairs(pairs);
provider.Apply(); importer.SaveAndReimport();
var sprites=new System.Collections.Generic.Dictionary<string,UnityEngine.Sprite>();
foreach(var asset in UnityEditor.AssetDatabase.LoadAllAssetsAtPath(path)) if(asset is UnityEngine.Sprite s) sprites.Add(s.name,s);
var root=new UnityEngine.GameObject("P_GolemIdle");
var parts=new UnityEngine.Transform[4];
for(int i=0;i<4;i++) {
    var part=new UnityEngine.GameObject(names[i]); part.transform.SetParent(root.transform,false);
    var b=boxes[i]; part.transform.localPosition=new UnityEngine.Vector3((b.center.x-198)/100f,(198-b.center.y)/100f,0);
    var renderer=part.AddComponent<UnityEngine.SpriteRenderer>(); renderer.sprite=sprites[names[i]]; renderer.sharedMaterial=original.sharedMaterial; renderer.sortingLayerID=original.sortingLayerID; renderer.sortingOrder=original.sortingOrder; parts[i]=part.transform;
}
// Eyelids cover only the cyan eye interiors and move with the head.
var lids=new UnityEngine.Transform[2];
for(int i=0;i<2;i++) {
    var lid=new UnityEngine.GameObject(i==0?"LeftLid":"RightLid"); lid.transform.SetParent(parts[1],false);
    float eyeX=i==0?179f:261f;
    lid.transform.localPosition=new UnityEngine.Vector3((eyeX-boxes[1].center.x)/100f,(boxes[1].center.y-134f)/100f,0);
    lid.transform.localScale=new UnityEngine.Vector3(25,0,1);
    var renderer=lid.AddComponent<UnityEngine.SpriteRenderer>();renderer.sprite=sprites["LidPixel"];renderer.sharedMaterial=original.sharedMaterial;renderer.sortingLayerID=original.sortingLayerID;renderer.sortingOrder=original.sortingOrder+1;lids[i]=lid.transform;
}
var clip=new UnityEngine.AnimationClip { name="GolemIdle",frameRate=10 };
for(int p=1;p<4;p++) {
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(names[p],typeof(UnityEngine.Transform),"m_LocalPosition.x"),UnityEngine.AnimationCurve.Constant(0,1.8f,parts[p].localPosition.x));
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(names[p],typeof(UnityEngine.Transform),"m_LocalPosition.z"),UnityEngine.AnimationCurve.Constant(0,1.8f,0));
}
for(int e=0;e<2;e++) {
    string binding="Head/"+lids[e].name;
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(binding,typeof(UnityEngine.Transform),"m_LocalPosition.x"),UnityEngine.AnimationCurve.Constant(0,1.8f,lids[e].localPosition.x));
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(binding,typeof(UnityEngine.Transform),"m_LocalPosition.z"),UnityEngine.AnimationCurve.Constant(0,1.8f,0));
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(binding,typeof(UnityEngine.Transform),"m_LocalScale.x"),UnityEngine.AnimationCurve.Constant(0,1.8f,25));
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(binding,typeof(UnityEngine.Transform),"m_LocalScale.z"),UnityEngine.AnimationCurve.Constant(0,1.8f,1));
}
var settings=UnityEditor.AnimationUtility.GetAnimationClipSettings(clip);settings.loopTime=true;UnityEditor.AnimationUtility.SetAnimationClipSettings(clip,settings);
float[] motion={1,.8f,.3f,-.5f,-1,-1,-.5f,.3f,.8f,1};
float[] closed={0,.1f,.4f,.8f,1,1,.8f,.4f,.1f,0};
for(int p=1;p<4;p++) {
    var keys=new UnityEngine.Keyframe[11];
    for(int f=0;f<11;f++){float m=motion[f%10];float delta=p==1?m*.03f:-m*.02f;keys[f]=new UnityEngine.Keyframe(f*.18f,parts[p].localPosition.y+delta,float.PositiveInfinity,float.PositiveInfinity);}
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(names[p],typeof(UnityEngine.Transform),"m_LocalPosition.y"),new UnityEngine.AnimationCurve(keys));
}
for(int e=0;e<2;e++) {
    string binding="Head/"+lids[e].name;
    var sizeKeys=new UnityEngine.Keyframe[11];var posKeys=new UnityEngine.Keyframe[11];
    for(int f=0;f<11;f++){float h=25*closed[f%10];sizeKeys[f]=new UnityEngine.Keyframe(f*.18f,h,float.PositiveInfinity,float.PositiveInfinity);posKeys[f]=new UnityEngine.Keyframe(f*.18f,lids[e].localPosition.y-h/200f,float.PositiveInfinity,float.PositiveInfinity);}
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(binding,typeof(UnityEngine.Transform),"m_LocalScale.y"),new UnityEngine.AnimationCurve(sizeKeys));
    UnityEditor.AnimationUtility.SetEditorCurve(clip,UnityEditor.EditorCurveBinding.FloatCurve(binding,typeof(UnityEngine.Transform),"m_LocalPosition.y"),new UnityEngine.AnimationCurve(posKeys));
}
UnityEditor.AssetDatabase.CreateAsset(clip,folder+"/GolemIdle.anim");
var controller=UnityEditor.Animations.AnimatorController.CreateAnimatorControllerAtPath(folder+"/GolemIdle.controller");
controller.AddMotion(clip);root.AddComponent<UnityEngine.Animator>().runtimeAnimatorController=controller;
// Verify a full cycle before saving: static body, fixed x, bounded opposite motion.
float minHead=float.MaxValue,maxHead=float.MinValue;var fixedBody=parts[0].localPosition;float headBase=parts[1].localPosition.y;float armBase=parts[2].localPosition.y;
for(int f=0;f<10;f++) {
    clip.SampleAnimation(root,f*.18f+.001f);float h=parts[1].localPosition.y-headBase;float a=parts[2].localPosition.y-armBase;
    if(parts[0].localPosition!=fixedBody || UnityEngine.Mathf.Abs(h*2+a*3)>.0001f)throw new System.Exception("Idle motion verification failed.");
    for(int p=0;p<4;p++)if(UnityEngine.Mathf.Abs(parts[p].localPosition.x-(boxes[p].center.x-198)/100f)>.00001f)throw new System.Exception("Horizontal drift detected.");
    minHead=UnityEngine.Mathf.Min(minHead,h);maxHead=UnityEngine.Mathf.Max(maxHead,h);
}
if(maxHead-minHead>.0601f)throw new System.Exception("Head amplitude exceeds six source pixels.");
clip.SampleAnimation(root,0);
var prefab=UnityEditor.PrefabUtility.SaveAsPrefabAsset(root,folder+"/P_GolemIdle.prefab");UnityEngine.Object.DestroyImmediate(root);
UnityEditor.Undo.RecordObject(original,"Replace drifting golem idle");UnityEditor.Undo.RecordObject(actor,"Replace drifting golem idle");
original.enabled=false;actor.enabled=false;
var instance=(UnityEngine.GameObject)UnityEditor.PrefabUtility.InstantiatePrefab(prefab,actor.transform);instance.transform.localPosition=UnityEngine.Vector3.zero;instance.transform.localRotation=UnityEngine.Quaternion.identity;instance.transform.localScale=UnityEngine.Vector3.one;
UnityEditor.Undo.RegisterCreatedObjectUndo(instance,"Add fixed golem idle");UnityEditor.EditorUtility.SetDirty(actor);UnityEditor.EditorUtility.SetDirty(original);
UnityEditor.SceneManagement.EditorSceneManager.MarkSceneDirty(actor.gameObject.scene);UnityEditor.SceneManagement.EditorSceneManager.SaveScene(actor.gameObject.scene);UnityEditor.AssetDatabase.SaveAssets();
return "PASS: 10 samples; body and feet fixed; x drift=0; head peak-to-peak=6 source pixels; arms opposite; prefab="+folder+"/P_GolemIdle.prefab; pipeline="+pipeline?.GetType().Name;
