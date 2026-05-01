import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { POSTS } from "@/content/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BlogPage");

  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="container mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className={`aspect-[16/9] rounded-2xl bg-gradient-to-br ${post.gradient}`} />
      <div className="mt-8 text-xs uppercase tracking-wide text-muted-foreground">
        {new Date(post.date).toLocaleDateString(locale)}
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {t(`posts.${post.slug}.title`)}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{t(`posts.${post.slug}.excerpt`)}</p>
      <div className="prose prose-zinc dark:prose-invert mt-10">
        <p>{t(`posts.${post.slug}.body`)}</p>
      </div>
    </article>
  );
}
