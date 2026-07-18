import { BlogArticle } from "./article";
export default async function BlogDetailPage({params}:{params:Promise<{slug:string}>}){return <BlogArticle slug={(await params).slug}/>}
