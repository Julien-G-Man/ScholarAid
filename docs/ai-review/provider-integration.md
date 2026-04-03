# AI Provider Integration — Complete Guide

## Overview

The ScholarAid backend now features a **multi-provider AI orchestration system** that intelligently selects from multiple AI providers with automatic fallback support. The system prioritizes providers by performance and cost, falling back seamlessly when a provider is unavailable or fails.

---

## Architecture

### Providers (Priority Order)

1. **Claude** (Anthropic) — Primary choice for best quality
2. **NVIDIA DeepSeek** — Fast, cost-effective fallback
3. **NVIDIA OpenAI** — Alternative OpenAI endpoint
4. **Azure OpenAI** — Enterprise option
5. **DeepSeek** — Direct API fallback
6. **Google Gemini** — Alternative option
7. **HuggingFace** — Open-source fallback
8. **Cohere** — Last-resort fallback

### Components

**`backend/utils/ai_client.py`**
- Core multi-provider orchestration
- `AIClient` class with `generate_content()` method
- Individual provider implementations
- Automatic fallback on error
- Environment variable management

**`backend/utils/scholarship_ai.py`**
- High-level AI functions
- `generate_essay_feedback()` — Analyzes essays and returns structured feedback
- `generate_chat_response()` — Generates contextual Q&A responses
- Prompt engineering for scholarship tasks
- Response parsing and validation

**`backend/ai_review/api_views.py` (Updated)**
- `AIReviewSubmitView` — Now calls `generate_essay_feedback()`
- `AIChatView` — Now calls `generate_chat_response()`
- No more placeholder responses

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Required new packages:
- `httpx` — HTTP client for API calls
- `anthropic` — Anthropic Claude SDK (optional if using other providers)

### 2. Configure Environment Variables

Create or update `.env` in the backend root:

```env
# AI Providers (add the keys for providers you want to use)
CLAUDE_API_KEY=sk-ant-...
NVIDIA_DEEPSEEK_API_KEY=nvapi-...
NVIDIA_OPENAI_API_KEY=nvapi-...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com/
DEEPSEEK_API_KEY=...
GEMINI_API_KEY=...
HUGGINGFACE_API_KEY=...
COHERE_API_KEY=...
```

**Notes:**
- Leave blank any providers you don't want to use
- The system will skip missing providers and try the next one
- At least one API key is required for the system to work

### 3. Obtain API Keys

| Provider | Where to Get Key | Setup Time |
|----------|------------------|-----------|
| Claude | https://console.anthropic.com | 5 min |
| NVIDIA DeepSeek | https://build.nvidia.com | 5 min |
| NVIDIA OpenAI | https://build.nvidia.com | 5 min |
| Azure OpenAI | Azure Portal | 10 min |
| DeepSeek | https://platform.deepseek.com | 5 min |
| Gemini | https://aistudio.google.com/app/apikey | 5 min |
| HuggingFace | https://huggingface.co/settings/tokens | 5 min |
| Cohere | https://dashboard.cohere.ai/api-keys | 5 min |

---

## Usage

### For Essay Feedback

```python
from utils.scholarship_ai import generate_essay_feedback

feedback = generate_essay_feedback(
    essay_text="Student's essay here...",
    scholarship_name="XYZ Scholarship",
    essay_prompt="Optional: The essay prompt",
    eligibility="Optional: Eligibility requirements"
)

# Returns:
# {
#     'overall_score': 85,
#     'structure_feedback': '...',
#     'clarity_feedback': '...',
#     'relevance_feedback': '...',
#     'persuasiveness_feedback': '...',
#     'grammar_feedback': '...',
#     'strengths': '[...]',  # JSON string of list
#     'improvements': '[...]',  # JSON string of list
#     'next_steps': '...'
# }
```

### For Chat Responses

```python
from utils.scholarship_ai import generate_chat_response

response = generate_chat_response(
    user_message="How do I make my essay stand out?",
    scholarship_name="XYZ Scholarship",
    scholarship_context="Optional scholarship details",
    essay_text="Optional student's essay excerpt"
)

# Returns a text response from the AI
```

### Direct Provider Access

```python
from utils.ai_client import ai_service

response = ai_service.generate_content(
    prompt="Your prompt here",
    max_tokens=1500,
    temperature=0.7
)
# The client automatically tries providers in order
```

---

## How Fallback Works

1. **User submits essay** → Calls `generate_essay_feedback()`
2. **AIClient tries Claude** → If successful, returns response
3. **If Claude fails** → Tries NVIDIA DeepSeek
4. **If that fails** → Tries NVIDIA OpenAI
5. **And so on...** → Until a provider succeeds
6. **If all fail** → Returns graceful default response

