import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export const SHOP_ITEMS = [
  {
    id: 'item-freeze-1',
    name: 'Thẻ Bảo Vệ Chuỗi',
    description: 'Tự động bảo vệ chuỗi tập luyện của bạn nếu lỡ nghỉ ngơi 1 ngày mà không bị mất streak.',
    priceCoins: 50,
    itemType: 'STREAK_FREEZE',
    icon: '🛡️',
    isConsumable: true,
  },
  {
    id: 'item-avatar-gold',
    name: 'Khung Avatar Hoàng Kim',
    description: 'Khung ảnh đại diện phát sáng vàng dành cho những chiến binh kỷ luật hàng đầu.',
    priceCoins: 120,
    itemType: 'AVATAR_FRAME',
    icon: '👑',
    isConsumable: false,
  },
  {
    id: 'item-badge-titanium',
    name: 'Huy Hiệu Titan Thể Lực',
    description: 'Huy chương danh giá gắn vào trang cá nhân thể hiện sự bền bỉ.',
    priceCoins: 200,
    itemType: 'BADGE',
    icon: '🎖️',
    isConsumable: false,
  },
  {
    id: 'item-title-beast',
    name: 'Danh Hiệu Bất Khả Chiến Bại',
    description: 'Danh hiệu hiển thị kế bên tên người dùng trong bảng xếp hạng bạn bè.',
    priceCoins: 300,
    itemType: 'TITLE',
    icon: '⚡',
    isConsumable: false,
  },
];

