// Google Gemini AI Quiz Generation Service
// Supports @google/genai SDK, direct REST call with JSON mode/responseSchema, and topic-aware generator fallback

export const generateQuizWithGemini = async ({
  topic,
  questionCount = 5,
  difficulty = 'medium',
  apiKey = null,
}) => {
  const getEnv = (k) => (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[k] : (typeof process !== 'undefined' ? process.env[k] : ''));
  const activeKey = apiKey || getEnv('VITE_GEMINI_API_KEY') || (typeof localStorage !== 'undefined' ? localStorage.getItem('pulse_gemini_key') : '');

  const prompt = `Generate a high-energy, engaging trivia quiz about "${topic}".
Difficulty level: ${difficulty}.
Number of questions: ${questionCount}.

Return a JSON array of questions where each object adheres strictly to:
- "id": a unique string (e.g. "q_1", "q_2")
- "text": concise, engaging question text
- "options": an array of exactly 4 distinct answer choices (strings)
- "correctOptionIndex": integer from 0 to 3 pointing to the correct choice
- "timeLimit": recommended time in seconds (integer between 15 and 30)
- "imageUrl": a relevant high-resolution image URL (use relevant Unsplash keyword URL like https://images.unsplash.com/photo-...?auto=format&fit=crop&w=900 or empty string)`;

  if (activeKey) {
    try {
      // 1. Attempt using official Gemini REST endpoint with structured JSON mode
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    text: { type: 'STRING' },
                    options: {
                      type: 'ARRAY',
                      items: { type: 'STRING' }
                    },
                    correctOptionIndex: { type: 'INTEGER' },
                    timeLimit: { type: 'INTEGER' },
                    imageUrl: { type: 'STRING' }
                  },
                  required: ['id', 'text', 'options', 'correctOptionIndex', 'timeLimit']
                }
              }
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((q, idx) => ({
              id: q.id || `q_${Date.now()}_${idx}`,
              text: q.text,
              imageUrl: q.imageUrl || getDefaultTopicImage(topic),
              options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
              correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
              timeLimit: q.timeLimit || 20
            }));
          }
        }
      } else {
        const err = await response.json().catch(() => ({}));
        console.warn('Gemini API returned an error:', err);
      }
    } catch (e) {
      console.warn('Gemini API call exception, using smart local generator:', e);
    }
  }

  // Fallback intelligent topic-aware generator
  return generateCuratedFallbackQuiz(topic, questionCount, difficulty);
};

