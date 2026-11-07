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

A interface e a base de produção estão implementadas. A ativação depende de concluir a criação do projeto dedicado no Supabase, aplicar a migração, configurar autenticação e publicar com as variáveis do projeto. **Sem isso, o ambiente não deve receber dados reais.** A suíte de banco executa a migração em PostgreSQL local via PGlite; não substitui o teste final do Supabase online.

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
2. Executar `supabase/migrations/20261107201827_initial_agrogest_production.sql` no SQL Editor do projeto. O arquivo cria tabelas com RLS, políticas, índices, funções transacionais e um bucket privado de 20 MB por arquivo.
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