export const EXERCISES = [
  // --- CHEST ---
  {
    id: 'ex-wall-pushup',
    name: 'Chống Đẩy Tường',
    slug: 'wall-pushup',
    description: 'Biến thể khởi đầu cực kỳ an toàn, giảm áp lực cổ tay và khớp vai.',
    primaryMuscle: 'CHEST',
    secondaryMuscles: 'ARMS,SHOULDERS',
    equipment: 'BODYWEIGHT',
    difficulty: 1,
    progressionId: 'ex-knee-pushup',
    regressionId: null,
    contraindicatedInjuries: '',
    defaultReps: 15,
    defaultSets: 3,
    restSeconds: 30,
    instructions: 'Đứng cách tường 1 sải tay, đặt hai lòng bàn tay lên tường và gập khuỷu tay từ từ.',
  },
  {
    id: 'ex-knee-pushup',
    name: 'Chống Đẩy Quỳ Gối',
    slug: 'knee-pushup',
    description: 'Bài tập nhập môn xây dựng lực đẩy ngực và tay sau mà không quá nặng.',
    primaryMuscle: 'CHEST',
    secondaryMuscles: 'ARMS,CORE',
    equipment: 'BODYWEIGHT',
    difficulty: 2,
    progressionId: 'ex-std-pushup',
    regressionId: 'ex-wall-pushup',
    contraindicatedInjuries: 'KNEE,WRIST',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Chống hai gối xuống sàn, giữ thẳng lưng từ đầu đến gối, hạ ngực gần chạm đất rồi đẩy lên.',
  },
  {
    id: 'ex-std-pushup',
    name: 'Chống Đẩy Tiêu Chuẩn',
    slug: 'standard-pushup',
    description: 'Bài tập nền tảng kinh điển phát triển cơ ngực, vai trước và tay sau.',
    primaryMuscle: 'CHEST',
    secondaryMuscles: 'SHOULDERS,ARMS,CORE',
    equipment: 'BODYWEIGHT',
    difficulty: 3,
    progressionId: 'ex-diamond-pushup',
    regressionId: 'ex-knee-pushup',
    contraindicatedInjuries: 'WRIST,SHOULDER',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Giữ thân người thẳng như tấm ván (Plank), hạ ngực cách sàn 2-3cm rồi đẩy mạnh lên.',
  },
  {
    id: 'ex-diamond-pushup',
    name: 'Chống Đẩy Kim Cương',
    slug: 'diamond-pushup',
    description: 'Tập trung cao độ vào ngực trong và toàn bộ cơ tam đầu bắp tay sau.',
    primaryMuscle: 'CHEST',
    secondaryMuscles: 'ARMS',
    equipment: 'BODYWEIGHT',
    difficulty: 4,
    progressionId: 'ex-decline-pushup',
    regressionId: 'ex-std-pushup',
    contraindicatedInjuries: 'WRIST,ELBOW',
    defaultReps: 10,
    defaultSets: 3,
    restSeconds: 60,
    instructions: 'Chụm hai ngón cái và hai ngón trỏ tạo hình thoi/kim cương, hạ ngực chạm đỉnh bàn tay.',
  },
  {
    id: 'ex-decline-pushup',
    name: 'Chống Đẩy Dốc Chân Lên Ghế',
    slug: 'decline-pushup',
    description: 'Sử dụng ghế gia đình kê chân để dồn trọng lực vào phần ngực trên và cơ vai.',
    primaryMuscle: 'CHEST',
    secondaryMuscles: 'SHOULDERS,CORE',
    equipment: 'CHAIR',
    difficulty: 4,
    progressionId: null,
    regressionId: 'ex-std-pushup',
    contraindicatedInjuries: 'WRIST,SHOULDER',
    defaultReps: 10,
    defaultSets: 3,
    restSeconds: 60,
    instructions: 'Đặt hai mũi chân lên ghế, hai tay chống trên sàn rộng bằng vai và hạ người xuống.',
  },

  // --- LEGS ---
  {
    id: 'ex-chair-squat',
    name: 'Ngồi Ghế Đứng Dậy',
    slug: 'chair-squat',
    description: 'Biến thể cực êm cho khớp gối, học chuyển động bản lề hông chính xác.',
    primaryMuscle: 'LEGS',
    secondaryMuscles: 'CORE',
    equipment: 'CHAIR',
    difficulty: 1,
    progressionId: 'ex-bodyweight-squat',
    regressionId: null,
    contraindicatedInjuries: '',
    defaultReps: 15,
    defaultSets: 3,
    restSeconds: 30,
    instructions: 'Đứng trước ghế, hạ hông chạm nhẹ mặt ghế rồi đứng thẳng dậy gồng cơ đùi.',
  },
  {
    id: 'ex-bodyweight-squat',
    name: 'Squat Tự Thân',
    slug: 'bodyweight-squat',
    description: 'Vua của các bài tập thân dưới: phát triển đùi trước, đùi sau và cơ mông săn chắc.',
    primaryMuscle: 'LEGS',
    secondaryMuscles: 'CORE',
    equipment: 'BODYWEIGHT',
    difficulty: 2,
    progressionId: 'ex-bulgarian-split-squat',
    regressionId: 'ex-chair-squat',
    contraindicatedInjuries: 'KNEE',
    defaultReps: 15,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Chân rộng bằng vai, mũi chân xoay nhẹ 15 độ, đẩy hông ra sau và hạ đùi song song mặt sàn.',
  },
  {
    id: 'ex-bulgarian-split-squat',
    name: 'Squat 1 Chân Kê Ghế',
    slug: 'bulgarian-split-squat',
    description: 'Cô lập từng bên chân với sự hỗ trợ của ghế sinh hoạt, kích thích cơ mông và đùi tối đa.',
    primaryMuscle: 'LEGS',
    secondaryMuscles: 'CORE',
    equipment: 'CHAIR',
    difficulty: 4,
    progressionId: 'ex-pistol-squat-progression',
    regressionId: 'ex-bodyweight-squat',
    contraindicatedInjuries: 'KNEE,ANKLE',
    defaultReps: 10,
    defaultSets: 3,
    restSeconds: 60,
    instructions: 'Gác một mu bàn chân lên ghế phía sau, hạ gối trước vuông góc 90 độ rồi đạp lên.',
  },
  {
    id: 'ex-glute-bridge',
    name: 'Cầu Mông Trên Thảm',
    slug: 'glute-bridge',
    description: 'Bài tập 100% không gây áp lực lên đầu gối, kích hoạt mạnh mẽ chuỗi cơ sau.',
    primaryMuscle: 'LEGS',
    secondaryMuscles: 'CORE,LOWER_BACK',
    equipment: 'BODYWEIGHT',
    difficulty: 2,
    progressionId: 'ex-single-leg-bridge',
    regressionId: null,
    contraindicatedInjuries: '',
    defaultReps: 15,
    defaultSets: 3,
    restSeconds: 40,
    instructions: 'Nằm ngửa, gập gối, siết mông đẩy hông lên cao cho đến khi thân người tạo thành đường thẳng.',
  },
  {
    id: 'ex-single-leg-bridge',
    name: 'Cầu Mông 1 Chân',
    slug: 'single-leg-bridge',
    description: 'Gấp đôi cường độ cho nhóm cơ mông và đùi sau, khắc phục mất cân bằng cơ thể.',
    primaryMuscle: 'LEGS',
    secondaryMuscles: 'CORE',
    equipment: 'BODYWEIGHT',
    difficulty: 3,
    progressionId: null,
    regressionId: 'ex-glute-bridge',
    contraindicatedInjuries: '',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Giơ thẳng một chân lên không trung, dùng chân còn lại đạp sàn đẩy hông lên cao.',
  },
  {
    id: 'ex-backpack-squat',
    name: 'Squat Tải Trọng Balo',
    slug: 'backpack-squat',
    description: 'Tận dụng balo chứa sách/chai nước để tăng tải trọng tập luyện tại gia.',
    primaryMuscle: 'LEGS',
    secondaryMuscles: 'CORE',
    equipment: 'BACKPACK',
    difficulty: 3,
    progressionId: 'ex-bulgarian-split-squat',
    regressionId: 'ex-bodyweight-squat',
    contraindicatedInjuries: 'KNEE,LOWER_BACK',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 50,
    instructions: 'Đeo balo trước ngực hoặc sau lưng, thực hiện squat kiểm soát nhịp nhàng.',
  },

  // --- BACK & PULL ---
  {
    id: 'ex-towel-door-row',
    name: 'Kéo Khăn Cửa Phòng',
    slug: 'towel-door-row',
    description: 'Tận dụng khăn tắm quàng qua nắm cửa phòng để tạo chuyển động kéo phát triển cơ xô lưng.',
    primaryMuscle: 'BACK',
    secondaryMuscles: 'ARMS,CORE',
    equipment: 'TOWEL',
    difficulty: 2,
    progressionId: 'ex-table-inverted-row',
    regressionId: null,
    contraindicatedInjuries: '',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Quấn khăn quanh nắm cửa chắc chắn, ngả người ra sau và dùng lực lưng kéo ngực vào cửa.',
  },
  {
    id: 'ex-table-inverted-row',
    name: 'Hít Kéo Dưới Bàn Ăn',
    slug: 'table-inverted-row',
    description: 'Chuyển động Calisthenics kéo xô lưng cực mạnh sử dụng cạnh bàn ăn gia đình.',
    primaryMuscle: 'BACK',
    secondaryMuscles: 'ARMS,CORE',
    equipment: 'CHAIR',
    difficulty: 4,
    progressionId: null,
    regressionId: 'ex-towel-door-row',
    contraindicatedInjuries: 'WRIST,LOWER_BACK',
    defaultReps: 8,
    defaultSets: 3,
    restSeconds: 60,
    instructions: 'Nằm dưới gầm bàn ăn vững chãi, bám tay mép bàn và kéo ngực sát lên mặt bàn.',
  },
  {
    id: 'ex-doorframe-row',
    name: 'Kéo Khung Cửa 1 Tay',
    slug: 'doorframe-row',
    description: 'Bám vào mép khung cửa để tập luyện cơ lưng từng bên mà không cần dụng cụ.',
    primaryMuscle: 'BACK',
    secondaryMuscles: 'ARMS',
    equipment: 'DOOR_FRAME',
    difficulty: 3,
    progressionId: 'ex-table-inverted-row',
    regressionId: 'ex-towel-door-row',
    contraindicatedInjuries: '',
    defaultReps: 10,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Bám một tay vào khung cửa, đặt mũi chân sát chân tường và kéo cơ thể về phía trước.',
  },

  // --- SHOULDERS & ARMS ---
  {
    id: 'ex-chair-dips',
    name: 'Chống Đẩy Nhún Ghế',
    slug: 'chair-dips',
    description: 'Sử dụng mép ghế để cô lập bắp tay sau (Triceps) và ngực dưới.',
    primaryMuscle: 'ARMS',
    secondaryMuscles: 'CHEST,SHOULDERS',
    equipment: 'CHAIR',
    difficulty: 2,
    progressionId: null,
    regressionId: 'ex-wall-pushup',
    contraindicatedInjuries: 'SHOULDER,WRIST',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Chống hai tay vào mép ghế phía sau lưng, gập khuỷu tay 90 độ hạ người rồi đẩy thẳng tay lên.',
  },
  {
    id: 'ex-water-bottle-lateral-raise',
    name: 'Dang Vai Chai Nước',
    slug: 'bottle-lateral-raise',
    description: 'Dùng 2 chai nước 1.5L làm tạ nhẹ để tạo hình cầu vai săn chắc và rộng.',
    primaryMuscle: 'SHOULDERS',
    secondaryMuscles: 'ARMS',
    equipment: 'WATER_BOTTLE',
    difficulty: 2,
    progressionId: 'ex-pike-pushup',
    regressionId: null,
    contraindicatedInjuries: 'SHOULDER',
    defaultReps: 15,
    defaultSets: 3,
    restSeconds: 30,
    instructions: 'Cầm hai chai nước ngang hông, nâng ngang hai tay lên song song mặt sàn rồi hạ xuống có kiểm soát.',
  },
  {
    id: 'ex-pike-pushup',
    name: 'Chống Đẩy Vai Chữ V',
    slug: 'pike-pushup',
    description: 'Biến thể nâng cao chuyển toàn bộ trọng lực cơ thể lên nhóm cơ vai.',
    primaryMuscle: 'SHOULDERS',
    secondaryMuscles: 'ARMS,CORE',
    equipment: 'BODYWEIGHT',
    difficulty: 4,
    progressionId: null,
    regressionId: 'ex-std-pushup',
    contraindicatedInjuries: 'SHOULDER,WRIST,NECK',
    defaultReps: 8,
    defaultSets: 3,
    restSeconds: 60,
    instructions: 'Nâng cao mông tạo hình chữ V ngược, hạ đỉnh đầu về phía trước sàn rồi đẩy mạnh lên.',
  },

  // --- CORE & ABS ---
  {
    id: 'ex-plank-hold',
    name: 'Plank Cẳng Tay',
    slug: 'forearm-plank',
    description: 'Bài tập gồng lõi tĩnh kinh điển, củng cố cột sống và bảo vệ cổ tay hoàn hảo.',
    primaryMuscle: 'CORE',
    secondaryMuscles: 'SHOULDERS,LEGS',
    equipment: 'BODYWEIGHT',
    difficulty: 2,
    progressionId: 'ex-hollow-body-hold',
    regressionId: null,
    contraindicatedInjuries: 'LOWER_BACK',
    defaultReps: 45,
    defaultSets: 3,
    restSeconds: 40,
    instructions: 'Tựa cẳng tay lên sàn, siết chặt cơ bụng và cơ mông, giữ người thẳng tắp.',
  },
  {
    id: 'ex-hollow-body-hold',
    name: 'Gồng Lõi Thuyền Nan',
    slug: 'hollow-body-hold',
    description: 'Vũ khí bí mật của vận động viên thể dục dụng cụ để kích hoạt toàn bộ cơ bụng sâu.',
    primaryMuscle: 'CORE',
    secondaryMuscles: 'LEGS',
    equipment: 'BODYWEIGHT',
    difficulty: 4,
    progressionId: null,
    regressionId: 'ex-plank-hold',
    contraindicatedInjuries: 'NECK',
    defaultReps: 30,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Nằm ngửa, ép chặt lưng dưới xuống sàn, nâng vai và hai chân lên tạo hình con thuyền.',
  },
  {
    id: 'ex-dead-bug',
    name: 'Bọ Ngửa Kiểm Soát',
    slug: 'dead-bug',
    description: 'Bài tập phục hồi cốt lõi an toàn tuyệt đối cho người có tiền sử đau lưng dưới.',
    primaryMuscle: 'CORE',
    secondaryMuscles: '',
    equipment: 'BODYWEIGHT',
    difficulty: 1,
    progressionId: 'ex-plank-hold',
    regressionId: null,
    contraindicatedInjuries: '',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 30,
    instructions: 'Nằm ngửa, từ từ hạ tay phải và chân trái xuống gần sàn trong khi lưng dán chặt vào đất.',
  },
  {
    id: 'ex-bird-dog',
    name: 'Chim Chó Giữ Thăng Bằng',
    slug: 'bird-dog',
    description: 'Tăng cường sức mạnh cơ dựng sống lưng và độ ổn định hông, rất tốt cho người đau lưng.',
    primaryMuscle: 'CORE',
    secondaryMuscles: 'LOWER_BACK',
    equipment: 'BODYWEIGHT',
    difficulty: 1,
    progressionId: 'ex-plank-hold',
    regressionId: null,
    contraindicatedInjuries: '',
    defaultReps: 12,
    defaultSets: 3,
    restSeconds: 30,
    instructions: 'Quỳ 4 điểm trên thảm, duỗi thẳng tay phải về trước và chân trái ra sau song song sàn.',
  },

  // --- FULL BODY / METABOLIC ---
  {
    id: 'ex-mountain-climbers',
    name: 'Leo Núi Tại Chỗ',
    slug: 'mountain-climbers',
    description: 'Tăng nhịp tim, đốt cháy calo mãnh liệt và rèn luyện độ dẻo dai cơ lõi.',
    primaryMuscle: 'FULL_BODY',
    secondaryMuscles: 'CORE,SHOULDERS,LEGS',
    equipment: 'BODYWEIGHT',
    difficulty: 3,
    progressionId: 'ex-burpees',
    regressionId: 'ex-dead-bug',
    contraindicatedInjuries: 'WRIST,KNEE',
    defaultReps: 20,
    defaultSets: 3,
    restSeconds: 45,
    instructions: 'Tư thế plank cao, luân phiên co gối về phía ngực với nhịp độ nhanh và dứt khoát.',
  },
  {
    id: 'ex-burpees',
    name: 'Burpees Đốt Mỡ Cường Độ Cao',
    slug: 'burpees',
    description: 'Bài tập toàn thân tiêu hao năng lượng tối đa, cải thiện thể lực bùng nổ.',
    primaryMuscle: 'FULL_BODY',
    secondaryMuscles: 'CHEST,LEGS,CORE',
    equipment: 'BODYWEIGHT',
    difficulty: 5,
    progressionId: null,
    regressionId: 'ex-mountain-climbers',
    contraindicatedInjuries: 'WRIST,KNEE,SHOULDER,LOWER_BACK',
    defaultReps: 10,
    defaultSets: 3,
    restSeconds: 60,
    instructions: 'Từ tư thế đứng nhảy hạ xuống chống đẩy, bật chân về sau, làm 1 nhịp chống đẩy rồi bật cao lên.',
  },
];

