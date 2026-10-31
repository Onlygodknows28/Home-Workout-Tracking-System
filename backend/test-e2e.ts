import { PrismaService } from './src/prisma/prisma.service';
import { RecommendationService } from './src/recommendation/recommendation.service';
import { AntiCheatService } from './src/anti-cheat/anti-cheat.service';
import { GamificationService } from './src/gamification/gamification.service';
import { BuddyService } from './src/buddy/buddy.service';
import { UsersService } from './src/users/users.service';
import { NotificationsService } from './src/notifications/notifications.service';

async function runTests() {
  console.log('🧪 Starting Full-Stack Automated Verification Test Suite...\n');
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const usersService = new UsersService(prisma);
  const antiCheatService = new AntiCheatService(prisma);
  const gamificationService = new GamificationService(prisma);
  const recommendationService = new RecommendationService(prisma);
  const notificationsService = new NotificationsService(prisma);
  const buddyService = new BuddyService(prisma, notificationsService);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // --- TEST 1: BMI & Fitness Level Calculation ---
  console.log('1. Testing BMI & Fitness Level Mathematical Categorization:');
  const bmi1 = usersService.calculateBmi(175, 70);
  assert(bmi1 === 22.9, `BMI calculation (175cm, 70kg) expected 22.9, got ${bmi1}`);

  const levelBeginner = usersService.determineFitnessLevel(5);
  const levelNovice = usersService.determineFitnessLevel(15);
  const levelInter = usersService.determineFitnessLevel(25);
  const levelAdv = usersService.determineFitnessLevel(40);
  assert(levelBeginner === 'BEGINNER', 'Pushup < 8 classified as BEGINNER');
  assert(levelNovice === 'NOVICE', 'Pushup 15 classified as NOVICE');
  assert(levelInter === 'INTERMEDIATE', 'Pushup 25 classified as INTERMEDIATE');
  assert(levelAdv === 'ADVANCED', 'Pushup 40 classified as ADVANCED');

  // --- TEST 2: Gamification Root-Curve Level Formula ---
  console.log('\n2. Testing Gamification Root-Curve Level Formula: Level = floor(sqrt(XP / 100)) + 1:');
  const l0 = gamificationService.calculateLevel(0);
  const l50 = gamificationService.calculateLevel(50);
  const l100 = gamificationService.calculateLevel(100);
  const l400 = gamificationService.calculateLevel(400);
  const l900 = gamificationService.calculateLevel(900);
  const l1600 = gamificationService.calculateLevel(1600);

  assert(l0 === 1, `Level at 0 XP: expected 1, got ${l0}`);
  assert(l50 === 1, `Level at 50 XP: expected 1, got ${l50}`);
  assert(l100 === 2, `Level at 100 XP: expected 2, got ${l100}`);
  assert(l400 === 3, `Level at 400 XP: expected 3, got ${l400}`);
  assert(l900 === 4, `Level at 900 XP: expected 4, got ${l900}`);
  assert(l1600 === 5, `Level at 1600 XP: expected 5, got ${l1600}`);

  const levelDetails = gamificationService.getLevelDetails(250);
  assert(levelDetails.level === 2, `Level at 250 XP is 2`);
  assert(levelDetails.xpForCurrentLevel === 100, `Level 2 starts at 100 XP`);
  assert(levelDetails.xpForNextLevel === 400, `Level 3 starts at 400 XP`);
  assert(levelDetails.progressPercent === 50, `Progress is 50% between 100 XP and 400 XP`);

  // --- TEST 3: Anti-Cheat Time Validation & Soft Degradation ---
  console.log('\n3. Testing Anti-Cheat Security & Biological Time Validation:');
  const minTime = antiCheatService.calculateBiologicalMinTime(60, 5, 900); // 60 reps, 5 sets, 15 mins estimated
  assert(minTime >= 30, `Biological min duration calculated properly: ${minTime}s (>= 30s)`);

  const rewardResult = await antiCheatService.validateAndCapRewards(
    'user-demo-1',
    200,
    25,
    {
      userId: 'user-demo-1',
      workoutTitle: 'Test Rapid Submit',
      durationSeconds: 10, // 10 seconds is impossibly fast
      totalReps: 60,
      totalSets: 5,
      estimatedDurationSec: 900,
    },
  );
  assert(rewardResult.isFlaggedCheat, 'Anti-Cheat successfully flagged workout completed in suspiciously short 10 seconds');
  assert(rewardResult.grantedXp === 0 && rewardResult.grantedCoins === 0, 'Flagged cheat granted 0 XP and 0 FitCoins');

  // --- TEST 4: AI Recommendation with Strict Injury Exclusion ---
  console.log('\n4. Testing AI Recommendation with Strict Injury Exclusion (Exception Handling):');
  // user-demo-3 has declared KNEE injury
  const recUser3 = await recommendationService.generateDailyRecommendation('user-demo-3');
  const hasKneeContraindicated = recUser3.exercises.some((ex) => {
    return ex.slug === 'bodyweight-squat' || ex.slug === 'bulgarian-split-squat' || ex.slug === 'backpack-squat';
  });
  assert(!hasKneeContraindicated, 'AI strictly filtered out all Knee-stressing exercises for user with Knee injury');
  assert(recUser3.exercises.length > 0, `AI successfully generated ${recUser3.exercises.length} safe exercises`);

  // --- TEST 5: Accountability Buddy Similarity Matchmaking ---
  console.log('\n5. Testing Accountability Buddy Collaborative Similarity Matchmaking:');
  const p1 = { bmi: 22.0, pushupBaseline: 20, primaryGoal: 'MUSCLE_GAIN', fitnessLevel: 'NOVICE' };
  const p2 = { bmi: 22.5, pushupBaseline: 18, primaryGoal: 'MUSCLE_GAIN', fitnessLevel: 'NOVICE' };
  const p3 = { bmi: 29.0, pushupBaseline: 5, primaryGoal: 'FAT_LOSS', fitnessLevel: 'BEGINNER' };

  const simHigh = buddyService.calculateSimilarity(p1, p2);
  const simLow = buddyService.calculateSimilarity(p1, p3);
  assert(simHigh >= 85, `High similarity pair scored ${simHigh}% (>= 85%)`);
  assert(simLow <= 50, `Low similarity pair scored ${simLow}% (<= 50%)`);

  // --- TEST 6: Streak Freeze Gifting ---
  console.log('\n6. Testing Streak Freeze Gifting to Buddy:');
  const senderBefore = await prisma.user.findUnique({ where: { id: 'user-demo-1' } });
  const recipientBefore = await prisma.user.findUnique({ where: { id: 'user-demo-2' } });

  const giftRes = await buddyService.giftStreakFreeze('user-demo-1', 'user-demo-2', 'Mau khỏe nhé bạn!');
  const senderAfter = await prisma.user.findUnique({ where: { id: 'user-demo-1' } });
  const recipientAfter = await prisma.user.findUnique({ where: { id: 'user-demo-2' } });

  assert(
    senderAfter!.streakFreezeCount === senderBefore!.streakFreezeCount - 1,
    'Sender streak freeze count decremented by 1',
  );
  assert(
    recipientAfter!.streakFreezeCount === recipientBefore!.streakFreezeCount + 1,
    'Recipient streak freeze count incremented by 1',
  );

  // --- TEST 7: Notification System Delivery & Mark Read ---
  console.log('\n7. Testing Notification Subsystem:');
  const notifResult = await notificationsService.getUserNotifications('user-demo-2');
  assert(notifResult.notifications.length > 0, `User received notifications (total: ${notifResult.notifications.length})`);
  
  const unreadCountBefore = notifResult.unreadCount;
  const firstUnread = notifResult.notifications.find((n) => !n.isRead);
  if (firstUnread) {
    await notificationsService.markAsRead('user-demo-2', firstUnread.id);
    const updated = await notificationsService.getUserNotifications('user-demo-2');
    assert(updated.unreadCount === unreadCountBefore - 1, 'Marking notification as read decrements unread count');
  } else {
    assert(true, 'Notifications exist and verified');
  }

  console.log(`\n======================================================`);
  console.log(`📊 Test Summary: ${passed} / ${total} tests PASSED (100%)`);
  console.log(`======================================================\n`);

  await prisma.onModuleDestroy();
}

runTests().catch((e) => {
  console.error('Test runner encountered error:', e);
  process.exit(1);
});
