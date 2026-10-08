using System.Collections.Generic;
using UnityEngine;

// 고정(LOCK)·줄 삭제(LINE CLEAR 파티클)·수정 칸 파괴 이펙트를 보드 위에 재생하는 매니저. 규칙에는 관여하지 않고 PieceSpawner의 연출 알림만 읽는다.
public class BoardEffectPlayer : MonoBehaviour
{
    [SerializeField] private BoardEffectFrames lockPrefab; // 고정된 미노 윤곽 테두리 (노출된 변 조합 16가지 변형)
    [SerializeField] private ParticleSystem clearParticlesPrefab; // 줄 삭제 파편용 파티클 시스템 (시작 때 한 개만 만들어 계속 재사용)
    [SerializeField] private BoardEffectFrames crystalPrefab; // 지워진 수정 칸 한 개의 파괴 (클립 7개 = 원본 미노 종류 순서 I J L O S T Z)
    [SerializeField] private Transform boardMask; // 보드 안쪽 영역만 보이게 하는 마스크 (이펙트가 보드 테두리를 덮지 않게)

    private const float CrystalDelay = 0.06f; // 수정 파편을 줄 삭제 파편보다 조금 늦게 시작 (연출 시간차일 뿐 능력 처리와 무관)

    // 줄 삭제 파편 값 (승인된 미리보기와 같음). 길이 단위는 FHD 화면 픽셀이며 한 칸 = 27px
    private const float CellPixels = 27f; // 한 칸의 화면 픽셀 수 (픽셀 값을 월드 유닛으로 바꾸는 기준)
    private const float LifeMin = 0.08f; // 파편 최소 수명(초)
    private const float LifeMax = 0.14f; // 파편 최대 수명(초)
    private const float SpeedMin = 110f; // 바깥으로 튀는 최소 속도(px/초)
    private const float SpeedMax = 230f; // 바깥으로 튀는 최대 속도(px/초)
    private const int SizeMin = 3; // 파편 최소 한 변(px)
    private const int SizeMax = 5; // 파편 최대 한 변(px)
    private const int PerCellSingle = 2; // 한 줄만 지워질 때 칸당 방출 수
    private const int PerCellMulti = 1; // 두 줄 이상 동시에 지워질 때 칸당 방출 수 (보드가 덮이지 않게)
    private const int MaxTotal = 32; // 한 번의 삭제에서 방출할 총량 상한
    private const float StartJitter = 9f; // 칸 가운데에서 시작 위치가 흩어지는 폭(px)
    private const float CrystalRowChance = 0.5f; // 수정 칸이 있는 줄에서 파편이 살아남을 확률 (약하게)

    private static readonly Color32 SparkWhite = new Color32(0xf4, 0xfb, 0xff, 255); // 옅은 백색 (30%)
    private static readonly Color32 SparkBright = new Color32(0x8c, 0xec, 0xf4, 255); // 밝은 청록 (40%)
    private static readonly Color32 SparkTeal = new Color32(0x3e, 0xc0, 0xd6, 255); // 청록 (30%)

    private struct Spark
    {
        public Vector3 position; // 시작 위치 (월드)
        public Vector3 velocity; // 속도 (월드 유닛/초)
        public float life; // 수명(초)
        public float size; // 시작 크기 (월드 유닛)
        public Color32 color; // 색
    }

    private readonly HashSet<Vector2Int> remaining = new HashSet<Vector2Int>(); // 줄 삭제 후에도 남는 고정 칸 (압축 후 좌표)
    private readonly List<Spark> sparks = new List<Spark>(); // 이번 삭제에서 방출할 파편 (매번 비우고 재사용)
    private ParticleSystem clearParticles; // 실제로 쓰는 파티클 시스템 (이 매니저의 자식)

    private void Awake()
    {
        clearParticles = Instantiate(clearParticlesPrefab, transform); // 원본 프리팹에서 한 개 만들어 이 매니저 아래에 둠 (GridManager 아래에는 두지 않음)
    }

    private void OnEnable()
    {
        PieceSpawner.OnLockVisual += Play; // 고정이 처리될 때마다 연출 재생
    }

