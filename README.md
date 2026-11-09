# AGROGEST Assessoria · Site e Hub

Site público da empresa e portal exclusivo da equipe, com navegação horizontal no topo. React 19, TypeScript, Vite e Supabase. Publicação pelo GitHub Pages:

https://delta-1.github.io/AGROGEST/

## Site público

A página inicial apresenta a Agrogest, serviços e equipe, com imagem de destaque ampliável e botão **Acessar Hub** no canto superior direito. O administrador edita a apresentação, biografia, contato, imagem, galeria e vídeo em **Gestão → Site da empresa**. São aceitos vídeos do YouTube ou arquivos MP4/WebM. Sem vídeo configurado, o bloco de vídeo fica oculto.

O questionário guiado de quatro etapas envia solicitações para **Contatos → Solicitações do site**, visíveis somente ao RH/gestores e administradores. A API valida campos, limita repetição por contato e não permite consultar mensagens anonimamente. Os botões de WhatsApp, telefone e e-mail aparecem quando o administrador configura os canais comerciais. Nenhum telefone, endereço ou e-mail pessoal foi inventado ou publicado. A paisagem inicial é ilustrativa; a empresa pode substituí-la por imagens próprias.

A logo utilizada é PNG com transparência. Mídias do site são explicitamente públicas, em um bucket separado dos documentos privados.

## Acesso da equipe

O Hub atende somente a AGROGEST. Não há autocadastro, criação de escritórios pelo visitante ou necessidade de criar um e-mail. A pessoa entra com **login e senha** fornecidos pela empresa.

- **Administrador:** gerencia o Hub, site, acessos e permissões.
- **RH / Gestor:** cria logins de técnicos, redefine senhas, desativa/reativa esses acessos e acompanha o trabalho da empresa.
- **Técnico:** acessa a carteira atribuída, documentos autorizados e os seus contatos/atividades.

A administração usa a Edge Function `agrogest-staff`, que verifica o usuário via `auth.getUser()` e consulta o vínculo ativo e o perfil. A chave privilegiada fica somente no servidor. O acesso não depende de `user_metadata`. Cada login usa um identificador de autenticação interno, `login@acesso.agrogest.invalid`; isso não cria uma caixa de e-mail e não é um canal para envio de mensagens.

As senhas temporárias precisam ter 12 a 128 caracteres. No primeiro acesso ou após redefinição pelo RH, a pessoa deve trocar a senha. O banco bloqueia o acesso aos dados até a troca; a liberação verifica a mudança real do hash da senha, sem expor o hash ao cliente. Inativar um integrante bloqueia os dados inclusive para tokens já emitidos. O último administrador não pode ser desativado.

### Administrador inicial

Somente um administrador inicial é preparado. Não existem senhas padrão ou credenciais no repositório. Para concluir a ativação no projeto dedicado:

1. Manter **Authentication → Sign In / Providers → Allow new users to sign up** desabilitado.
2. Em **Authentication → Users → Add user → Create new user**, usar o identificador interno `admin@acesso.agrogest.invalid`.
3. O proprietário define pessoalmente uma senha forte, mantém **Auto Confirm User** ativado e cria o usuário.
4. O gatilho do banco configura a empresa AGROGEST, o perfil administrador e as regras iniciais, sem importar exemplos.
5. Entrar pelo site em **Acessar Hub**, login `admin`, com a senha escolhida.
6. Em **Equipe e logins**, criar o acesso do RH e os demais logins quando necessário.

SMTP não é necessário para este fluxo de logins internos. A recuperação é feita pelo RH/administrador. Não habilitar envio de mensagens para os identificadores `.invalid`.

## Módulos do Hub

Produtores, contatos, imóveis rurais, rebanho, documentação privada, conferência de dados, processos Kanban, agenda, certidões com validade, minutas PDF/DOCX, regras e histórico. Revisões de registros impedem sobrescrever alterações concorrentes. Conferências atualizam produtor, imóvel e documento em uma transação. A auditoria dos dados é gerada pelo banco.

Documentos privados aceitam até 20 MB por arquivo e são lidos por autorização e links assinados. Mídias públicas do site aceitam PNG/JPG/WebP/MP4/WebM, até 40 MB. Enviar mídia e publicar o conteúdo são etapas distintas. Retirar uma imagem da galeria remove sua exibição, preservando o arquivo enviado.

