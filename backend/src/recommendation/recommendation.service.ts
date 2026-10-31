import { Injectable, Logger } from '@nestjs/common';
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
  targetFocus: string;
  estimatedDurationMin: number;
  totalEstimatedXp: number;
  exercises: ExercisePlanItem[];
  excludedInjuries: string[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private prisma: PrismaService) {}

  async generateDailyRecommendation(userId: string): Promise<RecommendationResult> {
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

    if (!user || !user.profile) {
      throw new Error('User profile incomplete for recommendation');
    }

    const { profile, workoutLogs } = user;
    const injuries = profile.injuries ? profile.injuries.split(',').filter(Boolean) : [];
    const availableEquipment = profile.availableEquipment
      ? profile.availableEquipment.split(',').filter(Boolean)
      : ['BODYWEIGHT'];

    // Retrieve all active exercises from DB
    const allExercises = await this.prisma.exercise.findMany();

    // 1. Strict Injury Safety Exception Filter
    const safeExercises = allExercises.filter((ex) => {
      const contraindications = ex.contraindicatedInjuries
        ? ex.contraindicatedInjuries.split(',').map((c) => c.trim().toUpperCase())
        : [];
      return !injuries.some((inj) => contraindications.includes(inj.trim().toUpperCase()));
    });

    // 2. Determine Cold Start vs Warm State
    const hasHistory = workoutLogs.length >= 2;
    let strategy: 'COLD_START_CONTENT_BASED' | 'WARM_COLLABORATIVE_FILTERING' = 'COLD_START_CONTENT_BASED';
    let adaptationType: 'PROGRESSION' | 'REGRESSION' | 'OPTIMAL_MAINTENANCE' | 'INITIAL_CALIBRATION' =
      'INITIAL_CALIBRATION';
    let aiExplanation = '';

    const lastLog = workoutLogs[0];

    if (!hasHistory) {
      strategy = 'COLD_START_CONTENT_BASED';
      adaptationType = 'INITIAL_CALIBRATION';
      aiExplanation = `Hệ thống phân tích thể lực khởi đầu (BMI: ${profile.bmi}, Chống đẩy: ${profile.pushupBaseline} cái) và loại trừ ${injuries.length} vùng chấn thương (${injuries.join(', ') || 'Không có'}).`;
    } else {
      // Warm state: Collaborative + RPE adaptation
      strategy = 'WARM_COLLABORATIVE_FILTERING';
      const recentRpe = lastLog.rpeScore; // 1: Quá Dễ, 2: Vừa Sức, 3: Quá Sức

      if (recentRpe === 1) {
        adaptationType = 'PROGRESSION';
        aiExplanation = `Buổi tập trước bạn đánh giá Quá Dễ. AI tự động nâng cấp độ khó bài tập và tăng khối lượng reps 15% để kích thích cơ bắp phát triển.`;
      } else if (recentRpe === 3) {
        adaptationType = 'REGRESSION';
        aiExplanation = `Buổi tập trước bạn cảm thấy Quá Sức. AI tự động giảm tải an toàn, chuyển sang biến thể nhẹ hơn và tăng thời gian nghỉ ngơi để hồi phục cơ bắp.`;
      } else {
        adaptationType = 'OPTIMAL_MAINTENANCE';
        aiExplanation = `Buổi tập trước bạn hoàn thành ở mức Vừa Sức. AI giữ nguyên biến thể chuẩn và tăng nhẹ 1 rep để duy trì quá tải lũy tiến.`;
      }
    }

    // 3. Assemble Workout Sequence (Upper / Lower / Core / FullBody depending on Goal)
    const targetMuscles = this.getTargetMusclesForGoal(profile.primaryGoal);
    const exerciseList: ExercisePlanItem[] = [];

    // Filter exercises matching available equipment
    const equipmentMatches = safeExercises.filter((ex) =>
      availableEquipment.includes(ex.equipment) || ex.equipment === 'BODYWEIGHT',
    );

    // Target difficulty based on fitnessLevel
    let targetDifficulty = 2;
    if (profile.fitnessLevel === 'BEGINNER') targetDifficulty = 1;
    if (profile.fitnessLevel === 'NOVICE') targetDifficulty = 2;
    if (profile.fitnessLevel === 'INTERMEDIATE') targetDifficulty = 3;
    if (profile.fitnessLevel === 'ADVANCED') targetDifficulty = 4;

    const chosenExerciseIds = new Set<string>();

    for (const muscle of targetMuscles) {
      let candidates = equipmentMatches.filter(
        (ex) => ex.primaryMuscle === muscle && !chosenExerciseIds.has(ex.id),
      );
      if (candidates.length === 0) {
        candidates = safeExercises.filter(
          (ex) => ex.primaryMuscle === muscle && !chosenExerciseIds.has(ex.id),
        );
      }
      if (candidates.length === 0) continue;

      // Sort by closeness to target difficulty
      candidates.sort(
        (a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty),
      );

      let selected = candidates[0];
      let reps = selected.defaultReps;
      let sets = selected.defaultSets;
      let rest = selected.restSeconds;
      let note = 'Bài tập chuẩn';
      let isProgression = false;
      let isRegression = false;

      // Apply Dynamic RPE Progression / Regression logic
      if (adaptationType === 'PROGRESSION') {
        if (selected.progressionId && !chosenExerciseIds.has(selected.progressionId)) {
          const progressed = safeExercises.find((ex) => ex.id === selected.progressionId);
          if (progressed) {
            selected = progressed;
            isProgression = true;
            note = 'Tiến cấp biến thể nâng cao';
          }
        }
        reps = Math.round(reps * 1.15);
      } else if (adaptationType === 'REGRESSION') {
        if (selected.regressionId && !chosenExerciseIds.has(selected.regressionId)) {
          const regressed = safeExercises.find((ex) => ex.id === selected.regressionId);
          if (regressed) {
            selected = regressed;
            isRegression = true;
            note = 'Lùi cấp biến thể an toàn';
          }
        }
        reps = Math.max(5, Math.round(reps * 0.85));
        rest += 15;
      } else if (adaptationType === 'OPTIMAL_MAINTENANCE') {
        reps += 1;
        note = 'Tăng tiến lũy tiến (+1 rep)';
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
      exerciseList.reduce((acc, curr) => acc + (curr.sets * (curr.reps * 3 + curr.restSeconds)) / 60, 0) + 2,
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
      targetFocus: profile.primaryGoal,
      estimatedDurationMin: Math.max(10, estimatedDurationMin),
      totalEstimatedXp,
      exercises: exerciseList,
      excludedInjuries: injuries,
    };
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
