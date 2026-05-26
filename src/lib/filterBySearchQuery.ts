type SearchableItem = {
  title: string;
  author: string;
  description?: string;
  category?: string;
  tags?: string[];
};

export function filterBySearchQuery<T extends SearchableItem>(
  items: T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const searchableValues = [
      item.title,
      item.author,
      item.description ?? "",
      item.category ?? "",
      ...(item.tags ?? []),
    ];

    return searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
}
