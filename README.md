# AGROGEST Assessoria

Sistema web para o escritório rural da AGROGEST. Navegação horizontal no topo, identidade azul e verde, versão para computador e celular.

## Primeira versão funcional

- Login, cadastro, confirmação por e-mail, recuperação e alteração de senha.
- Escritórios separados, integrantes e perfis administrador, gestor e técnico.
- Cadastro e edição de produtores, imóveis e rebanhos, busca e pendências.
- PDFs e imagens em armazenamento privado; conferência lado a lado e registro da origem.
- Quadro Kanban e lista de processos, prazos, justificativas e histórico.
- Agenda, demandas, certidões com validade e minutas em PDF/DOCX.
- Regras do escritório, calendário, exportação e histórico de alterações.
- Dados reais gravados no servidor; revisões impedem sobrescrever alterações concorrentes.

A demonstração é acessada explicitamente pela tela de entrada ou por `?preview=1`. Ela usa exemplos fictícios salvos no navegador e não grava no servidor. Reinicie em **Gestão → Configurações → Dados**.

## Situação da implantação

A interface está publicada em https://delta-1.github.io/AGROGEST/ e conectada ao projeto Supabase dedicado `oadyjxanjroyfriythcz`, na organização AGROGEST (Free, São Paulo). As migrações foram aplicadas, as variáveis do Pages foram configuradas e os endereços de retorno da autenticação apontam para a aplicação.

As 13 tabelas públicas estão com RLS e o bucket de documentos é privado. Foram validados no servidor cadastro, imóvel, revisão, convite e isolamento de técnico/conta externa com registros temporários revertidos por transação. Os Advisors de segurança e desempenho ficaram com zero erros e zero avisos. Os 20 testes automatizados passaram.

**Pendente antes de liberar a equipe:** configurar SMTP próprio para confirmações e recuperação de senha. O SMTP padrão do Supabase só envia para os e-mails dos integrantes da organização e tem limites de teste: https://supabase.com/docs/guides/auth/auth-smtp. A confirmação de e-mail continua habilitada. O primeiro acesso real, o envio de e-mail e o upload autenticado no ambiente online ainda precisam da primeira conta do usuário; os testes de arquivos e revisão transacional já passam no PostgreSQL local.

Criar a primeira conta pelo botão **Primeiro acesso? Criar conta**, confirmar o e-mail e criar o escritório. Definir e validar a rotina de backup antes de registrar documentos reais da equipe.

O login administrativo do painel Supabase é independente dos usuários do aplicativo.

## Desenvolvimento

```bash
npm ci
npm run dev
npm test
npm run build
```

React 19, TypeScript e Vite. Mapas, leitura de PDF e geradores de documentos são carregados sob demanda. O aplicativo precisa de HTTPS para receber arquivos e calcular o hash.

## Implantação no Supabase dedicado

1. Criar o projeto AGROGEST na organização AGROGEST, região São Paulo. Nunca aplicar a migração em projetos de outros sistemas.
2. Executar os arquivos de `supabase/migrations/` em ordem de nome, uma única vez, em um projeto novo. A migração inicial cria tabelas com RLS, políticas, índices, funções transacionais e um bucket privado de 20 MB por arquivo. A seguinte restringe a função administrativa padrão do Supabase e otimiza a leitura do JWT nas políticas de convites. No projeto acima ambas já foram aplicadas; não executar novamente a inicial.
3. Em Auth, configurar o Site URL e as URLs de redirecionamento com a URL pública exata, incluindo `/AGROGEST/`. Manter confirmação de e-mail habilitada. Configurar SMTP próprio para o volume de uso da equipe.
4. Definir no repositório, em Actions Variables: `AGROGEST_BACKEND_ENABLED=true`, `AGROGEST_SUPABASE_URL` e `AGROGEST_SUPABASE_PUBLISHABLE_KEY`. Usar a chave publicável; nunca service_role, secret key, senha do banco ou access token no frontend.
5. Publicar pelo workflow. Criar a primeira conta, confirmar e-mail e criar o escritório. A operação é transacional e não importa nenhum dado de demonstração.
6. O administrador libera o e-mail de cada integrante em Equipe. O integrante cria a conta com esse e-mail e entra em até 7 dias. A liberação não envia e-mails automaticamente.
7. Validar duas contas de empresas distintas, um técnico atribuído, envio e leitura de arquivo privado, mudança de etapa e revisão de documento. Executar os Advisors do Supabase antes de disponibilizar para a equipe. Definir e testar a rotina de backup e restauração.

## Segurança e testes

- RLS verifica empresa e responsável por UUID; nomes e user_metadata não autorizam acesso.
- Técnicos acessam a carteira atribuída. Gestores e administradores veem o escritório.
- Arquivos possuem caminhos por empresa e usuário, sem bucket público. Leituras passam por políticas e links assinados de curta duração.
- Conferências atualizam produtor, imóvel e documento em uma transação; conflito de versão desfaz tudo.
- Auditoria é escrita por gatilhos do banco e não pode ser criada ou editada pelo cliente.
- A equipe não consegue desativar o último administrador.
- `npm test` cobre regras do domínio e cenários de isolamento, convites, arquivos e concorrência em PostgreSQL.

## Limites explícitos da v1

A leitura local extrai alguns padrões de PDFs com texto. Fotos e PDFs digitalizados são conferidos manualmente. Extração por IA, sincronização com Drive, cruzamentos ambientais oficiais, integração com portais bancários e relatórios oficiais serão desenvolvidos como integrações próprias. Os documentos gerados são minutas para revisão e assinatura do responsável técnico.

A demonstração e a produção usam o mesmo layout; somente o modo autenticado conectado ao Supabase oferece persistência compartilhada e controle real de acesso.
