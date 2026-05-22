# Publicar no GitHub e Render

## 1. Preparar o Supabase

1. Abra o Supabase do projeto.
2. Va em Authentication > Providers > Email.
3. Para o cadastro entrar direto no app, deixe "Confirm email" desativado.
4. Va em SQL Editor.
5. Abra o arquivo `SUPABASE_SETUP.sql`.
6. Confirme que o e-mail admin no SQL esta como `vanessarorigterapias@gmail.com`.
7. Rode o SQL.
8. Em Authentication > Users, crie a conta da Vanessa com esse mesmo e-mail e a senha combinada.

Sem esse passo, o cadastro pode criar a conta de login mas nao conseguir salvar a pessoa na tabela `clientes`.

## 2. Testar no Snack

1. Abra https://snack.expo.dev/.
2. Crie um Snack novo.
3. Copie o conteudo de `App.tsx` para o arquivo principal.
4. Adicione as dependencias:
   - `@expo/vector-icons`
   - `@react-native-async-storage/async-storage`
   - `@supabase/supabase-js`
   - `expo-image-picker`
   - `expo-notifications`
   - `expo-constants`
5. O admin autorizado ja esta definido como `vanessarorigterapias@gmail.com`.
6. Abra no celular pelo Expo Go e teste:
   - criar cadastro
   - entrar como cliente
   - agendar horario
   - entrar como Vanessa
   - ver cliente salvo

## 3. Subir no GitHub

Na pasta `jealous-violet-popsicle`, rode:

```bash
git init
git add .
git commit -m "Primeira versao da agenda Vanessa"
git branch -M main
```

No GitHub:

1. Clique em New repository.
2. Nome sugerido: `agenda-vanessa-rorig`.
3. Crie vazio, sem README.
4. Copie a URL HTTPS do repositorio.

Depois rode:

```bash
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

## 4. Publicar no Render

1. Abra https://render.com/.
2. Clique em New > Static Site.
3. Conecte o GitHub.
4. Escolha o repositorio `agenda-vanessa-rorig`.
5. Configure:
   - Build Command: `npm install && npm run export:web`
   - Publish Directory: `dist`
6. Em Environment, adicione:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
7. Clique em Create Static Site.

O Render vai gerar um link parecido com:

```text
https://agenda-vanessa-rorig.onrender.com
```

## 5. Quando alterar o app

Depois de cada mudanca:

```bash
git add .
git commit -m "Atualiza agenda"
git push
```

O Render atualiza o site automaticamente.

## 6. Gerar app Android e iOS

1. Instale o EAS CLI:

```bash
npm install -g eas-cli
```

2. Entre na conta Expo:

```bash
eas login
```

3. Configure o projeto, se o Expo pedir:

```bash
eas build:configure
```

4. Para gerar APK de teste Android:

```bash
npm run build:android
```

5. Para gerar Android de loja:

```bash
npm run build:android:store
```

6. Para iOS, precisa conta Apple Developer. Depois rode:

```bash
npm run build:ios
```
