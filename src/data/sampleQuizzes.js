export const SAMPLE_QUIZZES = [
  {
    id: 'web-dev-mastery',
    title: 'Full-Stack Web Development',
    description: 'Test your knowledge on React, JavaScript internals, CSS, and modern APIs.',
    icon: '⚡',
    questions: [
      {
        id: 'q1',
        text: 'Which JavaScript method creates a new array populated with the results of calling a function on every element?',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80',
        options: ['filter()', 'map()', 'reduce()', 'forEach()'],
        correctOptionIndex: 1,
        timeLimit: 20
      },
      {
        id: 'q2',
        text: 'In CSS Flexbox, which property aligns items along the cross-axis?',
        imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=900&auto=format&fit=crop&q=80',
        options: ['justify-content', 'align-items', 'flex-direction', 'place-content'],
        correctOptionIndex: 1,
        timeLimit: 15
      },
      {
        id: 'q3',
        text: 'What HTTP status code represents a "Not Found" error?',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
        options: ['200', '403', '404', '500'],
        correctOptionIndex: 2,
        timeLimit: 15
      },
      {
        id: 'q4',
        text: 'In React, which hook is used to perform side effects in functional components?',
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&auto=format&fit=crop&q=80',
        options: ['useState', 'useMemo', 'useCallback', 'useEffect'],
        correctOptionIndex: 3,
        timeLimit: 20
      },
      {
        id: 'q5',
        text: 'What is the time complexity of looking up a key in a Hash Map (on average)?',
        imageUrl: 'https://images.unsplash.com/photo-1516116211227-bbc13c6b22b7?w=900&auto=format&fit=crop&q=80',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        correctOptionIndex: 0,
        timeLimit: 20
      }
    ]
  },
  {
    id: 'space-cosmos',
    title: 'Planetary Science & Cosmos',
    description: 'Explore stars, black holes, moons, and the mysteries of our universe.',
    icon: '🪐',
    questions: [
      {
        id: 'sq1',
        text: 'Which planet in our solar system has the most moons?',
        imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=900&auto=format&fit=crop&q=80',
        options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
        correctOptionIndex: 1,
        timeLimit: 20
      },
      {
        id: 'sq2',
        text: 'What is the boundary around a black hole beyond which nothing can escape?',
        imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=900&auto=format&fit=crop&q=80',
        options: ['Ergosphere', 'Photon Sphere', 'Event Horizon', 'Singularity'],
        correctOptionIndex: 2,
        timeLimit: 20
      },
      {
        id: 'sq3',
        text: 'Approximately how long does sunlight take to reach Earth?',
        imageUrl: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=900&auto=format&fit=crop&q=80',
        options: ['8 seconds', '8 minutes', '80 minutes', 'Instantaneous'],
        correctOptionIndex: 1,
        timeLimit: 15
      },
      {
        id: 'sq4',
        text: 'Which telescope was launched into space on Christmas Day in 2021?',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80',
        options: ['Hubble', 'Spitzer', 'Kepler', 'James Webb Space Telescope'],
        correctOptionIndex: 3,
        timeLimit: 20
      }
    ]
  },
  {
    id: 'world-trivia',
    title: 'World Geography & Trivia',
    description: 'Speed trivia spanning landmarks, capitals, and natural wonders.',
    icon: '🌍',
    questions: [
      {
        id: 't1',
        text: 'Which is the longest river in the world?',
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=80',
        options: ['Amazon River', 'Nile River', 'Yangtze River', 'Mississippi River'],
        correctOptionIndex: 1,
        timeLimit: 20
      },
      {
        id: 't2',
        text: 'Which country is known as the "Land of the Rising Sun"?',
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=900&auto=format&fit=crop&q=80',
        options: ['China', 'South Korea', 'Japan', 'Thailand'],
        correctOptionIndex: 2,
        timeLimit: 15
      },
      {
        id: 't3',
        text: 'What is the highest mountain peak above sea level in the world?',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&auto=format&fit=crop&q=80',
        options: ['K2', 'Mount Kilimanjaro', 'Mount Everest', 'Denali'],
        correctOptionIndex: 2,
        timeLimit: 15
      }
    ]
  }
];