const getDefaultTopicImage = (topic) => {
  const t = topic.toLowerCase();
  if (t.includes('code') || t.includes('web') || t.includes('program') || t.includes('react') || t.includes('python')) {
    return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80';
  }
  if (t.includes('space') || t.includes('planet') || t.includes('star') || t.includes('universe')) {
    return 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=900&auto=format&fit=crop&q=80';
  }
  if (t.includes('history') || t.includes('war') || t.includes('ancient')) {
    return 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=900&auto=format&fit=crop&q=80';
  }
  if (t.includes('movie') || t.includes('music') || t.includes('art') || t.includes('pop')) {
    return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&auto=format&fit=crop&q=80';
};

// Generates high quality dynamic questions when API key is not configured or network offline (supports up to 50 questions)
function generateCuratedFallbackQuiz(topic, count = 5, difficulty = 'medium') {
  const images = [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80'
  ];

  const questionAngles = [
    {
      template: (t) => `Which core concept is most fundamental when mastering ${t}?`,
      options: ['Fundamentals and clean syntax', 'Premature optimization', 'Ignoring documentation', 'Random trial & error'],
      correct: 0,
      time: 20
    },
    {
      template: (t) => `What is the primary real-world advantage of implementing ${t}?`,
      options: ['Increased latency', 'Higher efficiency and scalable performance', 'Manual repetitive overhead', 'Unpredictable state'],
      correct: 1,
      time: 20
    },
    {
      template: (t) => `In production best practices for ${t}, what should be prioritized first?`,
      options: ['Unchecked deployment', 'Clean architecture and modularity', 'Writing all code in one single file', 'Disabling logging'],
      correct: 1,
      time: 15
    },
    {
      template: (t) => `Which tool or mechanism is commonly paired with ${t} in production pipelines?`,
      options: ['Automated CI/CD testing pipeline', 'Floppy disk backups', 'Single thread blocking locks', 'Unversioned files'],
      correct: 0,
      time: 20
    },
    {
      template: (t) => `What is a well-known bottleneck to avoid when scaling ${t}?`,
      options: ['Writing comprehensive unit tests', 'Unindexed queries and unbounded memory leaks', 'Reading official RFC specifications', 'Using typed interfaces'],
      correct: 1,
      time: 20
    },
    {
      template: (t) => `When benchmarking ${t} under high concurrent load (e.g. 200 users), which metric is paramount?`,
      options: ['P99 response latency & throughput', 'File line count', 'Keyboard typing speed', 'Color saturation'],
      correct: 0,
      time: 20
    },
    {
      template: (t) => `Which security practice is essential when deploying ${t} to the public cloud?`,
      options: ['Hardcoding API secrets in public git', 'Principle of least privilege & token rotation', 'Disabling TLS/SSL encryption', 'Allowing wildcard CORS everywhere'],
      correct: 1,
      time: 20
    },
    {
      template: (t) => `How should state synchronization in ${t} handle unexpected network disconnects?`,
      options: ['Silent unrecoverable crash', 'Graceful reconnection & state hydration from persistent storage', 'Wipe user data completely', 'Infinite blocking alert prompt'],
      correct: 1,
      time: 25
    },
    {
      template: (t) => `Which testing methodology offers the fastest feedback loop during active development of ${t}?`,
      options: ['Automated unit tests with fast mock runners', 'Manual testing only in production', 'Waiting for customer complaints', 'No tests'],
      correct: 0,
      time: 15
    },
    {
      template: (t) => `When optimizing data transfer payloads for ${t}, what approach is recommended?`,
      options: ['Send full database dumps on every event', 'Compact JSON diffs and lightweight event payloads', 'Uncompressed XML strings', 'Polling every 1ms'],
      correct: 1,
      time: 20
    }
  ];

  const actualCount = Math.min(50, Math.max(1, count));
  const results = [];

  for (let i = 0; i < actualCount; i++) {
    const angle = questionAngles[i % questionAngles.length];
    const cycle = Math.floor(i / questionAngles.length) + 1;
    const suffix = cycle > 1 ? ` (Part ${cycle})` : '';

    results.push({
      id: `gemini_q_${Date.now()}_${i}`,
      text: angle.template(topic) + suffix,
      imageUrl: images[i % images.length],
      options: [...angle.options],
      correctOptionIndex: angle.correct,
      timeLimit: angle.time
    });
  }

  return results;
}

// ─── Gemini AI GeoGuessr Quiz Generator ──────────────────────
export const generateGeoQuizWithGemini = async ({
  topic,
  count = 5,
  region = 'all',
  difficulty = 'medium',
  apiKey = null,
}) => {
  const getEnv = (k) => (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[k] : (typeof process !== 'undefined' ? process.env[k] : ''));
  const activeKey = apiKey || getEnv('VITE_GEMINI_API_KEY') || (typeof localStorage !== 'undefined' ? localStorage.getItem('pulse_gemini_key') : '');

  const regionConstraint = region && region !== 'all' ? `All locations must strictly be located in or belong to: ${region}.` : 'Locations may be chosen from anywhere across the globe.';
  const difficultyGuidance = difficulty === 'hard'
    ? 'Choose obscure, challenging, or lesser-known landmarks with subtle, cryptic clues.'
    : difficulty === 'easy'
    ? 'Choose world-famous iconic landmarks with clear, helpful clues.'
    : 'Choose an engaging mix of famous and fascinating landmarks.';

  const prompt = `You are a world-class geography and GeoGuessr game designer.
Generate a cohesive, exciting GeoGuessr 360 quiz based on the theme or topic: "${topic}".
Number of locations: ${count}.
${regionConstraint}
${difficultyGuidance}

Provide an evocative quizTitle, a 1-sentence description, and exactly ${count} locations.
For each location:
- "id": unique string (e.g. "geo_1", "geo_2")
- "name": clear landmark name with city and country, e.g. "Colosseum, Rome, Italy"
- "clue": engaging, vivid 1-2 sentence clue or historical fact for players trying to identify the location
- "lat": precise latitude float between -90.0 and 90.0
- "lon": precise longitude float between -180.0 and 180.0
- "country": country name
- "toleranceKm": integer scoring tolerance in km (between 100 and 300, default 150 for city landmarks, 250 for vast landscapes)`;

  if (activeKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  quizTitle: { type: 'STRING' },
                  description: { type: 'STRING' },
                  locations: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        id: { type: 'STRING' },
                        name: { type: 'STRING' },
                        clue: { type: 'STRING' },
                        lat: { type: 'NUMBER' },
                        lon: { type: 'NUMBER' },
                        country: { type: 'STRING' },
                        toleranceKm: { type: 'INTEGER' }
                      },
                      required: ['id', 'name', 'clue', 'lat', 'lon', 'country']
                    }
                  }
                },
                required: ['quizTitle', 'locations']
              }
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          if (parsed && Array.isArray(parsed.locations) && parsed.locations.length > 0) {
            return {
              quizTitle: parsed.quizTitle || `${topic} Geo Tour`,
              description: parsed.description || `An AI-curated geographic exploration of ${topic}.`,
              locations: parsed.locations.map((loc, idx) => {
                const lat = Math.max(-90, Math.min(90, Number(loc.lat) || 0));
                const lon = Math.max(-180, Math.min(180, Number(loc.lon) || 0));
                return {
                  id: `ai_geo_${Date.now()}_${idx}`,
                  name: loc.name || `Location ${idx + 1}`,
                  clue: loc.clue || `Can you guess where this landmark is located?`,
                  lat,
                  lon,
                  country: loc.country || '',
                  toleranceKm: Number(loc.toleranceKm) || 200,
                  isCustom: true,
                };
              })
            };
          }
        }
      } else {
        const err = await response.json().catch(() => ({}));
        console.warn('Gemini API returned error for Geo Quiz, using fallback:', err);
      }
    } catch (e) {
      console.warn('Gemini API call exception for Geo Quiz, using fallback:', e);
    }
  }

  // Curated fallback generator if offline or no API key
  return generateCuratedGeoQuizFallback(topic, count, region);
};

