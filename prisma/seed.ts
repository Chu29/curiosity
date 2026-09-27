import { PrismaClient, TopicCategory, Difficulty, TopicStatus } from '@prisma/client';

const prisma = new PrismaClient();

const topics = [
  {
    title: 'How do gravitational-wave detectors measure distortions smaller than an atomic nucleus?',
    slug: 'gravitational-wave-detectors-interferometry',
    description: 'Investigate how laser interferometers such as LIGO isolate seismic noise and exploit quantum squeezed light to detect space-time ripples caused by black hole mergers.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Astrophysics & Precision Metrology',
    difficulty: Difficulty.ADVANCED,
    estimatedResearchMinutes: 45,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'Why can’t quantum computers simulate every classical algorithm exponentially faster?',
    slug: 'quantum-computing-computational-complexity-limits',
    description: 'Examine the theoretical boundaries of quantum speedup, comparing BQP to NP-complete problem spaces and exploring why quantum supremacy is limited to specific problem structures.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Quantum Computing & Theoretical CS',
    difficulty: Difficulty.ADVANCED,
    estimatedResearchMinutes: 45,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'How does CRISPR-Cas9 locate its exact genetic target within billions of base pairs?',
    slug: 'crispr-cas9-target-recognition-mechanisms',
    description: 'Explore the molecular mechanisms of guide RNA hybridisation, PAM site recognition, and conformational changes that trigger precise double-strand DNA cleavage.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Genetics & Molecular Biology',
    difficulty: Difficulty.INTERMEDIATE,
    estimatedResearchMinutes: 35,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'What prevents solid-state lithium batteries from short-circuiting during rapid discharge?',
    slug: 'solid-state-lithium-batteries-dendrite-suppression',
    description: 'Analyze solid electrolyte interfaces, mechanical pressure control, and electrochemical mechanisms that suppress lithium dendrite growth across ceramic and polymer separators.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Materials Science & Energy Storage',
    difficulty: Difficulty.INTERMEDIATE,
    estimatedResearchMinutes: 30,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'How do mRNA vaccines instruct human ribosomes without altering genomic DNA?',
    slug: 'mrna-vaccine-translation-lipid-nanoparticles',
    description: 'Study lipid nanoparticle delivery, cytosolic translation of spike antigens by host ribosomes, and why synthetic mRNA degrades naturally without nuclear integration.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Immunology & Nanotechnology',
    difficulty: Difficulty.BEGINNER,
    estimatedResearchMinutes: 25,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'Why does magnetic confinement fusion require temperatures higher than the center of the Sun?',
    slug: 'tokamak-magnetic-confinement-fusion-physics',
    description: 'Investigate the Lawson criterion, Coulomb barrier repulsion between deuterium-tritium ions, and why lower plasma densities on Earth require 100+ million Kelvin temperatures.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Plasma Physics & Nuclear Fusion',
    difficulty: Difficulty.INTERMEDIATE,
    estimatedResearchMinutes: 40,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'How do deep neural networks approximate complex non-linear functions without combinatorial explosion?',
    slug: 'neural-networks-universal-approximation-manifold-hypothesis',
    description: 'Research the Universal Approximation Theorem, gradient descent dynamics in high-dimensional loss landscapes, and the manifold hypothesis in representational learning.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Artificial Intelligence & Applied Math',
    difficulty: Difficulty.INTERMEDIATE,
    estimatedResearchMinutes: 35,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'What geological mechanisms enable supercritical geothermal power extraction from deep volcanic rock?',
    slug: 'supercritical-geothermal-energy-extraction',
    description: 'Analyze the thermodynamics of water above its thermodynamic critical point (374°C, 22 MPa) and the engineering challenges of managing corrosive fluids at extreme depths.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Earth Science & Geothermal Energy',
    difficulty: Difficulty.BEGINNER,
    estimatedResearchMinutes: 25,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'How does electrostatic ion propulsion achieve interplanetary velocities with minimal fuel mass?',
    slug: 'hall-thrusters-ion-propulsion-specific-impulse',
    description: 'Examine xenon ionization, magnetic field confinement, electrostatic acceleration, and why high exhaust velocities yield orders-of-magnitude greater specific impulse than chemical rockets.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Aerospace Engineering & Space Propulsion',
    difficulty: Difficulty.INTERMEDIATE,
    estimatedResearchMinutes: 30,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'Why is room-temperature superconductivity so difficult to achieve experimentally?',
    slug: 'bcs-theory-high-temperature-superconductors',
    description: 'Explore electron-phonon coupling in BCS theory, Cooper pairing mechanisms, and the structural phase transitions required in cuprates, nickelates, or superhydrides under pressure.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Condensed Matter Physics',
    difficulty: Difficulty.ADVANCED,
    estimatedResearchMinutes: 45,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'How do optical lattice atomic clocks measure time dilation over centimetre elevation changes?',
    slug: 'optical-lattice-atomic-clocks-general-relativity',
    description: 'Investigate strontium atom trapping in optical tweezers, ultra-stable laser interrogation at optical frequencies, and laboratory verification of Einstein’s gravitational redshift.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Precision Metrology & Quantum Optics',
    difficulty: Difficulty.ADVANCED,
    estimatedResearchMinutes: 40,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'What aerodynamic phenomena dictate boundary layer transition on hypersonic glide vehicles?',
    slug: 'hypersonic-aerodynamics-boundary-layer-transition',
    description: 'Study Mach 5+ aerothermal heating, laminar-to-turbulent boundary layer transitions, high-temperature gas dissociation, and leading-edge thermal protection materials.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Hypersonic Aerodynamics & Fluid Dynamics',
    difficulty: Difficulty.INTERMEDIATE,
    estimatedResearchMinutes: 35,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'How do synthetic gene circuits implement Boolean logic gates in living organisms?',
    slug: 'synthetic-biology-transcriptional-logic-gates',
    description: 'Research promoter-repressor interactions, orthogonal transcription factors, and how biological genetic circuits produce reliable digital outputs inside cell cultures.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Synthetic Biology & Bioengineering',
    difficulty: Difficulty.ADVANCED,
    estimatedResearchMinutes: 45,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'Why do silicon photonic interconnects consume substantially less energy than copper traces?',
    slug: 'silicon-photonics-optical-interconnects-datacenter',
    description: 'Analyze waveguiding in silicon-on-insulator substrates, micro-ring modulators, and why photon-based interconnects circumvent parasitic RC capacitive losses over copper cables.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Photonics & Semiconductor Engineering',
    difficulty: Difficulty.BEGINNER,
    estimatedResearchMinutes: 25,
    status: TopicStatus.ACTIVE,
  },
  {
    title: 'How does closed-cycle Ocean Thermal Energy Conversion generate baseload electricity from sea surface heat?',
    slug: 'ocean-thermal-energy-conversion-rankine-cycle',
    description: 'Examine low-boiling-point working fluids (e.g. ammonia) in Rankine power cycles, deep ocean cold-water pipe hydrodynamics, and net thermodynamic efficiency calculations.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Marine Engineering & Clean Energy',
    difficulty: Difficulty.BEGINNER,
    estimatedResearchMinutes: 25,
    status: TopicStatus.ACTIVE,
  },
];

async function main() {
  console.log(`Starting seeding of ${topics.length} Science & Technology topics...`);

  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: topic,
      create: topic,
    });
  }

  const count = await prisma.topic.count();
  console.log(`✅ Seeding complete. Total active topics in database: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