export const DEMO_USERS = [
  {
    id: 'user-demo-1',
    email: 'minh.fit@example.com',
    name: 'Minh Hoàng',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    xp: 1450,
    level: 4,
    fitCoins: 120,
    currentStreak: 5,
    highestStreak: 12,
    streakFreezeCount: 2,
    profile: {
      height: 172,
      weight: 66,
      bmi: 22.3,
      pushupBaseline: 22,
      fitnessLevel: 'INTERMEDIATE',
      primaryGoal: 'MUSCLE_GAIN',
      injuries: '',
      availableEquipment: 'BODYWEIGHT,CHAIR,TOWEL,WATER_BOTTLE',
    },
  },
  {
    id: 'user-demo-2',
    email: 'lan.athlete@example.com',
    name: 'Lan Phương',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    xp: 1890,
    level: 5,
    fitCoins: 210,
    currentStreak: 7,
    highestStreak: 15,
    streakFreezeCount: 3,
    profile: {
      height: 162,
      weight: 52,
      bmi: 19.8,
      pushupBaseline: 15,
      fitnessLevel: 'NOVICE',
      primaryGoal: 'FAT_LOSS',
      injuries: 'WRIST',
      availableEquipment: 'BODYWEIGHT,CHAIR,TOWEL',
    },
  },
  {
    id: 'user-demo-3',
    email: 'duy.power@example.com',
    name: 'Trần Đức Duy',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    xp: 850,
    level: 3,
    fitCoins: 85,
    currentStreak: 3,
    highestStreak: 6,
    streakFreezeCount: 1,
    profile: {
      height: 178,
      weight: 78,
      bmi: 24.6,
      pushupBaseline: 18,
      fitnessLevel: 'NOVICE',
      primaryGoal: 'MUSCLE_GAIN',
      injuries: 'KNEE',
      availableEquipment: 'BODYWEIGHT,CHAIR,BACKPACK',
    },
  },
];

