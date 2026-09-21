import ItemReviewCard from "@/components/staff/ItemReviewCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function StaffItemsPage() {
    const staff = await requireStaff();
    const supabase = await createClient();

    const { data: items, error } = await supabase
        .from("items")
        .select(
            "id, reporter_id, report_type, name, category, brand, color, description, location, date_time, image_url, status"
        )
        .eq("status", "PENDING_REVIEW")
        .order("created_at", { ascending: true });

    return (
        <main className="min-h-screen bg-stone-50 px-4 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <p className="text-sm font-medium text-stone-500">
                        Staff Operations
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-stone-900">
                        Lost & Found Review
                    </h1>

                    <p className="mt-2 text-stone-600">
                        Review pending lost and found reports before they are
                        published.
                    </p>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                        Unable to load pending reports: {error.message}
                    </div>
                ) : !items || items.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200 bg-white p-6">
                        <h2 className="font-semibold text-stone-900">
                            No pending reports
                        </h2>

                        <p className="mt-2 text-sm text-stone-600">
                            There are currently no lost or found reports waiting for
                            review.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                            Pending reports:{" "}
                            <span className="font-semibold text-stone-900">
                                {items.length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {items.map((item) => (
                                <ItemReviewCard
                                    key={item.id}
                                    item={item}
                                    staffId={staff.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}