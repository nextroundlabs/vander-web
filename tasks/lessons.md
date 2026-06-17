# Lições — migração para backend compartilhado

1. **Isolar o acesso a dados num único módulo paga dividendos.** Todas as
   telas só chamavam funções de `src/db/storage.ts`, nunca AsyncStorage
   direto. Isso tornou possível trocar o backend inteiro (de local para
   Supabase) editando um arquivo, sem tocar na lógica de nenhuma tela —
   exceto pelos dois pontos abaixo, que são consequências do modelo
   relacional, não do Supabase em si.

2. **Ids gerados no cliente (`Date.now().toString()`) não sobrevivem a um
   banco relacional com chaves estrangeiras reais.** Sempre que uma tela
   monta um objeto local com id próprio e depois salva, a função de save
   precisa retornar o registro com o id REAL do banco, e a tela precisa usar
   esse retorno — não o objeto local — para qualquer referência subsequente
   (ex.: `partida.cadastroId`, `resgate.partidaId`). Esquecer isso quebra a
   foreign key silenciosamente em produção, só percebido quando o registro
   dependente falha ao salvar.

3. **"Ler, decidir, escrever" em três chamadas separadas do cliente é seguro
   só quando existe um único usuário por vez.** A lógica original de prêmio
   (`getPremios` → checar estoque → `decrementEstoque` → `saveResgate`) era
   perfeitamente correta no totem único, mas se tornaria uma condição de
   corrida real com múltiplos visitantes finalizando o jogo ao mesmo tempo
   perto do fim do estoque. A correção foi unificar em uma única operação
   atômica no servidor (função Postgres), não adicionar lock no cliente.

4. **Dado pessoal (telefone) não deve ser exposto numa chamada pública só
   porque "é só para achar a posição no ranking".** O código antigo buscava
   a lista inteira de partidas (`getRanking(9999)`) só para calcular o índice
   de um jogador. Numa API pública, isso significa expor a lista completa de
   todo mundo para qualquer requisição anônima. A correção foi uma função
   dedicada (`posicao_no_ranking`) que retorna só a posição, nunca a lista.

5. **Um PIN de 4 dígitos comparado no cliente é adequado para "alguém
   precisa tocar a tela física 5 vezes". Não é adequado para uma URL pública
   na internet.** Sempre que um gate de acesso ganha uma URL alcançável de
   fora, a validação precisa migrar para o servidor (aqui, Supabase Auth),
   e a "senha" deixa de ser um campo de configuração comum.
