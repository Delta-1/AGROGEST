# Como usar o Agrogest Hub

O sistema reúne o site institucional e o espaço de trabalho interno da Agrogest Assessoria. O visitante não cria conta. Os acessos da equipe são fornecidos pela empresa.

## 1. Entrar como administrador

O login reservado é **`admin`**. A senha será a que o proprietário definir na ativação. Não existe senha padrão nem senha publicada no código.

Para ativar o primeiro acesso no projeto Supabase **AGROGEST** (`oadyjxanjroyfriythcz`):

1. Abra **Authentication → Users → Add user → Create new user**.
2. No campo de e-mail, use `admin@acesso.agrogest.invalid`. É um identificador interno; nenhuma caixa de e-mail precisa ser criada.
3. Defina pessoalmente uma senha com pelo menos 12 caracteres. Mantenha **Auto Confirm User** marcado e crie o usuário.
4. O banco prepara automaticamente a empresa e o administrador. Não importa os dados da demonstração.
5. No site, clique em **Acessar Hub** e entre com **admin** e a senha que escolheu.

Esta ativação acontece uma única vez. Não repita a criação se o administrador já existir. Se esquecer a senha do administrador inicial, a recuperação deve ser feita pelo proprietário no Supabase.

## 2. Como o visitante pede atendimento

Na página pública, **Começar atendimento** abre um questionário de quatro etapas:

1. **Necessidade:** crédito/projeto rural, documentação, imóvel/regularização, acompanhamento ou orientação.
2. **Contexto:** atividade, situação atual, município/UF e urgência. Pode indicar um prazo.
3. **Contato:** nome e telefone com DDD; e-mail opcional.
4. **Revisão:** confere as respostas, volta para corrigir e envia.

Depois do envio confirmado, pode abrir o WhatsApp da empresa com o resumo preparado. A própria pessoa escolhe enviar a mensagem no WhatsApp. O questionário já fica salvo no Hub mesmo que ela não abra esse aplicativo.

## 3. Como a equipe atende

O RH/gestor ou administrador abre **Contatos → Solicitações do site**. Cada solicitação mostra as respostas por pergunta e os canais de contato. Altere de **Novo** para **Em atendimento** e depois para **Concluído**.

Os botões abrem telefone, WhatsApp ou e-mail para o atendente iniciar a conversa. O Hub não envia respostas automaticamente nem sincroniza o histórico do WhatsApp.

A solicitação não cria um cadastro de produtor automaticamente. Após conversar e conferir os dados, cadastre o produtor e escolha o responsável. O técnico trabalha na carteira atribuída; a triagem das solicitações do site fica com RH e administrador.

## 4. Para que serve cada aba

| Aba | Como usar |
| --- | --- |
| Visão geral | Veja ações do dia, pendências e processos que precisam de atenção. |
| Produtores | Cadastre dados pessoais, contatos, responsável e informações do produtor. Abra a ficha para ver os vínculos e as pendências. |
| Contatos | Organize produtores, parceiros, bancos e órgãos. RH/admin também leem as solicitações do site. |
| Imóveis rurais | Vincule os imóveis ao produtor, registre áreas, município, situação fundiária, CAR, INCRA e rebanho. |
| Documentos | Envie os originais, leia o texto e confira as sugestões antes de aplicar nos cadastros. |
| Processos | Acompanhe o trabalho por etapas no quadro, com responsáveis e prazos. |
| Agenda | Registre demandas, datas e conclusão. |
| Ferramentas → Certidões | Registre certidões obtidas nos órgãos, resultados, comprovantes e validades. |
| Ferramentas → Laudos e formulários | Gere minutas PDF ou DOCX a partir dos dados conferidos. Revise e encaminhe para assinatura do responsável técnico. |
| Ferramentas → Ambiental | Consulte imóveis no mapa e as referências cadastradas. Os cruzamentos oficiais automáticos ainda precisam de integração. |
| Gestão → Equipe | Crie e gerencie os acessos internos conforme seu perfil. |
| Gestão → Configurações | Ajuste parâmetros, regras, prazos e feriados; consulte histórico e exporte os dados acessíveis. |
| Gestão → Site da empresa | O administrador publica biografia, apresentação, imagens, galeria e vídeo institucional. |

## 5. Ler um documento e aproveitar os dados

