# LP Theresa Cambiaghi

Landing page temporária do novo estúdio Theresa Cambiaghi Pilates, com pesquisa em formato de quiz e integração segura com Google Sheets.

## Estrutura

- `public/`: página, estilos, JavaScript e imagem da campanha.
- `api/submit.js`: função serverless da Vercel que valida e encaminha as respostas.
- `google-apps-script.gs`: código para receber os dados na planilha.

## Conectar a planilha

1. Crie ou abra a planilha no Google Sheets.
2. Acesse **Extensões → Apps Script** e cole o conteúdo de `google-apps-script.gs`.
3. Em **Configurações do projeto → Propriedades do script**, crie `WEBHOOK_SECRET` com um valor longo e aleatório.
4. Clique em **Implantar → Nova implantação → Aplicativo da Web**.
5. Execute como **você** e permita acesso para **qualquer pessoa**. A proteção é feita pelo segredo enviado somente pelo servidor.
6. Copie a URL final terminada em `/exec`.
7. Na Vercel, adicione `SHEETS_WEBHOOK_URL` e `SHEETS_WEBHOOK_SECRET` em **Settings → Environment Variables** para Production, Preview e Development.

## Publicar na Vercel

Importe o repositório GitHub `theresacambiaghi/LP-Theresa-Cambiaghi`. A Vercel detecta este projeto sem necessidade de framework ou comando de build.

Cada push para `main` publica em produção; branches e pull requests geram previews.

## Domínio na GoDaddy

Adicione primeiro o domínio em **Vercel → Project → Settings → Domains**. A Vercel mostrará os registros DNS exatos que devem ser criados na GoDaddy. Preserve registros MX e TXT existentes, especialmente os usados por e-mail. Após alterar o DNS, volte à Vercel e aguarde a verificação e a emissão automática do HTTPS.
