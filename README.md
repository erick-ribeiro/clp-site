# Clp Site

Site one-page de marketing e download do [Clp](https://github.com/erick-ribeiro/clp-app) — gerenciador de clipboard nativo para macOS 26.

Stack: HTML + CSS + JS estático. `npm run build` só monta a pasta `dist/` para a Cloudflare; não transpila nada.

## Estrutura

```
clp-site/
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   ├── favicon.svg
│   └── og-image.png
├── downloads/
│   └── Clp-0.2.1.dmg   # adicione o DMG aqui
├── _headers            # cache e Content-Disposition no edge
├── wrangler.jsonc      # Workers Static Assets, sem domínio custom
└── scripts/build.mjs   # gera dist/
```

## Desenvolvimento local

Qualquer servidor estático na raiz do projeto:

```bash
# Python
python3 -m http.server 8080

# Node
npx --yes serve -l 8080
```

Abra `http://localhost:8080`.

Para ver o mesmo output que a Cloudflare serve, com fallback de `index.html` e os headers de `_headers`:

```bash
npm ci
npm run preview
```

O preview sobe em `http://localhost:8787` e não publica nada.

## Configurar download e URLs

Em `index.html`, `window.CLP_CONFIG` define o repositório e **fallbacks** (versão/URL usadas se a API do GitHub falhar):

```js
window.CLP_CONFIG = {
  downloadUrl: "https://github.com/erick-ribeiro/clp-app/releases/download/v0.2.1/Clp-0.2.1.dmg",
  version: "0.2.1",
  githubUrl: "https://github.com/erick-ribeiro/clp-app",
};
```

Em runtime, `assets/js/main.js` busca `GET /repos/{owner}/{repo}/releases/latest`, pega o asset `.dmg` e atualiza botões/`[data-version]`. Assim, publicar um novo GitHub Release com o DMG já atualiza o site — sem redeploy.

Meta OG / Twitter usam `https://clp.erick.page/` como URL canônica.

## Incluir o DMG

```bash
cp ../clp-app/dist/Clp-0.2.1.dmg ./downloads/Clp-0.2.1.dmg
```

A v0 é ad-hoc (sem notarização). O site avisa sobre **Abrir mesmo assim** em Privacidade e Segurança.

## Deploy

O site em produção continua na VPS (nginx via `Dockerfile` / EasyPanel) até a virada de DNS, prevista antes de 02/12/2026. A config da Cloudflare não declara domínio: um deploy sobe só o hostname `*.workers.dev` e não mexe em `clp.erick.page`.

### Cloudflare (plano gratuito)

Caminho recomendado: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), sem script de aplicação. O plano gratuito cobre este site: poucos arquivos, cada um abaixo de 25 MiB e do teto de 20.000 arquivos por versão. Pedido que serve arquivo estático é gratuito e ilimitado; a config não usa `run_worker_first`. URL desconhecida devolve `index.html`, no mesmo espírito do `try_files` do nginx.

`npm run build` gera `dist/` com `index.html`, `assets/`, `_headers` e, se existir, o DMG em `downloads/`. Ficam de fora Dockerfile, nginx, docs e qualquer arquivo que pareça segredo. O build falha se um arquivo passar de 25 MiB — nesse caso o DMG continua no GitHub Release, que já é o URL usado por `CLP_CONFIG`.

Não há token, `account_id` nem rota neste repositório. Autentique o Wrangler na sua máquina (`npx wrangler login`) ou guarde o API token só no painel da Cloudflare / no secret do CI, nunca no git.

#### Workers Builds

1. No painel: **Workers & Pages → Create → Workers → Connect to Git** e escolha este repositório.
2. Branch de produção: `main`.
3. Build command: `npm run build`
4. Deploy command: `npx wrangler deploy`
5. Não adicione custom domain ainda.

O primeiro deploy pode pedir a criação do subdomínio `workers.dev` no painel. Isso não altera o DNS de `erick.page`. Confira o site em `https://clp-site.<sua-subdomain>.workers.dev` antes de qualquer corte.

#### Wrangler, na sua máquina

```bash
npm ci
npx wrangler login
npm run deploy
```

`npm run deploy` roda o build e publica o Worker. Sem `routes` no `wrangler.jsonc`, o destino é só `*.workers.dev`.

#### Pages, se preferir

O mesmo `dist/` serve para Pages. No projeto Pages:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Não conecte o mesmo repositório nos dois produtos ao mesmo tempo.

#### Virada do domínio (manual, depois da validação)

Faça isto só quando o hostname novo estiver conferido, e antes de desligar a VPS em 02/12/2026. Este passo muda DNS; não está na config do repo de propósito.

- Se `erick.page` já estiver na mesma conta Cloudflare: no Worker, **Settings → Domains & Routes → Add → Custom Domain** e informe `clp.erick.page`. A Cloudflare cria o registro. Não coloque essa rota no `wrangler.jsonc` sem querer repetir a mudança em todo deploy.
- Se o DNS continuar no provedor atual: aponte um CNAME de `clp` para `clp-site.<sua-subdomain>.workers.dev` (ou para o hostname `pages.dev`, se tiver usado Pages).
- Quando `https://clp.erick.page/` responder pela Cloudflare, desative o Auto Deploy do EasyPanel e o secret `EASYPANEL_DEPLOY_WEBHOOK` pode ser removido.

### EasyPanel (VPS)

O serviço deve apontar para este repositório (`main`) e usar o `Dockerfile` na raiz.

**Opção A — Auto Deploy nativo:** no EasyPanel, ative *Auto Deploy* no serviço. Ele cria o webhook no GitHub e redeploya a cada push.

**Opção B — GitHub Action (este repo):** em cada push na `main`, a Action chama o *Deploy Webhook* do EasyPanel.

1. No EasyPanel, abra o serviço → copie a URL de **Deploy Webhook** / *Deployment Trigger* (algo como `https://seu-painel/api/deploy/<token>`).
2. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `EASYPANEL_DEPLOY_WEBHOOK`
   - Value: a URL completa do webhook
3. Faça push na `main` (ou rode o workflow *Deploy EasyPanel* manualmente em Actions).

Não cole o token no código — só no secret do GitHub.

### GitHub Pages

1. Settings → Pages → Deploy from a branch (`main` / `/` root), **ou**
2. Action com `peaceiris/actions-gh-pages` publicando `.`.

Se o site ficar em `https://user.github.io/clp-site/`, troque paths absolutos (`/assets/...`, `/downloads/...`) por relativos ou configure `base`.

### Netlify / Vercel

- Publish directory: `.`
- Sem comando de build
- Arraste a pasta ou conecte o Git

`vercel.json` mínimo (opcional):

```json
{
  "cleanUrls": true,
  "headers": [
    {
      "source": "/downloads/(.*)",
      "headers": [
        { "key": "Content-Disposition", "value": "attachment" }
      ]
    }
  ]
}
```

### Nginx (VPS)

```nginx
server {
  listen 443 ssl http2;
  server_name clp.erick.page;
  root /var/www/clp-site;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /downloads/ {
    add_header Content-Disposition "attachment";
  }
}
```

## Checklist pré-lançamento

- [ ] GitHub Release publicado com o asset `.dmg`
- [ ] Fallbacks em `CLP_CONFIG` razoáveis (versão anterior ok)
- [x] URLs canônicas / OG em `clp.erick.page`
- [ ] Favicon e `og-image.png` acessíveis publicamente
- [ ] Teste mobile + desktop (glass e CTAs)
- [ ] Teste do fluxo “Abrir mesmo assim” documentado na página

## Licença

Distribuído sob a licença [MIT](LICENSE).

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md).