1. Abra **Documentos → Enviar documentos**.
2. Se souber, selecione o produtor, imóvel e tipo. Caso contrário, mantenha a identificação para a conferência.
3. Selecione PDF, JPG ou PNG. Limites: 20 MB por arquivo e 20 arquivos por envio. O sistema identifica duplicados pelo conteúdo.
4. Aguarde a leitura. PDFs com texto são lidos diretamente; fotos e páginas digitalizadas usam OCR em português no navegador.
5. Clique em **Conferir**. Compare o original com cada sugestão, corrija erros e selecione os campos que deseja aproveitar.
6. Escolha o produtor e o imóvel de destino. É possível criar o produtor durante a conferência.
7. Confira os avisos de divergência com os valores atuais. Marque **Conferi os campos selecionados com o original** e clique em **Aplicar campos conferidos**.

**Ler novamente** refaz a leitura do original e substitui as sugestões ainda não aplicadas. A leitura, por si só, nunca altera o cadastro. A aplicação registra a origem e o histórico.

O OCR tem limite de **12 páginas digitalizadas por arquivo**. O PDF pode ter até **150 páginas** para leitura; nas páginas com texto, o conteúdo continua sendo extraído. Se houver páginas omitidas ou falha de OCR, a revisão mostra o aviso e preserva o original para conferência manual. Divida arquivos extensos quando precisar ler todas as páginas digitalizadas.

Fotos nítidas, sem cortes e com boa iluminação produzem melhores resultados. Nome, CPF, nascimento, CAR, áreas e INCRA só são sugeridos quando os padrões são encontrados. Isso não valida a autenticidade do documento nem substitui a revisão da equipe.

## 6. Criar logins de colaboradores

Em **Gestão → Equipe**, informe nome, login, perfil e senha temporária. Não é necessário criar e-mail. Entregue o login e a senha ao colaborador por um canal privado.

| Perfil | Acesso |
| --- | --- |
| Administrador | Gerencia o Hub, site, acessos e permissões. |
| RH / Gestor | Acompanha os dados da empresa, atende a caixa do site e gerencia acessos de técnicos. |
| Técnico | Trabalha com a carteira atribuída e os registros autorizados. |

No primeiro acesso ou após redefinição pelo RH, o colaborador precisa escolher uma nova senha de pelo menos 12 caracteres. Até a troca, os dados ficam bloqueados. A equipe pode desativar um acesso quando necessário; o último administrador é protegido contra desativação.

## 7. Mudar o WhatsApp e o conteúdo público

O número inicial é **+55 68 9605-5271**, conforme informado pelo proprietário.

Para mudar: **Gestão → Configurações → Contato do site → WhatsApp de atendimento → Salvar WhatsApp**. O administrador pode salvar outro número com DDD e código do país. A alteração passa a valer para os links comerciais do site e para o botão após o questionário.

Em **Gestão → Site da empresa**, edite os textos e a biografia, envie as imagens e configure a galeria ou o vídeo. Publicar o conteúdo é uma etapa distinta de enviar a mídia. A logo é PNG com transparência. As imagens e os vídeos institucionais são públicos; não coloque documentos de clientes nessa área.

## 8. Histórico, dados e demonstração

As alterações e conferências ficam no histórico. Revisões de registros evitam sobrescrever uma edição mais recente; se aparecer aviso de conflito, atualize os dados antes de salvar outra vez.

**Configurações → Dados → Exportar dados acessíveis** baixa JSON dos registros disponíveis para seu perfil. Esse arquivo não inclui os documentos originais e não substitui um backup completo de banco e arquivos.

A demonstração é aberta com `?preview=1`. Usa dados fictícios e arquivos locais do navegador. Questionários enviados nela aparecem somente na caixa da demonstração; não chegam à empresa. Em **Configurações → Dados**, é possível reiniciar os exemplos. A produção começa sem os cadastros fictícios.

## 9. O que já funciona e o que ainda depende de integração

Já implementado: site, questionário, caixa de triagem, cadastros, documentos privados, OCR local, conferência, processos, agenda, controles de validade, minutas, regras, histórico, logins internos e permissões. O primeiro login real e o upload autenticado precisam ser validados depois da ativação do administrador.

Ainda dependem de integração: interpretação por IA, sincronização com Google Drive, conversas automáticas de WhatsApp, emissão oficial de certidões, cruzamentos ambientais oficiais e integração bancária. Minutas precisam de revisão e assinatura técnica.

## 10. Onde o Railway pode ajudar

É possível manter o site no GitHub Pages e usar um serviço dedicado no Railway para trabalhos demorados, como lotes grandes de OCR, interpretação por IA e filas de processamento. O Supabase continua responsável pelo login, dados e arquivos privados.

A primeira leitura de documentos já funciona no navegador e não exige esse serviço. Para a próxima fase, a recomendação é criar um backend exclusivo da Agrogest, validar o login em cada requisição e guardar as chaves somente no servidor. Isso exige definir os limites de uso e o custo da hospedagem. Nenhum novo serviço pago foi criado nesta atualização.
