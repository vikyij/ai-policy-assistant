export type ChecklistStatus = "pass" | "gap" | "partial"

export type ChecklistItem = {
  id: string
  category: string
  title: string
  description: string
  status: ChecklistStatus
  reference: string
}

export const checklistItems: ChecklistItem[] = [
  {
    id: "fair-1",
    category: "Fairness & Bias",
    title: "Bias evaluation across protected groups",
    description: "Model outputs are tested for disparate impact across demographic segments.",
    status: "pass",
    reference: "AI Policy §2.1",
  },
  {
    id: "fair-2",
    category: "Fairness & Bias",
    title: "Documented mitigation for identified bias",
    description: "Remediation steps are recorded when bias thresholds are exceeded.",
    status: "partial",
    reference: "AI Policy §2.3",
  },
  {
    id: "trans-1",
    category: "Transparency",
    title: "Model cards published for each system",
    description: "Every production model has an up-to-date model card.",
    status: "pass",
    reference: "AI Policy §3.1",
  },
  {
    id: "trans-2",
    category: "Transparency",
    title: "User disclosure of AI interaction",
    description: "End users are notified when interacting with automated systems.",
    status: "gap",
    reference: "AI Policy §3.4",
  },
  {
    id: "priv-1",
    category: "Privacy & Data",
    title: "Data minimization enforced",
    description: "Only data necessary for the stated purpose is collected and retained.",
    status: "pass",
    reference: "Data Gov §1.2",
  },
  {
    id: "priv-2",
    category: "Privacy & Data",
    title: "Training data provenance recorded",
    description: "Sources and licensing for all training data are documented.",
    status: "gap",
    reference: "Data Gov §1.6",
  },
  {
    id: "acc-1",
    category: "Accountability",
    title: "Human-in-the-loop for high-risk decisions",
    description: "Consequential decisions require human review before action.",
    status: "pass",
    reference: "AI Policy §4.2",
  },
  {
    id: "acc-2",
    category: "Accountability",
    title: "Incident response plan for AI failures",
    description: "A defined escalation path exists for model failures and misuse.",
    status: "partial",
    reference: "AI Policy §4.5",
  },
  {
    id: "sec-1",
    category: "Safety & Security",
    title: "Adversarial robustness testing",
    description: "Systems are red-teamed against prompt injection and evasion.",
    status: "gap",
    reference: "Security §5.3",
  },
  {
    id: "sec-2",
    category: "Safety & Security",
    title: "Access controls on model endpoints",
    description: "Production inference endpoints enforce authentication and rate limits.",
    status: "pass",
    reference: "Security §5.1",
  },
]

export type GapCategory = {
  category: string
  score: number
  pass: number
  partial: number
  gap: number
}

export const gapCategories: GapCategory[] = [
  { category: "Fairness & Bias", score: 74, pass: 1, partial: 1, gap: 0 },
  { category: "Transparency", score: 58, pass: 1, partial: 0, gap: 1 },
  { category: "Privacy & Data", score: 52, pass: 1, partial: 0, gap: 1 },
  { category: "Accountability", score: 81, pass: 1, partial: 1, gap: 0 },
  { category: "Safety & Security", score: 63, pass: 1, partial: 0, gap: 1 },
]

export type Citation = {
  id: number
  document: string
  section: string
  page: number
  quote: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
}

export const suggestedQuestions = [
  "What does our policy say about human oversight?",
  "Are we compliant with EU AI Act transparency rules?",
  "Summarize our data retention requirements",
  "Which high-risk systems need bias audits?",
]

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "I've analyzed your uploaded policy documents. I can answer questions about your Responsible AI commitments, surface compliance gaps, and cite the exact source passages. What would you like to explore?",
  },
]

export const sampleAnswers: Record<string, ChatMessage> = {
  default: {
    id: "",
    role: "assistant",
    content:
      "Based on your Responsible AI Policy, high-risk systems require documented human oversight before any consequential decision is executed. Reviewers must be trained on the system's limitations and retain the authority to override automated outputs. However, I found that user-facing disclosure of AI interaction is not yet implemented, which is a gap against your stated transparency commitments.",
    citations: [
      {
        id: 1,
        document: "Responsible AI Policy v2.4",
        section: "§4.2 Human Oversight",
        page: 12,
        quote:
          "Consequential decisions affecting individuals must be subject to meaningful human review, with reviewers empowered to override automated recommendations.",
      },
      {
        id: 2,
        document: "Responsible AI Policy v2.4",
        section: "§3.4 User Disclosure",
        page: 9,
        quote:
          "Users shall be clearly informed when they are interacting with an automated or AI-driven system.",
      },
    ],
  },
}
