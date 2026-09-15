using UnityEngine;
using UnityEngine.SceneManagement;

public class TempSceneDump : MonoBehaviour
{
    private void Awake()
    {
        foreach (GameObject root in SceneManager.GetActiveScene().GetRootGameObjects())
        {
            Dump(root.transform, 0);
        }
    }

    private void Dump(Transform t, int depth)
    {
        Debug.Log($"[DUMP] {new string(' ', depth * 2)}{t.name}");
        for (int i = 0; i < t.childCount; i++)
            Dump(t.GetChild(i), depth + 1);
    }
}
