export type MatchableItem = {
    name: string;
    category: string;
    color: string | null;
    location: string;
    date_time: string;
};

export type MatchResult = {
    score: number;
    isPotentialMatch: boolean;
};

function normalize(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase();
}

function textMatches(
    first: string | null | undefined,
    second: string | null | undefined
) {
    const a = normalize(first);
    const b = normalize(second);

    if (!a || !b) {
        return false;
    }

    return a === b || a.includes(b) || b.includes(a);
}

function dateMatches(first: string, second: string) {
    const firstDate = new Date(first);
    const secondDate = new Date(second);

    if (
        Number.isNaN(firstDate.getTime()) ||
        Number.isNaN(secondDate.getTime())
    ) {
        return false;
    }

    const difference = Math.abs(
        firstDate.getTime() - secondDate.getTime()
    );

    const oneDay = 24 * 60 * 60 * 1000;

    return difference <= oneDay;
}

export function calculateMatch(
    lostItem: MatchableItem,
    foundItem: MatchableItem,
    threshold = 70
): MatchResult {
    let score = 0;

    if (textMatches(lostItem.name, foundItem.name)) {
        score += 30;
    }

    if (textMatches(lostItem.category, foundItem.category)) {
        score += 20;
    }

    if (textMatches(lostItem.color, foundItem.color)) {
        score += 20;
    }

    if (textMatches(lostItem.location, foundItem.location)) {
        score += 20;
    }

    if (dateMatches(lostItem.date_time, foundItem.date_time)) {
        score += 10;
    }

    return {
        score,
        isPotentialMatch: score >= threshold,
    };
}