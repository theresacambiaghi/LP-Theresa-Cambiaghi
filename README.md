# LP Theresa Cambiaghi

Landing page temporária do novo estúdio Theresa Cambiaghi Pilates, com pesquisa em formato de quiz e integração segura com Google Sheets.

## Estrutura

- `public/`: página, estilos, JavaScript e imagem da campanha.
- `api/submit.js`: função serverless da Vercel que valida e encaminha as respostas.
- `api/availability.js`: consulta as vagas restantes de cada horário do aulão.
- `google-apps-script.gs`: código para receber os dados na planilha.

## Conectar a planilha

1. Crie ou abra a planilha no Google Sheets.
2. Acesse **Extensões → Apps Script** e cole o conteúdo de `google-apps-script.gs`.
3. Em **Configurações do projeto → Propriedades do script**, crie `WEBHOOK_SECRET` com um valor longo e aleatório.
4. Clique em **Implantar → Nova implantação → Aplicativo da Web**.
5. Execute como **você** e permita acesso para **qualquer pessoa**. A proteção é feita pelo segredo enviado somente pelo servidor.
6. Copie a URL final terminada em `/exec`.
7. Na Vercel, adicione `SHEETS_WEBHOOK_URL` e `SHEETS_WEBHOOK_SECRET` em **Settings → Environment Variables** para Production, Preview e Development.

O Apps Script usa um bloqueio durante cada inscrição e limita cada turma do aulão a 8 pessoas. Ao atualizar esse código depois da primeira publicação, abra **Implantar → Gerenciar implantações**, edite a implantação, escolha **Nova versão** e confirme. A URL `/exec` permanece a mesma.

## Publicar na Vercel

1. No painel da Vercel, selecione **Add New → Project**.
2. Conecte a conta ou organização do GitHub que possui o repositório, caso ela ainda não esteja conectada.
3. Localize `theresacambiaghi/LP-Theresa-Cambiaghi` e clique em **Import**.
4. Mantenha **Root Directory** como `./` e escolha **Framework Preset: Other**.
5. Não informe Build Command nem Output Directory: a Vercel publica `public/` e reconhece `api/submit.js` como função serverless.
6. Em **Environment Variables**, cadastre `SHEETS_WEBHOOK_URL` e `SHEETS_WEBHOOK_SECRET` para Production, Preview e Development.
7. Clique em **Deploy**.
8. Em **Project → Settings → Git**, confirme que **Production Branch** está configurada como `main`.

Depois dessa conexão inicial, o fluxo normal é:

```bash
git add <arquivos-alterados>
git commit -m "descrição da alteração"
git push origin main
```

O commit é apenas local. É o `git push origin main` que envia a alteração ao GitHub e dispara automaticamente uma nova publicação de produção na Vercel. Branches diferentes de `main` e pull requests geram previews sem substituir o site principal.

## Domínio na GoDaddy

Adicione primeiro o domínio em **Vercel → Project → Settings → Domains**. A Vercel mostrará os registros DNS exatos que devem ser criados na GoDaddy. Preserve registros MX e TXT existentes, especialmente os usados por e-mail. Após alterar o DNS, volte à Vercel e aguarde a verificação e a emissão automática do HTTPS.
