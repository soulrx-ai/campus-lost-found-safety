type ItemCardProps = {
    item: {
        id: string;
        report_type: string;
        name: string;
        category: string;
        brand: string | null;
        color: string | null;
        date_time: string;
        location: string;
    };
};

export default function ItemCard({
    item,
}: ItemCardProps) {
    const isLost = item.report_type === "LOST";

    return (
        <article className="ui-card flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${isLost
                                ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                                : "bg-[var(--success-soft)] text-[var(--success)]"
                            }`}
                    >
                        {item.report_type}
                    </span>

                    <h2 className="mt-3 break-words text-lg font-semibold text-[var(--foreground)]">
                        {item.name}
                    </h2>
                </div>

                <span className="shrink-0 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                    {item.category}
                </span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm">
                {item.brand && (
                    <Detail label="Brand" value={item.brand} />
                )}

                {item.color && (
                    <Detail label="Color" value={item.color} />
                )}

                <Detail
                    label="Location"
                    value={item.location}
                />

                <Detail
                    label="Date"
                    value={new Date(
                        item.date_time
                    ).toLocaleString()}
                />
            </dl>

            <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="text-xs leading-5 text-[var(--foreground-muted)]">
                    Item images and ownership verification details are
                    hidden to protect the claim process.
                </p>
            </div>
        </article>
    );
}

function Detail({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="grid grid-cols-[5rem_1fr] gap-2">
            <dt className="font-medium text-[var(--foreground)]">
                {label}
            </dt>

            <dd className="break-words text-[var(--foreground-muted)]">
                {value}
            </dd>
        </div>
    );
}