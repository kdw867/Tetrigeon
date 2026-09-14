using UnityEngine;

// Temporary placeholder: dark panel marking the tetris board area, separate from the world background.
// ExecuteAlways so it's visible (and re-synced to GridManager constants) in the Scene view, not just Play mode.
[ExecuteAlways]
public class BoardBackgroundView : MonoBehaviour
{
    private void OnEnable()
    {
        SpriteRenderer spriteRenderer = GetComponent<SpriteRenderer>();
        if (spriteRenderer == null)
        {
            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, Color.white);
            texture.Apply();
            Sprite sprite = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);

            spriteRenderer = gameObject.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = sprite;
            spriteRenderer.color = new Color(0.05f, 0.05f, 0.08f);
            spriteRenderer.sortingOrder = 0;
        }

        // Position is left as placed in the Editor — this only sizes the panel to the board.
        transform.localScale = new Vector3(
            GridManager.Width * GridManager.CellSize,
            GridManager.Height * GridManager.CellSize,
            1f);
    }
}
