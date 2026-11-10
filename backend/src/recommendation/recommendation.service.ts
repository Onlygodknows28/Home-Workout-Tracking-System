import { Injectable, Logger } from '@nestjs/common';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export interface ExercisePlanItem {
  exerciseId: string;
  name: string;
  slug: string;
  primaryMuscle: string;
  equipment: string;
  difficulty: number;
  sets: number;
  reps: number;
  restSeconds: number;
  adaptationNote?: string;
  isProgression?: boolean;
  isRegression?: boolean;
}

export interface RecommendationResult {
  title: string;
  strategy: 'COLD_START_CONTENT_BASED' | 'WARM_COLLABORATIVE_FILTERING';
  adaptationType: 'PROGRESSION' | 'REGRESSION' | 'OPTIMAL_MAINTENANCE' | 'INITIAL_CALIBRATION';
  aiExplanation: string;
  aiExplanationEn?: string;
  targetFocus: string;
  estimatedDurationMin: number;
  totalEstimatedXp: number;
  exercises: ExercisePlanItem[];
  excludedInjuries: string[];
}

export class AiChatRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];

  @IsOptional()
  @IsString()
  language?: 'vi' | 'en';

  @IsOptional()
  @IsString()
  clientApiKey?: string;
}

export class ConfigureGeminiKeyDto {
  @IsOptional()
  @IsString()
  apiKey?: string;
}

interface HealthAdaptationAnalysis {
  mappedContraindications: Set<string>;
  excludedSlugs: Set<string>;
  maxDifficulty: number;
  repMultiplier: number;
  extraRestSeconds: number;
  preferRegression: boolean;
  customHealthNotes: string[];
  noteVi: string;
  noteEn: string;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private cachedExercises: any[] | null = null;
  private cachedExercisesAt = 0;
  private runtimeGeminiApiKey: string | null = null;
  private preferredGeminiModel: string | null = null;
  private geminiHealthCache = new Map<
    string,
    { timestamp: number; data: Partial<HealthAdaptationAnalysis> }
  >();

  constructor(private prisma: PrismaService) {}

