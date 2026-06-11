import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

let currentDirname = '';
try {
  // Hybrid Safe directory path derivation
  if (typeof __dirname !== 'undefined') {
    currentDirname = __dirname;
  } else {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {
  currentDirname = process.cwd();
}
const useDirname = currentDirname;

const app = express();
app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will fallback to local simulators.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

/**
 * API: Evaluate Weaknesses and suggest tips after a game ends
 */
app.post('/api/ai-analyse', async (req, res) => {
  try {
    const { incorrectQuestions, streak, selectedExamType, totalCount, correctCount, averageTimeTakenInSeconds } = req.body;
    
    // Determine confidence percentage from user responses
    const totalAns = parseInt(totalCount || 0) || 1;
    const corrAns = parseInt(correctCount || 0);
    const calculatedAccuracy = Math.round((corrAns / totalAns) * 100);

    // If no API key is specified, fallback to a smart helper structure
    if (!apiKey) {
      return res.json({
        weaknessDetected: "Difficulty identifying deep structural correlations under tight time pressure, specifically with BPSC/Bank syllabus-specific distractors.",
        personalizedTips: [
          "Practice timed mental calculations to shave off precious seconds on math tasks.",
          "Read daily editorials to improve English vocabulary and synonym memory.",
          "Keep a high-stakes exam log to revise tough ICT protocols before entering the exam hall."
        ],
        recommendedSubjects: ["Mathematics", "ICT", "General Science"],
        motivationQuote: "কষ্টেই তো মেলে গৌরব! আপনার প্রতিটি ব্যর্থতা ক্যাডার হওয়ার সংকল্পকে আরও দৃঢ় করুক। হাল ছাড়বেন না!",
        worstSubjectText: "Mathematics",
        worstSkillNodeCluster: "Ratio-based multi-step proportional reasoning under timed conditions (অনুপাত ও গাণিতিক জটিলতা)",
        errorPatternType: averageTimeTakenInSeconds && averageTimeTakenInSeconds < 5 ? "speed" : "concept",
        improvementRecommendations: [
          "Revise ratio-based multi-step proportional reasoning under timed conditions.",
          "Learn standard mathematical short-cuts for BPSC & bank systems.",
          "Differentiate high-frequency distracting prefixes in Bangla grammar and literature trivia."
        ],
        accuracyRating: `${calculatedAccuracy}% accuracy rate achieved in this exam attempt.`,
        reactionTimeSuitability: averageTimeTakenInSeconds && averageTimeTakenInSeconds < 4 ? "Erratic Speed Rider" : "Steady Thinker",
        estimatedConfidencePercent: Math.min(100, Math.max(10, calculatedAccuracy - 5))
      });
    }

    const client = getAiClient();
    const prompt = `
      The user just participated in a high-stakes competitive job exam preparation quiz called "Exam Survival: BCS & Job Challenge".
      Here is the review data of their failed questions:
      ${JSON.stringify(incorrectQuestions, null, 2)}
      
      Their performance stats for this session:
      Streak achieved: ${streak}
      Total questions attempted: ${totalAns}
      Correct answers: ${corrAns}
      Average duration per question: ${averageTimeTakenInSeconds || 'untracked'} seconds
      Exam blueprint selected: ${selectedExamType}

      Perform an extremely advanced, professional psychometric post-game weak-spot diagnostic.
      Analyze the failed questions, detect their worst subject, formulate their exact weakest specific skill-node cluster (be highly precise, e.g. "Ratio-based multi-step proportional reasoning under timed conditions" or "Mughal land revenue reforms attribution chronological recall"), classify their error pattern type with one of ['speed', 'concept', 'carelessness', 'fatigue'], write 3 highly actionable specific preparation recommendations, grade their reaction time suitability among any of ['Fast Recall', 'Slow Analytical', 'Erratic Speed Rider', 'Steady Thinker'], estimate their confidence percentage (10 to 100), and draft a powerful mentoring support quote in a mix of Bangla and English to motivate them for Bangladesh BCS Cadre / Bank AD selection.
    `;

    const response = await generateContentWithRetry(client, {
      contents: prompt,
      config: {
        systemInstruction: "You are the Chief Academic Evaluator and Psychometric Director for BCS Cadre selection boards and Bangladesh Bank recruitment committees. You analyze contestant metadata with technical precision. Output ONLY in JSON conforming EXACTLY to the requested schema. Do not output markdown codeblocks around the JSON, just raw valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weaknessDetected: {
              type: Type.STRING,
              description: "A professional, deeply analytical 1-2 sentence description of the cognitive weakness or syllabus gap."
            },
            personalizedTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 highly actionable, specific prep strategies or micro-learning recommendations."
            },
            recommendedSubjects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of subjects that need massive remedial practice from ['Bangla','English','Mathematics','ICT','Bangladesh Affairs','International Affairs','General Science','Mental Ability']."
            },
            motivationQuote: {
              type: Type.STRING,
              description: "An intense, emotionally charging motivational quote combining Bangla and English focused on BPSC success."
            },
            worstSubjectText: {
              type: Type.STRING,
              description: "The primary single subject where performance ruptured."
            },
            worstSkillNodeCluster: {
              type: Type.STRING,
              description: "Highly specific skill node description (e.g. 'ratio-based multi-step proportional reasoning under timed conditions' or 'Charyapada epoch chronological attribution')."
            },
            errorPatternType: {
              type: Type.STRING,
              description: "Must be exactly one of: 'speed', 'concept', 'carelessness', 'fatigue'"
            },
            improvementRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 structured steps they must take right now to secure ROI improvement in score."
            },
            accuracyRating: {
              type: Type.STRING,
              description: "A short qualitative report about their accuracy level (e.g. 'Vulnerable (accuracy < 50%)' or 'Exceptional accuracy marred by minor careless slips')."
            },
            reactionTimeSuitability: {
              type: Type.STRING,
              description: "Must be exactly one of: 'Fast Recall', 'Slow Analytical', 'Erratic Speed Rider', 'Steady Thinker'"
            },
            estimatedConfidencePercent: {
              type: Type.INTEGER,
              description: "An estimated score of confidence out of 100 based on their pacing and wrong answers."
            }
          },
          required: [
            "weaknessDetected", "personalizedTips", "recommendedSubjects", "motivationQuote",
            "worstSubjectText", "worstSkillNodeCluster", "errorPatternType", "improvementRecommendations",
            "accuracyRating", "reactionTimeSuitability", "estimatedConfidencePercent"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    return res.status(500).json({
      error: "Failed to generate AI analysis. Running offline diagnostics.",
      weaknessDetected: "Factual recall breakdown during timed stress conditions.",
      personalizedTips: [
        "Focus on revision of BCS past year high-frequency questions.",
        "Solve math-model worksheets under 30 seconds per problem.",
        "Take regular computer hardware mock exams to solidify structural memory."
      ],
      recommendedSubjects: ["ICT", "Mathematics"],
      motivationQuote: "সাফল্যের মূল চাবিকাঠি হলো বারবার ফিরে আসা এবং ভুলগুলো সংশোধন করা। এগিয়ে যান!",
      worstSubjectText: "Mathematics",
      worstSkillNodeCluster: "Proportional scaling and equation speed tricks",
      errorPatternType: "concept",
      improvementRecommendations: [
        "Determine structural concepts for proportional maths problems.",
        "Solve standard mathematical short-cuts daily to sharpen speed.",
        "Identify and revise core high-frequency ICT network protocols regularly."
      ],
      accuracyRating: "60% accuracy rate achieved in this exam attempt.",
      reactionTimeSuitability: "Steady Thinker",
      estimatedConfidencePercent: 55
    });
  }
});

/**
 * Helper: Generate Gemini content with exponential backoff retry and fallback models
 */
async function generateContentWithRetry(client: GoogleGenAI, params: any, retries = 2, delay = 350) {
  let lastError: any = null;
  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite'
  ];

  for (const model of modelsToTry) {
    params.model = model;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting ${model} (attempt ${attempt + 1}/${retries + 1})...`);
        const response = await client.models.generateContent(params);
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || String(err);
        const errStatus = err.status || err.code || (err.response ? err.response.status : null);
        
        const isQuotaError = errStatus === 429 || 
                             errMsg.includes("429") || 
                             errMsg.toLowerCase().includes("quota") || 
                             errMsg.toLowerCase().includes("exhausted");

        if (isQuotaError) {
          console.log(`[Gemini API Info] Model ${model} reached quota/limit (429/RESOURCE_EXHAUSTED). Skipping further retries on this model.`);
          break; // Break the inner retry loop, falling back to next model
        }

        console.log(`[Gemini API Info] Model ${model} attempt ${attempt + 1} failed: ${errMsg}`);

        // Fast-fail invalid API keys or malformed configurations to use offline fallbacks immediately
        if (errStatus === 403 || errStatus === 400 || errMsg.includes("API key not valid") || errMsg.includes("403")) {
          throw err;
        }

        // Handle 503 high demand / service unavailable gracefully
        if (errStatus === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
          if (model === 'gemini-3.5-flash') {
            console.log(`[Gemini API] Fast-failing gemini-3.5-flash due to high demand (503/UNAVAILABLE) - switching directly to gemini-3.1-flash-lite.`);
            break; // Skip rest of retries for this model, fallback to next model
          }
        }

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }
  throw lastError || new Error("Failed to generate content after retries across all options.");
}

/**
 * Helper: Retrieve a high-quality localized mock question with procedural mutations (e.g. for Math)
 */
function getFallbackQuestion(subject: string, difficulty: string, examType: string) {
  const selectedSubject = subject || "Mathematics";
  
  const mockPool: Record<string, any[]> = {
    "Bangla": [
      {
        topic: "আদিযুগ (Early Period)",
        questionText: "বাংলা সাহিত্যের প্রাচীনতম নিদর্শন ‘চর্যাপদ’ প্রধানত কোন ছন্দে রচিত?",
        options: [
          'A) অক্ষরবৃত্ত',
          'B) মাত্রাবৃত্ত',
          'C) স্বরবৃত্ত',
          'D) মুক্তক'
        ],
        correctAnswerIndex: 1,
        explanation: "চর্যাপদের পদাংশগুলো প্রাচীন মাত্রাবৃত্ত বা পাদাকুলক ছন্দের অনুসারী। এটি স্বরপ্রধান বা অক্ষরপ্রধান নয়, বরং মাত্রাবৃত্তের প্রাচীন রূপ ধারণ করে রচিত হয়েছে।",
        skillNode: "Charyapada era literary prosody (চর্যাপদের ছান্দসিক বিশ্লেষণ)",
        errorType: "factual memory slip",
        correctReasoning: "চর্যাপদের প্রতিটি পদের লাইনে মাত্রাভিত্তিক সামঞ্জস্য পাওয়া যায়, যা তৎকালীন অপভ্রংশ ও প্রাচীন বাংলা সংমিশ্রণে প্রবর্তিত মাত্রাবৃত্তের বৈশিষ্ট্য বহন করে।",
        wrongReasoning: "A) অক্ষরবৃত্ত মধ্যযুগে পূর্ণতা পায়। C) স্বরবৃত্ত লোকসাহিত্যে ব্যবহৃত হতো। D) মুক্তক আধুনিক যুগের সৃষ্টি যা রবীন্দ্রনাথ ও জীবনানন্দ প্রবর্তন করেন।",
        conceptBreakdown: "চর্যাপদের ছন্দ বিচার করতে গিয়ে ভাষা বিজ্ঞানী ও সাহিত্য গবেষকগণ এটিকে পাদাকুলক ছন্দ বলে অভিহিত করেছেন, যা আধুনিক পরিমাপে মাত্রাবৃত্ত ছন্দের অন্তর্গত।",
        shortcutMethod: "Memory Hook: প্রাচীনতম গান ও চর্যাপদ সর্বদা মাত্রা মেপে গাওয়া হতো (চর্যা = মাত্রাবৃত্ত)।"
      },
      {
        topic: "আধুনিক যুগ (Modern Literature)",
        questionText: "কাজী নজরুল ইসলামের অগ্নি-বীণা কাব্যগ্রন্থের প্রথম কবিতা কোনটি?",
        options: [
          'A) বিদ্রোহী',
          'B) প্রলয়োল্লাস',
          'C) ধূমকেতু',
          'D) খেয়াপারের তরণী'
        ],
        correctAnswerIndex: 1,
        explanation: "১৯২২ সালে প্রকাশিত কাজী নজরুল ইসলামের অগ্নি-বীণা কাব্যগ্রন্থের প্রথম কবিতা হলো ‘প্রলয়োল্লাস’। এবং দ্বিতীয় কবিতাটি হলো অত্যন্ত সুপরিচিত ও বিখ্যাত ‘বিদ্রোহী’।",
        skillNode: "Nazrul literature chronology mapping (নজরুল সাহিত্যের কালানুক্রমিক বিন্যাস)",
        errorType: "factual memory slip",
        correctReasoning: "কালানুক্রমিক বিন্যাস অনুযায়ী অগ্নি-বীণা কাব্যের প্রথম কবিতা প্রলয়োল্লাস, যা বিপ্লবী চেতনা জাগ্রত করতে রচিত হয়েছিল।",
        wrongReasoning: "A) বিদ্রোহী হলো দ্বিতীয় কবিতা। C) ধূমকেতু একটি পত্রিকা যা তিনি সম্পাদনা করেন। D) খেয়াপারের তরণী হলো অগ্নি-বীণার শেষ দিকের একটি কবিতা।",
        conceptBreakdown: "অগ্নি-বীণা কাব্যে মোট ১২টি কবিতা রয়েছে। এর অগ্রাংশে ‘প্রলয়োল্লাস’ ও পর পর ‘বিদ্রোহী’ ও ‘রক্তাম্বরধারিণী মা’ কবিতাগুলো স্থান পেয়েছে।",
        shortcutMethod: "Memory Mnemonic: অগ্নি-বীণা বাজলে আগে 'প্রলয়' ঘটে, তারপর 'বিদ্রোহী' জন্ম নেয়। (প্রলয়োল্লাস প্রথম, বিদ্রোহী ২য়)"
      },
      {
        topic: "ব্যাকরণ (Grammar)",
        questionText: "কোনটি ‘অপিনিহিতি’ এর সঠিক উদাহরণ?",
        options: [
          'A) আজি > আইজ',
          'B) স্কুল > ইস্কুল',
          'C) দিশা > দিশ',
          'D) কবাট > কপাট'
        ],
        correctAnswerIndex: 0,
        explanation: "উচ্চারণের সুবিধার্থে শব্দের মধ্যে কোনো ব্যঞ্জনবর্ণের আগে ই-কার বা উ-কার উচ্চারিত হলে তাকে অপিনিহিতি বলে। আজি > আইজ, সাধু > সাউধ ইত্যাদি অপিনিহিতির উদাহরণ।",
        skillNode: "Bangla phonology vowel mutations (অপিনিহিতি ধ্বনি পরিবর্তন)",
        errorType: "concept misunderstanding",
        correctReasoning: "পূর্ববর্তী স্বরের অতি-উচ্চারণ বা পূর্বে আগমনকে অপিনিহিতি বিধি বলে। আজি-র 'ই' কার জ-এর পূর্বে উচ্চারিত হয়ে 'আইজ' রূপ নিয়েছে।",
        wrongReasoning: "B) স্কুল > ইস্কুল হলো আদি স্বরাগম। C) দিশা > দিশ হলো অন্ত্যস্বরলোপ। D) কবাট > কপাট হলো ঘোষীভবন বা স্পর্শধ্বনি পরিবর্তন।",
        conceptBreakdown: "অপিনিহিতির সহজ অর্থ হলো: 'আগে স্থাপন করা'। ই বা উ ধ্বনি নির্দিষ্ট বর্ণের আগে এসে বসবে।",
        shortcutMethod: "Mnemonic Rule: 'আইজ রাইতের অপিনিহিতি' (আজি > আইজ, রাতি > রাইত)"
      }
    ],
    "English": [
      {
        topic: "Spelling & Grammar",
        questionText: "Which of the following is the correct spelling for a set of printed research questions?",
        options: [
          'A) Questionaire',
          'B) Questionnaire',
          'C) Questionnair',
          'D) Questionare'
        ],
        correctAnswerIndex: 1,
        explanation: "The correct spelling is 'Questionnaire'. It requires double 'n' and ends with 'aire'. It refers to a list of questions submitted to a number of people for replies.",
        skillNode: "Lexical vocabulary spelling precision (ইংরেজি বানান শুদ্ধিকরণ)",
        errorType: "carelessness",
        correctReasoning: "Standard English lexicography mandates that 'question' combined with the suffix '-naire' retains double 'n' and ends with 'e'.",
        wrongReasoning: "A, C, and D are standard spelling traps that omit either the double-n or the final vowel 'e'.",
        conceptBreakdown: "Word Root breakdown: 'question' (root) + 'naire' (suffix) = Questionnaire. Remember there are always two 'n's.",
        shortcutMethod: "Memory Hook: There is a double 'n' in Questio-NN-aire (think of normal questionnaire as double work, hence double N)."
      },
      {
        topic: "Number & Gender",
        questionText: "What is the correct plural form of the singular noun 'Louse'?",
        options: [
          'A) Louses',
          'B) Lice',
          'C) Lices',
          'D) Louces'
        ],
        correctAnswerIndex: 1,
        explanation: "The plural form of 'louse' (which refers to a wingless parasitic insect) is irregularly formed as 'lice'. Similar to mouse/mice.",
        skillNode: "Irregular noun morphological mutations (অনিয়মিত বহুবচন রূপান্তর)",
        errorType: "factual memory slip",
        correctReasoning: "In Germanic noun mutations, standard internal vowel change happens from -ou- to -i- to describe groups (Louse -> Lice, Mouse -> Mice, Die -> Dice).",
        wrongReasoning: "A) Louses is an incorrect pluralization attempt. C and D are completely non-existent spelling constructions.",
        conceptBreakdown: "An irregular plural is a plural noun that is not formed by adding '-s' or '-es' to the end of the singular word, but through phonetic shifts.",
        shortcutMethod: "Mnemonic Match: Mouse is to Mice, so Louse is to Lice."
      },
      {
        topic: "Prepositions",
        questionText: "Fill in the blank: The train is running ______ time.",
        options: [
          'A) on',
          'B) with',
          'C) in',
          'D) of'
        ],
        correctAnswerIndex: 0,
        explanation: "The correct preposition is 'on'. 'On time' means punctual or according to the scheduled time. 'In time' means early enough, but 'running on time' is a standard idiom.",
        skillNode: "English idiomatic prepositional verbs (অনুপযুক্ত অব্যয় সংশোধন)",
        errorType: "concept misunderstanding",
        correctReasoning: "Standard schedule operations utilize 'on time' to express structured calendar compliance. Thus 'running on time' means maintaining schedule.",
        wrongReasoning: "B) 'with time' is incorrect in transitive sense. C) 'in time' is used for catching events but not standard for vehicle tracks.",
        conceptBreakdown: "On time = punctually scheduled. In time = before it is too late.",
        shortcutMethod: "Quick Hook: Trains 'run' ON top of rails, so they run ON time!"
      }
    ],
    "Mathematics": [
      {
        topic: "Ratio & Proportions (অনুপাত ও সমানুপাত)",
        questionText: "যদি ক:খ = ২:৩ এবং খ:গ = ৪:৫ হয়, তবে ক:খ:গ = কত?",
        options: [
          'A) ৮:১২:১৫',
          'B) ২:৩:৫',
          'C) ৮:১০:১৫',
          'D) ৬:১২:১৫'
        ],
        correctAnswerIndex: 0,
        explanation: "ক:খ = ২:৩ = ৮:১২ (উভয়কে ৪ দ্বারা গুন করে)। খ:গ = ৪:৫ = ১২:১৫ (উভয়কে ৩ দ্বারা গুন করে)। অতএব ক:খ:গ = ৮:১২:১৫।",
        skillNode: "multi-step proportional reasoning (ধারাবাহিক অনুপাত গণনা)",
        errorType: "calculation slip",
        correctReasoning: "উভয় অনুপাতে 'খ'-এর মান সমান করার জন্য প্রথম অনুপাতকে ৪ এবং দ্বিতীয় অনুপাতকে ৩ দ্বারা গুণ করে পাওয়া যায় ৮:১২:১৫।",
        wrongReasoning: "B) ২:৩:৫ সরাসরি বসানো হয়েছে যা ভুল। C এবং D তে অনুপাতের হিসাব ভুল করা হয়েছে।",
        conceptBreakdown: "ধারাবাহিক বা সংযুক্ত অনুপাত নির্ণয়ে উভয় অনুপাতের সাধারণ রাশির মান সমান করতে হয়।",
        shortcutMethod: "Shortcut Strategy: দ-পদ্ধতি ব্যবহার করে অথবা খ-এর মান সমান করে দ্রুত অনুপাত বের করা যায়।"
      }
    ],
    "ICT": [
      {
        topic: "Computer Networking",
        questionText: "কম্পিউটার নেটওয়ার্কের OSI রেফারেন্স মডেলের কোন স্তরটি ডেটা এনক্রিপশন এবং কম্প্রেশনের জন্য দায়ী?",
        options: [
          'A) Application Layer',
          'B) Presentation Layer',
          'C) Session Layer',
          'D) Transport Layer'
        ],
        correctAnswerIndex: 1,
        explanation: "OSI মডেলের Presentation Layer (২য় স্তর নিচ থেকে ৬ষ্ঠ) ডেটা ফরম্যাটিং, এনক্রিপশন, ডিক্রিপশন এবং কম্প্রেশনের কাজ সম্পাদন করে থাকে।",
        skillNode: "OSI reference layers functional mapping (ওএসআই লেয়ার ট্রাফিক ম্যাপিং)",
        errorType: "factual memory slip",
        correctReasoning: "Presentation layer ডেটা ট্রান্সলেশন, ক্রিপ্টোগ্রাফি সিকিউরিটি এবং ডেটা কম্প্রেশন প্রোটোকল প্রসেস করে ইন্টারফেস লেভেলের জন্য ডেটা প্রস্তুত করে থাকে।",
        wrongReasoning: "A) Application Layer হলো রিলেটেড ইউজার ইন্টারফেস প্রোটোকল। C) Session Layer সংযোগ সেশন কন্ট্রোল করে। D) Transport Layer ডেটা প্যাকেট সিকোয়েন্স ঠিক করে।",
        conceptBreakdown: "আইটি প্রিপারেশনের জন্য OSI-এর সাটি লেয়ারের মেমরি হ্যাক হলো: 'Please Do Not Touch Steve's Pet Alligator' (Physical, Data Link, Network, Transport, Session, Presentation, Application)।",
        shortcutMethod: "Shortcut Technique: Encryption + Compression = Presentation (E+C = P, 'পিকচার ফরম্যাট প্রেজেন্ট করে' দিয়ে মনে রাখুন)"
      },
      {
        topic: "IP Addressing Protocol",
        questionText: "ইন্টারনেট প্রোটোকল সংস্করণ ৬ (IPv6) অ্যাড্রেস কত বিট নিয়ে গঠিত?",
        options: [
          'A) ৩২ বিট',
          'B) ৬৪ বিট',
          'C) ১২৮ বিট',
          'D) ২৫৬ বিট'
        ],
        correctAnswerIndex: 2,
        explanation: "IPv6 অ্যাড্রেস হলো ১২৮ বিটের (১৬ বাইট) একটি আলফানিউমেরিক অ্যাড্রেস, যা বিপুল সংখ্যক বৈশ্বিক ডিভাইসকে ইউনিক আইপি প্রদান করতে সক্ষম। যেখানে IPv4 হলো মাত্র ৩২ বিটের।",
        skillNode: "Internet addressing protocol mapping (আইপি অ্যাড্রেসিং বিট ম্যাপিং)",
        errorType: "factual memory slip",
        correctReasoning: "ইন্টারনেট ইঞ্জিনিয়ারিং টাস্ক ফোর্স (IETF) দ্বারা প্রবর্তিত IPv6 অ্যাড্রেস ১২৮ বিট ধারণ করে, যা হেক্সাডেসিমেল পদ্ধতিতে প্রকাশ করা হয়।",
        wrongReasoning: "A) ৩২ বিট হলো IPv4 এর আকার। B) ৬৪ বিট ও D) ২৫৬ বিট কোনো সাধারণ আইপি সংস্করণের দৈর্ঘ্য নয়।",
        conceptBreakdown: "আইপি অ্যাড্রেসের বিট সাইজ মনে রাখার সহজ ট্রিক: IPv4 = ৪ বাইট × ৮ বিট = ৩২ বিট। IPv6 = ১৬ বাইট × ৮ বিট = ১২৮ বিট।",
        shortcutMethod: "Quick Hook: IPv4 = 32-bit. IPv6 is 4 times larger in width: 32 x 4 = 128-bit."
      }
    ],
    "Bangladesh Affairs": [
      {
        topic: "Liberation War ১৯৭১",
        questionText: "১৯৭১ সালের মহান মুক্তিযুদ্ধের সময় গঠিত অস্থায়ী ‘মুজিবনগর সরকার’ কত তারিখে আনুষ্ঠানিকভাবে গঠিত হয়েছিল?",
        options: [
          'A) ১০ এপ্রিল ১৯৭১',
          'B) ১৭ এপ্রিল ১৯৭১',
          'C) ২৫ মার্চ ১৯৭১',
          'D) ২৬ মার্চ ১৯৭১'
        ],
        correctAnswerIndex: 0,
        explanation: "মুজিবনগর সরকার আনুষ্ঠানিকভাবে গঠিত হয়েছিল ১০ এপ্রিল ১৯৭১ তারিখে। এবং ১৭ এপ্রিল ১৯৭১ তারিখে এই সরকার শপথ গ্রহণ করে।",
        skillNode: "Mujibnagar government historical timelines (মুজিবনগর সরকারের ইতিহাস)",
        errorType: "factual memory slip",
        correctReasoning: "১০ এপ্রিল ১৯৭১ তারিখে স্বাধীন বাংলাদেশ সরকার গঠিত হয় এবং স্বাধীনতার ঘোষণাপত্র অনুমোদিত হয়।",
        wrongReasoning: "B) ১৭ এপ্রিল ১৯৭১ শপথ গ্রহনের তারিখ। C) ২৫ মার্চ ১৯৭১ গণহত্যা শুরু হয়। D) ২৬ মার্চ ১৯৭১ বাংলাদেশের স্বাধীনতা ঘোষিত হয়।",
        conceptBreakdown: "বাংলাদেশের প্রথম সরকার গঠিত হয় ১০ এপ্রিল এবং এই মন্ত্রিসভা শপথ নেয় ১৭ এপ্রিল মেহেরপুরের বৈদ্যনাথতলার আম্রকাননে।",
        shortcutMethod: "Mnemonic: ১০ তারিখে গঠন, ১৭ তারিখে শপথ (১০ আগে ১৭ পরে)।"
      },
      {
        topic: "Geographical Features",
        questionText: "বাংলাদেশের একমাত্র পাহাড়ি দ্বীপ কোনটি?",
        options: [
          'A) সেন্টমার্টিন',
          'B) মহেশখালী',
          'C) সোনাদিয়া',
          'D) কুতুবদিয়া'
        ],
        correctAnswerIndex: 1,
        explanation: "বাংলাদেশের একমাত্র পাহাড়ি দ্বীপ হলো মহেশখালী। এটি লবণ চাষ ও শুঁটকি উৎপাদনের জন্য এবং মৈনাক পর্বতমালার আদি আদিনাথ শিব মন্দিরের জন্য বিখ্যাত।",
        skillNode: "Bangladesh topological islands mapping (দ্বীপসমূহের ভূপ্রাকৃতিক ম্যাপিং)",
        errorType: "concept misunderstanding",
        correctReasoning: "ভূপ্রকৃতি অনুসারে মহেশখালীর মধ্যভাগে উঁচু পাহাড় রয়েছে যা মৈনাক পাহাড়ের অংশ, ফলে এটি একমাত্র পাহাড়ি দ্বীপ হিসেবে সমাদৃত।",
        wrongReasoning: "A) সেন্টমার্টিন হলো একমাত্র প্রবাল দ্বীপ। C) সোনাদিয়া ম্যানগ্রোভ দ্বীপ। D) কুতুবদিয়া বাতিঘরের জন্য প্রাচীনকালে বিখ্যাত ছিল।",
        conceptBreakdown: "বাংলাদেশের দ্বীপ ভূগোলের তিনটি গোল্ডেন হ্যাক: প্রবাল দ্বীপ = সেন্টমার্টিন; পাহাড়ি দ্বীপ = মহেশখালী; বাতিঘর দ্বীপ = কুতুবদিয়া।",
        shortcutMethod: "Island Mnemonic: 'মৈনাক পাহাড়ের চূড়ায় মহেশ বসে আছে' -> মহেশখালী = পাহাড়ি দ্বীপ।"
      }
    ],
    "International Affairs": [
      {
        topic: "International Organizations",
        questionText: "প্রথম বিশ্বযুদ্ধের পর বিশ্বশান্তি প্রতিষ্ঠার লক্ষ্যে ‘লীগ অব নেশনস’ (League of Nations) কত সালে প্রতিষ্ঠিত হয়?",
        options: [
          'A) ১৯১৪ সালে',
          'B) ১৯১৯ সালে',
          'C) ১৯২০ সালে',
          'D) ১৯৪৫ সালে'
        ],
        correctAnswerIndex: 2,
        explanation: "ভার্সাই চুক্তির অধীনে ১০ জানুয়ারি ১৯২০ সালে আনুষ্ঠানিকভাবে 'লীগ অব নেশনস' আত্মপ্রকাশ করে। তবে এর ধারণার প্রস্তাব ১৯১৯ সালের প্যারিস শান্তি সম্মেলনে উত্থাপিত হয়েছিল।",
        skillNode: "League of Nations creation chronology (লীগ অব নেশনস এর কালপঞ্জি)",
        errorType: "factual memory slip",
        correctReasoning: "প্রথম বিশ্বযুদ্ধের আনুষ্ঠানিক পরিসমাপ্তি ও ভার্সাই চুক্তি কার্যকর হবার পর ১৯২০ সালের শুরুতে এই সংস্থা প্রতিষ্ঠিত হয়।",
        wrongReasoning: "A) ১৯১৪ হলো ১ম বিশ্বযুদ্ধ শুরুর বছর। B) ১৯১৯ প্যারিস শান্তি সম্মেলনের সন। D) ১৯৪৫ হলো জাতিসংঘ (UN) গঠনের বছর।",
        conceptBreakdown: "লীগ অব নেশনস ১৯২০ সালে গঠিত হয়ে ২য় বিশ্বযুদ্ধ রোধে ব্যর্থ হয়েছিল, তাই ১৯৪৫ সালে তার স্থলে জাতিসংঘ (UN) প্রতিষ্ঠা করা হয়।",
        shortcutMethod: "War Logic Link: ১ম বিশ্বযুদ্ধ শেষ (১৯১৮) -> ভার্সাই চুক্তি স্বাক্ষর (১৯১৯) -> লীগ অব নেশনস কার্যকর (১৯২০)।"
      },
      {
        topic: "Geopolitical Alliances",
        questionText: "কোন ঐতিহাসিক চুক্তির মাধ্যমে ইউরোপীয় ইউনিয়ন (EU) আনুষ্ঠানিকভাবে আত্মপ্রকাশ করে?",
        options: [
          'A) জেনেভা কনভেনশন',
          'B) মাস্ট্রিখট চুক্তি (Maastricht Treaty)',
          'C) রোম চুক্তি',
          'D) ভার্সাই চুক্তি'
        ],
        correctAnswerIndex: 1,
        explanation: "১৯৯২ সালে নেদারল্যান্ডসের মাস্ট্রিখট শহরে স্বাক্ষরিত মাস্ট্রিখট চুক্তির (Maastricht Treaty - যা ১৯৯৩ সালের ১ নভেম্বর কার্যকর হয়) মাধ্যমে modern ইউরোপীয় ইউনিয়ন আনুষ্ঠানিকভাবে আত্মপ্রকাশ করে।",
        skillNode: "European Integration historic treaties (ইউরোপীয় ইউনিয়নের চুক্তিপঞ্জি)",
        errorType: "factual memory slip",
        correctReasoning: "মাস্ট্রিখট চুক্তির ধারা অনুযায়ী তৎকালীন ইউরোপীয় অর্থনৈতিক সম্প্রদায় (EEC) রূপান্তরিত হয়ে ইউরোপীয় ইউনিয়ন গঠন সম্পন্ন করে এবং অভিন্ন মুদ্রা ইউরোর পথ সুগম করে।",
        wrongReasoning: "A) জেনেভা হলো যুদ্ধের সময় মানবিক আচরণ। C) রোম চুক্তি (১৯৫৭) EEC তৈরি করে যা EU এর পূর্বসূরী। D) ভার্সাই চুক্তি প্রথম বিশ্বযুদ্ধ শেষ করে।",
        conceptBreakdown: "মনে রাখার ৩টি সিঁড়ি: রোম চুক্তি (EEC সৃষ্টি) -> মাস্ট্রিখট চুক্তি (EU সৃষ্টি) -> লিসবন চুক্তি (প্রতিষ্ঠানিক সংস্কার)।",
        shortcutMethod: "Mnemonic Rule: 'মাস্টারদের ইউনিয়ন শক্তিশালী' -> মাস্ট্রিখট চুক্তি = ইউরোপীয় ইউনিয়ন স্থাপন।"
      }
    ],
    "General Science": [
      {
        topic: "Light & Scattering",
        questionText: "দিনের বেলা মেঘমুক্ত অবস্থায় সাধারণত মাথার ওপরের আকাশ আমাদের কাছে নীল দেখায় কেন?",
        options: [
          'A) নীল আলোর প্রতিসরণ বেশি বলে',
          'B) নীল আলোর তরঙ্গদৈর্ঘ্য বেশি বলে',
          'C) নীল আলোর বিক্ষেপণ বেশি বলে',
          'D) জলীয় বাষ্পের ঘনত্ব বেশি বলে'
        ],
        correctAnswerIndex: 2,
        explanation: "কম তরঙ্গদৈর্ঘ্যের আলো (যেমন নীল ও বেগুনি) বায়ুমণ্ডলের ধূলিকণা ও গ্যাস অনু দ্বারা বেশি বিক্ষিপ্ত (Scattered) হয়। আমাদের চোখ বেগুনির চেয়ে নীলের প্রতি বেশি সংবেদনশীল বিদায় আকাশ নীল দেখায়।",
        skillNode: "Atmospheric optical scattering mechanics (বায়ুমণ্ডলীয় আলোক বিক্ষেপণ)",
        errorType: "concept misunderstanding",
        correctReasoning: "রেলের বিক্ষেপণ নীতি (Rayleigh Scattering) অনুসারে আলোক বিক্ষেপণ তীব্রতা তরঙ্গের চতুর্ঘাতের ব্যস্তানুপাতিক। ফলে নীল আলোর বিক্ষেপণ তুলনামূলক লাল বা হলুদ আলোর চেয়ে বহুগুণ বেশি ঘটে।",
        wrongReasoning: "A) প্রতিসরণ নয়, বিক্ষেপণ হবে। B) নীল আলোর তরঙ্গদৈর্ঘ্য আসলে লাল লাল আলোর চেয়ে কম। D) জলীয় বাষ্প আকাশ ধূসর বা সাদা দেখায় কুয়াশায়।",
        conceptBreakdown: "আлок রশ্মির তরঙ্গদৈর্ঘ্য যত কম হবে, তার বিক্ষেপণ ক্ষমতা তত বেশি হবে। নীল আলোর তরঙ্গদৈর্ঘ্য লাল আলোর চাইতে অনেক কম বিধায় এর বিক্ষেপণ তীব্র।",
        shortcutMethod: "Science Hack: আকাশ নীল, সাগরের পানি নীল = সবই আলোর বিক্ষেপণ (Scattering) এর খেলা!"
      }
    ],
    "Mental Ability": [
      {
        topic: "Coding-Decoding Speed",
        questionText: "একটি সংকেত পদ্ধতিতে যদি 'FATHER' কে 'HCVJGT' লেখা হয়, তবে একই সংকেতে 'MOTHER' কে কী লেখা হবে?",
        options: [
          'A) OQVJGT',
          'B) OQWJGT',
          'C) NPVHFS',
          'D) NQWJGT'
        ],
        correctAnswerIndex: 0,
        explanation: "এখানে প্রতিটি বর্ণ ২ ঘর করে সামনে স্থানান্তরিত হয়েছে: F(+২)=H, A(+২)=C, T(+২)=V... তদ্রূপ M(+২)=O, O(+২)=Q, T(+২)=V, H(+২)=J, E(+২)=G, R(+২)=T। অতএব সঠিক উত্তর OQVJGT।",
        skillNode: "Alphabetic cipher transformation matrix (সাংকেতিক রূপান্তর দক্ষতা)",
        errorType: "carelessness",
        correctReasoning: "M-N-O (+২), O-P-Q (+২), T-U-V (+২)... বর্ণমালার প্লাস-টু শিফটিং প্যাটার্ন প্রতিটি অক্ষরের ক্ষেত্রে নিখুঁতভাবে মিলে যায়।",
        wrongReasoning: "B) OQWJGT-এ W বর্ণটি ভুলভাবে যুক্ত (T+২=V হয়, W নয়)। C এবং D তে শিফটিং সংখ্যা সঠিক নয়।",
        conceptBreakdown: "মেন্টাল অ্যাবিলিটিতে এই ধরনের আলফাবেটিক প্রবলেমে হাতের আঙুলে বা রাফ খাতার কোণায় দ্রুত এ-বি-সি-ডি লিখে ২ ঘর গ্যাপ হিসাব করে নেওয়া উচিত।",
        shortcutMethod: "Speed Trick: প্রথম ৩টি অক্ষরের শিফট দেখুন: M -> O, O -> Q, T -> V। প্রারম্ভিক OQV যুক্ত শুধুমাত্র অপশন A তে রয়েছে। বাকিগুলো চেক করারও প্রয়োজন নেই!"
      }
    ]
  };

  if (selectedSubject === "Mathematics") {
    const coin = Math.random() > 0.5;
    if (coin) {
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 5) + 3;
      const c = Math.floor(Math.random() * 5) + 4;
      const factor = Math.floor(Math.random() * 8) + 5;
      
      const firstNum = a * factor;
      const secondNum = b * factor;
      const thirdNum = c * factor;
      const lSum = (a + b + c) * factor;
      const trapNum = firstNum + thirdNum;

      return {
        id: `ai_gen_fallback_${Math.random().toString(36).substr(2, 9)}`,
        subject: selectedSubject,
        topic: "Ratios & Proportions (অনুপাত ও সমানুপাত)",
        difficulty: difficulty || "Standard",
        examType: [examType || "BCS"],
        questionText: `তিনটি সংখ্যার যোগফল ${lSum}। প্রথম, দ্বিতীয় ও তৃতীয় সংখ্যার অনুপাত যথাক্রমে ${a}:${b}:${c} হলে, দ্বিতীয় সংখ্যাটি কত?`,
        options: [
          `A) ${firstNum}`,
          `B) ${secondNum}`,
          `C) ${thirdNum}`,
          `D) ${trapNum}`
        ],
        correctAnswerIndex: 1,
        explanation: `অনুপাতের যোগফল = ${a} + ${b} + ${c} = ${a + b + c}। দ্বিতীয় সংখ্যা = ${lSum} * (${b} / ${a + b + c}) = ${secondNum}।`,
        skillNode: "Analytical ratio apportionment (অনুপাত ভিত্তিক বণ্টন দক্ষতা)",
        errorType: "calculation slip",
        correctReasoning: `অনুপাত পদগুলোর সমষ্টি ${a + b + c}। সংখ্যানুযায়ী মোট যোগফল ${lSum} কে এই অনুপাতে ভাগ করলে দ্বিতীয়টি ${secondNum} হয়।`,
        wrongReasoning: `A) ${firstNum} হলো প্রথম সংখ্যাটির ভুল হিসাব। C) ${thirdNum} হলো তৃতীয় সংখ্যাটির মান। D) ${trapNum} হলো অপূর্ণাঙ্গ অনুপাতের বিভ্রান্তিকর মান।`,
        conceptBreakdown: `ধারাবাহিক বা সংযুক্ত অনুপাত নির্ণয়ে উভয় অনুপাতের সাধারণ রাশির মান সমান করতে হয়। যেমন এখানে ২য় রাশির মান ৩ এবং ৪ এর লসাগু ১২ করা হয়েছে।`,
        shortcutMethod: `Shortcut Strategy: দ্বিতীয় রাশির অনুপাত পদদ্বয় গুণ করুন (৩ x ৪ = ১২)। অপশনগুলোর মধ্যে যা ১২ দ্বারা বিভাজ্য তা দ্রুত খুঁজুন। এখানে শুধুমাত্র ${secondNum} হলো ১২ দ্বারা বিভাজ্য।`
      };
    } else {
      // Procedural Area & Mensuration Question
      const widths = [6, 8, 10, 12, 14, 16, 18, 20];
      const W = widths[Math.floor(Math.random() * widths.length)];
      const L = 2 * W;
      const area = L * W; // 2 * W^2
      const perimeter = 2 * (L + W); // 6 * W

      const optA = 3 * W;
      const optB = perimeter; // 6 * W
      const optC = 5 * W + 4;
      const optD = 4 * W;

      return {
        id: `ai_gen_fallback_${Math.random().toString(36).substr(2, 9)}`,
        subject: selectedSubject,
        topic: "Area & Mensuration (পরিমিতি ও ক্ষেত্রফল)",
        difficulty: difficulty || "Standard",
        examType: [examType || "BCS"],
        questionText: `একটি আয়তাকার বাগানের দৈর্ঘ্য প্রস্থের দ্বিগুণ। এর ক্ষেত্রফল ${area} বর্গমিটার হলে, পরিসীমা কত মিটার?`,
        options: [
          `A) ${optA} মিটার`,
          `B) ${optB} মিটার`,
          `C) ${optC} মিটার`,
          `D) ${optD} মিটার`
        ],
        correctAnswerIndex: 1,
        explanation: `ধরি প্রস্থ x মিটার, দৈর্ঘ্য ২x মিটার। ক্ষেত্রফল = ২x * x = ২x^২ = ${area} => x^২ = ${W*W} => x = ${W} মিটার। দৈর্ঘ্য = ${L} মিটার। পরিসীমা = ২ * (${L} + ${W}) = ${perimeter} মিটার।`,
        skillNode: "Mensuration parameter calculations (জ্যামিতিক ক্ষেত্রফল ও পরিসীমা নির্ণয়)",
        errorType: "calculation slip",
        correctReasoning: `ক্ষেত্রফলের সূত্র প্রয়োগ করে x-এর মান বের করা হয়েছে। এবং পরিসীমা সূত্র ২(দৈর্ঘ্য+প্রস্থ) ব্যবহার করে সঠিক উত্তর ${perimeter} পাওয়া গেছে।`,
        wrongReasoning: `A) ${optA} মিটার হলো দৈর্ঘ্য ও প্রস্থের যোগফল মাত্র। D) ${optD} মিটার হলো ভুলভাবে দৈর্ঘ্য গুণ প্রস্থ অনুমিত হিসাব।`,
        conceptBreakdown: `ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ। পরিসীমা = ২ × (দৈর্ঘ্য + প্রস্থ)। ভুল এড়াতে সবসময় প্রশ্নে 'পরিসীমা' চেয়েছে নাকি 'দৈর্ঘ্য' চেয়েছে তা ভালো করে লক্ষ্য করুন।`,
        shortcutMethod: `Shortcut Key: বাগানটির দৈর্ঘ্য ${L} ও প্রস্থ ${W}। মুখে মুখে যোগ করে দ্বিগুণ করুন। ${L} + ${W} = ${L+W}, ${L+W} x ২ = ${perimeter}।`
      };
    }
  }

  // General selection for regular subjects
  const pool = mockPool[selectedSubject] || mockPool["Mathematics"];
  const randomIdx = Math.floor(Math.random() * pool.length);
  const matchedMock = pool[randomIdx];

  return {
    id: `ai_gen_fallback_${Math.random().toString(36).substr(2, 9)}`,
    subject: selectedSubject,
    topic: matchedMock.topic,
    difficulty: difficulty || "Standard",
    examType: [examType || "BCS"],
    questionText: matchedMock.questionText,
    options: matchedMock.options,
    correctAnswerIndex: matchedMock.correctAnswerIndex,
    explanation: matchedMock.explanation,
    skillNode: matchedMock.skillNode,
    errorType: matchedMock.errorType,
    correctReasoning: matchedMock.correctReasoning,
    wrongReasoning: matchedMock.wrongReasoning,
    conceptBreakdown: matchedMock.conceptBreakdown,
    shortcutMethod: matchedMock.shortcutMethod
  };
}

/**
 * API: Generate multiple authentic quiz questions dynamically in a batch
 */
app.post('/api/generate-ai-batch', async (req, res) => {
  const { subjects, difficulty, examType, otherSubjectsLanguage = 'Bangla', count = 12 } = req.body;
  const targetSubjects = Array.isArray(subjects) && subjects.length > 0 ? subjects : ['Mathematics', 'English', 'Bangla', 'ICT'];

  // Fallback immediately if API key is not configured
  if (!apiKey) {
    console.log("[server] Key missing. Serving procedural static fallback batch.");
    const fallbackBatch = [];
    for (let i = 0; i < count; i++) {
      const sub = targetSubjects[i % targetSubjects.length];
      fallbackBatch.push(getFallbackQuestion(sub, difficulty, examType));
    }
    return res.json({ questions: fallbackBatch, isFallback: true });
  }

  try {
    const client = getAiClient();
    const prompt = `
      You are writing a batch of ${count} distinct and authentic test questions for Bangladesh recruitment systems (BCS Cadre, Bangladesh Bank AD, and Gov Bank Officer exams).
      
      Syllabus subjects requested (distribute the questions across these subjects proportionally):
      ${JSON.stringify(targetSubjects)}

      Difficulty level requested: ${difficulty}
      Exam blueprint context: ${examType}

      Strict standards for EACH question in the array:
      1. Must have exactly 4 MCQ options labeled starting with 'A) ', 'B) ', 'C) ', 'D) '.
      2. No ambiguity, exactly 1 mathematically or historically correct option.
      3. Language constraints (CRITICAL):
         - ANY question with subject "Bangla" MUST be written in Bangla (Bengali language).
         - ANY question with subject "English" MUST be written in English.
         - For all subsequent requested subjects: ${JSON.stringify(targetSubjects.filter(s => s !== 'Bangla' && s !== 'English'))}, you MUST write their questionText, options list, explanation text, topic name, correctReasoning and wrongReasoning in "${otherSubjectsLanguage}" language (if "Bangla", write them in Bengali; if "English", write them in English).
      4. Focus content style based on Exam Context:
         - If BCS: focus on high-yield analytical, tricky conceptual wording, BPSC syllabus core facts.
         - If Bank: focus on speed arithmetic, patterns, numerical logical thinking, correct grammar.
         - If Govt: focus on Ministry-level recruitment facts.
      5. Fully populates cognitive mapping metrics (hidden skill nodes, expected student missteps reasonings).
    `;

    const response = await generateContentWithRetry(client, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are the Chairman of BPSC questioning panel and Bank AD recruitment authority. You write immaculate and extremely professional questions with clear, detailed, exam-focused educational review keys in both Bangla and English. Output ONLY a valid JSON object containing a 'questions' array. Do not enclose in markdown blocks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "Array of exactly requested number of high-quality recruitment questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING, description: "Must be one of the requested subjects." },
                  topic: { type: Type.STRING, description: "Syllabus chapter or subtopic name in Bengali or English" },
                  difficulty: { type: Type.STRING, description: "Exactly the difficulty level requested (Easy, Moderate, Standard, Hard)" },
                  questionText: { type: Type.STRING, description: "The quiz question. Can utilize Bengali or English." },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of exactly 4 choices, prefaced by 'A) ', 'B) ', 'C) ', 'D) '"
                  },
                  correctAnswerIndex: { type: Type.INTEGER, description: "Integer index (0 to 3) representing the correct choice." },
                  explanation: { type: Type.STRING, description: "Highly clear and direct combined Bengali-English explanation explaining the answer." },
                  skillNode: { type: Type.STRING, description: "Exact hidden skill node (e.g. 'ratio-based multi-step proportional reasoning under timed conditions' or 'Charyapada era literature chronology')." },
                  errorType: { type: Type.STRING, description: "Typical learner slip category e.g. 'calculation slip', 'concept misunderstanding', 'factual memory slip', 'carelessness'." },
                  correctReasoning: { type: Type.STRING, description: "In-depth explanation showing why the correct option is uniquely true." },
                  wrongReasoning: { type: Type.STRING, description: "A detailed breakdown explaining why each of the other three distractors is strategically wrong." },
                  conceptBreakdown: { type: Type.STRING, description: "An exam-focused, clear conceptual breakdown." },
                  shortcutMethod: { type: Type.STRING, description: "If math/analytical: a shortcut formula or memory key. If other subject: draft a smart memory mnemonic rule." }
                },
                required: [
                  "subject", "topic", "difficulty", "questionText", "options", "correctAnswerIndex", "explanation",
                  "skillNode", "errorType", "correctReasoning", "wrongReasoning", "conceptBreakdown", "shortcutMethod"
                ]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"questions":[]}');
    const questionsList = Array.isArray(parsed.questions) ? parsed.questions : [];
    
    // Assign random unique IDs
    const finalizedQuestions = questionsList.map((q: any) => {
      q.id = `ai_gen_${Math.random().toString(36).substr(2, 9)}`;
      q.examType = [examType || 'BCS'];
      return q;
    });

    return res.json({ questions: finalizedQuestions });
  } catch (error: any) {
    console.error("[api/generate-ai-batch Error] Fallback triggered:", error.message || error);
    // Graceful recovery: Serve an elite procedurally generated or selected offline fallback batch of questions
    const fallbackBatch = [];
    for (let i = 0; i < count; i++) {
      const sub = targetSubjects[i % targetSubjects.length];
      fallbackBatch.push(getFallbackQuestion(sub, difficulty, examType));
    }
    return res.json({ questions: fallbackBatch, isFallback: true });
  }
});

/**
 * API: Generate an authentic quiz question dynamically
 */
app.post('/api/generate-ai-question', async (req, res) => {
  const { subject, difficulty, examType } = req.body;

  // Fallback immediately if API key is not configured
  if (!apiKey) {
    console.log("[server] Key missing. Serving procedural static fallback question.");
    const fallbackQ = getFallbackQuestion(subject, difficulty, examType);
    return res.json(fallbackQ);
  }

  try {
    const client = getAiClient();
    const prompt = `
      You are writing a single test question for Bangladesh recruitment systems.
      Subject requested: ${subject}
      Difficulty requested: ${difficulty}
      Exam blueprint context: ${examType}

      Strict standards:
      1. Must have exactly 4 MCQ options labeled 'A) ', 'B) ', 'C) ', 'D) '.
      2. No ambiguity, exactly 1 mathematically or historically correct option.
      3. Focus content style based on Exam Context:
         - If BCS: focus on high-yield analytical, tricky conceptual wording, BPSC syllabus core facts.
         - If Bank: focus on speed arithmetic, patterns, numerical logical thinking, correct grammar.
         - If Govt: focus on Ministry-level recruitment facts.
      4. Fully populates cognitive mapping metrics (hidden skill nodes, expected student missteps reasonings).
    `;

    const response = await generateContentWithRetry(client, {
      contents: prompt,
      config: {
        systemInstruction: "You are the Chairman of BPSC questioning panel and Bank AD recruitment authority. You write immaculate and extremely professional questions with clear, detailed, exam-focused educational review keys in both Bangla and English. Output ONLY a valid JSON object matching the requested schema. Do not enclose in markdown blocks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "Must be exactly the subject requested" },
            topic: { type: Type.STRING, description: "Syllabus chapter or subtopic name in Bengali or English" },
            difficulty: { type: Type.STRING, description: "Exactly the difficulty level requested" },
            questionText: { type: Type.STRING, description: "The quiz question. Can utilize Bengali (preferred for Bangla, GK, Affairs) or English (preferred for English, math, ICT)." },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 4 choices, prefaced by 'A) ', 'B) ', 'C) ', 'D) '"
            },
            correctAnswerIndex: { type: Type.INTEGER, description: "Integer index (0 to 3) representing the correct choice." },
            explanation: { type: Type.STRING, description: "Highly clear and direct combined Bengali-English explanation explaining the answer." },
            skillNode: { type: Type.STRING, description: "Exact hidden skill node (e.g. 'ratio-based multi-step proportional reasoning under timed conditions' or 'Charyapada era literature chronology')." },
            errorType: { type: Type.STRING, description: "Typical learner slip category e.g. 'calculation slip', 'concept misunderstanding', 'factual memory slip', 'carelessness'." },
            correctReasoning: { type: Type.STRING, description: "In-depth explanation showing why the correct option is uniquely true." },
            wrongReasoning: { type: Type.STRING, description: "A detailed breakdown explaining why each of the other three distractors is strategically wrong." },
            conceptBreakdown: { type: Type.STRING, description: "An exam-focused, clear conceptual breakdown to help candidate memorize the core law or fact." },
            shortcutMethod: { type: Type.STRING, description: "If math/analytical: a shortcut formula or mnemonic rule (e.g. Memory Hook) to solve this within 8 seconds under pressure. If other subject: draft a smart memory mnemonic rule." }
          },
          required: [
            "subject", "topic", "difficulty", "questionText", "options", "correctAnswerIndex", "explanation",
            "skillNode", "errorType", "correctReasoning", "wrongReasoning", "conceptBreakdown", "shortcutMethod"
          ]
        }
      }
    });

    const questionObj = JSON.parse(response.text || '{}');
    questionObj.id = `ai_gen_${Math.random().toString(36).substr(2, 9)}`;
    questionObj.examType = [examType || 'BCS'];
    return res.json(questionObj);
  } catch (error: any) {
    console.error("[api/generate-ai-question Error] Recovery strategy activated. Error details:", error.message || error);
    // Graceful recovery: Serve an elite procedurally generated or selected offline fallback question so the user game never breaks!
    const fallbackQ = getFallbackQuestion(subject, difficulty, examType);
    return res.json(fallbackQ);
  }
});

// Serve frontend build files and assets
const PORT = 3000;

async function bootstrapServer() {
  if (process.env.NODE_ENV === 'production') {
    // Production: Serve the built static files directly
    app.use(express.static(path.join(useDirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(useDirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: integration with Vite server middlewares on same Port 3000
    console.log("Starting server in Development Mode with Vite Middleware...");
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Exam Survival Full-Stack Server running securely on http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer().catch(err => {
  console.error("Critical server bootstrap error:", err);
});
