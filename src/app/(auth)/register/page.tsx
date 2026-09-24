import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/lib/auth/actions";
import { Logo } from "@/components/marketing/logo";
import { AuthLink } from "@/components/auth/auth-link";
import { getAdminLocale } from "@/lib/admin/i18n";

const copy = {
  es: {
    title: "Crea tu cuenta de Menuly",
    name: "Tu nombre",
    email: "Email",
    password: "Contraseña (mínimo 8 caracteres)",
    submit: "Crear cuenta",
    haveAccount: "¿Ya tienes cuenta?",
    signIn: "Inicia sesión",
    errors: {
      email_taken: "Ya existe una cuenta con ese email. Inicia sesión o usa otro email.",
      invalid: "Revisa los datos: nombre, email válido y contraseña de al menos 8 caracteres.",
    },
  },
  en: {
    title: "Create your Menuly account",
    name: "Your name",
    email: "Email",
    password: "Password (at least 8 characters)",
    submit: "Create account",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    errors: {
      email_taken: "An account with that email already exists. Sign in or use another email.",
      invalid: "Check your details: name, a valid email and a password of at least 8 characters.",
    },
  },
} as const;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const locale = await getAdminLocale();
  const t = copy[locale === "es" ? "es" : "en"];
  const { error } = await searchParams;
  const errorMessage = error && error in t.errors ? t.errors[error as keyof typeof t.errors] : null;

  return (
    <main className="container mx-auto flex min-h-[80vh] max-w-4xl items-center px-4 py-16">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <div className="mb-3">
            <Logo />
          </div>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <form action={registerAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <Button type="submit" className="w-full">
              {t.submit}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.haveAccount}{" "}
            <AuthLink to="/login" className="text-primary hover:underline">
              {t.signIn}
            </AuthLink>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
