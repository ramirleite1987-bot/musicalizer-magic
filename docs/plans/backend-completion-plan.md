# Musicalizer Magic - Plano de Finalização do Backend

**Data:** 2026-04-04
**Status:** Planejamento
**Prioridade:** Alta

---

## Sumário Executivo

O projeto Musicalizer Magic é um workbench de produção musical com IA (Next.js 16 + PostgreSQL/Neon + Drizzle ORM). A estrutura base está implementada (schema, server actions, API routes, componentes). Este plano identifica todos os gaps de backend que precisam ser corrigidos e finalizados para que o projeto esteja pronto para produção.

---

## 1. CRÍTICO - Build Quebrado: Google Fonts Inacessíveis

**Arquivo:** `src/app/layout.tsx`
**Problema:** O build falha porque `next/font/google` tenta baixar Geist e Geist Mono da Google Fonts, que retorna 403 neste ambiente. Isso impede qualquer deploy.

**Solução:**
- Migrar para `next/font/local` com os arquivos de fonte já disponíveis em `node_modules/geist/`
- Ou usar fallback system fonts caso o pacote `geist` não esteja instalado

**Complexidade:** Baixa
**Impacto:** Bloqueante - sem isso o projeto não builda

---

## 2. CRÍTICO - Migrations do Banco de Dados Ausentes

**Arquivo:** `drizzle.config.ts` (output: `./drizzle`)
**Problema:** A pasta `drizzle/` não existe. Não há migrations geradas. Sem migrations, o banco não pode ser provisionado de forma reprodutível.

**Tarefas:**
- [ ] Gerar migrations iniciais com `npx drizzle-kit generate`
- [ ] Criar script npm `db:migrate` para aplicar migrations
- [ ] Criar script npm `db:seed` para popular dados iniciais
- [ ] Criar script npm `db:push` para desenvolvimento rápido
- [ ] Documentar o fluxo de setup do banco

**Complexidade:** Baixa
**Impacto:** Bloqueante para deploy e onboarding

---

## 3. CRÍTICO - Ausência de Autenticação e Autorização

**Problema:** Todas as Server Actions e API Routes são públicas. Qualquer pessoa pode:
- Criar/deletar tracks e versões
- Fazer upload de arquivos
- Iniciar gerações no Suno (custa dinheiro)
- Gerar temas via Anthropic API (custa dinheiro)

**Tarefas:**
- [ ] Implementar autenticação (NextAuth.js / Clerk / Auth.js)
- [ ] Adicionar middleware de autenticação no Next.js
- [ ] Proteger todas as Server Actions com verificação de sessão
- [ ] Proteger todas as API Routes com verificação de sessão
- [ ] Adicionar campo `userId` nas tabelas `tracks` e `themes`
- [ ] Filtrar dados por usuário em todas as queries
- [ ] Criar migration para o campo `userId`

**Complexidade:** Alta
**Impacto:** Bloqueante para produção - risco de abuso de APIs pagas

---

## 4. ALTO - Validação de Input nas Server Actions

**Problema:** Nenhuma Server Action valida os dados de entrada. O projeto já tem Zod como dependência mas só usa na rota `/api/themes/generate`.

**Arquivos afetados:**
- `src/app/actions/tracks.ts` - `createTrack`, `updateTrack` sem validação
- `src/app/actions/versions.ts` - `createVersion`, `updateVersion` aceitam qualquer Partial<TrackVersion>
- `src/app/actions/themes.ts` - `createTheme`, `assignTheme` sem validação
- `src/app/actions/generation.ts` - `startGeneration` não valida se a versão tem dados mínimos

**Tarefas:**
- [ ] Criar schemas Zod para cada Server Action input
- [ ] Validar `createTrack`: name (1-255 chars), genre (não vazio)
- [ ] Validar `updateTrack`: pelo menos um campo presente
- [ ] Validar `updateVersion`: sanitizar campos, limitar rating 0-5, scores 0-10
- [ ] Validar `createTheme`: name, color, source obrigatórios
- [ ] Validar `assignTheme`/`removeTheme`: UUIDs válidos
- [ ] Validar `startGeneration`: versão deve ter prompt ou style mínimo
- [ ] Retornar erros estruturados (não throw genérico)

