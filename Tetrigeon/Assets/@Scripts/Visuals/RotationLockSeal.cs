using UnityEngine;

// NEXT·HOLD·조작 중인 미노에 공통으로 쓰는 회전 잠금 표식 (프리팹의 스프라이트를 항상 불투명하게 그대로 표시)
[RequireComponent(typeof(SpriteRenderer))]
public class RotationLockSeal : MonoBehaviour
{
    private static RotationLockSeal prefab; // 공용 표식 프리팹 캐시

    public static RotationLockSeal Create(Transform parent) // 미노 표시 아래 공용 프리팹 생성
    {
        if (prefab == null) prefab = Resources.Load<RotationLockSeal>("UI/RotationLock/P_RotationLockSeal"); // 최초 로드
        return Instantiate(prefab, parent, false); // 부모 중앙에 원래 크기로 배치
    }
}
