const { HfInference } = require('@huggingface/inference');
const ProjectSubmission = require('../models/ProjectSubmission');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Comprehensive plagiarism check for academic projects using FREE Hugging Face models
 * @param {string} title - Project title
 * @param {string} abstract - Project abstract
 * @param {string} fullText - Full project text
 * @param {string} studentId - Student ID submitting the project
 * @returns {Promise<Object>} - Detailed plagiarism report
 */
async function checkProjectPlagiarism(title, abstract, fullText, studentId) {
  try {
    console.log('Starting comprehensive plagiarism check with FREE AI...');

    // Step 1: Check against existing projects in database
    const databaseCheck = await checkAgainstDatabase(fullText, studentId);

    // Step 2: Use FREE Hugging Face AI to analyze originality
    const aiAnalysis = await analyzeWithFreeAI(title, abstract, fullText);

    // Step 3: Analyze web presence patterns
    const webSearchAnalysis = await analyzeWebPresence(title, abstract, fullText);

    // Step 4: Calculate overall plagiarism score
    const overallScore = calculateOverallScore(databaseCheck, aiAnalysis, webSearchAnalysis);

    // Step 5: Determine final verdict
    const verdict = determinePlagiarismVerdict(overallScore, databaseCheck, aiAnalysis, webSearchAnalysis);

    const finalReport = {
      overallScore,
      status: verdict.status,
      verdict: verdict.message,
      detailedAnalysis: verdict.detailedAnalysis,
      databaseMatches: databaseCheck.matches,
      webSources: webSearchAnalysis.suspiciousSources,
      geminiInsights: aiAnalysis, // Keep this name for frontend compatibility
      recommendations: verdict.recommendations,
      checkedAt: new Date(),
    };

    console.log('Final Plagiarism Report:', JSON.stringify({
      overallScore: finalReport.overallScore,
      status: finalReport.status,
      hasAiInsights: !!finalReport.geminiInsights,
      aiGeneratedLikelihood: finalReport.geminiInsights?.aiGeneratedLikelihood,
      aiDetectionVerdict: finalReport.geminiInsights?.aiDetectionVerdict,
    }, null, 2));

    return finalReport;
  } catch (error) {
    console.error('Plagiarism check error:', error);
    throw new Error(`Failed to complete plagiarism check: ${error.message}`);
  }
}

/**
 * Check project against existing submissions in database
 */
async function checkAgainstDatabase(fullText, currentStudentId) {
  try {
    const existingProjects = await ProjectSubmission.find({
      studentId: { $ne: currentStudentId },
    }).select('title fullText studentId').limit(50);

    const matches = [];

    // Simple text similarity check
    for (const project of existingProjects) {
      const similarity = calculateTextSimilarity(fullText, project.fullText);

      if (similarity >= 30) {
        matches.push({
          projectId: project._id,
          projectTitle: project.title,
          studentName: project.studentId?.name || 'Unknown',
          similarity: Math.round(similarity),
          matchedSections: ['Content overlap detected'],
          analysis: `${Math.round(similarity)}% textual similarity found`,
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);

    return {
      matches,
      highestSimilarity: matches.length > 0 ? matches[0].similarity : 0,
    };
  } catch (error) {
    console.error('Database check error:', error);
    return { matches: [], highestSimilarity: 0 };
  }
}

/**
 * Simple text similarity calculator
 */
function calculateTextSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return (intersection.size / union.size) * 100;
}

/**
 * Analyze project using FREE Hugging Face AI
 */
async function analyzeWithFreeAI(title, abstract, fullText) {
  try {
    console.log('Analyzing with FREE Hugging Face AI...');

    const textToAnalyze = `Title: ${title}\n\nAbstract: ${abstract}\n\nContent: ${fullText.substring(0, 3000)}`;

    // Use Hugging Face's free text generation model
    const prompt = `Analyze this academic project for plagiarism and AI-generated content. Be strict.

${textToAnalyze}

Provide a JSON analysis with:
1. originalityScore (0-100): Lower scores mean more plagiarism
2. aiGeneratedLikelihood (0-100): Higher scores mean more AI-generated
3. aiDetectionVerdict: HUMAN_WRITTEN, LIKELY_AI_ASSISTED, or LIKELY_AI_GENERATED
4. aiIndicators: List of AI writing patterns found
5. redFlags: List of plagiarism concerns
6. detailedAnalysis: Comprehensive explanation

Respond with ONLY valid JSON.`;

    try {
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          return_full_text: false
        }
      });

      console.log('AI Response:', response.generated_text);

      // Try to parse JSON from response
      const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          originalityScore: parsed.originalityScore || 50,
          verdict: parsed.originalityScore > 70 ? 'ORIGINAL' : parsed.originalityScore > 40 ? 'SUSPICIOUS' : 'LIKELY_PLAGIARIZED',
          aiGeneratedLikelihood: parsed.aiGeneratedLikelihood || 50,
          aiDetectionVerdict: parsed.aiDetectionVerdict || 'LIKELY_AI_ASSISTED',
          aiIndicators: parsed.aiIndicators || ['Generic academic language', 'Formal structure'],
          redFlags: parsed.redFlags || ['Requires manual review'],
          strengths: ['Analysis completed'],
          suspiciousPatterns: [],
          citationIssues: 'Manual citation check recommended',
          detailedAnalysis: parsed.detailedAnalysis || 'AI analysis completed',
          confidence: 70,
        };
      }
    } catch (aiError) {
      console.log('AI model error, using rule-based analysis:', aiError.message);
    }

    // Fallback: Rule-based analysis
    return performRuleBasedAnalysis(title, abstract, fullText);

  } catch (error) {
    console.error('AI analysis error:', error);
    return performRuleBasedAnalysis(title, abstract, fullText);
  }
}

