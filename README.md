# Basquetebol da Rural — pacote para Netlify

Este pacote contém o site e o PWA do Basquetebol da Rural preparados para o Next.js no Netlify.

## Publicar por um repositório Git

1. Coloque o conteúdo desta pasta no repositório.
2. No Netlify, conecte o repositório.
3. Use estas configurações:
   - **Base directory:** deixe em branco se `package.json` estiver na raiz do repositório. Se esta pasta estiver dentro do repositório, use `basquetebol-da-rural-netlify`.
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Package directory:** deixe em branco.
4. Salve e escolha **Clear cache and deploy site**.

O arquivo `netlify.toml` já define o comando de compilação, o diretório `.next` e o Node.js 22. Não configure o diretório de publicação como `.` nem repita o diretório base no campo de publicação.

## Observação sobre a área da equipe

A parte pública, a instalação como aplicativo e as telas podem ser publicadas no Netlify. Login, banco de dados, placar compartilhado, assinaturas e APIs ainda dependem da ligação com um backend compatível. O pacote mantém essas telas, mas essa integração precisa ser configurada antes do uso oficial em tempo real.
