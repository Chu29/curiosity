import { Injectable, Logger } from '@nestjs/common';
import { Topic } from '@prisma/client';
import { ResearchGuideDraft, ParsedRequirements } from '@curiosity/types';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class MockLlmProvider implements LLMProvider {
  private readonly logger = new Logger(MockLlmProvider.name);

  readonly providerName = 'mock-llm-provider';
  readonly modelVersion = 'mock-curiosity-v1';
  readonly promptVersion = 'research-guide-prompt-v1.0';

  async generateResearchGuide(topic: Topic): Promise<ResearchGuideDraft> {
    this.logger.log(`Generating mock research guide for topic: ${topic.title} (${topic.id})`);

    const titleLower = topic.title.toLowerCase();

    const parsedRequirements: ParsedRequirements = {
      timeLimitMinutes: topic.difficulty === 'ADVANCED' ? 7 : topic.difficulty === 'INTERMEDIATE' ? 5 : 3,
      requiredCoverage: [
        `Fundamental principles and operational mechanics of ${topic.title}`,
        'Experimental verification and empirical evidence',
        'Contemporary scientific challenges and trade-offs',
        'Future technological applications and implications',
      ],
      concepts: this.deriveKeyConcepts(topic),
      suggestedSourceTypes: [
        'Peer-reviewed journal articles',
        'Academic university courseware & lecture notes',
        'Official scientific agency documentation (e.g. NASA, CERN, NIST)',
        'Technical conference proceedings',
      ],
      suggestedPlatforms: [
        { name: 'Google Scholar', url: 'https://scholar.google.com' },
        { name: 'arXiv.org', url: 'https://arxiv.org' },
        { name: 'NASA Astrophysics Data System', url: 'https://ui.adsabs.harvard.edu' },
        { name: 'Nature / Springer', url: 'https://www.nature.com' },
      ],
      checklist: [
        `Formulate a clear definition and foundational framework for ${topic.title}`,
        'Identify at least two primary empirical studies or foundational papers',
        'Examine counter-arguments, failure modes, or physical limits',
        'Structure findings logically with clear citations before presenting',
      ],
    };

    const questions = this.deriveQuestions(topic);

    return {
      objective: `Investigate and explain the foundational mechanisms, empirical evidence, and engineering implications of ${topic.title}. By completing this research, you should be able to deliver a coherent presentation explaining how this system operates and why it matters in science and technology.`,
      questions: questions.map((q) => ({ question: q, required: true })),
      presentationRequirements: JSON.stringify(parsedRequirements),
      parsedRequirements,
    };
  }

  private deriveKeyConcepts(topic: Topic): string[] {
    const titleLower = topic.title.toLowerCase();
    if (titleLower.includes('quantum')) {
      return ['Superposition', 'Quantum Entanglement', 'Qubits', 'Decoherence', 'Quantum Supremacy'];
    }
    if (titleLower.includes('crispr') || titleLower.includes('gene')) {
      return ['Cas9 Nuclease', 'Guide RNA (gRNA)', 'Double-strand Breaks', 'Homology-directed Repair', 'Off-target Effects'];
    }
    if (titleLower.includes('fusion')) {
      return ['Magnetic Confinement', 'Lawson Criterion', 'Tokamak', 'Plasma Stability', 'Deuterium-Tritium Reaction'];
    }
    if (titleLower.includes('neural') || titleLower.includes('learning')) {
      return ['Backpropagation', 'Loss Landscapes', 'Gradient Descent', 'Overfitting & Generalization', 'Attention Mechanism'];
    }
    if (titleLower.includes('relativity') || titleLower.includes('spacetime')) {
      return ['Spacetime Curvature', 'Equivalence Principle', 'Gravitational Time Dilation', 'Geodesics', 'Event Horizon'];
    }

    return [
      `${topic.title} Core Mechanism`,
      'Governing Laws & Principles',
      'System Architecture',
      'Empirical Validation',
      'Thermodynamic or Computational Limits',
    ];
  }

  private deriveQuestions(topic: Topic): string[] {
    return [
      `What are the foundational physical or technological principles governing ${topic.title}?`,
      `How does ${topic.title} compare to prior or classical alternative solutions in terms of efficiency, precision, or capability?`,
      `What are the most significant technical barriers, physical limits, or open challenges facing ${topic.title} today?`,
      `What empirical evidence or breakthrough experiments demonstrated the viability of ${topic.title}?`,
      `How is ${topic.title} expected to impact scientific research or real-world technological applications over the next decade?`,
    ];
  }
}