**Complexidade:** Média
**Impacto:** Segurança + integridade de dados

---

## 5. ALTO - API Route `/api/upload` sem Validação

**Arquivo:** `src/app/api/upload/route.ts`
**Problema:** Aceita qualquer arquivo, sem limites. Vulnerabilidades:
- Sem limite de tamanho de arquivo
- Sem validação de tipo MIME (aceita .exe, .zip, etc.)
- Sem limite de uploads por usuário/período
- Nome de arquivo não sanitizado

**Tarefas:**
- [ ] Validar tipo MIME: apenas `audio/*` (mp3, wav, ogg, flac, m4a)
- [ ] Limitar tamanho máximo: 50MB
- [ ] Sanitizar nome de arquivo (remover caracteres especiais)
- [ ] Adicionar rate limiting básico
- [ ] Retornar erros específicos (413 para tamanho, 415 para tipo)

**Complexidade:** Média
**Impacto:** Segurança + custos de storage

---

## 6. ALTO - API Route `/api/themes/generate` - Modelo AI Hardcoded Incorretamente

**Arquivo:** `src/app/api/themes/generate/route.ts:58`
**Problema:** Usa `model: "anthropic/claude-sonnet-4.6"` como string, mas o Vercel AI SDK precisa de um provider instanciado, não uma string. Isso provavelmente não funciona em runtime.

**Tarefas:**
- [ ] Instalar/configurar o provider `@ai-sdk/anthropic`
- [ ] Substituir string por `anthropic("claude-sonnet-4-6")` instanciado
- [ ] Adicionar tratamento de erro para API key ausente
- [ ] Adicionar rate limiting para evitar abuso da API da Anthropic
- [ ] Testar integração end-to-end

**Complexidade:** Média
**Impacto:** Funcionalidade quebrada

---

## 7. ALTO - Estado do Client Não Atualiza Após Mutations

**Arquivo:** `src/app/dashboard/dashboard-client.tsx`
**Problema:** O componente usa `useState` com dados iniciais mas nunca atualiza o state local após mutations. O `revalidatePath("/dashboard")` nas Server Actions revalidaria o Server Component, mas o client mantém o state antigo.

**Exemplos:**
- `handleUpdateVersion` chama a action mas não atualiza `tracks` no state
- `handleNewVersion` não adiciona a nova versão na lista local
- `handleMarkBest` não atualiza `isBest` localmente
- `handleAssignTheme`/`handleRemoveTheme` não refletem no UI
- `handleCreateTheme`/`handleDeleteTheme` não atualizam a lista de themes

O único lugar que faz refresh é `handleGenerate` com `window.location.reload()`.

**Tarefas:**
- [ ] Opção A: Converter para `useOptimistic` + revalidação via Server Component
- [ ] Opção B: Usar `router.refresh()` após cada mutation para re-fetch do Server Component
- [ ] Opção C: Implementar state management local com atualização otimista
- [ ] Garantir que o UI reflete imediatamente as mudanças do usuário
- [ ] Remover `window.location.reload()` em favor de `router.refresh()`

**Complexidade:** Alta
**Impacto:** UX quebrada - usuário não vê resultado das ações

---

## 8. MÉDIO - Sidebar Não Permite Criar/Deletar Tracks

**Arquivo:** `src/components/sidebar.tsx`, `src/app/dashboard/dashboard-client.tsx`
**Problema:** As Server Actions `createTrack` e `deleteTrack` existem mas não são chamadas em nenhum lugar da UI. A sidebar só mostra tracks existentes.

**Tarefas:**
- [ ] Adicionar botão "New Track" na sidebar
- [ ] Implementar modal/dialog de criação de track (nome + gênero)
- [ ] Adicionar opção de deletar track (com confirmação)
- [ ] Adicionar opção de editar nome/gênero do track
- [ ] Conectar com `createTrack`, `deleteTrack`, `updateTrack` actions
- [ ] Atualizar state após CRUD operations

**Complexidade:** Média
**Impacto:** Funcionalidade essencial ausente

---

## 9. MÉDIO - Tratamento de Erros nas Server Actions

**Problema:** As Server Actions fazem `throw new Error(...)` que é capturado genericamente pelo React. Não há feedback estruturado para o frontend.

