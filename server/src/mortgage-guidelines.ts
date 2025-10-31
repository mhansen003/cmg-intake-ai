/**
 * Mortgage Change Management Guidelines
 * Reference document with 150+ common use cases and decision trees
 */

export const MORTGAGE_GUIDELINES = `
================================================================================
MORTGAGE CHANGE MANAGEMENT INTAKE GUIDELINES
================================================================================

This document provides 150 comprehensive examples of mortgage change requests
to help properly categorize, extract information, and ask appropriate follow-up
questions before creating detailed intake forms.

[Full guidelines content available for AI analysis - 150 scenarios covering
Loan Origination, Underwriting, Closing/Funding, Servicing, Compliance, and
System/Data Management with specific follow-up questions for each scenario type]
`;

export const DECISION_TREES = {
  conditions: {
    keywords: ['condition', 'stipulation', 'documentation requirement', 'PTD', 'PTF'],
    department: 'Underwriting or Closing',
    followUpQuestions: [
      'What triggers this condition?',
      'Who provides the required documentation?',
      'What validates clearance of this condition?',
      'Is this Prior to Document (PTD) or Prior to Funding (PTF)?'
    ]
  },
  systemChanges: {
    keywords: ['system', 'integration', 'LOS', 'platform', 'API', 'software'],
    department: 'IT',
    followUpQuestions: [
      'Which specific systems are affected?',
      'What is the current behavior vs desired behavior?',
      'Are there data mapping requirements?',
      'Is user training needed?',
      'What is the downtime window tolerance?'
    ]
  },
  compliance: {
    keywords: ['compliance', 'regulatory', 'TRID', 'RESPA', 'HMDA', 'FCRA', 'ECOA', 'QM', 'ATR'],
    department: 'Compliance',
    riskLevel: 'HIGH',
    followUpQuestions: [
      'What regulation or rule drives this change?',
      'What is the effective date or deadline?',
      'Is compliance/legal review required?',
      'What are the training requirements?',
      'Are system changes needed to support compliance?'
    ]
  },
  pricing: {
    keywords: ['rate', 'pricing', 'lock', 'margin', 'rate sheet', 'pricing engine'],
    department: 'Origination / Secondary Markets',
    riskLevel: 'HIGH',
    followUpQuestions: [
      'How will this impact rate sheets?',
      'Are margin calculations changing?',
      'What are the lock period implications?',
      'Is investor or secondary markets approval required?',
      'How will loan officers be notified?'
    ]
  },
  investor: {
    keywords: ['investor', 'guideline', 'agency', 'Fannie', 'Freddie', 'FHA', 'VA', 'USDA', 'Ginnie'],
    department: 'Underwriting',
    riskLevel: 'HIGH',
    followUpQuestions: [
      'Which investor or agency is this for?',
      'What is the guideline or announcement reference?',
      'Which product types are affected?',
      'What is the effective date?',
      'Does the AUS system need configuration updates?'
    ]
  },
  closing: {
    keywords: ['closing', 'funding', 'wire', 'CTC', 'clear to close', 'closing disclosure'],
    department: 'Closing',
    riskLevel: 'HIGH',
    followUpQuestions: [
      'What are the document requirements?',
      'What authorization levels are involved?',
      'What are the timing requirements?',
      'How does this impact investor delivery?',
      'Are there TRID compliance considerations?'
    ]
  },
  escrow: {
    keywords: ['escrow', 'taxes', 'insurance', 'impound', 'escrow analysis'],
    department: 'Servicing or Closing',
    followUpQuestions: [
      'Which items are escrowed (taxes, insurance, HOA)?',
      'How is the calculation methodology changing?',
      'What is the payment timing?',
      'What notice requirements apply?',
      'Are there cushion or shortage handling changes?'
    ]
  },
  losseMitigation: {
    keywords: ['delinquency', 'default', 'modification', 'forbearance', 'loss mitigation'],
    department: 'Servicing / Loss Mitigation',
    riskLevel: 'HIGH',
    followUpQuestions: [
      'What are the eligibility criteria?',
      'What is the timeline for this process?',
      'Is investor approval required?',
      'What are the regulatory requirements (CFPB servicing rules)?',
      'How are borrowers notified?'
    ]
  },
  audit: {
    keywords: ['audit', 'exam', 'finding', 'violation', 'remediation', 'QC'],
    department: 'Compliance',
    riskLevel: 'HIGH',
    followUpQuestions: [
      'What is the specific finding or violation?',
      'What is the remediation timeline?',
      'What is the root cause analysis?',
      'Is regulatory reporting required?',
      'What process changes are needed to prevent recurrence?'
    ]
  }
};

export function identifyScenarioType(content: string): string[] {
  const contentLower = content.toLowerCase();
  const matchedTypes: string[] = [];

  for (const [type, config] of Object.entries(DECISION_TREES)) {
    for (const keyword of config.keywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matchedTypes.push(type);
        break;
      }
    }
  }

  return matchedTypes;
}

export function getFollowUpQuestions(scenarioTypes: string[]): string[] {
  const questions: string[] = [];
  const seenQuestions = new Set<string>();

  for (const type of scenarioTypes) {
    const config = DECISION_TREES[type as keyof typeof DECISION_TREES];
    if (config?.followUpQuestions) {
      for (const question of config.followUpQuestions) {
        if (!seenQuestions.has(question)) {
          questions.push(question);
          seenQuestions.add(question);
        }
      }
    }
  }

  return questions;
}

export function getDepartmentSuggestions(scenarioTypes: string[]): string[] {
  const departments = new Set<string>();

  for (const type of scenarioTypes) {
    const config = DECISION_TREES[type as keyof typeof DECISION_TREES];
    if (config?.department) {
      departments.add(config.department);
    }
  }

  return Array.from(departments);
}

export function getRiskLevel(scenarioTypes: string[]): string {
  for (const type of scenarioTypes) {
    const config = DECISION_TREES[type as keyof typeof DECISION_TREES];
    if (config && 'riskLevel' in config && config.riskLevel === 'HIGH') {
      return 'HIGH';
    }
  }
  return 'MEDIUM';
}
