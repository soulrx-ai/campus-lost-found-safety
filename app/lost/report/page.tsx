import LostReportForm from "@/components/lost/LostReportForm";

export default function LostReportPage() {
    return (
        <main className="min-h-screen bg-stone-50 px-4 py-10">
            <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                    <p className="text-sm font-medium text-stone-500">
                        Lost & Found
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-stone-900">
                        Report Lost Item
                    </h1>

                    <p className="mt-2 text-stone-600">
                        Submit information about an item you lost on campus.
                    </p>
                </div>

                <LostReportForm />
            </div>
        </main>
    );
}