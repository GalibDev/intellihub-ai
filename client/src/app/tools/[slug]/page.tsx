import { ToolDetails } from "./tool-details";
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) { return <ToolDetails slug={(await params).slug} />; }