A demonstração explícita usa `?preview=1` e dados fictícios do navegador. Ela não cria logins nem publica o site. A produção começa vazia.

## Implantação

Projeto Supabase dedicado `oadyjxanjroyfriythcz`, organização AGROGEST (Free, São Paulo). Nunca aplicar as migrações em outros sistemas.

- Executar os arquivos de `supabase/migrations/` em ordem em um projeto novo. No projeto acima eles já foram aplicados; não repetir a migração inicial.
- Publicar `supabase/functions/agrogest-staff/index.ts`. `verify_jwt=false` é intencional: o código verifica o token com `auth.getUser` e exige vínculo ativo de RH/admin. O validador legado não aceita todas as chaves modernas.
- Manter Site URL e redirecionamento em `https://delta-1.github.io/AGROGEST/`.
- Actions Variables: `AGROGEST_BACKEND_ENABLED=true`, `AGROGEST_SUPABASE_URL`, `AGROGEST_SUPABASE_PUBLISHABLE_KEY`. Nunca publicar service_role, secret key, senha do banco ou access token no frontend.
- Configurar backup/restauração e validar a primeira conta e um upload autenticado antes de registrar os documentos reais da equipe.

## Desenvolvimento e verificação

```bash
npm ci
npm run dev
npm test
npm run build
```

A suíte inclui testes de domínio, questionário e permissões. Os testes das migrações iniciais preservam a verificação das regras históricas; os testes do Hub executam todas as migrações e validam administrador inicial, matrícula fechada, permissões do RH, troca obrigatória de senha, contatos privados, site público e formulário protegido. O build verifica TypeScript e gera os arquivos estáticos.

No servidor, o autocadastro está desabilitado, o conteúdo institucional pode ser lido publicamente e a Edge Function rejeita chamadas sem autenticação. Os Advisors de segurança foram executados após a migração. A validação final do login e upload online depende da senha inicial definida pelo proprietário.

## Limites da v1

A leitura local extrai padrões de PDFs com texto e usa Tesseract.js 7 para OCR em português de JPG, PNG e PDFs digitalizados. O worker, WASM e modelo são servidos pelo próprio Pages. O conteúdo não é enviado a um serviço de OCR. O limite é de 12 páginas digitalizadas por arquivo e 150 páginas totais por PDF. Falhas preservam o original para conferência manual. Extração por IA, sincronização Drive, cruzamentos ambientais oficiais, integração bancária e relatórios oficiais continuam como integrações futuras. Os documentos gerados são minutas para revisão e assinatura do responsável técnico.

## Guia de uso

Veja [Como usar o Agrogest Hub](docs/COMO_USAR.md), também disponível no botão **Ajuda** dentro do Hub.

## Questionário de atendimento

O visitante escolhe serviço, atividade, situação atual, município/UF e urgência, informa os contatos e revisa antes de enviar. As respostas são serializadas com `schema: agrogest.intake.v1` no campo `site_messages.message`, pelo RPC existente. O inbox do RH/admin apresenta os dados por pergunta e mantém suporte às mensagens antigas em texto. Não cria cadastro de produtor automaticamente.

## OCR local

`src/lib/documentReader.ts` extrai texto nativo com PDF.js e aplica OCR às páginas com menos de 50 caracteres sem espaços. Em PDFs mistos, o limite de 12 vale para as páginas que exigem OCR; o texto das demais continua sendo lido. Falhas e páginas omitidas são indicadas na revisão. Nome e nascimento só são sugeridos quando os rótulos são reconhecidos. Os valores continuam sujeitos à validação e conferência.

`scripts/copy-ocr-assets.mjs` copia os ativos das dependências fixadas para `dist/assets/ocr/` no build. No desenvolvimento, copia para `public/assets/ocr/` (ignorado no Git). Nenhuma chave ou serviço pago é necessário para OCR local.

## Railway

O frontend permanece no Pages e o Supabase mantém Auth, Postgres e arquivos privados. Um serviço dedicado no Railway pode futuramente processar filas de OCR/IA em lote, com validação de JWT, limite de recursos e credenciais apenas no servidor. Não compartilhar o serviço nem o banco de outros sistemas. Nenhum serviço Railway foi provisionado nesta atualização.
