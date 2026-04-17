const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const MarketingCampaign = require('../models/MarketingCampaign');
const Order = require('../models/Order');
const { COUPON_CONFIG } = require('../utils/coupons');
const { protect, admin } = require('../middleware/auth');

const COUPON_MOCK_PROFILE = {
  NEON20: {
    salesCount: 24,
    attributedRevenue: 85640,
    totalDiscount: 17128,
    customers: [
      { name: 'Aarav Mehta', purchased: 'AI Bootcamp Weekend', amount: 4282 },
      { name: 'Ishita Rao', purchased: 'Cloud Architect Live', amount: 3568 },
      { name: 'Naman Kulkarni', purchased: 'React Pro Sprint', amount: 3890 },
    ],
  },
  KING20: {
    salesCount: 19,
    attributedRevenue: 69220,
    totalDiscount: 13844,
    customers: [
      { name: 'Kunal Bansal', purchased: 'Backend APIs Mastery', amount: 3640 },
      { name: 'Pooja Menon', purchased: 'Frontend Scale Summit', amount: 3410 },
      { name: 'Ravi Verma', purchased: 'DevOps Deep Dive', amount: 3825 },
    ],
  },
  APDH20: {
    salesCount: 16,
    attributedRevenue: 58810,
    totalDiscount: 11762,
    customers: [
      { name: 'Anjali Sethi', purchased: 'Data Engineering Lab', amount: 3490 },
      { name: 'Harsh Pandey', purchased: 'System Design Intensive', amount: 3780 },
      { name: 'Neha Iyer', purchased: 'AI Product Workshop', amount: 3210 },
    ],
  },
  THUG10: {
    salesCount: 13,
    attributedRevenue: 51420,
    totalDiscount: 5142,
    customers: [
      { name: 'Rahul Thomas', purchased: 'Cybersecurity Primer', amount: 3620 },
      { name: 'Divya Patil', purchased: 'Node.js Production Track', amount: 3845 },
      { name: 'Faizan Ali', purchased: 'Modern Testing Workshop', amount: 3295 },
    ],
  },
  DARE10: {
    salesCount: 11,
    attributedRevenue: 47280,
    totalDiscount: 4728,
    customers: [
      { name: 'Shruti Nanda', purchased: 'Performance Tuning Camp', amount: 3520 },
      { name: 'Gaurav Jain', purchased: 'Microservices in Practice', amount: 4010 },
      { name: 'Mitali Shah', purchased: 'UX for Engineers', amount: 3185 },
    ],
  },
  LEEP20: {
    salesCount: 21,
    attributedRevenue: 74460,
    totalDiscount: 14892,
    customers: [
      { name: 'Pranav Joshi', purchased: 'JavaScript Architecture Day', amount: 3725 },
      { name: 'Sneha Kapoor', purchased: 'Cloud Native Foundations', amount: 3960 },
      { name: 'Vikram Anand', purchased: 'API Security Accelerator', amount: 3550 },
    ],
  },
};

const COUPON_EXPIRY_MOCK = {
  NEON20: '2026-12-31',
  KING20: '2026-11-30',
  APDH20: '2026-10-31',
  THUG10: '2026-09-30',
  DARE10: '2026-08-31',
  LEEP20: '2026-12-15',
};

const CAMPAIGN_TABLE_MOCK = [
  {
    campaignName: 'Summer Tech Upskill Drive',
    type: 'Email',
    targetAudience: 4200,
    status: 'active',
    conversions: 328,
  },
  {
    campaignName: 'Weekend Workshop Reminder',
    type: 'Notification',
    targetAudience: 3500,
    status: 'scheduled',
    conversions: 242,
  },
  {
    campaignName: 'Referral Booster Sprint',
    type: 'Email',
    targetAudience: 2100,
    status: 'active',
    conversions: 186,
  },
  {
    campaignName: 'Abandoned Checkout Nudges',
    type: 'Notification',
    targetAudience: 1700,
    status: 'completed',
    conversions: 139,
  },
];

