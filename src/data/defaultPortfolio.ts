import type { ApiPortfolioData } from '../types/api'

export const DEFAULT_PORTFOLIO: ApiPortfolioData = {
  _id: '6a0a16b75d559477df43824a',
  siteConfig: {
    siteName: 'Cluwudy',
    siteSubtitle: 'portfolio',
    pageTitle: 'Cluwudy — Artist Portfolio',
    metaDescription:
      'Original character art, fan art, and commission info by Cluwudy.',
    logoIcon: 'Cloud',
  },
  heroContent: {
    pillIcon: 'Palette',
    pillLabel: 'Original character introduction',
    eyebrow: 'Cluwudy',
    headline: 'Welcome to my portfolio.',
    body: 'I create original character art and commissions.',
    accent: 'Bringing characters to life.',
    image:
      'https://res.cloudinary.com/dpxrt2vpb/image/upload/v1779358673/cloudy-portfolio/mdbxt3wkbh4d46bvnhkz.webp',
    imageAlt: 'Cloudy PNGTuber character',
    statusPillLabel: 'Original character spotlight',
    ctaButtons: [
      {
        label: 'View artwork',
        href: '#gallery',
        variant: 'primary',
        icon: 'Image',
      },
      {
        label: 'Request commission',
        href: '#contact',
        variant: 'secondary',
      },
    ],
  },
  gallerySection: {
    eyebrow: 'Artwork gallery',
    title: 'My recent work.',
    description: 'A collection of original characters and fan art.',
  },
  commissions: {
    section: {
      eyebrow: 'Commissions',
      title: 'Commission pricing.',
      description: 'Choose a tier that fits your needs.',
    },
    featured: {
      tag: 'Popular',
      badge: 'Best Value',
      title: 'Full Illustration',
      description: 'Complete character illustration with background.',
      highlights: [
        'Detailed rendering',
        'Background included',
        'Commercial rights',
      ],
    },
  },
  faqPage: {
    section: {
      eyebrow: 'FAQ & TOS',
      title: 'Questions & terms.',
      description:
        'Everything you need to know before commissioning.',
    },
    faqHeading: 'Common questions',
    tosHeading: 'Terms of service',
    tosAcceptanceText:
      'By commissioning me, you agree to the following terms of service.',
  },
  contactContent: {
    section: {
      eyebrow: 'Contact',
      title: 'Get in touch.',
      description: 'Send me a message about your commission.',
    },
    infoCard: {
      tag: 'Info',
      title: 'Commission inquiries',
      description: 'I usually respond within 2 business days.',
      notes: [
        'Include character references',
        'Describe your idea clearly',
      ],
    },
    form: {
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          placeholder: 'Your name',
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
        },
        {
          name: 'message',
          label: 'Message',
          type: 'textarea',
          placeholder: 'Describe your commission idea',
          rows: 6,
        },
      ],
      submitLabel: 'Send message',
      submitIcon: 'ArrowRight',
      disclaimer:
        'Your information will only be used to respond to your inquiry.',
    },
  },
  footerContent: {
    copyright: '© 2026 Cluwudy. All rights reserved.',
    tagline: 'Made with love and lots of coffee.',
  },
  nav: [
    { id: 'home', label: 'Home', icon: 'House' },
    { id: 'gallery', label: 'Artwork', icon: 'Image' },
    { id: 'commissions', label: 'Commissions', icon: 'Palette' },
    { id: 'faq', label: 'FAQ & TOS', icon: 'ChatCircleText' },
    { id: 'contact', label: 'Contact', icon: 'Envelope' },
  ],
  socials: [
    {
      platform: 'instagram',
      url: 'https://instagram.com/',
      label: 'Instagram',
      icon: 'InstagramLogo',
    },
    {
      platform: 'twitter',
      url: 'https://twitter.com/',
      label: 'Twitter',
      icon: 'TwitterLogo',
    },
    {
      platform: 'discord',
      url: 'https://discord.gg/',
      label: 'Discord',
      icon: 'DiscordLogo',
    },
  ],
  artworks: [
    {
      _id: '6a0edae66f9e29152f5ffab4',
      title: 'Water Spirit',
      category: 'Original',
      description:
        'An original character design of a cute water-themed girl with flowing aquatic elements.',
      imageUrl:
        'https://res.cloudinary.com/dpxrt2vpb/image/upload/v1779358435/cloudy-portfolio/rjes4nxggkdxotgsjsvh.webp',
      altText: 'Cute water girl original character illustration',
      sortOrder: 0,
      createdAt: '2026-05-21T10:13:58.431Z',
      updatedAt: '2026-05-22T10:11:20.577Z',
    },
    {
      _id: '6a0edad86f9e29152f5ffab3',
      title: 'Fischl Fan Art',
      category: 'Fan Art',
      description:
        'A detailed fan art illustration of Fischl from Genshin Impact, featuring dynamic lighting and rich color palette.',
      imageUrl:
        'https://res.cloudinary.com/dpxrt2vpb/image/upload/v1779358421/cloudy-portfolio/plyamzfxtwklvd9uyfdu.webp',
      altText:
        'Fischl fan art illustration with detailed character design',
      sortOrder: 1,
      createdAt: '2026-05-21T10:13:44.253Z',
      updatedAt: '2026-05-22T10:11:20.577Z',
    },
    {
      _id: '6a0edb496f9e29152f5ffab5',
      title: 'Cloudy PNGTuber',
      category: 'VTuber',
      description:
        'A PNGTuber design featuring the Cloudy character with expressive poses and accessories.',
      imageUrl:
        'https://res.cloudinary.com/dpxrt2vpb/image/upload/v1779358535/cloudy-portfolio/wqrnjxu9uzcckz9ka07l.webp',
      altText: 'Cloudy PNGTuber character design',
      sortOrder: 2,
      createdAt: '2026-05-21T10:15:37.474Z',
      updatedAt: '2026-05-22T10:11:20.577Z',
    },
    {
      _id: '6a0edb6c6f9e29152f5ffab6',
      title: 'Cloudy PNGTuber Remake',
      category: 'VTuber',
      description:
        'A PNGTuber remake of the Cloudy character with refined details and updated design.',
      imageUrl:
        'https://res.cloudinary.com/dpxrt2vpb/image/upload/v1779358570/cloudy-portfolio/imzsu04bf7nlz3wdswdg.webp',
      altText: 'Cloudy PNGTuber character remake design',
      sortOrder: 3,
      createdAt: '2026-05-21T10:16:12.743Z',
      updatedAt: '2026-05-22T10:11:20.577Z',
    },
    {
      _id: '6a0edb8f6f9e29152f5ffab7',
      title: 'Rhythm Girl',
      category: 'Original',
      description:
        'An energetic original character design with a rhythm and music theme, featuring vibrant colors.',
      imageUrl:
        'https://res.cloudinary.com/dpxrt2vpb/image/upload/v1779358604/cloudy-portfolio/odn8o1nvuxoxf7bpzprq.webp',
      altText: 'Rhythm girl original character with music theme',
      sortOrder: 4,
      createdAt: '2026-05-21T10:16:47.308Z',
      updatedAt: '2026-05-22T10:11:20.577Z',
    },
    {
      _id: '6a0edba96f9e29152f5ffab8',
      title: 'Vampire Portrait',
      category: 'Original',
      description:
        'A stylish vampire character portrait with dark elegant aesthetics and detailed rendering.',
      imageUrl:
        'https://res.cloudinary.com/dpxrt2vpb/image/upload/v1779358631/cloudy-portfolio/m3zkbyqo7bjn60au5dff.webp',
      altText: 'Elegant vampire character portrait illustration',
      sortOrder: 5,
      createdAt: '2026-05-21T10:17:13.580Z',
      updatedAt: '2026-05-22T10:11:20.577Z',
    },
  ],
  commissionTiers: [
    {
      _id: '6a0a16b85d559477df43824e',
      name: 'Bust Sketch',
      priceLabel: '$25–$40',
      detailTag: 'Sketch / Lineart',
      description:
        'A clean bust-level sketch with optional flat colors.',
      sortOrder: 0,
      createdAt: '2026-05-17T19:27:52.179Z',
      updatedAt: '2026-05-17T19:27:52.179Z',
    },
    {
      _id: '6a0a16b85d559477df43824f',
      name: 'Half-Body Illustration',
      priceLabel: '$60–$90',
      detailTag: 'Full Color / Shaded',
      description:
        'Half-body illustration with full color rendering and simple background.',
      sortOrder: 1,
      createdAt: '2026-05-17T19:27:52.179Z',
      updatedAt: '2026-05-17T19:27:52.179Z',
    },
    {
      _id: '6a0a16b85d559477df438250',
      name: 'Full Illustration',
      priceLabel: '$120–$180',
      detailTag: 'Full Render / Background',
      description:
        'Complete character illustration with detailed background and effects.',
      sortOrder: 2,
      createdAt: '2026-05-17T19:27:52.179Z',
      updatedAt: '2026-05-17T19:27:52.179Z',
    },
  ],
  faqItems: [
    {
      _id: '6a0fe9f46f9e29152f5ffab9',
      question: 'How do I commission you?',
      answer:
        'You can reach out through the contact form on this site, or message me on Instagram, TikTok, or Discord. Please include references and details about what you want!',
      sortOrder: 0,
      createdAt: '2026-05-22T05:30:28.317Z',
      updatedAt: '2026-05-22T05:30:28.317Z',
    },
    {
      _id: '6a0fe9f56f9e29152f5ffaba',
      question: 'How long will my commission take?',
      answer:
        'I will start in 2 days to 2 weeks. Paintings will take more time since they are detailed. Please keep in mind I might have many commissions in my waitlist. Rush commissions are available with a +100% fee.',
      sortOrder: 1,
      createdAt: '2026-05-22T05:30:29.435Z',
      updatedAt: '2026-05-22T05:30:29.435Z',
    },
    {
      _id: '6a0fe9f66f9e29152f5ffabb',
      question: 'Can I use the artwork for streaming?',
      answer:
        'Personal use as a commissioner includes Twitch, YouTube, or any streaming platforms. Commercial usage is automatically included for VTuber commissions. For other commercial uses, additional rights must be purchased.',
      sortOrder: 2,
      createdAt: '2026-05-22T05:30:30.461Z',
      updatedAt: '2026-05-22T05:30:30.461Z',
    },
    {
      _id: '6a0fe9f76f9e29152f5ffabc',
      question: 'Do you offer refunds?',
      answer:
        'I do not offer refunds unless I cannot finish your commission. If I cannot complete it, you will be fully refunded. However, if I have to refund for any other reason, you will be permanently blacklisted.',
      sortOrder: 3,
      createdAt: '2026-05-22T05:30:31.668Z',
      updatedAt: '2026-05-22T05:30:31.668Z',
    },
    {
      _id: '6a0fe9f86f9e29152f5ffabd',
      question: 'Can I request changes to the art style?',
      answer:
        'Commissioners must respect my art style — I will not amend the color palette or line-art style to copy another artist. Minor revisions within my style are welcome during the process.',
      sortOrder: 4,
      createdAt: '2026-05-22T05:30:32.713Z',
      updatedAt: '2026-05-22T05:30:32.713Z',
    },
  ],
  tosSections: [
    {
      _id: '6a0fe9fc6f9e29152f5ffabe',
      heading: 'General Terms',
      variant: 'default',
      points: [
        'Commissioning me means you have read and accepted the TOS.',
        'I have the right to decline any commission for any reason.',
        'I maintain the copyright for all my artwork and can use it on portfolios/projects displaying my work. I will use it as my pfp for a short time, post it on my socials, etc. A small fee might apply for NDA.',
        'Commercial usage is automatically included for VTuber Commissions.',
        'The commissioner is free to use it for personal purposes and repost the artwork anywhere as long as credit is given. Use as social media icon, decoration, etc. It includes Twitch, YouTube or any streaming platforms as personal use.',
        'Commissioner must respect my art style, meaning they will not ask to amend the color palette and the style of line-art. I will not copy any other artist\'s art style.',
        'Prices may increase without notice. Customers who purchased a commission before the price change are not affected.',
      ],
      sortOrder: 0,
      createdAt: '2026-05-22T05:30:36.610Z',
      updatedAt: '2026-05-22T05:30:36.610Z',
    },
    {
      _id: '6a0fe9fd6f9e29152f5ffabf',
      heading: 'You Are NOT Allowed To',
      variant: 'prohibited',
      points: [
        'Take credit for the artwork.',
        'Trace or change the artwork without permission.',
        'Remove my signature from the artwork.',
        'Sell the artwork.',
        'Use it for AI learning, generation, or sampling.',
        'Use it for NFT or blockchain purposes.',
        'Resell or use the artwork for redistribution and external projects, commercial or non-commercial (i.e. t-shirts, mugs, public flyers, etc.) unless previously agreed on.',
      ],
      sortOrder: 1,
      createdAt: '2026-05-22T05:30:37.831Z',
      updatedAt: '2026-05-22T05:30:37.831Z',
    },
    {
      _id: '6a0fe9ff6f9e29152f5ffac0',
      heading: 'Refund Policy',
      variant: 'default',
      points: [
        'I DO NOT offer refunds unless I cannot finish your commission. Please do not assume I cannot finish your commission.',
        'If I cannot do your commission, you will be fully refunded.',
        'If I have to refund for any other reason, you will be permanently blacklisted.',
      ],
      sortOrder: 2,
      createdAt: '2026-05-22T05:30:39.268Z',
      updatedAt: '2026-05-22T05:30:39.268Z',
    },
    {
      _id: '6a0fea006f9e29152f5ffac1',
      heading: 'Commercial Rights',
      variant: 'info',
      points: [
        'Once commercial rights have been purchased, they are bound only to the purchaser.',
        'The purchaser is free to make profits of any scale.',
        'Commercial rights do NOT include NFTs and AI usage — even with commercial usage purchased.',
      ],
      sortOrder: 3,
      createdAt: '2026-05-22T05:30:40.497Z',
      updatedAt: '2026-05-22T05:30:40.497Z',
    },
    {
      _id: '6a0fea016f9e29152f5ffac2',
      heading: 'Deadlines & Delivery',
      variant: 'info',
      points: [
        'I will start in 2 days to 2 weeks. Paintings will take more time since they are detailed.',
        'Do not rush me — keep in mind that I might have many commissions in my waitlist.',
        'You can order a rush commission with +100% fee. It will bump your order.',
      ],
      sortOrder: 4,
      createdAt: '2026-05-22T05:30:41.929Z',
      updatedAt: '2026-05-22T05:30:41.929Z',
    },
    {
      _id: '6a0fea036f9e29152f5ffac3',
      heading: 'Usage',
      variant: 'default',
      points: [
        'Only personal use if commercial rights were not purchased — which means you cannot use my artwork on streaming platforms, as merch, etc.',
      ],
      sortOrder: 5,
      createdAt: '2026-05-22T05:30:43.056Z',
      updatedAt: '2026-05-22T05:30:43.056Z',
    },
    {
      _id: '6a0fea046f9e29152f5ffac4',
      heading: 'Communication',
      variant: 'info',
      points: [
        'I will contact you via email if you don\'t provide any socials.',
        'I mostly use Instagram, TikTok, and Discord.',
      ],
      sortOrder: 6,
      createdAt: '2026-05-22T05:30:44.592Z',
      updatedAt: '2026-05-22T05:30:44.592Z',
    },
  ],
}
