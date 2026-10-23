export type Depth = 1 | 2 | 3

export interface BankQuestion {
  text: string
  depth: Depth
  themes: string[]
}

/** Curated bank — depths 1 basic, 2 medium, 3 deep */
export const SYSTEM_QUESTIONS: BankQuestion[] = [
  // Depth 1 — basic
  {
    text: 'What is your go-to comfort food?',
    depth: 1,
    themes: ['food', 'comfort', 'daily'],
  },
  {
    text: 'Are you more of a morning person or a night owl?',
    depth: 1,
    themes: ['routine', 'energy', 'daily'],
  },
  {
    text: 'What show or movie could you rewatch forever?',
    depth: 1,
    themes: ['media', 'fun', 'taste'],
  },
  {
    text: 'Coffee, tea, or something else to start the day?',
    depth: 1,
    themes: ['food', 'routine', 'daily'],
  },
  {
    text: 'What is a small thing that always makes you smile?',
    depth: 1,
    themes: ['joy', 'daily', 'personality'],
  },
  {
    text: 'Do you prefer plans or spontaneity on a weekend?',
    depth: 1,
    themes: ['lifestyle', 'time', 'personality'],
  },
  {
    text: 'What kind of music do you put on when you are alone?',
    depth: 1,
    themes: ['music', 'taste', 'alone'],
  },
  {
    text: 'Beach, mountains, or city for a short getaway?',
    depth: 1,
    themes: ['travel', 'preference', 'fun'],
  },
  {
    text: 'What is your favorite way to spend a rainy day?',
    depth: 1,
    themes: ['lifestyle', 'comfort', 'daily'],
  },
  {
    text: 'Sweet, savory, or spicy — which do you crave most?',
    depth: 1,
    themes: ['food', 'taste'],
  },
  {
    text: 'What hobby would you love more time for?',
    depth: 1,
    themes: ['hobbies', 'time', 'interest'],
  },
  {
    text: 'Introvert battery: how do you recharge after a long day?',
    depth: 1,
    themes: ['personality', 'energy', 'alone'],
  },
  {
    text: 'What is the best meal you have cooked or ordered recently?',
    depth: 1,
    themes: ['food', 'recent', 'joy'],
  },
  {
    text: 'Dogs, cats, both, or neither?',
    depth: 1,
    themes: ['pets', 'preference'],
  },
  {
    text: 'What app do you open without thinking?',
    depth: 1,
    themes: ['tech', 'daily', 'habits'],
  },

  // Depth 2 — medium
  {
    text: 'What does a perfect ordinary Tuesday look like for you?',
    depth: 2,
    themes: ['lifestyle', 'values', 'daily'],
  },
  {
    text: 'Who in your life has shaped you the most, and how?',
    depth: 2,
    themes: ['people', 'growth', 'relationships'],
  },
  {
    text: 'What is a compliment you still remember years later?',
    depth: 2,
    themes: ['memory', 'self', 'emotion'],
  },
  {
    text: 'How do you usually handle stress when life gets loud?',
    depth: 2,
    themes: ['stress', 'coping', 'personality'],
  },
  {
    text: 'What is something you are proudly stubborn about?',
    depth: 2,
    themes: ['values', 'personality', 'self'],
  },
  {
    text: 'Describe a friendship that taught you something important.',
    depth: 2,
    themes: ['friendship', 'growth', 'relationships'],
  },
  {
    text: 'What does “feeling at home” mean to you?',
    depth: 2,
    themes: ['home', 'belonging', 'values'],
  },
  {
    text: 'When do you feel most like yourself?',
    depth: 2,
    themes: ['self', 'authenticity', 'emotion'],
  },
  {
    text: 'What is a risk you took that paid off?',
    depth: 2,
    themes: ['risk', 'growth', 'memory'],
  },
  {
    text: 'How do you like to celebrate small wins?',
    depth: 2,
    themes: ['joy', 'habits', 'lifestyle'],
  },
  {
    text: 'What topic can you talk about for an hour without getting bored?',
    depth: 2,
    themes: ['interest', 'passion', 'conversation'],
  },
  {
    text: 'What boundary do you wish more people respected?',
    depth: 2,
    themes: ['boundaries', 'values', 'relationships'],
  },
  {
    text: 'What is a tradition you want to keep or start?',
    depth: 2,
    themes: ['tradition', 'family', 'values'],
  },
  {
    text: 'How has your definition of success changed over time?',
    depth: 2,
    themes: ['success', 'growth', 'values'],
  },
  {
    text: 'What makes you feel appreciated by someone?',
    depth: 2,
    themes: ['love', 'relationships', 'emotion'],
  },
  {
    text: 'What is a place that always resets your mood?',
    depth: 2,
    themes: ['place', 'emotion', 'comfort'],
  },
  {
    text: 'How do you know when you truly trust someone?',
    depth: 2,
    themes: ['trust', 'relationships', 'values'],
  },
  {
    text: 'What childhood habit still shows up in your adult life?',
    depth: 2,
    themes: ['childhood', 'personality', 'habits'],
  },

  // Depth 3 — deeper
  {
    text: 'What are you still learning to forgive yourself for?',
    depth: 3,
    themes: ['forgiveness', 'self', 'growth', 'emotion'],
  },
  {
    text: 'What fear quietly influences your decisions?',
    depth: 3,
    themes: ['fear', 'decisions', 'self'],
  },
  {
    text: 'What does love look like to you on an ordinary day?',
    depth: 3,
    themes: ['love', 'relationships', 'values', 'daily'],
  },
  {
    text: 'When have you felt most misunderstood?',
    depth: 3,
    themes: ['emotion', 'connection', 'self'],
  },
  {
    text: 'What part of your life feels unfinished in a good way?',
    depth: 3,
    themes: ['growth', 'future', 'self'],
  },
  {
    text: 'What would you want someone to understand about you that is hard to say?',
    depth: 3,
    themes: ['vulnerability', 'self', 'connection'],
  },
  {
    text: 'How do you hope to be remembered by the people closest to you?',
    depth: 3,
    themes: ['legacy', 'values', 'relationships'],
  },
  {
    text: 'What belief about yourself have you outgrown?',
    depth: 3,
    themes: ['growth', 'self', 'belief'],
  },
  {
    text: 'What does emotional safety feel like for you?',
    depth: 3,
    themes: ['safety', 'emotion', 'relationships'],
  },
  {
    text: 'If your younger self could see you now, what would surprise them most?',
    depth: 3,
    themes: ['growth', 'past', 'self'],
  },
  {
    text: 'What is a truth you learned the hard way about relationships?',
    depth: 3,
    themes: ['relationships', 'growth', 'truth'],
  },
  {
    text: 'Where do you still need more kindness — from yourself or others?',
    depth: 3,
    themes: ['kindness', 'self', 'emotion'],
  },
  {
    text: 'What would a brave next chapter look like for you?',
    depth: 3,
    themes: ['future', 'courage', 'growth'],
  },
  {
    text: 'What do you protect the most in your life right now?',
    depth: 3,
    themes: ['values', 'priorities', 'self'],
  },
  {
    text: 'When do you feel deeply connected to another person?',
    depth: 3,
    themes: ['connection', 'love', 'relationships'],
  },
]
