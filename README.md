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

## Ativar o primeiro acesso da equipe

Antes do novo deploy, abra **Project configuration > Environment variables**, escolha **Add a variable** e crie:

- **Key:** `RURAL_INITIAL_PASSWORD`
- **Value:** escolha uma senha temporária forte, com pelo menos 8 caracteres.

Essa senha temporária funciona para os usuários `igor`, `laryssa`, `ricardo` e `rinaldo`. No primeiro acesso, cada pessoa será obrigada a cadastrar sua própria senha. A senha não deve ser colocada no Git nem no arquivo `netlify.toml`.

## Observação sobre a área da equipe

A área da equipe, os jogos e as assinaturas usam o Netlify Blobs, provisionado automaticamente pelo próprio Netlify. Não é necessário criar Firebase nem configurar outro banco para começar. O placar é sincronizado em intervalos curtos; para uma evolução futura com muitos jogos simultâneos e análises avançadas, poderá ser migrado para um banco relacional em tempo real.