async function seedDemoUsersAndBuddy(prisma: PrismaClient, updateExisting: boolean) {
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const u of DEMO_USERS) {
    const { profile, ...userData } = u;
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      create: {
        ...userData,
        password: passwordHash,
      },
      update: updateExisting ? { ...userData } : {},
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...profile,
      },
      update: updateExisting ? { ...profile } : {},
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const buddyPair = await prisma.buddyPair.upsert({
    where: { id: 'pair-demo-1' },
    create: {
      id: 'pair-demo-1',
      user1Id: 'user-demo-1',
      user2Id: 'user-demo-2',
      status: 'ACTIVE',
      sharedStreak: 4,
    },
    update: updateExisting
      ? {
          status: 'ACTIVE',
          sharedStreak: 4,
        }
      : {},
  });

  await prisma.buddyMission.upsert({
    where: { buddyPairId_date: { buddyPairId: buddyPair.id, date: today } },
    create: {
      buddyPairId: buddyPair.id,
      date: today,
      title: 'Đồng Lòng Vượt Ngưỡng (Co-op 100 Reps)',
      description: 'Cả hai bạn cùng tập luyện và đóng góp tổng cộng ít nhất 100 reps hôm nay.',
      targetReps: 100,
      user1Progress: 60,
      user2Progress: 45,
      user1Completed: true,
      user2Completed: true,
      rewardCoins: 25,
      isClaimed: false,
    },
    update: updateExisting
      ? {
          title: 'Đồng Lòng Vượt Ngưỡng (Co-op 100 Reps)',
          targetReps: 100,
        }
      : {},
  });
}

