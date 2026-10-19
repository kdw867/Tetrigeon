using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

// 씬 전환과 일시정지 중에도 UI 효과음이 끊기지 않는 공용 재생기.
public class GameSound : MonoBehaviour
{
    private static GameSound instance;
    private readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();
    private AudioSource effects, ui;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
    private static void ResetStatics() { instance = null; }

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void Boot()
    {
        if (instance == null) new GameObject("GameSound").AddComponent<GameSound>();
    }

    private void Awake()
    {
        if (instance != null && instance != this) { Destroy(gameObject); return; }
        instance = this;
        AudioListener.volume = 1f;
        DontDestroyOnLoad(gameObject);
        effects = CreateSource();
        ui = CreateSource();
        foreach (AudioClip clip in Resources.LoadAll<AudioClip>("Audio/VARCO")) clips[clip.name] = clip;
        SceneManager.sceneLoaded += AttachButtons;
        CombatManager.OnPlayerAttack += PlayerAttack;
        PieceSpawner.OnPieceLocked += PieceLocked;
    }

    private AudioSource CreateSource()
    {
        AudioSource source = gameObject.AddComponent<AudioSource>();
        source.playOnAwake = false;
        source.spatialBlend = 0f;
        source.ignoreListenerPause = true;
        source.volume = GameSettings.SfxVolume;
        return source;
    }

    private void Update() { effects.volume = ui.volume = GameSettings.SfxVolume; }

    private void OnDestroy()
    {
        if (instance != this) return;
        SceneManager.sceneLoaded -= AttachButtons;
        CombatManager.OnPlayerAttack -= PlayerAttack;
        PieceSpawner.OnPieceLocked -= PieceLocked;
        instance = null;
    }

    private void AttachButtons(Scene scene, LoadSceneMode mode)
    {
        foreach (GameObject root in scene.GetRootGameObjects())
            foreach (UnityEngine.UI.Button button in root.GetComponentsInChildren<UnityEngine.UI.Button>(true))
                if (button.GetComponent<ButtonSound>() == null) button.gameObject.AddComponent<ButtonSound>();
    }

    public static void Play(string name, bool isUI = false)
    {
        if (instance == null || !instance.clips.TryGetValue(name, out AudioClip clip)) return;
        AudioSource source = isUI ? instance.ui : instance.effects;
        source.volume = GameSettings.SfxVolume;
        if (isUI) { source.clip = clip; source.Play(); }
        else source.PlayOneShot(clip);
    }

    private void PlayerAttack() { Play("LemyAttack"); }

    public static void PlayPlayerHit(EnemyTier attacker)
    {
        switch (attacker)
        {
            case EnemyTier.Normal: Play("LemyHitLarva"); break;
            case EnemyTier.Epic: Play("LemyHitSentinel"); break;
            case EnemyTier.Boss: Play("LemyHitQueen"); break;
        }
    }

    private void PieceLocked(TetrominoType type, TSpinType spin, int lines, IReadOnlyList<TetrominoType> crystals)
    {
        if (spin != TSpinType.None && lines > 0) Play("TSpin");
        if (crystals.Count > 0) Play("CrystalBreak"); // 여러 칸이 동시에 깨져도 한 번만 재생
    }
}
