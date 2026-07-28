# Contribuindo com o site do Clp

Obrigado por contribuir. Este repositório é o site estático de marketing e download do [Clp](https://github.com/erick-ribeiro/clp-app).

## Como contribuir

1. Abra uma [issue](https://github.com/erick-ribeiro/clp-site/issues) para bugs ou ideias (quando fizer sentido).
2. Faça um fork e crie uma branch a partir de `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b minha-mudanca
   ```
3. Implemente a mudança com commits claros e focados.
4. Valide localmente:
   ```bash
   python3 -m http.server 8080
   ```
   Abra `http://localhost:8080` e confira desktop/mobile.
5. Abra um pull request descrevendo o problema e a solução.

Não envie commits diretamente para `main`. A branch padrão é protegida e mudanças entram por PR.

## Escopo

- Prefira PRs pequenos e revisáveis.
- Mantenha o visual e o tom atuais do site.
- A versão/download em produção vêm do GitHub Release *latest* do app; não é necessário versionar o DMG neste repo para releases.
- Não altere secrets, tokens de deploy nem URLs internas do painel.

## Licença

Ao contribuir, você concorda que suas contribuições sejam licenciadas sob a [MIT](LICENSE).