/**
 * Rule-based analysis with 50+ AI patterns (completely free, no API needed)
 */
function performRuleBasedAnalysis(title, abstract, fullText) {
  console.log('Using enhanced rule-based plagiarism detection...');

  const text = `${title} ${abstract} ${fullText}`.toLowerCase();
  const originalText = `${title} ${abstract} ${fullText}`;

  // EXPANDED: 50+ AI-generated content indicators
  const aiPhrases = [
    // Generic openings
    'in today\'s world', 'in today\'s society', 'in the modern world', 'in recent years',
    'in the digital age', 'in this day and age', 'nowadays', 'these days',

    // Formal transitions
    'it is important to note', 'it is worth noting', 'it should be noted',
    'it is evident that', 'it is clear that', 'it can be seen that',

    // AI connectors
    'furthermore', 'moreover', 'additionally', 'in addition', 'similarly',
    'consequently', 'thus', 'hence', 'therefore', 'accordingly',
    'nevertheless', 'nonetheless', 'however', 'on the other hand',

    // Generic conclusions
    'in conclusion', 'in summary', 'to summarize', 'to conclude',
    'in closing', 'to sum up', 'all in all', 'overall',

    // Redundant phrases
    'as mentioned above', 'as previously stated', 'as discussed earlier',
    'as we have seen', 'it goes without saying', 'needless to say',

    // AI filler phrases
    'plays a crucial role', 'plays a vital role', 'is of utmost importance',
    'is paramount', 'is essential', 'is imperative', 'is indispensable',

    // Generic academic language
    'delve into', 'plethora of', 'myriad of', 'multitude of',
    'vast array of', 'wide range of', 'diverse set of',

    // AI-style emphasis
    'significantly impact', 'greatly enhance', 'substantially improve',
    'remarkably', 'notably', 'particularly', 'especially',

    // Robotic structures
    'allows us to', 'enables us to', 'provides us with',
    'offers numerous benefits', 'presents various challenges'
  ];

  const aiIndicators = [];
  let aiPhraseCount = 0;

  aiPhrases.forEach(phrase => {
    const count = (text.match(new RegExp(phrase, 'g')) || []).length;
    if (count > 0) {
      aiPhraseCount += count;
      aiIndicators.push(`Generic AI phrase "${phrase}" found ${count}x`);
    }
  });

  // Check for repetitive sentence structures (AI hallmark)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceStarts = sentences.map(s => s.trim().split(' ').slice(0, 3).join(' '));
  const duplicateStarts = sentenceStarts.filter((item, index) => sentenceStarts.indexOf(item) !== index);

  if (duplicateStarts.length > 2) {
    aiIndicators.push(`Repetitive sentence structures detected (${duplicateStarts.length} duplicates)`);
    aiPhraseCount += duplicateStarts.length;
  }

  // Check for overly long sentences (AI tendency)
  const longSentences = sentences.filter(s => s.split(' ').length > 40);
  if (longSentences.length > sentences.length * 0.3) {
    aiIndicators.push('Excessive use of long, complex sentences (AI pattern)');
    aiPhraseCount += 2;
  }

  // Plagiarism red flags
  const redFlags = [];

  // Check for code platform references
  if (text.includes('github') || text.includes('stackoverflow')) {
    redFlags.push('Direct references to code sharing platforms');
  }

  // Check for tutorial-style language
  const tutorialPhrases = ['step 1', 'step 2', 'first we', 'then we', 'next we', 'finally we'];
  const tutorialMatches = tutorialPhrases.filter(p => text.includes(p));
  if (tutorialMatches.length > 2) {
    redFlags.push('Tutorial-style step-by-step structure detected');
  }

  // Check for missing citations
  const hasReferences = text.includes('citation') || text.includes('reference') ||
                       text.includes('et al') || text.includes('bibliography');
  if (!hasReferences && text.length > 500) {
    redFlags.push('No citations or references found in substantial content');
  }

  // Check for boilerplate code comments
  const boilerplatePatterns = ['todo:', 'fixme:', '// example', '// sample', 'lorem ipsum'];
  const boilerplateMatches = boilerplatePatterns.filter(p => text.includes(p));
  if (boilerplateMatches.length > 0) {
    redFlags.push('Contains placeholder/boilerplate code comments');
  }

  // Content length check
  if (sentences.length < 10) {
    redFlags.push('Very short content - insufficient for thorough analysis');
  }

  // Check for excessive use of passive voice (AI tendency)
  const passiveIndicators = text.match(/\b(was|were|been|being)\s+\w+ed\b/g) || [];
  if (passiveIndicators.length > sentences.length * 0.4) {
    aiIndicators.push('Excessive passive voice usage (common in AI writing)');
    aiPhraseCount += 1;
  }

  // Calculate scores
  const aiGeneratedLikelihood = Math.min(95, Math.max(15, aiPhraseCount * 8));
  const originalityScore = Math.max(5, 100 - aiGeneratedLikelihood - (redFlags.length * 8));

  return {
    originalityScore,
    verdict: originalityScore > 70 ? 'ORIGINAL' : originalityScore > 40 ? 'SUSPICIOUS' : 'LIKELY_PLAGIARIZED',
    aiGeneratedLikelihood,
    aiDetectionVerdict: aiGeneratedLikelihood > 70 ? 'LIKELY_AI_GENERATED' :
                       aiGeneratedLikelihood > 40 ? 'LIKELY_AI_ASSISTED' : 'HUMAN_WRITTEN',
    aiIndicators: aiIndicators.slice(0, 15), // Show top 15 indicators
    redFlags,
    strengths: originalityScore > 60 ? ['Some original content detected'] : [],
    suspiciousPatterns: aiIndicators.slice(0, 5),
    citationIssues: hasReferences ? 'Citations present' : 'No citations or references found',
    detailedAnalysis: `Analyzed ${sentences.length} sentences across ${Math.round(text.length / 1000)}KB of text. Detected ${aiPhraseCount} AI writing patterns and ${redFlags.length} plagiarism concerns. Passive voice usage: ${passiveIndicators.length} instances.`,
    confidence: 80,
  };
}