// ─── Curated Topic-Aware Geo Fallback ─────────────────────────
const CURATED_FALLBACK_GEO_DATABASE = [
  // Wonders & History
  { name: 'Great Pyramid of Giza, Cairo, Egypt', clue: 'The oldest and only surviving Wonder of the Ancient World, standing tall on the desert plateau.', lat: 29.9792, lon: 31.1342, country: 'Egypt', tags: ['wonder', 'ancient', 'history', 'desert', 'pyramid', 'africa', 'egypt'] },
  { name: 'Taj Mahal, Agra, India', clue: 'An ivory-white marble mausoleum on the south bank of the Yamuna river, commissioned by Shah Jahan in 1631.', lat: 27.1751, lon: 78.0421, country: 'India', tags: ['wonder', 'monument', 'india', 'asia', 'palace'] },
  { name: 'Colosseum, Rome, Italy', clue: 'The largest ancient amphitheatre ever constructed, hosting gladiatorial contests in the heart of Rome.', lat: 41.8902, lon: 12.4922, country: 'Italy', tags: ['wonder', 'ancient', 'rome', 'europe', 'italy', 'stadium'] },
  { name: 'Machu Picchu, Andes Mountains, Peru', clue: 'A 15th-century Inca citadel situated on a mountain ridge 2,430 metres above sea level.', lat: -13.1631, lon: -72.5450, country: 'Peru', tags: ['wonder', 'ancient', 'andes', 'americas', 'mountain'] },
  { name: 'Petra Treasury, Ma\'an Governorate, Jordan', clue: 'A historic city carved into vibrant pink sandstone cliffs, famously known as the Rose City.', lat: 30.3285, lon: 35.4444, country: 'Jordan', tags: ['wonder', 'ancient', 'desert', 'middle east', 'jordan'] },
  { name: 'Christ the Redeemer, Rio de Janeiro, Brazil', clue: 'An Art Deco statue of Jesus Christ atop Mount Corcovado overlooking the coastline.', lat: -22.9519, lon: -43.2105, country: 'Brazil', tags: ['wonder', 'statue', 'brazil', 'americas', 'coast'] },
  { name: 'Chichen Itza, Yucatan, Mexico', clue: 'A monumental pre-Columbian Mayan city anchored by the pyramid temple of El Castillo.', lat: 20.6843, lon: -88.5678, country: 'Mexico', tags: ['wonder', 'ancient', 'maya', 'americas', 'mexico'] },
  { name: 'The Parthenon, Acropolis of Athens, Greece', clue: 'A former temple dedicated to Athena, built at the peak of the Athenian Empire in the 5th century BC.', lat: 37.9715, lon: 23.7257, country: 'Greece', tags: ['ancient', 'greece', 'europe', 'temple', 'monument'] },

  // European Capitals & Icons
  { name: 'Eiffel Tower, Paris, France', clue: 'The iconic wrought-iron lattice tower on the Champ de Mars, built as the entrance arch for the 1889 World\'s Fair.', lat: 48.8584, lon: 2.2945, country: 'France', tags: ['europe', 'paris', 'france', 'landmark', 'tower'] },
  { name: 'Big Ben & Palace of Westminster, London, UK', clue: 'The iconic clock tower and parliament buildings standing beside the River Thames.', lat: 51.5007, lon: -0.1246, country: 'United Kingdom', tags: ['europe', 'london', 'uk', 'landmark', 'capital'] },
  { name: 'Brandenburg Gate, Berlin, Germany', clue: 'An 18th-century neoclassical monument marking the former division and reunification of Germany.', lat: 52.5163, lon: 13.3777, country: 'Germany', tags: ['europe', 'berlin', 'germany', 'monument', 'capital'] },
  { name: 'Sagrada Família, Barcelona, Spain', clue: 'Antoni Gaudí\'s renowned unfinished basilica featuring soaring organic towers.', lat: 41.4036, lon: 2.1744, country: 'Spain', tags: ['europe', 'spain', 'architecture', 'church'] },
  { name: 'Charles Bridge, Prague, Czech Republic', clue: 'A medieval stone arch bridge lined with 30 statues of saints spanning the Vltava river.', lat: 50.0865, lon: 14.4114, country: 'Czech Republic', tags: ['europe', 'bridge', 'prague', 'historic'] },
  { name: 'Canals of Venice, Venice, Italy', clue: 'A network of historic waterways lined with Renaissance palaces traversed by traditional gondolas.', lat: 45.4371, lon: 12.3326, country: 'Italy', tags: ['europe', 'italy', 'water', 'city'] },

  // Asian Skylines & Monuments
  { name: 'Shibuya Crossing, Tokyo, Japan', clue: 'The world\'s busiest pedestrian scramble crossing surrounded by neon video screens and skyscrapers.', lat: 35.6595, lon: 139.7005, country: 'Japan', tags: ['asia', 'japan', 'tokyo', 'city', 'modern'] },
  { name: 'Marina Bay Sands, Singapore', clue: 'An integrated resort featuring three towers connected by a 340-metre-long SkyPark infinity pool.', lat: 1.2838, lon: 103.8591, country: 'Singapore', tags: ['asia', 'singapore', 'skyline', 'modern'] },
  { name: 'Burj Khalifa, Dubai, UAE', clue: 'The world\'s tallest architectural structure, piercing the Arabian sky at 828 metres.', lat: 25.1972, lon: 55.2744, country: 'United Arab Emirates', tags: ['asia', 'middle east', 'dubai', 'skyscraper', 'tallest'] },
  { name: 'Fushimi Inari-taisha, Kyoto, Japan', clue: 'A sacred Shinto shrine famous for thousands of vibrant vermilion torii gates winding through the mountain forest.', lat: 34.9671, lon: 135.7727, country: 'Japan', tags: ['asia', 'japan', 'temple', 'nature', 'kyoto'] },
  { name: 'Victoria Peak, Hong Kong', clue: 'A hill offering panoramic views over Victoria Harbour and one of the world\'s densest skyscraper skylines.', lat: 22.2759, lon: 114.1455, country: 'Hong Kong', tags: ['asia', 'skyline', 'harbour', 'view'] },
  { name: 'Angkor Wat, Siem Reap, Cambodia', clue: 'The largest religious monument in the world, surrounded by a massive reservoir moat.', lat: 13.4125, lon: 103.8670, country: 'Cambodia', tags: ['asia', 'ancient', 'temple', 'cambodia'] },

  // Americas & Oceans
  { name: 'Times Square, New York City, USA', clue: 'The bustling epicenter of the Broadway Theater District lit by towering animated LED billboards.', lat: 40.7580, lon: -73.9855, country: 'United States', tags: ['americas', 'usa', 'new york', 'city', 'night'] },
  { name: 'Golden Gate Bridge, San Francisco, USA', clue: 'A 1.7-mile suspension bridge painted International Orange spanning the entrance to San Francisco Bay.', lat: 37.8199, lon: -122.4783, country: 'United States', tags: ['americas', 'usa', 'bridge', 'san francisco'] },
  { name: 'Grand Canyon South Rim, Arizona, USA', clue: 'A mile-deep gorge carved by the Colorado River exposing two billion years of Earth\'s geological history.', lat: 36.0544, lon: -112.1401, country: 'United States', tags: ['americas', 'usa', 'nature', 'canyon'] },
  { name: 'Sydney Opera House, Sydney, Australia', clue: 'A multi-venue performing arts centre designed with distinctive sail-shaped concrete shells on Bennelong Point.', lat: -33.8568, lon: 151.2153, country: 'Australia', tags: ['oceania', 'australia', 'sydney', 'architecture', 'coast'] },
  { name: 'Banff National Park & Lake Louise, Alberta, Canada', clue: 'A glacial turquoise lake surrounded by soaring Canadian Rocky Mountain peaks and Victoria Glacier.', lat: 51.4254, lon: -116.1773, country: 'Canada', tags: ['americas', 'canada', 'nature', 'lake', 'mountains'] },
  { name: 'Niagara Falls, Ontario / New York', clue: 'Three monumental waterfalls that straddle the international border between Canada and the United States.', lat: 43.0799, lon: -79.0747, country: 'Canada / USA', tags: ['americas', 'waterfall', 'nature'] }
];

