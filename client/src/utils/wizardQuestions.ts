// Wizard question determination based on Mortgage Change Management Guidelines

export interface WizardQuestion {
  question: string;
  placeholder: string;
  key: string;
}

interface QuestionSet {
  category: string;
  department: string;
  questions: WizardQuestion[];
}

const QUESTION_SETS: QuestionSet[] = [
  // System/Technology Changes
  {
    category: 'system',
    department: 'IT',
    questions: [
      {
        question: 'Which specific systems or platforms are affected by this change?',
        placeholder: 'e.g., Encompass LOS, credit bureau integration, appraisal ordering system...',
        key: 'affected_systems',
      },
      {
        question: 'What are the current limitations and what specific functionality do you need?',
        placeholder: 'Describe what the system does now vs. what you need it to do...',
        key: 'functionality_needs',
      },
      {
        question: 'Are there any integration points, data mapping requirements, or testing needs?',
        placeholder: 'e.g., APIs to connect, data fields to map, user acceptance testing requirements...',
        key: 'technical_requirements',
      },
    ],
  },
  // Compliance/Regulatory Changes
  {
    category: 'compliance',
    department: 'Compliance',
    questions: [
      {
        question: 'Which regulation or compliance requirement is driving this change?',
        placeholder: 'e.g., TRID, RESPA, HMDA, Fair Lending, ECOA, state-specific regulation...',
        key: 'regulation_reference',
      },
      {
        question: 'What is the effective date and are there any deadline constraints?',
        placeholder: 'e.g., Regulatory deadline, business target date, exam finding remediation timeline...',
        key: 'compliance_timeline',
      },
      {
        question: 'What training, documentation, or system changes will be required?',
        placeholder: 'e.g., Staff training, policy updates, disclosure changes, system configuration...',
        key: 'compliance_implementation',
      },
    ],
  },
  // Underwriting - Conditions/Documentation
  {
    category: 'underwriting',
    department: 'Underwriting',
    questions: [
      {
        question: 'What specific documentation or condition types are involved?',
        placeholder: 'e.g., Income verification, asset documentation, employment verification, credit supplements...',
        key: 'documentation_types',
      },
      {
        question: 'Which loan products or borrower scenarios are affected?',
        placeholder: 'e.g., All conventional loans, FHA only, self-employed borrowers, investment properties...',
        key: 'product_scope',
      },
      {
        question: 'Are there investor guideline requirements or approval needed?',
        placeholder: 'e.g., Fannie Mae guideline update, FHA policy change, investor-specific requirement...',
        key: 'investor_requirements',
      },
    ],
  },
  // Pricing/Rate/Lock Changes
  {
    category: 'pricing',
    department: 'Origination',
    questions: [
      {
        question: 'How will this impact rate sheets, margins, or lock desk operations?',
        placeholder: 'e.g., Margin adjustments, rate sheet import changes, lock period modifications...',
        key: 'pricing_impact',
      },
      {
        question: 'Which loan products and lock periods are affected?',
        placeholder: 'e.g., 30-year fixed, ARM products, specific lock periods (15, 30, 45, 60 days)...',
        key: 'pricing_scope',
      },
      {
        question: 'Does this require Secondary Markets approval or coordination?',
        placeholder: 'e.g., Investor pricing approval, warehouse line impact, hedging considerations...',
        key: 'secondary_coordination',
      },
    ],
  },
  // Closing/Funding Process Changes
  {
    category: 'closing',
    department: 'Closing',
    questions: [
      {
        question: 'What stage of the closing process is affected (CTC, document prep, funding, post-closing)?',
        placeholder: 'e.g., Clear to Close criteria, closing disclosure preparation, wire authorization, final docs...',
        key: 'closing_stage',
      },
      {
        question: 'Are there any timing, authorization, or documentation requirements?',
        placeholder: 'e.g., Sign-off authority, 3-day waiting periods, final condition clearance, funding limits...',
        key: 'closing_requirements',
      },
      {
        question: 'How will this impact investor delivery or warehouse lending?',
        placeholder: 'e.g., Document delivery timing, investor quality control, warehouse line compliance...',
        key: 'investor_delivery',
      },
    ],
  },
  // Servicing/Operations Changes
  {
    category: 'servicing',
    department: 'Servicing',
    questions: [
      {
        question: 'What aspect of servicing is affected (payments, escrow, insurance, customer service)?',
        placeholder: 'e.g., Payment processing, escrow analysis, insurance tracking, borrower communications...',
        key: 'servicing_area',
      },
      {
        question: 'How should payments, escrow, or borrower accounts be handled differently?',
        placeholder: 'e.g., Payment application order, escrow calculation method, notice generation...',
        key: 'servicing_process',
      },
      {
        question: 'Are there investor servicing guidelines or regulatory requirements?',
        placeholder: 'e.g., CFPB servicing rules, investor reporting requirements, RESPA compliance...',
        key: 'servicing_requirements',
      },
    ],
  },
  // Policy/Process Changes
  {
    category: 'policy',
    department: 'Operations',
    questions: [
      {
        question: 'What is the current policy/process and what specifically needs to change?',
        placeholder: 'Describe how things work now vs. how they should work after this change...',
        key: 'policy_change',
      },
      {
        question: 'Who is affected by this change (roles, departments, external partners)?',
        placeholder: 'e.g., Loan officers, processors, underwriters, brokers, title companies...',
        key: 'stakeholders',
      },
      {
        question: 'What training, documentation, or system updates are needed to support this?',
        placeholder: 'e.g., Training materials, procedure manuals, system configuration, communication plan...',
        key: 'implementation_needs',
      },
    ],
  },
];