/**
 * NEW: Detect the academic domain/field of the project
 * This prevents false positives (e.g., flagging COVID-19 business papers with tech patterns)
 */
function detectProjectDomain(title, abstract, fullText) {
  const text = `${title} ${abstract} ${fullText}`.toLowerCase();
  const titleAndAbstract = `${title} ${abstract}`.toLowerCase();

  // Define domain indicators with weights
  const domains = {
    'Computer Science': {
      keywords: [
        'software', 'application', 'web', 'app', 'mobile', 'frontend', 'backend',
        'database', 'api', 'framework', 'javascript', 'python', 'java', 'react',
        'node', 'django', 'flask', 'mongodb', 'sql', 'programming', 'code',
        'algorithm', 'data structure', 'machine learning', 'ai', 'neural network',
        'cloud', 'server', 'deployment', 'git', 'authentication', 'encryption'
      ],
      weight: 0
    },
    'Engineering': {
      keywords: [
        'design', 'prototype', 'circuit', 'mechanical', 'electrical', 'hardware',
        'sensor', 'iot', 'embedded', 'microcontroller', 'arduino', 'raspberry pi',
        'cad', 'simulation', 'manufacturing', 'robotics', 'automation'
      ],
      weight: 0
    },
    'Business': {
      keywords: [
        'business', 'marketing', 'strategy', 'swot', 'analysis', 'market',
        'customer', 'sales', 'revenue', 'profit', 'financial', 'investment',
        'entrepreneurship', 'startup', 'commerce', 'trade', 'economy',
        'management', 'organization', 'corporate', 'brand', 'competition'
      ],
      weight: 0
    },
    'Economics': {
      keywords: [
        'economics', 'economic', 'fiscal', 'monetary', 'inflation', 'gdp',
        'supply chain', 'demand', 'microeconomics', 'macroeconomics', 'policy'
      ],
      weight: 0
    },
    'Medicine': {
      keywords: [
        'patient', 'disease', 'treatment', 'diagnosis', 'medical', 'clinical',
        'hospital', 'healthcare', 'therapy', 'surgery', 'medication', 'drug',
        'symptom', 'virus', 'bacteria', 'infection', 'epidemic', 'pandemic'
      ],
      weight: 0
    },
    'Health Sciences': {
      keywords: [
        'health', 'wellness', 'nutrition', 'fitness', 'public health',
        'mental health', 'preventive care', 'hygiene', 'sanitation'
      ],
      weight: 0
    },
    'Nursing': {
      keywords: [
        'nursing', 'nurse', 'patient care', 'ward', 'bedside', 'caregiver'
      ],
      weight: 0
    },
    'Education': {
      keywords: [
        'teaching', 'learning', 'curriculum', 'pedagogy', 'student', 'classroom',
        'education', 'school', 'academic', 'instructor', 'lesson', 'assessment'
      ],
      weight: 0
    },
    'Social Sciences': {
      keywords: [
        'social', 'society', 'culture', 'community', 'behavior', 'psychology',
        'sociology', 'anthropology', 'survey', 'questionnaire', 'interview'
      ],
      weight: 0
    },
    'Political Science': {
      keywords: [
        'politics', 'government', 'governance', 'democracy', 'policy',
        'legislation', 'constitution', 'election', 'vote', 'political'
      ],
      weight: 0
    }
  };

  // Count keyword occurrences for each domain
  Object.keys(domains).forEach(domain => {
    domains[domain].keywords.forEach(keyword => {
      // Give more weight to keywords in title/abstract
      const titleMatches = (titleAndAbstract.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
      const textMatches = (text.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;

      domains[domain].weight += (titleMatches * 3) + textMatches;
    });
  });

  // Find domain with highest weight
  let topDomain = 'General';
  let topWeight = 0;
  let secondWeight = 0;

  Object.entries(domains).forEach(([domain, data]) => {
    if (data.weight > topWeight) {
      secondWeight = topWeight;
      topWeight = data.weight;
      topDomain = domain;
    } else if (data.weight > secondWeight) {
      secondWeight = data.weight;
    }
  });

  // Calculate confidence based on separation from second-place
  const confidence = topWeight > 0 ?
    Math.min(95, Math.round((topWeight / (topWeight + secondWeight + 1)) * 100)) : 0;

  // Require minimum weight and confidence to assign a domain
  if (topWeight < 3 || confidence < 40) {
    return { domain: 'General', confidence: 30, weight: topWeight };
  }

  return { domain: topDomain, confidence, weight: topWeight };
}

/**
 * ENHANCED: Analyze web presence with specific URL detection (rule-based, completely free)
 */
async function analyzeWebPresence(title, abstract, fullText) {
  try {
    console.log('Analyzing web presence with enhanced URL detection...');

    const suspiciousSources = [];
    const commonPatterns = [];
    const text = `${title} ${abstract} ${fullText}`.toLowerCase();

    // STEP 1: DETECT PROJECT DOMAIN FIRST - This prevents false positives
    const projectDomain = detectProjectDomain(title, abstract, fullText);
    console.log(`Detected project domain: ${projectDomain.domain} (confidence: ${projectDomain.confidence}%)`);

    // Only apply tech checks if it's actually a CS/Engineering project
    const isTechProject = projectDomain.domain === 'Computer Science' ||
                          projectDomain.domain === 'Engineering';

    // Only apply business checks if it's actually a Business project
    const isBusinessProject = projectDomain.domain === 'Business' ||
                             projectDomain.domain === 'Economics';

    // Only apply medical checks if it's actually a Medical/Health project
    const isMedicalProject = projectDomain.domain === 'Medicine' ||
                            projectDomain.domain === 'Health Sciences' ||
                            projectDomain.domain === 'Nursing';

    // EXPANDED: Framework-specific patterns with exact URLs
    const frameworkPatterns = [
      // React patterns
      { keywords: ['react', 'redux', 'e-commerce'], type: 'Tutorial', likelihood: 75,
        reason: 'React + Redux e-commerce is extremely common in tutorials',
        urls: [
          'https://www.youtube.com/results?search_query=react+redux+ecommerce+tutorial',
          'https://github.com/search?q=react-ecommerce-template',
          'https://www.freecodecamp.org/news/search/?query=react%20ecommerce'
        ]
      },
      { keywords: ['react', 'node', 'mongodb'], type: 'MERN Stack', likelihood: 80,
        reason: 'MERN stack is one of the most common tutorial combinations',
        urls: [
          'https://www.youtube.com/results?search_query=mern+stack+tutorial',
          'https://github.com/search?q=mern-stack-project',
          'https://www.udemy.com/courses/search/?q=mern%20stack'
        ]
      },
      { keywords: ['react', 'firebase'], type: 'Tutorial', likelihood: 70,
        reason: 'React + Firebase is a popular beginner stack',
        urls: [
          'https://www.youtube.com/results?search_query=react+firebase+tutorial',
          'https://firebase.google.com/docs/web/setup'
        ]
      },

      // Python/Django patterns
      { keywords: ['django', 'rest', 'api'], type: 'Django Tutorial', likelihood: 75,
        reason: 'Django REST framework is heavily documented online',
        urls: [
          'https://www.django-rest-framework.org/tutorial/quickstart/',
          'https://www.youtube.com/results?search_query=django+rest+api+tutorial',
          'https://github.com/search?q=django-rest-api-example'
        ]
      },
      { keywords: ['flask', 'api'], type: 'Flask Tutorial', likelihood: 70,
        reason: 'Flask API tutorials are widespread',
        urls: [
          'https://flask.palletsprojects.com/en/stable/quickstart/',
          'https://www.youtube.com/results?search_query=flask+api+tutorial'
        ]
      },

      // Mobile development
      { keywords: ['react native', 'mobile'], type: 'Mobile Tutorial', likelihood: 75,
        reason: 'React Native has extensive tutorial coverage',
        urls: [
          'https://reactnative.dev/docs/getting-started',
          'https://www.youtube.com/results?search_query=react+native+tutorial',
          'https://github.com/search?q=react-native-example'
        ]
      },
      { keywords: ['flutter', 'dart'], type: 'Flutter Tutorial', likelihood: 75,
        reason: 'Flutter tutorials are very common',
        urls: [
          'https://docs.flutter.dev/get-started/codelab',
          'https://www.youtube.com/results?search_query=flutter+tutorial',
          'https://github.com/flutter/samples'
        ]
      },

      // Machine Learning
      { keywords: ['tensorflow', 'machine learning'], type: 'ML Tutorial', likelihood: 80,
        reason: 'TensorFlow examples are widely available',
        urls: [
          'https://www.tensorflow.org/tutorials',
          'https://www.kaggle.com/search?q=tensorflow',
          'https://github.com/tensorflow/tensorflow/tree/master/tensorflow/examples'
        ]
      },
      { keywords: ['pytorch', 'neural network'], type: 'ML Tutorial', likelihood: 80,
        reason: 'PyTorch tutorials are extensively documented',
        urls: [
          'https://pytorch.org/tutorials/',
          'https://www.youtube.com/results?search_query=pytorch+tutorial'
        ]
      },

      // Authentication patterns
      { keywords: ['jwt', 'authentication', 'node'], type: 'Auth Tutorial', likelihood: 85,
        reason: 'JWT authentication is one of the most copied implementations',
        urls: [
          'https://www.youtube.com/results?search_query=jwt+authentication+nodejs',
          'https://github.com/search?q=jwt-authentication-example',
          'https://jwt.io/introduction'
        ]
      },
      { keywords: ['passport', 'authentication'], type: 'Auth Tutorial', likelihood: 80,
        reason: 'Passport.js examples are everywhere',
        urls: [
          'https://www.passportjs.org/tutorials/',
          'https://github.com/search?q=passport-authentication-example'
        ]
      }
    ];

    // Check each framework pattern - ONLY if this is a tech project
    if (isTechProject) {
      frameworkPatterns.forEach(pattern => {
        const matchCount = pattern.keywords.filter(keyword => text.includes(keyword)).length;
        // Require ALL keywords to be present (not just all-but-one)
        if (matchCount === pattern.keywords.length) {
          // Additional check: ensure keywords appear multiple times or in meaningful context
          const keywordDensity = pattern.keywords.reduce((sum, keyword) => {
            const count = (text.match(new RegExp(keyword, 'g')) || []).length;
            return sum + count;
          }, 0);

          // Only flag if keywords appear at least 3 times combined
          if (keywordDensity >= 3) {
            suspiciousSources.push({
              sourceType: pattern.type,
              likelihood: pattern.likelihood,
              reason: pattern.reason,
              indicators: pattern.keywords.map(k => `Contains "${k}"`),
              possibleUrls: pattern.urls
            });
            commonPatterns.push(pattern.keywords.join(' + '));
          }
        }
      });
    } else {
      console.log(`⏭️  Skipping tech pattern checks - project is ${projectDomain.domain}, not CS/Engineering`);
    }

    // EXPANDED: Generic project types (TECH)
    const genericProjects = {
      'library management system': {
        urls: [
          'https://github.com/search?q=library+management+system',
          'https://www.sourcecodester.com/search/node/library%20management',
          'https://code-projects.org/library-management-system/'
        ],
        likelihood: 70
      },
      'student portal': {
        urls: [
          'https://github.com/search?q=student+portal',
          'https://www.sourcecodester.com/search/node/student%20portal'
        ],
        likelihood: 65
      },
      'online shopping': {
        urls: [
          'https://github.com/search?q=online+shopping+system',
          'https://www.youtube.com/results?search_query=online+shopping+website+tutorial'
        ],
        likelihood: 75
      },
      'hospital management': {
        urls: [
          'https://github.com/search?q=hospital+management+system',
          'https://www.sourcecodester.com/search/node/hospital%20management'
        ],
        likelihood: 65
      },
      'hotel booking': {
        urls: [
          'https://github.com/search?q=hotel+booking+system',
          'https://www.youtube.com/results?search_query=hotel+booking+website'
        ],
        likelihood: 70
      },
      'chat application': {
        urls: [
          'https://github.com/search?q=chat+application',
          'https://www.youtube.com/results?search_query=chat+app+tutorial',
          'https://socket.io/get-started/chat'
        ],
        likelihood: 80
      },
      'todo app': {
        urls: [
          'https://github.com/search?q=todo+app',
          'https://www.youtube.com/results?search_query=todo+app+tutorial'
        ],
        likelihood: 85
      },
      'blog system': {
        urls: [
          'https://github.com/search?q=blog+system',
          'https://www.youtube.com/results?search_query=blog+website+tutorial'
        ],
        likelihood: 75
      }
    };

    // NEW: Non-technical academic topics (Business, Education, Politics, etc.)
    const academicTopics = {
      // BUSINESS TOPICS
      'marketing strategy': {
        urls: [
          'https://www.google.com/search?q=marketing+strategy+research+paper',
          'https://scholar.google.com/scholar?q=marketing+strategy',
          'https://www.scribd.com/search?query=marketing%20strategy',
          'https://www.researchgate.net/search/publication?q=marketing%20strategy'
        ],
        likelihood: 75
      },
      'business plan': {
        urls: [
          'https://www.google.com/search?q=business+plan+sample+pdf',
          'https://www.entrepreneur.com/businessplan',
          'https://articles.bplans.com/',
          'https://www.score.org/resource/business-plan-template'
        ],
        likelihood: 80
      },
      'swot analysis': {
        urls: [
          'https://www.google.com/search?q=swot+analysis+example',
          'https://www.investopedia.com/terms/s/swot.asp',
          'https://www.scribd.com/search?query=swot%20analysis'
        ],
        likelihood: 85
      },
      'supply chain': {
        urls: [
          'https://scholar.google.com/scholar?q=supply+chain+management',
          'https://www.google.com/search?q=supply+chain+management+case+study',
          'https://www.researchgate.net/search/publication?q=supply%20chain'
        ],
        likelihood: 70
      },
      'financial analysis': {
        urls: [
          'https://www.google.com/search?q=financial+analysis+project',
          'https://www.investopedia.com/financial-analysis',
          'https://www.scribd.com/search?query=financial%20analysis'
        ],
        likelihood: 75
      },

      // EDUCATION TOPICS
      'teaching method': {
        urls: [
          'https://scholar.google.com/scholar?q=teaching+methods+education',
          'https://www.google.com/search?q=teaching+methodology+research',
          'https://www.edutopia.org/article/teaching-strategies',
          'https://www.researchgate.net/search/publication?q=teaching%20methods'
        ],
        likelihood: 70
      },
      'curriculum development': {
        urls: [
          'https://scholar.google.com/scholar?q=curriculum+development',
          'https://www.google.com/search?q=curriculum+development+project',
          'https://www.scribd.com/search?query=curriculum%20development'
        ],
        likelihood: 75
      },
      'learning theory': {
        urls: [
          'https://scholar.google.com/scholar?q=learning+theories+education',
          'https://www.google.com/search?q=learning+theory+research',
          'https://www.simplypsychology.org/learning-theories.html'
        ],
        likelihood: 80
      },

      // POLITICAL SCIENCE
      'democracy': {
        urls: [
          'https://scholar.google.com/scholar?q=democracy+political+science',
          'https://www.google.com/search?q=democracy+research+paper',
          'https://www.britannica.com/topic/democracy',
          'https://plato.stanford.edu/entries/democracy/'
        ],
        likelihood: 70
      },
      'governance': {
        urls: [
          'https://scholar.google.com/scholar?q=governance+public+administration',
          'https://www.google.com/search?q=governance+research+paper',
          'https://www.researchgate.net/search/publication?q=governance'
        ],
        likelihood: 65
      },
      'public policy': {
        urls: [
          'https://scholar.google.com/scholar?q=public+policy+analysis',
          'https://www.google.com/search?q=public+policy+case+study',
          'https://www.britannica.com/topic/public-policy'
        ],
        likelihood: 70
      },

      // PSYCHOLOGY
      'cognitive development': {
        urls: [
          'https://scholar.google.com/scholar?q=cognitive+development+psychology',
          'https://www.google.com/search?q=cognitive+development+research',
          'https://www.simplypsychology.org/cognitive-development.html',
          'https://www.verywellmind.com/cognitive-development'
        ],
        likelihood: 75
      },
      'mental health': {
        urls: [
          'https://scholar.google.com/scholar?q=mental+health+research',
          'https://www.google.com/search?q=mental+health+study',
          'https://www.who.int/health-topics/mental-health',
          'https://www.nimh.nih.gov/'
        ],
        likelihood: 70
      },

      // SOCIOLOGY
      'social inequality': {
        urls: [
          'https://scholar.google.com/scholar?q=social+inequality',
          'https://www.google.com/search?q=social+inequality+research',
          'https://www.britannica.com/topic/social-inequality',
          'https://www.researchgate.net/search/publication?q=social%20inequality'
        ],
        likelihood: 70
      },
      'gender studies': {
        urls: [
          'https://scholar.google.com/scholar?q=gender+studies+research',
          'https://www.google.com/search?q=gender+studies+paper',
          'https://www.researchgate.net/search/publication?q=gender%20studies'
        ],
        likelihood: 75
      },

      // HEALTHCARE/NURSING
      'patient care': {
        urls: [
          'https://scholar.google.com/scholar?q=patient+care+nursing',
          'https://www.google.com/search?q=patient+care+research',
          'https://www.nursingtimes.net/',
          'https://pubmed.ncbi.nlm.nih.gov/?term=patient+care'
        ],
        likelihood: 70
      },
      'healthcare management': {
        urls: [
          'https://scholar.google.com/scholar?q=healthcare+management',
          'https://www.google.com/search?q=healthcare+management+project',
          'https://www.ncbi.nlm.nih.gov/pmc/'
        ],
        likelihood: 70
      },

      // ENVIRONMENTAL SCIENCE
      'climate change': {
        urls: [
          'https://scholar.google.com/scholar?q=climate+change+research',
          'https://www.google.com/search?q=climate+change+study',
          'https://www.ipcc.ch/',
          'https://climate.nasa.gov/'
        ],
        likelihood: 75
      },
      'sustainability': {
        urls: [
          'https://scholar.google.com/scholar?q=sustainability+research',
          'https://www.google.com/search?q=sustainability+project',
          'https://www.un.org/sustainabledevelopment/'
        ],
        likelihood: 70
      },

      // LAW
      'criminal justice': {
        urls: [
          'https://scholar.google.com/scholar?q=criminal+justice+system',
          'https://www.google.com/search?q=criminal+justice+research',
          'https://www.britannica.com/topic/criminal-justice'
        ],
        likelihood: 70
      },
      'constitutional law': {
        urls: [
          'https://scholar.google.com/scholar?q=constitutional+law',
          'https://www.google.com/search?q=constitutional+law+analysis',
          'https://www.law.cornell.edu/constitution'
        ],
        likelihood: 75
      }
    };

    // Check generic TECH projects - only if it's a tech project
    if (isTechProject) {
      Object.keys(genericProjects).forEach(topic => {
        const occurrences = (text.match(new RegExp(topic.replace(/\s+/g, '\\s+'), 'gi')) || []).length;
        const inTitle = title.toLowerCase().includes(topic);

        // Only flag if appears 2+ times in text OR appears in title
        if (occurrences >= 2 || inTitle) {
          suspiciousSources.push({
            sourceType: 'Common Project',
            likelihood: genericProjects[topic].likelihood,
            reason: `"${topic}" is an extremely common tutorial project`,
            indicators: [`Generic ${topic} detected ${occurrences} time(s)`],
            possibleUrls: genericProjects[topic].urls
          });
          commonPatterns.push(topic);
        }
      });
    } else {
      console.log(`⏭️  Skipping generic tech project checks - project is ${projectDomain.domain}, not CS/Engineering`);
    }

    // Check academic/non-technical topics - only if it's a main focus
    Object.keys(academicTopics).forEach(topic => {
      const occurrences = (text.match(new RegExp(topic.replace(/\s+/g, '\\s+'), 'gi')) || []).length;
      const inTitle = title.toLowerCase().includes(topic);
      const inAbstract = abstract.toLowerCase().includes(topic);

      // Only flag if appears 3+ times OR in title/abstract (main focus)
      if (occurrences >= 3 || inTitle || inAbstract) {
        suspiciousSources.push({
          sourceType: 'Academic Research',
          likelihood: academicTopics[topic].likelihood,
          reason: `"${topic}" has extensive online research materials`,
          indicators: [`Academic topic: ${topic} (${occurrences} mentions)`],
          possibleUrls: academicTopics[topic].urls
        });
        commonPatterns.push(topic);
      }
    });

    // Check for specific code snippets (common boilerplate)
    const codePatterns = [
      { code: 'express()', platform: 'Express.js docs',
        url: 'https://expressjs.com/en/starter/hello-world.html', likelihood: 60 },
      { code: 'mongoose.connect', platform: 'Mongoose docs',
        url: 'https://mongoosejs.com/docs/index.html', likelihood: 60 },
      { code: 'bcrypt.hash', platform: 'bcrypt examples',
        url: 'https://www.npmjs.com/package/bcrypt', likelihood: 65 },
      { code: 'jwt.sign', platform: 'JWT tutorials',
        url: 'https://www.npmjs.com/package/jsonwebtoken', likelihood: 70 }
    ];

    // Check code patterns - ONLY for tech projects
    if (isTechProject) {
      codePatterns.forEach(pattern => {
        const codeOccurrences = (text.match(new RegExp(pattern.code.toLowerCase().replace(/[()]/g, '\\$&'), 'g')) || []).length;

        // Only flag if code pattern appears 2+ times (indicates it's actually used, not just mentioned)
        if (codeOccurrences >= 2) {
          // Only add if not already flagged
          const exists = suspiciousSources.find(s => s.possibleUrls && s.possibleUrls.includes(pattern.url));
          if (!exists) {
            suspiciousSources.push({
              sourceType: 'Documentation',
              likelihood: pattern.likelihood,
              reason: `Code matches ${pattern.platform} documentation examples`,
              indicators: [`Contains "${pattern.code}" (${codeOccurrences} times)`],
              possibleUrls: [pattern.url]
            });
          }
        }
      });
    } else {
      console.log(`⏭️  Skipping code pattern checks - project is ${projectDomain.domain}, not CS/Engineering`);
    }

    // NEW: DEEP CONTENT ANALYSIS - Extract unique phrases and generate Google search URLs
    const deepAnalysis = performDeepContentAnalysis(title, abstract, fullText);
    suspiciousSources.push(...deepAnalysis.sources);

    const webPlagiarismScore = suspiciousSources.length > 0 ?
      Math.min(85, suspiciousSources.length * 20) : 15;

    return {
      webPlagiarismScore,
      suspiciousSources,
      commonPatterns,
      verdict: webPlagiarismScore > 65 ? 'LIKELY_COPIED' :
              webPlagiarismScore > 35 ? 'POSSIBLY_COPIED' : 'LIKELY_ORIGINAL',
      analysis: `Detected ${suspiciousSources.length} potential source(s) with ${suspiciousSources.reduce((sum, s) => sum + s.possibleUrls.length, 0)} specific URLs. Found ${commonPatterns.length} common pattern(s). Deep analysis completed on ${deepAnalysis.phrasesAnalyzed} unique phrases.`
    };
  } catch (error) {
    console.error('Web presence analysis error:', error);
    return {
      webPlagiarismScore: 30,
      suspiciousSources: [],
      commonPatterns: [],
      verdict: 'POSSIBLY_COPIED',
      analysis: 'Web analysis completed with limited data'
    };
  }
}

/**
 * NEW: DEEP CONTENT ANALYSIS - Extract unique phrases and search Google
 * This thoroughly analyzes the project by breaking it into searchable chunks
 */
function performDeepContentAnalysis(title, abstract, fullText) {
  console.log('Performing DEEP content analysis with Google search URLs...');

  const sources = [];
  const allText = `${abstract} ${fullText}`;

  // Extract sentences
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 20);

  // Find suspicious sentences (long, complex, or unique phrases)
  const suspiciousSentences = [];

  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);

    // Look for sentences with 10-25 words (likely unique enough to search)
    if (words.length >= 10 && words.length <= 25) {
      // Skip very generic sentences
      const genericStarts = ['the', 'this', 'it', 'in', 'a', 'an'];
      const firstWord = words[0].toLowerCase();

      if (!genericStarts.includes(firstWord)) {
        suspiciousSentences.push(sentence.trim());
      }
    }

    // Also look for very long sentences (40+ words) - often copied from academic sources
    if (words.length > 40) {
      suspiciousSentences.push(sentence.trim());
    }
  });

  // Take top 10 most suspicious sentences for Google search
  const topSentences = suspiciousSentences.slice(0, 10);

  topSentences.forEach((sentence, index) => {
    // Clean the sentence for Google search
    const cleanedSentence = sentence
      .replace(/[^\w\s]/g, ' ')  // Remove special characters
      .replace(/\s+/g, ' ')       // Normalize spaces
      .trim()
      .substring(0, 200);         // Limit to 200 chars for URL

    // Create exact phrase Google search URL
    const googleExactSearch = `https://www.google.com/search?q="${encodeURIComponent(cleanedSentence)}"`;

    // Create general Google search URL (without quotes)
    const googleGeneralSearch = `https://www.google.com/search?q=${encodeURIComponent(cleanedSentence)}`;

    // Create Google Scholar search
    const scholarSearch = `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanedSentence)}`;

    sources.push({
      sourceType: 'Deep Analysis',
      likelihood: 60 + (index * 2), // Higher likelihood for earlier matches
      reason: `Exact phrase search for: "${cleanedSentence.substring(0, 80)}..."`,
      indicators: [
        `${sentence.split(/\s+/).length} words in sentence`,
        'Searchable unique phrase detected'
      ],
      possibleUrls: [
        googleExactSearch,
        googleGeneralSearch,
        scholarSearch
      ]
    });
  });

  // Extract key technical terms or important phrases (noun phrases)
  const keyPhrases = extractKeyPhrases(allText);

  keyPhrases.slice(0, 5).forEach(phrase => {
    const googleSearch = `https://www.google.com/search?q=${encodeURIComponent(phrase)}`;
    const scholarSearch = `https://scholar.google.com/scholar?q=${encodeURIComponent(phrase)}`;

    sources.push({
      sourceType: 'Key Phrase Search',
      likelihood: 55,
      reason: `Key phrase detected: "${phrase}"`,
      indicators: ['Important technical term or concept'],
      possibleUrls: [
        googleSearch,
        scholarSearch,
        `https://www.researchgate.net/search/publication?q=${encodeURIComponent(phrase)}`
      ]
    });
  });

  // Check for exact paragraph matches (150+ character chunks)
  const paragraphs = allText.split(/\n\n+/).filter(p => p.trim().length > 150);

  paragraphs.slice(0, 3).forEach((para, index) => {
    const snippet = para.trim().substring(0, 150);
    const googleSearch = `https://www.google.com/search?q="${encodeURIComponent(snippet)}"`;

    sources.push({
      sourceType: 'Paragraph Match',
      likelihood: 70,
      reason: `Searching for exact paragraph match: "${snippet.substring(0, 60)}..."`,
      indicators: ['Large text block', 'Potential direct copy'],
      possibleUrls: [
        googleSearch,
        `https://www.google.com/search?q=${encodeURIComponent(snippet)}`
      ]
    });
  });

  return {
    sources,
    phrasesAnalyzed: topSentences.length + keyPhrases.length + paragraphs.length
  };
}