  private sanitizeApiKey(raw?: string | null): string | null {
    if (!raw) return null;
    const cleaned = raw.replace(/["'\s]/g, '');
    return cleaned.length > 10 ? cleaned : null;
  }

  private getEffectiveGeminiKey(clientApiKey?: string): string | null {
    const cleanedClientKey = this.sanitizeApiKey(clientApiKey);
    if (cleanedClientKey) {
      if (this.runtimeGeminiApiKey !== cleanedClientKey) {
        this.runtimeGeminiApiKey = cleanedClientKey;
        this.preferredGeminiModel = null;
      }
      return this.runtimeGeminiApiKey;
    }
    return this.sanitizeApiKey(process.env.GEMINI_API_KEY) || this.runtimeGeminiApiKey || null;
  }

  /**
   * Discovers the best available Gemini model for the given API Key via `GET /v1beta/models`
   * BEFORE calling `generateContent`, preventing HTTP 404 console warnings on deprecated model names.
   */
  private async resolveGeminiModel(apiKey: string): Promise<{
    modelName: string | null;
    errorMessage?: string;
  }> {
    if (this.preferredGeminiModel) {
      return { modelName: this.preferredGeminiModel };
    }

    if (process.env.GEMINI_MODEL) {
      this.preferredGeminiModel = process.env.GEMINI_MODEL.trim();
      return { modelName: this.preferredGeminiModel };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { signal: controller.signal },
      );
      clearTimeout(timeout);

      if (!listRes.ok) {
        const errJson: any = await listRes.json().catch(() => ({}));
        const msg =
          errJson?.error?.message || `HTTP ${listRes.status} when verifying Gemini API Key`;
        this.logger.warn(`Gemini API Key verification failed: ${msg}`);
        return { modelName: null, errorMessage: msg };
      }

      const listJson: any = await listRes.json();
      const availableModels: string[] = (listJson?.models || [])
        .filter(
          (m: any) =>
            typeof m?.name === 'string' &&
            Array.isArray(m?.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes('generateContent'),
        )
        .map((m: any) => (m.name as string).replace(/^models\//, ''));

      // Priority order of official Gemini Flash models
      const preferredOrder = [
        'gemini-3.0-flash',
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-1.5-flash',
      ];

      for (const candidate of preferredOrder) {
        if (availableModels.includes(candidate)) {
          this.preferredGeminiModel = candidate;
          this.logger.log(`✅ Gemini LLM connected using model: ${candidate}`);
          return { modelName: candidate };
        }
      }

      // Otherwise pick any newest gemini flash model that supports generateContent
      const anyFlash = availableModels.find(
        (name) =>
          name.includes('gemini') &&
          name.includes('flash') &&
          !name.includes('tts') &&
          !name.includes('image'),
      );
      if (anyFlash) {
        this.preferredGeminiModel = anyFlash;
        this.logger.log(`✅ Gemini LLM connected using discovered model: ${anyFlash}`);
        return { modelName: anyFlash };
      }

      const anyGemini = availableModels.find((name) => name.startsWith('gemini-'));
      if (anyGemini) {
        this.preferredGeminiModel = anyGemini;
        this.logger.log(`✅ Gemini LLM connected using model: ${anyGemini}`);
        return { modelName: anyGemini };
      }

      return {
        modelName: null,
        errorMessage: 'No compatible Gemini generateContent model found for this API Key',
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return { modelName: null, errorMessage: err?.message || 'Network timeout' };
    }
  }

  /**
   * Verifies and saves the user's Gemini API Key at runtime, returning the active model name.
   */
  async configureGeminiApiKey(rawKey?: string) {
    const cleaned = this.sanitizeApiKey(rawKey);
    if (!cleaned) {
      this.runtimeGeminiApiKey = null;
      this.preferredGeminiModel = null;
      return {
        valid: true,
        engine: 'HYBRID_EXPERT_ENGINE',
        model: null,
        message: 'Switched to built-in Hybrid Medical Expert Engine',
      };
    }

    this.runtimeGeminiApiKey = cleaned;
    this.preferredGeminiModel = null;

    const resolved = await this.resolveGeminiModel(cleaned);
    if (!resolved.modelName) {
      this.runtimeGeminiApiKey = null;
      return {
        valid: false,
        engine: 'HYBRID_EXPERT_ENGINE',
        model: null,
        message: resolved.errorMessage || 'Invalid Gemini API Key',
      };
    }

    return {
      valid: true,
      engine: 'GEMINI_2_5_FLASH',
      model: resolved.modelName,
      message: `Connected to Google Gemini (${resolved.modelName})`,
    };
  }

  /**
   * Calls Google Gemini API using the verified model discovered via `resolveGeminiModel`.
   */
  private async callGeminiGenerateContent(
    apiKey: string,
    payload: Record<string, any>,
    timeoutMs = 10000,
  ): Promise<{ text: string; modelUsed: string } | null> {
    const { modelName } = await this.resolveGeminiModel(apiKey);
    if (!modelName) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(payload),
        },
      );
      clearTimeout(timeout);

      if (response.ok) {
        const json: any = await response.json();
        const parts: any[] = json?.candidates?.[0]?.content?.parts || [];
        const text = parts
          .filter((p) => !p?.thought && typeof p?.text === 'string')
          .map((p) => p.text)
          .join('');
        if (text) {
          return { text: text.trim(), modelUsed: modelName };
        }
      } else {
        const errText = await response.text().catch(() => '');
        // If Google explicitly suggests a newer model in a 404 message, switch to it immediately
        const suggestedMatch = errText.match(/use models\/(gemini-[a-zA-Z0-9.-]+)/i);
        if (response.status === 404 && suggestedMatch?.[1]) {
          const suggestedModel = suggestedMatch[1];
          this.preferredGeminiModel = suggestedModel;
          const retryRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${suggestedModel}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
          );
          if (retryRes.ok) {
            const retryJson: any = await retryRes.json();
            const retryParts: any[] = retryJson?.candidates?.[0]?.content?.parts || [];
            const text = retryParts
              .filter((p) => !p?.thought && typeof p?.text === 'string')
              .map((p) => p.text)
              .join('');
            if (text) {
              return { text: text.trim(), modelUsed: suggestedModel };
            }
          }
        }
        this.logger.warn(
          `Gemini API (${modelName}) HTTP ${response.status}: ${errText.slice(0, 220)}`,
        );
      }
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.warn(`Gemini API (${modelName}) error: ${err?.message}`);
    }

    return null;
  }

  private async getExercisesCached() {
    const now = Date.now();
    if (this.cachedExercises && now - this.cachedExercisesAt < 300000) {
      return this.cachedExercises;
    }
    const list = await this.prisma.exercise.findMany();
    this.cachedExercises = list;
    this.cachedExercisesAt = now;
    return list;
  }

  private formatRawInjuriesList(rawInjuries: string[]): string {
    return rawInjuries
      .map((i) => (i.toUpperCase().startsWith('OTHER:') ? i.slice(6).replace(/;/g, ',') : i))
      .join(', ');
  }

  /**
   * TIER 1: Semantic Medical & Biomechanical Rule Engine (< 1ms, 100% deterministic & offline-safe)
   * Parses both standard injury tags and free-text `OTHER:<text>` health conditions (Vietnamese & English).
   */
  private analyzeHealthConditionsRuleBased(rawInjuries: string[]): HealthAdaptationAnalysis {
    const mappedContraindications = new Set<string>();
    const excludedSlugs = new Set<string>();
    const customHealthNotes: string[] = [];
    const adaptationReasonsVi: string[] = [];
    const adaptationReasonsEn: string[] = [];

    let maxDifficulty = 5;
    let repMultiplier = 1.0;
    let extraRestSeconds = 0;
    let preferRegression = false;

    for (const raw of rawInjuries) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      if (trimmed.toUpperCase().startsWith('OTHER:')) {
        const note = trimmed.slice(6).replace(/;/g, ',').trim();
        if (note) customHealthNotes.push(note);
      } else if (trimmed.toUpperCase() !== 'OTHER') {
        mappedContraindications.add(trimmed.toUpperCase());
      }
    }

    const combinedText = customHealthNotes.join(' ').toLowerCase();

    if (combinedText) {
      // 1. Anatomical Joint & Musculoskeletal Mapping
      if (/(cổ tay|bàn tay|ngón tay|wrist|carpal|hand|finger)/i.test(combinedText)) {
        mappedContraindications.add('WRIST');
        adaptationReasonsVi.push('bảo vệ khớp cổ tay/bàn tay');
        adaptationReasonsEn.push('wrist/hand joint protection');
      }
      if (/(đầu gối|khớp gối|dây chằng|sụn chêm|knee|acl|meniscus|patella)/i.test(combinedText)) {
        mappedContraindications.add('KNEE');
        adaptationReasonsVi.push('giảm tải áp lực khớp gối');
        adaptationReasonsEn.push('knee joint decompression');
      }
      if (/(cổ chân|mắt cá|bàn chân|gót chân|ankle|achilles|foot|plantar|shin)/i.test(combinedText)) {
        mappedContraindications.add('ANKLE');
        mappedContraindications.add('KNEE');
        excludedSlugs.add('burpees');
        excludedSlugs.add('mountain-climbers');
        excludedSlugs.add('bulgarian-split-squat');
        adaptationReasonsVi.push('loại bỏ bài bật nhảy & chịu lực cổ chân');
        adaptationReasonsEn.push('excluding high-impact ankle drills');
      }
      if (/(khuỷu tay|cùi chỏ|cẳng tay|elbow|forearm|tennis elbow)/i.test(combinedText)) {
        mappedContraindications.add('ELBOW');
        excludedSlugs.add('diamond-pushup');
        excludedSlugs.add('chair-dips');
        excludedSlugs.add('burpees');
        adaptationReasonsVi.push('tránh khóa khớp khuỷu tay');
        adaptationReasonsEn.push('avoiding elbow hyperextension');
      }
      if (/(vai|bả vai|xương đòn|shoulder|rotator cuff|clavicle)/i.test(combinedText)) {
        mappedContraindications.add('SHOULDER');
        adaptationReasonsVi.push('bảo vệ khớp vai');
        adaptationReasonsEn.push('shoulder stability protection');
      }
      if (
        /(lưng|thắt lưng|cột sống|thoát vị|đĩa đệm|thần kinh tọa|hông|lower back|spine|lumbar|herniated|sciatica|hip)/i.test(
          combinedText,
        )
      ) {
        mappedContraindications.add('LOWER_BACK');
        excludedSlugs.add('burpees');
        excludedSlugs.add('hollow-body-hold');
        excludedSlugs.add('bulgarian-split-squat');
        adaptationReasonsVi.push('chống nén cột sống & thắt lưng');
        adaptationReasonsEn.push('lumbar spine decompression');
      }
      if (/(cổ|đốt sống cổ|vai gáy|neck|cervical)/i.test(combinedText)) {
        mappedContraindications.add('NECK');
        excludedSlugs.add('pike-pushup');
        excludedSlugs.add('hollow-body-hold');
        adaptationReasonsVi.push('giảm căng cơ vùng cổ - vai gáy');
        adaptationReasonsEn.push('cervical neck tension relief');
      }

      // 2. Systemic Physiological Conditions (Cardiovascular, Respiratory, Vestibular, Recovery)
      if (
        /(tim|tim mạch|huyết áp|nhịp tim|mạch vành|tức ngực|heart|cardio|hypertension|blood pressure|arrhythmia|tachycardia)/i.test(
          combinedText,
        )
      ) {
        excludedSlugs.add('burpees');
        excludedSlugs.add('mountain-climbers');
        excludedSlugs.add('pike-pushup');
        maxDifficulty = Math.min(maxDifficulty, 3);
        repMultiplier = Math.min(repMultiplier, 0.85);
        extraRestSeconds = Math.max(extraRestSeconds, 15);
        preferRegression = true;
        adaptationReasonsVi.push(
          'kiểm soát nhịp tim an toàn (loại bỏ HIIT đột ngột, giảm 15% reps, +15s nghỉ)',
        );
        adaptationReasonsEn.push(
          'cardiovascular heart-rate control (no sudden HIIT spikes, -15% reps, +15s rest)',
        );
      }

      if (/(hô hấp|hen|suyễn|khó thở|phổi|asthma|breathing|respiratory|shortness of breath|copd)/i.test(combinedText)) {
        excludedSlugs.add('burpees');
        excludedSlugs.add('mountain-climbers');
        maxDifficulty = Math.min(maxDifficulty, 3);
        repMultiplier = Math.min(repMultiplier, 0.85);
        extraRestSeconds = Math.max(extraRestSeconds, 15);
        adaptationReasonsVi.push('điều hòa nhịp thở (tránh bài gây hụt hơi, +15s nghỉ)');
        adaptationReasonsEn.push('respiratory pacing (avoiding breath-taxing HIIT, +15s rest)');
      }

      if (
        /(tiền đình|chóng mặt|hoa mắt|thiếu máu|hạ huyết áp|đau đầu|vertigo|dizziness|dizzy|migraine|anemia|faint)/i.test(
          combinedText,
        )
      ) {
        excludedSlugs.add('burpees');
        excludedSlugs.add('pike-pushup');
        excludedSlugs.add('mountain-climbers');
        excludedSlugs.add('table-inverted-row');
        maxDifficulty = Math.min(maxDifficulty, 2);
        extraRestSeconds = Math.max(extraRestSeconds, 15);
        preferRegression = true;
        adaptationReasonsVi.push(
          'ổn định tiền đình (loại bỏ động tác chúc đầu/đổi tư thế đột ngột, +15s nghỉ)',
        );
        adaptationReasonsEn.push(
          'vestibular stability (excluding head-inversion & rapid posture shifts, +15s rest)',
        );
      }

      if (
        /(phẫu thuật|hậu phẫu|mới ốm|suy nhược|mệt|đau cơ|mang thai|thai kỳ|surgery|post-op|recovering|fatigue|weak|pregnant|rehab)/i.test(
          combinedText,
        )
      ) {
        excludedSlugs.add('burpees');
        excludedSlugs.add('mountain-climbers');
        excludedSlugs.add('diamond-pushup');
        excludedSlugs.add('pike-pushup');
        excludedSlugs.add('bulgarian-split-squat');
        maxDifficulty = Math.min(maxDifficulty, 2);
        repMultiplier = Math.min(repMultiplier, 0.8);
        extraRestSeconds = Math.max(extraRestSeconds, 20);
        preferRegression = true;
        adaptationReasonsVi.push(
          'chế độ phục hồi thể trạng (ưu tiên biến thể nhẹ Tier 1-2, giảm 20% khối lượng, +20s nghỉ)',
        );
        adaptationReasonsEn.push(
          'rehabilitation pacing (Tier 1-2 gentle variations, -20% volume, +20s rest)',
        );
      }

      // If user entered a custom note that didn't hit a specific keyword above, still apply a gentle safety buffer
      if (adaptationReasonsVi.length === 0) {
        excludedSlugs.add('burpees');
        extraRestSeconds = Math.max(extraRestSeconds, 10);
        adaptationReasonsVi.push(
          `thích ứng an toàn cho tình trạng "${customHealthNotes.join(', ')}" (+10s nghỉ)`,
        );
        adaptationReasonsEn.push(
          `safety adaptation for "${customHealthNotes.join(', ')}" (+10s rest)`,
        );
      }
    }

    const noteVi =
      customHealthNotes.length > 0
        ? `[HYBRID-AI] Đã ghi nhận tình trạng "${customHealthNotes.join(', ')}" — AI tự động ${adaptationReasonsVi.join('; ')}.`
        : '';
    const noteEn =
      customHealthNotes.length > 0
        ? `[HYBRID-AI] Health note "${customHealthNotes.join(', ')}" active — AI applied ${adaptationReasonsEn.join('; ')}.`
        : '';

    return {
      mappedContraindications,
      excludedSlugs,
      maxDifficulty,
      repMultiplier,
      extraRestSeconds,
      preferRegression,
      customHealthNotes,
      noteVi,
      noteEn,
    };
  }

