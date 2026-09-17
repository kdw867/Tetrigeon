// Plan.md 6절의 데미지 표를 그대로 계산 (가방 종료 시 합산해서 한 번에 적용)
public static class CombatDamage
{
    // 줄을 지운 한 번의 결과에 대한 데미지. 줄을 못 지웠으면 T스핀이어도 0.
    public static int Calculate(TSpinType tSpin, int clearedLines, bool perfectClear)
    {
        if (clearedLines <= 0) return 0; // 줄 안 지웠으면 데미지 없음

        int damage = clearedLines; // 기본 피해: 지운 줄 수만큼

        if (tSpin == TSpinType.Full) // T스핀(Mini 제외)은 줄 수별 가산 피해
        {
            if (clearedLines == 1) damage += 2; // T스핀 싱글
            else if (clearedLines == 2) damage += 3; // T스핀 더블
            else if (clearedLines == 3) damage += 4; // T스핀 트리플
        }
        else if (clearedLines == 4) // 일반 4줄 = 테트리스
        {
            damage += 2; // 테트리스 가산 피해
        }

        if (perfectClear) damage += 5; // 퍼펙트 클리어는 기술 보너스와 중첩

        return damage;
    }
}