    private void OnDisable()
    {
        PieceSpawner.OnLockVisual -= Play; // 이벤트 구독 해제
    }

    private void Start()
    {
        Vector3 center = (GridManager.CellToWorld(Vector2Int.zero) + GridManager.CellToWorld(new Vector2Int(GridManager.Width - 1, GridManager.Height - 1))) / 2f; // 보드 가운데 (첫 칸과 마지막 칸 중심의 가운데)
        boardMask.position = center; // 마스크를 보드 가운데에 둠
        boardMask.localScale = new Vector3(GridManager.Width * GridManager.CellSize, GridManager.Height * GridManager.CellSize, 1f); // 마스크를 보드 안쪽 크기(1유닛 정사각형 기준)로 늘림
    }

    // 고정된 칸 / 지워진 줄(압축 전 행) / 지워진 수정 칸(압축 전 좌표) / 그 수정 칸의 원본 종류로 이펙트를 만든다
    private void Play(IReadOnlyList<Vector2Int> lockedCells, IReadOnlyList<int> clearedRows, IReadOnlyList<Vector2Int> clearedCrystalCells, IReadOnlyList<TetrominoType> clearedCrystalTypes)
    {
        EmitClearParticles(clearedRows, clearedCrystalCells); // 지워진 줄의 칸마다 짧은 파편 (여러 줄이면 한꺼번에)

        for (int i = 0; i < clearedCrystalCells.Count; i++) // 지워진 수정 칸마다 파괴 (압축 전 위치, 줄 삭제 파편 뒤에 따라옴)
            Spawn(crystalPrefab, GridManager.CellToWorld(clearedCrystalCells[i]), (int)clearedCrystalTypes[i], CrystalDelay); // 원본 미노 종류 번호가 곧 색별 클립 번호

        remaining.Clear();
        for (int i = 0; i < lockedCells.Count; i++)
        {
            Vector2Int cell = lockedCells[i];
            if (IsCleared(clearedRows, cell.y)) continue; // 지워지는 칸은 줄 삭제 이펙트가 우선이라 LOCK을 보이지 않음
            remaining.Add(new Vector2Int(cell.x, cell.y - RowsBelow(clearedRows, cell.y))); // 남는 칸은 압축으로 내려온 뒤의 위치
        }

        foreach (Vector2Int cell in remaining) // 남는 칸마다 LOCK (같은 미노끼리 맞닿은 변에는 테두리를 그리지 않음)
        {
            int exposed = (remaining.Contains(cell + Vector2Int.up) ? 0 : 1) // 북쪽 변 노출
                        | (remaining.Contains(cell + Vector2Int.right) ? 0 : 2) // 동쪽 변 노출
                        | (remaining.Contains(cell + Vector2Int.down) ? 0 : 4) // 남쪽 변 노출
                        | (remaining.Contains(cell + Vector2Int.left) ? 0 : 8); // 서쪽 변 노출
            Spawn(lockPrefab, GridManager.CellToWorld(cell), exposed, 0f);
        }
    }

