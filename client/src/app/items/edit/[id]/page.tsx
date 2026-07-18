import { EditTool } from "./edit-tool";
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) { return <EditTool id={(await params).id} />; }
