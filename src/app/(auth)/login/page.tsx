import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/marketing/logo";
import { AuthLink } from "@/components/auth/auth-link";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : undefined;

  return (
    <main className="container mx-auto flex min-h-[80vh] max-w-4xl items-center px-4 py-16">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <div className="mb-3">
            <Logo />
          </div>
          <CardTitle>Sign in to your account</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm googleEnabled={googleEnabled} nextPath={nextPath} />
          <p className="mt-4 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <AuthLink to="/register" className="text-primary hover:underline">
              Create one
            </AuthLink>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
