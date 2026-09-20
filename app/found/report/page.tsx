import FoundReportForm from "@/components/found/FoundReportForm";

export default function FoundReportPage() {
    return (
        <main className="min-h-screen bg-stone-50 px-4 py-10">
            <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                    <p className="text-sm font-medium text-stone-500">
                        Lost & Found
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-stone-900">
                        Report Found Item
                    </h1>

                    <p className="mt-2 text-stone-600">
                        Submit information about an item you found on campus.
                    </p>
                </div>

                <FoundReportForm />
            </div>
        </main>
    );
}