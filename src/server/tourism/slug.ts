import { prisma } from "@/server/db/client";

/**
 * Normalizes a tourism title into a URL-safe lowercase slug.
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
 * Generates a unique, collision-safe slug for a tourism entry.
 * If the base slug already exists, appends `-2`, `-3`, etc.
 */
export async function generateUniqueTourismSlug(
  title: string,
  existingEntryId?: string
): Promise<string> {
  const baseSlug = slugify(title) || "tourism-entry";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.tourismEntry.findUnique({
      where: { slug },
      select: { id: true },
    });

    // If no record exists, or if it belongs to the entry currently being edited, slug is safe to use
    if (!existing || existing.id === existingEntryId) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}
