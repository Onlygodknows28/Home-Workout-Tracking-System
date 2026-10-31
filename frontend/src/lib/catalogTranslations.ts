import { Language } from '../context/LanguageContext';

export interface LocalizedItem {
  name: {
    vi: string;
    en: string;
  };
  description?: {
    vi: string;
    en: string;
  };
}

export const SHOP_ITEMS_I18N: Record<string, LocalizedItem> = {
  'item-freeze-1': {
    name: {
      vi: 'Thẻ Bảo Vệ Chuỗi',
      en: 'Streak Freeze Shield',
    },
    description: {
      vi: 'Tự động bảo vệ chuỗi tập luyện của bạn nếu lỡ nghỉ ngơi 1 ngày mà không bị mất streak.',
      en: 'Automatically protects your workout streak if you take a rest day.',
    },
  },
  'item-avatar-gold': {
    name: {
      vi: 'Khung Avatar Hoàng Kim',
      en: 'Golden Aura Avatar Frame',
    },
    description: {
      vi: 'Khung ảnh đại diện phát sáng vàng dành cho những chiến binh kỷ luật hàng đầu.',
      en: 'Glowing gold profile avatar frame reserved for top disciplined athletes.',
    },
  },
  'item-badge-titanium': {
    name: {
      vi: 'Huy Hiệu Titan Thể Lực',
      en: 'Titanium Fitness Badge',
    },
    description: {
      vi: 'Huy chương danh giá gắn vào trang cá nhân thể hiện sự bền bỉ.',
      en: 'Prestigious profile badge showcasing relentless stamina and consistency.',
    },
  },
  'item-title-beast': {
    name: {
      vi: 'Danh Hiệu Bất Khả Chiến Bại',
      en: 'Unstoppable Beast Title',
    },
    description: {
      vi: 'Danh hiệu hiển thị kế bên tên người dùng trong bảng xếp hạng bạn bè.',
      en: 'Exclusive title displayed next to your athlete name on social leaderboards.',
    },
  },
};

