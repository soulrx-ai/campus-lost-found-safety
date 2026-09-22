import LostReportForm from "@/components/lost/LostReportForm";

export default function LostReportPage() {
    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-3xl">
                    <header className="mb-7">
                        <p className="page-eyebrow">Lost &amp; Found</p>

                        <h1 className="page-title">Report a lost item</h1>

                        <p className="page-description">
                            Tell us what you lost and where you last saw it. Your report
                            will be reviewed by Staff before it is published.
                        </p>
                    </header>

                    <LostReportForm />
                </div>
            </div>
        </main>
    );
}