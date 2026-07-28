# Clp Site

Site one-page de marketing e download do [Clp](https://github.com/erick-ribeiro/clp-app) — gerenciador de clipboard nativo para macOS 26.

Stack: HTML + CSS + JS estático. Sem build step.

## Estrutura

```
clp-site/
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   ├── favicon.svg
│   └── og-image.png
└── downloads/
    └── Clp-0.2.0.dmg   # adicione o DMG aqui
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

## Configurar download e URLs

Em `index.html`, `window.CLP_CONFIG` define o repositório e **fallbacks** (versão/URL usadas se a API do GitHub falhar):

```js
window.CLP_CONFIG = {
  downloadUrl: "https://github.com/erick-ribeiro/clp-app/releases/download/v0.2.0/Clp-0.2.0.dmg",
  version: "0.2.0",
  githubUrl: "https://github.com/erick-ribeiro/clp-app",
};
```

Em runtime, `assets/js/main.js` busca `GET /repos/{owner}/{repo}/releases/latest`, pega o asset `.dmg` e atualiza botões/`[data-version]`. Assim, publicar um novo GitHub Release com o DMG já atualiza o site — sem redeploy.

Meta OG / Twitter usam `https://clp.erick.page/` como URL canônica.

## Incluir o DMG

```bash
cp ../clp-app/dist/Clp-0.2.0.dmg ./downloads/Clp-0.2.0.dmg
```

A v0 é ad-hoc (sem notarização). O site avisa sobre **Abrir mesmo assim** em Privacidade e Segurança.

## Deploy

O site é 100% estático: publique a pasta raiz.

### Cloudflare Pages

1. Conecte o repositório ou faça upload direto.
2. Build command: *(vazio)*
3. Output directory: `/` (raiz)
4. Em Custom domain, aponte o domínio desejado.

Via Wrangler:

```bash
npx wrangler pages deploy . --project-name=clp-site
```

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

O site acompanha o app Clp (MIT). Textos e assets desta pasta: MIT.
