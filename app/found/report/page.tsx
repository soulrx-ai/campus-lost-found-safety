import FoundReportForm from "@/components/found/FoundReportForm";

export default function FoundReportPage() {
    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-3xl">
                    <header className="mb-7">
                        <p className="page-eyebrow">
                            Lost & Found
                        </p>

                        <h1 className="page-title">
                            Report Found Item
                        </h1>

                        <p className="page-description">
                            Submit information about an item you found on campus.
                            Your report will be reviewed by Staff before it becomes
                            visible in search.
                        </p>
                    </header>

                    <FoundReportForm />
                </div>
            </div>
        </main>
    );
}