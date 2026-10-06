using System;
using System.Collections.Generic;
using UnityEngine;

public class BagManager : MonoBehaviour
{
    public static BagManager Instance { get; private set; }

    public static event Action<MinoState[]> OnQueueChanged; // 다음 조각 미리보기 바뀔 때 알림 (NEXT UI용, 여왕 스킬로 바뀐 모양·회전 금지 포함)

    // NEXT preview count.
    private const int PreviewCount = 5;

    private static readonly TetrominoType[] AllTypes =
    {
        TetrominoType.I, TetrominoType.J, TetrominoType.L, TetrominoType.O,
        TetrominoType.S, TetrominoType.T, TetrominoType.Z
    };

    private readonly Queue<MinoState> queue = new(); // 미노마다 종류와 여왕 스킬 상태를 함께 보관

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

    public MinoState Dequeue() // 다음 미노를 상태째 꺼냄
    {
        MinoState next = queue.Dequeue();
        while (queue.Count < PreviewCount + 1)
            FillBag();
        OnQueueChanged?.Invoke(PeekNext()); // 큐 바뀔 때마다 최신 미리보기 알림
        return next;
    }

    // Top Out 시 남은 조각을 버리고 새 가방으로 다시 시작
    public void ResetBag()
    {
        queue.Clear(); // 현재 가방의 남은 조각 전부 폐기
        while (queue.Count < PreviewCount + 1)
            FillBag(); // 새 가방으로 큐 다시 채움
        OnQueueChanged?.Invoke(PeekNext()); // NEXT 미리보기 갱신
    }

    public MinoState[] PeekNext() // NEXT에 보이는 미노들 (큐 안의 같은 객체라 수정하면 실제 미노도 바뀜)
    {
        MinoState[] preview = new MinoState[PreviewCount];
        int i = 0;
        foreach (MinoState mino in queue)
        {
            if (i >= PreviewCount) break;
            preview[i] = mino;
            i++;
        }
        return preview;
    }

    // 수정여왕 증식: 발동 순간 NEXT에 보이는 미노 전부에 칸을 하나씩 무작위로 붙임 (이후 새로 들어오는 미노는 영향 없음)
    public void GrowPreview()
    {
        foreach (MinoState mino in PeekNext())
            mino.GrownCell = TetrominoData.PickGrownCell(mino.Type); // 미노마다 붙일 자리를 따로 고름
        OnQueueChanged?.Invoke(PeekNext()); // 바뀐 모양으로 NEXT 갱신
    }

    // 수정여왕 회전 금지: NEXT 맨 위 미노 1개 (고정될 때까지 회전 불가)
    public void LockNextRotation()
    {
        queue.Peek().RotationLocked = true; // 바로 다음에 나올 미노
        OnQueueChanged?.Invoke(PeekNext()); // 침식 표시로 NEXT 갱신
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
            queue.Enqueue(new MinoState(type)); // 새 미노는 변형 없이 추가
    }
}