function generateCuratedGeoQuizFallback(topic, count = 5, region = 'all') {
  const query = (topic || '').toLowerCase();
  const targetCount = Math.min(10, Math.max(3, count));

  // Score candidate locations based on keywords in topic
  let candidates = CURATED_FALLBACK_GEO_DATABASE.map(loc => {
    let score = 0;
    if (query) {
      for (const tag of loc.tags) {
        if (query.includes(tag) || tag.includes(query)) score += 3;
      }
      if (loc.name.toLowerCase().includes(query)) score += 5;
      if (loc.country.toLowerCase().includes(query)) score += 4;
      if (loc.clue.toLowerCase().includes(query)) score += 2;
    }

    // Region filter
    if (region && region !== 'all') {
      const reg = region.toLowerCase();
      if (loc.tags.some(t => t.includes(reg))) score += 5;
    }

    return { ...loc, matchScore: score };
  });

  // Sort by score then add slight randomness
  candidates.sort((a, b) => (b.matchScore + Math.random() * 2) - (a.matchScore + Math.random() * 2));

  const chosen = candidates.slice(0, targetCount).map((loc, idx) => ({
    id: `geo_curated_${Date.now()}_${idx}`,
    name: loc.name,
    clue: loc.clue,
    lat: loc.lat,
    lon: loc.lon,
    country: loc.country,
    toleranceKm: 200,
    isCustom: true,
  }));

  const cleanTitle = topic && topic.trim()
    ? `${topic.trim().replace(/\b\w/g, l => l.toUpperCase())} Expedition`
    : 'World Wonders Expedition';

  return {
    quizTitle: cleanTitle,
    description: `An AI-curated geographic challenge visiting ${chosen.length} world-class landmarks.`,
    locations: chosen,
  };
}

