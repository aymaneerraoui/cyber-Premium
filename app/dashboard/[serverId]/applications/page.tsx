import type { Metadata } from 'next'
import { ApplicationStudio } from '@/components/dashboard/application-studio'
export const metadata: Metadata={title:'Applications Studio | CYBER'}
export default async function Page({params}:{params:Promise<{serverId:string}>}){const {serverId}=await params;return <ApplicationStudio serverId={serverId}/>}
