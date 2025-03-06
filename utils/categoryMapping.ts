// Define the mapping between category strings and their numeric IDs
export const categoryToId: Record<string, number> = {
    "technology": 0,
    "health": 1,
    "education": 2,
    "social": 3,
    "art": 4,
    "film": 5,
    "music": 6,
    "gaming": 7,
    "science": 8,
    "food": 9,
    "sports": 10,
    "travel": 11,
    "other": 12
};

// Define the reverse mapping for converting IDs back to strings
export const idToCategory: Record<number, string> = {
    0: "technology",
    1: "health",
    2: "education",
    3: "social",
    4: "art",
    5: "film",
    6: "music",
    7: "gaming",
    8: "science",
    9: "food",
    10: "sports",
    11: "travel",
    12: "other"
};

// Convert a category string to its corresponding numeric ID
export function getCategoryId(category: string): number {
    const normalizedCategory = category.toLowerCase();
    const categoryId = categoryToId[normalizedCategory];
    if (categoryId === undefined) {
        throw new Error(`Invalid category: ${category}`);
    }
    return categoryId;
}

// Convert a numeric ID back to its corresponding category string
export function getCategoryString(id: number): string {
    const category = idToCategory[id];
    if (category === undefined) {
        throw new Error(`Invalid category ID: ${id}`);
    }
    return category;
}