  /**
   * TIER 2: Google Gemini 2.5 Flash LLM Medical Adaptation Adapter
   * Refines the Tier-1 rule analysis when GEMINI_API_KEY is available and custom health notes exist.
   */
  private async analyzeHealthWithGemini(
    baseAnalysis: HealthAdaptationAnalysis,
    allExercises: any[],
    profile: any,
  ): Promise<HealthAdaptationAnalysis> {
    const apiKey = this.getEffectiveGeminiKey();
    if (!apiKey || baseAnalysis.customHealthNotes.length === 0) {
      return baseAnalysis;
    }

    const cacheKey = `${baseAnalysis.customHealthNotes.join('|')}_${profile.fitnessLevel}_${profile.primaryGoal}`;
    const cached = this.geminiHealthCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 600000) {
      return {
        ...baseAnalysis,
        ...cached.data,
        excludedSlugs: new Set([
          ...Array.from(baseAnalysis.excludedSlugs),
          ...Array.from(cached.data.excludedSlugs || []),
        ]),
      };
    }

    try {
      const catalogSummary = allExercises.map((e) => ({
        slug: e.slug,
        name: e.name,
        muscle: e.primaryMuscle,
        difficulty: e.difficulty,
        contraindications: e.contraindicatedInjuries,
      }));

      const prompt = `You are a clinical exercise physiologist for the FITVANT Calisthenics AI system.
User Profile:
- BMI: ${profile.bmi}, Fitness Level: ${profile.fitnessLevel}, Goal: ${profile.primaryGoal}
- Declared Health Condition / Injury Note: "${baseAnalysis.customHealthNotes.join('; ')}"
- Exercise Catalog: ${JSON.stringify(catalogSummary)}

Return ONLY valid JSON with this exact schema:
{
  "excludedSlugs": ["slug1", "slug2"],
  "maxDifficulty": 1 to 5,
  "repMultiplier": 0.75 to 1.0,
  "extraRestSeconds": 0 to 30,
  "preferRegression": true or false,
  "noteVi": "1 concise sentence in Vietnamese explaining how the workout was adapted for their health condition (start with [HYBRID-AI])",
  "noteEn": "1 concise sentence in English explaining how the workout was adapted for their health condition (start with [HYBRID-AI])"
}`;

      const geminiRes = await this.callGeminiGenerateContent(
        apiKey,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        },
        6000,
      );