router.post('/subscribe', async (req, res) => {
  try {
    const { email, source } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });

    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        existingSubscriber.status = 'active';
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();

        return res.status(200).json({
          success: true,
          message: 'You have been re-subscribed successfully!',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed',
      });
    }

    const subscriber = await Subscriber.create({
      email: email.toLowerCase(),
      source: source || 'footer',
      referralCode: req.query.ref || null,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing!',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

router.get('/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ status: 'active' }).sort({ subscribedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

router.get('/insights', protect, admin, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      activeSubscribers,
      newSubscribers7d,
      totalCampaigns,
      activeCampaigns,
      referralSignups,
      campaignsRaw,
      orderSnapshot,
      couponPerformanceRaw,
      couponOrdersRaw,
      subscriberSourceRaw,
    ] =
      await Promise.all([
        Subscriber.countDocuments({ status: 'active' }),
        Subscriber.countDocuments({ status: 'active', createdAt: { $gte: sevenDaysAgo } }),
        MarketingCampaign.countDocuments(),
        MarketingCampaign.countDocuments({ status: 'active' }),
        Subscriber.countDocuments({
          status: 'active',
          $or: [
            { source: /referral/i },
            { referralCode: { $exists: true, $ne: null } },
          ],
        }),
        MarketingCampaign.find()
          .select(
            'name type status sentCount openedCount clickedCount convertedCount targetAudienceCount targetSegment'
          )
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        Order.aggregate([
          {
            $match: {
              paymentStatus: 'completed',
              orderStatus: 'confirmed',
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
            },
          },
        ]),
        Order.aggregate([
          {
            $match: {
              paymentStatus: 'completed',
              orderStatus: 'confirmed',
              couponCode: { $exists: true, $ne: '' },
            },
          },
          {
            $group: {
              _id: { code: '$couponCode', owner: '$couponOwner' },
              orders: { $sum: 1 },
              users: { $addToSet: '$user' },
              totalDiscount: { $sum: '$couponDiscountAmount' },
              attributedRevenue: { $sum: '$totalAmount' },
            },
          },
          { $sort: { attributedRevenue: -1 } },
        ]),
        Order.find({
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
          couponCode: { $exists: true, $ne: '' },
        })
          .select('couponCode totalAmount tickets.eventTitle user createdAt')
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .limit(240)
          .lean(),
        Subscriber.aggregate([
          { $match: { status: 'active' } },
          {
            $group: {
              _id: '$source',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const campaignTotals = campaignsRaw.reduce(
      (acc, campaign) => {
        acc.sent += Number(campaign.sentCount || 0);
        acc.opened += Number(campaign.openedCount || 0);
        acc.clicked += Number(campaign.clickedCount || 0);
        acc.converted += Number(campaign.convertedCount || 0);
        return acc;
      },
      { sent: 0, opened: 0, clicked: 0, converted: 0 }
    );

    const impressions = Math.max(campaignTotals.sent * 4, activeSubscribers * 10, 12000);
    const clicks = Math.max(campaignTotals.clicked, Math.round(impressions * 0.055));
    const leads = Math.max(campaignTotals.opened, Math.round(clicks * 0.36));
    const purchases = Math.max(campaignTotals.converted, orderSnapshot[0]?.orders || 0);

    const totalRevenue = Number(orderSnapshot[0]?.totalRevenue || 0);

    const realCouponMap = new Map(
      couponPerformanceRaw.map((coupon) => [coupon._id.code, coupon])
    );

    const customerHighlightsMap = new Map();
    couponOrdersRaw.forEach((order) => {
      const code = String(order.couponCode || '').toUpperCase();
      if (!code || !COUPON_CONFIG[code]) {
        return;
      }

      if (!customerHighlightsMap.has(code)) {
        customerHighlightsMap.set(code, []);
      }

      const highlights = customerHighlightsMap.get(code);
      const customerName = order.user?.name || 'Guest User';
      const purchased = Array.from(
        new Set((order.tickets || []).map((ticket) => ticket.eventTitle).filter(Boolean))
      ).join(', ') || 'Tech Event Pass';

      if (!highlights.find((item) => item.name === customerName && item.purchased === purchased)) {
        highlights.push({
          name: customerName,
          purchased,
          amount: Number(order.totalAmount || 0),
        });
      }
    });

    const couponPerformance = Object.entries(COUPON_CONFIG).map(([couponCode, config]) => {
      const real = realCouponMap.get(couponCode);
      const mock = COUPON_MOCK_PROFILE[couponCode] || {
        salesCount: 0,
        attributedRevenue: 0,
        totalDiscount: 0,
        customers: [],
      };

      const realHighlights = (customerHighlightsMap.get(couponCode) || []).slice(0, 6);
      const customerHighlights = realHighlights.length > 0 ? realHighlights : mock.customers;
      const realOrders = Number(real?.orders || 0);
      const realUsersCount = Number(real?.users?.length || 0);
      const realRevenue = Number(real?.attributedRevenue || 0);
      const realDiscount = Number(real?.totalDiscount || 0);

      return {
        couponCode,
        couponOwner: real?._id?.owner || config.owner || 'Platform Promo Team',
        orders: realOrders > 0 ? realOrders : mock.salesCount,
        usersCount: realUsersCount > 0 ? realUsersCount : customerHighlights.length,
        totalDiscount: Number((realDiscount > 0 ? realDiscount : mock.totalDiscount).toFixed(2)),
        attributedRevenue: Number(
          (realRevenue > 0 ? realRevenue : mock.attributedRevenue).toFixed(2)
        ),
        customerHighlights,
      };
    });

    const maxCouponRevenue = Math.max(
      ...couponPerformance.map((coupon) => Number(coupon.attributedRevenue || 0)),
      1
    );

    const couponInfographics = couponPerformance.map((coupon) => ({
      ...coupon,
      revenueSharePercent: Number(
        ((Number(coupon.attributedRevenue || 0) / maxCouponRevenue) * 100).toFixed(2)
      ),
      avgSaleValue:
        Number(coupon.orders || 0) > 0
          ? Number((Number(coupon.attributedRevenue || 0) / Number(coupon.orders || 1)).toFixed(2))
          : 0,
    }));

    const activeCoupons = couponPerformance.map((coupon) => {
      const expiryDate = COUPON_EXPIRY_MOCK[coupon.couponCode] || '2026-12-31';
      const discountPercent = Number(COUPON_CONFIG[coupon.couponCode]?.discountPercent || 0);
      const usageCount = Number(coupon.orders || 0);

      return {
        couponCode: coupon.couponCode,
        discountPercent,
        usageCount,
        expiryDate,
        isActive: new Date(expiryDate) >= new Date(),
      };
    });

    const couponUsage = activeCoupons.reduce((sum, coupon) => sum + Number(coupon.usageCount || 0), 0);

    const campaignTable = campaignsRaw
      .map((campaign) => ({
        campaignName: campaign.name,
        type: ['email', 'newsletter'].includes(String(campaign.type || '').toLowerCase())
          ? 'Email'
          : 'Notification',
        targetAudience: Number(campaign.targetAudienceCount || 0),
        status: campaign.status || 'draft',
        conversions: Number(campaign.convertedCount || 0),
      }))
      .sort((a, b) => b.conversions - a.conversions);

    const campaignTableRows = campaignTable.length > 0 ? campaignTable : CAMPAIGN_TABLE_MOCK;

    const totalConversions = campaignTableRows.reduce(
      (sum, campaign) => sum + Number(campaign.conversions || 0),
      0
    );

    const conversionRateTrend = [
      { period: 'Nov', conversionRate: 2.8 },
      { period: 'Dec', conversionRate: 3.1 },
      { period: 'Jan', conversionRate: 3.4 },
      { period: 'Feb', conversionRate: 3.2 },
      { period: 'Mar', conversionRate: 3.7 },
      { period: 'Apr', conversionRate: 4.1 },
    ];

    const sourceBuckets = subscriberSourceRaw.reduce(
      (acc, sourceEntry) => {
        const source = String(sourceEntry._id || '').toLowerCase();
        const count = Number(sourceEntry.count || 0);

        if (/referral/.test(source)) {
          acc.referral += count;
        } else if (/instagram|linkedin|facebook|social/.test(source)) {
          acc.social += count;
        } else {
          acc.direct += count;
        }
        return acc;
      },
      { direct: 0, referral: 0, social: 0 }
    );

    if (sourceBuckets.direct + sourceBuckets.referral + sourceBuckets.social === 0) {
      sourceBuckets.direct = 420;
      sourceBuckets.referral = 295;
      sourceBuckets.social = 510;
    }

    const trafficSourceBreakdown = [
      { source: 'Direct', value: sourceBuckets.direct },
      { source: 'Referral', value: sourceBuckets.referral },
      { source: 'Social', value: sourceBuckets.social },
    ];

    const channelPerformance = [
      {
        channel: 'Instagram Ads',
        spend: 145000,
        leads: Math.round(leads * 0.29),
        conversions: Math.round(purchases * 0.25),
      },
      {
        channel: 'LinkedIn Sponsored',
        spend: 110000,
        leads: Math.round(leads * 0.22),
        conversions: Math.round(purchases * 0.24),
      },
      {
        channel: 'Google Search Ads',
        spend: 160000,
        leads: Math.round(leads * 0.31),
        conversions: Math.round(purchases * 0.33),
      },
      {
        channel: 'Google Display',
        spend: 90000,
        leads: Math.round(leads * 0.18),
        conversions: Math.round(purchases * 0.12),
      },
    ].map((channel) => {
      const revenueShare = purchases > 0 ? channel.conversions / purchases : 0;
      const attributedRevenue = Number((totalRevenue * revenueShare).toFixed(2));
      const roas = channel.spend > 0 ? attributedRevenue / channel.spend : 0;

      return {
        ...channel,
        attributedRevenue,
        roas: Number(roas.toFixed(2)),
      };
    });

    const socialAdsPerformance = [
      {
        platform: 'Instagram Ads',
        spend: 125000,
        crowdReached: 198000,
        clicks: 7420,
        leads: 1430,
        conversions: 312,
      },
      {
        platform: 'YouTube Ads',
        spend: 168000,
        crowdReached: 265000,
        clicks: 6880,
        leads: 1645,
        conversions: 358,
      },
      {
        platform: 'LinkedIn Ads',
        spend: 98000,
        crowdReached: 121000,
        clicks: 4125,
        leads: 990,
        conversions: 225,
      },
    ].map((item) => ({
      ...item,
      cpc: item.clicks > 0 ? Number((item.spend / item.clicks).toFixed(2)) : 0,
      cac: item.conversions > 0 ? Number((item.spend / item.conversions).toFixed(2)) : 0,
      leadToConversionRate:
        item.leads > 0 ? Number(((item.conversions / item.leads) * 100).toFixed(2)) : 0,
    }));

    const socialPosts = [
      {
        platform: 'Instagram',
        type: 'Reel',
        title: 'Code Faster with AI: Live Weekend Sprint',
        caption:
          'Join 2-day hands-on sprint with real projects and mentor feedback. Limited seats.',
        postUrl: 'https://www.instagram.com/p/C9ReactSprint/',
        crowdReached: 86200,
        conversions: 146,
      },
      {
        platform: 'Instagram',
        type: 'Carousel',
        title: 'Top 5 Skills Hiring Managers Need in 2026',
        caption: 'Swipe through practical roadmap + register directly from bio link.',
        postUrl: 'https://www.instagram.com/p/C9SkillRoadmap/',
        crowdReached: 57400,
        conversions: 89,
      },
      {
        platform: 'YouTube',
        type: 'Video Ad',
        title: 'From Developer to Architect in 90 Days',
        caption: 'Watch full curriculum breakdown and enrollment bonus details.',
        postUrl: 'https://www.youtube.com/watch?v=mockArchitectTrack01',
        crowdReached: 143500,
        conversions: 201,
      },
      {
        platform: 'YouTube',
        type: 'Shorts',
        title: 'System Design Crash Tips (60 sec)',
        caption: 'Quick design tips + CTA to book full workshop.',
        postUrl: 'https://www.youtube.com/shorts/mockSystemDesignTips',
        crowdReached: 78500,
        conversions: 112,
      },
      {
        platform: 'LinkedIn',
        type: 'Sponsored Post',
        title: 'Engineering Leaders: Team Upskilling Blueprint',
        caption: 'High-impact upskilling strategy for product and platform teams.',
        postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:mockEnterpriseSkill01/',
        crowdReached: 61200,
        conversions: 104,
      },
      {
        platform: 'LinkedIn',
        type: 'Document Post',
        title: '2026 Hiring Skills Report for Tech Teams',
        caption: 'Download report + register for panel discussion.',
        postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:mockHiringReport02/',
        crowdReached: 43800,
        conversions: 76,
      },
    ];

    const totalAdSpend = socialAdsPerformance.reduce((sum, ad) => sum + Number(ad.spend || 0), 0);
    const totalAdClicks = socialAdsPerformance.reduce((sum, ad) => sum + Number(ad.clicks || 0), 0);
    const totalAdLeads = socialAdsPerformance.reduce((sum, ad) => sum + Number(ad.leads || 0), 0);
    const totalAdConversions = socialAdsPerformance.reduce(
      (sum, ad) => sum + Number(ad.conversions || 0),
      0
    );

    const marketingUnitEconomics = {
      totalAdSpend: Number(totalAdSpend.toFixed(2)),
      totalAdClicks,
      totalAdLeads,
      totalAdConversions,
      costPerClick: totalAdClicks > 0 ? Number((totalAdSpend / totalAdClicks).toFixed(2)) : 0,
      costPerLead: totalAdLeads > 0 ? Number((totalAdSpend / totalAdLeads).toFixed(2)) : 0,
      costPerAcquisition:
        totalAdConversions > 0 ? Number((totalAdSpend / totalAdConversions).toFixed(2)) : 0,
      leadToCustomerRate:
        totalAdLeads > 0 ? Number(((totalAdConversions / totalAdLeads) * 100).toFixed(2)) : 0,
    };

    const mockAdCreatives = [
      {
        platform: 'Instagram',
        format: 'Reel Ad',
        headline: 'Master React + AI in one weekend 🚀',
        copy: 'Limited seats. 15+ expert sessions. Book now for early-bird pricing.',
        cta: 'Book Tickets',
        previewImage:
          'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80',
      },
      {
        platform: 'LinkedIn',
        format: 'Sponsored Post',
        headline: 'Upskill your engineering teams in 2026',
        copy: 'Enterprise-ready workshops on cloud, AI, and system design for tech leaders.',
        cta: 'Register Teams',
        previewImage:
          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
      },
      {
        platform: 'Google Search',
        format: 'Text Ad',
        headline: 'Top Coding Events India 2026 | Book Online',
        copy: 'Explore developer bootcamps, architecture workshops and live certification tracks.',
        cta: 'Explore Events',
        previewImage:
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
      },
      {
        platform: 'Google Display',
        format: 'Banner Ad',
        headline: 'From Beginner to Architect — Skill Up Fast',
        copy: 'Join in-person and virtual learning events built for software professionals.',
        cta: 'See Schedule',
        previewImage:
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
      },
    ];

    const conversionRate = impressions > 0 ? (purchases / impressions) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          activeSubscribers,
          newSubscribers7d,
          totalCampaigns,
          conversionRate: Number(conversionRate.toFixed(2)),
          activeCampaigns: activeCampaigns || campaignTableRows.filter((campaign) => campaign.status === 'active').length,
          totalConversions,
          couponUsage,
          referralSignups,
        },
        funnel: [
          { stage: 'Impressions', value: impressions },
          { stage: 'Clicks', value: clicks },
          { stage: 'Leads', value: leads },
          { stage: 'Purchases', value: purchases },
        ],
        campaignHealth: {
          sent: campaignTotals.sent,
          opened: campaignTotals.opened,
          clicked: campaignTotals.clicked,
          converted: campaignTotals.converted,
        },
        couponPerformance,
        activeCoupons,
        couponInfographics,
        channelPerformance,
  socialAdsPerformance,
  socialPosts,
  marketingUnitEconomics,
        campaignTable: campaignTableRows,
        conversionRateTrend,
        trafficSourceBreakdown,
        campaigns: campaignsRaw,
        mockAdCreatives,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;