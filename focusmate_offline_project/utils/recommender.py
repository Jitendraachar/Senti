def get_suggestions(sentiment_label, high_pending, sentiment_score=0.0, context=None):
    context = context or {}
    suggestions = []
    s = (sentiment_label or 'neutral').lower()
    if s == 'negative':
        suggestions.append({'text':'Try a 5-minute breathing exercise.','reason':'Stress detected','priority':'high'})
        suggestions.append({'text':'Take a short walk/stretch (5–10 min).','reason':'Physical movement helps mood.','priority':'medium'})
    elif s == 'positive':
        suggestions.append({'text':'Start a focused 25-minute session.','reason':'Good mood — use momentum.','priority':'high'})
    else:
        suggestions.append({'text':'Try a short 15-minute focus session.','reason':'Neutral mood — build momentum.','priority':'medium'})
    if high_pending >= 3:
        suggestions.append({'text':f'Break {high_pending} tasks into 10-min chunks.','reason':'Too many high-priority tasks.','priority':'high'})
    return suggestions[:6]
