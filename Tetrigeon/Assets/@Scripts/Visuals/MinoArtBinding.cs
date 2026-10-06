using UnityEngine; // 스프라이트 컴포넌트 사용

// 블록이 고정되거나 미리보기에 있어도 강화 변경 시 그림만 갱신한다.
[RequireComponent(typeof(SpriteRenderer))] // 렌더러가 있는 블록에만 부착
public sealed class MinoArtBinding : MonoBehaviour // 칸별 외형 연결
{
    private SpriteRenderer target; // 기존 렌더러 보관
    private TetrominoType type; // 미노 종류 보관
    private int cellIndex; // 원래 칸 순서 보관
    public TetrominoType SourceType => type; // 이 칸이 속한 미노 종류 (수정 칸이 줄 삭제될 때 발동할 능력의 원본)
    public bool IsCrystal => MinoUpgrades.IsCrystalCell(type, cellIndex); // 수정 칸인지 (강화는 보상 화면에서만 바뀌고 그때 보드가 비워지므로 고정된 뒤에도 같은 값)
    public void Initialize(TetrominoType value, int index) // 생성 시 칸 정보 설정
    {
        target = GetComponent<SpriteRenderer>(); // 같은 오브젝트의 렌더러 사용
        type = value; // 종류 저장
        cellIndex = index; // 칸 번호 저장
    }
    private void OnEnable() // 활성화된 칸만 변경 구독
    {
        MinoUpgrades.OnChanged += Refresh; // 강화와 런 초기화 모두 반영
        Refresh(); // 재활성화 시 최신 단계 반영
    }
    private void OnDisable() // 제거 또는 비활성화 시 정리
    {
        MinoUpgrades.OnChanged -= Refresh; // 삭제된 블록의 구독 해제
    }
    private void Refresh() // 같은 규격의 그림만 교체
    {
        if (target != null) target.sprite = PieceVisuals.GetMinoSprite(type, cellIndex); // 위치·회전·크기·투명도 유지
    }
}
