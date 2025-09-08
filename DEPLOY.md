# Deploy Instructions

## Railway Deploy

### 1. Preparação
- Certifique-se de que todas as dependências estão no `package.json`
- Configure as variáveis de ambiente no Railway

### 2. Variáveis de Ambiente no Railway
```
BLAND_AI_API_KEY=sk-your-actual-api-key
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
PORT=3001
```

### 3. Deploy
1. Conecte o repositório GitHub ao Railway
2. Railway detectará automaticamente o `package.json`
3. O build será executado automaticamente
4. A aplicação estará disponível na URL fornecida

## Render Deploy

### 1. Configurações no Render
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Node Version**: 18.x

### 2. Variáveis de Ambiente no Render
```
BLAND_AI_API_KEY=sk-your-actual-api-key
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### 3. Health Check
- **Health Check Path**: `/health`
- **Health Check Timeout**: 30s

## Problemas Comuns e Soluções

### 1. npm install travando
- **Causa**: Dependências pesadas (Puppeteer, SQLite3)
- **Solução**: Substituído por `better-sqlite3` e removido Puppeteer

### 2. Build falhando
- **Causa**: TypeScript errors ou dependências faltando
- **Solução**: Verificar se todas as dependências estão no `package.json`

### 3. Aplicação não inicia
- **Causa**: Porta incorreta ou variáveis de ambiente
- **Solução**: Verificar `PORT` e outras variáveis

### 4. CORS errors
- **Causa**: Frontend URL não configurada
- **Solução**: Configurar `FRONTEND_URL` nas variáveis de ambiente

## Comandos Úteis

```bash
# Build local
npm run build

# Test local
npm run start:prod

# Verificar health
curl https://your-app-url.com/health
```

## Monitoramento

- **Health Check**: `GET /health`
- **Logs**: Verificar logs da plataforma de deploy
- **Métricas**: Usar ferramentas da plataforma (Railway/Render)