      if (!geminiRes?.text) {
        return baseAnalysis;
      }

      const parsed = JSON.parse(geminiRes.text);
      const mergedSlugs = new Set<string>([
        ...Array.from(baseAnalysis.excludedSlugs),
        ...(Array.isArray(parsed.excludedSlugs) ? parsed.excludedSlugs : []),
      ]);

      const refinedData: Partial<HealthAdaptationAnalysis> = {
        excludedSlugs: mergedSlugs,
        maxDifficulty:
          typeof parsed.maxDifficulty === 'number'
            ? Math.min(baseAnalysis.maxDifficulty, Math.max(1, Math.min(5, parsed.maxDifficulty)))
            : baseAnalysis.maxDifficulty,
        repMultiplier:
          typeof parsed.repMultiplier === 'number'
            ? Math.max(0.7, Math.min(1.0, parsed.repMultiplier))
            : baseAnalysis.repMultiplier,
        extraRestSeconds:
          typeof parsed.extraRestSeconds === 'number'
            ? Math.max(baseAnalysis.extraRestSeconds, Math.min(30, parsed.extraRestSeconds))
            : baseAnalysis.extraRestSeconds,
        preferRegression: Boolean(parsed.preferRegression || baseAnalysis.preferRegression),
        noteVi: parsed.noteVi || baseAnalysis.noteVi,
        noteEn: parsed.noteEn || baseAnalysis.noteEn,
      };

      this.geminiHealthCache.set(cacheKey, { timestamp: Date.now(), data: refinedData });