**Tarefas:**
- [ ] Criar tipo `ActionResult<T> = { success: true, data: T } | { success: false, error: string }`
- [ ] Refatorar todas as Server Actions para retornar `ActionResult`
- [ ] No frontend, exibir toast de erro específico quando `success: false`
- [ ] Adicionar try/catch em cada action com logging adequado
- [ ] Tratar erros de constraint do banco (duplicate, FK violation)

**Complexidade:** Média
**Impacto:** UX + debugging

---

## 10. MÉDIO - Polling de Geração Ineficiente

**Arquivo:** `src/app/dashboard/dashboard-client.tsx:133-156`
**Problema:** O polling via `setInterval` no client tem problemas:
- Não tem timeout máximo (pode rodar indefinidamente)
- Não limpa o interval se o componente desmonta
- Não limpa o interval se o usuário navega para outra track
- Usa `window.location.reload()` que perde todo o state

**Tarefas:**
- [ ] Adicionar timeout máximo (ex: 5 minutos)
- [ ] Limpar interval no cleanup do useCallback/useEffect
- [ ] Usar `router.refresh()` em vez de `window.location.reload()`
- [ ] Considerar Server-Sent Events (SSE) ou webhook do Suno para melhor UX
- [ ] Mostrar tempo estimado restante no toast

**Complexidade:** Média
**Impacto:** Performance + UX

---

## 11. MÉDIO - Variáveis de Ambiente sem Validação

**Problema:** Todas as env vars são acessadas via `process.env.X!` (non-null assertion). Se alguma estiver faltando, o erro é críptico e ocorre em runtime.

