import type { Locale } from "./config";

export const authCopy = {
  "pt-BR": {
    signIn: "Entrar", signUp: "Criar conta", name: "Nome", email: "E-mail",
    password: "Senha", confirmPassword: "Confirmar senha", signOut: "Sair",
    welcome: "Entre para acessar suas músicas.", register: "Crie sua conta para começar a produzir.",
    hint: "Use uma senha de 12 a 128 caracteres.", pending: "Aguarde…",
    noAccount: "Ainda não tem conta?", hasAccount: "Já tem uma conta?", home: "Voltar ao início",
    errors: {
      invalid_fields: "Confira os campos preenchidos e a confirmação da senha.",
      invalid_credentials: "E-mail ou senha incorretos.",
      registration_failed: "Não foi possível criar a conta. Se já tem cadastro, tente entrar.",
      rate_limited: "Muitas tentativas. Tente novamente em 15 minutos.",
      unavailable: "O login está temporariamente indisponível. Tente novamente em instantes.",
      invalid_origin: "Recarregue a página e tente novamente.",
    },
  },
  en: {
    signIn: "Sign in", signUp: "Create account", name: "Name", email: "Email",
    password: "Password", confirmPassword: "Confirm password", signOut: "Sign out",
    welcome: "Sign in to access your music.", register: "Create an account to start producing.",
    hint: "Use a password with 12 to 128 characters.", pending: "Please wait…",
    noAccount: "Don't have an account?", hasAccount: "Already have an account?", home: "Back to home",
    errors: {
      invalid_fields: "Check the form fields and password confirmation.",
      invalid_credentials: "Incorrect email or password.",
      registration_failed: "Unable to create the account. If you already registered, try signing in.",
      rate_limited: "Too many attempts. Try again in 15 minutes.",
      unavailable: "Sign-in is temporarily unavailable. Please try again shortly.",
      invalid_origin: "Reload the page and try again.",
    },
  },
  es: {
    signIn: "Iniciar sesión", signUp: "Crear cuenta", name: "Nombre", email: "Correo electrónico",
    password: "Contraseña", confirmPassword: "Confirmar contraseña", signOut: "Cerrar sesión",
    welcome: "Inicia sesión para acceder a tu música.", register: "Crea tu cuenta para empezar a producir.",
    hint: "Usa una contraseña de 12 a 128 caracteres.", pending: "Espera…",
    noAccount: "¿No tienes cuenta?", hasAccount: "¿Ya tienes cuenta?", home: "Volver al inicio",
    errors: {
      invalid_fields: "Revisa los campos y la confirmación de la contraseña.",
      invalid_credentials: "Correo o contraseña incorrectos.",
      registration_failed: "No se pudo crear la cuenta. Si ya te registraste, intenta iniciar sesión.",
      rate_limited: "Demasiados intentos. Inténtalo de nuevo en 15 minutos.",
      unavailable: "El inicio de sesión no está disponible temporalmente. Inténtalo de nuevo en unos momentos.",
      invalid_origin: "Recarga la página e inténtalo de nuevo.",
    },
  },
} satisfies Record<Locale, unknown>;