// Keyword patterns for categorization
const KEYWORD_PATTERNS = {
  system: /system|integration|LOS|platform|API|software|application|database|encompass|calyx|bytepro|interface/i,
  compliance: /compliance|regulatory|regulation|TRID|RESPA|HMDA|ECOA|FCRA|fair lending|audit|exam|QM|ATR/i,
  underwriting: /underwriting|condition|stipulation|documentation|income|asset|credit|appraisal|employment|VOE|VOD|gift|UW/i,
  pricing: /rate|pricing|lock|margin|rate sheet|pricing engine|lock desk|yield spread|basis points/i,
  closing: /closing|funding|wire|CTC|clear to close|document|disclosure|settlement|title|escrow setup|CD/i,
  servicing: /servicing|payment|escrow|delinquency|default|modification|forbearance|loss mitigation|PMI|payoff/i,
  policy: /policy|process|procedure|workflow|guideline|standard|requirement|protocol/i,
};

/**
 * Determines which wizard questions to ask based on request content
 */
export function determineWizardQuestions(
  title: string,
  description: string
): WizardQuestion[] {
  const combinedText = `${title} ${description}`.toLowerCase();

  // Score each category based on keyword matches
  const scores: Record<string, number> = {};
  for (const [category, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    const matches = combinedText.match(pattern);
    scores[category] = matches ? matches.length : 0;
  }

  // Find the highest scoring category
  let bestCategory = 'policy'; // Default fallback
  let highestScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }

  // Return questions for the best matching category
  const questionSet = QUESTION_SETS.find((qs) => qs.category === bestCategory);
  return questionSet ? questionSet.questions : QUESTION_SETS[QUESTION_SETS.length - 1].questions;
}

/**
 * Format wizard answers into enhanced description text
 */
export function formatWizardAnswers(
  originalDescription: string,
  answers: Record<string, string>
): string {
  const answeredQuestions = Object.entries(answers)
    .filter(([_, answer]) => answer && answer.trim().length > 0)
    .map(([key, answer]) => {
      // Find the question text for context
      for (const questionSet of QUESTION_SETS) {
        const q = questionSet.questions.find((q) => q.key === key);
        if (q) {
          return `**${q.question}**\n${answer.trim()}`;
        }
      }
      return answer.trim();
    });

  if (answeredQuestions.length === 0) {
    return originalDescription;
  }

  return `${originalDescription}\n\n---\n\n**Additional Details from Clarification:**\n\n${answeredQuestions.join('\n\n')}`;
}
