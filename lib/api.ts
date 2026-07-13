const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export type ApiSource = {
  page: number
  document: string
  text: string
  score: number
}

export type UploadResponse = {
  document: string
  pages_processed: number
  chunks_indexed: number
  status: string
  suggested_questions: string[]
}

export type AnswerResponse = {
  answer: string
  sources: ApiSource[]
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong."

    try {
      const error = await response.json()
      message = error.detail ?? message
    } catch {
      message = response.statusText || message
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  })

  return parseResponse<UploadResponse>(response)
}

export async function askQuestion(question: string): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  })

  return parseResponse<AnswerResponse>(response)
}

export async function generateChecklist(): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/checklist`, {
    method: "POST",
  })

  return parseResponse<AnswerResponse>(response)
}

export async function generateGapAnalysis(): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/gap-analysis`, {
    method: "POST",
  })

  return parseResponse<AnswerResponse>(response)
}
