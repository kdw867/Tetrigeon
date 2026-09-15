using System;
using System.Collections.Generic;
using UnityEngine;

public class BagManager : MonoBehaviour
{
    public static BagManager Instance { get; private set; }

    public static event Action<TetrominoType[]> OnQueueChanged; // 다음 조각 미리보기 바뀔 때 알림 (NEXT UI용)

    // NEXT preview count.
    private const int PreviewCount = 5;

    private static readonly TetrominoType[] AllTypes =
    {
        TetrominoType.I, TetrominoType.J, TetrominoType.L, TetrominoType.O,
        TetrominoType.S, TetrominoType.T, TetrominoType.Z
    };

    private readonly Queue<TetrominoType> queue = new();

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;

        while (queue.Count < PreviewCount + 1)
            FillBag();
    }

    public TetrominoType Dequeue()
    {
        TetrominoType next = queue.Dequeue();
        while (queue.Count < PreviewCount + 1)
            FillBag();
        OnQueueChanged?.Invoke(PeekNext()); // 큐 바뀔 때마다 최신 미리보기 알림
        return next;
    }

    public TetrominoType[] PeekNext()
    {
        TetrominoType[] preview = new TetrominoType[PreviewCount];
        int i = 0;
        foreach (TetrominoType type in queue)
        {
            if (i >= PreviewCount) break;
            preview[i] = type;
            i++;
        }
        return preview;
    }

    private void FillBag()
    {
        List<TetrominoType> bag = new List<TetrominoType>(AllTypes);
        for (int i = bag.Count - 1; i > 0; i--)
        {
            int j = UnityEngine.Random.Range(0, i + 1);
            (bag[i], bag[j]) = (bag[j], bag[i]);
        }
        foreach (TetrominoType type in bag)
            queue.Enqueue(type);
    }
}
