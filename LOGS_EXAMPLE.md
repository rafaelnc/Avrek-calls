# 📋 Exemplo de Logs da API Bland.ai

## 🚀 Logs de Request (Start Call)

```
🚀 Bland.ai API Request - Start Call:
📍 URL: https://api.bland.ai/v1/calls
🔑 API Key: 3d167c9c...
📋 Request Data: {
  "phone_number": "+1234567890",
  "script": "Hello, this is Avrek Law calling about your case...",
  "webhook_url": "http://localhost:3001/calls/webhook",
  "model": "simple-pathway"
}
📋 Request Headers: {
  "Authorization": "3d167c9c-f1bc-41e4-bd0c-3f31cf8a204e",
  "Content-Type": "application/json"
}
```

## ✅ Logs de Response (Start Call)

```
✅ Bland.ai API Response - Start Call:
📊 Status: 200
📋 Response Data: {
  "call_id": "abc123def456",
  "status": "queued",
  "message": "Call queued successfully"
}
```

## ❌ Logs de Error (Start Call)

```
❌ Bland.ai API Error - Start Call:
📊 Status: 401
📋 Error Data: {
  "data": null,
  "errors": [
    {
      "error": "AUTH_FAILURE",
      "message": "Unauthorized"
    }
  ]
}
📋 Error Message: Request failed with status code 401
📋 Full Error: [AxiosError object]
```

## 🔍 Logs de Request (Get Call Status)

```
🔍 Bland.ai API Request - Get Call Status:
📍 URL: https://api.bland.ai/v1/calls/abc123def456
🔑 API Key: 3d167c9c...
📋 Request Headers: {
  "Authorization": "3d167c9c-f1bc-41e4-bd0c-3f31cf8a204e"
}
```

## ✅ Logs de Response (Get Call Status)

```
✅ Bland.ai API Response - Get Call Status:
📊 Status: 200
📋 Response Data: {
  "call_id": "abc123def456",
  "call_length": 120,
  "to": "+1234567890",
  "from": "+0987654321",
  "status": "completed",
  "completed": true,
  "created_at": "2024-01-01T12:00:00Z",
  "started_at": "2024-01-01T12:01:00Z",
  "end_at": "2024-01-01T12:03:00Z",
  "answered_by": "human",
  "record": true,
  "recording_url": "https://recordings.bland.ai/abc123.mp3",
  "summary": "Call completed successfully",
  "price": 0.068,
  "call_ended_by": "ASSISTANT",
  "concatenated_transcript": "user: Hello? assistant: Hi there!...",
  "transcripts": [
    {
      "id": 123,
      "created_at": "2024-01-01T12:01:30Z",
      "text": "Hello?",
      "user": "user",
      "c_id": "abc123def456"
    }
  ]
}
```

## 📞 Logs de Webhook

```
📞 Bland.ai Webhook Received:
📋 Webhook Data: {
  "call_id": "abc123def456",
  "status": "completed",
  "responses": [
    {
      "question": "What is your name?",
      "answer": "John Doe"
    }
  ],
  "duration": 120,
  "recording_url": "https://recordings.bland.ai/abc123.mp3",
  "issues": "None detected",
  "transferred_to": null,
  "from_number": "+0987654321",
  "to_number": "+1234567890"
}

🔍 Extracted Data:
📞 Call ID: abc123def456
📊 Status: completed
⏱️ Duration: 120
🎵 Recording URL: https://recordings.bland.ai/abc123.mp3
⚠️ Issues: None detected
🔄 Transferred To: null
📱 From Number: +0987654321
📱 To Number: +1234567890
💬 Responses: [
  {
    "question": "What is your name?",
    "answer": "John Doe"
  }
]

🔄 Mapped Status: Completed
✅ Webhook processed successfully
```

## 🔍 Logs de Call Details

```
🔍 Getting call details for ID: 1
📋 Local call data: {
  "id": 1,
  "phoneNumber": "+1234567890",
  "fromNumber": "+0987654321",
  "baseScript": "Hello, this is Avrek Law...",
  "status": "Completed",
  "blandCallId": "abc123def456",
  "responsesCollected": "[{\"question\":\"What is your name?\",\"answer\":\"John Doe\"}]",
  "callDuration": 120,
  "recordingUrl": "https://recordings.bland.ai/abc123.mp3",
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:03:00Z"
}

🔗 Bland.ai call ID: abc123def456
✅ Bland.ai details retrieved successfully
📊 Final result structure: {
  "localCallId": 1,
  "blandCallId": "abc123def456",
  "responsesCount": 1,
  "hasTranscript": true,
  "hasRecording": true
}
```

## 🎯 Como Usar os Logs

1. **Para debug de autenticação**: Verifique se a API Key está correta
2. **Para debug de requests**: Verifique URL, headers e dados enviados
3. **Para debug de responses**: Verifique se os dados retornados estão corretos
4. **Para debug de webhooks**: Verifique se os dados estão sendo recebidos corretamente
5. **Para debug de call details**: Verifique se a integração está funcionando

## 🔧 Troubleshooting

### Erro de Autenticação (401)
```
❌ Bland.ai API Error - Start Call:
📊 Status: 401
📋 Error Data: {
  "data": null,
  "errors": [
    {
      "error": "AUTH_FAILURE",
      "message": "Unauthorized"
    }
  ]
}
```

**Solução**: Verificar se a API Key está correta no arquivo `.env`

### Erro de Call ID não encontrado
```
❌ Bland.ai call ID not found for call: 1
```

**Solução**: Verificar se a chamada foi criada corretamente e tem um `blandCallId`

### Erro de Webhook
```
❌ Webhook processing error: [Error details]
```

**Solução**: Verificar se o endpoint do webhook está acessível e processando corretamente
