using UnityEngine;

// 코어의 남은 홀드 충전량을 네 룬의 점등으로만 표시한다.
// UI 중앙 빛을 독립적으로 제어하며 골렘 가슴 코어의 기존 동작은 유지한다.
public class HoldChargeView : MonoBehaviour
{
    [SerializeField] private SpriteRenderer[] runeRenderers; // 룬 4개 (왼쪽부터 1번)
    [SerializeField] private SpriteRenderer occupancyRenderer; // 보관 미노가 있을 때 켜지는 중앙 테두리

    private void OnEnable()
    {
        PieceSpawner.OnHoldChargesChanged += UpdateDisplay; // 충전량·진행도 바뀔 때마다 갱신
        PieceSpawner.OnHoldChanged += UpdateOccupancy; // 보관 상태 변화 구독
        Refresh(); // 재활성화 시 현재 상태만 읽어 표시 복원
    }

    private void OnDisable()
    {
        PieceSpawner.OnHoldChargesChanged -= UpdateDisplay; // 이벤트 구독 해제
        PieceSpawner.OnHoldChanged -= UpdateOccupancy; // 보관 상태 구독 해제
    }

    private void Start()
    {
        Refresh(); // 매니저 초기화 후 초기 표시 보정
    }

    private void Refresh() // 충전 상태를 바꾸지 않고 UI만 갱신
    {
        PieceSpawner spawner = PieceSpawner.Instance; // 매니저 Awake가 끝난 뒤 현재 상태를 읽음
        if (spawner == null) return; // 매니저가 없으면 표시할 것 없음

        UpdateDisplay(spawner.HoldCharges, spawner.RechargeProgress); // 켜질 때는 읽기만 하고 충전하지 않음
        UpdateOccupancy(spawner.HeldType); // 보관 상태도 복원
    }

    private void UpdateDisplay(int charges, int progress)
    {
        if (runeRenderers != null) // 배열 자체가 미연결인 경우도 보호
            for (int i = 0; i < runeRenderers.Length; i++) // 남은 충전량만큼 왼쪽부터 룬 점등
                if (runeRenderers[i] != null) runeRenderers[i].enabled = i < charges; // 충전량만큼 표시

    }

    private void UpdateOccupancy(TetrominoType? type) // 룬 개수와 독립적인 중앙 빛
    {
        if (occupancyRenderer != null) occupancyRenderer.enabled = type.HasValue; // 미노가 보관되면 점등
    }
}
