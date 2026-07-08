import type { auth as ka } from "../ka/auth";

export const auth: typeof ka = {
  emailLabel: "Email",
  passwordLabel: "Password",
  loading: "Please wait...",
  or: "or",
  login: {
    title: "Welcome back",
    subtitle: "Sign in to your account",
    submit: "Sign in",
    google: "Sign in with Google",
    noAccount: "Don't have an account?",
    registerLink: "Register",
    invalidCredentials: "Invalid email or password",
  },
  register: {
    title: "Create an account",
    subtitle: "Join the MyPet community",
    nameLabel: "Name",
    namePlaceholder: "e.g. Giorgi",
    passwordPlaceholder: "Min. 6 characters",
    submit: "Register",
    google: "Sign up with Google",
    haveAccount: "Already have an account?",
    loginLink: "Sign in",
    genericError: "Something went wrong",
  },
};