/**
 * Full CLI seed (upserts shop items, exercises, demo accounts, and demo buddy mission).
 */
export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Starting Database Seeding...');

  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✅ Seeded ${SHOP_ITEMS.length} shop items.`);

  for (const ex of EXERCISES) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      create: ex,
      update: ex,
    });
  }
  console.log(`✅ Seeded ${EXERCISES.length} bodyweight & household exercises.`);

  await seedDemoUsersAndBuddy(prisma, true);
  console.log(`✅ Seeded ${DEMO_USERS.length} test accounts with profiles.`);
  console.log('🎉 Seeding successfully completed!');
}

let seedPromise: Promise<void> | null = null;
let hasVerifiedSeed = false;

/**
 * Idempotent startup auto-seed: populates missing catalog items and seeds demo users
 * only when the User table is empty so existing user progress is never overwritten.
 */
export async function ensureSeedData(prisma: PrismaClient, logger?: Logger): Promise<void> {
  if (hasVerifiedSeed) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const [shopCount, exerciseCount, userCount] = await Promise.all([
      prisma.shopItem.count(),
      prisma.exercise.count(),
      prisma.user.count(),
    ]);

    if (shopCount < SHOP_ITEMS.length) {
      await prisma.shopItem.createMany({ data: SHOP_ITEMS, skipDuplicates: true });
      logger?.log(`Auto-seeded ${SHOP_ITEMS.length} shop items.`);
    }

    if (exerciseCount < EXERCISES.length) {
      await prisma.exercise.createMany({ data: EXERCISES, skipDuplicates: true });
      logger?.log(`Auto-seeded ${EXERCISES.length} exercises.`);
    }

    if (userCount === 0) {
      await seedDemoUsersAndBuddy(prisma, false);
      logger?.log(`Auto-seeded ${DEMO_USERS.length} initial demo accounts and buddy mission.`);
    }

    hasVerifiedSeed = true;
  })()
    .catch((err) => {
      seedPromise = null;
      throw err;
    });

  return seedPromise;
}