export const EXERCISES_I18N: Record<string, LocalizedItem> = {
  'wall-pushup': {
    name: { vi: 'Chống Đẩy Tường', en: 'Wall Push-Up' },
    description: {
      vi: 'Biến thể khởi đầu an toàn, giảm áp lực cổ tay và khớp vai.',
      en: 'Beginner-friendly variation reducing wrist and shoulder pressure.',
    },
  },
  'knee-pushup': {
    name: { vi: 'Chống Đẩy Quỳ Gối', en: 'Knee Push-Up' },
    description: {
      vi: 'Bài tập nhập môn xây dựng lực đẩy ngực và tay sau.',
      en: 'Introductory drill building chest and triceps pushing strength.',
    },
  },
  'standard-pushup': {
    name: { vi: 'Chống Đẩy Tiêu Chuẩn', en: 'Standard Push-Up' },
    description: {
      vi: 'Bài tập nền tảng kinh điển phát triển cơ ngực, vai trước và tay sau.',
      en: 'Classic foundational movement targeting chest, shoulders, and triceps.',
    },
  },
  'diamond-pushup': {
    name: { vi: 'Chống Đẩy Kim Cương', en: 'Diamond Push-Up' },
    description: {
      vi: 'Tập trung cao độ vào ngực trong và toàn bộ cơ tam đầu bắp tay sau.',
      en: 'Intense focus on inner chest fibers and full triceps activation.',
    },
  },
  'decline-pushup': {
    name: { vi: 'Chống Đẩy Dốc Chân Lên Ghế', en: 'Decline Push-Up' },
    description: {
      vi: 'Sử dụng ghế kê chân để dồn trọng lực vào phần ngực trên và cơ vai.',
      en: 'Elevated feet on a chair shifting resistance to upper chest and shoulders.',
    },
  },
  'chair-squat': {
    name: { vi: 'Ngồi Ghế Đứng Dậy', en: 'Chair Box Squat' },
    description: {
      vi: 'Biến thể cực êm cho khớp gối, học chuyển động bản lề hông chính xác.',
      en: 'Joint-friendly variation mastering clean hip hinge mechanics.',
    },
  },
  'bodyweight-squat': {
    name: { vi: 'Squat Tự Thân', en: 'Bodyweight Squat' },
    description: {
      vi: 'Phát triển đùi trước, đùi sau và cơ mông săn chắc.',
      en: 'Develops quadriceps, hamstrings, and toned glutes.',
    },
  },
  'bulgarian-split-squat': {
    name: { vi: 'Squat 1 Chân Kê Ghế', en: 'Bulgarian Split Squat' },
    description: {
      vi: 'Cô lập từng bên chân với sự hỗ trợ của ghế sinh hoạt, kích thích cơ đùi tối đa.',
      en: 'Unilateral leg isolation on a chair maximizing quad and glute hypertrophy.',
    },
  },
  'glute-bridge': {
    name: { vi: 'Cầu Mông Trên Thảm', en: 'Glute Bridge' },
    description: {
      vi: 'Không gây áp lực lên đầu gối, kích hoạt mạnh mẽ chuỗi cơ sau.',
      en: 'Zero knee impact exercise strongly activating posterior chain muscles.',
    },
  },
  'single-leg-bridge': {
    name: { vi: 'Cầu Mông 1 Chân', en: 'Single-Leg Glute Bridge' },
    description: {
      vi: 'Gấp đôi cường độ cho nhóm cơ mông và đùi sau, khắc phục mất cân bằng.',
      en: 'Double intensity glute isolation fixing muscular imbalances.',
    },
  },
  'backpack-squat': {
    name: { vi: 'Squat Tải Trọng Balo', en: 'Backpack Weighted Squat' },
    description: {
      vi: 'Tận dụng balo chứa sách hoặc chai nước để tăng tải trọng tại gia.',
      en: 'Progressive overload using a loaded backpack with books or water bottles.',
    },
  },
  'towel-door-row': {
    name: { vi: 'Kéo Khăn Cửa Phòng', en: 'Towel Door Row' },
    description: {
      vi: 'Tận dụng khăn tắm quàng qua nắm cửa phòng để kéo phát triển cơ xô lưng.',
      en: 'Door towel pulling movement targeting lats and upper back muscles.',
    },
  },
  'table-inverted-row': {
    name: { vi: 'Hít Kéo Dưới Bàn Ăn', en: 'Table Inverted Row' },
    description: {
      vi: 'Chuyển động kéo xô lưng Calisthenics mạnh mẽ sử dụng cạnh bàn ăn.',
      en: 'Powerful calisthenics horizontal pull using a sturdy dining table.',
    },
  },
  'doorframe-row': {
    name: { vi: 'Kéo Khung Cửa 1 Tay', en: 'Single-Arm Doorframe Row' },
    description: {
      vi: 'Bám vào mép khung cửa để tập luyện cơ lưng từng bên không cần tạ.',
      en: 'Unilateral back pull gripping a doorframe without equipment.',
    },
  },
  'chair-dips': {
    name: { vi: 'Chống Đẩy Nhún Ghế', en: 'Chair Tricep Dips' },
    description: {
      vi: 'Sử dụng mép ghế để cô lập bắp tay sau và ngực dưới.',
      en: 'Chair edge dips isolating triceps and lower chest fibers.',
    },
  },
  'bottle-lateral-raise': {
    name: { vi: 'Dang Vai Chai Nước', en: 'Water Bottle Lateral Raise' },
    description: {
      vi: 'Dùng 2 chai nước làm tạ nhẹ để tạo hình cầu vai săn chắc và rộng.',
      en: 'Water bottles used as light dumbbells for shoulder cap sculpting.',
    },
  },
  'pike-pushup': {
    name: { vi: 'Chống Đẩy Vai Chữ V', en: 'Pike Push-Up' },
    description: {
      vi: 'Biến thể nâng cao chuyển toàn bộ trọng lực cơ thể lên nhóm cơ vai.',
      en: 'Advanced inverted pushup transferring full load to shoulder deltoids.',
    },
  },
  'forearm-plank': {
    name: { vi: 'Plank Cẳng Tay', en: 'Forearm Plank' },
    description: {
      vi: 'Bài tập gồng lõi tĩnh củng cố cột sống và bảo vệ cổ tay hoàn hảo.',
      en: 'Static core isometric drill stabilizing spine with zero wrist strain.',
    },
  },
  'hollow-body-hold': {
    name: { vi: 'Gồng Lõi Thuyền Nan', en: 'Hollow Body Hold' },
    description: {
      vi: 'Kỹ thuật thể dục dụng cụ kích hoạt toàn bộ nhóm cơ bụng sâu.',
      en: 'Gymnastics core shape engaging the deepest abdominal wall.',
    },
  },
  'dead-bug': {
    name: { vi: 'Bọ Ngửa Kiểm Soát', en: 'Dead Bug' },
    description: {
      vi: 'Bài tập phục hồi cốt lõi an toàn tuyệt đối cho lưng dưới.',
      en: 'Safe core recovery pattern protecting lower lumbar spine.',
    },
  },
  'bird-dog': {
    name: { vi: 'Chim Chó Giữ Thăng Bằng', en: 'Bird Dog' },
    description: {
      vi: 'Tăng cường sức mạnh cơ dựng sống lưng và độ ổn định hông.',
      en: 'Strengthens erector spinae and improves pelvic stability.',
    },
  },
  'mountain-climbers': {
    name: { vi: 'Leo Núi Tại Chỗ', en: 'Mountain Climbers' },
    description: {
      vi: 'Tăng nhịp tim, đốt cháy calo mãnh liệt và rèn luyện cơ lõi linh hoạt.',
      en: 'Metabolic calorie burner boosting heart rate and dynamic core agility.',
    },
  },
  'burpees': {
    name: { vi: 'Burpees Đốt Mỡ Cường Độ Cao', en: 'High-Intensity Burpees' },
    description: {
      vi: 'Bài tập toàn thân tiêu hao năng lượng tối đa, tăng thể lực bùng nổ.',
      en: 'Full-body explosive conditioning drill maximizing energy expenditure.',
    },
  },
};

