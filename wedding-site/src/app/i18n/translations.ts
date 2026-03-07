export type Lang = 'en' | 'zh';

export const t = {
  en: {
    // Navigation
    navLogo: 'Yuwei & Benjamin',
    home: 'Home',
    gallery: 'Gallery',

    // Password Gate
    enterPassword: 'Enter password',
    incorrectPassword: 'Incorrect password',
    enter: 'Enter',

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
  },
  zh: {
    // Navigation
    navLogo: '包雨薇 & 本杰明',
    home: '主页',
    gallery: '相册',

    // Password Gate
    enterPassword: '请输入密码',
    incorrectPassword: '密码错误，请重试',
    enter: '进入',

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
  },
} as const;
