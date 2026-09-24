import { Text } from "@/components/i18n/Text";
import FoundReportForm from "@/components/found/FoundReportForm";

export default function FoundReportPage() {
    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-3xl">
                    <header className="page-header mb-7">
                        <p className="page-eyebrow">
                            <Text id="Lost & Found" />
                        </p>

                        <h1 className="page-title">
                            <Text id="Report Found Item" />
                        </h1>

                        <p className="page-description">
                            <Text id="Submit information about an item you found on campus. Your report will be reviewed by Staff before it becomes visible in search." />
                        </p>
                    </header>

                    <FoundReportForm />
                </div>
            </div>
        </main>
    );
}