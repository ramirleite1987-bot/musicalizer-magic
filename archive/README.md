# Arquivo de branches (histórico)

Estes diretórios são **cópias estáticas** de trabalhos feitos em branches que não compartilhavam histórico com o app atual em `main` (Next.js 16 em `src/`). Foram preservadas aqui para consulta e não participam do build.

| Diretório | Origem | Descrição |
|-----------|--------|-----------|
| `auto-claude-002-verbum-implementation/` | branch `auto-claude/002-verbum-implementation` @ `b5ab4e8` | Implementação alternativa (backend Python + frontend) do plano “Verbum”; não integrada ao produto principal. |
| `backup-local-unrelated-main-2026-04-06/` | branch `backup/local-unrelated-main-2026-04-06` @ `b442519` | Snapshot antigo (stack diferente, ex.: Prisma/Vitest); mantido só como referência. |

**Tags Git** (mesmos commits, para checkout sem estes ficheiros):

- `archive/auto-claude-002-verbum-implementation` → `b5ab4e8`
- `archive/backup-local-unrelated-main-2026-04-06` → `b442519`
- `archive/recovered-origin-main` → `9972654` (estado “full-stack Musicalizer Magic” antes do commit de build; equivalente ao que estava em `recovered/origin-main`)

Para inspecionar só o código antigo: `git show archive/auto-claude-002-verbum-implementation:` ou `git worktree add ../wt-archive b5ab4e8`.

**Nota:** A branch local `auto-claude/002-verbum-implementation` foi removida após este arquivo; o commit permanece acessível pela tag e pelo snapshot em `auto-claude-002-verbum-implementation/`. Se usavas um worktree em `.auto-claude/worktrees/`, foi removido com `git worktree remove` para permitir apagar a branch.
