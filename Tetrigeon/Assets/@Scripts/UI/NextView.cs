using UnityEngine;

// 다음에 나올 조각 5개를 보드 옆 월드 좌표에 세로로 미리보기 (맨 위가 바로 다음 조각)
public class NextView : MonoBehaviour
{
    [SerializeField] private float slotSpacingInCells = 3f; // 슬롯끼리 세로 간격 (셀 단위)

    private GameObject[] slots; // 조각별 컨테이너

    private void Start()
    {
        UpdateDisplay(BagManager.Instance.PeekNext()); // 시작할 때 현재 큐로 한 번 표시
    }

    private void OnEnable()
    {
        BagManager.OnQueueChanged += UpdateDisplay; // 큐 바뀔 때마다 갱신
    }

    private void OnDisable()
    {
        BagManager.OnQueueChanged -= UpdateDisplay; // 이벤트 구독 해제
    }

    private void UpdateDisplay(MinoState[] minos)
    {
        ClearSlots(); // 기존 미리보기 지우기
        slots = new GameObject[minos.Length];

        for (int slot = 0; slot < minos.Length; slot++)
        {
            GameObject container = new GameObject($"Slot_{slot}"); // 조각 하나를 담는 컨테이너
            container.transform.SetParent(transform);
            container.transform.localPosition = new Vector3(0f, -slot * slotSpacingInCells * GridManager.CellSize, 0f);

            MinoState mino = minos[slot]; // 이 슬롯의 미노 (여왕 스킬 상태 포함)
            Vector2Int[] cells = mino.GetCells(0); // 스폰 모양 그대로 표시 (증식 칸 포함)
            Vector2 boundsCenter = TetrominoData.GetSpawnBoundsCenter(mino.Type, mino.GrownCell); // 모양 중심 (박스 정중앙 정렬용)
            for (int i = 0; i < cells.Length; i++) // 원본 칸 순서를 유지하며 미리보기 생성
            {
                Vector2Int cell = cells[i]; // 현재 칸 좌표
                GameObject block = new GameObject("Block");
                block.transform.SetParent(container.transform);
                block.transform.localPosition = new Vector3(
                    (cell.x - boundsCenter.x) * GridManager.CellSize,
                    (cell.y - boundsCenter.y) * GridManager.CellSize,
                    0f);

                SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
                PieceVisuals.ApplyMinoArt(spriteRenderer, mino.Type, i, 1f, 10); // 원래 미노 색과 칸별 아트 유지
                spriteRenderer.sortingOrder = 10;
            }

            if (mino.RotationLocked) RotationLockSeal.Create(container.transform); // 중앙 정렬된 슬롯에 잠금 표식 추가
            slots[slot] = container;
        }
    }

    private void ClearSlots()
    {
        if (slots == null) return;
        foreach (GameObject slot in slots)
            if (slot != null) Destroy(slot); // 이전 컨테이너 삭제
        slots = null;
    }
}
