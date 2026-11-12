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

export const EXERCISES_I18N: Record<string, { vi: string; en: string }> = {
  'wall-pushup': { vi: 'Chống Đẩy Tường', en: 'Wall Push-Up' },
  'knee-pushup': { vi: 'Chống Đẩy Quỳ Gối', en: 'Knee Push-Up' },
  'standard-pushup': { vi: 'Chống Đẩy Tiêu Chuẩn', en: 'Standard Push-Up' },
  'diamond-pushup': { vi: 'Chống Đẩy Kim Cương', en: 'Diamond Push-Up' },
  'decline-pushup': { vi: 'Chống Đẩy Dốc Chân Lên Ghế', en: 'Decline Push-Up' },
  'chair-squat': { vi: 'Ngồi Ghế Đứng Dậy', en: 'Chair Box Squat' },
  'bodyweight-squat': { vi: 'Squat Tự Thân', en: 'Bodyweight Squat' },
  'bulgarian-split-squat': { vi: 'Squat 1 Chân Kê Ghế', en: 'Bulgarian Split Squat' },
  'glute-bridge': { vi: 'Cầu Mông Trên Thảm', en: 'Glute Bridge' },
  'single-leg-bridge': { vi: 'Cầu Mông 1 Chân', en: 'Single-Leg Glute Bridge' },
  'backpack-squat': { vi: 'Squat Tải Trọng Balo', en: 'Backpack Weighted Squat' },
  'towel-door-row': { vi: 'Kéo Khăn Cửa Phòng', en: 'Towel Door Row' },
  'table-inverted-row': { vi: 'Hít Kéo Dưới Bàn Ăn', en: 'Table Inverted Row' },
  'doorframe-row': { vi: 'Kéo Khung Cửa 1 Tay', en: 'Single-Arm Doorframe Row' },
  'chair-dips': { vi: 'Chống Đẩy Nhún Ghế', en: 'Chair Tricep Dips' },
  'bottle-lateral-raise': { vi: 'Dang Vai Chai Nước', en: 'Water Bottle Lateral Raise' },
  'pike-pushup': { vi: 'Chống Đẩy Vai Chữ V', en: 'Pike Push-Up' },
  'forearm-plank': { vi: 'Plank Cẳng Tay', en: 'Forearm Plank' },
  'hollow-body-hold': { vi: 'Gồng Lõi Thuyền Nan', en: 'Hollow Body Hold' },
  'dead-bug': { vi: 'Bọ Ngửa Kiểm Soát', en: 'Dead Bug' },
  'bird-dog': { vi: 'Chim Chó Giữ Thăng Bằng', en: 'Bird Dog' },
  'mountain-climbers': { vi: 'Leo Núi Tại Chỗ', en: 'Mountain Climbers' },
  'burpees': { vi: 'Burpees Đốt Mỡ Cường Độ Cao', en: 'High-Intensity Burpees' },
};

export function cleanParentheses(text: string): string {
  if (!text) return '';
  return text.replace(/\s*\([^)]*\)/g, '').trim();
}

export function getShopItemName(item: { id?: string; name?: string }, language: Language): string {
  if (!item) return '';
  const mapped = item.id ? SHOP_ITEMS_I18N[item.id] : undefined;
  if (mapped) {
    return mapped.name[language] || mapped.name.vi;
  }
  return cleanParentheses(item.name || '');
}

export function getShopItemDesc(item: { id?: string; description?: string }, language: Language): string {
  if (!item) return '';
  const mapped = item.id ? SHOP_ITEMS_I18N[item.id] : undefined;
  if (mapped && mapped.description) {
    return mapped.description[language] || mapped.description.vi;
  }
  return cleanParentheses(item.description || '');
}

export function getExerciseName(
  exercise: { id?: string; slug?: string; name?: string } | null | undefined,
  language: Language,
): string {
  if (!exercise) return '';
  const slugOrId = exercise.slug || (exercise.id?.replace(/^ex-/, '')) || '';
  const mapped = EXERCISES_I18N[slugOrId] || (exercise.id ? EXERCISES_I18N[exercise.id] : undefined);
  if (mapped) {
    return mapped[language] || mapped.vi;
  }
  return cleanParentheses(exercise.name || '');
}