**Error Handling:**
- Each provider failure is logged
- System never crashes — always returns at least a default response
- Timeouts set to 30 seconds per provider
- Failed provider doesn't block trying the next one

---

## Testing the Integration

### Manual Test

```bash
# Start Django shell
python manage.py shell

# Test the AI client
from utils.ai_client import ai_service
response = ai_service.generate_content("What is the capital of France?")
print(response)

# Test scholarship functions
from utils.scholarship_ai import generate_essay_feedback
feedback = generate_essay_feedback(
    essay_text="My essay about perseverance...",
    scholarship_name="Merit Scholarship",
)
print(feedback)
```

### Via API

1. **Create a session and submit an essay:**
   ```bash
   POST /api/v1/ai-review/
   {
       "scholarship_id": 1,
       "essay_text": "My essay here..."
   }
   ```

2. **Check the feedback** (auto-generated):
   ```bash
   GET /api/v1/ai-review/{session_id}/
   ```
   The response includes the AI-generated `feedback` object with all scores and categories.

3. **Send a chat message:**
   ```bash
   POST /api/v1/ai-review/{session_id}/chat/
   {
       "message": "How can I improve my introduction?"
   }
   ```

---

## Debugging

### "All AI providers failed" message

**Causes:**
- No API keys configured
- All API keys are invalid/expired
- Network connectivity issue
- All providers are down

**Solutions:**
1. Check `.env` file has at least one valid API key
2. Verify API key format for the provider
3. Check network connection
4. See logs for specific provider errors

### Provider-Specific Issues

**Claude:**
```
anthropic package not installed
```
Solution: `pip install anthropic`

**NVIDIA:**
```
API endpoint timeout or unreachable
```
Solution: Verify NVIDIA API key and endpoints are correct

**Azure:**
```
Missing AZURE_OPENAI_ENDPOINT
```
Solution: Set both `AZURE_OPENAI_API_KEY` and `AZURE_OPENAI_ENDPOINT`

### Enable Debug Logging

```python
import logging
logging.getLogger('utils.ai_client').setLevel(logging.DEBUG)
```

---

## Production Deployment

### Recommended Setup

1. **Primary: Claude** (best quality for scholarship guidance)
2. **Fallback: NVIDIA DeepSeek** (fast, reliable, cost-effective)
3. **Fallback: Gemini** (free tier available, good quality)

### Environment Variables

Store API keys as **secrets** in your deployment:

- **Heroku:** `heroku config:set CLAUDE_API_KEY=...`
- **AWS:** Use AWS Secrets Manager
- **GCP:** Use Google Secret Manager
- **Docker:** Use `.env.production`
- **GitHub Actions:** Use repository secrets

### Rate Limiting

The system makes **concurrent requests** only if multiple providers are configured. Consider:
- Adding timeout middleware
- Implementing request caching
- Monitoring provider usage

### Cost Optimization

**Production recommendation:**
```env
# Free tier for testing
GEMINI_API_KEY=...  # Free quota available
HUGGINGFACE_API_KEY=...  # Free tier

# Paid fallbacks (lower priority)
CLAUDE_API_KEY=...  # ~$0.003 per essay analysis
DEEPSEEK_API_KEY=...  # ~$0.001 per essay analysis
```

---

## Future Enhancements

1. **Caching** — Cache essay analysis results (same essay → same score)
2. **Async Processing** — Long-running analyses in background task queues
3. **User Preferences** — Let teachers pick preferred provider
4. **Cost Tracking** — Monitor and report provider costs
5. **Custom Models** — Fine-tuned models for scholarship-specific guidance
6. **Batch Processing** — Process multiple essays efficiently

---

## Files Modified

- `backend/utils/ai_client.py` — **Created**
- `backend/utils/scholarship_ai.py` — **Created**
- `backend/ai_review/api_views.py` — **Updated** (integrated AI calls)
- `backend/.env` — **Updated** (added AI provider keys)
- `backend/.env.example` — **Updated** (added AI provider template)
- `backend/requirements.txt` — **Updated** (added httpx, anthropic)

---

## Reference

- [Anthropic Claude API docs](https://docs.anthropic.com)
- [NVIDIA AI endpoints](https://build.nvidia.com)
- [Google Gemini API](https://ai.google.dev)
- [DeepSeek API](https://platform.deepseek.com)
- [Cohere API](https://docs.cohere.com)
- [HuggingFace Inference](https://huggingface.co/docs/api-inference)
