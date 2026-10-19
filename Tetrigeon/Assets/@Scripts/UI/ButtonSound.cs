using UnityEngine;
using UnityEngine.EventSystems;

[RequireComponent(typeof(UnityEngine.UI.Button))]
public class ButtonSound : MonoBehaviour, IPointerEnterHandler
{
    private UnityEngine.UI.Button button;
    private bool isReward;
    private void Awake()
    {
        button = GetComponent<UnityEngine.UI.Button>();
        isReward = GetComponent<RewardCard>() != null;
        button.onClick.AddListener(Select);
    }
    private void OnDestroy() { if (button != null) button.onClick.RemoveListener(Select); }
    private void Select() { GameSound.Play(isReward ? "RewardSelect" : "ButtonSelect", true); }
    public void OnPointerEnter(PointerEventData eventData)
    {
        if (button.IsActive() && button.IsInteractable()) GameSound.Play(isReward ? "RewardHover" : "ButtonHover", true);
    }
}
