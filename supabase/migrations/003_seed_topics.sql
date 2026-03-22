-- Seed AQA GCSE Maths topics
insert into public.topics (name, subtopics, display_order) values
(
  'Number',
  ARRAY[
    'Fractions', 'Decimals', 'Percentages', 'Indices', 'Surds',
    'Standard form', 'Rounding and estimation', 'Prime factors, HCF and LCM',
    'Order of operations', 'Negative numbers'
  ],
  1
),
(
  'Algebra',
  ARRAY[
    'Simplifying expressions', 'Expanding brackets', 'Factorising',
    'Solving linear equations', 'Forming and solving equations',
    'Sequences (nth term)', 'Straight-line graphs', 'Quadratic graphs',
    'Inequalities', 'Solving quadratics', 'Simultaneous equations',
    'Algebraic fractions', 'Functions', 'Proof', 'Iteration'
  ],
  2
),
(
  'Ratio, Proportion & Rates of Change',
  ARRAY[
    'Ratio', 'Proportion', 'Direct and inverse proportion',
    'Percentage change', 'Compound interest and depreciation',
    'Speed, distance, time', 'Density, mass, volume',
    'Pressure, force, area', 'Unit conversion', 'Scale factors'
  ],
  3
),
(
  'Geometry & Measures',
  ARRAY[
    'Angles', 'Properties of 2D shapes', 'Properties of 3D shapes',
    'Perimeter', 'Area of 2D shapes', 'Area of compound shapes',
    'Surface area', 'Volume', 'Circles and sectors',
    'Transformations (translation, reflection, rotation, enlargement)',
    'Congruence and similarity', 'Vectors', 'Constructions and loci',
    'Bearings', 'Trigonometry (right-angled triangles)',
    'Trigonometry (non-right-angled — sine/cosine rule)',
    'Pythagoras'' theorem', 'Circle theorems'
  ],
  4
),
(
  'Statistics',
  ARRAY[
    'Mean, median, mode and range', 'Frequency tables',
    'Grouped data and estimated mean', 'Bar charts and histograms',
    'Pie charts', 'Scatter graphs and correlation',
    'Cumulative frequency', 'Box plots', 'Sampling'
  ],
  5
),
(
  'Probability',
  ARRAY[
    'Basic probability', 'Relative frequency',
    'Combined events', 'Tree diagrams',
    'Venn diagrams', 'Conditional probability',
    'Mutually exclusive and independent events'
  ],
  6
)
on conflict (name) do update
  set subtopics = excluded.subtopics,
      display_order = excluded.display_order;