export function getWorkoutPlanTitle(title: string | undefined, language: Language): string {
  if (!title) return '';
  const cleaned = cleanParentheses(title);
  if (language === 'vi') return cleaned;

  const translatePrefix = (str: string) =>
    str
      .replace('⚡ Tăng Tốc: ', '⚡ Accelerated: ')
      .replace('🛡️ Phục Hồi & Kiểm Soát: ', '🛡️ Recovery & Control: ')
      .replace('🔥 Giáo Án Thể Lực: ', '🔥 Fitness Routine: ');

  if (cleaned.includes('Đốt Mỡ Toàn Thân')) {
    return translatePrefix(cleaned.replace('Đốt Mỡ Toàn Thân', 'Full-Body Calorie Burn'));
  }
  if (cleaned.includes('Phát Triển Cơ Bắp Tại Nhà')) {
    return translatePrefix(cleaned.replace('Phát Triển Cơ Bắp Tại Nhà', 'Home Muscle Hypertrophy'));
  }
  if (cleaned.includes('Sức Bền & Thể Lực Vượt Trội')) {
    return translatePrefix(cleaned.replace('Sức Bền & Thể Lực Vượt Trội', 'Stamina & Athletic Endurance'));
  }
  if (cleaned.includes('Vận Động Toàn Diện & Khớp Linh Hoạt')) {
    return translatePrefix(cleaned.replace('Vận Động Toàn Diện & Khớp Linh Hoạt', 'Full Mobility & Joint Health'));
  }
  if (cleaned.includes('Đốt Cháy Cơ Lõi & Giãn Cơ Phục Hồi')) {
    return cleaned
      .replace('⚡ Bài Tập Bổ Trợ: ', '⚡ Auxiliary Finisher: ')
      .replace('Đốt Cháy Cơ Lõi & Giãn Cơ Phục Hồi', 'Core Burnout & Recovery Stretch');
  }
  if (cleaned === 'Calisthenics Hằng Ngày') {
    return 'Daily Calisthenics Routine';
  }
  return cleaned;
}

export function getAiExplanation(
  explanation: string | undefined,
  adaptationType: string | undefined,
  language: Language,
  explanationEn?: string,
): string {
  const cleanTag = (text: string) => text.replace(/\[HYBRID-AI\]\s*/g, '').trim();

  if (language === 'en' && explanationEn) {
    return cleanTag(explanationEn);
  }
  if (language === 'vi' && explanation) {
    return cleanTag(explanation);
  }

  if (language === 'vi') {
    if (adaptationType === 'REGRESSION') {
      return 'Buổi tập trước bạn cảm thấy Quá Sức. AI tự động giảm tải an toàn, chuyển sang biến thể nhẹ hơn và tăng thời gian nghỉ ngơi để hồi phục cơ bắp.';
    }
    if (adaptationType === 'PROGRESSION') {
      return 'Buổi tập trước bạn đánh giá Quá Dễ. AI tự động nâng cấp biến thể bài tập và tăng 15% số lần lặp lại để kích thích cơ bắp phát triển.';
    }
    if (adaptationType === 'INITIAL_CALIBRATION') {
      return 'Hệ thống phân tích thể lực khởi đầu và loại trừ an toàn các vùng chấn thương để thiết lập giáo án cá nhân hóa.';
    }
    return 'Buổi tập trước bạn hoàn thành ở mức Vừa Sức. AI giữ nguyên biến thể chuẩn và tăng nhẹ 1 lần lặp lại để duy trì quá tải lũy tiến.';
  }

  if (adaptationType === 'REGRESSION') {
    return 'You felt overexerted in your last workout. AI automatically scaled down to safe exercise regressions and extended rest intervals for muscle recovery.';
  }
  if (adaptationType === 'PROGRESSION') {
    return 'You rated your last workout as Easy. AI automatically upgraded exercise variations and increased reps by 15% to stimulate muscle growth.';
  }
  if (adaptationType === 'INITIAL_CALIBRATION') {
    return 'System analyzed your baseline fitness and excluded all injured joint areas to construct a safe, personalized routine.';
  }
  return 'You achieved optimal exertion in your last workout. AI maintained standard variations and added 1 rep to sustain progressive overload.';
}

export function getMissionTitle(_title: string | undefined, language: Language): string {
  return language === 'vi' ? 'Đồng Lòng Vượt Ngưỡng 100 Reps' : 'Synergy Threshold 100 Reps';
}

export function getMissionDesc(_description: string | undefined, language: Language): string {
  return language === 'vi'
    ? 'Cả hai bạn cùng tập luyện và đóng góp tổng cộng ít nhất 100 reps hôm nay.'
    : 'Both partners train together and contribute at least 100 total reps today.';
}

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

export function getGoalLabel(
  goal: string | undefined,
  language: Language,
  variant: 'short' | 'long' = 'short',
): string {
  if (!goal) return '';
  const upper = goal.toUpperCase();
  if (language === 'vi') {
    if (variant === 'long') {
      switch (upper) {
        case 'FAT_LOSS': return 'Giảm Mỡ & Săn Chắc';
        case 'MUSCLE_GAIN': return 'Tăng Cơ & Sức Mạnh';
        case 'ENDURANCE': return 'Tăng Sức Bền Tim Mạch';
        case 'MOBILITY': return 'Linh Hoạt & Phục Hồi Khớp';
        default: return 'Duy Trì Thể Lực Toàn Diện';
      }
    }
    switch (upper) {
      case 'FAT_LOSS': return 'Giảm mỡ';
      case 'MUSCLE_GAIN': return 'Tăng cơ';
      case 'ENDURANCE': return 'Sức bền';
      case 'MOBILITY': return 'Linh hoạt & Phục hồi';
      case 'MAINTENANCE':
      case 'GENERAL_FITNESS': return 'Thể lực tổng hợp';
      default: return goal;
    }
  }

  if (variant === 'long') {
    switch (upper) {
      case 'FAT_LOSS': return 'Fat Loss & Conditioning';
      case 'MUSCLE_GAIN': return 'Muscle & Strength Gain';
      case 'ENDURANCE': return 'Endurance & Stamina';
      case 'MOBILITY': return 'Mobility & Joint Recovery';
      default: return 'Balanced Fitness Maintenance';
    }
  }
  switch (upper) {
    case 'FAT_LOSS': return 'Fat Loss';
    case 'MUSCLE_GAIN': return 'Muscle Gain';
    case 'ENDURANCE': return 'Endurance';
    case 'MOBILITY': return 'Mobility & Recovery';
    case 'MAINTENANCE':
    case 'GENERAL_FITNESS': return 'General Fitness';
    default: return goal;
  }
}