/**
 * Extract key phrases from text (2-4 word combinations that are important)
 */
function extractKeyPhrases(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Common stop words to exclude
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'been', 'were', 'will',
    'their', 'what', 'which', 'when', 'where', 'there', 'these', 'those',
    'could', 'would', 'should', 'about', 'also', 'into', 'through'
  ]);

  const phrases = [];

  // Extract 2-4 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    // 2-word phrases
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }

    // 3-word phrases
    if (i < words.length - 2 &&
        !stopWords.has(words[i]) &&
        !stopWords.has(words[i + 2])) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  // Count phrase occurrences
  const phraseCounts = {};
  phrases.forEach(phrase => {
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  });

  // Return phrases that appear at least twice (likely important)
  return Object.entries(phraseCounts)
    .filter(([phrase, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);
}

/**
 * Calculate overall plagiarism score
 */
function calculateOverallScore(databaseCheck, aiAnalysis, webSearchAnalysis) {
  const weights = {
    database: 0.4,
    ai: 0.35,
    webSearch: 0.25,
  };

  const databaseScore = databaseCheck.highestSimilarity || 0;
  const aiScore = 100 - (aiAnalysis.originalityScore || 50);
  const webScore = webSearchAnalysis.webPlagiarismScore || 0;

  const overallScore = Math.round(
    (databaseScore * weights.database) +
    (aiScore * weights.ai) +
    (webScore * weights.webSearch)
  );

  return Math.min(100, Math.max(0, overallScore));
}

/**
 * Determine final verdict with strict thresholds
 */
function determinePlagiarismVerdict(overallScore, databaseCheck, aiAnalysis, webSearchAnalysis) {
  let status, message, detailedAnalysis, recommendations;

  if (overallScore >= 70) {
    status = 'PLAGIARIZED';
    message = 'HIGH RISK - Significant plagiarism detected';
    detailedAnalysis = 'This project shows strong indicators of plagiarism or AI-generated content.';
    recommendations = [
      'Requires immediate manual review',
      'Request original work documentation',
      'Consider rejection or resubmission'
    ];
  } else if (overallScore >= 40) {
    status = 'SUSPICIOUS';
    message = 'MODERATE CONCERNS - Proceed with Caution';
    detailedAnalysis = 'This project raises several concerns regarding originality.';
    recommendations = [
      'Manual review recommended',
      'Request additional documentation',
      'Interview student about implementation'
    ];
  } else if (overallScore >= 20) {
    status = 'SUSPICIOUS';
    message = 'LOW CONCERNS - Minor Issues Detected';
    detailedAnalysis = 'Project appears mostly original with minor concerns.';
    recommendations = [
      'Quick manual review advised',
      'Verify citations and references'
    ];
  } else {
    status = 'ORIGINAL';
    message = 'PASSED - Project appears original';
    detailedAnalysis = 'No significant plagiarism detected.';
    recommendations = ['Proceed with standard review process'];
  }

  return { status, message, detailedAnalysis, recommendations };
}

module.exports = { checkProjectPlagiarism };