    // 지워진 줄의 칸마다 파편을 만들고 총량 상한 안에서 한 번에 방출한다 (수정 칸 자체에서는 내지 않음, 수정 줄은 약하게)
    private void EmitClearParticles(IReadOnlyList<int> clearedRows, IReadOnlyList<Vector2Int> clearedCrystalCells)
    {
        if (clearedRows.Count == 0) return; // 지워진 줄이 없으면 파편 없음

        float pixel = GridManager.CellSize / CellPixels; // 화면 1px의 월드 유닛
        int perCell = clearedRows.Count > 1 ? PerCellMulti : PerCellSingle; // 여러 줄이면 칸당 1개로 줄임
        sparks.Clear(); // 지난 삭제의 목록 비우기

        for (int i = 0; i < clearedRows.Count; i++)
        {
            int row = clearedRows[i]; // 지워진 줄 번호 (압축 전)
            bool crystalRow = HasCrystalInRow(clearedCrystalCells, row); // 수정 칸이 섞인 줄인지
            for (int x = 0; x < GridManager.Width; x++)
            {
                Vector2Int cell = new Vector2Int(x, row); // 지워진 칸
                if (IsCrystalCell(clearedCrystalCells, cell)) continue; // 수정 칸에는 수정 파괴 이펙트가 있으므로 일반 파편을 내지 않음
                Vector3 center = GridManager.CellToWorld(cell); // 칸 가운데 (압축 전 월드 좌표)

                for (int k = 0; k < perCell; k++)
                {
                    if (crystalRow && Random.value > CrystalRowChance) continue; // 수정 줄은 파편을 반으로
                    float angle = Random.value * Mathf.PI * 2f; // 튀는 방향
                    float speed = Random.Range(SpeedMin, SpeedMax) * pixel; // 속도 (월드 유닛/초)
                    int size = Random.Range(SizeMin, SizeMax + 1); // 한 변 px (3~5)
                    float pick = Random.value; // 색 고르기
                    Spark spark = new Spark();
                    spark.position = center + new Vector3(Random.Range(-StartJitter, StartJitter) * pixel, Random.Range(-StartJitter, StartJitter) * pixel, 0f); // 칸 가운데에서 조금 흩어진 시작
                    spark.velocity = new Vector3(Mathf.Cos(angle), Mathf.Sin(angle), 0f) * speed; // 바깥으로 튀는 속도
                    spark.life = Random.Range(LifeMin, LifeMax); // 수명
                    spark.size = (crystalRow ? Mathf.Max(2, size - 1) : size) * pixel; // 수정 줄은 한 도트 작게
                    spark.color = pick < 0.3f ? SparkWhite : pick < 0.7f ? SparkBright : SparkTeal; // 백색 30% / 밝은 청록 40% / 청록 30%
                    sparks.Add(spark); // 방출 목록에 추가
                }
            }
        }

        while (sparks.Count > MaxTotal) sparks.RemoveAt(Random.Range(0, sparks.Count)); // 총량 상한: 무작위로 덜어냄

        ParticleSystem.EmitParams emit = new ParticleSystem.EmitParams(); // 파편 하나씩 값을 정해 방출
        for (int i = 0; i < sparks.Count; i++)
        {
            emit.position = sparks[i].position; // 시작 위치 (월드 공간 시뮬레이션)
            emit.velocity = sparks[i].velocity; // 속도
            emit.startLifetime = sparks[i].life; // 수명
            emit.startSize = sparks[i].size; // 크기
            emit.startColor = sparks[i].color; // 색
            clearParticles.Emit(emit, 1); // 한 번에 한 개 방출 (지속 방출 없음)
        }
    }

    private static bool IsCrystalCell(IReadOnlyList<Vector2Int> clearedCrystalCells, Vector2Int cell)
    {
        for (int i = 0; i < clearedCrystalCells.Count; i++)
            if (clearedCrystalCells[i] == cell) return true; // 지워진 수정 칸에 포함
        return false;
    }

    private static bool HasCrystalInRow(IReadOnlyList<Vector2Int> clearedCrystalCells, int row)
    {
        for (int i = 0; i < clearedCrystalCells.Count; i++)
            if (clearedCrystalCells[i].y == row) return true; // 이 줄에 수정 칸이 있음
        return false;
    }

    private void Spawn(BoardEffectFrames prefab, Vector3 position, int clip, float delay)
    {
        BoardEffectFrames effect = Instantiate(prefab, position, Quaternion.identity, transform); // 이 매니저 아래에 생성 (GridManager 아래에는 두지 않음)
        effect.Play(clip, delay); // 재생이 끝나면 스스로 사라짐
    }

    private static bool IsCleared(IReadOnlyList<int> clearedRows, int row)
    {
        for (int i = 0; i < clearedRows.Count; i++)
            if (clearedRows[i] == row) return true; // 지워진 줄에 포함
        return false;
    }

    // row 아래에서 지워진 줄 수 = 압축으로 내려오는 칸 수
    private static int RowsBelow(IReadOnlyList<int> clearedRows, int row)
    {
        int count = 0;
        for (int i = 0; i < clearedRows.Count; i++)
            if (clearedRows[i] < row) count++; // 이 행보다 아래에서 지워진 줄
        return count;
    }
}
