'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Nav & Common
    navHome: 'Trang Chủ',
    navServices: 'Dịch Vụ',
    navAbout: 'Giới Thiệu',
    navWorkouts: 'Giáo Án AI',
    navBuddy: 'Bạn Tập',
    navShop: 'Cửa Hàng FitCoin',
    navProfile: 'Hồ Sơ Cá Nhân',
    navLogin: 'Đăng Nhập',
    navRegister: 'Đăng Ký',
    navLogout: 'Đăng Xuất',

    // Hero & Landing
    heroDescription:
      'Chuyển hóa cơ thể với giáo án Calisthenics AI cá nhân hóa, huấn luyện viên thông minh theo RPE và cộng đồng đồng đội luôn thúc đẩy bạn tiến lên.',
    exploreWorkoutsBtn: 'Khám phá bài tập',
    whyChooseUsTitle: 'Lộ Trình 3 Bước Đơn Giản',
    whyChooseUsSubtitle:
      'Từ bài kiểm tra thể lực 60 giây đầu tiên đến giáo án tự động điều chỉnh tải mỗi ngày.',
    step1Title: 'Khởi Tạo Hồ Sơ Thể Lực',
    step1Desc:
      'Đo chỉ số BMI, bài test chống đẩy đầu vào và khai báo vùng khớp cần bảo vệ để AI thiết lập ngưỡng an toàn.',
    step2Title: 'Tập Luyện Với Giant UI',
    step2Desc:
      'Giao diện nút bấm khổng lồ dễ thao tác khi đang đổ mồ hôi, tự động đếm ngược thời gian nghỉ giữa các hiệp.',
    step3Title: 'Đánh Giá RPE & Ghép Đôi',
    step3Desc:
      'Chấm điểm độ khó sau buổi tập để AI tinh chỉnh giáo án ngày mai và cùng bạn tập thắp sáng đèn nhiệm vụ 100 reps.',
    feature1Title: 'AI Thích Ứng Theo RPE',
    feature1Desc:
      'Tự động tăng 15% khối lượng khi bạn thấy nhẹ nhàng và lùi cấp bài tập an toàn khi cơ thể báo hiệu quá tải.',
    feature2Title: 'Calisthenics & Đồ Gia Dụng',
    feature2Desc:
      'Tận dụng trọng lượng cơ thể cùng ghế tựa, khăn tắm và balo sách vở tại nhà — không tốn chi phí phòng gym.',
    feature3Title: 'Bảo Vệ Khớp & Kỷ Luật Đôi',
    feature3Desc:
      'Loại bỏ 100% bài tập gây áp lực lên vùng chấn thương và duy trì chuỗi ngày tập cùng người bạn đồng hành.',
    ctaBannerTitle: 'Sẵn Sàng Bắt Đầu Hành Trình Mới?',
    ctaBannerSubtitle:
      'Thiết lập hồ sơ thể lực chỉ trong 60 giây. Nhận ngay 50 FitCoins và 1 Thẻ Bảo Vệ Chuỗi miễn phí khi đăng ký.',
    startJourneyFreeBtn: 'Bắt Đầu Miễn Phí',
    alreadyHaveAccountBtn: 'Đã Có Tài Khoản',

    // Home Dashboard
    helloAthlete: 'Xin chào',
    goalLabel: 'Mục tiêu',
    completedTodayBadge: 'Đã hoàn thành buổi tập hôm nay',
    startWorkoutNow: 'Vào tập ngay',
    exercisesCount: 'bài tập',
    restSeconds: 'Nghỉ',
    startRoutineBtn: 'Bắt đầu tập ngay',
    giantUiModeDesc: 'Chế độ Giant UI chữ lớn • Tự động bấm giờ nghỉ',
    noRoutineAvailable: 'Chưa có giáo án cho hôm nay. Hãy mở thư viện bài tập để bắt đầu!',
    openLibraryBtn: 'Mở Giáo Án AI',
    oneTapCheckInTitle: 'Check-in Dinh Dưỡng 1 Chạm',
    oneTapCheckInSubtitle: 'Ghi nhận mức năng lượng nạp vào hôm nay để nhận +5 FitCoins',
    calorieDeficit: 'Thâm Hụt Calo',
    calorieDeficitDesc: 'Ăn nhẹ • Ưu tiên giảm mỡ',
    calorieMaintenance: 'Duy Trì Cân Bằng',
    calorieMaintenanceDesc: 'Ăn vừa đủ • Giữ vóc dáng',
    calorieSurplus: 'Thặng Dư Calo',
    calorieSurplusDesc: 'Giàu đạm • Phục hồi & tăng cơ',
    aiTodayTitle: 'Giáo Án Thể Lực Hôm Nay',
    progressionBadge: '⚡ AI Tiến Cấp',
    regressionBadge: '🛡️ AI Lùi Cấp An Toàn',
    optimalBadge: '🔥 Giáo Án Tối Ưu Hóa',
    exercisesList: 'Bài tập',
    sets: 'hiệp',
    reps: 'reps',
    minutes: 'phút',
    startWorkout1Tap: 'BẮT ĐẦU BUỔI TẬP',

    // Leveling & Gamification
    athlete: 'ATHLETE',
    level: 'Cấp',
    xpNeedToNext: 'nữa để thăng cấp',
    streak: 'Streak',
    days: 'ngày',
    fitcoins: 'FitCoins',
    freezes: 'Thẻ Freezes',
    levelFormulaTitle: 'Công Thức Cấp Độ',
    formulaText: 'Công thức: Level = ⌊√(XP / 100)⌋ + 1',
    currentLevelProgress: 'Tiến độ tích lũy',
    quickShopPromo: 'Thẻ Bảo Vệ Chuỗi',
    visitShop: 'VÀO SHOP ĐỔI FITCOIN ➔',

    // Accountability Buddy
    buddyTitle: 'Bạn Tập Đồng Hành Kỷ Luật',
    buddySystemBadge: 'Hệ Thống Bạn Tập Đồng Hành',
    myBuddyTab: 'Bạn Đồng Hành',
    radarTab: 'Radar Ghép Đôi AI',
    noBuddyCardTitle: 'Bạn Chưa Có Bạn Đồng Hành',
    noBuddyCardDesc:
      'Ghép đôi với một người bạn có cùng mục tiêu. Nhiệm vụ đồng đội 100 reps hàng ngày chỉ sáng đèn khi cả hai cùng tập. Cùng nhau giữ chuỗi ngày tập luyện!',
    openRadarBtn: 'MỞ RADAR GHÉP ĐÔI AI ➔',
    totalRepsContributed: 'Tổng reps đóng góp hôm nay',
    you: 'Bạn',
    statusCompleted: 'Đã hoàn thành',
    statusNotDone: 'Chưa tập',
    syncLightBoth: '🟢 ĐÈN ĐỒNG BỘ: Cả hai đã hoàn thành bài tập hôm nay!',
    syncLightWaiting: '⏳ Đèn tiến độ chỉ sáng khi CẢ HAI cùng hoàn thành buổi tập.',
    syncLightReadyShort: '✓ Đồng bộ 100%',
    syncLightWaitingShort: '⏳ Chờ bạn tập',
    giftFreezeBtn: 'TẶNG THẺ BẢO VỆ CHUỖI',
    giftModalTitle: 'Tặng Thẻ Bảo Vệ Chuỗi',
    giftModalDesc:
      'Tặng cho bạn tập khi bạn ấy bị ốm hoặc bận việc đột xuất để giữ nguyên chuỗi ngày tập luyện!',
    myFreezesCount: 'Thẻ trong túi đồ của bạn',
    giftNoteLabel: 'Lời nhắn động viên - Tùy chọn',
    giftNotePlaceholder: 'Mau khỏe lại nhé người anh em, mai chúng mình lại chiến tiếp!',
    confirmGift: 'XÁC NHẬN TẶNG THẺ',
    outOfFreezes: 'HẾT THẺ - VÀO SHOP ĐỂ MUA',
    giftSuccessTitle: 'Đã Tặng Thành Công!',
    giftSuccessDesc: 'Bạn tập của bạn đã nhận được Thẻ bảo vệ chuỗi kèm lời nhắn ấm áp.',
    radarHeaderTitle: 'Radar Tìm Bạn Tập Tương Thích AI',
    radarHeaderDesc:
      'Thuật toán Lọc cộng tác phân tích chỉ số BMI, số lần chống đẩy ban đầu và mục tiêu để đề xuất người bạn đồng hành phù hợp nhất.',
    pairBtn: 'Ghép Đôi',
    pairedBtn: 'Đã Ghép',
    radarScanning: 'Đang quét tìm ứng viên tập luyện xung quanh...',
    coopRulesTitle: 'Quy Ước Nhiệm Vụ Đồng Đội',
    coopRule1:
      '• Đèn Đồng Bộ: Tiến độ chỉ sáng đèn và ghi nhận hoàn thành khi CẢ HAI bạn cùng tập luyện.',
    coopRule2:
      '• Bảo Toàn Chuỗi: Nếu người bạn bị ốm, bạn có thể bấm nút Tặng Thẻ Bảo Vệ Chuỗi để cứu streak của họ.',
    coopRule3: '• Thưởng FitCoins: Nhận thêm FitCoins mỗi khi hoàn thành mục tiêu 100 reps chung.',
    buddyLimitTitle: 'Đã Đạt Giới Hạn Bạn Đồng Hành',
    buddyLimitDesc:
      'Bạn đã đạt giới hạn 1 bạn đồng hành đang hoạt động. Mỗi người dùng chỉ được phép có duy nhất 1 bạn tập tại một thời điểm.',
    buddyLimitHint:
      'Mô hình kỷ luật 1-1 tuyệt đối: Để ghép đôi với người bạn mới, bạn cần hủy kết nối với người bạn tập hiện tại trước.',
    currentPartnerLabel: 'Bạn đồng hành hiện tại của bạn:',
    viewCurrentPartnerBtn: 'Xem Bạn Tập Hiện Tại',
    unpairAndSwitchBtn: 'Hủy Ghép Đôi Hiện Tại Để Đổi Bạn',
    understandBtn: 'Đã Hiểu',
    unpairConfirmTitle: 'Xác Nhận Hủy Ghép Đôi?',
    unpairConfirmDesc:
      'Bạn và bạn tập sẽ kết thúc nhiệm vụ đồng hành và chuỗi ngày tập luyện chung. Hành động này không thể hoàn tác.',
    unpairBuddyBtn: 'Hủy Ghép Đôi',
    confirmUnpairBtn: 'Xác Nhận Hủy',
    cancelBtn: 'Hủy Bỏ',

    // Shop & Economy
    shopHeaderTitle: 'Cửa Hàng Vật Phẩm FitCoin',
    economyLoopBadge: 'Vòng Lặp Kinh Tế Ảo',
    effortRewardConsume: 'Nỗ lực ➔ Thưởng ➔ Tiêu dùng',
    fitcoinBalance: 'Số dư FitCoins:',
    streakFreezeBalance: 'Thẻ Bảo Vệ Chuỗi:',
    shopItemsAvailable: 'Vật phẩm có sẵn',
    buy1Tap: 'MUA NGAY',
    notEnoughCoins: 'CHƯA ĐỦ COINS',
    myInventory: 'Túi đồ cá nhân',
    emptyInventory: 'Túi đồ của bạn đang trống. Hãy hoàn thành các buổi tập để tích lũy FitCoins!',
    earnedFromWorkouts: 'Tích lũy từ các buổi tập',
    autoProtectsStreaks: 'Tự động bảo vệ streak',

    // Workout Player
    restTimerTitle: 'Thời Gian Nghỉ Hồi Phục',
    preparingFor: 'Chuẩn bị:',
    setNumber: 'Hiệp thứ',
    add15s: '15 giây',
    minus15s: '15 giây',
    pauseTimer: 'Tạm dừng',
    resumeTimer: 'Tiếp tục',
    startNextSet: 'BẮT ĐẦU HIỆP TIẾP ➔',
    currentSetLabel: 'Hiệp hiện tại',
    targetRepsLabel: 'Mục tiêu Reps',
    exerciseOf: 'Bài',
    formTip: 'Hít thở đều, kiểm soát nhịp hạ người 2 giây và đẩy mạnh dứt khoát 1 giây.',
    finishSetBtn: 'XONG HIỆP',
    skipExercise: 'Bỏ qua bài này',
    standardRest: 'Nghỉ hiệp chuẩn:',
    workoutFinishedTitle: 'Hoàn Thành Buổi Tập!',
    workoutFinishedTime: 'Thời gian',
    workoutFinishedReps: 'Tổng số reps',
    rpeInstruction:
      '🎯 Đánh Giá Cảm Nhận Độ Khó: Chọn 1 trong 3 mức bên dưới để nhận XP và giúp AI tự động điều chỉnh độ khó cho ngày mai.',
    rpeEasyTitle: 'QUÁ DỄ',
    rpeEasySub: 'Cảm giác nhẹ nhàng! Nhận 85% XP và kích hoạt nâng tiến cấp độ khó ngày mai.',
    rpeOptimalTitle: 'VỪA SỨC',
    rpeOptimalSub: 'Độ khó lý tưởng! Nhận 115% XP tối ưu kích thích cơ bắp.',
    rpeHardTitle: 'QUÁ SỨC',
    rpeHardSub: 'Khá đuối và mệt mỏi! Nhận 125% XP nỗ lực cao và kích hoạt giảm tải phục hồi.',
    progressionTag: '+Nâng Cấp Độ',
    overloadTag: '+Tăng Tải Tối Ưu',
    recoveryTag: '+Hồi Phục Giảm Tải',
    workoutAwesomeJob: 'Xuất Sắc!',
    rpeLoggedSub: 'Đã ghi nhận dữ liệu RPE vào hồ sơ huấn luyện viên AI.',
    xpEarned: 'Kinh Nghiệm Nhận',
    fitcoinsEarned: 'FitCoins',
    levelUpCongrats: '🎉 CHÚC MỪNG BẠN ĐÃ LÊN CẤP',
    levelUpSub: 'Sức mạnh và thể lực của bạn đã đạt mốc mới.',
    backHomeBtn: 'VỀ TRANG CHỦ',
    rateLaterBtn: 'Đánh giá sau (giữ lại buổi tập)',
    pendingRpeBadge: 'CHỜ ĐÁNH GIÁ RPE',
    pendingRpeTitle: 'Buổi Tập Đã Hoàn Thành!',
    pendingRpeDesc:
      'Bạn đã hoàn thành toàn bộ bài tập. Hãy chọn mức cảm nhận độ khó (RPE) để ghi nhận lịch sử, nhận XP và tính chuỗi Streak hôm nay.',
    reopenRpeBtn: 'CHỌN RPE & NHẬN STREAK',
    returnLaterBtn: 'Để sau, về trang chủ',
    miniPlayerTitle: 'Buổi Tập Đang Diễn Ra',
    miniPendingRpeTitle: 'Đã Tập Xong • Chờ RPE',
    resumeWorkoutBtn: 'TIẾP TỤC TẬP',
    miniSelectRpeBtn: 'CHỌN RPE',
    discardWorkoutBtn: 'Dừng Buổi Tập',
    discardConfirmTitle: 'Dừng Buổi Tập Hiện Tại?',
    discardConfirmDesc:
      'Bạn có chắc chắn muốn hủy bỏ buổi tập này không? Tiến độ hiện tại sẽ không được ghi nhận.',
    confirmDiscardBtn: 'Xác Nhận Dừng',
    minimizeRestModalBtn: 'Thu Nhỏ',
    maximizeRestModalBtn: 'Mở Rộng',
    startSetNowBtn: 'TẬP NGAY',
    restingMiniTitle: 'NGHỈ HỒI PHỤC',
    nextExercisePrep: 'Chuẩn bị:',
    workoutDayDoneBadge: 'ĐÃ HOÀN THÀNH BUỔI TẬP HÔM NAY',
    workoutDayDoneTitle: 'Mục Tiêu Hôm Nay Đã Đạt!',
    workoutDayDoneSub: 'Bạn đã hoàn thành xuất sắc giáo án thể lực hôm nay và bảo vệ chuỗi kỷ luật thành công.',
    workoutDayDoneSummary: 'Tóm Tắt Buổi Tập Hôm Nay',
    workoutDayDoneRpeLabel: 'Đánh giá độ khó',
    auxiliaryFinisherTitle: '⚡ Bạn Còn Nhiều Năng Lượng?',
    auxiliaryFinisherSub: 'Vì bạn đánh giá buổi tập chính là Quá Dễ (RPE 1), AI Coach đã chuẩn bị sẵn một hiệp Bài Tập Bổ Trợ Cơ Lõi (8-10 phút) giúp kích hoạt nhóm cơ bụng sâu và đốt mỡ an toàn.',
    auxiliaryStartBtn: 'BẮT ĐẦU BÀI TẬP BỔ TRỢ (+50 XP)',
    auxiliaryStartSub: '3 bài tập cơ lõi • ~8-10 phút • Không áp lực khớp',
    auxiliaryLoadingBtn: 'ĐANG KHỞI TẠO BÀI BỔ TRỢ...',
    auxiliaryOptionalBtn: 'Tôi vẫn muốn tập thêm bài bổ trợ cơ lõi nhẹ nhàng',
    recoveryRestTitle: 'Lời Khuyên Hồi Phục Từ AI Coach',
    recoveryRestAdviceOptimal: 'Bạn đã hoàn thành buổi tập ở mức độ gắng sức lý tưởng. Cơ bắp cần 24-48 giờ để tái tổng hợp sợi cơ. Hãy uống đủ 2L nước và nghỉ ngơi trọn vẹn hôm nay!',
    recoveryRestAdviceHard: 'Buổi tập hôm nay đã đạt ngưỡng quá tải an toàn. Tuyệt đối không tập thêm để tránh chấn thương khớp. AI đã tự động chuẩn bị chế độ hồi phục cho buổi tập tiếp theo.',
    returnDashboardBtn: 'VỀ TRANG CHỦ NGHỈ NGƠI ➔',

    // Onboarding
    onboardingHeader: 'THIẾT LẬP HỒ SƠ THỂ LỰC AI',
    stepLabel: 'Bước',
    bmiSectionTitle: 'Chỉ Số Thể Hình BMI',
    bmiSectionDesc: 'Thu thập dữ liệu tĩnh để thuật toán tính toán tiêu hao năng lượng nền.',
    heightLabel: 'Chiều cao',
    weightLabel: 'Cân nặng',
    bmiEstLabel: 'Chỉ số BMI ước tính',
    continueToTest: 'TIẾP TỤC BÀI TEST THỂ LỰC ➔',
    fitnessTestTitle: 'Test Thể Lực Ban Đầu',
    fitnessTestDesc: 'Bạn có thể thực hiện tối đa bao nhiêu cái chống đẩy liên tục?',
    fitnessCategory: 'Phân nhóm:',
    continueToGoal: 'TIẾP THEO: MỤC TIÊU ➔',
    goalSectionTitle: 'Mục Tiêu Thể Hình Chính',
    goalSectionDesc: 'AI sẽ tối ưu hóa nhóm cơ và nhịp tim phù hợp với định hướng của bạn.',
    continueToInjury: 'TIẾP THEO: BẢO VỆ CHẤN THƯƠNG ➔',
    injurySectionBadge: 'An Toàn Tuyệt Đối',
    injurySectionTitle: 'Tiền Sử Chấn Thương & Sức Khỏe',
    injurySectionDesc:
      'Chọn các vùng khớp đang đau hoặc nhập vấn đề sức khỏe vào mục Khác để Hybrid AI điều chỉnh lộ trình.',
    householdEquipLabel: 'Vật dụng sinh hoạt có sẵn:',
    finishOnboardingBtn: 'HOÀN THÀNH & TẠO GIÁO ÁN AI 🚀',
    backBtn: 'Quay lại',

    // Profile & History
    physicalHealthProfile: 'Hồ Sơ Thể Hình & An Toàn',
    updateBtn: 'Cập nhật',
    editNameBtn: 'Đổi tên',
    editNamePlaceholder: 'Nhập tên mới...',
    saveNameBtn: 'Lưu',
    savingNameBtn: 'Đang lưu...',
    cancelNameBtn: 'Hủy',
    nameUpdatedSuccess: 'Đã cập nhật tên người dùng!',
    nameValidationLength: 'Tên người dùng phải có từ 2 đến 60 ký tự.',
    heightAndWeight: 'Chiều cao & Cân nặng',
    bmiIndex: 'Chỉ số BMI',
    pushupTestScore: 'Test Chống Đẩy Ban Đầu',
    primaryGoalLabel: 'Mục Tiêu Thể Hình',
    injuriesFilteredTitle: 'Chấn thương & Tình trạng sức khỏe AI đang bảo vệ:',
    noInjuries: 'Không có chấn thương khai báo',
    recentHistoryTitle: 'Lịch sử buổi tập gần đây',
    noHistoryYet: 'Chưa có lịch sử buổi tập nào. Hãy bắt đầu buổi tập đầu tiên ngay hôm nay!',

    // Auth
    loginSubtitle: 'Hệ thống theo dõi tập luyện Calisthenics và kỷ luật đồng đội',
    demoAccountsTitle: 'Tài Khoản Mẫu Trải Nghiệm Nhanh',
    oneTapLogin: '1-Chạm ➔',
    emailLabel: 'Email',
    passwordLabel: 'Mật khẩu',
    loginBtn: 'ĐĂNG NHẬP NGAY',
    noAccountText: 'Chưa có tài khoản?',
    registerNewLink: 'Tạo tài khoản mới',
    registerTitle: 'Tạo Tài Khoản Mới',
    registerSubtitle: 'Nhận ngay 50 FitCoins và 1 Thẻ Bảo Vệ Chuỗi miễn phí!',
    fullNameLabel: 'Họ và tên',
    passwordMinLength: 'Mật khẩu: Tối thiểu 6 ký tự',
    registerBtn: 'TIẾP TỤC ĐẾN THIẾT LẬP THỂ LỰC ➔',
    haveAccountText: 'Đã có tài khoản?',
    loginNowLink: 'Đăng nhập ngay',

    // Notifications
    notificationsTitle: 'Thông Báo',
    notificationsAll: 'Tất cả',
    notificationsUnread: 'Chưa đọc',
    notificationsMarkAllRead: 'Đánh dấu đã đọc tất cả',
    notificationsClearAll: 'Xóa tất cả',
    notificationsEmpty: 'Chưa có thông báo nào',
    notificationsEmptyDesc: 'Tin tức bài tập, cấp độ và bạn đồng hành sẽ hiển thị tại đây.',
    notificationsMarkRead: 'Đánh dấu đã đọc',
    notificationsDelete: 'Xóa',
    notificationsViewDetail: 'Xem chi tiết',
  },
  en: {
    // Nav & Common
    navHome: 'Home',
    navServices: 'Services',
    navAbout: 'About',
    navWorkouts: 'AI Workouts',
    navBuddy: 'Buddy Hub',
    navShop: 'FitCoin Shop',
    navProfile: 'Profile',
    navLogin: 'Login',
    navRegister: 'Register',
    navLogout: 'Log Out',

    // Hero & Landing
    heroDescription:
      'Transform your body with personalized AI calisthenics plans, RPE-adaptive coaching, and an accountability community that pushes you forward.',
    exploreWorkoutsBtn: 'Explore Workouts',
    whyChooseUsTitle: '3-Step Smart Progression',
    whyChooseUsSubtitle:
      'From a 60-second baseline fitness test to daily autonomous overload progression.',
    step1Title: '60s Baseline Onboarding',
    step1Desc:
      'Calculate BMI, log your push-up baseline, and declare sensitive joints so AI locks in 100% safe boundaries.',
    step2Title: 'Train With Giant UI',
    step2Desc:
      'Oversized high-contrast controls built for mid-workout sweat, complete with automatic recovery countdowns.',
    step3Title: 'Rate RPE & Sync Co-op',
    step3Desc:
      'Rate exertion so AI calibrates tomorrow’s reps while lighting up the 100-rep Co-op sync lamp with your buddy.',
    feature1Title: 'RPE-Adaptive AI Engine',
    feature1Desc:
      'Automatically increases volume by 15% when sessions feel easy and safely regresses exercises on high fatigue.',
    feature2Title: 'Bodyweight & Household Gear',
    feature2Desc:
      'Leverage pure bodyweight alongside sturdy chairs, towels, and weighted backpacks — zero gym membership needed.',
    feature3Title: 'Joint Safety & Co-op Streak',
    feature3Desc:
      'Strictly filters out 100% of contraindicated joint movements while keeping your streak alive with a partner.',
    ctaBannerTitle: 'Ready To Build Unbreakable Discipline?',
    ctaBannerSubtitle:
      'Complete your fitness profile in 60 seconds. Claim 50 FitCoins and 1 free Streak Freeze shield upon signup.',
    startJourneyFreeBtn: 'Start Free Today',
    alreadyHaveAccountBtn: 'I Have An Account',

    // Home Dashboard
    helloAthlete: 'Welcome back',
    goalLabel: 'Goal',
    completedTodayBadge: 'Completed today’s workout',
    startWorkoutNow: 'Start Workout',
    exercisesCount: 'exercises',
    restSeconds: 'Rest',
    startRoutineBtn: 'Start Routine',
    giantUiModeDesc: 'Giant UI hands-free mode • Auto recovery timer',
    noRoutineAvailable: 'No routine generated yet. Open the workout library to begin!',
    openLibraryBtn: 'Open AI Workouts',
    oneTapCheckInTitle: '1-Tap Daily Nutrition Check-in',
    oneTapCheckInSubtitle: 'Log today’s calorie balance with one tap to earn +5 FitCoins',
    calorieDeficit: 'Calorie Deficit',
    calorieDeficitDesc: 'Light intake • Fat loss focus',
    calorieMaintenance: 'Maintenance',
    calorieMaintenanceDesc: 'Balanced intake • Steady energy',
    calorieSurplus: 'Calorie Surplus',
    calorieSurplusDesc: 'High protein • Muscle recovery',
    aiTodayTitle: "Today's AI Workout Routine",
    progressionBadge: '⚡ AI Progression',
    regressionBadge: '🛡️ AI Safe Regression',
    optimalBadge: '🔥 Optimal Routine',
    exercisesList: 'Exercises',
    sets: 'sets',
    reps: 'reps',
    minutes: 'mins',
    startWorkout1Tap: 'START WORKOUT',

    // Leveling & Gamification
    athlete: 'ATHLETE',
    level: 'Level',
    xpNeedToNext: 'more to level up',
    streak: 'Streak',
    days: 'days',
    fitcoins: 'FitCoins',
    freezes: 'Streak Freezes',
    levelFormulaTitle: 'Leveling Formula',
    formulaText: 'Formula: Level = ⌊√(XP / 100)⌋ + 1',
    currentLevelProgress: 'Accumulated XP progress',
    quickShopPromo: 'Streak Freeze Shield Card',
    visitShop: 'VISIT FITCOIN SHOP ➔',

    // Accountability Buddy
    buddyTitle: 'Discipline Accountability Buddy',
    buddySystemBadge: 'Accountability Buddy System',
    myBuddyTab: 'My Partner',
    radarTab: 'AI Matching Radar',
    noBuddyCardTitle: 'No Workout Partner Paired Yet',
    noBuddyCardDesc:
      'Match with a partner who shares your exact BMI, fitness bracket, and goals. The 100-rep Co-op mission light turns green only when BOTH of you work out!',
    openRadarBtn: 'OPEN AI RADAR MATCHMAKER ➔',
    totalRepsContributed: 'Total combined reps today',
    you: 'You',
    statusCompleted: 'Completed',
    statusNotDone: 'Not yet',
    syncLightBoth: '🟢 SYNC LIGHT: Both partners crushed the workout today!',
    syncLightWaiting: '⏳ Sync light illuminates only when BOTH finish their workout.',
    syncLightReadyShort: '✓ Synced 100%',
    syncLightWaitingShort: '⏳ Waiting for buddy',
    giftFreezeBtn: 'GIFT STREAK FREEZE',
    giftModalTitle: 'Gift a Streak Freeze Shield',
    giftModalDesc:
      'Send a shield card to your partner if they are sick or busy to rescue their streak!',
    myFreezesCount: 'Shield cards in your inventory',
    giftNoteLabel: 'Encouraging Message - Optional',
    giftNotePlaceholder: 'Get well soon my friend, we continue crushing tomorrow!',
    confirmGift: 'CONFIRM & SEND GIFT',
    outOfFreezes: 'OUT OF SHIELDS - BUY IN SHOP',
    giftSuccessTitle: 'Gift Sent Successfully!',
    giftSuccessDesc: 'Your workout partner received the shield card and your warm message.',
    radarHeaderTitle: 'AI Buddy Compatibility Radar',
    radarHeaderDesc:
      'Collaborative filtering analyzes your BMI index, initial push-up test, and goal to match the most compatible workout partner.',
    pairBtn: 'Pair Up',
    pairedBtn: 'Paired',
    radarScanning: 'Scanning for active workout candidates near your tier...',
    coopRulesTitle: 'Co-op Accountability Rules',
    coopRule1:
      '• Sync Light: Daily progress light shines green only when BOTH partners complete today’s workout.',
    coopRule2:
      '• Streak Rescue: If your partner is ill, you can gift them a Streak Freeze to rescue their streak.',
    coopRule3:
      '• FitCoin Rewards: Earn bonus FitCoins whenever you achieve the 100 combined reps target.',
    buddyLimitTitle: 'Partner Limit Reached',
    buddyLimitDesc:
      'You have reached the limit of 1 active workout buddy. Each user is strictly allowed only 1 active partner at a time.',
    buddyLimitHint:
      'Strict 1-1 accountability model: To pair with a new partner, please disconnect from your current partner first.',
    currentPartnerLabel: 'Your current workout partner:',
    viewCurrentPartnerBtn: 'View Current Partner',
    unpairAndSwitchBtn: 'Disconnect Partner to Switch',
    understandBtn: 'Understood',
    unpairConfirmTitle: 'Disconnect Workout Partner?',
    unpairConfirmDesc:
      'You and your partner will no longer share co-op missions or streak progress. This action cannot be undone.',
    unpairBuddyBtn: 'Disconnect Partner',
    confirmUnpairBtn: 'Confirm Disconnect',
    cancelBtn: 'Cancel',

    // Shop & Economy
    shopHeaderTitle: 'FitCoin Virtual Economy Shop',
    economyLoopBadge: 'Virtual Economy Loop',
    effortRewardConsume: 'Effort ➔ Reward ➔ Consumption',
    fitcoinBalance: 'FitCoins Balance:',
    streakFreezeBalance: 'Streak Freeze Shields:',
    shopItemsAvailable: 'Available Catalog',
    buy1Tap: 'BUY NOW',
    notEnoughCoins: 'INSUFFICIENT COINS',
    myInventory: 'Personal Inventory',
    emptyInventory: 'Your inventory is empty. Complete workouts to accumulate FitCoins!',
    earnedFromWorkouts: 'Earned from workouts',
    autoProtectsStreaks: 'Auto protects streak',

    // Workout Player
    restTimerTitle: 'Recovery Rest Timer',
    preparingFor: 'Next up:',
    setNumber: 'Set #',
    add15s: '15s',
    minus15s: '15s',
    pauseTimer: 'Pause',
    resumeTimer: 'Resume',
    startNextSet: 'START NEXT SET ➔',
    currentSetLabel: 'Current Set',
    targetRepsLabel: 'Target Reps',
    exerciseOf: 'Exercise',
    formTip: 'Breathe rhythmically: control the 2-second descent and explode up with power.',
    finishSetBtn: 'COMPLETE SET',
    skipExercise: 'Skip this exercise',
    standardRest: 'Standard Rest:',
    workoutFinishedTitle: 'Workout Completed!',
    workoutFinishedTime: 'Duration',
    workoutFinishedReps: 'Total reps',
    rpeInstruction:
      '🎯 Rate Exertion: Tap one of the 3 buttons below to earn XP and help AI calibrate tomorrow’s routine intensity.',
    rpeEasyTitle: 'TOO EASY',
    rpeEasySub: 'Felt light! Earns 85% XP and triggers progression for tomorrow.',
    rpeOptimalTitle: 'OPTIMAL',
    rpeOptimalSub: 'Perfect intensity! Earns 115% XP with progressive overload.',
    rpeHardTitle: 'TOO HARD',
    rpeHardSub: 'High exhaustion! Earns 125% XP effort bonus and activates recovery.',
    progressionTag: '+Progression',
    overloadTag: '+Overload',
    recoveryTag: '+Recovery',
    workoutAwesomeJob: 'Awesome Job!',
    rpeLoggedSub: 'RPE data logged to your adaptive AI profile.',
    xpEarned: 'XP Earned',
    fitcoinsEarned: 'FitCoins Earned',
    levelUpCongrats: '🎉 CONGRATULATIONS! LEVEL UP',
    levelUpSub: 'Your strength and fitness have reached a new height.',
    backHomeBtn: 'RETURN TO DASHBOARD',
    rateLaterBtn: 'Rate Later (Keep Workout)',
    pendingRpeBadge: 'PENDING RPE RATING',
    pendingRpeTitle: 'Workout Finished!',
    pendingRpeDesc:
      'You have completed all exercises. Rate your exertion (RPE) to log this session, earn XP, and count today’s streak.',
    reopenRpeBtn: 'SELECT RPE & CLAIM STREAK',
    returnLaterBtn: 'Rate later, go home',
    miniPlayerTitle: 'Workout in Progress',
    miniPendingRpeTitle: 'Finished • Pending RPE',
    resumeWorkoutBtn: 'RESUME WORKOUT',
    miniSelectRpeBtn: 'RATE RPE',
    discardWorkoutBtn: 'Discard Workout',
    discardConfirmTitle: 'Discard Current Workout?',
    discardConfirmDesc:
      'Are you sure you want to discard this workout? Current progress will not be logged.',
    confirmDiscardBtn: 'Confirm Discard',
    minimizeRestModalBtn: 'Minimize',
    maximizeRestModalBtn: 'Expand',
    startSetNowBtn: 'START NOW',
    restingMiniTitle: 'REST & RECOVERY',
    nextExercisePrep: 'Next up:',
    workoutDayDoneBadge: 'DAILY WORKOUT COMPLETED',
    workoutDayDoneTitle: 'Today’s Workout Complete!',
    workoutDayDoneSub: 'You have conquered today’s prescribed workout and sustained your streak discipline.',
    workoutDayDoneSummary: 'Today’s Workout Summary',
    workoutDayDoneRpeLabel: 'Exertion Rating',
    auxiliaryFinisherTitle: '⚡ Still Have Energy Left?',
    auxiliaryFinisherSub: 'Because your main session was rated Too Easy (RPE 1), AI Coach prepared a targeted Core Burnout Finisher (8-10 mins) to recruit deep stabilizers safely.',
    auxiliaryStartBtn: 'START AUXILIARY FINISHER (+50 XP)',
    auxiliaryStartSub: '3 core exercises • ~8-10 mins • Joint-friendly',
    auxiliaryLoadingBtn: 'SETTING UP FINISHER...',
    auxiliaryOptionalBtn: 'I still want to do a light core auxiliary finisher',
    recoveryRestTitle: 'AI Coach Recovery Protocol',
    recoveryRestAdviceOptimal: 'You hit the optimal progressive overload sweet spot today. Muscle fibers require 24-48 hours to rebuild. Stay hydrated and rest up for tomorrow!',
    recoveryRestAdviceHard: 'Your muscles experienced high exertion today. Avoid extra volume to prevent overtraining. AI has automatically scheduled an active recovery protocol for your next session.',
    returnDashboardBtn: 'RETURN TO DASHBOARD ➔',

    // Onboarding
    onboardingHeader: 'AI FITNESS PROFILE ONBOARDING',
    stepLabel: 'Step',
    bmiSectionTitle: 'Body Metric & BMI Index',
    bmiSectionDesc: 'Collecting static baseline data for metabolic burn calculations.',
    heightLabel: 'Height',
    weightLabel: 'Weight',
    bmiEstLabel: 'Estimated BMI Index',
    continueToTest: 'PROCEED TO FITNESS TEST ➔',
    fitnessTestTitle: 'Baseline Fitness Push-up Test',
    fitnessTestDesc: 'How many continuous push-ups can you perform with clean form?',
    fitnessCategory: 'Fitness Tier:',
    continueToGoal: 'NEXT: PRIMARY GOAL ➔',
    goalSectionTitle: 'Primary Fitness Goal',
    goalSectionDesc: 'AI optimizes target muscle splits and metabolic intensity for your vision.',
    continueToInjury: 'NEXT: INJURY PROTECTION ➔',
    injurySectionBadge: '100% Safety Protection',
    injurySectionTitle: 'Injury & Health History',
    injurySectionDesc:
      'Select sensitive joints or specify any health condition in Other so the Hybrid AI adapts your routine.',
    householdEquipLabel: 'Available household equipment:',
    finishOnboardingBtn: 'COMPLETE & GENERATE AI PLAN 🚀',
    backBtn: 'Back',

    // Profile & History
    physicalHealthProfile: 'Physical & Safety Profile',
    updateBtn: 'Update',
    editNameBtn: 'Rename',
    editNamePlaceholder: 'Enter new name...',
    saveNameBtn: 'Save',
    savingNameBtn: 'Saving...',
    cancelNameBtn: 'Cancel',
    nameUpdatedSuccess: 'Display name updated!',
    nameValidationLength: 'Name must be between 2 and 60 characters.',
    heightAndWeight: 'Height & Weight',
    bmiIndex: 'BMI Index',
    pushupTestScore: 'Baseline Push-up Test',
    primaryGoalLabel: 'Primary Goal',
    injuriesFilteredTitle: 'Injuries & health conditions protected by AI:',
    noInjuries: 'No declared injuries',
    recentHistoryTitle: 'Recent Workout History',
    noHistoryYet: 'No workout history yet. Crush your first routine today!',

    // Auth
    loginSubtitle: 'Calisthenics Bodyweight & Social Accountability System',
    demoAccountsTitle: '1-Click Demo Accounts',
    oneTapLogin: '1-Tap ➔',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    loginBtn: 'LOG IN NOW',
    noAccountText: "Don't have an account?",
    registerNewLink: 'Register new account',
    registerTitle: 'Create New Account',
    registerSubtitle: 'Get 50 FitCoins and 1 free Streak Freeze shield on signup!',
    fullNameLabel: 'Full Name',
    passwordMinLength: 'Password: Minimum 6 characters',
    registerBtn: 'PROCEED TO ONBOARDING ➔',
    haveAccountText: 'Already have an account?',
    loginNowLink: 'Log in now',

    // Notifications
    notificationsTitle: 'Notifications',
    notificationsAll: 'All',
    notificationsUnread: 'Unread',
    notificationsMarkAllRead: 'Mark all as read',
    notificationsClearAll: 'Clear all',
    notificationsEmpty: 'No notifications yet',
    notificationsEmptyDesc: 'Workout news, level-ups, and buddy updates will appear here.',
    notificationsMarkRead: 'Mark as read',
    notificationsDelete: 'Delete',
    notificationsViewDetail: 'View details',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('fit_language') as Language | null;
    if (saved && (saved === 'vi' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fit_language', lang);
  }, []);

  const t = React.useCallback(
    (key: string): string => {
      return translations[language][key] || key;
    },
    [language],
  );

  const contextValue = React.useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
