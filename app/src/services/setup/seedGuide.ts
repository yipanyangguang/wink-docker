import fs from "fs";
import nodePath from "path";

import { STORAGE_DIR } from "@/config/env";
import logger from "@/utils/logger";
import { topicCollection, winkListCollection } from "@/services/mongodb";
import { recordTopicInfo } from "@/services/wink/topic";
import sendWink from "@/services/wink/sendWink";

/** 引导话题名：发帖时输入这个名字会命中同一话题 */
export const GUIDE_TOPIC = "欢迎使用";

/** 引导素材随镜像打包在 app/assets/guide/，dev（src）与 dist 目录深度一致 */
const GUIDE_ASSETS_DIR = nodePath.resolve(__dirname, "../../../assets/guide");

interface IGuideMoment {
  /** 瞬间编号：1~9，即给用户看的阅读顺序 */
  no: number;
  content: string;
  /** 对应 assets/guide 下的文件名；没有图就不传 */
  asset?: string;
}

/**
 * 引导瞬间内容。数组顺序 = 实际发帖顺序（9 → 1）：
 * 首页按时间倒序（最新在最上），时间取 now - no 分钟，
 * 所以第 1 条最晚发、显示在最顶上，用户从上往下读恰好 1 → 9。
 */
const GUIDE_MOMENTS: IGuideMoment[] = [
  {
    no: 9,
    content:
      "管理员可在「管理端 → 设置」打开每日自动备份：每天凌晨导出全部数据，保留最近 7 份。想换机器？把备份文件和 uploads 目录一起拷走就能整体迁移。安心记录，数据永远在你手里。",
  },
  {
    no: 8,
    content:
      "这是全家人的相册：管理员在「个人中心 → 管理端」添加成员账号，家人登录后就有自己的头像、昵称和发布页。改头像、昵称、密码都在个人中心，人齐了才热闹。",
  },
  {
    no: 7,
    content:
      "在详情页可以生成分享链接，有效期 3 天，到期自动失效。给还没加入的家人先尝个鲜。",
  },
  {
    no: 6,
    content:
      "点开任意一条瞬间进详情页就能评论。谁发的、谁评论的，头像和昵称都在——以后翻回来，连当时想说的话一起都在。",
  },
  {
    no: 5,
    content:
      "发布时打开「修改发布时间」，就能补发上周拍的、去年发生的事。时间线会按真实时间归位，回忆不会乱。",
  },
  {
    no: 4,
    content:
      "想找某条旧动态？搜索页按关键词就能翻到旧帖；「随机回顾」会随机翻出十条旧瞬间，睡前刷一刷，常常有意外惊喜。",
  },
  {
    no: 3,
    content:
      "发布时带上话题，回忆就自动归类。「话题」页能看到所有话题，每个话题还有照片墙视图；话题支持换背景图、隐藏和恢复，适合偶尔想专程翻一翻的日子。",
    asset: "guide-3.jpg",
  },
  {
    no: 2,
    content:
      "点底部的「发布」，写点想说的，配上图片或视频都可以，视频会原样保存、不压缩。发布时输入一个新话题名，话题就自动建好了。就从今天的一顿饭、一片晚霞开始吧。",
    asset: "guide-2.jpg",
  },
  {
    no: 1,
    content:
      "这是咱们家自己的瞬间相册：照片、视频、碎碎念都记在这里，数据全在自己机器上，不依赖任何云服务。往下翻，几条动态带你把功能都过一遍。",
    asset: "guide-1.png",
  },
];

/** 把打包在镜像里的引导图复制到上传目录；失败不致命，只少图不缺文 */
const copyGuideAsset = (asset: string): string | null => {
  try {
    const source = nodePath.join(GUIDE_ASSETS_DIR, asset);
    const target = nodePath.join(STORAGE_DIR, asset);
    if (!fs.existsSync(source)) {
      logger.warn({
        title: "seedGuide",
        message: `引导素材缺失：${asset}`,
      });
      return null;
    }
    fs.copyFileSync(source, target);
    return asset;
  } catch (error) {
    logger.warn({
      title: "seedGuide",
      message: `引导图复制失败（${asset}）`,
      more: error,
    });
    return null;
  }
};

/**
 * 首次初始化时写入「欢迎使用」话题与引导瞬间。
 * initializeSystem 的初始化抢占保证这里只会被真正执行一次；
 * 内部所有失败都只记日志不抛错，不能因为引导内容把系统初始化卡死。
 */
export const seedGuideContent = async (userId: number): Promise<void> => {
  try {
    // 双保险：话题已存在说明引导内容已写过（或用户自己建了同名话题），直接跳过
    if (await topicCollection.findOne({ topic: GUIDE_TOPIC })) {
      logger.info({ title: "seedGuide", message: "话题已存在，跳过引导内容写入" });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    for (const moment of GUIDE_MOMENTS) {
      const image = moment.asset ? copyGuideAsset(moment.asset) : null;
      await sendWink({
        userId,
        content: moment.content,
        images: image ? [image] : [],
        topics: [GUIDE_TOPIC],
        // 第 no 条的时间 = now - no 分钟：编号越小越新，首页阅读顺序 1 → 9
        time: now - moment.no * 60,
      });
    }

    await recordTopicInfo(GUIDE_TOPIC);
    logger.info({
      title: "seedGuide",
      message: `引导内容写入完成：${GUIDE_MOMENTS.length} 条瞬间`,
    });
  } catch (error) {
    logger.warn({
      title: "seedGuide",
      message: "引导内容写入失败（不影响系统初始化）",
      more: error,
    });
  }
};

/** 引导内容是否已存在 */
export const hasGuideContent = async (): Promise<boolean> => {
  const [topicExists, winkCount] = await Promise.all([
    topicCollection.findOne({ topic: GUIDE_TOPIC }, { projection: { _id: 1 } }),
    winkListCollection.countDocuments({ topics: GUIDE_TOPIC }),
  ]);
  return Boolean(topicExists) || winkCount > 0;
};
