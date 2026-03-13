# Diagnose Edge Function

## Overview
This Edge Function provides secure AI-powered poultry disease diagnosis using Google's Gemini AI. It handles both text-based and image-based diagnosis requests with rate limiting and usage tracking.

## Features
- **Secure AI Processing**: Gemini API integration with server-side API key management
- **Rate Limiting**: 50 requests per day per user
- **Usage Tracking**: Monitor API usage and limits
- **Error Handling**: Comprehensive error logging and fallback responses
- **CORS Support**: Cross-origin request handling
- **Request Validation**: Input sanitization and validation

## API Endpoints

### POST /diagnose
Processes diagnosis requests for poultry diseases.

#### Request Body
```json
{
  "type": "text" | "image",
  "input": "symptoms description or image description",
  "userId": "user-uuid",
  "symptoms": ["additional", "symptoms"], // optional for text type
  "imageData": "base64-encoded-image" // required for image type
}
```

#### Response
```json
{
  "success": true,
  "diagnosis": {
    "disease": "Disease name",
    "confidence": 85,
    "severity": "high|medium|low",
    "recommendations": ["action1", "action2"],
    "treatment": "treatment instructions",
    "prevention": "prevention measures"
  },
  "usage": {
    "requestsToday": 5,
    "requestsLimit": 50,
    "resetTime": "2024-01-01T00:00:00Z"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "usage": {
    "requestsToday": 50,
    "requestsLimit": 50,
    "resetTime": "2024-01-01T00:00:00Z"
  }
}
```

## Environment Variables

Required secrets to be set in Supabase:
- `GEMINI_API_KEY`: Google Generative AI API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Database Tables Required

### usage_tracking
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  request_count INTEGER DEFAULT 0,
  last_request TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### diagnosis_logs
```sql
CREATE TABLE diagnosis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  response_time BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### error_logs
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error TEXT NOT NULL,
  stack TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service TEXT NOT NULL
);
```

## Rate Limiting

- **Free Tier**: 50 requests per day per user
- **Reset Time**: Daily at midnight UTC
- **Rate Limit Response**: HTTP 429 with usage information

## Security Features

- **API Key Protection**: Gemini API key stored server-side
- **Request Validation**: Input sanitization and validation
- **CORS Configuration**: Proper cross-origin handling
- **Error Logging**: Comprehensive error tracking
- **Usage Monitoring**: Track API usage patterns

## Deployment

1. Set up required environment variables in Supabase
2. Create required database tables
3. Deploy the Edge Function:
   ```bash
   supabase functions deploy diagnose
   ```

## Testing

### Local Testing
```bash
cd supabase/functions/diagnose
deno task serve
```

### Test Request
```bash
curl -X POST 'http://localhost:9000/diagnose' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "text",
    "input": "chicken has respiratory symptoms and sneezing",
    "userId": "test-user-id"
  }'
```

## Monitoring

- Check `diagnosis_logs` table for request analytics
- Monitor `error_logs` for error tracking
- Review `usage_tracking` for rate limiting analytics

## Troubleshooting

### Common Issues
1. **API Key Error**: Ensure GEMINI_API_KEY is set in Supabase secrets
2. **Rate Limit Exceeded**: Check usage_tracking table for current usage
3. **Database Errors**: Verify required tables exist
4. **CORS Issues**: Check request headers and origins

### Error Codes
- **400**: Bad Request (missing/invalid fields)
- **429**: Rate Limit Exceeded
- **500**: Internal Server Error

## Performance

- **Target Response Time**: <2 seconds
- **Throughput**: 100 requests/minute
- **Availability**: 99.9% uptime
- **Error Rate**: <1% failure rate
