# Quick Start: AI Integration Testing

## 1. Install Requirements
```bash
cd backend
pip install -r requirements.txt
```

## 2. Configure AI Keys (Optional for Testing)

Edit `backend/.env` and add at least one provider key:

### Option A: Use Claude (Recommended)
```env
CLAUDE_API_KEY=sk-ant-YOUR-KEY-HERE
```
Get key from: https://console.anthropic.com

### Option B: Use Free Tier Providers
```env
GEMINI_API_KEY=YOUR-KEY
HUGGINGFACE_API_KEY=YOUR-KEY
```
- Gemini: https://aistudio.google.com/app/apikey
- HuggingFace: https://huggingface.co/settings/tokens

### Option C: Multiple Providers (Recommended for Production)
```env
CLAUDE_API_KEY=sk-ant-...
NVIDIA_DEEPSEEK_API_KEY=nvapi-...
GEMINI_API_KEY=...
```

## 3. Test the Integration

### Quick Test (No API Keys Needed - Tests with Defaults)
```bash
cd backend
python manage.py test_ai
```
This will attempt to generate responses. If no keys configured, it will gracefully show fallback responses.

### Test with Real AI
After configuring API keys, run:
```bash
python manage.py test_ai --test-all
```

Expected output:
```
=== Testing Raw AI Client ===
Prompt: What are three key elements of a strong scholarship essay?

Response:
[AI-generated response here...]

=== Testing Essay Feedback ===
Essay: [Sample essay provided]

Feedback Generated:
  Overall Score: 85/100
  Structure: Your essay structure is clear and well-organized...
  ...
```

### Test Individual Functions
```bash
python manage.py test_ai --test-raw        # Raw AI client only
python manage.py test_ai --test-feedback   # Essay feedback only
python manage.py test_ai --test-chat       # Chat response only
```

## 4. Test via Frontend

### Start Services
```bash
# Terminal 1: Backend
cd backend
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Test Essay Submission
1. Go to http://localhost:3000
2. Login to account
3. Navigate to "AI Prep"
4. Select a scholarship
5. Go to "Essay Review" tab
6. Submit a sample essay
7. Check the "Feedback" tab for AI-generated feedback

### Test Chat
1. In same scholarship detail page
2. Go to "Q&A" tab
3. Ask a question about the scholarship
4. AI will respond contextually

## 5. Verify API Integration

### Check Essay Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -X POST http://localhost:8000/api/v1/ai-review/ \
     -H "Content-Type: application/json" \
     -d '{
       "scholarship_id": 1,
       "essay_text": "My essay about perseverance..."
     }'
```

### Check Chat Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -X POST http://localhost:8000/api/v1/ai-review/1/chat/ \
     -H "Content-Type: application/json" \
     -d '{
       "message": "How do I improve my introduction?"
     }'
```

## 6. Troubleshooting

### "All AI providers failed"
- Check `.env` has at least one API key
- Verify API key format is correct
- Check network connectivity
- See logs: `python manage.py test_ai` in verbose mode

### "anthropic package not installed"
```bash
pip install anthropic
```

### API key validation errors
- For Claude: Key should start with `sk-ant-`
- For NVIDIA: Key should start with `nvapi-`
- For Azure: Also set `AZURE_OPENAI_ENDPOINT`

### Response parsing errors
- This is logged but doesn't crash the system
- Default fallback response is returned
- Check logs for specific error details

## 7. Next Steps

### With Working AI
1. Seed some scholarship/guide data via Django admin
2. Test full user flow: essay submission → feedback → chat
3. Monitor logs for performance
4. Collect feedback from test users

### Before Production
1. Set all API keys in production environment
2. Configure preferred provider priority (edit `backend/utils/ai_client.py` provider_list)
3. Set up monitoring/logging for provider failures
4. Test with real scholarship data
5. Load test with multiple concurrent users

## Files to Review

- `backend/utils/ai_client.py` — AI orchestration logic
- `backend/utils/scholarship_ai.py` — Scholarship-specific prompts
- `backend/AI_INTEGRATION.md` — Complete documentation
- `IMPLEMENTATION_COMPLETE.md` — Implementation summary

## Support

For issues or questions:
1. Check logs first: `python manage.py test_ai`
2. Review `AI_INTEGRATION.md` troubleshooting section
3. Check provider-specific documentation links in that file
