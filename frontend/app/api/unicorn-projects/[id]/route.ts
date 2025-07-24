import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    if (projectId === 'ai-orb') {
      const filePath = path.join(process.cwd(), 'public', 'AI Orb.json')
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(fileContent)
      
      return NextResponse.json(data)
    }
    
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}