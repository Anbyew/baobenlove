export type Lang = 'en' | 'zh';

export const t = {
  en: {
    // Navigation
    navLogo: 'Yuwei & Benjamin',
    home: 'Home',
    story: 'Our Story',
    details: 'Details',
    schedule: 'Schedule',
    gallery: 'Gallery',
    rsvp: 'RSVP',
    travel: 'Travel',
    registry: 'Registry',
    faq: 'Q&A',

    // Password Gate
    enterPassword: 'Enter password',
    incorrectPassword: 'Incorrect password',
    enter: 'Enter',

    // Email Auth Gate — step 1
    emailAuthSubtitle: 'Enter your email to receive a verification code',
    emailPlaceholder: 'name@example.com',
    sendCode: 'Send Code',
    sending: 'Sending…',

    // Email Auth Gate — step 2
    codeSentTo: 'We sent a 6-digit code to',
    verify: 'Verify',
    verifying: 'Verifying…',
    back: 'Back',
    resendCode: 'Resend code',

    // Email Auth Gate — step 3
    foundOnInvite: 'We found your invitation — which guest are you?',
    tellUsAboutYou: 'Please tell us a little about yourself',
    title: 'Title',
    firstName: 'First name',
    lastName: 'Last name',
    preferredLanguage: 'Preferred language',
    continue: 'Continue',

    // Home
    name1: 'Yuwei Bao',
    name2: 'Benjamin Krakoff',
    latinPhrase: 'Optimum attingitur. Amor infinitus est.',
    date: 'October 3, 2026',
    venue: 'Longwood Gardens',
    location: 'Kennett Square, Pennsylvania',

    // Gallery
    galleryTitle: 'Gallery',
    gallerySubtitle: 'Moments from our journey',

    // Details
    detailsTitle: 'Details',
    ceremonyLabel: 'Ceremony',
    cocktailReceptionLabel: 'Cocktail & Reception',
    dateLabel: 'Date',
    timeLabel: 'Time',
    locationLabel: 'Location',
    ceremonyTime: '3:00 PM',
    ceremonyArrive: 'Arrive by 2:45 PM',
    ceremonyVenue: 'Hartefeld National',
    ceremonyAddress: '1 Hartefeld Dr, Avondale, PA',
    receptionTime: '6:00 PM – 11:00 PM',
    receptionDinner: 'Dinner at 7:00 PM',
    receptionVenue: 'Longwood Gardens',
    receptionAddress: '409 Conservatory Road, Kennett Square, PA 19348',
    dressCodeLabel: 'Dress Code',
    dressCodeValue: 'Expressive Garden Formal',
    weatherLabel: 'Weather',
    weatherValue: '60–70°F · Outdoor + Indoor',
    parkingLabel: 'Parking',
    parkingValue: 'West Lot',
    sundayBonusLabel: 'An Extra Day in the Gardens',
    sundayDate: 'Sunday, October 4',
    sundayDateSub: 'Wander the gardens at your leisure',
    sundayAdmissionLabel: 'Admission',
    sundayAdmissionValue: 'Complimentary',
    sundayAdmissionSub: 'QR code to follow',
    sundayParkingValue: 'Longwood Gardens',

    // Schedule
    scheduleTitle: 'Schedule',
    scheduleNote: 'Times are approximate and may vary slightly throughout the evening',
    scheduleEvents: [
      { time: '2:45 PM', title: 'Guest Arrival', description: 'Please arrive at Hartefeld National and find your seats before the ceremony begins' },
      { time: '3:00 PM', title: 'Ceremony', description: 'Join us at Hartefeld National as we exchange our vows under the autumn sky' },
      { time: '3:45 PM', title: 'Travel to Longwood Gardens', description: 'Head to Longwood Gardens for the evening — about a 15-minute drive' },
      { time: '4:00 PM', title: 'Explore Longwood Gardens', description: 'Wander the outdoor gardens and enjoy the autumn beauty while we take wedding photos' },
      { time: '6:00 PM', title: 'Cocktail Hour', description: "Enjoy signature cocktails and hors d'oeuvres at Longwood Gardens" },
      { time: '7:00 PM', title: 'Reception & Dinner', description: 'A seated dinner featuring seasonal, locally-sourced cuisine' },
      { time: '11:00 PM', title: 'Sparkler Send-Off', description: 'A magical farewell under the stars with sparklers' },
    ],

    // Travel
    travelTitle: 'Travel',
    longwoodSundayNote: "With 1,000 acres to explore, one day may not be enough — so beyond your complimentary wedding-day access, Longwood is offering guests an additional day of entry on Sunday, Oct 4 via QR code (details to follow). Park at the Visitor Center,",
    sundayAccessAddress: '1001 Longwood Road, Kennett Square, PA 19348',
    gettingHereTitle: 'Getting Here',
    phlAirport: 'Philadelphia International Airport (PHL)',
    phlDistance: '~45 minutes from venues',
    ilgAirport: 'Wilmington Airport (ILG)',
    ilgDistance: '~30 minutes from venues',
    whereToStayTitle: 'Where to Stay',
    distanceLongwood15: '~15 min from Longwood Gardens',
    distanceLongwood25: '~25 min from Longwood Gardens',
    bookingNoteRef: 'Or call and reference the "Bao/Krakoff Wedding Block."',
    bookOnline: '',
    bookRoomBlock: 'Book room block →',
    roomBlockSoon: 'Room block link coming soon',
    exploreTitle: 'Explore the Area',
    nearVenueRegion: 'Near the Venue',
    phillyRegion: 'Philadelphia · ~45 min',
    wilmingtonRegion: 'Wilmington · ~30 min',
    longwoodName: 'Longwood Gardens',
    longwoodDesc: 'Iconic fountains, conservatories, and 1,000 acres of gardens',
    phillyMuseumName: 'Philadelphia Museum of Art',
    phillyMuseumDesc: 'World-class collections and the legendary Rocky Steps',
    readingMarketName: 'Reading Terminal Market',
    readingMarketDesc: 'A beloved historic market hall filled with incredible local food',
    riverfrontName: 'Riverfront Wilmington',
    riverfrontDesc: 'Waterfront restaurants, shops, and the lively Christina riverbank',

    // RSVP
    rsvpDeadline: 'Please respond by September 1, 2026 at 11:59 PM AOE (Anywhere on Earth)',
    rsvpThankYou: 'Thank you',
    rsvpReceivedPre: 'Your RSVP for',
    rsvpReceivedPost: "has been received. We can't wait to celebrate with you.",
    rsvpLoading: 'Opening your invitation',
    rsvpLoadingMsg: 'Please wait a moment while we load your household details.',
    rsvpNotFound: "We couldn't find your invitation",
    rsvpNotFoundMsg: "We looked up your invitation but couldn't find a match. This may happen if you were invited under a different email address.",
    rsvpContactPre: 'Please reach out to us at',
    rsvpContactPost: "and we'll sort it out.",
    rsvpHousehold: 'Household',
    rsvpReservedSeats: 'Reserved seats',
    rsvpGuests: 'Guests',
    rsvpInvitationEmail: 'Invitation email',
    rsvpLastUpdated: 'Last updated',
    rsvpAttending: 'Will you be attending? *',
    rsvpAccepts: 'Joyfully accepts',
    rsvpDeclines: 'Regretfully declines',
    rsvpGuestCount: 'Number of Guests',
    rsvpSeatHintPre: 'Including yourself, up to',
    rsvpSeatHintPost: 'reserved seat',
    rsvpSeatHintPostPlural: 'reserved seats',
    rsvpDietary: 'Dietary Restrictions',
    rsvpDietaryPlaceholder: 'Please let us know of any dietary restrictions',
    rsvpSongRequest: 'Song Request',
    rsvpSongPlaceholder: "Any song you'd like to hear?",
    rsvpSaving: 'Saving RSVP…',
    rsvpUpdate: 'Update RSVP',
    rsvpSubmit: 'Submit RSVP',
    rsvpAttendError: 'Please let us know whether you will be attending.',
    rsvpSaveError: 'We could not save your RSVP. Please try again.',
    rsvpQuestions: 'Questions?',
    rsvpEmailUs: 'Email us',
    rsvpComingSoonTitle: 'RSVP opens very soon',
    rsvpComingSoonBody: 'We\'re putting the finishing touches together. You\'ll be able to RSVP right here — we\'ll let you know the moment it\'s ready.',

    // Story
    storyTitle: 'Our Story',
    storyClosing: 'We are so grateful to share the next chapter with all of you, and we cannot wait to celebrate at Longwood Gardens, where our story continues.',
    storyEvents: [
      {
        year: '2020',
        title: 'How We Met',
        paragraphs: [
          "Yuwei and I were both PhD students at the University of Michigan — I studied math, she studied computer science — so our paths did not cross until we met online at the beginning of the pandemic. I was 60% sure she was a spy and would lose interest once she figured out my research wasn't worth stealing.",
          "On our first date we went to the Michigan Arboretum, where we both got plenty of mosquito bites. On our second date we had some of my home-brewed tepache which, I explained, I was fairly confident had no botulism and I only kept the fermentation kit in the bathtub in case it exploded. After a few more dates I suddenly found myself building her a plant stand and realizing we were both in it for the long haul.",
        ],
      },
      {
        year: '2021 – 2025',
        title: 'Growing Together',
        paragraphs: [
          "We spent the next few years supporting each other through internships, PhD theses, graduations and job searches. Yuwei came to live with me when I was an intern in Philadelphia — that's where we first realized we're probably a couple of city slickers (Yuwei Note: no we are not). We spent some time long distance as she finished her thesis and internships in Seattle before we both found jobs in New York City.",
          'We rented an apartment along the Hudson in Jersey City ("Jersey City…? Really?" my family said with only slight disdain). Once I taught her all about Bruce Springsteen we fit right in with all the other yuppies. Yuwei came to Passover celebrations, Thanksgivings and the occasional ski trip, and my family were very quickly impressed with her warmth, kindness and style. I met her family on an extended trip to China and they made me feel incredibly welcome despite being a 老外 with not incredible Mandarin.',
        ],
      },
      {
        year: 'January 2026',
        title: 'The Proposal',
        paragraphs: [
          'We had settled into the rhythm of living in the city — walks along the riverfront, dinner on the patio with our cat, commuting on the PATH. The timing was clearly right, and we got engaged on January 3rd outside a nice Italian restaurant overlooking lower Manhattan.',
          'A few weeks later we got married in the New York City City Hall, officially starting our future together.',
        ],
      },
    ],

    // FAQ
    faqTitle: 'Q&A',
    faqSections: [
      {
        heading: 'Ceremony & Venue',
        color: 'text-primary/55',
        items: [
          {
            q: 'Is the ceremony indoors or outdoors?',
            a: 'The ceremony will be held outdoors at Hartefeld National. The cocktail hour and reception follow indoors at Longwood Gardens. In the unlikely event of inclement weather, we have a beautiful indoor backup plan in place.',
          },
          {
            q: 'Where are the venues?',
            a: 'The ceremony is at Hartefeld National, 1 Hartefeld Dr, Avondale, PA 19311. The cocktail hour and reception are at Longwood Gardens, 1001 Longwood Road, Kennett Square, Pennsylvania 19348 — about 30 miles southwest of Philadelphia.',
          },
          {
            q: 'Is there parking available?',
            a: 'Yes — free parking is available at both Hartefeld National and Longwood Gardens.',
          },
          {
            q: 'Will there be transportation between the venues and hotels?',
            a: 'Complimentary shuttles will run between our recommended hotels and the venues throughout the evening. Shuttle details will be shared closer to the date.',
          },
        ],
      },
      {
        heading: 'Attire & Logistics',
        color: 'text-secondary/55',
        items: [
          {
            q: 'What is the dress code?',
            a: 'Expressive Garden Formal. We encourage formal attire with a creative, garden-inspired flair — think florals, jewel tones, and soft neutrals. Because the ceremony is outdoors, we recommend block heels, wedges, or flats for ladies.',
          },
          {
            q: 'What will the weather be like?',
            a: 'October in Pennsylvania is typically beautiful — crisp autumn air with temperatures around 60–70°F during the day and cooler in the evening. We recommend bringing a light jacket or wrap for after sundown.',
          },
          {
            q: 'Can I take photos during the ceremony?',
            a: 'We kindly ask that you be fully present during the ceremony and refrain from using your phone or camera — we have a wonderful photographer capturing every moment. You are absolutely welcome to photograph freely during the cocktail hour and reception.',
          },
          {
            q: 'Are children welcome?',
            a: 'We love your little ones! Please check your invitation for the number of guests included in your party.',
          },
        ],
      },
      {
        heading: 'RSVP & Registry',
        color: 'text-primary/55',
        items: [
          {
            q: 'When is the RSVP deadline?',
            a: 'Please RSVP by September 1, 2026 at 11:59 PM AOE (Anywhere on Earth) so we can finalize our headcount with the venue and caterers.',
          },
          {
            q: 'Can I bring a plus-one?',
            a: 'Due to venue capacity, we can only accommodate guests named on the invitation. Your invitation will indicate whether a guest is included for you.',
          },
          {
            q: 'Do you accommodate dietary restrictions?',
            a: 'Absolutely. Please let us know about any dietary restrictions or allergies in your RSVP and we will make sure the catering team takes great care of you.',
          },
          {
            q: 'Where are you registered?',
            a: 'Our registry information is on the Registry page. Your presence at our wedding is the greatest gift — but if you wish to give, we are grateful.',
          },
          {
            q: 'Who can I contact if I have more questions?',
            a: 'Please reach out to us at bellabenbao@gmail.com — we are happy to help.',
          },
        ],
      },
    ],

    // Registry
    registryTitle: 'Registry',
    registryIntro: "We feel incredibly lucky — in love, in life, and in all the things that truly matter. In lieu of a traditional gift, we would be deeply honored if you made a donation in our name to one of the charities below.",
    registryGamesIntro: "For those who'd like to give a little something, we've turned our honeymoon fund into a game — or two. Pick one and help send us off into the life ahead.",
    registryHomeKitchen: 'Home & Kitchen',
    registryGourmet: 'Gourmet Kitchen',
    registryUniversal: 'Universal Registry',
    registryView: 'View',
    registryHoneymoon: 'Honeymoon Fund',
    registryHoneymoonDest: 'Japan',
    registryHoneymoonDesc: "We're planning an unforgettable honeymoon to Japan, where we'll explore ancient temples, stroll through bamboo forests, and discover the beautiful gardens that inspired our wedding theme.",
    registryContribute: 'Contribute',
    registryContact: 'Questions? Email us at',
  },

  zh: {
    // Navigation
    navLogo: '包雨薇 & 本杰明',
    home: '主页',
    story: '我们的故事',
    details: '详情',
    schedule: '日程',
    gallery: '相册',
    rsvp: '回复',
    travel: '交通住宿',
    registry: '心愿单',
    faq: '常见问题',

    // Password Gate
    enterPassword: '请输入密码',
    incorrectPassword: '密码错误，请重试',
    enter: '进入',

    // Email Auth Gate — step 1
    emailAuthSubtitle: '请输入您的邮箱，我们将发送验证码',
    emailPlaceholder: '请输入邮箱地址',
    sendCode: '发送验证码',
    sending: '发送中…',

    // Email Auth Gate — step 2
    codeSentTo: '我们已向以下邮箱发送了6位验证码：',
    verify: '验证',
    verifying: '验证中…',
    back: '返回',
    resendCode: '重新发送',

    // Email Auth Gate — step 3
    foundOnInvite: '我们找到了您的邀请函，请确认您是哪位宾客',
    tellUsAboutYou: '请告诉我们您的基本信息',
    title: '称谓',
    firstName: '名字',
    lastName: '姓氏',
    preferredLanguage: '偏好语言',
    continue: '继续',

    // Home
    name1: '包雨薇',
    name2: '本杰明·克拉科夫',
    latinPhrase: '臻于至善，深爱永恒',
    date: '2026年10月3日',
    venue: '长木花园',
    location: '宾夕法尼亚州肯尼特广场',

    // Gallery
    galleryTitle: '相册',
    gallerySubtitle: '我们旅途中的美好时光',

    // Details
    detailsTitle: '婚礼详情',
    ceremonyLabel: '婚礼仪式',
    cocktailReceptionLabel: '鸡尾酒会与婚宴',
    dateLabel: '日期',
    timeLabel: '时间',
    locationLabel: '地点',
    ceremonyTime: '下午3:00',
    ceremonyArrive: '请于下午2:45前到达',
    ceremonyVenue: '哈特菲尔德',
    ceremonyAddress: '1 Hartefeld Dr, Avondale, PA',
    receptionTime: '下午6:00 – 晚上11:00',
    receptionDinner: '晚宴于晚上7:00开始',
    receptionVenue: '长木花园',
    receptionAddress: '409 Conservatory Road, Kennett Square, PA 19348',
    dressCodeLabel: '着装要求',
    dressCodeValue: '园林正式礼服',
    weatherLabel: '天气',
    weatherValue: '约15–21°C · 户外+室内',
    parkingLabel: '停车',
    parkingValue: 'West Lot',
    sundayBonusLabel: '婚礼次日，畅游花园',
    sundayDate: '10月4日，周日',
    sundayDateSub: '悠然漫步，细品花园',
    sundayAdmissionLabel: '入园',
    sundayAdmissionValue: '免费',
    sundayAdmissionSub: '二维码稍后发送',
    sundayParkingValue: '长木花园',

    // Schedule
    scheduleTitle: '婚礼流程',
    scheduleNote: '以上时间仅供参考，实际流程可能略有调整',
    scheduleEvents: [
      { time: '下午2:45', title: '宾客抵达', description: '请于仪式开始前抵达哈特菲尔德，入座等候' },
      { time: '下午3:00', title: '婚礼仪式', description: '在秋日天空下，见证我们于哈特菲尔德互诉誓言' },
      { time: '下午3:45', title: '前往长木花园', description: '驱车约15分钟，前往长木花园开启美好夜晚' },
      { time: '下午4:00', title: '游览长木花园', description: '漫步秋日花园，欣赏美景，我们将在此拍摄婚纱照' },
      { time: '下午6:00', title: '鸡尾酒时间', description: '在长木花园享用精选鸡尾酒与开胃小食' },
      { time: '晚上7:00', title: '晚宴', description: '品尝精心准备的时令本地美食' },
      { time: '晚上11:00', title: '烟花送别', description: '在漫天星光下，挥舞烟花，温馨道别' },
    ],

    // Travel
    travelTitle: '交通与住宿',
    longwoodSundayNote: '长木花园占地千亩，一日恐难尽览——因此除婚礼当天的免费入园外，特别为宾客提供10月4日（周日）的额外入园机会，凭二维码入场（详情稍后发送）。停车请前往游客中心，',
    sundayAccessAddress: '1001 Longwood Road, Kennett Square, PA 19348',
    gettingHereTitle: '如何抵达',
    phlAirport: '费城国际机场（PHL）',
    phlDistance: '距婚礼场地约45分钟',
    ilgAirport: '威尔明顿机场（ILG）',
    ilgDistance: '距婚礼场地约30分钟',
    whereToStayTitle: '住宿推荐',
    distanceLongwood15: '距长木花园约15分钟',
    distanceLongwood25: '距长木花园约25分钟',
    bookingNoteRef: '或致电并报"包/克拉科夫婚礼团房"。',
    bookOnline: '',
    bookRoomBlock: '预订婚礼团房 →',
    roomBlockSoon: '预订链接即将公布',
    exploreTitle: '周边探索',
    nearVenueRegion: '场地附近',
    phillyRegion: '费城 · 约45分钟',
    wilmingtonRegion: '威尔明顿 · 约30分钟',
    longwoodName: '长木花园',
    longwoodDesc: '壮观的喷泉、温室与千亩花园',
    phillyMuseumName: '费城艺术博物馆',
    phillyMuseumDesc: '世界级藏品与著名的洛基台阶',
    readingMarketName: '里德终点站市场',
    readingMarketDesc: '充满活力的历史市场，汇聚各式本地美食',
    riverfrontName: '威尔明顿河畔',
    riverfrontDesc: '沿河餐厅、商店与热闹的克里斯蒂娜河畔',

    // RSVP
    rsvpDeadline: '请于2026年9月1日（AOE国际日期变更线时间，即世界任何地方的11:59 PM）前回复',
    rsvpThankYou: '感谢您的回复',
    rsvpReceivedPre: '已收到',
    rsvpReceivedPost: '的回复。我们迫不及待与您共同庆祝。',
    rsvpLoading: '正在打开您的邀请函',
    rsvpLoadingMsg: '请稍等，我们正在加载您的邀请详情。',
    rsvpNotFound: '未能找到您的邀请函',
    rsvpNotFoundMsg: '我们查找了您的邀请函但未能匹配。如您使用了其他邮箱地址接受邀请，可能会出现此情况。',
    rsvpContactPre: '请联系我们：',
    rsvpContactPost: '我们将尽快为您处理。',
    rsvpHousehold: '家庭',
    rsvpReservedSeats: '预留席位',
    rsvpGuests: '宾客',
    rsvpInvitationEmail: '邀请邮箱',
    rsvpLastUpdated: '最近更新',
    rsvpAttending: '您是否出席？*',
    rsvpAccepts: '欣然接受',
    rsvpDeclines: '遗憾婉拒',
    rsvpGuestCount: '出席人数',
    rsvpSeatHintPre: '包括您本人，最多',
    rsvpSeatHintPost: '个预留席位',
    rsvpSeatHintPostPlural: '个预留席位',
    rsvpDietary: '饮食限制',
    rsvpDietaryPlaceholder: '请告知我们您的饮食限制或过敏情况',
    rsvpSongRequest: '点歌',
    rsvpSongPlaceholder: '有什么想听的歌曲吗？',
    rsvpSaving: '正在保存…',
    rsvpUpdate: '更新回复',
    rsvpSubmit: '提交回复',
    rsvpAttendError: '请告知我们您是否出席。',
    rsvpSaveError: '保存回复时出现错误，请重试。',
    rsvpQuestions: '有问题？',
    rsvpEmailUs: '发送邮件联系我们',
    rsvpComingSoonTitle: '回复通道即将开放',
    rsvpComingSoonBody: '我们正在做最后的准备。届时您可以直接在这里回复出席情况——一切就绪后我们会第一时间通知您。',

    // Story
    storyTitle: '我们的故事',
    storyClosing: '我们无比珍视能与你们共同见证这一新篇章，迫不及待地期待在长木花园与大家共同庆祝，续写我们的故事。',
    storyEvents: [
      {
        year: '2020年',
        title: '初次相遇',
        paragraphs: [
          '我和雨薇都是密歇根大学的博士生——我学数学，她学计算机科学——两条轨迹本不相交，直到疫情初期，我们在网上相识。那时我有60%的把握认为她是间谍，心想一旦她发现我的研究毫无窃取价值，便会就此离去。',
          '第一次约会，我们去了密歇根树木园，两人都被蚊子叮了不少包。第二次约会，我拿出自酿的特帕切发酵饮料款待她——我解释说，我相当确信里面没有肉毒杆菌，而发酵桶放在浴缸里，只是以防万一它爆炸。就这样约会几次之后，我突然发现自己正在为她做一个花架，也意识到我们都是认真的。',
        ],
      },
      {
        year: '2021 – 2025年',
        title: '携手成长',
        paragraphs: [
          '此后几年，我们相互扶持，一同走过实习、博士论文、毕业典礼与求职的每一个阶段。我在费城实习时，雨薇来陪伴我，我们也在那时发现自己大概是典型的城市人（包雨薇备注：才不是呢）。之后她赴西雅图完成论文与实习，我们经历了一段异地恋，最终双双在纽约找到了工作。',
          '我们在泽西市租了一套哈德逊河畔的公寓（"泽西市……？真的吗？"我的家人带着一丝不以为然地说）。在我向她普及了布鲁斯·斯普林斯汀之后，我们便顺理成章地融入了那群每天通勤进城的年轻白领。雨薇参加了我家的逾越节晚宴、感恩节聚会，偶尔还有滑雪之旅，她的热情、善良与品味很快赢得了我家人的喜爱。我也随她回中国探亲，尽管我是个普通话不太灵光的老外，他们仍给予了我极其热情的欢迎。',
        ],
      },
      {
        year: '2026年1月',
        title: '求婚',
        paragraphs: [
          '我们渐渐习惯了城市生活的节奏——沿河散步，与猫咪共进露台晚餐，乘PATH列车通勤。时机显然已经成熟，于是在1月3日，我们在一家俯瞰曼哈顿下城的意大利餐厅门外，正式订婚。',
          '几周后，我们在纽约市政厅完婚，正式开启了我们共同的未来。',
        ],
      },
    ],

    // FAQ
    faqTitle: '常见问题',
    faqSections: [
      {
        heading: '仪式与场地',
        color: 'text-primary/55',
        items: [
          {
            q: '婚礼仪式在室内还是户外举行？',
            a: '婚礼仪式将于哈特菲尔德户外举行。鸡尾酒时间与晚宴随后在长木花园室内举行。如遇恶劣天气，我们已备有精美的室内备选方案。',
          },
          {
            q: '婚礼场地在哪里？',
            a: '仪式场地：哈特菲尔德，地址为 1 Hartefeld Dr, Avondale, PA 19311。鸡尾酒时间与晚宴场地：长木花园，地址为 1001 Longwood Road, Kennett Square, Pennsylvania 19348，位于费城西南约50公里处。',
          },
          {
            q: '场地是否提供停车？',
            a: '是的——哈特菲尔德和长木花园均提供免费停车。',
          },
          {
            q: '场地与酒店之间是否有交通接送？',
            a: '当晚将提供免费班车，往返于推荐酒店与婚礼场地之间。详细班车信息将于婚礼前发送给各位宾客。',
          },
        ],
      },
      {
        heading: '着装与注意事项',
        color: 'text-secondary/55',
        items: [
          {
            q: '着装要求是什么？',
            a: '园林正式礼服。欢迎富有创意的正式着装，花卉图案、宝石色系、柔和中性色均非常适合。由于仪式在户外举行，建议女士穿着粗跟鞋、坡跟鞋或平底鞋。',
          },
          {
            q: '10月份的天气如何？',
            a: '宾夕法尼亚州10月气候宜人，日间气温约为15–21°C，入夜后气温较低。建议携带一件轻薄外套或披肩。',
          },
          {
            q: '仪式期间可以拍照吗？',
            a: '仪式期间，希望大家全程投入，请暂时放下手机与相机——我们已邀请专业摄影师记录每一个珍贵瞬间。鸡尾酒时间与晚宴期间，欢迎自由拍照留念。',
          },
          {
            q: '可以携带孩子参加吗？',
            a: '我们非常欢迎小朋友！请参阅您的邀请函，确认您的宾客名额。',
          },
        ],
      },
      {
        heading: '回复与礼品',
        color: 'text-primary/55',
        items: [
          {
            q: '回复截止日期是什么时候？',
            a: '请于2026年9月1日（AOE国际日期变更线时间，11:59 PM）前回复，以便我们与场地及餐饮团队确认最终人数。',
          },
          {
            q: '可以携带同伴吗？',
            a: '由于场地容量有限，我们只能接待邀请函上注明的宾客。您的邀请函将注明是否包含同伴名额。',
          },
          {
            q: '是否提供特殊饮食安排？',
            a: '当然。请在回复时告知我们您的饮食限制或过敏情况，我们将确保餐饮团队为您提供周到的照顾。',
          },
          {
            q: '你们在哪里注册了礼品单？',
            a: '详情请见心愿单页面。您的到来是对我们最好的礼物——若您希望赠礼，我们将不胜感激。',
          },
          {
            q: '如有更多问题，应联系谁？',
            a: '请发送邮件至 bellabenbao@gmail.com，我们很乐意为您解答。',
          },
        ],
      },
    ],

    // Registry
    registryTitle: '心愿单',
    registryIntro: '我们很幸运，并不需要太多物质礼物（而且泽西市的小公寓也放不下）。若您想表达心意，欢迎以我们的名字向下方的慈善机构捐赠。',
    registryGamesIntro: '若您希望送我们一份礼物，可以玩玩下面的小游戏，为我们的蜜月基金出一份力，帮助我们一起建立新生活。',
    registryHomeKitchen: '家居厨房',
    registryGourmet: '精品厨具',
    registryUniversal: '通用礼品单',
    registryView: '查看',
    registryHoneymoon: '蜜月基金',
    registryHoneymoonDest: '日本',
    registryHoneymoonDesc: '我们计划前往日本度过难忘的蜜月，探访古老的寺庙，漫步竹林，欣赏启发了我们婚礼主题的精美花园。',
    registryContribute: '支持我们',
    registryContact: '有任何问题？请发送邮件至',
  },
} as const;