**Tarefas:**
- [ ] Criar `src/lib/env.ts` com validação via Zod
- [ ] Validar todas as env vars no startup: `DATABASE_URL`, `SUNO_API_KEY`, `SUNO_API_BASE_URL`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`
- [ ] Gerar erros claros indicando qual variável está ausente
- [ ] Importar env validado em vez de acessar `process.env` diretamente

**Complexidade:** Baixa
**Impacto:** DX + operações

---

## 12. MÉDIO - `markBest` Não É Transacional

**Arquivo:** `src/app/actions/versions.ts:159-175`
**Problema:** `markBest` faz 2 queries separadas (reset all → set one). Se a segunda falhar, todas as versões ficam com `isBest=false`.

**Tarefas:**
- [ ] Envolver em transação do Drizzle (`db.transaction(async (tx) => {...})`)
- [ ] Nota: Neon HTTP driver não suporta transactions nativamente
- [ ] Avaliar migrar para `@neondatabase/serverless` websocket driver para suportar transactions
- [ ] Ou usar uma única query SQL com CASE WHEN

**Complexidade:** Média
**Impacto:** Integridade de dados

---

## 13. BAIXO - Campo `updatedAt` Não Atualiza Automaticamente

**Arquivo:** `src/lib/db/schema.ts`
**Problema:** O campo `updatedAt` tem `.defaultNow()` mas não tem trigger de auto-update. Depende de cada action passar `updatedAt: new Date()` manualmente, o que é propenso a esquecimento.

**Tarefas:**
- [ ] Adicionar `.$onUpdate(() => new Date())` no campo `updatedAt` do schema
- [ ] Ou criar trigger no PostgreSQL via migration
- [ ] Remover `updatedAt: new Date()` explícitos das actions (se usar trigger)

**Complexidade:** Baixa
**Impacto:** Consistência de dados

---

## 14. BAIXO - Seed Script Não Tem Script npm

**Arquivo:** `src/lib/db/seed.ts`
**Problema:** O seed existe mas não há forma fácil de executá-lo. Usa `import "dotenv/config"` mas `dotenv` não está nas dependências.

**Tarefas:**
- [ ] Adicionar `dotenv` às devDependencies (ou usar `--env-file` do Node.js)
- [ ] Adicionar script npm: `"db:seed": "npx tsx src/lib/db/seed.ts"`
- [ ] Adicionar idempotência ao seed (limpar dados antes ou usar upsert)
- [ ] Documentar no README

**Complexidade:** Baixa
**Impacto:** DX + onboarding

---

## 15. BAIXO - Falta de Rate Limiting Global

**Problema:** Nenhum endpoint tem rate limiting. APIs que chamam serviços pagos (Suno, Anthropic) podem ser abusadas.

**Tarefas:**
- [ ] Implementar rate limiting básico (em memória ou via Vercel KV/Upstash)
- [ ] Aplicar nos endpoints críticos:
  - `/api/upload` - max 10 uploads/minuto
  - `/api/themes/generate` - max 5 gerações/minuto
  - `startGeneration` action - max 3 gerações/minuto
- [ ] Retornar 429 com header `Retry-After`

**Complexidade:** Média
**Impacto:** Custos + segurança

---

## 16. BAIXO - Limpeza de Áudio Órfão no Vercel Blob

**Problema:** Quando um track é deletado (cascade), os arquivos de áudio no Vercel Blob não são removidos. Mesmo `handleRemoveAudio` só limpa os campos no DB, não deleta o blob.

**Tarefas:**
- [ ] Ao deletar track: buscar todas as `audioUrl` antes do delete e chamar `del()` do Vercel Blob
- [ ] Ao remover áudio de uma versão: deletar o blob antigo
- [ ] Considerar job de limpeza periódico para blobs órfãos

**Complexidade:** Baixa
**Impacto:** Custos de storage

---

## 17. BAIXO - README Genérico

**Arquivo:** `README.md`
**Problema:** É o template padrão do Create Next App, não documenta o projeto.

**Tarefas:**
- [ ] Documentar o que é o projeto
- [ ] Documentar setup: env vars, banco, migrations, seed
- [ ] Documentar arquitetura: Server Actions, API Routes, integrações
- [ ] Documentar comandos disponíveis
- [ ] Documentar fluxo de deployment

**Complexidade:** Baixa
**Impacto:** DX + onboarding

---

## Ordem de Execução Recomendada

### Fase 1 - Build Funcional (Bloqueadores)
1. **Fix Google Fonts** (#1) - fazer o build funcionar
2. **Gerar Migrations** (#2) - banco reprodutível
3. **Scripts npm de DB** (#14) - seed + migrate

### Fase 2 - Funcionalidades Core
4. **Fix state sync no dashboard** (#7) - UI reativa
5. **CRUD de tracks na sidebar** (#8) - criar/deletar tracks
6. **Fix provider do AI SDK** (#6) - geração de themes funcional
7. **Tratamento de erros** (#9) - feedback estruturado

### Fase 3 - Segurança
8. **Autenticação** (#3) - proteger o app
9. **Validação de input** (#4) - sanitizar dados
10. **Validação de upload** (#5) - proteger storage
11. **Rate limiting** (#15) - proteger APIs pagas

### Fase 4 - Robustez
12. **Validação de env vars** (#11) - startup seguro
13. **Polling melhorado** (#10) - geração mais robusta
14. **Transação no markBest** (#12) - integridade
15. **Auto-update updatedAt** (#13) - consistência
16. **Limpeza de blobs** (#16) - custos

### Fase 5 - Documentação
17. **README** (#17) - onboarding

---

## Estimativa de Tarefas

| Categoria | Itens | Prioridade |
|-----------|-------|------------|
| Bloqueadores (build + DB) | 3 | Crítica |
| Funcionalidades core | 4 | Alta |
| Segurança | 4 | Alta |
| Robustez | 5 | Média |
| Documentação | 1 | Baixa |
| **Total** | **17** | |

---

## Dependências Externas Necessárias

| Pacote | Motivo | Status |
|--------|--------|--------|
| `@ai-sdk/anthropic` | Provider Anthropic para Vercel AI SDK | Faltando |
| `next-auth` ou `@clerk/nextjs` | Autenticação | Faltando |
| `dotenv` (dev) ou Node `--env-file` | Seed script | Faltando |

---

## Notas Técnicas

- **Next.js 16.2.1**: Verificar docs em `node_modules/next/dist/docs/` antes de implementar. Breaking changes possíveis.
- **Drizzle ORM 0.45.2**: Neon HTTP driver não suporta transactions. Avaliar websocket driver para operações críticas.
- **Vercel AI SDK (`ai` package)**: Já instalado (v6.0.141). Precisa do provider `@ai-sdk/anthropic` para funcionar.
- **Zod v4.3.6**: Já instalado. Usar para todas as validações de input.
