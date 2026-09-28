using UnityEngine;

// 현재 보유한 미노 강화를 왼쪽 패널에 누적 표시. 강화 데이터는 MinoUpgrades를 그대로 읽기만 한다.
public class MinoUpgradeListView : MonoBehaviour
{
    private static readonly TetrominoType[] DisplayOrder = // 표시 순서 고정
    {
        TetrominoType.I, TetrominoType.J, TetrominoType.L, TetrominoType.O,
        TetrominoType.S, TetrominoType.T, TetrominoType.Z
    };

    [SerializeField] private MinoUpgradeRow rowPrefab; // 한 줄 프리팹
    [SerializeField] private Transform rowRoot; // 줄들이 붙을 부모
    [SerializeField] private TextMesh emptyText; // 강화가 없을 때 보여줄 안내 문구
    [SerializeField] private float rowSpacing = 0.7f; // 줄 간격
    [SerializeField] private float firstRowY = 0f; // 첫 줄의 세로 위치

    private MinoUpgradeRow[] rows; // 종류별 줄 (한 번만 만들고 이후에는 켜고 끄기만 함)

    private void Awake()
    {
        BuildRows(); // 7종 줄을 미리 만들어 둠
    }

    private void OnEnable()
    {
        MinoUpgrades.OnChanged += Refresh; // 강화가 바뀔 때만 갱신
        Refresh(); // 켜질 때 현재 강화 상태를 한 번 읽음
    }

    private void OnDisable()
    {
        MinoUpgrades.OnChanged -= Refresh; // 중복 구독 방지
    }

    // 7종 줄을 한 번만 생성 (재활성화해도 다시 만들지 않음)
    private void BuildRows()
    {
        if (rows != null) return;

        rows = new MinoUpgradeRow[DisplayOrder.Length];
        for (int i = 0; i < DisplayOrder.Length; i++)
        {
            MinoUpgradeRow row = Instantiate(rowPrefab, rowRoot); // 프리팹으로 줄 생성
            row.name = "Row_" + DisplayOrder[i];
            row.Build(DisplayOrder[i]); // 종류별 미노 그림 구성
            row.gameObject.SetActive(false); // 강화 전에는 숨김
            rows[i] = row;
        }
    }

    // 강화된 종류만 순서대로 붙여서 표시
    private void Refresh()
    {
        int shown = 0; // 지금까지 표시한 줄 수 (빈 자리 없이 위에서부터 채움)
        for (int i = 0; i < DisplayOrder.Length; i++)
        {
            int level = MinoUpgrades.GetLevel(DisplayOrder[i]); // 실제 강화 데이터를 읽음
            bool upgraded = level > 0; // 0은 강화한 적 없음

            rows[i].gameObject.SetActive(upgraded);
            if (!upgraded) continue;

            rows[i].transform.localPosition = new Vector3(0f, firstRowY - rowSpacing * shown, 0f); // 위에서부터 차례로 배치
            rows[i].SetLevel(level); // 같은 종류는 이 줄의 레벨만 갱신
            shown++;
        }

        if (emptyText != null) emptyText.gameObject.SetActive(shown == 0); // 하나라도 있으면 안내 문구 숨김
    }
}
