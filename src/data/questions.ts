import { Question } from '../types.js';

export const LOCAL_QUESTIONS: Question[] = [
  // BANGLA
  {
    id: 'ban_1',
    subject: 'Bangla',
    topic: 'সাহিত্য (Literature)',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Standard',
    questionText: '‘কবর’ কবিতাটি জসীমউদ্‌দীনের কোন কাব্যগ্রন্থের অন্তর্গত?',
    options: [
      'A) সুহাসিনী',
      'B) রাখালী',
      'C) ধানক্ষেত',
      'D) বালুচর'
    ],
    correctAnswerIndex: 1, // রাখালী
    explanation: 'পল্লীকবি জসীমউদ্‌দীনের বিখ্যাত ‘কবর’ কবিতাটি তাঁর প্রথম কাব্যগ্রন্থ ‘রাখালী’ (১৯২৭) এর অন্তর্গত। এটি প্রথম দিনেশচন্দ্র সেনের বঙ্গভাষা ও সাহিত্য গ্রন্থে প্রকাশিত হয়েছিল এবং পরে রাখালী কাব্যে স্থান পায়।'
  },
  {
    id: 'ban_2',
    subject: 'Bangla',
    topic: 'ব্যাকরণ (Grammar)',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Moderate',
    questionText: '‘উড্ডীন’ শব্দের সঠিক সন্ধি বিচ্ছেদ কোনটি?',
    options: [
      'A) উদ্ + ডীন',
      'B) উৎ + ডীন',
      'C) উড় + ডীন',
      'D) উ + ডীন'
    ],
    correctAnswerIndex: 1, // উৎ + ডীন
    explanation: 'ব্যঞ্জনসন্ধির নিয়ম অনুযায়ী, ত্‌ বা দ্‌-এর পরে ড্‌ থাকলে ত্‌ ও দ্‌ স্থানে ড্‌ হয়। অতএব, উৎ + ডীন = উড্ডীন।'
  },
  {
    id: 'ban_3',
    subject: 'Bangla',
    topic: 'সাহিত্য (Literature)',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'বাংলা সাহিত্যের প্রথম সার্থক মহাকাব্য ‘মেঘনাদবধ কাব্য’ কত সালে প্রথম প্রকাশিত হয়?',
    options: [
      'A) ১৮৫৭',
      'B) ১৮৬১',
      'C) ১৮৬৫',
      'D) ১৮৬৯'
    ],
    correctAnswerIndex: 1, // ১৮৬১
    explanation: 'মহাকবি মাইকেল মধুসূদন দত্ত রচিত বাংলা সাহিত্যের প্রথম অমিত্রাক্ষর ছন্দে রচিত সার্থক মহাকাব্য ‘মেঘনাদবধ কাব্য’ ১৮৬১ সালে প্রথম প্রকাশিত হয়।'
  },
  {
    id: 'ban_4',
    subject: 'Bangla',
    topic: 'ব্যাকরণ (Grammar)',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Easy',
    questionText: 'কোনটি রূপক কর্মধারয় সমাসের উদাহরণ?',
    options: [
      'A) মহারাজ',
      'B) নীলপদ্ম',
      'C) ক্রোধানল',
      'D) মুখচন্দ্র'
    ],
    correctAnswerIndex: 2, // ক্রোধানল
    explanation: 'উপমান ও উপমেয়ের মধ্যে অভেদ কল্পনা করা হলে তাকে রূপক কর্মধারয় সমাস বলে। এখানে ক্রোধ রূপ অনল = ক্রোধানল।'
  },

  // ENGLISH
  {
    id: 'eng_1',
    subject: 'English',
    topic: 'Literature',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Standard',
    questionText: 'Who is the author of "The Waste Land"?',
    options: [
      'A) William Butler Yeats',
      'B) T.S. Eliot',
      'C) Ezra Pound',
      'D) W.H. Auden'
    ],
    correctAnswerIndex: 1, // T.S. Eliot
    explanation: '"The Waste Land" is a landmark modernist poem written by T.S. Eliot, published in 1922.'
  },
  {
    id: 'eng_2',
    subject: 'English',
    topic: 'Grammar & Vocabulary',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Moderate',
    questionText: 'What is the synonym of the word "FRUGAL"?',
    options: [
      'A) Generous',
      'B) Spendthrift',
      'C) Economical',
      'D) Wasteful'
    ],
    correctAnswerIndex: 2, // Economical
    explanation: '"Frugal" means careful or sparing with regard to food or money; avoiding waste. Therefore, "Economical" is the correct synonym.'
  },
  {
    id: 'eng_3',
    subject: 'English',
    topic: 'Literature',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'In Shakespeare’s play "Hamlet", near which castle of Denmark does the ghost appear?',
    options: [
      'A) Windsor Castle',
      'B) Elsinore (Kronborg) Castle',
      'C) Edinburgh Castle',
      'D) Versailles'
    ],
    correctAnswerIndex: 1, // Elsinore Castle
    explanation: 'The setting of Shakespeare’s Hamlet is Elsinore Castle in Denmark, where the ghost of Hamlet’s father appears on the castle ramparts.'
  },
  {
    id: 'eng_4',
    subject: 'English',
    topic: 'Idioms & Phrases',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Easy',
    questionText: 'What does the idiom "Achilles’ heel" mean?',
    options: [
      'A) A fast runner',
      'B) Ultimate strength',
      'C) A vulnerable point or weakness',
      'D) A lucky charm'
    ],
    correctAnswerIndex: 2, // A vulnerable point
    explanation: 'Achilles’ heel refers to a deadly or vulnerable weakness in spite of overall strength.'
  },

  // MATHEMATICS
  {
    id: 'math_1',
    subject: 'Mathematics',
    topic: 'Algebra',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Standard',
    questionText: 'If log₂(x) + log₂(x - 2) = 3, what is the value of x?',
    options: [
      'A) 2',
      'B) 4',
      'C) -2',
      'D) 8'
    ],
    correctAnswerIndex: 1, // 4
    explanation: 'log₂(x(x - 2)) = 3 => x(x - 2) = 2³ = 8 => x² - 2x - 8 = 0. Solving this gives (x - 4)(x + 2) = 0. Since log input must be positive, x must be 4.'
  },
  {
    id: 'math_2',
    subject: 'Mathematics',
    topic: 'Arithmetic',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Moderate',
    questionText: 'একটি ঘড়ি ১০% ক্ষতিতে বিক্রয় করা হলো। বিক্রয়মূল্য ৪৫ টাকা বেশি হলে ৫% লাভ হতো। ঘড়িটির ক্রয়মূল্য কত?',
    options: [
      'A) ৩০০ টাকা',
      'B) ৩৫০ টাকা',
      'C) ৪০০ টাকা',
      'D) ৪৫০ টাকা'
    ],
    correctAnswerIndex: 0, // ৩০০
    explanation: 'বিক্রয়মূল্যের পার্থক্য = ৫% লাভ - (-১০% ক্ষতি) = ১৫%। প্রশ্নমতে, ১৫% = ৪৫ টাকা। অতএব, ক্রয়মূল্য ১০০% = (৪৫/১৫) * ১০০ = ৩০০ টাকা।'
  },
  {
    id: 'math_3',
    subject: 'Mathematics',
    topic: 'Geometry',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'একটি সুষম বহুভুজের প্রতিটি অন্তঃকোণ ১৬২° হলে বহুভুজটির বাহুর সংখ্যা কত?',
    options: [
      'A) ১৫টি',
      'B) ১৮টি',
      'C) ২০টি',
      'D) ২৪টি'
    ],
    correctAnswerIndex: 2, // ২০টি
    explanation: 'প্রতিটি বহিঃকোণ = ১৮০° - ১৬২° = ১৮°। যেকোনো বহুভুজের বহিঃকোণগুলোর সমষ্টি ৩৬০°। অতএব, বাহুর সংখ্যা = ৩৬০ / ১৮ = ২০।'
  },
  {
    id: 'math_4',
    subject: 'Mathematics',
    topic: 'Arithmetic',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Easy',
    questionText: 'তিনটি সংখ্যার গড় ২০ এবং তাদের অনুপাত ২ : ৩ : ৫ হলে বৃহত্তম সংখ্যাটি কত?',
    options: [
      'A) ১৫',
      'B) ২০',
      'C) ৩০',
      'D) ৪০'
    ],
    correctAnswerIndex: 2, // ৩০
    explanation: 'গড় ২০ হলে সংখ্যা তিনটির সমষ্টি ৬০। অনুপাতের যোগফল ২ + ৩ + ৫ = ১০। বৃহত্তম সংখ্যাটি ৬০ এর ৫/১০ = ৩০।'
  },

  // ICT
  {
    id: 'ict_1',
    subject: 'ICT',
    topic: 'Computer Hardware & Network',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Standard',
    questionText: 'নিচের কোনটি প্রাইভেট আইপি (Private IP Address) হিসেবে ব্যবহৃত হয়?',
    options: [
      'A) 172.16.0.1',
      'B) 8.8.8.8',
      'C) 192.169.1.5',
      'D) 12.0.0.1'
    ],
    correctAnswerIndex: 0, // 172.16.0.1
    explanation: 'RFC 1918 অনুযায়ী প্রাইভেট আইপি এড্রেসের সীমাগুলো হলো: 10.0.0.0 - 10.255.255.255, 172.16.0.0 - 172.31.255.255, এবং 192.168.0.0 - 192.168.255.255। এখানে 172.16.0.1 হচ্ছে প্রাইভেট আইপি।'
  },
  {
    id: 'ict_2',
    subject: 'ICT',
    topic: 'Databases & Web',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Moderate',
    questionText: 'ডিজিটাল লজিক গেটে ‘XOR’ গেটের আউটপুট কখন ১ হয়?',
    options: [
      'A) উভয় ইনপুট ১ হলে',
      'B) উভয় ইনপুট ০ হলে',
      'C) ইনপুটদ্বয় অসমান হলে',
      'D) ইনপুটদ্বয় সমান হলে'
    ],
    correctAnswerIndex: 2, // ইনপুটদ্বয় অসমান হলে
    explanation: 'Exclusive OR (XOR) গেটের আউটপুট তখনই ১ (high) হয় যখন ইনপুটগুলো অসমান থাকে (একটি ০ এবং আরেকটি ১)।'
  },
  {
    id: 'ict_3',
    subject: 'ICT',
    topic: 'Cryptography',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'What is the full form of HTTPS and on which default port does it run?',
    options: [
      'A) Hypertext Transfer Protocol Standard, Port 80',
      'B) Hypertext Transfer Protocol Secure, Port 443',
      'C) Hypertext Transfer Protocol Shared, Port 8080',
      'D) High-speed Transfer Protocol secure, Port 443'
    ],
    correctAnswerIndex: 1, // Hypertext Transfer Protocol Secure, Port 443
    explanation: 'HTTPS stands for Hypertext Transfer Protocol Secure and it uses TLS/SSL encryption. By default, it operates on TCP port 443.'
  },

  // BANGLADESH AFFAIRS
  {
    id: 'bd_1',
    subject: 'Bangladesh Affairs',
    topic: 'Liberation War & History',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Standard',
    questionText: 'মুক্তিযুদ্ধকালীন গঠিত মুজিবনগর সরকারের পররাষ্ট্রমন্ত্রীর দায়িত্বে কে ছিলেন?',
    options: [
      'A) তাজউদ্দীন আহমদ',
      'B) সৈয়দ নজরুল ইসলাম',
      'C) খন্দকার মোশতাক আহমদ',
      'D) ক্যাপ্টেন এম মনসুর আলী'
    ],
    correctAnswerIndex: 2, // খন্দকার মোশতাক আহমদ
    explanation: '১৯৭১ সালের ১০ই এপ্রিল গঠিত মুজিবনগর সরকারের পররাষ্ট্রমন্ত্রী ও আইনমন্ত্রী ছিলেন জনাব খন্দকার মোশতাক আহমদ। তাজউদ্দীন আহমদ ছিলেন প্রধানমন্ত্রী ও মনসুর আলী ছিলেন অর্থমন্ত্রী।'
  },
  {
    id: 'bd_2',
    subject: 'Bangladesh Affairs',
    topic: 'Constitution',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Moderate',
    questionText: 'গণপ্রজাতন্ত্রী বাংলাদেশের সংবিধান কত তারিখে কার্যকর করা হয়?',
    options: [
      'A) ৪ নভেম্বর ১৯৭২',
      'B) ১৬ ডিসেম্বর ১৯৭২',
      'C) ২৬ মার্চ ১৯৭২',
      'D) ১০ এপ্রিল ১৯৭২'
    ],
    correctAnswerIndex: 1, // ১৬ ডিসেম্বর ১৯৭২
    explanation: 'বাংলাদেশের খসড়া সংবিধান ৪ই নভেম্বর ১৯৭২-এ গণপরিষদে গৃহীত হয় এবং ওই বছরেরই ১৬ই ডিসেম্বর (বিজয় দিবসে) থেকে এটি কার্যকর হয়।'
  },
  {
    id: 'bd_3',
    subject: 'Bangladesh Affairs',
    topic: 'Geography & Economy',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'বাংলাদেশ ও মায়ানমারকে বিভক্তকারী ‘নাফ’ নদীর দৈর্ঘ্য কত?',
    options: [
      'A) ৫৪ কি.মি.',
      'B) ৫৬ কি.মি.',
      'C) ৬৪ কি.মি.',
      'D) ৭২ কি.মি.'
    ],
    correctAnswerIndex: 1, // ৫৬ কি.মি.
    explanation: 'নাফ নদী বাংলাদেশ ও মায়ানমারকে পৃথককারী সীমানা নদী। এর দৈর্ঘ্য প্রায় ৫৬ কিলোমিটার (৩৫ মাইল)।'
  },

  // INTERNATIONAL AFFAIRS
  {
    id: 'int_1',
    subject: 'International Affairs',
    topic: 'Geopolitics',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Standard',
    questionText: 'ম্যাকমহন লাইন (McMahon Line) কোন দুটি দেশের সীমানা নির্ধারণ করে?',
    options: [
      'A) ভারত ও পাকিস্তান',
      'B) ভারত ও চীন',
      'C) চীন ও রাশিয়া',
      'D) ভারত ও নেপাল'
    ],
    correctAnswerIndex: 1, // ভারত ও চীন
    explanation: 'ম্যাকমহন লাইন হলো ভারত ও চীনের তিব্বত অঞ্চলের মধ্যকার সীমানা রেখা, যা ১৯১৪ সালের শিমলা চুক্তির মাধ্যমে প্রস্তাবিত হয়েছিল।'
  },
  {
    id: 'int_2',
    subject: 'International Affairs',
    topic: 'Organizations',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Moderate',
    questionText: 'আন্তর্জাতিক রেড ক্রস কমিটির (ICRC) সদর দপ্তর কোথায় অবস্থিত?',
    options: [
      'A) জেনেভা',
      'B) প্যারিস',
      'C) নিউ ইয়র্ক',
      'D) লন্ডন'
    ],
    correctAnswerIndex: 0, // জেনেভা
    explanation: '১৮৬৩ সালে হেনরি ডুনান্ট কর্তৃক প্রতিষ্ঠিত আন্তর্জাতিক রেড ক্রস কমিটির সদর দপ্তর সুইজারল্যান্ডের জেনেভা শহরে অবস্থিত।'
  },
  {
    id: 'int_3',
    subject: 'International Affairs',
    topic: 'Global Economics & Finance',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'ইউরোপীয় ইউনিয়নের একক মুদ্রা ‘ইউরো’ (Euro) আনুষ্ঠানিকভাবে কত সালে চালু হয়?',
    options: [
      'A) ১৯৯৫',
      'B) ১৯৯৯',
      'C) ২০০২',
      'D) ২০০১'
    ],
    correctAnswerIndex: 1, // ১৯৯৯
    explanation: '১৯৯৯ সালের ১লা জানুয়ারি ইউরো মুদ্রাকে নন-ফিজিক্যাল বা ভার্চুয়াল কারেন্সি (হিসাব কিতাবের জন্য) হিসেবে চালু করা হয় এবং ২০০২ সালের ১লা জানুয়ারি থেকে তা ফিজিক্যাল ক্যাশ আকারে চালু হয়। এখানে বুক-কিপিং এবং ফাইনান্সিয়াল ট্রানজেকশনে আনুষ্ঠানিক চালুর উত্তর ১৯৯৯ সাল।'
  },

  // GENERAL SCIENCE
  {
    id: 'sci_1',
    subject: 'General Science',
    topic: 'Physics',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Standard',
    questionText: 'কোন রঙের আলোর তরঙ্গ দৈর্ঘ্য (Wavelength) সবচেয়ে কম?',
    options: [
      'A) লাল',
      'B) সবুজ',
      'C) বেগুনী',
      'D) হলুদ'
    ],
    correctAnswerIndex: 2, // বেগুনী
    explanation: 'দৃশ্যমান আলোর মধ্যে বেগুনী আলোর তরঙ্গ দৈর্ঘ্য সবচেয়ে কম (৩৮০-৪৫০ ন্যানোমিটার) এবং লাল আলোর তরঙ্গ দৈর্ঘ্য সবচেয়ে বেশি।'
  },
  {
    id: 'sci_2',
    subject: 'General Science',
    topic: 'Biology',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Moderate',
    questionText: 'রক্তের গ্রুপ ও অ্যান্টিজেন আবিষ্কারের জন্য কাকে নোবেল পুরস্কার দেয়া হয়েছিল?',
    options: [
      'A) আলেকজান্ডার ফ্লেমিং',
      'B) রবার্ট কচ',
      'C) কার্ল ল্যান্ডস্টেইনার',
      'D) এডওয়ার্ড জেনার'
    ],
    correctAnswerIndex: 2, // কার্ল ল্যান্ডস্টেইনার
    explanation: '১৯৩০ সালে বিজ্ঞানী কার্ল ল্যান্ডস্টেইনার প্রধান রক্তের গ্রুপসমূহ (A, B, O) আবিষ্কারের জন্য চিকিৎস বিজ্ঞানে নোবেল পুরস্কার লাভ করেন।'
  },
  {
    id: 'sci_3',
    subject: 'General Science',
    topic: 'Chemistry',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'ভূত্বকের প্রধান বা সর্বাধিক পরিমাণে প্রাপ্ত মৌল উপাদান কোনটি?',
    options: [
      'A) অ্যালুমিনিয়াম',
      'B) অক্সিজেন',
      'C) সিলিকন',
      'D) লোহা'
    ],
    correctAnswerIndex: 1, // অক্সিজেন
    explanation: 'পৃথিবীর ভূত্বকে (Crust) সবচেয়ে বেশি প্রাপ্ত মৌল হলো অক্সিজেন (প্রায় ৪৬.৬%), এরপর ক্রমান্বয়ে সিলিকন (২৭.৭%) এবং অ্যালুমিনিয়াম (৮.১%)।'
  },

  // MENTAL ABILITY
  {
    id: 'men_1',
    subject: 'Mental Ability',
    topic: 'Logical Reasoning',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Standard',
    questionText: 'ধারার পরবর্তী সংখ্যাটি কত হবে? ৩, ৭, ১৫, ৩১, ৬৩, ...',
    options: [
      'A) ৯৫',
      'B) ১২৭',
      'C) ১২৫',
      'D) ১১১'
    ],
    correctAnswerIndex: 1, // ১২৭
    explanation: 'ধারার প্রতিটি সংখ্যা পূর্ববর্তী সংখ্যার দ্বিগুণ অপেক্ষা ১ বেশি। যেমন: ৩*২+১=৭, ৭*২+১=১৫, ১৫*২+১=৩১... সুতরাং পরবর্তী পদটি হবে ৬৩ * ২ + ১ = ১২৭।'
  },
  {
    id: 'men_2',
    subject: 'Mental Ability',
    topic: 'Clocks & Time',
    examType: ['BCS', 'Bank', 'Mixed'],
    difficulty: 'Moderate',
    questionText: 'একটি ঘড়িতে ৪টা বেজে ৩০ মিনিট হওয়াতে ঘন্টার কাঁটা ও মিনিটের কাঁটার মধ্যবর্তী কোণ কত ডিগ্রি?',
    options: [
      'A) ৩০°',
      'B) ৪৫°',
      'C) ৬০°',
      'D) ৭৫°'
    ],
    correctAnswerIndex: 1, // ৪৫°
    explanation: 'কোণ নির্ণয়ের সূত্র: |(১১*মিনিট - ৬০*ঘণ্টা)/২| = |(১১*৩০ - ৬০*৪)/২| = |(৩৩০ - ২৪০)/২| = ৯০/২ = ৪৫°।'
  },
  {
    id: 'men_3',
    subject: 'Mental Ability',
    topic: 'Relations & Puzzles',
    examType: ['BCS', 'Mixed'],
    difficulty: 'Hard',
    questionText: 'রহিমার ভাই রহিমের একমাত্র বোনের মেয়ের মামা। রহিমা রহিমের কে হন?',
    options: [
      'A) ফুফু',
      'B) খালা',
      'C) বোন বা স্বয়ং রহিমা',
      'D) ভাবি'
    ],
    correctAnswerIndex: 2, // বোন বা স্বয়ং রহিমা
    explanation: 'রহিমের একমাত্র বোন রহিমা নিজে হতে পারে। রহিমার একমাত্র বোনের মেয়ের মামা হচ্ছেন রহিমা বা রহিমের ভাই। এটি বোন বা স্বয়ং রহিমার দিকে নির্দেশ করে।'
  }
];
