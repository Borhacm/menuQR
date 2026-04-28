import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";

export async function AdminHeader() {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <Logo className="text-base" />
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button variant="outline" size="sm">
          {session?.user?.email ?? "Sign out"}
        </Button>
      </form>
    </header>
  );
}
