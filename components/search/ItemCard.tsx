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

export default function ItemCard({ item }: ItemCardProps) {
    return (
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                        {item.report_type}
                    </span>

                    <h2 className="mt-1 text-xl font-semibold text-stone-900">
                        {item.name}
                    </h2>
                </div>

                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs">
                    {item.category}
                </span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
                {item.brand && (
                    <div>
                        <dt className="inline font-medium">Brand: </dt>
                        <dd className="inline">{item.brand}</dd>
                    </div>
                )}

                {item.color && (
                    <div>
                        <dt className="inline font-medium">Color: </dt>
                        <dd className="inline">{item.color}</dd>
                    </div>
                )}

                <div>
                    <dt className="inline font-medium">Location: </dt>
                    <dd className="inline">{item.location}</dd>
                </div>

                <div>
                    <dt className="inline font-medium">Date: </dt>
                    <dd className="inline">
                        {new Date(item.date_time).toLocaleString()}
                    </dd>
                </div>
            </dl>

            <p className="mt-4 text-xs text-stone-500">
                Item images and ownership verification details are hidden for
                claim protection.
            </p>
        </article>
    );
}