/**
 * Remove parenthetical comments (e.g. "(Standard Push-Up)", "(Wall Push-Up)")
 */
export function cleanParentheses(text: string): string {
  if (!text) return '';
  return text.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Localize shop item name
 */
export function getShopItemName(item: { id?: string; name?: string }, language: Language): string {
  if (!item) return '';
  const mapped = item.id ? SHOP_ITEMS_I18N[item.id] : undefined;
  if (mapped) {
    return mapped.name[language] || mapped.name.vi;
  }
  return cleanParentheses(item.name || '');
}

/**
 * Localize shop item description
 */
export function getShopItemDesc(item: { id?: string; description?: string }, language: Language): string {
  if (!item) return '';
  const mapped = item.id ? SHOP_ITEMS_I18N[item.id] : undefined;
  if (mapped && mapped.description) {
    return mapped.description[language] || mapped.description.vi;
  }
  return cleanParentheses(item.description || '');
}

/**
 * Localize exercise name
 */
export function getExerciseName(exercise: { id?: string; slug?: string; name?: string }, language: Language): string {
  if (!exercise) return '';
  const slugOrId = exercise.slug || (exercise.id?.replace(/^ex-/, '')) || '';
  const mapped = EXERCISES_I18N[slugOrId] || (exercise.id ? EXERCISES_I18N[exercise.id] : undefined);
  if (mapped) {
    return mapped.name[language] || mapped.name.vi;
  }
  return cleanParentheses(exercise.name || '');
}

/**
 * Localize exercise description
 */
export function getExerciseDesc(exercise: { id?: string; slug?: string; description?: string }, language: Language): string {
  if (!exercise) return '';
  const slugOrId = exercise.slug || (exercise.id?.replace(/^ex-/, '')) || '';
  const mapped = EXERCISES_I18N[slugOrId] || (exercise.id ? EXERCISES_I18N[exercise.id] : undefined);
  if (mapped && mapped.description) {
    return mapped.description[language] || mapped.description.vi;
  }
  return cleanParentheses(exercise.description || '');
}

/**
 * Clean & localize workout plan title
 */
export function getWorkoutPlanTitle(title: string | undefined, language: Language): string {
  if (!title) return '';
  const cleaned = cleanParentheses(title);
  if (language === 'vi') return cleaned;

  // Translate standard workout titles to clean English
  if (cleaned.includes('Đốt Mỡ Toàn Thân')) {
    return cleaned.replace('Đốt Mỡ Toàn Thân', 'Full-Body Calorie Burn')
      .replace('⚡ Tăng Tốc: ', '⚡ Accelerated: ')
      .replace('🛡️ Phục Hồi & Kiểm Soát: ', '🛡️ Recovery & Control: ')
      .replace('🔥 Giáo Án Thể Lực: ', '🔥 Fitness Routine: ');
  }
  if (cleaned.includes('Phát Triển Cơ Bắp Tại Nhà')) {
    return cleaned.replace('Phát Triển Cơ Bắp Tại Nhà', 'Home Muscle Hypertrophy')
      .replace('⚡ Tăng Tốc: ', '⚡ Accelerated: ')
      .replace('🛡️ Phục Hồi & Kiểm Soát: ', '🛡️ Recovery & Control: ')
      .replace('🔥 Giáo Án Thể Lực: ', '🔥 Fitness Routine: ');
  }
  if (cleaned.includes('Sức Bền & Thể Lực Vượt Trội')) {
    return cleaned.replace('Sức Bền & Thể Lực Vượt Trội', 'Stamina & Athletic Endurance')
      .replace('⚡ Tăng Tốc: ', '⚡ Accelerated: ')
      .replace('🛡️ Phục Hồi & Kiểm Soát: ', '🛡️ Recovery & Control: ')
      .replace('🔥 Giáo Án Thể Lực: ', '🔥 Fitness Routine: ');
  }
  if (cleaned.includes('Vận Động Toàn Diện & Khớp Linh Hoạt')) {
    return cleaned.replace('Vận Động Toàn Diện & Khớp Linh Hoạt', 'Full Mobility & Joint Health')
      .replace('⚡ Tăng Tốc: ', '⚡ Accelerated: ')
      .replace('🛡️ Phục Hồi & Kiểm Soát: ', '🛡️ Recovery & Control: ')
      .replace('🔥 Giáo Án Thể Lực: ', '🔥 Fitness Routine: ');
  }
  return cleaned;
}

/**
 * Localize AI Rationale Explanation
 */
export function getAiExplanation(
  explanation: string | undefined,
  adaptationType: string | undefined,
  language: Language
): string {
  const isRegression =
    adaptationType === 'REGRESSION' ||
    explanation?.includes('Quá Sức') ||
    explanation?.includes('Đuối') ||
    explanation?.includes('Regression');

  const isProgression =
    adaptationType === 'PROGRESSION' ||
    explanation?.includes('Quá Dễ') ||
    explanation?.includes('Progression');

  const isCalibration =
    adaptationType === 'INITIAL_CALIBRATION' ||
    explanation?.includes('khởi đầu') ||
    explanation?.includes('baseline');

  if (language === 'vi') {
    if (isRegression) {
      return 'Buổi tập trước bạn cảm thấy Quá Sức. AI tự động giảm tải an toàn, chuyển sang biến thể nhẹ hơn và tăng thời gian nghỉ ngơi để hồi phục cơ bắp.';
    }
    if (isProgression) {
      return 'Buổi tập trước bạn đánh giá Quá Dễ. AI tự động nâng cấp biến thể bài tập và tăng 15% số lần lặp lại để kích thích cơ bắp phát triển.';
    }
    if (isCalibration) {
      return 'Hệ thống phân tích thể lực khởi đầu và loại trừ an toàn các vùng chấn thương để thiết lập giáo án cá nhân hóa.';
    }
    return 'Buổi tập trước bạn hoàn thành ở mức Vừa Sức. AI giữ nguyên biến thể chuẩn và tăng nhẹ 1 lần lặp lại để duy trì quá tải lũy tiến.';
  }

  // English translation (100% clean English, no Vietnamese or parentheses)
  if (isRegression) {
    return 'You felt overexerted in your last workout. AI automatically scaled down to safe exercise regressions and extended rest intervals for muscle recovery.';
  }
  if (isProgression) {
    return 'You rated your last workout as Easy. AI automatically upgraded exercise variations and increased reps by 15% to stimulate muscle growth.';
  }
  if (isCalibration) {
    return 'System analyzed your baseline fitness and excluded all injured joint areas to construct a safe, personalized routine.';
  }
  return 'You achieved optimal exertion in your last workout. AI maintained standard variations and added 1 rep to sustain progressive overload.';
}

/**
 * Localize Co-op Mission Title
 */
export function getMissionTitle(title: string | undefined, language: Language): string {
  if (language === 'vi') {
    return 'Đồng Lòng Vượt Ngưỡng 100 Reps';
  }
  return 'Synergy Threshold 100 Reps';
}

/**
 * Localize Co-op Mission Description
 */
export function getMissionDesc(description: string | undefined, language: Language): string {
  if (language === 'vi') {
    return 'Cả hai bạn cùng tập luyện và đóng góp tổng cộng ít nhất 100 reps hôm nay.';
  }
  return 'Both partners train together and contribute at least 100 total reps today.';
}

/**
 * Localize Fitness Level
 */
export function getFitnessLevelLabel(level: string | undefined, language: Language): string {
  if (!level) return '';
  const upper = level.toUpperCase();
  if (language === 'vi') {
    switch (upper) {
      case 'BEGINNER': return 'Mới bắt đầu';
      case 'NOVICE': return 'Nhập môn';
      case 'INTERMEDIATE': return 'Trung cấp';
      case 'ADVANCED': return 'Nâng cao';
      default: return level;
    }
  }
  switch (upper) {
    case 'BEGINNER': return 'Beginner';
    case 'NOVICE': return 'Novice';
    case 'INTERMEDIATE': return 'Intermediate';
    case 'ADVANCED': return 'Advanced';
    default: return level;
  }
}

/**
 * Localize Primary Goal
 */
export function getGoalLabel(goal: string | undefined, language: Language): string {
  if (!goal) return '';
  const upper = goal.toUpperCase();
  if (language === 'vi') {
    switch (upper) {
      case 'FAT_LOSS': return 'Giảm mỡ';
      case 'MUSCLE_GAIN': return 'Tăng cơ';
      case 'ENDURANCE': return 'Sức bền';
      case 'GENERAL_FITNESS': return 'Thể lực tổng hợp';
      default: return goal;
    }
  }
  switch (upper) {
    case 'FAT_LOSS': return 'Fat Loss';
    case 'MUSCLE_GAIN': return 'Muscle Gain';
    case 'ENDURANCE': return 'Endurance';
    case 'GENERAL_FITNESS': return 'General Fitness';
    default: return goal;
  }
}
