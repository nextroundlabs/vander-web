# Project: LEMBRA?

## Workflow Orchestration

### 1. Plan Node Default

- Entre no modo de planejamento para QUALQUER tarefa não trivial (3+ etapas ou decisões arquiteturais).
- Se algo der errado, PARE e re-planeje imediatamente – não continue forçando o erro.
- Use o modo de planejamento para etapas de verificação, não apenas para construção.
- Escreva especificações detalhadas antecipadamente para reduzir ambiguidades.

### 2. Subagent Strategy

- Use subagentes liberalmente para manter a janela de contexto principal limpa.
- Delegue pesquisas, explorações e análises paralelas para subagentes.
- Para problemas complexos, direcione mais compute via subagentes.
- Uma tarefa por subagente para execução focada.

### 3. Self-Improvement Loop

- Após QUALQUER correção do usuário: atualize `tasks/lessons.md` com o padrão.
- Escreva regras para si mesmo que evitem o mesmo erro no futuro.
- Itere implacavelmente nessas lições até que a taxa de erro caia.
- Revise as lições no início da sessão para o projeto relevante.

### 4. Verification Before Done

- Nunca marque uma tarefa como concluída sem provar que ela funciona.
- Verifique o diff de comportamento entre o estado original e suas mudanças.
- Pergunte-se: "Um Staff Engineer aprovaria isso?"
- Rode testes, verifique logs e demonstre a correção.

### 5. Demand Elegance (Balanced)

- Para mudanças não triviais: pause e pergunte "existe uma maneira mais elegante?".
- Se um fix parecer "hacky": "Sabendo o que sei agora, qual a solução elegante?".
- Pule isso para correções simples e óbvias – não faça over-engineering.
- Desafie seu próprio trabalho antes de apresentá-lo.

### 6. Autonomous Bug Fixing

- Ao receber um bug report: apenas corrija. Não peça "ajuda na mão".
- Aponte logs, erros, testes falhando – e então resolva-os.
- Zero necessidade de context switching por parte do usuário.
- Corrija testes de CI falhando sem precisar que digam como.

---

## Task Management

1. **Plan First**: Escreva o plano em `tasks/todo.md` com itens verificáveis.
2. **Verify Plan**: Peça validação antes de iniciar a implementação.
3. **Track Progress**: Marque os itens como concluídos conforme avança.
4. **Explain Changes**: Resumo de alto nível a cada etapa.
5. **Document Results**: Adicione uma seção de review em `tasks/todo.md`.
6. **Capture Lessons**: Atualize `tasks/lessons.md` após correções.

---

## Core Principles

- **Simplicity First**: Faça cada mudança a mais simples possível. Impacte o mínimo de código.
- **No Laziness**: Encontre as causas raiz. Sem correções temporárias. Padrões de Senior Developer.
- **Minimal Impact**: Mudanças devem tocar apenas o necessário. Evite introduzir bugs.


## Git Rules

- Branch: feature/, fix/, chore/
- Conventional commits
- Nunca commitar código sem teste
- Cada plano novo, fazer pull da main
