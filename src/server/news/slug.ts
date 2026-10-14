import { prisma } from "@/server/db/client";

/**
 * Normalizes a title into a URL-safe lowercase slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-") // Replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

/**
 * Generates a unique, collision-safe slug for a news article.
 * If the base slug already exists, appends `-2`, `-3`, etc.
 */
export async function generateUniqueSlug(
  title: string,
  existingArticleId?: string
): Promise<string> {
  const baseSlug = slugify(title) || "municipal-notice";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.newsArticle.findUnique({
      where: { slug },
      select: { id: true },
    });

    // If no record exists, or if it belongs to the article currently being edited, slug is safe to use
    if (!existing || existing.id === existingArticleId) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}