const INJURY_LABELS: Record<string, { vi: string; en: string }> = {
  WRIST: { vi: 'Cổ tay', en: 'Wrist' },
  KNEE: { vi: 'Đầu gối', en: 'Knee' },
  SHOULDER: { vi: 'Bả vai', en: 'Shoulder' },
  LOWER_BACK: { vi: 'Lưng dưới', en: 'Lower Back' },
  NECK: { vi: 'Cổ', en: 'Neck' },
  ELBOW: { vi: 'Khuỷu tay', en: 'Elbow' },
  ANKLE: { vi: 'Cổ chân', en: 'Ankle' },
};

export function formatInjuryBadge(rawInjury: string, language: Language): string {
  if (!rawInjury) return '';
  const trimmed = rawInjury.trim();
  if (trimmed.toUpperCase().startsWith('OTHER:')) {
    const customText = trimmed.slice(6).replace(/;/g, ',').trim();
    if (!customText) return language === 'vi' ? 'Sức khỏe khác' : 'Other condition';
    return language === 'vi' ? `Khác (${customText})` : `Other (${customText})`;
  }
  const upper = trimmed.toUpperCase();
  const mapped = INJURY_LABELS[upper];
  if (mapped) {
    return mapped[language];
  }
  return trimmed;
}

export function formatInjuryList(injuries: string[] | undefined, language: Language): string {
  if (!injuries || injuries.length === 0) return '';
  return injuries
    .map((item) => formatInjuryBadge(item, language))
    .filter(Boolean)
    .join(' • ');
}

export function removeVietnameseDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

const VIETNAMESE_NAME_TOKENS: Record<string, string> = {
  pham: 'Phạm',
  tung: 'Tùng',
  phong: 'Phong',
  nguyen: 'Nguyễn',
  tran: 'Trần',
  le: 'Lê',
  huynh: 'Huỳnh',
  hoang: 'Hoàng',
  phan: 'Phan',
  vu: 'Vũ',
  vo: 'Võ',
  dang: 'Đặng',
  bui: 'Bùi',
  do: 'Đỗ',
  ho: 'Hồ',
  ngo: 'Ngô',
  duong: 'Dương',
  ly: 'Lý',
  trinh: 'Trịnh',
  dinh: 'Đinh',
  doan: 'Đoàn',
  luong: 'Lương',
  phuong: 'Phương',
  duc: 'Đức',
  tuan: 'Tuấn',
  huy: 'Huy',
  khanh: 'Khánh',
  thao: 'Thảo',
  linh: 'Linh',
  minh: 'Minh',
  anh: 'Anh',
  hung: 'Hùng',
  dung: 'Dũng',
  cuong: 'Cường',
  thang: 'Thắng',
  thanh: 'Thành',
  dat: 'Đạt',
  phat: 'Phát',
  kiet: 'Kiệt',
  khoa: 'Khoa',
  long: 'Long',
  nam: 'Nam',
  quan: 'Quân',
  son: 'Sơn',
  tam: 'Tâm',
  thien: 'Thiên',
  thinh: 'Thịnh',
  tien: 'Tiến',
  toan: 'Toàn',
  trung: 'Trung',
  truong: 'Trường',
  viet: 'Việt',
  vinh: 'Vĩnh',
  vy: 'Vy',
  ngoc: 'Ngọc',
  uyen: 'Uyên',
  quynh: 'Quỳnh',
  trang: 'Trang',
  hien: 'Hiền',
  huong: 'Hương',
  ha: 'Hà',
  hai: 'Hải',
  han: 'Hân',
  hieu: 'Hiếu',
  nghia: 'Nghĩa',
  nhan: 'Nhân',
  phuc: 'Phúc',
  loc: 'Lộc',
  tai: 'Tài',
};

export function formatPersonName(name: string | undefined, language: Language): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  if (language === 'en') {
    return removeVietnameseDiacritics(trimmed);
  }

  if (removeVietnameseDiacritics(trimmed) !== trimmed) {
    return trimmed;
  }

  return trimmed
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      const mapped = VIETNAMESE_NAME_TOKENS[lower];
      if (!mapped) return word;
      if (word === word.toUpperCase() && word.length > 1) {
        return mapped.toUpperCase();
      }
      return mapped;
    })
    .join(' ');
}
