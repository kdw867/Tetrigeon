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

    // 수정여왕 회전 금지: 발동 직후 새로 나올 미노(큐 0번)는 그대로 두고, 그다음 NEXT 2개(큐 1·2번)만 개체째 잠금 (고정될 때까지 회전 불가)
    // 이 능력은 미노가 고정된 직후, 다음 미노를 큐에서 꺼내기 전에 발동하므로 큐 0번이 곧 등장할 미노다.
    // 잠금은 MinoState 에 저장돼 큐·Hold 를 옮겨 다녀도 그 미노를 따라가고, 이미 잠긴 미노가 대상이면 그대로 둔다
    public void LockNextRotation()
    {
        int index = 0; // 큐 안의 순서 (0 = 발동 직후 새로 나올 미노)
        foreach (MinoState mino in queue)
        {
            if (index == 1 || index == 2) mino.RotationLocked = true; // 1·2번만 잠금 (0번과 세 번째 이후는 건드리지 않음)
            index++; // 다음 순서로
            if (index > 2) break; // 3번 이후는 볼 필요 없음
        }
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
