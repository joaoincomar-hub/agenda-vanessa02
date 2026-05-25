# Agenda Vanessa Rorig

App Expo/React Native para agenda de atendimentos da Vanessa Rorig.

## Usar no Expo Snack

1. Abra https://snack.expo.dev/.
2. Crie um Snack novo.
3. Copie o conteudo de `App.tsx` para o arquivo principal do Snack.
4. No painel de dependencias do Snack, adicione:
   - `@expo/vector-icons`
   - `@react-native-async-storage/async-storage`
   - `@supabase/supabase-js`
   - `expo-image-picker`
   - `expo-notifications`
   - `expo-constants`
5. O admin autorizado ja esta definido como `vanessarorigterapias@gmail.com`.
6. Teste no celular usando o app Expo Go.

## Antes de publicar

1. No Supabase, crie a conta da Vanessa em Authentication com o e-mail `vanessarorigterapias@gmail.com`.
2. Rode o arquivo `SUPABASE_SETUP.sql` no SQL Editor do Supabase.
3. Use a senha escolhida somente no Supabase, nunca dentro do codigo do app.
4. Confira se as tabelas existem:
   - `clientes`
   - `servicos`
   - `agendamentos`
   - `bloqueios`
   - `backups`

## Gerar app Android

Quando for sair do Snack e gerar APK/AAB:

```bash
npm install
npx eas login
npx eas build:configure
npm run build:android
```

Para Play Store:

```bash
npm run build:android:store
```

## Gerar site

```bash
npm install
npm run export:web
```

O site exportado fica na pasta `dist`.

## Publicar GitHub + Render

Veja o passo a passo completo em `PUBLICAR_GITHUB_RENDER.md`.

## Agendamento rapido

O app tambem permite `Agendar sem criar conta`. Esse caminho salva o cliente e o agendamento direto no Supabase, entao rode novamente `SUPABASE_SETUP.sql` quando atualizar as politicas do banco.