      return {
        ...baseAnalysis,
        ...refinedData,
        excludedSlugs: mergedSlugs,
      };
    } catch (err: any) {
      this.logger.debug(`Gemini health analysis fallback to Tier 1 rules: ${err?.message}`);
      return baseAnalysis;
    }
  }

  async generateDailyRecommendation(
    userId: string,
    preloadedUser?: any,
  ): Promise<RecommendationResult> {
    const [user, allExercises] = await Promise.all([
      preloadedUser
        ? Promise.resolve(preloadedUser)
        : this.prisma.user.findUnique({
            where: { id: userId },
            include: {
              profile: true,
              workoutLogs: {
                orderBy: { completedAt: 'desc' },
                take: 5,
              },
            },
          }),
      this.getExercisesCached(),
    ]);

    if (!user || !user.profile) {
      throw new Error('User profile incomplete for recommendation');
    }

    const { profile, workoutLogs } = user;
    const rawInjuries = profile.injuries ? profile.injuries.split(',').filter(Boolean) : [];
    const availableEquipment = profile.availableEquipment
      ? profile.availableEquipment.split(',').filter(Boolean)
      : ['BODYWEIGHT'];

    // 1. Run 2-Tier Hybrid Health & Biomechanical Analysis
    const ruleAnalysis = this.analyzeHealthConditionsRuleBased(rawInjuries);
    const healthAnalysis = await this.analyzeHealthWithGemini(ruleAnalysis, allExercises, profile);

    // Filter exercises that violate mapped joint contraindications or excluded slugs
    let safeExercises = allExercises.filter((ex) => {
      if (healthAnalysis.excludedSlugs.has(ex.slug)) return false;
      const contraindications = ex.contraindicatedInjuries
        ? ex.contraindicatedInjuries.split(',').map((c: string) => c.trim().toUpperCase())
        : [];
      return !Array.from(healthAnalysis.mappedContraindications).some((inj) =>
        contraindications.includes(inj),
      );
    });

    // Fallback safety net if a user checked every single injury + severe condition
    if (safeExercises.length < 3) {
      safeExercises = allExercises
        .filter((ex) => !healthAnalysis.excludedSlugs.has(ex.slug))
        .sort((a, b) => a.difficulty - b.difficulty)
        .slice(0, 4);
    }

    // 2. Determine Cold Start vs Warm State
    const hasHistory = workoutLogs.length >= 2;
    let strategy: 'COLD_START_CONTENT_BASED' | 'WARM_COLLABORATIVE_FILTERING' =
      'COLD_START_CONTENT_BASED';
    let adaptationType: 'PROGRESSION' | 'REGRESSION' | 'OPTIMAL_MAINTENANCE' | 'INITIAL_CALIBRATION' =
      'INITIAL_CALIBRATION';
    let aiExplanation = '';
    let aiExplanationEn = '';

    const lastLog = workoutLogs[0];
    const readableInjuries = this.formatRawInjuriesList(rawInjuries);

    if (!hasHistory) {
      strategy = 'COLD_START_CONTENT_BASED';
      adaptationType = healthAnalysis.preferRegression ? 'REGRESSION' : 'INITIAL_CALIBRATION';
      aiExplanation = `Hệ thống phân tích thể lực khởi đầu (BMI: ${profile.bmi}, Chống đẩy: ${profile.pushupBaseline} cái) và loại trừ ${rawInjuries.length} vùng chấn thương (${readableInjuries || 'Không có'}).`;
      aiExplanationEn = `Baseline calibration (BMI: ${profile.bmi}, Push-ups: ${profile.pushupBaseline} reps) while filtering ${rawInjuries.length} declared health/injury zones (${readableInjuries || 'None'}).`;
    } else {
      strategy = 'WARM_COLLABORATIVE_FILTERING';
      const recentRpe = lastLog.rpeScore; // 1: Quá Dễ, 2: Vừa Sức, 3: Quá Sức

      if (recentRpe === 1 && !healthAnalysis.preferRegression) {
        adaptationType = 'PROGRESSION';
        aiExplanation = `Buổi tập trước bạn đánh giá Quá Dễ. AI tự động nâng cấp độ khó bài tập và tăng khối lượng reps 15% để kích thích cơ bắp phát triển.`;
        aiExplanationEn = `Your last workout was rated Too Easy. AI upgraded exercise variations and increased volume by 15% to drive hypertrophy.`;
      } else if (recentRpe === 3 || healthAnalysis.preferRegression) {
        adaptationType = 'REGRESSION';
        aiExplanation = `Buổi tập trước bạn cảm thấy Quá Sức. AI tự động giảm tải an toàn, chuyển sang biến thể nhẹ hơn và tăng thời gian nghỉ ngơi để hồi phục cơ bắp.`;
        aiExplanationEn = `Safe deload mode active. AI shifted to joint-friendly regressions and extended rest intervals for optimal recovery.`;
      } else {
        adaptationType = 'OPTIMAL_MAINTENANCE';
        aiExplanation = `Buổi tập trước bạn hoàn thành ở mức Vừa Sức. AI giữ nguyên biến thể chuẩn và tăng nhẹ 1 rep để duy trì quá tải lũy tiến.`;
        aiExplanationEn = `You achieved optimal exertion in your last workout. AI maintained standard variations and added 1 rep to sustain progressive overload.`;
      }
    }

    // Prepend custom health adaptation note if user declared an OTHER health condition
    if (healthAnalysis.noteVi) {
      aiExplanation = `${healthAnalysis.noteVi} ${aiExplanation}`;
      aiExplanationEn = `${healthAnalysis.noteEn} ${aiExplanationEn}`;
    }

    // 3. Assemble Workout Sequence
    const targetMuscles = this.getTargetMusclesForGoal(profile.primaryGoal);
    const exerciseList: ExercisePlanItem[] = [];

    const equipmentMatches = safeExercises.filter(
      (ex) => availableEquipment.includes(ex.equipment) || ex.equipment === 'BODYWEIGHT',
    );

    let targetDifficulty = 2;
    if (profile.fitnessLevel === 'BEGINNER') targetDifficulty = 1;
    if (profile.fitnessLevel === 'NOVICE') targetDifficulty = 2;
    if (profile.fitnessLevel === 'INTERMEDIATE') targetDifficulty = 3;
    if (profile.fitnessLevel === 'ADVANCED') targetDifficulty = 4;

    // Respect health condition max difficulty cap
    targetDifficulty = Math.min(targetDifficulty, healthAnalysis.maxDifficulty);

    const chosenExerciseIds = new Set<string>();

    for (const muscle of targetMuscles) {
      let candidates = equipmentMatches.filter(
        (ex) =>
          ex.primaryMuscle === muscle &&
          !chosenExerciseIds.has(ex.id) &&
          ex.difficulty <= healthAnalysis.maxDifficulty,
      );
      if (candidates.length === 0) {
        candidates = safeExercises.filter(
          (ex) => ex.primaryMuscle === muscle && !chosenExerciseIds.has(ex.id),
        );
      }
      if (candidates.length === 0) continue;

      candidates.sort(
        (a, b) =>
          Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty),
      );

      let selected = candidates[0];
      let reps = selected.defaultReps;
      const sets = selected.defaultSets;
      let rest = selected.restSeconds;
      let note = 'Bài tập chuẩn';
      let isProgression = false;
      let isRegression = false;

      if (adaptationType === 'PROGRESSION' && !healthAnalysis.preferRegression) {
        if (selected.progressionId && !chosenExerciseIds.has(selected.progressionId)) {
          const progressed = safeExercises.find(
            (ex) =>
              ex.id === selected.progressionId && ex.difficulty <= healthAnalysis.maxDifficulty,
          );
          if (progressed) {
            selected = progressed;
            isProgression = true;
            note = 'Tiến cấp biến thể nâng cao';
          }
        }
        reps = Math.round(reps * 1.15);
      } else if (adaptationType === 'REGRESSION' || healthAnalysis.preferRegression) {
        if (selected.regressionId && !chosenExerciseIds.has(selected.regressionId)) {
          const regressed = safeExercises.find((ex) => ex.id === selected.regressionId);
          if (regressed) {
            selected = regressed;
            isRegression = true;
            note = 'Biến thể bảo vệ sức khỏe';
          }
        }
        reps = Math.max(5, Math.round(reps * 0.85));
        rest += 15;
      } else if (adaptationType === 'OPTIMAL_MAINTENANCE') {
        reps += 1;
        note = 'Tăng tiến lũy tiến (+1 rep)';
      }

      // Apply custom health condition multipliers (e.g., cardiovascular/respiratory/rehab)
      if (healthAnalysis.repMultiplier < 1.0) {
        reps = Math.max(5, Math.round(reps * healthAnalysis.repMultiplier));
      }
      if (healthAnalysis.extraRestSeconds > 0 && adaptationType !== 'REGRESSION') {
        rest += healthAnalysis.extraRestSeconds;
      }

      if (chosenExerciseIds.has(selected.id)) continue;
      chosenExerciseIds.add(selected.id);

      exerciseList.push({
        exerciseId: selected.id,
        name: selected.name,
        slug: selected.slug,
        primaryMuscle: selected.primaryMuscle,
        equipment: selected.equipment,
        difficulty: selected.difficulty,
        sets,
        reps,
        restSeconds: rest,
        adaptationNote: note,
        isProgression,
        isRegression,
      });

      if (exerciseList.length >= 5) break;
    }

    const estimatedDurationMin = Math.round(
      exerciseList.reduce(
        (acc, curr) => acc + (curr.sets * (curr.reps * 3 + curr.restSeconds)) / 60,
        0,
      ) + 2,
    );

    const totalEstimatedXp = exerciseList.reduce(
      (acc, curr) => acc + curr.sets * curr.reps * curr.difficulty * 2,
      0,
    );

    return {
      title: this.getWorkoutTitle(profile.primaryGoal, adaptationType),
      strategy,
      adaptationType,
      aiExplanation,
      aiExplanationEn,
      targetFocus: profile.primaryGoal,
      estimatedDurationMin: Math.max(10, estimatedDurationMin),
      totalEstimatedXp,
      exercises: exerciseList,
      excludedInjuries: rawInjuries,
    };
  }

  /**
   * AUXILIARY / FINISHER SESSION
   * Generates a focused 2-3 exercise Core & Mobility routine (~8-10 minutes, +50 XP)
   * for athletes who completed today's prescribed routine with RPE 1 (Too Easy)
   * and want to expend remaining energy safely.
   */
  async generateAuxiliaryRecommendation(
    userId: string,
    preloadedUser?: any,
  ): Promise<RecommendationResult> {
    const [user, allExercises] = await Promise.all([
      preloadedUser
        ? Promise.resolve(preloadedUser)
        : this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
          }),
      this.getExercisesCached(),
    ]);

    if (!user || !user.profile) {
      throw new Error('User profile incomplete for recommendation');
    }

    const { profile } = user;
    const rawInjuries = profile.injuries ? profile.injuries.split(',').filter(Boolean) : [];
    const ruleAnalysis = this.analyzeHealthConditionsRuleBased(rawInjuries);

    // Filter safe exercises avoiding any injury contraindications
    const safeExercises = allExercises.filter((ex) => {
      if (ruleAnalysis.excludedSlugs.has(ex.slug)) return false;
      const contraindications = ex.contraindicatedInjuries
        ? ex.contraindicatedInjuries.split(',').map((c: string) => c.trim().toUpperCase())
        : [];
      return !Array.from(ruleAnalysis.mappedContraindications).some((inj) =>
        contraindications.includes(inj),
      );
    });

    // Priority targets for auxiliary session: CORE & FULL_BODY
    let coreCandidates = safeExercises.filter((ex) => ex.primaryMuscle === 'CORE');
    if (coreCandidates.length === 0) {
      coreCandidates = safeExercises.filter(
        (ex) => ex.primaryMuscle === 'FULL_BODY' || ex.primaryMuscle === 'CORE',
      );
    }
    if (coreCandidates.length === 0) {
      coreCandidates = safeExercises;
    }

    // Pick 2-3 exercises for a short punchy finisher
    const selectedList: ExercisePlanItem[] = [];
    const pickedIds = new Set<string>();

    for (const ex of coreCandidates) {
      if (pickedIds.has(ex.id)) continue;
      pickedIds.add(ex.id);
      selectedList.push({
        exerciseId: ex.id,
        name: ex.name,
        slug: ex.slug,
        primaryMuscle: ex.primaryMuscle,
        equipment: ex.equipment,
        difficulty: Math.min(ex.difficulty, 3),
        sets: 3,
        reps: Math.min(ex.defaultReps || 15, 25),
        restSeconds: 30,
        adaptationNote: 'Bài tập bổ trợ cơ lõi & đốt mỡ',
        isProgression: false,
        isRegression: false,
      });
      if (selectedList.length >= 3) break;
    }

    const estimatedDurationMin = Math.round(
      selectedList.reduce(
        (acc, curr) => acc + (curr.sets * (curr.reps * 2.5 + curr.restSeconds)) / 60,
        0,
      ) + 1,
    );

    return {
      title: '⚡ Bài Tập Bổ Trợ: Đốt Cháy Cơ Lõi & Giãn Cơ Phục Hồi',
      strategy: 'WARM_COLLABORATIVE_FILTERING',
      adaptationType: 'PROGRESSION',
      aiExplanation:
        'Vì bạn đánh giá buổi tập chính là Quá Dễ (RPE 1), AI Coach kích hoạt hiệp bài bổ trợ Core Burnout để kích hoạt tối đa nhóm cơ bụng sâu mà không gây quá tải khớp.',
      aiExplanationEn:
        'Because your primary session was rated Too Easy (RPE 1), AI Coach prepared a targeted Core Burnout finisher to recruit deep abdominal stabilizers safely.',
      targetFocus: 'CORE',
      estimatedDurationMin: Math.max(8, estimatedDurationMin),
      totalEstimatedXp: 50,
      exercises: selectedList,
      excludedInjuries: rawInjuries,
    };
  }

  /**
   * PHASE 3: Context-Aware FITVANT AI Coach Chatbot
   * Uses Google Gemini 2.5 Flash LLM with full Athlete Telemetry Context,
   * and falls back seamlessly to a rich Context-Aware Exercise Science Expert Responder when offline/no key.
   */
  async chatWithAiCoach(userId: string, dto: AiChatRequestDto) {
    const lang = dto.language === 'en' ? 'en' : 'vi';
    const userMessage = (dto.message || '').trim();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        workoutLogs: {
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
      },
    });

    const apiKey = this.getEffectiveGeminiKey(dto.clientApiKey);

    const dailyRec = user
      ? await this.generateDailyRecommendation(userId, user).catch(() => null)
      : null;

    const profile = user?.profile;
    const rawInjuries = profile?.injuries ? profile.injuries.split(',').filter(Boolean) : [];
    const readableInjuries = this.formatRawInjuriesList(rawInjuries);

    if (apiKey) {
      try {
        const exercisesSummary =
          dailyRec?.exercises
            ?.map(
              (ex, i) =>
                `${i + 1}. ${ex.name} (${ex.sets} sets x ${ex.reps} reps, rest ${ex.restSeconds}s)`,
            )
            .join('; ') || 'No active routine';

        const recentLogsSummary =
          user?.workoutLogs
            ?.map((l) => `${l.workoutTitle} (RPE ${l.rpeScore}, ${l.totalReps} reps)`)
            .join('; ') || 'No recent workouts yet';

        const systemInstruction = `You are FITVANT AI Coach, an elite Clinical Exercise Physiologist & Calisthenics Coach integrated into the FITVANT application.
Athlete Real-time Telemetry:
- Name: ${user?.name || 'Athlete'}, Level: ${user?.level || 1}, Current Streak: ${user?.currentStreak || 0} days
- Body Metrics: Height ${profile?.height || 170}cm, Weight ${profile?.weight || 65}kg, BMI ${profile?.bmi || 22.5}
- Fitness Level: ${profile?.fitnessLevel || 'NOVICE'} (Baseline Push-ups: ${profile?.pushupBaseline || 12} reps)
- Primary Goal: ${profile?.primaryGoal || 'MUSCLE_GAIN'}
- Declared Injuries & Health Conditions: ${readableInjuries || 'None'}
- Available Household Equipment: ${profile?.availableEquipment || 'BODYWEIGHT'}
- Today's Recommended Routine (${dailyRec?.title || 'Daily Routine'}): ${exercisesSummary}
- Recent Workout History: ${recentLogsSummary}

Guidelines:
1. Respond in ${lang === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English'}.
2. Provide a complete, well-structured, practical, and scientifically grounded response (around 180-300 words). Use bullet points for readability and never cut off mid-sentence.
3. Directly reference the athlete's real metrics (BMI, weight, push-ups, declared injuries/health conditions, or today's exercises) so they feel personally coached.
4. Always prioritize joint safety and medical contraindications.`;

        const contents = [
          ...(dto.history || []).slice(-6).map((h) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          })),
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ];

        const geminiRes = await this.callGeminiGenerateContent(
          apiKey,
          {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: 4096,
            },
          },
          20000,
        );

        if (geminiRes?.text) {
          return {
            reply: geminiRes.text,
            engine: 'GEMINI_2_5_FLASH',
            model: geminiRes.modelUsed,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini chat fallback to Hybrid Expert Engine: ${err?.message}`);
      }
    }

    // Fallback: Context-Aware Hybrid Expert Responder (100% Personalized with User's Database Metrics)
    const fallbackReply = this.buildContextAwareExpertReply(
      userMessage,
      lang,
      user,
      profile,
      readableInjuries,
      dailyRec,
    );

    return {
      reply: fallbackReply,
      engine: 'HYBRID_EXPERT_ENGINE',
    };
  }

  private buildContextAwareExpertReply(
    message: string,
    lang: 'vi' | 'en',
    user: any,
    profile: any,
    readableInjuries: string,
    dailyRec: RecommendationResult | null,
  ): string {
    const q = message.toLowerCase();
    const name = user?.name ? user.name.split(' ')[0] : lang === 'vi' ? 'bạn' : 'Athlete';
    const weight = profile?.weight || 65;
    const height = profile?.height || 170;
    const bmi = profile?.bmi || 22.5;
    const goal = profile?.primaryGoal || 'MUSCLE_GAIN';
    const pushups = profile?.pushupBaseline ?? 12;
    const exercises = dailyRec?.exercises || [];

    // Estimate TDEE & Protein from athlete's actual weight & height
    const bmr = Math.round(10 * weight + 6.25 * height - 5 * 22 + 5);
    const tdee = Math.round(bmr * 1.45);
    const targetCalories =
      goal === 'FAT_LOSS' ? tdee - 350 : goal === 'MUSCLE_GAIN' ? tdee + 250 : tdee;
    const proteinGrams = Math.round(weight * (goal === 'MUSCLE_GAIN' ? 2.0 : 1.8));

    // Topic 1: Nutrition / Calories / Diet / Macros
    if (
      /(ăn|dinh dưỡng|calo|protein|thực đơn|giảm mỡ|tăng cân|bữa|eat|nutrition|calorie|diet|macro|meal|food)/i.test(
        q,
      )
    ) {
      if (lang === 'vi') {
        return `Chào **${name}**! Dựa trên chỉ số cơ thể hiện tại của bạn (**${height}cm • ${weight}kg • BMI ${bmi}**) và mục tiêu **${goal}**, AI Coach tính toán định mức dinh dưỡng tối ưu cho bạn:

• **Năng lượng duy trì (TDEE ước tính):** ~${tdee} kcal/ngày
• **Mục tiêu Calo khuyến nghị:** **${targetCalories} kcal/ngày** (${goal === 'FAT_LOSS' ? 'Thâm hụt -350 kcal để đốt mỡ sạch' : goal === 'MUSCLE_GAIN' ? 'Dư thừa nhẹ +250 kcal để tổng hợp cơ bắp' : 'Cân bằng giữ dáng'})
• **Đạm (Protein) mục tiêu:** **${proteinGrams}g/ngày** (~${Math.round(proteinGrams / 3)}g mỗi bữa chính từ ức gà, trứng, cá, đậu phụ hoặc sữa chua Hy Lạp).
• **Trước buổi tập 45 phút:** 1 quả chuối hoặc 1 lát bánh mì nguyên cám để duy trì đường huyết ổn định.`;
      }
      return `Hello **${name}**! Based on your current biometrics (**${height}cm • ${weight}kg • BMI ${bmi}**) and **${goal}** goal, here is your personalized nutrition target:

• **Estimated Maintenance (TDEE):** ~${tdee} kcal/day
• **Daily Target Calories:** **${targetCalories} kcal/day** (${goal === 'FAT_LOSS' ? '-350 kcal clean deficit' : goal === 'MUSCLE_GAIN' ? '+250 kcal lean surplus' : 'Maintenance'})
• **Daily Protein Goal:** **${proteinGrams}g/day** (~${Math.round(proteinGrams / 3)}g per meal from lean poultry, eggs, fish, or Greek yogurt).
• **Pre-Workout Fuel (45m prior):** 1 banana or oats for sustained calisthenics output.`;
    }

    // Topic 2: Injury / Health Condition / Pain / Modification
    if (
      /(đau|chấn thương|khớp|sức khỏe|tim|huyết áp|tiền đình|chóng mặt|thay thế|an toàn|pain|injury|hurt|health|joint|wrist|knee|back|shoulder|safe|modify)/i.test(
        q,
      )
    ) {
      const declaredText =
        readableInjuries || (lang === 'vi' ? 'Chưa khai báo chấn thương' : 'No declared injuries');
      const safeExList = exercises
        .slice(0, 3)
        .map((e) => e.name)
        .join(', ');

      if (lang === 'vi') {
        return `**Phân tích An toàn Y sinh & Cơ sinh học cho ${name}:**
• **Hồ sơ sức khỏe đã ghi nhận:** \`${declaredText}\`
• **Cơ chế bảo vệ đang bật:** Hệ thống Hybrid AI đã lọc bỏ các bài tập gây áp lực trực tiếp lên vùng tổn thương của bạn và giữ danh sách hôm nay gồm: **${safeExList || 'Các biến thể tự trọng an toàn'}**.
• **Nguyên tắc tập luyện an toàn:**
  1. Giữ nhịp thở đều (hít vào khi hạ người, thở ra khi phát lực — tuyệt đối không nín thở gây tăng huyết áp).
  2. Nếu cảm thấy nhói khớp hoặc chóng mặt, hãy nhấn nút **+15s nghỉ** hoặc chọn **RPE 3 (Quá Sức)** cuối buổi để AI tự động giảm cấp bài tập vào ngày mai.`;
      }
      return `**Biomechanical & Health Safety Analysis for ${name}:**
• **Recorded Health Profile:** \`${declaredText}\`
• **Active Protection:** Hybrid AI has filtered out contraindicated movements and selected joint-safe drills for today: **${safeExList || 'Safe bodyweight progressions'}**.
• **Safety Protocol:**
  1. Maintain steady breathing (inhale on eccentric, exhale on concentric — avoid Valsalva breath-holding).
  2. If you experience joint discomfort or dizziness, tap **+15s Rest** during the session or log **RPE 3 (Too Hard)** afterward so AI automatically regresses tomorrow's routine.`;
    }

    // Topic 3: Today's Workout / Routine / Exercises / Technique
    if (
      /(hôm nay|bài tập|giáo án|lịch tập|hướng dẫn|kỹ thuật|tập gì|today|workout|routine|exercise|plan|form|sets|reps)/i.test(
        q,
      )
    ) {
      const exLines = exercises
        .map(
          (ex, idx) =>
            `  ${idx + 1}. **${ex.name}** — \`${ex.sets} hiệp × ${ex.reps} cái\` (Nghỉ ${ex.restSeconds}s)`,
        )
        .join('\n');

      if (lang === 'vi') {
        return `**Giáo án AI hôm nay của ${name}: ${dailyRec?.title || 'Calisthenics Cá Nhân Hóa'}**
• **Thời lượng ước tính:** ${dailyRec?.estimatedDurationMin || 18} phút • **Phần thưởng:** +${dailyRec?.totalEstimatedXp || 120} XP
• **Lý do thích ứng:** ${dailyRec?.aiExplanation || 'Tối ưu theo thể lực hiện tại'}

**Danh sách bài tập chi tiết:**
${exLines || '• Hãy mở trang Bài Tập để khởi tạo lộ trình.'}

💡 *Mẹo kỹ thuật:* Kiểm soát pha hạ người (Eccentric) trong 2 giây ở mỗi lần lặp để kích hoạt tối đa sợi cơ mà không cần tạ nặng.`;
      }
      return `**Today's AI Routine for ${name}: ${dailyRec?.title || 'Personalized Calisthenics'}**
• **Estimated Duration:** ${dailyRec?.estimatedDurationMin || 18} mins • **Reward:** +${dailyRec?.totalEstimatedXp || 120} XP
• **Adaptation Note:** ${dailyRec?.aiExplanationEn || dailyRec?.aiExplanation || 'Calibrated to your current fitness level'}

**Exercise Breakdown:**
${exLines || '• Open the Workouts tab to launch your session.'}

💡 *Coach Tip:* Use a controlled 2-second eccentric lowering phase on every rep to maximize muscle fiber recruitment safely at home.`;
    }

    // Default Overview (Comprehensive Personalized Coach Summary)
    if (lang === 'vi') {
      return `Xin chào **${name}**! Tôi là **FITVANT AI Coach** — trợ lý huấn luyện đã đồng bộ trực tiếp với hồ sơ thể chất của bạn:
• **Chỉ số cơ thể:** ${height}cm • ${weight}kg (BMI **${bmi}**) • Chống đẩy nền: **${pushups} cái**
• **Mục tiêu:** **${goal}** • **Tình trạng sức khỏe/Chấn thương:** \`${readableInjuries || 'Không có'}\`
• **Giáo án hôm nay:** **${dailyRec?.title || 'Calisthenics Toàn Thân'}** (${exercises.length} bài tập • ~${dailyRec?.estimatedDurationMin || 18} phút)

Bạn có thể hỏi tôi bất kỳ câu hỏi nào về:
1. **Phân tích giáo án & kỹ thuật** các bài tập hôm nay.
2. **Điều chỉnh bài tập theo chấn thương / vấn đề sức khỏe** (${readableInjuries || 'Cổ tay, đầu gối, tim mạch, tiền đình...'}).
3. **Thực đơn & lượng Calo/Protein** tính theo cân nặng ${weight}kg của bạn.`;
    }

    return `Hello **${name}**! I am your **FITVANT AI Coach**, synchronized with your live athlete telemetry:
• **Biometrics:** ${height}cm • ${weight}kg (BMI **${bmi}**) • Push-up Baseline: **${pushups} reps**
• **Primary Goal:** **${goal}** • **Health/Injury Profile:** \`${readableInjuries || 'None'}\`
• **Today's Routine:** **${dailyRec?.title || 'Full-Body Calisthenics'}** (${exercises.length} exercises • ~${dailyRec?.estimatedDurationMin || 18} mins)

Ask me anything about:
1. **Today's workout breakdown** and biomechanical form cues.
2. **Injury & health adaptations** (${readableInjuries || 'wrist, knee, cardio, vertigo...'}).
3. **Personalized calories & protein targets** for your ${weight}kg bodyweight.`;
  }

  private getTargetMusclesForGoal(goal: string): string[] {
    switch (goal) {
      case 'FAT_LOSS':
        return ['FULL_BODY', 'LEGS', 'CHEST', 'CORE', 'BACK'];
      case 'MUSCLE_GAIN':
        return ['CHEST', 'BACK', 'LEGS', 'ARMS', 'SHOULDERS'];
      case 'ENDURANCE':
        return ['FULL_BODY', 'LEGS', 'CORE', 'CHEST', 'ARMS'];
      case 'MOBILITY':
      default:
        return ['CORE', 'BACK', 'LEGS', 'SHOULDERS', 'CHEST'];
    }
  }

  private getWorkoutTitle(goal: string, adaptation: string): string {
    const prefix =
      adaptation === 'PROGRESSION'
        ? '⚡ Tăng Tốc: '
        : adaptation === 'REGRESSION'
          ? '🛡️ Phục Hồi & Kiểm Soát: '
          : '🔥 Giáo Án Thể Lực: ';

    switch (goal) {
      case 'FAT_LOSS':
        return `${prefix}Đốt Mỡ Toàn Thân`;
      case 'MUSCLE_GAIN':
        return `${prefix}Phát Triển Cơ Bắp Tại Nhà`;
      case 'ENDURANCE':
        return `${prefix}Sức Bền & Thể Lực Vượt Trội`;
      case 'MOBILITY':
      default:
        return `${prefix}Vận Động Toàn Diện & Khớp Linh Hoạt`;
    }
  }
}
