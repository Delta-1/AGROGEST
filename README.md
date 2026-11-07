# AGROGEST Assessoria

Primeira versão visual do escritório rural da AGROGEST, com navegação horizontal no topo, identidade azul e verde e adaptação para celular.

## O que pode ser explorado

- Painel com prioridades, indicadores, agenda e carteira por etapa.
- Produtores: pesquisa, filtros, ficha, cadastro, edição e pendências.
- Imóveis: áreas, dados fundiários, localização e perímetro GeoJSON.
- Documentos: recebimento local, conferência lado a lado, divergências e aplicação dos campos confirmados.
- Processos: quadro Kanban, lista, filtros, movimentações com justificativa e histórico.
- Demandas: criação, conclusão, reabertura e prazos.
- Certidões: registro de validade e vínculo com documentos.
- Laudos: pré-visualização e exportação de minutas próprias em PDF e DOCX.
- Equipe, regras de pendência, prazos, calendário e histórico da demonstração.
- Busca global, notificações e prévia da tela de entrada pelo menu de perfil.

## Limites desta versão

**O banco de dados fica desligado.** Não há autenticação real, controle de permissões em produção nem consultas ambientais oficiais. IA, sincronização com Drive, convites e integrações bancárias serão desenvolvidos em outra etapa.

O aplicativo abre com exemplos fictícios. Alterações ficam no navegador; arquivos de teste ficam no IndexedDB. Use apenas dados fictícios. Para voltar aos exemplos: **Gestão → Configurações → Dados → Reiniciar demonstração**.

O texto de PDFs pode sugerir alguns campos por padrões locais. A leitura não utiliza uma IA: fotos e PDFs digitalizados exigem preenchimento manual. Cada campo deve ser revisado antes de aplicar.

## Desenvolvimento

```bash
npm ci
npm run dev
npm test
npm run build
```

React 19, TypeScript e Vite. Mapas, leitura de PDF e geradores de documentos são carregados sob demanda. Use HTTPS para testar o recebimento de arquivos e a API de hash do navegador.

Nenhuma variável ou chave do Supabase é necessária para a prévia. `VITE_ENABLE_BACKEND` permanece `false`; os adaptadores existentes não ativam nenhuma conexão.

## GitHub Pages

O workflow `pages.yml` executa testes, gera a versão estática e publica com o prefixo `/AGROGEST/`. Configure **Settings → Pages → Source → GitHub Actions** para habilitar a publicação no repositório. O workflow não executa migrações nem acessa Supabase.
